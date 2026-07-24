/* Juno Markets — Partner Marketing Library (public app) */
(() => {
  const UTM = { source: 'partners', medium: 'landing-page' };
  const t = (k) => window.I18N.t(k);

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
    try {
      u = new URL(campaign.landingPageUrl);
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
  function render9x16(campaign) {
    const v = (campaign.visuals || []).find((x) => x.ratio === '9:16') || (campaign.visuals || [])[0];
    return v ? v.url : '';
  }

  function renderCampaignList() {
    if (!state.campaigns.length) {
      els.campList.innerHTML =
        `<div class="empty">${escapeHtml(t('no_campaigns'))}<br /><span class="muted">${escapeHtml(t('check_back'))}</span></div>`;
      return;
    }
    els.campList.innerHTML = '';
    state.campaigns.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'camp-item' + (state.selected?.id === c.id ? ' is-active' : '');
      btn.type = 'button';
      const thumb = render9x16(c);
      btn.innerHTML = `
        ${thumb ? `<img class="camp-thumb" src="${thumb}" alt="" loading="lazy" />` : '<div class="camp-thumb"></div>'}
        <div class="camp-meta">
          <strong>${escapeHtml(c.title)}</strong>
          <span>${escapeHtml(c.description || 'utm_campaign: ' + c.utmCampaign)}</span>
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
    els.builderTitle.textContent = `${t('promo_link_prefix')} · ${state.selected.title}`;
  }

  function renderCreatives(c) {
    const visuals = c.visuals || [];
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
        <div class="creative__imgwrap"><img src="${v.url}" alt="${escapeHtml(c.title)} ${v.ratio}" loading="lazy" /></div>
        <div class="creative__bar">
          <span class="ratio-tag">${v.ratio}</span>
          <div class="creative__actions">
            <button class="mini-btn" data-act="download" title="${escapeHtml(t('act_download'))}">⭳</button>
            <button class="mini-btn" data-act="copy" title="${escapeHtml(t('act_copy_img'))}">⧉</button>
            <button class="mini-btn" data-act="share" title="${escapeHtml(t('act_share'))}">↗</button>
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
        body: JSON.stringify({ url: full }),
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
    // Re-render anything produced by JS (static [data-i18n] nodes are handled by I18N.apply).
    renderCampaignList();
    if (state.selected) {
      updateBuilderTitle();
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
