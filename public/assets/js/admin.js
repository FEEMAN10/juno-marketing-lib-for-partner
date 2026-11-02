/* Juno Markets — Campaign Admin */
(() => {
  const RATIOS = [
    { ratio: '9:16', dims: '1080 × 1920', required: true },
    { ratio: '4:5', dims: '1080 × 1350', required: false },
    { ratio: '1:1', dims: '1080 × 1080', required: false },
    { ratio: '16:9', dims: '1920 × 1080', required: false },
    { ratio: '1.91:1', dims: '1200 × 628', required: false },
  ];

  // Campaign content languages. 'en' is the base (required); others optional.
  const CONTENT_LANGS = [
    { code: 'en', label: 'English', base: true, rtl: false },
    { code: 'ru', label: 'Русский', rtl: false },
    { code: 'th', label: 'ไทย', rtl: false },
    { code: 'id', label: 'Bahasa Indonesia', rtl: false },
    { code: 'ar', label: 'العربية', rtl: true },
    { code: 'zh', label: '简体中文', rtl: false },
  ];

  const KEY_STORAGE = 'juno_admin_key';
  const $ = (id) => document.getElementById(id);
  let adminKey = sessionStorage.getItem(KEY_STORAGE) || '';
  // visuals[ratio] = { assetId, url, filename, contentType }
  let visuals = {};
  // content[lang] = { title, description }  (lang === 'en' is the base)
  let content = {};
  let activeLang = 'en';
  // Set of language codes this campaign is shown to (default: all).
  let visibleLangs = new Set(CONTENT_LANGS.map((l) => l.code));

  /* -------------------- API -------------------- */
  function authHeaders(extra = {}) {
    return { authorization: `Bearer ${adminKey}`, ...extra };
  }

  async function api(path, options = {}) {
    const res = await fetch(path, options);
    let data = {};
    try {
      data = await res.json();
    } catch {
      /* non-json */
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  /* -------------------- Auth flow -------------------- */
  async function tryLogin(key) {
    // Validate the key against an admin-only endpoint.
    const res = await fetch('/api/campaigns?all=1', { headers: { authorization: `Bearer ${key}` } });
    if (res.status === 401) throw new Error('Incorrect admin key.');
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Server error.');
    }
    return res.json();
  }

  function showAdmin() {
    $('loginView').hidden = true;
    $('adminView').hidden = false;
    $('logoutBtn').hidden = false;
    resetContent();
    renderSlots();
    loadCampaigns();
  }

  function logout() {
    sessionStorage.removeItem(KEY_STORAGE);
    adminKey = '';
    location.reload();
  }

  /* -------------------- Content languages (title + description) -------------------- */
  function emptyContent() {
    const c = {};
    CONTENT_LANGS.forEach((l) => { c[l.code] = { title: '', description: '', landingPageUrl: '' }; });
    return c;
  }

  function isValidUrl(u) {
    try {
      const p = new URL(String(u));
      return p.protocol === 'http:' || p.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function resetContent() {
    content = emptyContent();
    activeLang = 'en';
    renderLangTabs();
    loadLangIntoInputs('en');
    visibleLangs = new Set(CONTENT_LANGS.map((l) => l.code));
    renderVisibility();
  }

  /* -------------------- Per-language visibility -------------------- */
  function renderVisibility() {
    const wrap = $('langVisibility');
    wrap.innerHTML = '';
    CONTENT_LANGS.forEach((l) => {
      const on = visibleLangs.has(l.code);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vis-chip' + (on ? ' on' : '');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.innerHTML = `<span class="vis-dot" aria-hidden="true">${on ? '✓' : ''}</span>${escapeHtml(l.label)}`;
      btn.addEventListener('click', () => {
        if (visibleLangs.has(l.code)) visibleLangs.delete(l.code);
        else visibleLangs.add(l.code);
        renderVisibility();
      });
      wrap.appendChild(btn);
    });
  }

  function langHasContent(code) {
    const v = content[code];
    return !!(v && (v.title.trim() || v.description.trim() || (v.landingPageUrl || '').trim()));
  }

  function renderLangTabs() {
    const wrap = $('langTabs');
    wrap.innerHTML = '';
    CONTENT_LANGS.forEach((l) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-tab' + (l.code === activeLang ? ' active' : '');
      const filled = l.base || langHasContent(l.code);
      btn.innerHTML = `${escapeHtml(l.label)}${filled && l.code !== 'en' ? '<span class="dot"></span>' : ''}`;
      btn.addEventListener('click', () => switchLang(l.code));
      wrap.appendChild(btn);
    });
  }

  function stashInputsToActive() {
    content[activeLang] = {
      title: $('fTitle').value,
      description: $('fDesc').value,
      landingPageUrl: $('fLanding').value,
    };
  }

  function loadLangIntoInputs(code) {
    const meta = CONTENT_LANGS.find((l) => l.code === code);
    const v = content[code] || { title: '', description: '', landingPageUrl: '' };
    $('fTitle').value = v.title;
    $('fDesc').value = v.description;
    $('fLanding').value = v.landingPageUrl || '';
    // English is required; other languages fall back to it.
    const req = code === 'en' ? '' : 'none';
    $('titleReq').style.display = req;
    $('landingReq').style.display = req;
    const dir = meta && meta.rtl ? 'rtl' : 'ltr';
    $('fTitle').dir = dir;
    $('fDesc').dir = dir;
    $('fLanding').dir = 'ltr'; // URLs are always left-to-right
    $('contentHint').textContent =
      code === 'en'
        ? 'Title, description and landing page partners see. English is required; other languages are optional and fall back to English.'
        : `Optional ${meta ? meta.label : code} translation. Leave any field blank to fall back to English.`;
  }

  function switchLang(code) {
    if (code === activeLang) return;
    stashInputsToActive();
    activeLang = code;
    loadLangIntoInputs(code);
    renderLangTabs();
  }

  /* -------------------- Visual slots -------------------- */
  function renderSlots() {
    const wrap = $('slots');
    wrap.innerHTML = '';
    RATIOS.forEach((r) => {
      const filled = !!visuals[r.ratio];
      const slot = document.createElement('div');
      slot.className = 'slot' + (filled ? ' filled' : '') + (r.required ? ' required' : '');
      slot.innerHTML = `
        <div class="slot__ratio">${r.ratio}</div>
        <div class="slot__dims">${r.dims}</div>
        <img class="slot__preview" alt="" ${filled ? `src="${visuals[r.ratio].url}"` : ''} />
        <label class="slot__btn">${filled ? 'Replace' : 'Upload'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>
        ${filled ? '<span class="slot__remove">Remove</span>' : ''}`;
      const input = slot.querySelector('input[type="file"]');
      input.addEventListener('change', (e) => handleUpload(e, r.ratio));
      const remove = slot.querySelector('.slot__remove');
      if (remove) remove.addEventListener('click', () => { delete visuals[r.ratio]; renderSlots(); });
      wrap.appendChild(slot);
    });
  }

  function fileToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /* Netlify sync functions reject request bodies over ~6 MB (HTTP 413), and we
   * upload images base64-encoded (~+33%). So large images are downscaled and
   * recompressed in the browser first to keep the payload comfortably under
   * that limit. Small originals are sent untouched for best fidelity. */
  const UPLOAD_TARGET_BYTES = 3.8 * 1024 * 1024; // raw bytes before base64
  const UPLOAD_MAX_EDGE = 2000; // px — plenty for social creatives (9:16 ≈ 1080×1920)

  function loadImageEl(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image file')); };
      img.src = url;
    });
  }
  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image encode failed'))), type, quality));
  }
  function canvasHasAlpha(ctx, w, h) {
    const data = ctx.getImageData(0, 0, w, h).data;
    const step = Math.max(4, Math.floor(data.length / 400000) * 4); // sample for speed
    for (let i = 3; i < data.length; i += step) if (data[i] < 250) return true;
    return false;
  }

  async function prepareImage(file) {
    if (file.size <= UPLOAD_TARGET_BYTES) {
      return { blob: file, contentType: file.type, filename: file.name };
    }
    const img = await loadImageEl(file);
    const scale = Math.min(1, UPLOAD_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // Keep transparency (WebP) only when the source actually has it; else JPEG.
    const type = /png|webp/i.test(file.type) && canvasHasAlpha(ctx, w, h) ? 'image/webp' : 'image/jpeg';
    let quality = 0.92;
    let blob = await canvasToBlob(canvas, type, quality);
    while (blob.size > UPLOAD_TARGET_BYTES && quality > 0.5) {
      quality = Math.round((quality - 0.1) * 100) / 100;
      blob = await canvasToBlob(canvas, type, quality);
    }
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return { blob, contentType: type, filename: `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}` };
  }

  async function handleUpload(e, ratio) {
    const file = e.target.files?.[0];
    if (!file) return;
    const slot = e.target.closest('.slot');
    const btn = slot.querySelector('.slot__btn');
    const label = btn.firstChild.nodeValue;
    btn.firstChild.nodeValue = 'Uploading… ';
    try {
      const prepared = await prepareImage(file);
      const dataBase64 = await fileToBase64(prepared.blob);
      // Final guard: stay under Netlify's ~6 MB request-body limit.
      if (dataBase64.length > 5.6 * 1024 * 1024) {
        throw new Error('Image is too large even after optimizing — please resize it and try again.');
      }
      const data = await api('/api/upload', {
        method: 'POST',
        headers: authHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ filename: prepared.filename, contentType: prepared.contentType, dataBase64 }),
      });
      visuals[ratio] = { assetId: data.assetId, url: data.url, filename: data.filename, contentType: data.contentType };
      renderSlots();
      toast(`${ratio} visual uploaded`);
    } catch (err) {
      btn.firstChild.nodeValue = label;
      toast(err.message || 'Upload failed', true);
    }
  }

  /* -------------------- Campaign CRUD -------------------- */
  async function loadCampaigns() {
    const list = $('adminList');
    list.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
    try {
      const data = await api('/api/campaigns?all=1', { headers: authHeaders() });
      renderList(data.campaigns || []);
    } catch (err) {
      list.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderList(campaigns) {
    allCampaigns = campaigns;
    const list = $('adminList');
    if (!campaigns.length) {
      list.innerHTML = '<div class="empty">No campaigns yet. Create your first one on the left.</div>';
      return;
    }
    list.innerHTML = '';
    const allCodes = CONTENT_LANGS.map((l) => l.code);
    campaigns.forEach((c) => {
      const thumb = (c.visuals || []).find((v) => v.ratio === '9:16')?.url || (c.visuals || [])[0]?.url;
      const vis = Array.isArray(c.visibleLanguages) && c.visibleLanguages.length ? c.visibleLanguages : allCodes;
      const visNote = vis.length < allCodes.length ? ` · 🌐 ${vis.map((x) => x.toUpperCase()).join(' ')}` : '';
      const row = document.createElement('div');
      row.className = 'camp-item';
      row.style.cursor = 'default';
      row.innerHTML = `
        ${thumb ? `<img class="camp-thumb" src="${thumb}" alt="" />` : '<div class="camp-thumb"></div>'}
        <div class="camp-meta grow">
          <strong>${escapeHtml(c.title)}
            <span class="badge ${c.status === 'published' ? 'badge--live' : 'badge--draft'}">${c.status}</span>
          </strong>
          <span>${escapeHtml(c.utmCampaign)} · ${(c.visuals || []).length} visual(s)${escapeHtml(visNote)}</span>
        </div>`;
      const actions = document.createElement('div');
      actions.className = 'row';
      actions.style.gap = '6px';
      const edit = mkBtn('Edit', 'btn--sm', () => editCampaign(c));
      const del = mkBtn('Delete', 'btn--sm btn--danger', () => deleteCampaign(c));
      actions.append(edit, del);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function mkBtn(text, cls, onClick) {
    const b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  function editCampaign(c) {
    $('campId').value = c.id;
    $('fUtm').value = c.utmCampaign;
    $('fStatus').value = c.status;

    // Load per-language content: English from the base fields, others from translations.
    content = emptyContent();
    content.en = { title: c.title || '', description: c.description || '', landingPageUrl: c.landingPageUrl || '' };
    const tr = c.translations || {};
    CONTENT_LANGS.forEach((l) => {
      if (l.code !== 'en' && tr[l.code]) {
        content[l.code] = {
          title: tr[l.code].title || '',
          description: tr[l.code].description || '',
          landingPageUrl: tr[l.code].landingPageUrl || '',
        };
      }
    });
    activeLang = 'en';
    renderLangTabs();
    loadLangIntoInputs('en');

    // Visibility: absent → shown to all languages (backward-compatible).
    const all = CONTENT_LANGS.map((l) => l.code);
    visibleLangs = new Set(
      Array.isArray(c.visibleLanguages) && c.visibleLanguages.length ? c.visibleLanguages : all
    );
    renderVisibility();

    visuals = {};
    (c.visuals || []).forEach((v) => { visuals[v.ratio] = v; });
    $('editorTitle').textContent = 'Edit campaign';
    renderSlots();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    $('campForm').reset();
    $('campId').value = '';
    visuals = {};
    resetContent();
    $('editorTitle').textContent = 'New campaign';
    $('formErr').textContent = '';
    renderSlots();
  }

  async function deleteCampaign(c) {
    if (!confirm(`Delete “${c.title}”? This cannot be undone.`)) return;
    try {
      await api(`/api/campaigns?id=${encodeURIComponent(c.id)}`, { method: 'DELETE', headers: authHeaders() });
      toast('Campaign deleted');
      if ($('campId').value === c.id) resetForm();
      loadCampaigns();
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function saveCampaign(e) {
    e.preventDefault();
    $('formErr').textContent = '';
    stashInputsToActive(); // capture whatever language is currently in the inputs

    if (!content.en.title.trim()) {
      $('formErr').textContent = 'An English campaign title is required.';
      switchLang('en');
      return;
    }
    if (!isValidUrl(content.en.landingPageUrl)) {
      $('formErr').textContent = 'A valid English landing page URL is required.';
      switchLang('en');
      return;
    }
    if (!visuals['9:16']) {
      $('formErr').textContent = 'A 9:16 portrait key visual is required.';
      return;
    }
    if (visibleLangs.size === 0) {
      $('formErr').textContent = 'Select at least one language under “Show to languages”.';
      return;
    }

    const translations = {};
    CONTENT_LANGS.forEach((l) => {
      if (l.code === 'en') return;
      const title = content[l.code].title.trim();
      const description = content[l.code].description.trim();
      const landingPageUrl = content[l.code].landingPageUrl.trim();
      if (title || description || landingPageUrl) translations[l.code] = { title, description, landingPageUrl };
    });

    const id = $('campId').value;
    const payload = {
      id: id || undefined,
      title: content.en.title.trim(),
      description: content.en.description.trim(),
      landingPageUrl: content.en.landingPageUrl.trim(),
      translations,
      utmCampaign: $('fUtm').value.trim(),
      status: $('fStatus').value,
      visibleLanguages: CONTENT_LANGS.map((l) => l.code).filter((c) => visibleLangs.has(c)),
      visuals: Object.entries(visuals).map(([ratio, v]) => ({ ratio, ...v })),
    };
    const btn = $('saveBtn');
    btn.disabled = true;
    const original = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Saving…';
    try {
      await api('/api/campaigns', {
        method: id ? 'PUT' : 'POST',
        headers: authHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      toast(id ? 'Campaign updated' : 'Campaign created');
      resetForm();
      loadCampaigns();
    } catch (err) {
      $('formErr').textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  /* -------------------- Toast + utils -------------------- */
  function toast(msg, isErr) {
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  /* -------------------- View switching + analytics -------------------- */
  let allCampaigns = [];
  const LANG_LABEL = { en: 'English', ru: 'Русский', th: 'ไทย', id: 'Bahasa Indonesia', ar: 'العربية', zh: '简体中文', unknown: 'Unknown' };

  function showView(view) {
    const analytics = view === 'analytics';
    $('campaignsView').hidden = analytics;
    $('analyticsView').hidden = !analytics;
    $('navCampaigns').classList.toggle('is-active', !analytics);
    $('navAnalytics').classList.toggle('is-active', analytics);
    $('adminHeading').textContent = analytics ? 'Analytics' : 'Campaigns';
    $('adminSubhead').textContent = analytics
      ? 'Clicks on the short links partners create and share. Updated in real time.'
      : 'Create the campaigns partners can promote. Each needs a landing page URL, a utm_campaign value, and at minimum a 9:16 portrait key visual.';
    if (analytics) loadAnalytics();
  }

  async function loadAnalytics() {
    const body = $('analyticsBody');
    body.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
    try {
      const data = await api('/api/analytics', { headers: authHeaders() });
      renderAnalytics(data.summary || {});
    } catch (err) {
      body.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
    }
  }

  function campaignTitle(slug) {
    const c = allCampaigns.find((x) => x.utmCampaign === slug);
    return c ? c.title : slug;
  }

  function renderAnalytics(s) {
    const total = s.total || 0;
    const campaigns = s.campaigns || {};
    const refercodes = s.refercodes || {};
    const days = s.days || {};
    const langs = s.langs || {};

    if (!total) {
      $('analyticsBody').innerHTML =
        '<div class="empty">No clicks yet.<br><span class="muted">Clicks appear here once partners create short links and people click them.</span></div>';
      return;
    }

    const cards = [
      ['Total clicks', total.toLocaleString()],
      ['Campaigns clicked', Object.keys(campaigns).length],
      ['Partners', Object.keys(refercodes).filter((k) => k !== '(none)').length],
      ['Last click', s.lastClickAt ? timeAgo(s.lastClickAt) : '—'],
    ];
    const cardsHtml = `<div class="stat-row">${cards
      .map(([l, v]) => `<div class="stat"><div class="stat__val">${escapeHtml(String(v))}</div><div class="stat__label">${escapeHtml(l)}</div></div>`)
      .join('')}</div>`;

    const series = lastNDays(30).map((d) => ({ d, n: days[d] || 0 }));
    const maxDay = Math.max(1, ...series.map((x) => x.n));
    const barsHtml = `
      <div class="an-block">
        <div class="an-title">Clicks · last 30 days</div>
        <div class="bars">${series
          .map((x) => `<div class="bar" title="${x.d}: ${x.n}"><div class="bar__fill" style="height:${x.n ? Math.max(4, Math.round((x.n / maxDay) * 100)) : 0}%"></div></div>`)
          .join('')}</div>
        <div class="bars-x"><span>${series[0].d.slice(5)}</span><span>${series[series.length - 1].d.slice(5)}</span></div>
      </div>`;

    const campRows = Object.entries(campaigns)
      .map(([k, v]) => ({ label: campaignTitle(k), sub: k, n: v.total || 0 }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);
    const refRows = Object.entries(refercodes)
      .map(([k, n]) => ({ label: k, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);
    const langRows = Object.entries(langs)
      .map(([k, n]) => ({ label: LANG_LABEL[k] || k, n }))
      .sort((a, b) => b.n - a.n);

    $('analyticsBody').innerHTML = `
      ${cardsHtml}
      ${barsHtml}
      <div class="an-cols">${tableBlock('By campaign', campRows, total)}${tableBlock('By partner (refercode)', refRows, total)}</div>
      ${tableBlock('By language', langRows, total)}
      <p class="hint">Only short-link clicks (the “Create short link” button → /s/…) are tracked here. Plain copied links go straight to the landing page, where your own site analytics measure them via the UTM tags.</p>`;
  }

  function tableBlock(title, rows, total) {
    if (!rows.length) return '';
    const max = Math.max(1, ...rows.map((r) => r.n));
    const body = rows
      .map(
        (r) => `
      <div class="an-row">
        <div class="an-row__label">${escapeHtml(r.label)}${r.sub && r.sub !== r.label ? `<span class="an-row__sub">${escapeHtml(r.sub)}</span>` : ''}</div>
        <div class="an-row__track"><div class="an-row__fill" style="width:${Math.max(3, Math.round((r.n / max) * 100))}%"></div></div>
        <div class="an-row__n">${r.n.toLocaleString()}<span class="an-row__pct">${Math.round((r.n / total) * 100)}%</span></div>
      </div>`
      )
      .join('');
    return `<div class="an-block"><div class="an-title">${escapeHtml(title)}</div>${body}</div>`;
  }

  function lastNDays(n) {
    const out = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(today);
      x.setDate(today.getDate() - i);
      out.push(x.toISOString().slice(0, 10));
    }
    return out;
  }
  function timeAgo(iso) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  /* -------------------- Wire up -------------------- */
  $('navCampaigns').addEventListener('click', () => showView('campaigns'));
  $('navAnalytics').addEventListener('click', () => showView('analytics'));
  $('refreshAnalytics').addEventListener('click', loadAnalytics);
  $('loginBtn').addEventListener('click', async () => {
    const key = $('keyInput').value.trim();
    if (!key) return;
    $('loginErr').textContent = '';
    const btn = $('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Checking…';
    try {
      await tryLogin(key);
      adminKey = key;
      sessionStorage.setItem(KEY_STORAGE, key);
      showAdmin();
    } catch (err) {
      $('loginErr').textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Unlock';
    }
  });
  $('keyInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('loginBtn').click(); });
  $('logoutBtn').addEventListener('click', logout);
  $('campForm').addEventListener('submit', saveCampaign);
  $('resetBtn').addEventListener('click', resetForm);
  $('refreshBtn').addEventListener('click', loadCampaigns);

  // Auto-enter if a key is already stored this session.
  if (adminKey) {
    tryLogin(adminKey).then(showAdmin).catch(() => { sessionStorage.removeItem(KEY_STORAGE); adminKey = ''; });
  }
})();
