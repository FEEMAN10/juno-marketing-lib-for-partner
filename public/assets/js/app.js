/* Juno Markets — Partner Marketing Library (public app) */
(() => {
  const UTM = { source: 'partners', medium: 'landing-page' };
  const t = (k) => window.I18N.t(k);

  // Inline SVGs so the action icons render identically on every device
  // (the old glyph fonts left the download icon as an empty box on some OSes).
  const ICONS = {
    download:
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>',
    copy:
      '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    share:
      '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>',
  };

  const state = { campaigns: [], selected: null, refer: '' };

  const $ = (id) => document.getElementById(id);
  const els = {
    campList: $('campList'),
    builderPanel: $('builderPanel'),
    creativesPanel: $('creativesPanel'),
    welcomePanel: $('welcomePanel'),
    builderTitle: $('builderTitle'),
    referInput: $('referInput'),
    finalUrl: $('finalUrl'),
    utmHint: $('utmHint'),
    copyUrlBtn: $('copyUrlBtn'),
    shortenBtn: $('shortenBtn'),
    shortWrap: $('shortWrap'),
    shortUrl: $('shortUrl'),
    copyShortBtn: $('copyShortBtn'),
    testLink: $('testLink'),
    creativesGrid: $('creativesGrid'),
    toasts: $('toasts'),
    langSelect: $('langSelect'),
  };

  /* -------------------- URL building -------------------- */
  function buildUrl(campaign, refer) {
    let u;
    // Landing page can be per-language; fall back to the English base.
    const base = localized(campaign, 'landingPageUrl') || campaign.landingPageUrl;
    try {
      u = new URL(base);
    } catch {
      return '';
    }
    const preserved = new URLSearchParams(u.search);
    ['refercode', 'utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => preserved.delete(k));

    const ordered = new URLSearchParams();
    if (refer) ordered.set('refercode', refer);
    ordered.set('utm_source', UTM.source);
    ordered.set('utm_medium', UTM.medium);
    ordered.set('utm_campaign', campaign.utmCampaign);
    for (const [k, v] of preserved) ordered.append(k, v);

    u.search = ordered.toString();
    return u.toString();
  }

  function refreshUrl() {
    if (!state.selected) return;
    const refer = els.referInput.value.trim();
    state.refer = refer;
    const url = buildUrl(state.selected, refer);
    els.finalUrl.textContent = url || 'Invalid landing page URL';
    els.finalUrl.removeAttribute('data-i18n'); // now shows a real URL, not the placeholder
    els.testLink.href = url || '#';
    // UTM params are literal query keys — kept as-is across languages.
    els.utmHint.innerHTML =
      `utm_source=<b>${UTM.source}</b> · utm_medium=<b>${UTM.medium}</b> · utm_campaign=<b>${escapeHtml(state.selected.utmCampaign)}</b>`;
    els.shortWrap.hidden = true;
  }

  /* -------------------- Rendering -------------------- */
  // Campaign title/description in the current language, falling back to English.
  function localized(c, field) {
    const lang = window.I18N.current();
    const tr = c.translations && c.translations[lang];
    if (tr && tr[field] && String(tr[field]).trim()) return tr[field];
    return c[field] || '';
  }

  // Visuals for the current language; falls back to the English base set.
  function localizedVisuals(c) {
    const lang = window.I18N.current();
    const tr = c.translations && c.translations[lang];
    if (tr && Array.isArray(tr.visuals) && tr.visuals.length) return tr.visuals;
    return c.visuals || [];
  }

  function render9x16(campaign) {
    const vis = localizedVisuals(campaign);
    const v = vis.find((x) => x.ratio === '9:16') || vis[0];
    return v ? v.url : '';
  }

  // A campaign is shown only when the current language is in its visibleLanguages
  // (absent/empty = shown everywhere, backward-compatible).
  function visibleForLang(c) {
    const langs = c.visibleLanguages;
    if (!Array.isArray(langs) || langs.length === 0) return true;
    return langs.includes(window.I18N.current());
  }

  function visibleCampaigns() {
    return state.campaigns.filter(visibleForLang);
  }

  function renderCampaignList() {
    const list = visibleCampaigns();
    if (!list.length) {
      els.campList.innerHTML =
        `<div class="empty">${escapeHtml(t('no_campaigns'))}<br /><span class="muted">${escapeHtml(t('check_back'))}</span></div>`;
      return;
    }
    els.campList.innerHTML = '';
    list.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'camp-item' + (state.selected?.id === c.id ? ' is-active' : '');
      btn.type = 'button';
      const thumb = render9x16(c);
      btn.innerHTML = `
        ${thumb ? `<img class="camp-thumb" src="${thumb}" alt="" loading="lazy" />` : '<div class="camp-thumb"></div>'}
        <div class="camp-meta">
          <strong>${escapeHtml(localized(c, 'title'))}</strong>
          <span>${escapeHtml(localized(c, 'description') || 'utm_campaign: ' + c.utmCampaign)}</span>
        </div>`;
      btn.addEventListener('click', () => selectCampaign(c));
      els.campList.appendChild(btn);
    });
  }

  function selectCampaign(c) {
    state.selected = c;
    renderCampaignList();
    els.welcomePanel.hidden = true;
    els.builderPanel.hidden = false;
    els.creativesPanel.hidden = false;
    updateBuilderTitle();
    refreshUrl();
    renderCreatives(c);
    els.builderPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateBuilderTitle() {
    if (!state.selected) return;
    els.builderTitle.removeAttribute('data-i18n');
    els.builderTitle.textContent = `${t('promo_link_prefix')} · ${localized(state.selected, 'title')}`;
  }

  function renderCreatives(c) {
    const visuals = localizedVisuals(c);
    if (!visuals.length) {
      els.creativesGrid.innerHTML = `<div class="empty">${escapeHtml(t('no_creatives'))}</div>`;
      return;
    }
    els.creativesGrid.innerHTML = '';
    visuals.forEach((v) => {
      const card = document.createElement('div');
      card.className = 'creative';
      const safeName = `juno-${c.utmCampaign}-${v.ratio.replace(':', 'x')}`;
      card.innerHTML = `
        <div class="creative__imgwrap"><img src="${v.url}" alt="${escapeHtml(localized(c, 'title'))} ${v.ratio}" loading="lazy" /></div>
        <div class="creative__bar">
          <span class="ratio-tag">${v.ratio}</span>
          <div class="creative__actions">
            <button class="mini-btn" data-act="download" data-tip="${escapeHtml(t('act_download'))}" aria-label="${escapeHtml(t('act_download'))}">${ICONS.download}</button>
            <button class="mini-btn" data-act="copy" data-tip="${escapeHtml(t('act_copy_img'))}" aria-label="${escapeHtml(t('act_copy_img'))}">${ICONS.copy}</button>
            <button class="mini-btn" data-act="share" data-tip="${escapeHtml(t('act_share'))}" aria-label="${escapeHtml(t('act_share'))}">${ICONS.share}</button>
          </div>
        </div>`;
      card.querySelector('[data-act="download"]').addEventListener('click', () => downloadImage(v.url, safeName));
      card.querySelector('[data-act="copy"]').addEventListener('click', () => copyImage(v.url));
      card.querySelector('[data-act="share"]').addEventListener('click', () => shareImage(v.url, safeName, c));
      els.creativesGrid.appendChild(card);
    });
  }

  /* -------------------- Creative actions -------------------- */
  async function fetchBlob(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load image');
    return res.blob();
  }

  async function downloadImage(url, name) {
    try {
      const blob = await fetchBlob(url);
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(t('toast_downloaded'));
    } catch {
      toast(t('toast_download_fail'), true);
    }
  }

  async function copyImage(url) {
    try {
      const blob = await fetchBlob(url);
      let toCopy = blob;
      if (blob.type !== 'image/png') toCopy = await toPng(blob);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': toCopy })]);
      toast(t('toast_img_copied'));
    } catch {
      toast(t('toast_copy_unsupported'), true);
    }
  }

  function toPng(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png');
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  async function shareImage(url, name, campaign) {
    const link = buildUrl(campaign, state.refer);
    try {
      const blob = await fetchBlob(url);
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const file = new File([blob], `${name}.${ext}`, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: campaign.title, text: link });
        return;
      }
    } catch {
      /* fall through to URL share */
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: campaign.title, text: campaign.title, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast(t('toast_link_copied_share'));
      }
    } catch {
      /* user cancelled */
    }
  }

  /* -------------------- Link actions -------------------- */
  async function copyText(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      toast(t('toast_copy_fail'), true);
    }
  }

  async function createShortLink() {
    if (!state.selected) return;
    const refer = els.referInput.value.trim();
    if (!refer) {
      toast(t('toast_enter_code'), true);
      els.referInput.focus();
      return;
    }
    const full = buildUrl(state.selected, refer);
    const btn = els.shortenBtn;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('creating'))}`;
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: full, lang: window.I18N.current() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      els.shortUrl.textContent = data.shortUrl;
      els.shortWrap.hidden = false;
      toast(t('toast_short_created'));
    } catch {
      toast(t('toast_short_fail'), true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  /* -------------------- Toast + utils -------------------- */
  function toast(msg, isErr) {
    const el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' err' : '');
    el.textContent = msg;
    els.toasts.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  /* -------------------- i18n wiring -------------------- */
  function onLangChange() {
    // A selected campaign may be hidden in the newly-chosen language.
    if (state.selected && !visibleForLang(state.selected)) {
      state.selected = null;
      els.builderPanel.hidden = true;
      els.creativesPanel.hidden = true;
      els.welcomePanel.hidden = false;
    }
    // Re-render anything produced by JS (static [data-i18n] nodes are handled by I18N.apply).
    renderCampaignList();
    if (state.selected) {
      updateBuilderTitle();
      refreshUrl(); // landing page may differ per language
      renderCreatives(state.selected);
    }
    if (els.langSelect.value !== window.I18N.current()) els.langSelect.value = window.I18N.current();
  }

  /* -------------------- Boot -------------------- */
  async function load() {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      state.campaigns = data.campaigns || [];
    } catch {
      state.campaigns = [];
    }
    renderCampaignList();
  }

  els.referInput.addEventListener('input', refreshUrl);
  els.copyUrlBtn.addEventListener('click', () => copyText(els.finalUrl.textContent, t('toast_link_copied')));
  els.copyShortBtn.addEventListener('click', () => copyText(els.shortUrl.textContent, t('toast_short_copied')));
  els.shortenBtn.addEventListener('click', createShortLink);
  els.langSelect.addEventListener('change', (e) => window.I18N.apply(e.target.value));

  window.I18N.onChange(onLangChange);
  window.I18N.init(); // sets language from storage/browser and translates static nodes
  els.langSelect.value = window.I18N.current();

  load();
})();
