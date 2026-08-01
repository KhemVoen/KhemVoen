// ===== STATE =====
let currentUser = null;
let contentData = null;
let selectedImageFile = null;
let selectedVideoFile = null;

// ===== DOM REFS =====
const $ = id => document.getElementById(id);

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  // Check if already logged in
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      showDashboard();
    }
  } catch (e) { /* not logged in */ }

  setupEventListeners();
});

// ===== AUTH =====
function setupEventListeners() {
  // Login
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        currentUser = data.user;
        showDashboard();
      } else {
        $('loginError').textContent = data.error;
        $('loginError').classList.add('show');
      }
    } catch (err) {
      $('loginError').textContent = 'កំហុសក្នុងការតភ្ជាប់';
      $('loginError').classList.add('show');
    }
  });

  // Logout
  $('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    contentData = null;
    if ($('usersTableBody')) $('usersTableBody').innerHTML = '';
    switchTab('overview');
    $('loginPage').style.display = '';
    $('dashboard').classList.remove('active');
    $('loginUsername').value = '';
    $('loginPassword').value = '';
    $('loginError').classList.remove('show');
  });

  // Sidebar nav delegation
  document.querySelector('.sidebar-nav').addEventListener('click', (e) => {
    const link = e.target.closest('a[data-tab]');
    if (link) {
      e.preventDefault();
      const tab = link.dataset.tab;
      switchTab(tab);
    }
  });


  // Mobile toggle
  $('mobileToggle')?.addEventListener('click', () => {
    $('sidebar').classList.toggle('open');
  });

  // History save
  $('saveHistoryBtn').addEventListener('click', saveHistory);
  $('saveStatsBtn')?.addEventListener('click', saveStats);
  $('saveContactBtn')?.addEventListener('click', saveContact);

  // Hero slides save & add slide
  $('addHeroSlideBtn')?.addEventListener('click', addHeroSlide);
  $('saveHeroSlidesBtn')?.addEventListener('click', saveHeroSlides);

  // Image upload zone
  const imgZone = $('imageUploadZone');
  const imgInput = $('imageFileInput');
  imgZone.addEventListener('click', () => imgInput.click());
  imgZone.addEventListener('dragover', (e) => { e.preventDefault(); imgZone.classList.add('dragover'); });
  imgZone.addEventListener('dragleave', () => imgZone.classList.remove('dragover'));
  imgZone.addEventListener('drop', (e) => {
    e.preventDefault();
    imgZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      selectedImageFile = e.dataTransfer.files[0];
      imgZone.querySelector('p').textContent = selectedImageFile.name;
      $('uploadImageBtn').disabled = false;
    }
  });
  imgInput.addEventListener('change', () => {
    if (imgInput.files.length) {
      selectedImageFile = imgInput.files[0];
      imgZone.querySelector('p').textContent = selectedImageFile.name;
      $('uploadImageBtn').disabled = false;
    }
  });
  $('uploadImageBtn').addEventListener('click', uploadImage);

  // Video upload zone
  const vidZone = $('videoUploadZone');
  const vidInput = $('videoFileInput');
  vidZone.addEventListener('click', () => vidInput.click());
  vidZone.addEventListener('dragover', (e) => { e.preventDefault(); vidZone.classList.add('dragover'); });
  vidZone.addEventListener('dragleave', () => vidZone.classList.remove('dragover'));
  vidZone.addEventListener('drop', (e) => {
    e.preventDefault();
    vidZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      selectedVideoFile = e.dataTransfer.files[0];
      vidZone.querySelector('p').textContent = selectedVideoFile.name;
      $('uploadVideoBtn').disabled = false;
    }
  });
  vidInput.addEventListener('change', () => {
    if (vidInput.files.length) {
      selectedVideoFile = vidInput.files[0];
      vidZone.querySelector('p').textContent = selectedVideoFile.name;
      $('uploadVideoBtn').disabled = false;
    }
  });
  $('uploadVideoBtn').addEventListener('click', uploadVideo);

  // Add event
  $('addEventBtn').addEventListener('click', () => openModal('eventModal'));
  $('saveEventBtn').addEventListener('click', saveEvent);

  // Add user
  $('addUserBtn').addEventListener('click', () => openModal('userModal'));
  $('saveUserBtn').addEventListener('click', saveUser);
}

// ===== DASHBOARD =====
function showDashboard() {
  $('loginPage').style.display = 'none';
  $('dashboard').classList.add('active');

  // Update sidebar user info
  $('userName').textContent = currentUser.displayName;
  $('userRole').textContent = currentUser.role === 'owner' ? 'ម្ចាស់វត្ត' : 'អ្នកគ្រប់គ្រង';
  $('userAvatar').textContent = currentUser.displayName.charAt(0);

  // Show users tab for owner only, hide for admin
  const isOwner = currentUser.role === 'owner';
  $('usersNavItem').style.display = isOwner ? '' : 'none';
  if (!isOwner && $('usersTableBody')) $('usersTableBody').innerHTML = '';

  switchTab('overview');
  loadContent();
}

function switchTab(tab) {
  // Prevent admin from accessing users tab
  if (tab === 'users' && currentUser?.role !== 'owner') {
    tab = 'overview';
  }

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  $(`tab-${tab}`).classList.add('active');
  const navLink = document.querySelector(`.sidebar-nav a[data-tab="${tab}"]`);
  if (navLink) navLink.classList.add('active');

  // Close mobile sidebar
  $('sidebar').classList.remove('open');
}


// ===== LOAD CONTENT =====
async function loadContent() {
  try {
    const res = await fetch('/api/content');
    contentData = await res.json();
    renderStats();
    renderHistory();
    renderContact();
    renderHeroSlides();
    renderGallery();
    renderVideos();
    renderEvents();
    if (currentUser.role === 'owner') loadUsers();
  } catch (err) {
    showToast('កំហុសក្នុងការផ្ទុកទិន្នន័យ', 'error');
  }
}

function renderStats() {
  $('statImages').textContent = contentData.gallery?.length || 0;
  $('statVideos').textContent = contentData.videos?.length || 0;
  $('statEvents').textContent = contentData.events?.length || 0;
}

// ===== HISTORY & STATS =====
function renderHistory() {
  if (contentData.history) {
    $('historyTitle').value = contentData.history.title || '';
    $('historyContent').value = contentData.history.content || '';
  }
  if (contentData.stats && Array.isArray(contentData.stats)) {
    if (contentData.stats[0] && $('stat1Value')) {
      $('stat1Value').value = contentData.stats[0].count ?? 50;
      $('stat1Label').value = contentData.stats[0].label || '';
    }
    if (contentData.stats[1] && $('stat2Value')) {
      $('stat2Value').value = contentData.stats[1].count ?? 15;
      $('stat2Label').value = contentData.stats[1].label || '';
    }
    if (contentData.stats[2] && $('stat3Value')) {
      $('stat3Value').value = contentData.stats[2].count ?? 1000;
      $('stat3Label').value = contentData.stats[2].label || '';
    }
  }
}

async function saveHistory() {
  try {
    const res = await fetch('/api/content/history', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: $('historyTitle').value,
        content: $('historyContent').value
      })
    });
    if (res.ok) {
      showToast('រក្សាទុកបានជោគជ័យ!', 'success');
    } else {
      const data = await res.json();
      showToast(data.error || 'កំហុស', 'error');
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

async function saveStats() {
  try {
    const stats = [
      { id: 'stat-1', count: parseInt($('stat1Value').value) || 0, label: $('stat1Label').value },
      { id: 'stat-2', count: parseInt($('stat2Value').value) || 0, label: $('stat2Label').value },
      { id: 'stat-3', count: parseInt($('stat3Value').value) || 0, label: $('stat3Label').value }
    ];
    const res = await fetch('/api/content/stats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats })
    });
    if (res.ok) {
      showToast('រក្សាទុកស្ថិតិបានជោគជ័យ!', 'success');
      contentData.stats = stats;
    } else {
      const data = await res.json();
      showToast(data.error || 'កំហុស', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការរក្សាទុក', 'error');
  }
}

// ===== CONTACT & SETTINGS =====
function renderContact() {
  if (contentData.contact) {
    if ($('contactPhone')) $('contactPhone').value = contentData.contact.phone || '';
    if ($('contactEmail')) $('contactEmail').value = contentData.contact.email || '';
    if ($('contactLocation')) $('contactLocation').value = contentData.contact.location || '';
    if ($('contactFacebook')) $('contactFacebook').value = contentData.contact.facebook || '';
    if ($('contactTelegram')) $('contactTelegram').value = contentData.contact.telegram || '';
  }
}

async function saveContact() {
  try {
    const contactData = {
      phone: $('contactPhone').value,
      email: $('contactEmail').value,
      location: $('contactLocation').value,
      facebook: $('contactFacebook').value,
      telegram: $('contactTelegram').value
    };
    const res = await fetch('/api/content/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });
    if (res.ok) {
      showToast('រក្សាទុកព័ត៌មានទំនាក់ទំនងបានជោគជ័យ!', 'success');
      contentData.contact = contactData;
    } else {
      const data = await res.json();
      showToast(data.error || 'កំហុស', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការរក្សាទុក', 'error');
  }
}

// ===== HERO SLIDES =====
function renderHeroSlides() {
  const container = $('heroSlidesContainer');
  if (!container || !contentData) return;

  const slides = contentData.heroSlides || [];
  if (slides.length === 0) {
    container.innerHTML = `<p style="color:var(--text-light);text-align:center;padding:20px;">មិនទាន់មានស្លាយទេ។ ចុចប៊ូតុងខាងលើដើម្បីបន្ថែមស្លាយថ្មី។</p>`;
    return;
  }

  container.innerHTML = slides.map((s, idx) => `
    <div class="hero-slide-card" data-idx="${idx}" style="background:var(--bg);padding:20px;border-radius:8px;margin-bottom:20px;border:1px solid #eee;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <h3 style="color:var(--primary);margin:0;">🖼️ ស្លាយទី ${idx + 1} (Slide ${idx + 1})</h3>
        ${slides.length > 1 ? `<button class="btn btn-danger btn-sm" onclick="deleteHeroSlide(${idx})" title="លុបស្លាយ">🗑️ លុប</button>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:20px;">
        <div>
          <img id="heroPreview_${idx}" src="${s.imageUrl || 'images/hero.png'}" style="width:100%;height:150px;object-fit:cover;border-radius:6px;margin-bottom:10px;border:1px solid #ccc;">
          <input type="file" id="heroFile_${idx}" accept="image/*" style="font-size:12px;" onchange="previewHeroImage(${idx}, this)">
        </div>
        <div>
          <div style="margin-bottom:12px;display:flex;align-items:center;gap:10px;">
            <input type="checkbox" id="heroShowText_${idx}" ${s.showText !== false ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
            <label for="heroShowText_${idx}" style="font-weight:600;cursor:pointer;">បង្ហាញអត្ថបទលើរូបភាព (Show Accompanying Text)</label>
          </div>
          <div class="form-group" style="margin-bottom:10px;">
            <label style="font-size:13px;">ចំណងជើង (Title)</label>
            <input type="text" id="heroTitle_${idx}" value="${(s.title || '').replace(/"/g, '&quot;')}" placeholder="ចំណងជើងស្លាយ">
          </div>
          <div class="form-group" style="margin-bottom:10px;">
            <label style="font-size:13px;">ការពិពណ៌នា (Description)</label>
            <textarea id="heroDesc_${idx}" rows="2" placeholder="ការពិពណ៌នាស្លាយ...">${s.description || ''}</textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group" style="margin:0;">
              <label style="font-size:13px;">អត្ថបទប៊ូតុង</label>
              <input type="text" id="heroBtnText_${idx}" value="${(s.buttonText || '').replace(/"/g, '&quot;')}" placeholder="ស្វែងយល់បន្ថែម →">
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size:13px;">តំណភ្ជាប់ប៊ូតុង</label>
              <input type="text" id="heroBtnLink_${idx}" value="${(s.buttonLink || '').replace(/"/g, '&quot;')}" placeholder="#about">
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function previewHeroImage(idx, input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = $(`heroPreview_${idx}`);
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function addHeroSlide() {
  if (!contentData.heroSlides) contentData.heroSlides = [];
  const num = contentData.heroSlides.length + 1;
  contentData.heroSlides.push({
    id: `slide-${Date.now()}`,
    imageUrl: 'images/hero.png',
    showText: true,
    title: `ចំណងជើងស្លាយទី ${num}`,
    description: `ការពិពណ៌នាស្លាយទី ${num}...`,
    buttonText: 'ស្វែងយល់បន្ថែម →',
    buttonLink: '#about'
  });
  renderHeroSlides();
}

function deleteHeroSlide(idx) {
  if (!confirm(`តើអ្នកពិតជាចង់លុបស្លាយទី ${idx + 1} នេះ?`)) return;
  contentData.heroSlides.splice(idx, 1);
  renderHeroSlides();
}

async function uploadHeroImage(file) {
  const form = new FormData();
  form.append('image', file);
  form.append('caption', 'Hero Slide');
  const res = await fetch('/api/gallery', { method: 'POST', body: form });
  if (res.ok) {
    const data = await res.json();
    return data.entry.url;
  }
  return null;
}

async function saveHeroSlides() {
  const container = $('heroSlidesContainer');
  const slideCards = container.querySelectorAll('.hero-slide-card');
  const slides = [];

  for (let idx = 0; idx < slideCards.length; idx++) {
    const fileInput = $(`heroFile_${idx}`);
    let imageUrl = $(`heroPreview_${idx}`).src;
    
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const uploadedUrl = await uploadHeroImage(fileInput.files[0]);
      if (uploadedUrl) imageUrl = uploadedUrl;
    } else {
      try {
        const parsed = new URL(imageUrl);
        imageUrl = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
      } catch (e) {
        // already relative
      }
    }

    slides.push({
      id: contentData.heroSlides[idx]?.id || `slide-${idx + 1}`,
      imageUrl: imageUrl,
      showText: $(`heroShowText_${idx}`).checked,
      title: $(`heroTitle_${idx}`).value,
      description: $(`heroDesc_${idx}`).value,
      buttonText: $(`heroBtnText_${idx}`).value,
      buttonLink: $(`heroBtnLink_${idx}`).value
    });
  }

  try {
    const res = await fetch('/api/hero-slides', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides })
    });
    if (res.ok) {
      showToast('រក្សាទុក Hero Slides បានជោគជ័យ!', 'success');
      loadContent();
    } else {
      const data = await res.json();
      showToast(data.error || 'កំហុស', 'error');
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

// ===== GALLERY =====
function renderGallery() {
  const grid = $('galleryGrid');
  const noMsg = $('noImages');
  const items = contentData.gallery || [];

  if (!items.length) {
    grid.innerHTML = '';
    noMsg.style.display = '';
    return;
  }

  noMsg.style.display = 'none';
  grid.innerHTML = items.map(item => `
    <div class="file-card">
      <img src="${item.url}" alt="${item.caption}" loading="lazy">
      <div class="info">
        <div class="caption">${item.caption || 'រូបភាព'}</div>
        <div class="meta">${new Date(item.uploadedAt).toLocaleDateString('km-KH')}</div>
      </div>
      <button class="delete-btn" onclick="deleteGalleryItem('${item.id}')" title="លុប">×</button>
    </div>
  `).join('');
}

async function uploadImage() {
  if (!selectedImageFile) return;
  const form = new FormData();
  form.append('image', selectedImageFile);
  form.append('caption', $('imageCaption').value);

  const progress = $('imageProgress');
  progress.classList.add('show');
  progress.querySelector('.bar').style.width = '50%';

  try {
    const res = await fetch('/api/gallery', { method: 'POST', body: form });
    progress.querySelector('.bar').style.width = '100%';
    if (res.ok) {
      showToast('បញ្ចូលរូបភាពបានជោគជ័យ!', 'success');
      selectedImageFile = null;
      $('imageCaption').value = '';
      $('imageUploadZone').querySelector('p').textContent = 'ចុច ឬអូសរូបភាពមកទីនេះ';
      $('uploadImageBtn').disabled = true;
      $('imageFileInput').value = '';
      loadContent();
    } else {
      const data = await res.json();
      showToast(data.error || 'កំហុស', 'error');
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
  setTimeout(() => { progress.classList.remove('show'); progress.querySelector('.bar').style.width = '0'; }, 1000);
}

async function deleteGalleryItem(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុបរូបភាពនេះ?')) return;
  try {
    const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបបានជោគជ័យ', 'success');
      loadContent();
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

// ===== VIDEOS =====
function renderVideos() {
  const grid = $('videosGrid');
  const noMsg = $('noVideos');
  const items = contentData.videos || [];

  if (!items.length) {
    grid.innerHTML = '';
    noMsg.style.display = '';
    return;
  }

  noMsg.style.display = 'none';
  grid.innerHTML = items.map(item => `
    <div class="file-card">
      <video src="${item.url}" preload="metadata"></video>
      <div class="info">
        <div class="caption">${item.title || 'វីដេអូ'}</div>
        <div class="meta">${new Date(item.uploadedAt).toLocaleDateString('km-KH')}</div>
      </div>
      <button class="delete-btn" onclick="deleteVideoItem('${item.id}')" title="លុប">×</button>
    </div>
  `).join('');
}

async function uploadVideo() {
  if (!selectedVideoFile) return;
  const form = new FormData();
  form.append('video', selectedVideoFile);
  form.append('title', $('videoTitle').value);
  form.append('description', $('videoDesc').value);

  const progress = $('videoProgress');
  progress.classList.add('show');
  progress.querySelector('.bar').style.width = '30%';

  try {
    const res = await fetch('/api/videos', { method: 'POST', body: form });
    progress.querySelector('.bar').style.width = '100%';
    if (res.ok) {
      showToast('បញ្ចូលវីដេអូបានជោគជ័យ!', 'success');
      selectedVideoFile = null;
      $('videoTitle').value = '';
      $('videoDesc').value = '';
      $('videoUploadZone').querySelector('p').textContent = 'ចុច ឬអូសវីដេអូមកទីនេះ';
      $('uploadVideoBtn').disabled = true;
      $('videoFileInput').value = '';
      loadContent();
    } else {
      const data = await res.json();
      showToast(data.error || 'កំហុស', 'error');
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
  setTimeout(() => { progress.classList.remove('show'); progress.querySelector('.bar').style.width = '0'; }, 1000);
}

async function deleteVideoItem(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុបវីដេអូនេះ?')) return;
  try {
    const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបបានជោគជ័យ', 'success');
      loadContent();
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

// ===== EVENTS =====
function renderEvents() {
  const list = $('eventsList');
  const noMsg = $('noEvents');
  const items = contentData.events || [];

  if (!items.length) {
    list.innerHTML = '';
    noMsg.style.display = '';
    return;
  }

  noMsg.style.display = 'none';
  list.innerHTML = items.map(item => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:15px;border-bottom:1px solid var(--border);">
      <div>
        <strong style="color:var(--primary);">${item.title}</strong>
        <div style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">
          ${item.day} ${item.month} | ${item.time || ''}
        </div>
        <div style="font-size:0.85rem;color:var(--text-light);margin-top:2px;">${item.description || ''}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteEvent('${item.id}')">លុប</button>
    </div>
  `).join('');
}

async function saveEvent() {
  const data = {
    day: $('eventDay').value,
    month: $('eventMonth').value,
    title: $('eventTitle').value,
    description: $('eventDesc').value,
    time: $('eventTime').value
  };
  if (!data.title) return showToast('សូមបញ្ចូលចំណងជើង', 'error');

  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      showToast('បន្ថែមព្រឹត្តិការណ៍បានជោគជ័យ!', 'success');
      closeModal('eventModal');
      ['eventDay','eventMonth','eventTitle','eventDesc','eventTime'].forEach(id => $(id).value = '');
      loadContent();
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុប?')) return;
  try {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបបានជោគជ័យ', 'success');
      loadContent();
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

// ===== USERS (Owner only) =====
async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const users = await res.json();
      $('statUsers').textContent = users.length;
      renderUsers(users);
    }
  } catch (err) { /* ignore */ }
}

function renderUsers(users) {
  $('usersTableBody').innerHTML = users.map(u => `
    <tr>
      <td>${u.displayName}</td>
      <td>${u.username || '-'}</td>
      <td>${u.email || '<span style="color:var(--text-light)">-</span>'}</td>
      <td><span class="role-badge ${u.role}">${u.role === 'owner' ? 'ម្ចាស់វត្ត' : 'អ្នកគ្រប់គ្រង'}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString('km-KH')}</td>
      <td>
        ${u.role !== 'owner' ? `
          <button class="btn btn-outline btn-sm" onclick="resetPassword('${u.id}')" style="margin-right:5px;" title="ប្តូរពាក្យសម្ងាត់">🔑</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')" title="លុប">លុប</button>
        ` : '<span style="color:var(--text-light);font-size:0.8rem;">—</span>'}
      </td>
    </tr>
  `).join('');
}

async function saveUser() {
  const data = {
    displayName: $('newDisplayName').value,
    email: $('newEmail').value,
    username: $('newUsername').value,
    password: $('newPassword').value,
    role: $('newRole').value
  };
  if ((!data.email && !data.username) || !data.password) {
    return showToast('សូមបញ្ចូលអ៊ីមែល ឬ ឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់', 'error');
  }

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      showToast('បន្ថែម Admin បានជោគជ័យ!', 'success');
      closeModal('userModal');
      ['newDisplayName','newEmail','newUsername','newPassword'].forEach(id => $(id).value = '');
      loadUsers();
    } else {
      showToast(result.error || 'កំហុស', 'error');
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}


async function deleteUser(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុបអ្នកប្រើនេះ?')) return;
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបបានជោគជ័យ', 'success');
      loadUsers();
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

async function resetPassword(id) {
  const newPass = prompt('បញ្ចូលពាក្យសម្ងាត់ថ្មី:');
  if (!newPass) return;
  try {
    const res = await fetch(`/api/users/${id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPass })
    });
    if (res.ok) showToast('ប្តូរពាក្យសម្ងាត់បានជោគជ័យ!', 'success');
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

// ===== HELPERS =====
function openModal(id) { $(id).classList.add('show'); }
function closeModal(id) { $(id).classList.remove('show'); }

function showToast(msg, type = 'success') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('show');
  });
});
