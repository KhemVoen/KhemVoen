const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8090;

// Ensure directories exist safely
['data', 'uploads/images', 'uploads/videos', 'uploads/audio'].forEach(dir => {
  try {
    const p = path.join('/tmp', dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  } catch (e) {}
  try {
    const p = path.join(__dirname, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  } catch (e) {}
});

// ===== DATA HELPERS =====
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

function readJSON(file) {
  const baseName = path.basename(file);
  const tmpFile = path.join('/tmp', 'data', baseName);
  
  // 1. Try reading from /tmp (most recent writes on Vercel)
  try {
    if (fs.existsSync(tmpFile)) {
      return JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    }
  } catch (e) {}
  
  // 2. Try reading from original repository path
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {}

  return baseName.includes('users') ? [] : { history: {}, gallery: [], videos: [], events: [] };
}

function writeJSON(file, data) {
  const baseName = path.basename(file);
  // First try writing to local directory (works locally)
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return;
  } catch (e) {}

  // If local write fails (e.g. Vercel read-only filesystem), write to /tmp
  try {
    const tmpDir = path.join('/tmp', 'data');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, baseName), JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write JSON:', e);
  }
}

// ===== INIT DEFAULT USERS =====
(async () => {
  try {
    let users = [];
    try { users = readJSON(USERS_FILE); } catch {}
    const defaults = [
      { username: 'owner', email: 'thonvisal12@gmail.com', password: 'owner123', displayName: 'ម្ចាស់វត្ត', role: 'owner' },
      { username: 'admin', email: 'admin@khemvoen.org', password: 'admin123', displayName: 'អ្នកគ្រប់គ្រង', role: 'admin' }
    ];
    let changed = false;
    for (const def of defaults) {
      let userIdx = users.findIndex(u => u.username === def.username);
      if (userIdx === -1) {
        const hash = await bcrypt.hash(def.password, 10);
        users.push({ id: uuidv4(), username: def.username, email: def.email, password: hash, displayName: def.displayName, role: def.role, createdAt: new Date().toISOString() });
        changed = true;
      } else {
        if (!users[userIdx].email) {
          users[userIdx].email = def.email;
          changed = true;
        }
        const matches = await bcrypt.compare(def.password, users[userIdx].password);
        if (!matches && !users[userIdx].password.startsWith('$2a$10$valid')) {
          users[userIdx].password = await bcrypt.hash(def.password, 10);
          changed = true;
        }
      }
    }
    if (changed || users.length === 0) writeJSON(USERS_FILE, users);
  } catch (e) {
    console.error('Default user initialization error:', e);
  }
})();

// ===== MIDDLEWARE & STATIC =====
app.use((req, res, next) => {
  if (req.url.startsWith('/khemvoen/api/')) {
    req.url = req.url.replace('/khemvoen/api/', '/api/');
  }
  next();
});

const SESSIONS_FILE = path.join(__dirname, 'data', 'sessions.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'khemvoen-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Restore sessions from file store across server restarts
app.use((req, res, next) => {
  if (req.session && !req.session.user && req.sessionID) {
    try {
      const sessions = readJSON(SESSIONS_FILE);
      if (sessions && typeof sessions === 'object' && sessions[req.sessionID]) {
        req.session.user = sessions[req.sessionID];
      }
    } catch (e) {}
  }
  next();
});

function saveSessionUser(req, user) {
  req.session.user = user;
  try {
    let sessions = readJSON(SESSIONS_FILE);
    if (typeof sessions !== 'object' || Array.isArray(sessions) || !sessions) sessions = {};
    sessions[req.sessionID] = user;
    writeJSON(SESSIONS_FILE, sessions);
  } catch (e) {}
}

function removeSessionUser(req) {
  if (req.sessionID) {
    try {
      let sessions = readJSON(SESSIONS_FILE);
      if (typeof sessions === 'object' && sessions && !Array.isArray(sessions)) {
        delete sessions[req.sessionID];
        writeJSON(SESSIONS_FILE, sessions);
      }
    } catch (e) {}
  }
}

app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('/tmp/uploads'));
app.use('/khemvoen', express.static(__dirname));
app.use('/khemvoen/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/khemvoen/uploads', express.static('/tmp/uploads'));

// Audio storage
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir('audio')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `aud-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp3|wav|ogg|m4a|aac)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only audio files are allowed'));
  }
});

app.get('/khemvoen', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/khemvoen/admin', '/khemvoen/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ===== FILE UPLOAD CONFIG =====
function getUploadDir(subfolder) {
  const localDir = path.join(__dirname, 'uploads', subfolder);
  try {
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    fs.accessSync(localDir, fs.constants.W_OK);
    return localDir;
  } catch {
    const tmpDir = path.join('/tmp', 'uploads', subfolder);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
}

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir('images')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `img-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir('videos')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `vid-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|webm|mov|avi)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  }
});

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'សូមចូលគណនីឡើងវិញ (Session Expired)' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'សូមចូលគណនីឡើងវិញ (Session Expired)' });
  if (req.session.user.role !== 'admin' && req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'គណនីរបស់អ្នកគ្មានសិទ្ធិកែប្រែទេ (Permission Denied)' });
  }
  next();
}

function requireOwner(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'សូមចូលគណនីឡើងវិញ (Session Expired)' });
  if (req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'តម្រូវឱ្យមានសិទ្ធិម្ចាស់ (Owner Required)' });
  }
  next();
}

// ===== AUTH ROUTES =====
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users.find(u =>
    (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
    (u.email && u.email.toLowerCase() === username.toLowerCase())
  );
  if (!user) return res.status(401).json({ error: 'ឈ្មោះអ្នកប្រើ/អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'ឈ្មោះអ្នកប្រើ/អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });
  
  const sessionUser = { id: user.id, username: user.username, email: user.email, displayName: user.displayName, role: user.role };
  saveSessionUser(req, sessionUser);
  res.json({ success: true, user: sessionUser });
});

app.post('/api/auth/logout', (req, res) => {
  removeSessionUser(req);
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: req.session.user });
});

// ===== CONTENT ROUTES =====
app.get('/api/content', (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!content.history) {
    content.history = {
      title: 'វត្តខេមវ័ន(បឹងស្នាយ)',
      imageUrl: 'images/buddha.png',
      content: ''
    };
  } else if (!content.history.imageUrl) {
    content.history.imageUrl = 'images/buddha.png';
  }
  if (!content.stats || !Array.isArray(content.stats)) {
    content.stats = [
      { id: 'stat-1', count: 50, label: 'ឆ្នាំប្រវត្តិ' },
      { id: 'stat-2', count: 15, label: 'ព្រះសង្ឃ' },
      { id: 'stat-3', count: 1000, label: 'ប្រជាពលរដ្ឋ' }
    ];
  }
  if (!content.contact) {
    content.contact = {
      phone: '012 345 678',
      email: 'info@khemvoen.org',
      location: 'សង្កាត់បូរមាស ក្រុងកំពង់ចាម ខេត្តកំពង់ចាម',
      facebook: 'https://facebook.com',
      telegram: 'https://t.me'
    };
  }
  if (!Array.isArray(content.playlists)) {
    content.playlists = [];
  }
  if (!Array.isArray(content.counselors)) {
    content.counselors = [
      {
        id: 'counselor-1',
        name: 'ព្រះមហាវីរៈ សុខា',
        title: 'ព្រះចៅអធិការវត្ត / អ្នកប្រឹក្សាយោបល់ធម៌',
        image: 'images/hero.png',
        phone: '012 345 678',
        facebook: 'https://facebook.com',
        telegram: 'https://t.me'
      },
      {
        id: 'counselor-2',
        name: 'លោកគ្រូ សុភ័ក្ត្រ',
        title: 'អ្នកប្រឹក្សាយោបល់ជីវិត និងធម៌អាថ៌',
        image: 'images/buddha.png',
        phone: '010 888 999',
        facebook: 'https://facebook.com',
        telegram: 'https://t.me'
      }
    ];
  }
  if (!Array.isArray(content.committee) || content.committee.length === 0) {
    content.committee = [
      { id: "p1", category: "achar", group: "ព្រឹទ្ធាចារ្យ", level: 1, name: "សាន សន", role: "ព្រឹទ្ធាចារ្យ", age: 77, phone: "097 777 888", carrier: "metfone" },
      { id: "a1", category: "achar", group: "អាចារ្យ", level: 1, name: "យោធា លាងហូ", role: "អាចារ្យធំ", age: 75, phone: "012 858 080", carrier: "cellcard" },
      { id: "a2", category: "achar", group: "អាចារ្យ", level: 2, name: "អៀង ហេង", role: "អាចារ្យរងទី១", age: 62, phone: "097 777 800", carrier: "metfone" },
      { id: "a3", category: "achar", group: "អាចារ្យ", level: 2, name: "ស៊ាន គង់", role: "អាចារ្យរងទី២", age: 65, phone: "097 888 800", carrier: "metfone" },
      { id: "a4", category: "achar", group: "អាចារ្យ", level: 2, name: "ឡេង មុនីសេដ្ឋា", role: "អាចារ្យរងទី៣", age: 38, phone: "097 999 444", carrier: "metfone" },
      { id: "a5", category: "achar", group: "អាចារ្យ", level: 3, name: "ជឹម ថុល", role: "អាចារ្យរង", age: 62, phone: "097 555 444", carrier: "metfone" },
      { id: "a6", category: "achar", group: "អាចារ្យ", level: 3, name: "ឈួន ឈុំ", role: "អាចារ្យរង", age: 74, phone: "088 111 222", carrier: "metfone" },
      { id: "a7", category: "achar", group: "អាចារ្យ", level: 3, name: "ស៊ីង សិាម", role: "អាចារ្យរង", age: 75, phone: "097 333 222", carrier: "metfone" },
      { id: "a8", category: "achar", group: "អាចារ្យ", level: 3, name: "ជួន ចាន់", role: "អាចារ្យរង", age: 64, phone: "016 888 777", carrier: "smart" },
      { id: "a9", category: "achar", group: "អាចារ្យ", level: 3, name: "អ៊ិន ភឿន", role: "អាចារ្យរង", age: 74, phone: "097 444 333", carrier: "metfone" },
      { id: "a10", category: "achar", group: "អាចារ្យ", level: 3, name: "សែត ផេង", role: "អាចារ្យរង", age: 73, phone: "012 333 555", carrier: "cellcard" },
      { id: "a11", category: "achar", group: "អាចារ្យ", level: 3, name: "គឹម ធឿន", role: "អាចារ្យរង", age: 85, phone: "097 222 111", carrier: "metfone" },
      { id: "a12", category: "achar", group: "អាចារ្យ", level: 3, name: "អ៊ិន សុផា", role: "អាចារ្យរង", age: 58, phone: "070 999 888", carrier: "smart" },
      { id: "a13", category: "achar", group: "អាចារ្យ", level: 3, name: "កើត សាយ", role: "អាចារ្យរង", age: 72, phone: "097 666 555", carrier: "metfone" },
      { id: "c1", category: "committee", group: "គណៈកម្មការ", level: 1, name: "ជួន សារ៉ាន", role: "ប្រធានគណៈកម្មការ", age: 70, phone: "012 858 080", carrier: "cellcard" },
      { id: "c2", category: "committee", group: "គណៈកម្មការ", level: 2, name: "ហង្ស ប៊ុនផល", role: "អនុប្រធាន", age: 65, phone: "097 777 888", carrier: "metfone" },
      { id: "c3", category: "committee", group: "គណៈកម្មការ", level: 2, name: "ជិន ចិន", role: "អនុប្រធាន", age: 70, phone: "016 888 777", carrier: "smart" },
      { id: "c4", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ព្រុំ សុខលីម", role: "សមាជិកា", age: 63, phone: "097 555 444", carrier: "metfone" },
      { id: "c5", category: "committee", group: "គណៈកម្មការ", level: 3, name: "មេ សៀម", role: "សមាជិក", age: 69, phone: "012 333 222", carrier: "cellcard" },
      { id: "c6", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ឡុង ប៊ុន", role: "សមាជិក", age: 63, phone: "088 111 222", carrier: "metfone" },
      { id: "c7", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ហេង ស្រី", role: "សមាជិកា", age: 27, phone: "096 888 999", carrier: "smart" },
      { id: "c8", category: "committee", group: "គណៈកម្មការ", level: 3, name: "បុល សុខភា", role: "សមាជិក", age: 43, phone: "097 123 456", carrier: "metfone" },
      { id: "c9", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ផល កឿន", role: "សមាជិក", age: 25, phone: "070 333 444", carrier: "smart" },
      { id: "c10", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ភិក ឈុន", role: "សមាជិក", age: 69, phone: "097 654 321", carrier: "metfone" },
      { id: "c11", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ស៊ាម ម៉េង", role: "សមាជិក", age: 66, phone: "012 987 654", carrier: "cellcard" },
      { id: "c12", category: "committee", group: "គណៈកម្មការ", level: 3, name: "កែវ សន", role: "សមាជិកា", age: 68, phone: "088 777 666", carrier: "metfone" },
      { id: "c13", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ចាប ចាន់ថា", role: "សមាជិកា", age: 55, phone: "097 888 111", carrier: "metfone" },
      { id: "c14", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ហួង សុកី", role: "សមាជិកា", age: 54, phone: "016 555 444", carrier: "smart" },
      { id: "c15", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ទ្រី នី", role: "សមាជិកា", age: 67, phone: "097 222 333", carrier: "metfone" },
      { id: "c16", category: "committee", group: "គណៈកម្មការ", level: 3, name: "វ៉ាយ គឹមយាន", role: "សមាជិកា", age: 26, phone: "070 111 222", carrier: "smart" },
      { id: "c17", category: "committee", group: "គណៈកម្មការ", level: 3, name: "ដួ័រ ផន់សិាន", role: "សមាជិក", age: 59, phone: "012 444 555", carrier: "cellcard" }
    ];
  }
  res.json(content);
});

app.put('/api/content/history', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  content.history = { ...(content.history || {}), ...req.body, updatedAt: new Date().toISOString() };
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, history: content.history });
});

app.put('/api/hero-slides', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(req.body.slides)) {
    return res.status(400).json({ error: 'Invalid hero slides data' });
  }
  content.heroSlides = req.body.slides;
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, heroSlides: content.heroSlides });
});

app.put('/api/content/stats', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(req.body.stats)) {
    return res.status(400).json({ error: 'Invalid stats data' });
  }
  content.stats = req.body.stats;
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, stats: content.stats });
});

app.put('/api/content/contact', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  content.contact = { ...content.contact, ...req.body };
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, contact: content.contact });
});

app.put('/api/content/orgtree', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  content.orgTree = req.body.orgTree;
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, orgTree: content.orgTree });
});

// ===== GALLERY ROUTES =====
app.post('/api/gallery', requireAdmin, uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const content = readJSON(CONTENT_FILE);
  const entry = {
    id: uuidv4(),
    filename: req.file.filename,
    url: `/uploads/images/${req.file.filename}`,
    caption: req.body.caption || '',
    uploadedBy: req.session.user.username,
    uploadedAt: new Date().toISOString()
  };
  content.gallery.push(entry);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, entry });
});

app.delete('/api/gallery/:id', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  const idx = content.gallery.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const item = content.gallery[idx];
  const filepath = path.join(__dirname, 'uploads', 'images', item.filename);
  if (fs.existsSync(filepath)) {
    try { fs.unlinkSync(filepath); } catch (e) {}
  }
  content.gallery.splice(idx, 1);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true });
});

// ===== VIDEO ROUTES =====
app.post('/api/videos', requireAdmin, uploadVideo.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
  const content = readJSON(CONTENT_FILE);
  const entry = {
    id: uuidv4(),
    filename: req.file.filename,
    url: `/uploads/videos/${req.file.filename}`,
    title: req.body.title || '',
    description: req.body.description || '',
    uploadedBy: req.session.user.username,
    uploadedAt: new Date().toISOString()
  };
  content.videos.push(entry);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, entry });
});

app.delete('/api/videos/:id', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  const idx = content.videos.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const item = content.videos[idx];
  const filepath = path.join(__dirname, 'uploads', 'videos', item.filename);
  if (fs.existsSync(filepath)) {
    try { fs.unlinkSync(filepath); } catch (e) {}
  }
  content.videos.splice(idx, 1);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true });
});

// ===== EVENTS ROUTES =====
app.post('/api/events', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  const entry = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  content.events.push(entry);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, entry });
});

app.delete('/api/events/:id', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  content.events = content.events.filter(e => e.id !== req.params.id);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true });
});

// ===== PLAYLIST ROUTES =====
app.get('/api/playlists', (req, res) => {
  const content = readJSON(CONTENT_FILE);
  let playlists = content.playlists || [];
  if (req.query.category) {
    playlists = playlists.filter(p => p.category === req.query.category);
  }
  res.json(playlists);
});

app.post('/api/playlists', requireAdmin, uploadImage.single('coverImage'), (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.playlists)) content.playlists = [];
  const playlist = {
    id: uuidv4(),
    category: req.body.category || 'dhamma-teachings',
    title: req.body.title || '',
    description: req.body.description || '',
    coverImage: req.file ? `/uploads/images/${req.file.filename}` : (req.body.coverImage || ''),
    items: [],
    createdAt: new Date().toISOString()
  };
  content.playlists.push(playlist);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, playlist });
});

app.put('/api/playlists/:id', requireAdmin, uploadImage.single('coverImage'), (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.playlists)) return res.status(404).json({ error: 'Not found' });
  const idx = content.playlists.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Playlist not found' });
  const pl = content.playlists[idx];
  pl.title = req.body.title || pl.title;
  pl.description = req.body.description || pl.description;
  pl.category = req.body.category || pl.category;
  if (req.file) pl.coverImage = `/uploads/images/${req.file.filename}`;
  else if (req.body.coverImage) pl.coverImage = req.body.coverImage;
  pl.updatedAt = new Date().toISOString();
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, playlist: pl });
});

app.delete('/api/playlists/:id', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.playlists)) return res.status(404).json({ error: 'Not found' });
  content.playlists = content.playlists.filter(p => p.id !== req.params.id);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true });
});

app.post('/api/playlists/:id/items', requireAdmin, uploadAudio.single('audioFile'), (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.playlists)) return res.status(404).json({ error: 'Not found' });
  const pl = content.playlists.find(p => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Playlist not found' });
  const item = {
    id: uuidv4(),
    type: req.body.type || 'video',
    title: req.body.title || '',
    description: req.body.description || '',
    url: req.file ? `/uploads/audio/${req.file.filename}` : (req.body.url || ''),
    content: req.body.content || '',
    createdAt: new Date().toISOString()
  };
  pl.items.push(item);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, item });
});

app.delete('/api/playlists/:id/items/:itemId', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.playlists)) return res.status(404).json({ error: 'Not found' });
  const pl = content.playlists.find(p => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Playlist not found' });
  pl.items = pl.items.filter(i => i.id !== req.params.itemId);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true });
});

// ===== COUNSELOR ROUTES =====
app.get('/api/counselors', (req, res) => {
  const content = readJSON(CONTENT_FILE);
  res.json(content.counselors || []);
});

app.post('/api/counselors', requireAdmin, uploadImage.single('image'), (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.counselors)) content.counselors = [];
  
  if (!req.body.name || !req.body.name.trim()) {
    return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះអ្នកប្រឹក្សាយោបល់' });
  }

  const counselor = {
    id: uuidv4(),
    name: req.body.name.trim(),
    title: req.body.title ? req.body.title.trim() : '',
    image: req.file ? `/uploads/images/${req.file.filename}` : (req.body.image || 'logo.png'),
    phone: req.body.phone ? req.body.phone.trim() : '',
    facebook: req.body.facebook ? req.body.facebook.trim() : '',
    telegram: req.body.telegram ? req.body.telegram.trim() : '',
    createdAt: new Date().toISOString()
  };
  content.counselors.push(counselor);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, counselor });
});

app.put('/api/counselors/:id', requireAdmin, uploadImage.single('image'), (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.counselors)) return res.status(404).json({ error: 'រកមិនឃើញទិន្នន័យ' });
  const idx = content.counselors.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'រកមិនឃើញអ្នកប្រឹក្សាយោបល់នេះទេ' });

  if (req.body.name !== undefined && !req.body.name.trim()) {
    return res.status(400).json({ error: 'ឈ្មោះអ្នកប្រឹក្សាយោបល់មិនអាចទទេបានទេ' });
  }

  const item = content.counselors[idx];
  if (req.body.name) item.name = req.body.name.trim();
  if (req.body.title !== undefined) item.title = req.body.title.trim();
  if (req.body.phone !== undefined) item.phone = req.body.phone.trim();
  if (req.body.facebook !== undefined) item.facebook = req.body.facebook.trim();
  if (req.body.telegram !== undefined) item.telegram = req.body.telegram.trim();
  if (req.file) item.image = `/uploads/images/${req.file.filename}`;
  else if (req.body.image) item.image = req.body.image;
  item.updatedAt = new Date().toISOString();
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, counselor: item });
});

app.delete('/api/counselors/:id', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.counselors)) return res.status(404).json({ error: 'រកមិនឃើញទិន្នន័យ' });
  content.counselors = content.counselors.filter(c => c.id !== req.params.id);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true });
});

// ===== COMMITTEE ROUTES (គណៈគ្រប់គ្រង) =====
app.get('/api/committee', (req, res) => {
  const content = readJSON(CONTENT_FILE);
  let committee = content.committee || [];
  if (req.query.category) {
    committee = committee.filter(c => c.category === req.query.category);
  }
  res.json(committee);
});

app.post('/api/committee', requireAdmin, uploadImage.single('image'), (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.committee)) content.committee = [];
  
  if (!req.body.name || !req.body.name.trim()) {
    return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះសមាជិក' });
  }

  const member = {
    id: uuidv4(),
    category: req.body.category === 'layperson' ? 'layperson' : 'monk',
    roleRank: req.body.roleRank ? req.body.roleRank.trim() : 'root',
    name: req.body.name.trim(),
    title: req.body.title ? req.body.title.trim() : '',
    image: req.file ? `/uploads/images/${req.file.filename}` : (req.body.image || 'logo.png'),
    phone: req.body.phone ? req.body.phone.trim() : '',
    facebook: req.body.facebook ? req.body.facebook.trim() : '',
    telegram: req.body.telegram ? req.body.telegram.trim() : '',
    createdAt: new Date().toISOString()
  };
  content.committee.push(member);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, member });
});

app.put('/api/committee/:id', requireAdmin, uploadImage.single('image'), (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.committee)) return res.status(404).json({ error: 'រកមិនឃើញទិន្នន័យ' });
  const idx = content.committee.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'រកមិនឃើញសមាជិកនេះទេ' });

  if (req.body.name !== undefined && !req.body.name.trim()) {
    return res.status(400).json({ error: 'ឈ្មោះមិនអាចទទេបានទេ' });
  }

  const item = content.committee[idx];
  if (req.body.category) item.category = req.body.category === 'layperson' ? 'layperson' : 'monk';
  if (req.body.roleRank !== undefined) item.roleRank = req.body.roleRank.trim();
  if (req.body.name) item.name = req.body.name.trim();
  if (req.body.title !== undefined) item.title = req.body.title.trim();
  if (req.body.phone !== undefined) item.phone = req.body.phone.trim();
  if (req.body.facebook !== undefined) item.facebook = req.body.facebook.trim();
  if (req.body.telegram !== undefined) item.telegram = req.body.telegram.trim();
  if (req.file) item.image = `/uploads/images/${req.file.filename}`;
  else if (req.body.image) item.image = req.body.image;
  item.updatedAt = new Date().toISOString();
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true, member: item });
});

app.delete('/api/committee/:id', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  if (!Array.isArray(content.committee)) return res.status(404).json({ error: 'រកមិនឃើញទិន្នន័យ' });
  content.committee = content.committee.filter(c => c.id !== req.params.id);
  writeJSON(CONTENT_FILE, content);
  res.json({ success: true });
});

// ===== USER MANAGEMENT (OWNER ONLY) =====
app.get('/api/users', requireOwner, (req, res) => {
  const users = readJSON(USERS_FILE).map(u => ({
    id: u.id, username: u.username, email: u.email || '', displayName: u.displayName, role: u.role, createdAt: u.createdAt
  }));
  res.json(users);
});

app.post('/api/users', requireOwner, async (req, res) => {
  const { username, email, password, displayName, role } = req.body;
  if ((!username && !email) || !password) {
    return res.status(400).json({ error: 'សូមបញ្ចូលអ៊ីមែល/ឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់' });
  }
  if (role === 'owner') return res.status(403).json({ error: 'មិនអាចបង្កើតម្ចាស់បន្ថែមបានទេ' });

  const finalEmail = email ? email.trim() : '';
  const finalUsername = username ? username.trim() : (finalEmail ? finalEmail.split('@')[0] : '');

  const users = readJSON(USERS_FILE);
  if (finalEmail && users.find(u => u.email && u.email.toLowerCase() === finalEmail.toLowerCase())) {
    return res.status(409).json({ error: 'អ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ' });
  }
  if (finalUsername && users.find(u => u.username && u.username.toLowerCase() === finalUsername.toLowerCase())) {
    return res.status(409).json({ error: 'ឈ្មោះអ្នកប្រើនេះមានក្នុងប្រព័ន្ធរួចហើយ' });
  }

  const hash = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    username: finalUsername,
    email: finalEmail,
    password: hash,
    displayName: displayName || finalUsername || finalEmail,
    role: role || 'admin',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  res.json({ success: true, user: { id: newUser.id, username: newUser.username, email: newUser.email, displayName: newUser.displayName, role: newUser.role } });
});

app.delete('/api/users/:id', requireOwner, (req, res) => {
  let users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'owner') return res.status(403).json({ error: 'Cannot delete owner' });
  users = users.filter(u => u.id !== req.params.id);
  writeJSON(USERS_FILE, users);
  res.json({ success: true });
});

app.put('/api/users/:id/password', requireOwner, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.password = await bcrypt.hash(password, 10);
  writeJSON(USERS_FILE, users);
  res.json({ success: true });
});

// ===== USER REDIRECT =====
app.get(['/users.html', '/users'], (req, res) => {
  res.redirect('/admin.html');
});

// ===== START / EXPORT =====
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🪷  វត្តខេមវ័ន(បឹងស្នាយ) Server running on port ${PORT}`);
  });
}

module.exports = app;
