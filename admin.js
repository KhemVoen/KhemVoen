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
    } else {
      showLoginPage();
    }
  } catch (e) {
    showLoginPage();
  }

  setupEventListeners();
});

function showLoginPage() {
  currentUser = null;
  contentData = null;
  $('loginPage').style.display = '';
  $('dashboard').classList.remove('active');
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
}

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
        $('loginError').textContent = data.error || 'ឈ្មោះអ្នកប្រើ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ';
        $('loginError').classList.add('show');
      }
    } catch (err) {
      $('loginError').textContent = 'កំហុសក្នុងការតភ្ជាប់ទៅកាន់ Server';
      $('loginError').classList.add('show');
    }
  });

  // Logout
  $('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    if ($('usersTableBody')) $('usersTableBody').innerHTML = '';
    switchTab('overview');
    showLoginPage();
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
  $('saveBankBtn')?.addEventListener('click', saveBank);

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

  // Playlists
  $('addPlaylistBtn')?.addEventListener('click', () => { $('editPlaylistId').value = ''; $('plTitle').value = ''; $('plDescription').value = ''; $('plCategory').value = 'dhamma-teachings'; $('plCoverPreview').src = 'logo.png'; if ($('plCoverFile')) $('plCoverFile').value = ''; $('playlistModalTitle').textContent = 'បន្ថែម Playlist ថ្មី'; openModal('playlistModal'); });
  $('savePlaylistBtn')?.addEventListener('click', savePlaylist);
  $('savePlaylistItemBtn')?.addEventListener('click', savePlaylistItem);
  $('playlistCategoryFilter')?.addEventListener('change', renderPlaylists);
  $('plCoverFile')?.addEventListener('change', (e) => { if (e.target.files[0]) { const r = new FileReader(); r.onload = (ev) => { $('plCoverPreview').src = ev.target.result; }; r.readAsDataURL(e.target.files[0]); } });

  // Counselors
  $('addCounselorBtn')?.addEventListener('click', () => {
    $('editCounselorId').value = '';
    $('counselorName').value = '';
    $('counselorTitle').value = '';
    $('counselorPhone').value = '';
    $('counselorFacebook').value = '';
    $('counselorTelegram').value = '';
    $('counselorImagePreview').src = 'logo.png';
    if ($('counselorImageFile')) $('counselorImageFile').value = '';
    $('counselorModalTitle').textContent = 'បន្ថែមអ្នកប្រឹក្សាយោបល់';
    openModal('counselorModal');
  });
  $('saveCounselorBtn')?.addEventListener('click', saveCounselor);
  $('counselorImageFile')?.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      const r = new FileReader();
      r.onload = (ev) => { $('counselorImagePreview').src = ev.target.result; };
      r.readAsDataURL(e.target.files[0]);
    }
  });

  // Committee
  $('addCommitteeBtn')?.addEventListener('click', () => {
    $('editCommitteeId').value = '';
    $('committeeCategory').value = 'monk';
    $('committeeName').value = '';
    $('committeeTitle').value = '';
    $('committeePhone').value = '';
    $('committeeFacebook').value = '';
    $('committeeTelegram').value = '';
    $('committeeImgPreview').src = 'logo.png';
    if ($('committeeImgFile')) $('committeeImgFile').value = '';
    $('committeeModalTitle').textContent = 'បន្ថែមសមាជិកគណៈគ្រប់គ្រង';
    openModal('committeeModal');
  });
  $('saveCommitteeBtn')?.addEventListener('click', saveCommittee);
  $('committeeCategoryFilter')?.addEventListener('change', renderCommittee);
  $('committeeImgFile')?.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      const r = new FileReader();
      r.onload = (ev) => { $('committeeImgPreview').src = ev.target.result; };
      r.readAsDataURL(e.target.files[0]);
    }
  });

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

  let actualTab = tab;
  let subTab = null;

  if (tab === 'images' || tab === 'gallery' || tab === 'hero' || tab === 'heroslides') {
    actualTab = 'images';
    subTab = (tab === 'gallery') ? 'gallery' : 'hero';
  }

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

  const panel = $(`tab-${actualTab}`);
  if (panel) panel.classList.add('active');

  const navLink = document.querySelector(`.sidebar-nav a[data-tab="${actualTab}"]`) || document.querySelector(`.sidebar-nav a[data-tab="${tab}"]`);
  if (navLink) navLink.classList.add('active');

  if (subTab) {
    switchImageSubTab(subTab);
  }

  // Close mobile sidebar
  $('sidebar').classList.remove('open');
}

function switchImageSubTab(sub) {
  const gPanel = document.getElementById('subPanelGallery');
  const hPanel = document.getElementById('subPanelHero');
  const gBtn = document.getElementById('subBtnGallery');
  const hBtn = document.getElementById('subBtnHero');
  const heroBtns = document.getElementById('heroHeaderButtons');
  const breadcrumb = document.getElementById('imagesHeaderBreadcrumb');
  const title = document.getElementById('imagesHeaderTitle');

  if (sub === 'gallery') {
    if (gPanel) gPanel.style.display = 'block';
    if (hPanel) hPanel.style.display = 'none';
    if (gBtn) gBtn.classList.add('active');
    if (hBtn) hBtn.classList.remove('active');
    if (heroBtns) heroBtns.style.display = 'none';
    if (title) title.textContent = 'វិចិត្រសាល (Gallery)';
    if (breadcrumb) breadcrumb.textContent = 'ផ្ទាំងគ្រប់គ្រង / រូបភាព / វិចិត្រសាល';
  } else {
    if (gPanel) gPanel.style.display = 'none';
    if (hPanel) hPanel.style.display = 'block';
    if (hBtn) hBtn.classList.add('active');
    if (gBtn) gBtn.classList.remove('active');
    if (heroBtns) heroBtns.style.display = 'flex';
    if (title) title.textContent = 'គ្រប់គ្រងរូបភាពស្លាយ (Hero Slides)';
    if (breadcrumb) breadcrumb.textContent = 'ផ្ទាំងគ្រប់គ្រង / រូបភាព / រូបភាពស្លាយ';
  }
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
    renderPlaylists();
    renderCounselors();
    renderCommittee();
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
function previewHistoryImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if ($('historyImagePreview')) $('historyImagePreview').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function previewBankQrImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if ($('bankQrPreview')) $('bankQrPreview').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function renderHistory() {
  if (contentData.history) {
    $('historyTitle').value = contentData.history.title || '';
    $('historyContent').value = contentData.history.content || '';
    const imgUrl = contentData.history.imageUrl || 'images/buddha.png';
    if ($('historyImageUrl')) $('historyImageUrl').value = imgUrl;
    if ($('historyImagePreview')) $('historyImagePreview').src = imgUrl;
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
    let imageUrl = $('historyImageUrl')?.value || 'images/buddha.png';
    const fileInput = $('historyFileInput');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const uploadedUrl = await uploadHeroImage(fileInput.files[0]);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
        if ($('historyImageUrl')) $('historyImageUrl').value = uploadedUrl;
      }
    } else if ($('historyImagePreview')?.src.startsWith('data:image')) {
      imageUrl = $('historyImagePreview').src;
    }

    const res = await fetch('/api/content/history', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: $('historyTitle').value,
        imageUrl: imageUrl,
        content: $('historyContent').value
      })
    });
    if (res.ok) {
      if (contentData.history) {
        contentData.history.title = $('historyTitle').value;
        contentData.history.imageUrl = imageUrl;
        contentData.history.content = $('historyContent').value;
      }
      showToast('រក្សាទុកបានជោគជ័យ!', 'success');
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការរក្សាទុកប្រវត្តិ', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកប្រវត្តិបាន'), 'error');
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
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការរក្សាទុកស្ថិតិ', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកស្ថិតិបាន'), 'error');
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
    if ($('bankName')) $('bankName').value = contentData.contact.bankName || '';
    if ($('bankAccountName')) $('bankAccountName').value = contentData.contact.bankAccountName || '';
    if ($('bankAccountNumber')) $('bankAccountNumber').value = contentData.contact.bankAccountNumber || '';
    if ($('bankQrUrl')) {
      const qrUrl = contentData.contact.bankQrUrl || 'images/aba_qr.png';
      $('bankQrUrl').value = contentData.contact.bankQrUrl || '';
      if ($('bankQrPreview')) $('bankQrPreview').src = qrUrl;
    }
  }
}

async function saveContact() {
  try {
    const contactData = {
      ...contentData.contact,
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
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការរក្សាទុកព័ត៌មានទំនាក់ទំនង', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកព័ត៌មានទំនាក់ទំនងបាន'), 'error');
  }
}

async function saveBank() {
  try {
    let qrUrl = $('bankQrUrl')?.value || '';
    const fileInput = $('bankQrFileInput');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const uploadedUrl = await uploadHeroImage(fileInput.files[0]);
      if (uploadedUrl) {
        qrUrl = uploadedUrl;
        if ($('bankQrUrl')) $('bankQrUrl').value = uploadedUrl;
      }
    } else if ($('bankQrPreview')?.src.startsWith('data:image')) {
      qrUrl = $('bankQrPreview').src;
    }

    const contactData = {
      ...contentData.contact,
      bankName: $('bankName').value,
      bankAccountName: $('bankAccountName').value,
      bankAccountNumber: $('bankAccountNumber').value,
      bankQrUrl: qrUrl
    };
    const res = await fetch('/api/content/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });
    if (res.ok) {
      showToast('រក្សាទុកព័ត៌មានធនាគារបានជោគជ័យ!', 'success');
      contentData.contact = contactData;
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការរក្សាទុកព័ត៌មានធនាគារ', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកព័ត៌មានធនាគារបាន'), 'error');
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
  try {
    const form = new FormData();
    form.append('image', file);
    form.append('caption', 'Uploaded Image');
    const res = await fetch('/api/gallery', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      return data.entry.url;
    }
  } catch (e) {}

  // Fallback to base64 DataURL if backend upload failed or file system read-only
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
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
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const parsed = new URL(imageUrl);
        imageUrl = parsed.pathname;
      } catch (e) {}
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
  clearFormErrors('eventModal');
  const title = $('eventTitle').value.trim();
  if (!title) {
    markFieldError('eventTitle', 'សូមបញ្ចូលចំណងជើងព្រឹត្តិការណ៍ (ត្រង់កន្លែងនេះ)');
    showToast('សូមបញ្ចូលចំណងជើងព្រឹត្តិការណ៍!', 'error');
    return;
  }

  const data = {
    day: $('eventDay').value,
    month: $('eventMonth').value,
    title: title,
    description: $('eventDesc').value.trim(),
    time: $('eventTime').value.trim()
  };

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
    } else {
      const result = await res.json().catch(() => ({}));
      showToast(result.error || 'កំហុសក្នុងការរក្សាទុកព្រឹត្តិការណ៍', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកបាន'), 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុបព្រឹត្តិការណ៍នេះ?')) return;
  try {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបព្រឹត្តិការណ៍បានជោគជ័យ', 'success');
      loadContent();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការលុបព្រឹត្តិការណ៍', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចលុបបាន'), 'error');
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
  clearFormErrors('userModal');
  const email = $('newEmail').value.trim();
  const username = $('newUsername').value.trim();
  const password = $('newPassword').value;

  if (!email && !username) {
    markFieldError('newUsername', 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល (ត្រង់កន្លែងនេះ)');
    showToast('សូមបញ្ចូលអ៊ីមែល ឬ ឈ្មោះអ្នកប្រើ!', 'error');
    return;
  }
  if (!password) {
    markFieldError('newPassword', 'សូមបញ្ចូលពាក្យសម្ងាត់ (ត្រង់កន្លែងនេះ)');
    showToast('សូមបញ្ចូលពាក្យសម្ងាត់!', 'error');
    return;
  }

  const data = {
    displayName: $('newDisplayName').value.trim(),
    email: email,
    username: username,
    password: password,
    role: $('newRole').value
  };

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast('បន្ថែម Admin បានជោគជ័យ!', 'success');
      closeModal('userModal');
      ['newDisplayName','newEmail','newUsername','newPassword'].forEach(id => $(id).value = '');
      loadUsers();
    } else {
      showToast(result.error || 'កំហុសក្នុងការបន្ថែម Admin', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចបន្ថែមបាន'), 'error');
  }
}

async function deleteUser(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុបអ្នកប្រើនេះ?')) return;
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបបានជោគជ័យ', 'success');
      loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការលុប', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចលុបបាន'), 'error');
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

// ===== PLAYLISTS =====
const CATEGORY_LABELS = {
  'dhamma-teachings': 'សម្តែងធម៌ទេសនា',
  'religious-festivals': 'បុណ្យសាសនា',
  'dhamma-school': 'សាលាធម៌',
  'community': 'សកម្មភាពសង្គម',
  'meditation': 'ធ្វើសមាធិ',
  'counseling': 'ប្រឹក្សាយោបល់'
};

function renderPlaylists() {
  const container = $('playlistsList');
  const noMsg = $('noPlaylists');
  if (!container || !contentData) return;

  let playlists = contentData.playlists || [];
  const filter = $('playlistCategoryFilter')?.value;
  if (filter) playlists = playlists.filter(p => p.category === filter);

  if (playlists.length === 0) {
    container.innerHTML = '';
    if (noMsg) noMsg.style.display = '';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';

  container.innerHTML = playlists.map(pl => {
    const catLabel = CATEGORY_LABELS[pl.category] || pl.category;
    const itemCount = (pl.items || []).length;
    const itemsHtml = (pl.items || []).map(item => {
      const typeIcon = item.type === 'video' ? '🎬' : item.type === 'audio' ? '🎵' : '📖';
      const typeLabel = item.type === 'video' ? 'វីដេអូ' : item.type === 'audio' ? 'សំឡេង' : 'អត្ថបទ';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg, #f8f9fa);border-radius:6px;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.2rem;">${typeIcon}</span>
            <div>
              <strong style="font-size:0.9rem;">${item.title || 'គ្មានចំណងជើង'}</strong>
              <div style="font-size:0.75rem;color:var(--text-light);">${typeLabel}${item.url ? ' • ' + item.url.substring(0, 40) + '...' : ''}</div>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="deletePlaylistItem('${pl.id}','${item.id}')" style="font-size:0.7rem;padding:3px 8px;">🗑️</button>
        </div>`;
    }).join('');

    return `
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
          <img src="${pl.coverImage || 'logo.png'}" style="width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #eee;" onerror="this.src='logo.png'">
          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
              <h3 style="margin:0;color:var(--primary-color);">${pl.title || 'Untitled Playlist'}</h3>
              <span style="background:var(--gold, #d4a843);color:#fff;font-size:0.7rem;padding:2px 8px;border-radius:10px;">${catLabel}</span>
              <span style="font-size:0.8rem;color:var(--text-light);">${itemCount} មាតិកា</span>
            </div>
            <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:10px;">${pl.description || ''}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" onclick="editPlaylist('${pl.id}')" style="font-size:0.8rem;">✏️ កែ</button>
              <button class="btn btn-gold btn-sm" onclick="openAddItem('${pl.id}')" style="font-size:0.8rem;">+ បន្ថែមមាតិកា</button>
              <button class="btn btn-danger btn-sm" onclick="deletePlaylist('${pl.id}')" style="font-size:0.8rem;">🗑️ លុប</button>
            </div>
          </div>
        </div>
        ${itemCount > 0 ? `<div style="margin-top:15px;border-top:1px solid #eee;padding-top:15px;"><h4 style="margin-bottom:10px;font-size:0.95rem;">📋 មាតិកាទាំងអស់ (${itemCount})</h4>${itemsHtml}</div>` : ''}
      </div>`;
  }).join('');
}

function editPlaylist(id) {
  const pl = (contentData.playlists || []).find(p => p.id === id);
  if (!pl) return;
  $('editPlaylistId').value = pl.id;
  $('plTitle').value = pl.title || '';
  $('plDescription').value = pl.description || '';
  $('plCategory').value = pl.category || 'dhamma-teachings';
  $('plCoverPreview').src = pl.coverImage || 'logo.png';
  $('playlistModalTitle').textContent = 'កែសម្រួល Playlist';
  openModal('playlistModal');
}

async function savePlaylist() {
  clearFormErrors('playlistModal');
  const editId = $('editPlaylistId').value;
  const title = $('plTitle').value.trim();
  const description = $('plDescription').value.trim();
  const category = $('plCategory').value;

  if (!title) {
    markFieldError('plTitle', 'សូមបញ្ចូលចំណងជើង Playlist (ត្រង់កន្លែងនេះ)');
    showToast('សូមបញ្ចូលចំណងជើង Playlist!', 'error');
    return;
  }

  const form = new FormData();
  form.append('title', title);
  form.append('description', description);
  form.append('category', category);
  const coverFile = $('plCoverFile');
  if (coverFile && coverFile.files && coverFile.files[0]) {
    form.append('coverImage', coverFile.files[0]);
  }

  try {
    const url = editId ? `/api/playlists/${editId}` : '/api/playlists';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: form });
    if (res.ok) {
      showToast(editId ? 'កែសម្រួល Playlist បានជោគជ័យ!' : 'បន្ថែម Playlist បានជោគជ័យ!', 'success');
      closeModal('playlistModal');
      loadContent();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការរក្សាទុក Playlist', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកបាន'), 'error');
  }
}

async function deletePlaylist(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុប Playlist នេះ?')) return;
  try {
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុប Playlist បានជោគជ័យ!', 'success');
      loadContent();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការលុប Playlist', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចលុបបាន'), 'error');
  }
}

function openAddItem(playlistId) {
  $('itemPlaylistId').value = playlistId;
  $('itemType').value = 'video';
  $('itemTitle').value = '';
  $('itemDescription').value = '';
  $('itemUrl').value = '';
  if ($('itemContent')) $('itemContent').value = '';
  if ($('itemAudioFile')) $('itemAudioFile').value = '';
  toggleItemFields();
  openModal('playlistItemModal');
}

function toggleItemFields() {
  clearFormErrors('playlistItemModal');
  const type = $('itemType').value;
  $('itemUrlGroup').style.display = type === 'video' ? '' : 'none';
  $('itemAudioGroup').style.display = type === 'audio' ? '' : 'none';
  $('itemArticleGroup').style.display = type === 'article' ? '' : 'none';
}

async function savePlaylistItem() {
  clearFormErrors('playlistItemModal');
  const playlistId = $('itemPlaylistId').value;
  const type = $('itemType').value;
  const title = $('itemTitle').value.trim();
  const description = $('itemDescription').value.trim();

  if (!title) {
    markFieldError('itemTitle', 'សូមបញ្ចូលចំណងជើងមាតិកា (ត្រង់កន្លែងនេះ)');
    showToast('សូមបញ្ចូលចំណងជើងមាតិកា!', 'error');
    return;
  }

  if (type === 'video') {
    const url = $('itemUrl').value.trim();
    if (!url) {
      markFieldError('itemUrl', 'សូមបញ្ចូលតំណវីដេអូ YouTube ឬ Facebook (ត្រង់កន្លែងនេះ)');
      showToast('សូមបញ្ចូល Link វីដេអូ!', 'error');
      return;
    }
  } else if (type === 'audio') {
    const audioInput = $('itemAudioFile');
    if (!audioInput || !audioInput.files || audioInput.files.length === 0) {
      markFieldError('itemAudioFile', 'សូមជ្រើសរើសឯកសារសំឡេង (ត្រង់កន្លែងនេះ)');
      showToast('សូមជ្រើសរើសឯកសារសំឡេង!', 'error');
      return;
    }
  } else if (type === 'article') {
    const content = $('itemContent').value.trim();
    if (!content) {
      markFieldError('itemContent', 'សូមបញ្ចូលខ្លឹមសារអត្ថបទ (ត្រង់កន្លែងនេះ)');
      showToast('សូមបញ្ចូលខ្លឹមសារអត្ថបទ!', 'error');
      return;
    }
  }

  if (type === 'audio' && $('itemAudioFile').files.length > 0) {
    const form = new FormData();
    form.append('type', type);
    form.append('title', title);
    form.append('description', description);
    form.append('audioFile', $('itemAudioFile').files[0]);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/items`, { method: 'POST', body: form });
      if (res.ok) {
        showToast('បន្ថែមសំឡេងបានជោគជ័យ!', 'success');
        closeModal('playlistItemModal');
        loadContent();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'កំហុសក្នុងការរក្សាទុកសំឡេង', 'error');
      }
    } catch (err) {
      showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកបាន'), 'error');
    }
  } else {
    const body = {
      type,
      title,
      description,
      url: type === 'video' ? $('itemUrl').value.trim() : '',
      content: type === 'article' ? $('itemContent').value.trim() : ''
    };
    try {
      const res = await fetch(`/api/playlists/${playlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast('បន្ថែមមាតិកាបានជោគជ័យ!', 'success');
        closeModal('playlistItemModal');
        loadContent();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'កំហុសក្នុងការរក្សាទុកមាតិកា', 'error');
      }
    } catch (err) {
      showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចរក្សាទុកបាន'), 'error');
    }
  }
}

async function deletePlaylistItem(playlistId, itemId) {
  if (!confirm('តើអ្នកពិតជាចង់លុបមាតិកានេះ?')) return;
  try {
    const res = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបមាតិកាបានជោគជ័យ!', 'success');
      loadContent();
    }
  } catch (err) {
    showToast('កំហុស', 'error');
  }
}

// ===== COUNSELORS =====
function getCarrierInfo(phoneNumber) {
  if (!phoneNumber) return null;
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) return null;
  let prefix = '';
  if (digits.startsWith('855')) prefix = '0' + digits.substring(3, 5);
  else if (digits.startsWith('0')) prefix = digits.substring(0, 3);
  else prefix = '0' + digits.substring(0, 2);

  const cellcard = ['011', '012', '014', '017', '061', '076', '077', '078', '085', '089', '092', '095', '099'];
  const smart = ['010', '015', '016', '069', '070', '081', '086', '087', '093', '096', '098'];
  const metfone = ['031', '060', '066', '067', '068', '071', '088', '090', '097'];

  if (cellcard.includes(prefix)) return { name: 'Cellcard', color: '#ff6600', bg: '#fff0e6' };
  if (smart.includes(prefix)) return { name: 'Smart', color: '#00a859', bg: '#e6f7ef' };
  if (metfone.includes(prefix)) return { name: 'Metfone', color: '#e60000', bg: '#ffe6e6' };
  return null;
}

function renderCounselors() {
  const container = $('counselorsList');
  const noMsg = $('noCounselors');
  if (!container || !contentData) return;

  const counselors = contentData.counselors || [];
  if (counselors.length === 0) {
    container.innerHTML = '';
    if (noMsg) noMsg.style.display = '';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';

  container.innerHTML = counselors.map(c => {
    const carrier = getCarrierInfo(c.phone);
    const carrierBadge = carrier ? `<span style="background:${carrier.bg};color:${carrier.color};padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:bold;">${carrier.name}</span>` : '';
    return `
      <div class="card" style="text-align:center;padding:20px;display:flex;flex-direction:column;align-items:center;position:relative;">
        <img src="${c.image || 'logo.png'}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid var(--gold,#d4a843);margin-bottom:12px;" onerror="this.src='logo.png'">
        <h3 style="margin:0 0 4px 0;font-size:1.1rem;color:var(--primary-color);">${c.name || 'គ្មានឈ្មោះ'}</h3>
        <p style="color:var(--text-light);font-size:0.85rem;margin-bottom:10px;">${c.title || ''}</p>
        
        ${c.phone ? `
          <div style="display:flex;align-items:center;gap:6px;background:#f8f9fa;padding:6px 12px;border-radius:20px;font-size:0.85rem;margin-bottom:12px;">
            📞 <strong>${c.phone}</strong> ${carrierBadge}
          </div>
        ` : ''}

        <div style="display:flex;gap:10px;margin-bottom:15px;">
          ${c.facebook ? `<a href="${c.facebook}" target="_blank" style="background:#1877f2;color:white;padding:6px 12px;border-radius:6px;font-size:0.8rem;text-decoration:none;">f Facebook</a>` : ''}
          ${c.telegram ? `<a href="${c.telegram}" target="_blank" style="background:#0088cc;color:white;padding:6px 12px;border-radius:6px;font-size:0.8rem;text-decoration:none;">✈ Telegram</a>` : ''}
        </div>

        <div style="display:flex;gap:10px;margin-top:auto;">
          <button class="btn btn-outline btn-sm" onclick="editCounselor('${c.id}')">✏️ កែ</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCounselor('${c.id}')">🗑️ លុប</button>
        </div>
      </div>`;
  }).join('');
}

function editCounselor(id) {
  const counselor = (contentData.counselors || []).find(c => c.id === id);
  if (!counselor) return;
  $('editCounselorId').value = counselor.id;
  $('counselorName').value = counselor.name || '';
  $('counselorTitle').value = counselor.title || '';
  $('counselorPhone').value = counselor.phone || '';
  $('counselorFacebook').value = counselor.facebook || '';
  $('counselorTelegram').value = counselor.telegram || '';
  $('counselorImagePreview').src = counselor.image || 'logo.png';
  $('counselorModalTitle').textContent = 'កែសម្រួលព័ត៌មានអ្នកប្រឹក្សាយោបល់';
  openModal('counselorModal');
}

async function saveCounselor() {
  clearFormErrors('counselorModal');
  const editId = $('editCounselorId').value;
  const name = $('counselorName').value.trim();
  const title = $('counselorTitle').value.trim();
  const phone = $('counselorPhone').value.trim();
  const facebook = $('counselorFacebook').value.trim();
  const telegram = $('counselorTelegram').value.trim();

  // Validate required field and tell Editor where the error is
  if (!name) {
    markFieldError('counselorName', 'សូមបញ្ចូលឈ្មោះអ្នកប្រឹក្សាយោបល់ (ត្រង់កន្លែងនេះ)');
    showToast('សូមបញ្ចូលឈ្មោះអ្នកប្រឹក្សាយោបល់!', 'error');
    return;
  }

  const form = new FormData();
  form.append('name', name);
  form.append('title', title);
  form.append('phone', phone);
  form.append('facebook', facebook);
  form.append('telegram', telegram);

  const imgFile = $('counselorImageFile');
  if (imgFile && imgFile.files && imgFile.files[0]) {
    form.append('image', imgFile.files[0]);
  }

  try {
    const url = editId ? `/api/counselors/${editId}` : '/api/counselors';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: form });
    if (res.ok) {
      showToast(editId ? 'កែសម្រួលបានជោគជ័យ!' : 'បន្ថែមអ្នកប្រឹក្សាបានជោគជ័យ!', 'success');
      closeModal('counselorModal');
      loadContent();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការរក្សាទុកអ្នកប្រឹក្សាយោបល់', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចផ្ញើទិន្នន័យបាន'), 'error');
  }
}

async function deleteCounselor(id) {
  if (!confirm('តើអ្នកពិតជាចង់លុបអ្នកប្រឹក្សាយោបល់នេះ?')) return;
  try {
    const res = await fetch(`/api/counselors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('លុបអ្នកប្រឹក្សាបានជោគជ័យ!', 'success');
      loadContent();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការលុបអ្នកប្រឹក្សា', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចលុបបាន'), 'error');
  }
}

// ===== COMMITTEE MANAGEMENT (Monks & Laypeople - Tree Structure) =====
function addCommitteeWithPreset(category, roleRank, defaultTitle) {
  $('editCommitteeId').value = '';
  $('committeeCategory').value = category || 'monk';
  if ($('committeeRoleRank')) $('committeeRoleRank').value = roleRank || 'root';
  $('committeeName').value = '';
  $('committeeTitle').value = defaultTitle || '';
  $('committeePhone').value = '';
  $('committeeFacebook').value = '';
  $('committeeTelegram').value = '';
  $('committeeImgPreview').src = 'logo.png';
  $('committeeModalTitle').textContent = 'បន្ថែមសមាជិកគណៈគ្រប់គ្រង';
  openModal('committeeModal');
}

function createAdminTempleArchCard(member, defaultKhmerTitle, isMonkCategory, category, roleRank) {
  const isMonk = isMonkCategory;
  const name = member ? (member.name || '') : 'មិនទាន់មានទិន្នន័យ';
  const title = member ? (member.title || defaultKhmerTitle) : defaultKhmerTitle;
  const image = member ? (member.image || (isMonk ? 'images/buddha.png' : 'logo.png')) : 'logo.png';
  const phone = member ? member.phone : '';
  const carrier = phone ? getCarrierInfo(phone) : null;
  const carrierBadge = carrier ? `<span class="carrier-badge" style="background:${carrier.bg};color:${carrier.color};border:1px solid ${carrier.border || '#cbd5e1'};font-size:0.6rem;padding:1px 5px;border-radius:8px;display:inline-block;">${carrier.name}</span>` : '';

  return `
    <div class="temple-node-card ${member ? 'active-node' : 'empty-node'}" style="position:relative;">
      <div class="temple-node-img-wrap">
        <div class="temple-node-img-frame">
          <img src="${image}" alt="${name}" onerror="this.src='logo.png'">
        </div>
        <div class="temple-node-ornament">${isMonk ? '☸️' : '👥'}</div>
      </div>
      <h4 class="temple-name">${name}</h4>
      <div class="temple-navy-badge">
        <div class="badge-khmer">${title}</div>
      </div>
      ${phone ? `
        <div class="temple-phone">
          <span>📞</span>
          <span>${phone}</span>
          ${carrierBadge}
        </div>
      ` : ''}

      <div class="admin-node-actions" style="margin-top:10px;display:flex;gap:6px;justify-content:center;width:100%;">
        ${member ? `
          <button class="btn btn-gold btn-sm" onclick="editCommittee('${member.id}')" style="padding:4px 12px;font-size:0.8rem;border-radius:12px;display:flex;align-items:center;gap:4px;box-shadow:0 2px 6px rgba(0,0,0,0.12);">✏️ កែ</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCommittee('${member.id}')" style="padding:4px 8px;font-size:0.8rem;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,0.12);" title="លុបសមាជិក">🗑️</button>
        ` : `
          <button class="btn btn-outline btn-sm" onclick="addCommitteeWithPreset('${category}', '${roleRank}', '${defaultKhmerTitle}')" style="padding:4px 10px;font-size:0.75rem;border-radius:12px;background:#fff;border-color:var(--gold,#d4a843);color:var(--primary,#1a3a5c);font-weight:700;">+ បន្ថែម</button>
        `}
      </div>
    </div>`;
}

function buildAdminMonkOrgChart(members, category, usedMemberIds) {
  const localUsed = new Set();
  const findMember = (rank, titleHint) => {
    const byRank  = members.find(m => !localUsed.has(m.id) && m.roleRank === rank);
    const byTitle = titleHint ? members.find(m => !localUsed.has(m.id) && m.title && m.title.includes(titleHint)) : null;
    const found   = byRank || byTitle || null;
    if (found) {
      localUsed.add(found.id);
      if (usedMemberIds) usedMemberIds.add(found.id);
    }
    return found;
  };

  const root    = findMember('root', 'ចៅអធិការ');
  const deputy1 = findMember('deputy_1', 'សូត្រស្តាំ');
  const deputy2 = findMember('deputy_2', 'សូត្រឆ្វេង');

  const off1 = findMember('officer_d1_discipline', 'វិន័យ') || findMember('officer_discipline', 'វិន័យ');
  const off2 = findMember('officer_d1_secretary', 'លេខា') || findMember('officer_secretary', 'លេខា');
  const off3 = findMember('officer_d1_catering', 'ភត្ត') || findMember('officer_catering', 'ភត្ត');

  const offMembers = [
    { m: off1, rank: 'officer_d1_discipline', kh: 'ព្រះវិន័យធរ', en: 'Venerable Discipline Master' },
    { m: off2, rank: 'officer_d1_secretary',  kh: 'ព្រះលេខា',    en: 'Venerable Secretary' },
    { m: off3, rank: 'officer_d1_catering',   kh: 'ភត្តទ្ទេសក៍',  en: 'Venerable Meal Master / Bhaktaddeshaka' },
  ];

  const tier3Cards = offMembers.map(({ m, rank, kh }) => {
    return createAdminTempleArchCard(m, kh, true, category, rank);
  }).join('');

  return `
    <div class="oc-chart-container admin-tree-animated" style="margin-bottom:40px;overflow-x:auto;">
      <div class="oc-chart-header">
        <h2 class="oc-chart-title">រចនាសម្ព័ន្ធគ្រប់គ្រង</h2>
        <div class="oc-chart-subtitle">វត្តខេមវ័ន(បឹងស្នាយ) • ផ្ទាំងគ្រប់គ្រង (Admin Tree View)</div>
        <div class="oc-chart-badge">☸️ ឋានានុក្រមព្រះសង្ឃ</div>
      </div>

      <div class="oc-tree">
        <!-- ═══ TIER 1: Chief Abbot ═══ -->
        <div class="oc-tier oc-tier-1">
          ${createAdminTempleArchCard(root, 'ព្រះគ្រូចៅអធិការវត្ត', true, category, 'root')}
        </div>

        <!-- Connector T1→T2 -->
        <div class="oc-conn oc-conn-t1t2">
          <div class="oc-conn-stem"></div>
          <div class="oc-conn-hbar oc-conn-hbar--wide"></div>
          <div class="oc-conn-stems-row">
            <span class="oc-conn-stem-down"></span>
            <span class="oc-conn-stem-down"></span>
          </div>
        </div>

        <!-- ═══ TIER 2: Deputies ═══ -->
        <div class="oc-tier oc-tier-2">
          ${createAdminTempleArchCard(deputy1, 'ព្រះគ្រូសូត្រស្ដាំ', true, category, 'deputy_1')}
          ${createAdminTempleArchCard(deputy2, 'ព្រះគ្រូសូត្រឆ្វេង', true, category, 'deputy_2')}
        </div>

        <!-- Connector T2→T3 -->
        <div class="oc-conn oc-conn-t2t3">
          <div class="oc-conn-stem"></div>
          <div class="oc-conn-hbar oc-conn-hbar--full"></div>
          <div class="oc-conn-stems-row oc-conn-stems-row--3">
            <span class="oc-conn-stem-down"></span>
            <span class="oc-conn-stem-down"></span>
            <span class="oc-conn-stem-down"></span>
          </div>
        </div>

        <!-- ═══ TIER 3: Officers ═══ -->
        <div class="oc-tier oc-tier-3">
          ${tier3Cards}
        </div>

      </div>
    </div>`;
}

function buildAdminOrgTreeBlock(title, icon, members, isMonkCategory, category, usedMemberIds) {
  if (isMonkCategory) {
    return buildAdminMonkOrgChart(members, category, usedMemberIds);
  }
  // Local set prevents the same member appearing in two slots (deduplication fix)
  const localUsed = new Set();

  const findMember = (rank, titleHint) => {
    const byRank  = members.find(m => !localUsed.has(m.id) && m.roleRank === rank);
    const byTitle = titleHint ? members.find(m => !localUsed.has(m.id) && m.title && m.title.includes(titleHint)) : null;
    const found   = byRank || byTitle || null;
    if (found) {
      localUsed.add(found.id);
      if (usedMemberIds) usedMemberIds.add(found.id);
    }
    return found;
  };

  const root    = findMember('root',               isMonkCategory ? 'ចៅអធិការ'      : 'ប្រធាន');
  const dep1    = findMember('deputy_1',            isMonkCategory ? 'សូត្រស្តាំ'    : 'អនុប្រធានទី១');
  const dep2    = findMember('deputy_2',            isMonkCategory ? 'សូត្រឆ្វេង'   : 'អនុប្រធានទី២');
  const d1_off1 = findMember('officer_d1_discipline', isMonkCategory ? 'វិន័យ' : 'ហិរញ្ញ');
  const d1_off2 = findMember('officer_d1_secretary',  'លេខា');
  const d1_off3 = findMember('officer_d1_catering',   isMonkCategory ? 'ភត្ត' : 'ពិធី');
  const d2_off1 = findMember('officer_d2_discipline', isMonkCategory ? 'វិន័យ' : 'ហិរញ្ញ');
  const d2_off2 = findMember('officer_d2_secretary',  'លេខា');
  const d2_off3 = findMember('officer_d2_catering',   isMonkCategory ? 'ភត្ត' : 'ពិធី');

  // Flags used to decide which connector lines to draw
  const hasAnyDeputy = dep1 || dep2;
  const hasBoth      = dep1 && dep2;
  const b1Officers   = [d1_off1, d1_off2, d1_off3].filter(Boolean);
  const b2Officers   = [d2_off1, d2_off2, d2_off3].filter(Boolean);

  const d1Title = isMonkCategory ? 'ព្រះគ្រូសូត្រស្តាំ'  : 'អនុប្រធានទី១';
  const d2Title = isMonkCategory ? 'ព្រះគ្រូសូត្រឆ្វេង' : 'អនុប្រធានទី២';
  const rootTitle = isMonkCategory ? 'ព្រះគ្រូចៅអធិការវត្ត' : 'ប្រធានគណៈកម្មការវត្ត';

  // Helper: render the filled officer cards for a branch
  const offCards1 = (dep) => `
    <div class="officers-row" style="${b1Officers.length < 3 ? 'justify-content:center;gap:20px;' : ''}">
      ${createAdminTempleArchCard(d1_off1, isMonkCategory ? 'ព្រះវិន័យធម៌' : 'ហិរញ្ញវត្ថុ / បេឡា', isMonkCategory, category, 'officer_d1_discipline')}
      ${createAdminTempleArchCard(d1_off2, isMonkCategory ? 'ព្រះលេខា'      : 'លេខាធិការ',          isMonkCategory, category, 'officer_d1_secretary')}
      ${createAdminTempleArchCard(d1_off3, isMonkCategory ? 'ព្រះភត្តទេសក៍': 'គណៈកម្មការពិធី',    isMonkCategory, category, 'officer_d1_catering')}
    </div>`;

  const offCards2 = (dep) => `
    <div class="officers-row" style="${b2Officers.length < 3 ? 'justify-content:center;gap:20px;' : ''}">
      ${createAdminTempleArchCard(d2_off1, isMonkCategory ? 'ព្រះវិន័យធម៌' : 'ហិរញ្ញវត្ថុ / បេឡា', isMonkCategory, category, 'officer_d2_discipline')}
      ${createAdminTempleArchCard(d2_off2, isMonkCategory ? 'ព្រះលេខា'      : 'លេខាធិការ',          isMonkCategory, category, 'officer_d2_secretary')}
      ${createAdminTempleArchCard(d2_off3, isMonkCategory ? 'ព្រះភត្តទេសក៍': 'គណៈកម្មការពិធី',    isMonkCategory, category, 'officer_d2_catering')}
    </div>`;

  return `
    <div class="temple-chart-container admin-tree-animated" style="margin-bottom:40px;overflow-x:auto;">
      <div class="temple-chart-header">
        <h2 class="temple-chart-title">រចនាសម្ព័ន្ធគ្រប់គ្រង</h2>
        <div class="temple-chart-subtitle">វត្តខេមវ័ន(បឹងស្នាយ) • ផ្ទាំងគ្រប់គ្រង (Admin Tree View)</div>
        <div class="temple-chart-badge">${icon} ${title}</div>
      </div>

      <div class="temple-tree-board">

        <!-- Level 1: Root -->
        <div class="temple-level level-root-center">
          ${createAdminTempleArchCard(root, rootTitle, isMonkCategory, category, 'root')}
        </div>

        <!-- Connector: Root → Deputies (only if deputies exist) -->
        ${hasAnyDeputy ? `
          <div class="conduit-main-stem"></div>
          <div class="conduit-top-bar" style="${hasBoth ? '' : 'width:2px;margin:0 auto;'}"></div>
          <div class="conduit-deputy-stems" style="${hasBoth ? '' : 'justify-content:center;'}">
            ${dep1 ? '<span></span>' : ''}
            ${dep2 ? '<span></span>' : ''}
          </div>
        ` : ''}

        <!-- Level 2: Deputies + Officers -->
        <div class="temple-level level-deputies-split" style="${!hasAnyDeputy ? 'margin-top:0;' : ''}">

          <!-- Branch 1 (Left / First Deputy) -->
          <div class="deputy-branch-block left-branch" style="${!dep1 && !b1Officers.length ? 'opacity:0.55;' : ''}">
            <div class="deputy-card-wrap">
              ${createAdminTempleArchCard(dep1, d1Title, isMonkCategory, category, 'deputy_1')}
            </div>

            <!-- Sub-connector: Deputy → Officers (only if officers exist under branch 1) -->
            ${b1Officers.length ? `
              <div class="conduit-sub-stem"></div>
              <div class="conduit-sub-bar" style="${b1Officers.length < 3 ? 'width:' + (b1Officers.length * 33) + '%;' : ''}"></div>
              <div class="conduit-officer-stems" style="${b1Officers.length < 3 ? 'justify-content:center;gap:' + (b1Officers.length === 1 ? '0' : '40px') + ';' : ''}">
                ${d1_off1 ? '<span></span>' : ''}${d1_off2 ? '<span></span>' : ''}${d1_off3 ? '<span></span>' : ''}
              </div>
            ` : ''}

            <!-- Officer cards (filled slots first, then empty/add-new slots) -->
            ${offCards1()}
          </div>

          <!-- Branch 2 (Right / Second Deputy) -->
          <div class="deputy-branch-block right-branch" style="${!dep2 && !b2Officers.length ? 'opacity:0.55;' : ''}">
            <div class="deputy-card-wrap">
              ${createAdminTempleArchCard(dep2, d2Title, isMonkCategory, category, 'deputy_2')}
            </div>

            <!-- Sub-connector: Deputy → Officers (only if officers exist under branch 2) -->
            ${b2Officers.length ? `
              <div class="conduit-sub-stem"></div>
              <div class="conduit-sub-bar" style="${b2Officers.length < 3 ? 'width:' + (b2Officers.length * 33) + '%;' : ''}"></div>
              <div class="conduit-officer-stems" style="${b2Officers.length < 3 ? 'justify-content:center;gap:' + (b2Officers.length === 1 ? '0' : '40px') + ';' : ''}">
                ${d2_off1 ? '<span></span>' : ''}${d2_off2 ? '<span></span>' : ''}${d2_off3 ? '<span></span>' : ''}
              </div>
            ` : ''}

            <!-- Officer cards -->
            ${offCards2()}
          </div>

        </div>
      </div>
    </div>`;
}

function renderCommittee() {
  const container = $('committeeList');
  const noMsg = $('noCommittee');
  if (!container) return;

  let allMembers = contentData.committee || [];
  const filterCat = $('committeeCategoryFilter')?.value;

  if (allMembers.length === 0 && !filterCat) {
    container.innerHTML = '';
    if (noMsg) noMsg.style.display = '';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';

  const usedMemberIds = new Set();
  const monks = allMembers.filter(m => m.category === 'monk');
  const laypeople = allMembers.filter(m => m.category === 'layperson');

  let html = '';
  if (!filterCat || filterCat === 'monk') {
    html += buildAdminOrgTreeBlock('ឋានានុក្រមព្រះសង្ឃ', '☸️', monks, true, 'monk', usedMemberIds);
  }
  if (!filterCat || filterCat === 'layperson') {
    html += buildAdminOrgTreeBlock('ឋានានុក្រមពុទ្ធបរិស័ទ / គណៈកម្មការវត្ត', '👥', laypeople, false, 'layperson', usedMemberIds);
  }

  // Check for extra members not in standard ranks
  const extraMembers = allMembers.filter(m => !usedMemberIds.has(m.id) && (!filterCat || m.category === filterCat));
  if (extraMembers.length > 0) {
    html += `
      <div class="card" style="margin-top:20px;padding:20px;">
        <h3 style="margin-bottom:15px;color:var(--primary);font-size:1.1rem;">📋 សមាជិកបន្ថែម (Other Members)</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:16px;">
          ${extraMembers.map(c => {
            const isMonk = c.category === 'monk';
            const carrier = getCarrierInfo(c.phone);
            const carrierBadge = carrier ? `<span style="background:${carrier.bg};color:${carrier.color};padding:2px 6px;border-radius:8px;font-size:0.7rem;font-weight:bold;">${carrier.name}</span>` : '';
            return `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:15px;text-align:center;display:flex;flex-direction:column;align-items:center;">
                <img src="${c.image || 'logo.png'}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid var(--gold,#d4a843);margin-bottom:8px;" onerror="this.src='logo.png'">
                <h4 style="margin:0 0 2px 0;font-size:1rem;color:var(--primary);">${c.name}</h4>
                <p style="color:var(--text-light);font-size:0.8rem;margin-bottom:8px;">${c.title || ''}</p>
                ${c.phone ? `<div style="font-size:0.8rem;margin-bottom:10px;">📞 ${c.phone} ${carrierBadge}</div>` : ''}
                <div style="display:flex;gap:8px;margin-top:auto;">
                  <button class="btn btn-gold btn-sm" onclick="editCommittee('${c.id}')" style="padding:3px 10px;font-size:0.75rem;">✏️ កែ</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteCommittee('${c.id}')" style="padding:3px 8px;font-size:0.75rem;">🗑️ លុប</button>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  container.innerHTML = html;
}

function editCommittee(id) {
  const member = (contentData.committee || []).find(c => c.id === id);
  if (!member) return;
  $('editCommitteeId').value = member.id;
  $('committeeCategory').value = member.category || 'monk';
  if ($('committeeRoleRank')) $('committeeRoleRank').value = member.roleRank || 'root';
  $('committeeName').value = member.name || '';
  $('committeeTitle').value = member.title || '';
  $('committeePhone').value = member.phone || '';
  $('committeeFacebook').value = member.facebook || '';
  $('committeeTelegram').value = member.telegram || '';
  $('committeeImgPreview').src = member.image || 'logo.png';
  $('committeeModalTitle').textContent = 'កែសម្រួលសមាជិកគណៈគ្រប់គ្រង';
  openModal('committeeModal');
}

async function saveCommittee() {
  clearFormErrors('committeeModal');
  const editId = $('editCommitteeId').value;
  const category = $('committeeCategory').value;
  const roleRank = $('committeeRoleRank')?.value || 'root';
  const name = $('committeeName').value.trim();
  const title = $('committeeTitle').value.trim();
  const phone = $('committeePhone').value.trim();
  const facebook = $('committeeFacebook').value.trim();
  const telegram = $('committeeTelegram').value.trim();

  if (!name) {
    markFieldError('committeeName', 'សូមបញ្ចូលឈ្មោះសមាជិក (ត្រង់កន្លែងនេះ)');
    showToast('សូមបញ្ចូលឈ្មោះសមាជិក!', 'error');
    return;
  }

  const form = new FormData();
  form.append('category', category);
  form.append('roleRank', roleRank);
  form.append('name', name);
  form.append('title', title);
  form.append('phone', phone);
  form.append('facebook', facebook);
  form.append('telegram', telegram);

  const imgFile = $('committeeImgFile');
  if (imgFile && imgFile.files && imgFile.files[0]) {
    form.append('image', imgFile.files[0]);
  }

  try {
    const url = editId ? `/api/committee/${editId}` : '/api/committee';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: form });
    if (res.ok) {
      showToast(editId ? 'កែសម្រួលបានជោគជ័យ!' : 'បន្ថែមសមាជិកបានជោគជ័យ!', 'success');
      closeModal('committeeModal');
      loadContent();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការរក្សាទុកទិន្នន័យ', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចផ្ញើទិន្នន័យបាន'), 'error');
  }
}

async function deleteCommittee(id) {
  // Show member name in confirmation so admin knows exactly who will be deleted
  const member = (contentData.committee || []).find(c => c.id === id);
  const memberName = member ? member.name : 'សមាជិក';
  if (!confirm(`⚠️ តើអ្នកពិតជាចង់លុប "${memberName}" ?\n\nការលុបនេះនឹងលុបតែបុគ្គលនោះប៉ុណ្ណោះ។ សមាជិកផ្សេងទៀតនឹងមិនរងប៉ះពាល់ឡើយ។`)) return;
  try {
    const res = await fetch(`/api/committee/${id}`, { method: 'DELETE' });
    if (res.ok) {
      // Optimistic local remove: update contentData immediately before full reload
      if (contentData && contentData.committee) {
        contentData.committee = contentData.committee.filter(c => c.id !== id);
        renderCommittee();
      }
      showToast(`លុប "${memberName}" បានជោគជ័យ!`, 'success');
      // Full reload in background to sync server state
      loadContent();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'កំហុសក្នុងការលុបសមាជិក', 'error');
    }
  } catch (err) {
    showToast('កំហុសក្នុងការតភ្ជាប់៖ ' + (err.message || 'មិនអាចលុបបាន'), 'error');
  }
}

// ===== HELPERS =====
function markFieldError(inputId, message) {
  const input = $(inputId);
  if (!input) return;
  input.classList.add('is-invalid');

  // Find or create field error message element
  let errorEl = input.parentNode.querySelector('.field-error-msg');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'field-error-msg';
    input.parentNode.appendChild(errorEl);
  }
  errorEl.textContent = '⚠️ ' + message;

  // Scroll and focus problematic input
  input.focus();

  // Remove error state when editor edits input
  const clearError = () => {
    input.classList.remove('is-invalid');
    if (errorEl) errorEl.remove();
    input.removeEventListener('input', clearError);
    input.removeEventListener('change', clearError);
  };
  input.addEventListener('input', clearError);
  input.addEventListener('change', clearError);
}

function clearFormErrors(containerId) {
  const container = typeof containerId === 'string' ? $(containerId) : containerId;
  if (!container) return;
  container.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  container.querySelectorAll('.field-error-msg').forEach(el => el.remove());
}

function openModal(id) {
  clearFormErrors(id);
  $(id).classList.add('show');
}

function closeModal(id) {
  clearFormErrors(id);
  $(id).classList.remove('show');
}

function showToast(msg, type = 'success', duration = 4000) {
  const toast = $('toast');
  if (!toast) return;

  let icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span style="font-size:1.1rem;">${icon}</span> <span>${msg}</span>`;
  toast.className = `toast ${type} show`;

  if (window.toastTimer) clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      clearFormErrors(overlay);
      overlay.classList.remove('show');
    }
  });
});
