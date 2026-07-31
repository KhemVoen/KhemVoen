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
['data', 'uploads/images', 'uploads/videos'].forEach(dir => {
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'khemvoen-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('/tmp/uploads'));
app.use('/khemvoen', express.static(__dirname));
app.use('/khemvoen/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/khemvoen/uploads', express.static('/tmp/uploads'));

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
  if (!req.session.user) return res.status(401).json({ error: 'មិនទាន់ចូលគណនី' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'មិនទាន់ចូលគណនី' });
  if (req.session.user.role !== 'admin' && req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'គ្មានសិទ្ធិ' });
  }
  next();
}

function requireOwner(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'មិនទាន់ចូលគណនី' });
  if (req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'តម្រូវឱ្យមានសិទ្ធិម្ចាស់' });
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
  req.session.user = { id: user.id, username: user.username, email: user.email, displayName: user.displayName, role: user.role };
  res.json({ success: true, user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: req.session.user });
});

// ===== CONTENT ROUTES =====
app.get('/api/content', (req, res) => {
  res.json(readJSON(CONTENT_FILE));
});

app.put('/api/content/history', requireAdmin, (req, res) => {
  const content = readJSON(CONTENT_FILE);
  content.history = { ...req.body, updatedAt: new Date().toISOString() };
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
