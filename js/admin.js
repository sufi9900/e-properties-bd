(function () {
  const loginView = document.getElementById('loginView');
  const adminView = document.getElementById('adminView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const form = document.getElementById('listingForm');
  const formTitle = document.getElementById('formTitle');
  const formError = document.getElementById('formError');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const listingRows = document.getElementById('listingRows');
  const listingCount = document.getElementById('listingCount');
  const toast = document.getElementById('toast');

  const imageList = document.getElementById('imageList');
  const imageFileInput = document.getElementById('imageFileInput');
  const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
  const addImageUrlBtn = document.getElementById('addImageUrlBtn');
  const uploadHint = document.getElementById('uploadHint');

  const settingsForm = document.getElementById('settingsForm');
  const settingsError = document.getElementById('settingsError');
  const settingsSaveBtn = document.getElementById('settingsSaveBtn');
  const logoFileInput = document.getElementById('logoFileInput');
  const uploadLogoBtn = document.getElementById('uploadLogoBtn');
  const logoPreviewWrap = document.getElementById('logoPreviewWrap');

  let images = [];
  let editingId = null;
  let listingsCache = [];
  let currentLogoUrl = '';
  let settingsLoaded = false;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function showLogin(errorMsg) {
    adminView.style.display = 'none';
    loginView.style.display = 'flex';
    if (errorMsg) {
      loginError.textContent = errorMsg;
      loginError.classList.add('show');
    } else {
      loginError.classList.remove('show');
    }
  }

  function showAdmin() {
    loginView.style.display = 'none';
    adminView.style.display = 'block';
  }

  function handleAuthError() {
    showLogin('Your session expired. Please log in again.');
  }

  // ---------- Tabs ----------

  document.getElementById('adminTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-tab');
    if (!btn) return;
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('tab-listings').style.display = btn.dataset.tab === 'listings' ? '' : 'none';
    document.getElementById('tab-settings').style.display = btn.dataset.tab === 'settings' ? '' : 'none';
    if (btn.dataset.tab === 'settings' && !settingsLoaded) loadSettings();
  });

  // ---------- Login ----------

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPassword').value;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Checking…';
    try {
      await EP.login(email, pw);
      showAdmin();
      await loadListings();
    } catch (err) {
      loginError.textContent = 'ভুল ইমেইল বা পাসওয়ার্ড। আবার চেষ্টা করুন।';
      loginError.classList.add('show');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log in';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await EP.logout();
    showLogin();
  });

  // ---------- Image list UI (listing photos) ----------

  function renderImageList() {
    imageList.innerHTML = images.map((url, i) => `
      <div class="image-url-row">
        <img src="${url}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:4px;flex-shrink:0;">
        <input type="text" value="${url}" readonly>
        <button type="button" class="icon-btn" data-remove="${i}" title="Remove photo">✕</button>
      </div>
    `).join('');
    imageList.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        images.splice(Number(btn.dataset.remove), 1);
        renderImageList();
      });
    });
  }

  uploadPhotoBtn.addEventListener('click', () => imageFileInput.click());

  imageFileInput.addEventListener('change', async () => {
    const files = Array.from(imageFileInput.files || []);
    if (!files.length) return;
    uploadHint.textContent = `Uploading ${files.length} photo(s)…`;
    for (const file of files) {
      try {
        const url = await EP.uploadImage(file);
        images.push(url);
        renderImageList();
      } catch (err) {
        if (err.message === 'UNAUTHORIZED') return handleAuthError();
        showToast('Upload failed: ' + err.message);
      }
    }
    uploadHint.textContent = '';
    imageFileInput.value = '';
  });

  addImageUrlBtn.addEventListener('click', () => {
    const url = window.prompt('Paste an image URL:');
    if (url && url.trim()) {
      images.push(url.trim());
      renderImageList();
    }
  });

  // ---------- Listing form ----------

  function resetForm() {
    editingId = null;
    images = [];
    form.reset();
    renderImageList();
    formTitle.textContent = 'Add a new listing';
    saveBtn.textContent = 'Save listing';
    cancelBtn.style.display = 'none';
    formError.classList.remove('show');
  }

  function fillForm(p) {
    editingId = p.id;
    document.getElementById('f_title').value = p.title || '';
    document.getElementById('f_category').value = p.category || 'Flat';
    document.getElementById('f_location').value = p.location || '';
    document.getElementById('f_price').value = p.price || '';
    document.getElementById('f_size').value = p.size || '';
    document.getElementById('f_beds').value = p.beds || '';
    document.getElementById('f_baths').value = p.baths || '';
    document.getElementById('f_video').value = p.videoUrl || '';
    document.getElementById('f_description').value = p.description || '';
    document.getElementById('f_featured').checked = Boolean(p.featured);
    images = Array.isArray(p.images) ? [...p.images] : [];
    renderImageList();
    formTitle.textContent = 'Edit listing';
    saveBtn.textContent = 'Update listing';
    cancelBtn.style.display = 'block';
    formError.classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelBtn.addEventListener('click', resetForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');

    const data = {
      title: document.getElementById('f_title').value.trim(),
      category: document.getElementById('f_category').value,
      location: document.getElementById('f_location').value.trim(),
      price: document.getElementById('f_price').value.trim(),
      size: document.getElementById('f_size').value.trim(),
      beds: document.getElementById('f_beds').value.trim() || 'N/A',
      baths: document.getElementById('f_baths').value.trim() || 'N/A',
      videoUrl: document.getElementById('f_video').value.trim(),
      description: document.getElementById('f_description').value.trim(),
      featured: document.getElementById('f_featured').checked,
      images
    };

    if (!data.title) {
      formError.textContent = 'Please enter a title.';
      formError.classList.add('show');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      if (editingId) {
        await EP.update(editingId, data);
        showToast('Listing updated.');
      } else {
        await EP.create(data);
        showToast('Listing added.');
      }
      resetForm();
      await loadListings();
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') return handleAuthError();
      formError.textContent = err.message || 'Something went wrong. Please try again.';
      formError.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = editingId ? 'Update listing' : 'Save listing';
    }
  });

  // ---------- Listings table ----------

  function renderListingRows() {
    listingCount.textContent = listingsCache.length;
    if (!listingsCache.length) {
      listingRows.innerHTML = `<p class="sub">No listings yet. Add your first one on the left.</p>`;
      return;
    }
    listingRows.innerHTML = listingsCache.map((p) => `
      <div class="listing-row">
        <img src="${(p.images && p.images[0]) || ''}" alt="">
        <div class="info">
          <div class="t">${p.title}</div>
          <div class="m">${p.category} · ${p.location || 'No location'}</div>
        </div>
        <div class="actions">
          <button class="btn btn-outline btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
        </div>
      </div>
    `).join('');

    listingRows.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = listingsCache.find((x) => x.id === btn.dataset.edit);
        if (p) fillForm(p);
      });
    });
    listingRows.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const p = listingsCache.find((x) => x.id === btn.dataset.delete);
        if (!p) return;
        if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
        try {
          await EP.remove(p.id);
          showToast('Listing deleted.');
          if (editingId === p.id) resetForm();
          await loadListings();
        } catch (err) {
          if (err.message === 'UNAUTHORIZED') return handleAuthError();
          showToast('Could not delete: ' + err.message);
        }
      });
    });
  }

  async function loadListings() {
    listingsCache = await EP.getAll(true);
    renderListingRows();
  }

  // ---------- Website Settings ----------

  function renderLogoPreview() {
    logoPreviewWrap.innerHTML = currentLogoUrl ? `
      <div class="image-url-row">
        <img src="${currentLogoUrl}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:4px;flex-shrink:0;">
        <input type="text" value="${currentLogoUrl}" readonly>
      </div>` : `<div class="hint">এখনো কোনো লোগো আপলোড করা হয়নি — ডিফল্ট লোগো ব্যবহার হচ্ছে।</div>`;
  }

  function fillSettingsForm(s) {
    document.getElementById('s_siteName').value = s.siteName || '';
    document.getElementById('s_tagline').value = s.tagline || '';
    document.getElementById('s_heroEyebrow').value = s.heroEyebrow || '';
    document.getElementById('s_heroTitle').value = s.heroTitle || '';
    document.getElementById('s_heroDescription').value = s.heroDescription || '';
    document.getElementById('s_whatsappNumber').value = s.whatsappNumber || '';
    document.getElementById('s_whatsappMessage').value = s.whatsappMessage || '';
    document.getElementById('s_footerText').value = s.footerText || '';
    document.getElementById('s_footerAddress').value = s.footerAddress || '';
    document.getElementById('s_facebookUrl').value = s.facebookUrl || '';
    currentLogoUrl = s.logoUrl || '';
    renderLogoPreview();
  }

  async function loadSettings() {
    try {
      const s = await EP.getSettings(true);
      fillSettingsForm(s);
      settingsLoaded = true;
    } catch (err) {
      showToast('Could not load website settings.');
    }
  }

  uploadLogoBtn.addEventListener('click', () => logoFileInput.click());
  logoFileInput.addEventListener('change', async () => {
    const file = (logoFileInput.files || [])[0];
    if (!file) return;
    try {
      currentLogoUrl = await EP.uploadImage(file);
      renderLogoPreview();
      showToast('Logo uploaded. Now click "Save settings" to apply it.');
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') return handleAuthError();
      showToast('Logo upload failed: ' + err.message);
    } finally {
      logoFileInput.value = '';
    }
  });

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    settingsError.classList.remove('show');

    const data = {
      siteName: document.getElementById('s_siteName').value.trim(),
      tagline: document.getElementById('s_tagline').value.trim(),
      logoUrl: currentLogoUrl,
      heroEyebrow: document.getElementById('s_heroEyebrow').value.trim(),
      heroTitle: document.getElementById('s_heroTitle').value.trim(),
      heroDescription: document.getElementById('s_heroDescription').value.trim(),
      whatsappNumber: document.getElementById('s_whatsappNumber').value.trim(),
      whatsappMessage: document.getElementById('s_whatsappMessage').value.trim(),
      footerText: document.getElementById('s_footerText').value.trim(),
      footerAddress: document.getElementById('s_footerAddress').value.trim(),
      facebookUrl: document.getElementById('s_facebookUrl').value.trim()
    };

    settingsSaveBtn.disabled = true;
    settingsSaveBtn.textContent = 'Saving…';
    try {
      await EP.updateSettings(data);
      showToast('Website settings updated.');
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') return handleAuthError();
      settingsError.textContent = err.message || 'Something went wrong. Please try again.';
      settingsError.classList.add('show');
    } finally {
      settingsSaveBtn.disabled = false;
      settingsSaveBtn.textContent = 'Save settings';
    }
  });

  // ---------- Boot ----------

  async function init() {
    resetForm();
    EP.onAuthChange((session) => {
      if (!session) showLogin();
    });
    const session = await EP.getSession();
    if (!session) return showLogin();
    try {
      showAdmin();
      await loadListings();
    } catch (e) {
      showLogin('Could not reach the server. Please try again.');
    }
  }

  init();
})();
