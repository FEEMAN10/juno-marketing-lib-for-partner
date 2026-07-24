/* Juno Markets — Partner Marketing Library (public app) */
(() => {
  const UTM = { source: 'partners', medium: 'landing-page' };

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
  };

  /* -------------------- URL building -------------------- */
  function buildUrl(campaign, refer) {
    let u;
    try {
      u = new URL(campaign.landingPageUrl);
    } catch {
      return '';
    }
    // Preserve any params already on the landing page, but force our known keys.
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
    els.testLink.href = url || '#';
    els.utmHint.innerHTML =
      `utm_source=<b>${UTM.source}</b> · utm_medium=<b>${UTM.medium}</b> · utm_campaign=<b>${escapeHtml(state.selected.utmCampaign)}</b>`;
    // Reset any previously generated short link when inputs change.
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
        '<div class="empty">No campaigns published yet.<br /><span class="muted">Check back soon.</span></div>';
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
    els.builderTitle.textContent = `Promo link · ${c.title}`;
    refreshUrl();
    renderCreatives(c);
    els.builderPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderCreatives(c) {
    const visuals = c.visuals || [];
    if (!visuals.length) {
      els.creativesGrid.innerHTML = '<div class="empty">No creatives uploaded for this campaign yet.</div>';
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
            <button class="mini-btn" data-act="download" title="Download">⭳</button>
            <button class="mini-btn" data-act="copy" title="Copy image">⧉</button>
            <button class="mini-btn" data-act="share" title="Share">↗</button>
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
      toast('Image downloaded');
    } catch {
      toast('Could not download image', true);
    }
  }

  async function copyImage(url) {
    try {
      const blob = await fetchBlob(url);
      // Clipboard image support is limited to PNG in most browsers.
      let toCopy = blob;
      if (blob.type !== 'image/png') toCopy = await toPng(blob);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': toCopy })]);
      toast('Image copied to clipboard');
    } catch {
      toast('Copy not supported here — try Download', true);
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
        toast('Link copied — paste it into your post');
      }
    } catch {
      /* user cancelled */
    }
  }

  /* -------------------- Link actions -------------------- */
  async function copyText(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg || 'Copied');
    } catch {
      toast('Copy failed', true);
    }
  }

  async function createShortLink() {
    if (!state.selected) return;
    const refer = els.referInput.value.trim();
    if (!refer) {
      toast('Enter your referral code first', true);
      els.referInput.focus();
      return;
    }
    const full = buildUrl(state.selected, refer);
    const btn = els.shortenBtn;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating…';
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
      toast('Short link created');
    } catch (e) {
      toast(e.message || 'Could not create short link', true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  /* -------------------- Toast + utils -------------------- */
  let toastTimer;
  function toast(msg, isErr) {
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.textContent = msg;
    els.toasts.appendChild(t);
    clearTimeout(toastTimer);
    setTimeout(() => t.remove(), 2600);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
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
  els.copyUrlBtn.addEventListener('click', () => copyText(els.finalUrl.textContent, 'Link copied'));
  els.copyShortBtn.addEventListener('click', () => copyText(els.shortUrl.textContent, 'Short link copied'));
  els.shortenBtn.addEventListener('click', createShortLink);

  load();
})();
