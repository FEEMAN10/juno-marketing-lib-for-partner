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

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload(e, ratio) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return toast('Image exceeds 15 MB', true);
    const slot = e.target.closest('.slot');
    const btn = slot.querySelector('.slot__btn');
    const label = btn.firstChild.nodeValue;
    btn.firstChild.nodeValue = 'Uploading… ';
    try {
      const dataBase64 = await fileToBase64(file);
      const data = await api('/api/upload', {
        method: 'POST',
        headers: authHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64 }),
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
    const list = $('adminList');
    if (!campaigns.length) {
      list.innerHTML = '<div class="empty">No campaigns yet. Create your first one on the left.</div>';
      return;
    }
    list.innerHTML = '';
    campaigns.forEach((c) => {
      const thumb = (c.visuals || []).find((v) => v.ratio === '9:16')?.url || (c.visuals || [])[0]?.url;
      const row = document.createElement('div');
      row.className = 'camp-item';
      row.style.cursor = 'default';
      row.innerHTML = `
        ${thumb ? `<img class="camp-thumb" src="${thumb}" alt="" />` : '<div class="camp-thumb"></div>'}
        <div class="camp-meta grow">
          <strong>${escapeHtml(c.title)}
            <span class="badge ${c.status === 'published' ? 'badge--live' : 'badge--draft'}">${c.status}</span>
          </strong>
          <span>${escapeHtml(c.utmCampaign)} · ${(c.visuals || []).length} visual(s)</span>
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

  /* -------------------- Wire up -------------------- */
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
