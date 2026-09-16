(function () {
  document.getElementById('year').textContent = new Date().getFullYear();

  const waHeaderBtn = document.getElementById('waHeaderBtn');
  const waFooterLink = document.getElementById('waFooterLink');
  const fabWa = document.getElementById('fabWa');
  const root = document.getElementById('detailRoot');

  function svgLocation() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }

  // Accepts a plain YouTube/Facebook link OR an already-embeddable link
  // and returns something safe to drop into an <iframe src="">.
  function toEmbedUrl(url) {
    if (!url) return '';
    url = url.trim();
    const yt1 = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/)([\w-]+)/);
    const yt2 = url.match(/youtu\.be\/([\w-]+)/);
    const ytId = (yt1 && yt1[1]) || (yt2 && yt2[1]);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    if (url.includes('facebook.com') && !url.includes('/plugins/video.php')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
    }
    return url; // already an embed link (YouTube /embed/, Facebook plugin, Vimeo player, etc.)
  }

  function fallbackImg() {
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80';
  }

  function renderDetail(p) {
    document.title = `${p.title} — ${siteSettings.siteName}`;
    document.getElementById('crumbCat').textContent = p.category;
    document.getElementById('crumbTitle').textContent = p.title;

    const images = (p.images && p.images.length) ? p.images : [fallbackImg()];
    const embed = toEmbedUrl(p.videoUrl);

    root.innerHTML = `
      <div class="detail-layout">
        <div class="detail-main">
          <div class="gallery-main">
            <img id="galleryMainImg" src="${images[0]}" alt="${p.title}">
          </div>
          ${images.length > 1 ? `
          <div class="gallery-thumbs" id="galleryThumbs">
            ${images.map((src, i) => `<img src="${src}" data-i="${i}" class="${i === 0 ? 'active' : ''}" alt="Photo ${i + 1}">`).join('')}
          </div>` : ''}

          ${embed ? `
          <div class="video-embed">
            <h3>Video tour</h3>
            <div class="video-frame">
              <iframe src="${embed}" title="Video tour" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
            </div>
          </div>` : ''}

          <div class="detail-description">
            <h3>About this property</h3>
            <p>${(p.description || 'No description provided yet.').replace(/</g, '&lt;')}</p>
          </div>

          <div class="back-cta">
            <p>Want to see more listings like this one?</p>
            <a href="index.html" class="btn btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              See Other Properties
            </a>
          </div>
        </div>

        <aside class="detail-sidebar">
          <div class="price-card">
            <span class="type-pill">${p.category}</span>
            <h1>${p.title}</h1>
            <div class="loc">${svgLocation()} ${p.location || 'Location not specified'}</div>
            <div class="price">৳ ${p.price || 'Contact for price'}</div>
            <div class="spec-grid">
              <div class="s"><div class="v">${p.size || '—'}</div><div class="k">Size</div></div>
              <div class="s"><div class="v">${p.beds || 'N/A'}</div><div class="k">Beds</div></div>
              <div class="s"><div class="v">${p.baths || 'N/A'}</div><div class="k">Baths</div></div>
            </div>
            <div class="sidebar-actions">
              <a id="waDetailBtn" class="btn btn-whatsapp btn-block" target="_blank" rel="noopener">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.93L2 22l5.29-1.38a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.78 14.1c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.61-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.09.99-2.37c.26-.29.57-.36.76-.36h.55c.18 0 .42-.03.65.5.24.55.81 1.9.88 2.04.07.14.11.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.55.73 1.81.86.26.14.44.2.5.31.07.11.07.65-.17 1.33Z"/></svg>
                Ask about this property
              </a>
            </div>
          </div>
        </aside>
      </div>
    `;

    const waMsg = waLink(`Hi, I'm interested in "${p.title}" (${p.location}) listed on ${siteSettings.siteName}. Is it still available?`, siteSettings.whatsappNumber);
    document.getElementById('waDetailBtn').href = waMsg;

    const thumbs = document.getElementById('galleryThumbs');
    if (thumbs) {
      thumbs.querySelectorAll('img').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          document.getElementById('galleryMainImg').src = images[thumb.dataset.i];
          thumbs.querySelectorAll('img').forEach((t) => t.classList.remove('active'));
          thumb.classList.add('active');
        });
      });
    }
  }

  function renderNotFound() {
    root.innerHTML = `
      <div class="empty-state" style="padding:80px 0;text-align:center">
        <h3>This listing isn't available</h3>
        <p>It may have been removed or the link is incorrect.</p>
        <a href="index.html" class="btn btn-outline" style="margin-top:16px;display:inline-flex">See Other Properties</a>
      </div>`;
  }

  let siteSettings = DEFAULT_SETTINGS;

  function applySiteSettings(s) {
    siteSettings = s;
    document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = s.siteName; });
    document.querySelectorAll('[data-site-tagline]').forEach(el => { el.textContent = s.tagline; });
    document.querySelectorAll('[data-site-logo]').forEach(el => { if (s.logoUrl) el.src = s.logoUrl; });
    document.querySelectorAll('[data-footer-text]').forEach(el => { el.textContent = s.footerText; });

    const defaultWaLink = waLink(s.whatsappMessage, s.whatsappNumber);
    waHeaderBtn.href = defaultWaLink;
    fabWa.href = defaultWaLink;
    waFooterLink.href = defaultWaLink;
    waFooterLink.textContent = 'WhatsApp: ' + s.whatsappNumber;

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
  }

  async function init() {
    try {
      applySiteSettings(await EP.getSettings());
    } catch (e) {
      applySiteSettings(DEFAULT_SETTINGS);
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    root.innerHTML = `<div class="empty-state" style="padding:80px 0;text-align:center"><h3>Loading…</h3></div>`;

    try {
      const p = id ? await EP.getById(id) : null;
      if (!p) return renderNotFound();
      renderDetail(p);
    } catch (e) {
      root.innerHTML = `<div class="empty-state" style="padding:80px 0;text-align:center"><h3>Could not load this listing</h3><p>Please refresh the page.</p></div>`;
    }
  }

  init();
})();
