(function () {
  document.getElementById('year').textContent = new Date().getFullYear();

  const waHeaderBtn = document.getElementById('waHeaderBtn');
  const waFooterLink = document.getElementById('waFooterLink');
  const fabWa = document.getElementById('fabWa');

  const CATEGORIES = ['All', 'Flat', 'Plot', 'Land Share', 'Commercial'];
  let activeCategory = 'All';
  let searchTerm = '';
  let locationTerm = '';
  let sortOrder = 'newest';
  let allListings = [];

  const grid = document.getElementById('listingGrid');
  const catTabs = document.getElementById('catTabs');
  const resultCount = document.getElementById('resultCount');
  const locationFilter = document.getElementById('locationFilter');
  const sortFilter = document.getElementById('sortFilter');
  const searchInput = document.getElementById('searchInput');

  function svgLocation() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
  function svgVideo() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m10 8 6 4-6 4V8Z"/></svg>';
  }

  function applySiteSettings(s) {
    document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = s.siteName; });
    document.querySelectorAll('[data-site-tagline]').forEach(el => { el.textContent = s.tagline; });
    document.querySelectorAll('[data-site-logo]').forEach(el => { if (s.logoUrl) el.src = s.logoUrl; });
    document.querySelectorAll('[data-hero-eyebrow]').forEach(el => { el.textContent = s.heroEyebrow; });
    document.querySelectorAll('[data-hero-title]').forEach(el => { el.textContent = s.heroTitle; });
    document.querySelectorAll('[data-hero-description]').forEach(el => { el.textContent = s.heroDescription; });
    document.querySelectorAll('[data-footer-text]').forEach(el => { el.textContent = s.footerText; });

    const defaultWaLink = waLink(s.whatsappMessage, s.whatsappNumber);
    if (waHeaderBtn) waHeaderBtn.href = defaultWaLink;
    if (fabWa) fabWa.href = defaultWaLink;
    if (waFooterLink) {
      waFooterLink.href = defaultWaLink;
      waFooterLink.textContent = 'WhatsApp: ' + s.whatsappNumber;
    }

    const fbLink = document.getElementById('footerFacebookLink');
    if (fbLink) {
      if (s.facebookUrl) { fbLink.href = s.facebookUrl; fbLink.style.display = ''; }
      else { fbLink.style.display = 'none'; }
    }
    const footerAddr = document.getElementById('footerAddress');
    if (footerAddr) {
      if (s.footerAddress) { footerAddr.textContent = s.footerAddress; footerAddr.style.display = ''; }
      else { footerAddr.style.display = 'none'; }
    }

    document.title = `${s.siteName} — Flats, Plots & Commercial Listings in Dhaka`;
  }

  function renderTabs(listings) {
    catTabs.innerHTML = CATEGORIES.map(cat => {
      const count = cat === 'All' ? listings.length : listings.filter(p => p.category === cat).length;
      const activeCls = cat === activeCategory ? ' active' : '';
      return `<button class="cat-tab${activeCls}" data-cat="${cat}">${cat} <span class="count">(${count})</span></button>`;
    }).join('');

    catTabs.querySelectorAll('.cat-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderFiltered();
      });
    });
  }

  function renderLocationOptions(listings) {
    const current = locationFilter.value;
    const locs = [...new Set(listings.map(p => p.location).filter(Boolean))].sort();
    locationFilter.innerHTML = '<option value="">All locations</option>' +
      locs.map(l => `<option value="${l}">${l}</option>`).join('');
    locationFilter.value = current;
  }

  function cardHtml(p) {
    const img = (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
    return `
    <article class="card">
      <div class="card-media" data-goto="${p.id}">
        <img src="${img}" alt="${p.title}" loading="lazy">
        ${p.featured ? '<span class="badge">Featured</span>' : ''}
        <span class="badge-type">${p.category}</span>
        ${p.videoUrl ? `<span class="badge-video">${svgVideo()} Video Tour</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-location">${svgLocation()} ${p.location}</div>
        <div class="card-title" data-goto="${p.id}">${p.title}</div>
        <div class="card-price">৳ ${p.price}</div>
        <div class="card-meta">
          <div class="m"><div class="v">${p.size}</div><div class="k">Size</div></div>
          <div class="m"><div class="v">${p.beds}</div><div class="k">Beds</div></div>
          <div class="m"><div class="v">${p.baths}</div><div class="k">Baths</div></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-outline btn-sm btn-block" data-goto="${p.id}">View details</button>
        </div>
      </div>
    </article>`;
  }

  function applyFilters(all) {
    let list = [...all];
    if (activeCategory !== 'All') list = list.filter(p => p.category === activeCategory);
    if (locationTerm) list = list.filter(p => p.location === locationTerm);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter(p => (p.title || '').toLowerCase().includes(t) || (p.location || '').toLowerCase().includes(t));
    }
    list.sort((a, b) => sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
    return list;
  }

  function renderFiltered() {
    renderTabs(allListings);
    renderLocationOptions(allListings);

    const filtered = applyFilters(allListings);
    resultCount.textContent = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <h3>No properties match your filters</h3>
        <p>Try a different category, location, or search term.</p>
      </div>`;
      return;
    }

    grid.innerHTML = filtered.map(cardHtml).join('');
    grid.querySelectorAll('[data-goto]').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = `property.html?id=${el.dataset.goto}`;
      });
    });
  }

  async function init() {
    // Site settings (header/hero/footer) — falls back to defaults if it fails.
    try {
      const settings = await EP.getSettings();
      applySiteSettings(settings);
    } catch (e) {
      applySiteSettings(DEFAULT_SETTINGS);
    }

    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Loading properties…</h3></div>`;
    try {
      allListings = await EP.getAll();
    } catch (e) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <h3>Could not load listings</h3>
        <p>Please refresh the page. If this keeps happening, check your internet connection.</p>
      </div>`;
      return;
    }

    document.getElementById('statTotal').textContent = allListings.length;
    document.getElementById('statFeatured').textContent = allListings.filter(p => p.featured).length;
    document.getElementById('statVideo').textContent = allListings.filter(p => p.videoUrl).length;

    renderFiltered();
  }

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderFiltered();
  });
  locationFilter.addEventListener('change', (e) => {
    locationTerm = e.target.value;
    renderFiltered();
  });
  sortFilter.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    renderFiltered();
  });

  init();
})();
