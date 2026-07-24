/* Juno Markets — partner library i18n
 * EN is the default/fallback. Adding a language = add a block to DICT + an
 * entry to LANGS. RTL languages go in the RTL set. */
window.I18N = (function () {
  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
    { code: 'th', label: 'ไทย' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'ar', label: 'العربية' },
    { code: 'zh', label: '简体中文' },
  ];
  const RTL = ['ar'];

  const DICT = {
    en: {
      brand_sub: 'Partner Marketing Library',
      hero_eyebrow: 'Grow your referrals',
      hero_title: 'Build your tracked promo link in seconds',
      hero_desc:
        "Pick a campaign, drop in your referral code, and we’ll generate a fully tracked link plus ready-to-post creatives. Share it anywhere and start earning.",
      step1: 'Step 1',
      step2: 'Step 2',
      step3: 'Step 3',
      choose_campaign: 'Choose a campaign',
      loading_campaigns: 'Loading campaigns…',
      no_campaigns: 'No campaigns published yet.',
      check_back: 'Check back soon.',
      builder_title_default: 'Your promo link',
      promo_link_prefix: 'Promo link',
      referral_label: 'Your referral code',
      referral_ph: 'e.g. T3s71B',
      referral_hint:
        "This is your unique partner code. It’s added to the link so your clients are tracked to you.",
      tracked_link: 'Your tracked link',
      enter_code_placeholder: 'Enter your referral code above…',
      create_short: 'Create short link',
      creating: 'Creating…',
      preview_landing: 'Preview landing page',
      short_link: 'Short link',
      campaign_creatives: 'Campaign creatives',
      creatives_desc:
        'Ready-made key visuals from the Juno team. Download, share, or copy to post on your channels.',
      no_creatives: 'No creatives uploaded for this campaign yet.',
      select_campaign_hint:
        'Select a campaign to build your promo link and grab creatives.',
      act_download: 'Download',
      act_copy_img: 'Copy image',
      act_share: 'Share',
      copy_link_title: 'Copy link',
      copy_short_title: 'Copy short link',
      toast_downloaded: 'Image downloaded',
      toast_download_fail: 'Could not download image',
      toast_img_copied: 'Image copied to clipboard',
      toast_copy_unsupported: 'Copy not supported here — try Download',
      toast_link_copied_share: 'Link copied — paste it into your post',
      toast_copied: 'Copied',
      toast_copy_fail: 'Copy failed',
      toast_enter_code: 'Enter your referral code first',
      toast_short_created: 'Short link created',
      toast_short_fail: 'Could not create short link',
      toast_link_copied: 'Link copied',
      toast_short_copied: 'Short link copied',
    },

    ru: {
      brand_sub: 'Маркетинговая библиотека для партнёров',
      hero_eyebrow: 'Развивайте свои рефералы',
      hero_title: 'Создайте отслеживаемую промо-ссылку за секунды',
      hero_desc:
        'Выберите кампанию, введите свой реферальный код — и мы создадим полностью отслеживаемую ссылку и готовые креативы для публикации. Делитесь где угодно и начинайте зарабатывать.',
      step1: 'Шаг 1',
      step2: 'Шаг 2',
      step3: 'Шаг 3',
      choose_campaign: 'Выберите кампанию',
      loading_campaigns: 'Загрузка кампаний…',
      no_campaigns: 'Пока нет опубликованных кампаний.',
      check_back: 'Загляните позже.',
      builder_title_default: 'Ваша промо-ссылка',
      promo_link_prefix: 'Промо-ссылка',
      referral_label: 'Ваш реферальный код',
      referral_ph: 'напр. T3s71B',
      referral_hint:
        'Это ваш уникальный партнёрский код. Он добавляется в ссылку, чтобы ваши клиенты закреплялись за вами.',
      tracked_link: 'Ваша отслеживаемая ссылка',
      enter_code_placeholder: 'Введите реферальный код выше…',
      create_short: 'Создать короткую ссылку',
      creating: 'Создание…',
      preview_landing: 'Просмотр лендинга',
      short_link: 'Короткая ссылка',
      campaign_creatives: 'Креативы кампании',
      creatives_desc:
        'Готовые ключевые визуалы от команды Juno. Скачивайте, делитесь или копируйте для публикации на своих каналах.',
      no_creatives: 'Для этой кампании ещё не загружены креативы.',
      select_campaign_hint:
        'Выберите кампанию, чтобы создать промо-ссылку и получить креативы.',
      act_download: 'Скачать',
      act_copy_img: 'Копировать изображение',
      act_share: 'Поделиться',
      copy_link_title: 'Копировать ссылку',
      copy_short_title: 'Копировать короткую ссылку',
      toast_downloaded: 'Изображение скачано',
      toast_download_fail: 'Не удалось скачать изображение',
      toast_img_copied: 'Изображение скопировано в буфер обмена',
      toast_copy_unsupported: 'Копирование недоступно — попробуйте скачать',
      toast_link_copied_share: 'Ссылка скопирована — вставьте её в свой пост',
      toast_copied: 'Скопировано',
      toast_copy_fail: 'Не удалось скопировать',
      toast_enter_code: 'Сначала введите реферальный код',
      toast_short_created: 'Короткая ссылка создана',
      toast_short_fail: 'Не удалось создать короткую ссылку',
      toast_link_copied: 'Ссылка скопирована',
      toast_short_copied: 'Короткая ссылка скопирована',
    },

    th: {
      brand_sub: 'คลังการตลาดสำหรับพาร์ทเนอร์',
      hero_eyebrow: 'เพิ่มผู้แนะนำของคุณ',
      hero_title: 'สร้างลิงก์โปรโมชันที่ติดตามได้ในไม่กี่วินาที',
      hero_desc:
        'เลือกแคมเปญ ใส่รหัสผู้แนะนำของคุณ แล้วเราจะสร้างลิงก์ที่ติดตามได้อย่างครบถ้วนพร้อมสื่อโฆษณาที่พร้อมโพสต์ แชร์ได้ทุกที่และเริ่มสร้างรายได้',
      step1: 'ขั้นตอนที่ 1',
      step2: 'ขั้นตอนที่ 2',
      step3: 'ขั้นตอนที่ 3',
      choose_campaign: 'เลือกแคมเปญ',
      loading_campaigns: 'กำลังโหลดแคมเปญ…',
      no_campaigns: 'ยังไม่มีแคมเปญที่เผยแพร่',
      check_back: 'โปรดกลับมาใหม่เร็ว ๆ นี้',
      builder_title_default: 'ลิงก์โปรโมชันของคุณ',
      promo_link_prefix: 'ลิงก์โปรโมชัน',
      referral_label: 'รหัสผู้แนะนำของคุณ',
      referral_ph: 'เช่น T3s71B',
      referral_hint:
        'นี่คือรหัสพาร์ทเนอร์เฉพาะของคุณ ระบบจะเพิ่มลงในลิงก์เพื่อให้ลูกค้าของคุณถูกติดตามมาที่คุณ',
      tracked_link: 'ลิงก์ที่ติดตามได้ของคุณ',
      enter_code_placeholder: 'กรอกรหัสผู้แนะนำของคุณด้านบน…',
      create_short: 'สร้างลิงก์แบบสั้น',
      creating: 'กำลังสร้าง…',
      preview_landing: 'ดูตัวอย่างหน้าแลนดิ้ง',
      short_link: 'ลิงก์แบบสั้น',
      campaign_creatives: 'สื่อโฆษณาแคมเปญ',
      creatives_desc:
        'ภาพหลักสำเร็จรูปจากทีม Juno ดาวน์โหลด แชร์ หรือคัดลอกเพื่อโพสต์บนช่องทางของคุณ',
      no_creatives: 'ยังไม่มีการอัปโหลดสื่อโฆษณาสำหรับแคมเปญนี้',
      select_campaign_hint:
        'เลือกแคมเปญเพื่อสร้างลิงก์โปรโมชันและรับสื่อโฆษณา',
      act_download: 'ดาวน์โหลด',
      act_copy_img: 'คัดลอกรูปภาพ',
      act_share: 'แชร์',
      copy_link_title: 'คัดลอกลิงก์',
      copy_short_title: 'คัดลอกลิงก์แบบสั้น',
      toast_downloaded: 'ดาวน์โหลดรูปภาพแล้ว',
      toast_download_fail: 'ไม่สามารถดาวน์โหลดรูปภาพได้',
      toast_img_copied: 'คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว',
      toast_copy_unsupported: 'ไม่รองรับการคัดลอกที่นี่ — ลองดาวน์โหลดแทน',
      toast_link_copied_share: 'คัดลอกลิงก์แล้ว — วางลงในโพสต์ของคุณ',
      toast_copied: 'คัดลอกแล้ว',
      toast_copy_fail: 'คัดลอกไม่สำเร็จ',
      toast_enter_code: 'กรุณากรอกรหัสผู้แนะนำก่อน',
      toast_short_created: 'สร้างลิงก์แบบสั้นแล้ว',
      toast_short_fail: 'ไม่สามารถสร้างลิงก์แบบสั้นได้',
      toast_link_copied: 'คัดลอกลิงก์แล้ว',
      toast_short_copied: 'คัดลอกลิงก์แบบสั้นแล้ว',
    },

    id: {
      brand_sub: 'Pustaka Pemasaran Partner',
      hero_eyebrow: 'Kembangkan referral Anda',
      hero_title: 'Buat tautan promo terlacak dalam hitungan detik',
      hero_desc:
        'Pilih kampanye, masukkan kode referral Anda, dan kami akan membuat tautan yang sepenuhnya terlacak beserta materi kreatif siap posting. Bagikan di mana saja dan mulai hasilkan pendapatan.',
      step1: 'Langkah 1',
      step2: 'Langkah 2',
      step3: 'Langkah 3',
      choose_campaign: 'Pilih kampanye',
      loading_campaigns: 'Memuat kampanye…',
      no_campaigns: 'Belum ada kampanye yang dipublikasikan.',
      check_back: 'Silakan periksa lagi nanti.',
      builder_title_default: 'Tautan promo Anda',
      promo_link_prefix: 'Tautan promo',
      referral_label: 'Kode referral Anda',
      referral_ph: 'mis. T3s71B',
      referral_hint:
        'Ini adalah kode partner unik Anda. Kode ini ditambahkan ke tautan agar klien Anda terlacak ke Anda.',
      tracked_link: 'Tautan terlacak Anda',
      enter_code_placeholder: 'Masukkan kode referral Anda di atas…',
      create_short: 'Buat tautan pendek',
      creating: 'Membuat…',
      preview_landing: 'Pratinjau halaman arahan',
      short_link: 'Tautan pendek',
      campaign_creatives: 'Materi kreatif kampanye',
      creatives_desc:
        'Materi visual utama siap pakai dari tim Juno. Unduh, bagikan, atau salin untuk diposting di kanal Anda.',
      no_creatives: 'Belum ada materi kreatif yang diunggah untuk kampanye ini.',
      select_campaign_hint:
        'Pilih kampanye untuk membuat tautan promo dan mengambil materi kreatif.',
      act_download: 'Unduh',
      act_copy_img: 'Salin gambar',
      act_share: 'Bagikan',
      copy_link_title: 'Salin tautan',
      copy_short_title: 'Salin tautan pendek',
      toast_downloaded: 'Gambar diunduh',
      toast_download_fail: 'Gagal mengunduh gambar',
      toast_img_copied: 'Gambar disalin ke clipboard',
      toast_copy_unsupported: 'Salin tidak didukung di sini — coba Unduh',
      toast_link_copied_share: 'Tautan disalin — tempel ke postingan Anda',
      toast_copied: 'Disalin',
      toast_copy_fail: 'Gagal menyalin',
      toast_enter_code: 'Masukkan kode referral Anda terlebih dahulu',
      toast_short_created: 'Tautan pendek dibuat',
      toast_short_fail: 'Gagal membuat tautan pendek',
      toast_link_copied: 'Tautan disalin',
      toast_short_copied: 'Tautan pendek disalin',
    },

    ar: {
      brand_sub: 'مكتبة التسويق للشركاء',
      hero_eyebrow: 'نمِّ إحالاتك',
      hero_title: 'أنشئ رابطك الترويجي القابل للتتبع في ثوانٍ',
      hero_desc:
        'اختر حملة، وأدخل رمز الإحالة الخاص بك، وسننشئ رابطًا قابلًا للتتبع بالكامل مع تصاميم جاهزة للنشر. شاركه في أي مكان وابدأ بالربح.',
      step1: 'الخطوة 1',
      step2: 'الخطوة 2',
      step3: 'الخطوة 3',
      choose_campaign: 'اختر حملة',
      loading_campaigns: 'جارٍ تحميل الحملات…',
      no_campaigns: 'لا توجد حملات منشورة بعد.',
      check_back: 'تحقق مرة أخرى قريبًا.',
      builder_title_default: 'رابطك الترويجي',
      promo_link_prefix: 'رابط ترويجي',
      referral_label: 'رمز الإحالة الخاص بك',
      referral_ph: 'مثال: T3s71B',
      referral_hint:
        'هذا هو رمز الشريك الفريد الخاص بك. يُضاف إلى الرابط ليتم تتبّع عملائك إليك.',
      tracked_link: 'رابطك القابل للتتبع',
      enter_code_placeholder: 'أدخل رمز الإحالة في الأعلى…',
      create_short: 'إنشاء رابط قصير',
      creating: 'جارٍ الإنشاء…',
      preview_landing: 'معاينة صفحة الهبوط',
      short_link: 'رابط قصير',
      campaign_creatives: 'تصاميم الحملة',
      creatives_desc:
        'تصاميم رئيسية جاهزة من فريق Juno. نزّلها أو شاركها أو انسخها لنشرها على قنواتك.',
      no_creatives: 'لم يتم رفع أي تصاميم لهذه الحملة بعد.',
      select_campaign_hint:
        'اختر حملة لإنشاء رابطك الترويجي والحصول على التصاميم.',
      act_download: 'تنزيل',
      act_copy_img: 'نسخ الصورة',
      act_share: 'مشاركة',
      copy_link_title: 'نسخ الرابط',
      copy_short_title: 'نسخ الرابط القصير',
      toast_downloaded: 'تم تنزيل الصورة',
      toast_download_fail: 'تعذّر تنزيل الصورة',
      toast_img_copied: 'تم نسخ الصورة إلى الحافظة',
      toast_copy_unsupported: 'النسخ غير مدعوم هنا — جرّب التنزيل',
      toast_link_copied_share: 'تم نسخ الرابط — الصقه في منشورك',
      toast_copied: 'تم النسخ',
      toast_copy_fail: 'فشل النسخ',
      toast_enter_code: 'أدخل رمز الإحالة أولًا',
      toast_short_created: 'تم إنشاء الرابط القصير',
      toast_short_fail: 'تعذّر إنشاء الرابط القصير',
      toast_link_copied: 'تم نسخ الرابط',
      toast_short_copied: 'تم نسخ الرابط القصير',
    },

    zh: {
      brand_sub: '合作伙伴营销库',
      hero_eyebrow: '拓展您的推荐',
      hero_title: '几秒钟内生成可追踪的推广链接',
      hero_desc:
        '选择一个活动，输入您的推荐码，我们将生成完全可追踪的链接以及可直接发布的创意素材。随处分享，开始赚取收益。',
      step1: '第 1 步',
      step2: '第 2 步',
      step3: '第 3 步',
      choose_campaign: '选择活动',
      loading_campaigns: '正在加载活动…',
      no_campaigns: '尚未发布任何活动。',
      check_back: '请稍后再来查看。',
      builder_title_default: '您的推广链接',
      promo_link_prefix: '推广链接',
      referral_label: '您的推荐码',
      referral_ph: '例如 T3s71B',
      referral_hint: '这是您专属的合作伙伴代码。它会添加到链接中，以便将您的客户归属到您名下。',
      tracked_link: '您的可追踪链接',
      enter_code_placeholder: '请在上方输入您的推荐码…',
      create_short: '生成短链接',
      creating: '正在生成…',
      preview_landing: '预览着陆页',
      short_link: '短链接',
      campaign_creatives: '活动创意素材',
      creatives_desc: '来自 Juno 团队的现成主视觉素材。可下载、分享或复制后发布到您的渠道。',
      no_creatives: '此活动尚未上传任何创意素材。',
      select_campaign_hint: '选择一个活动以生成推广链接并获取创意素材。',
      act_download: '下载',
      act_copy_img: '复制图片',
      act_share: '分享',
      copy_link_title: '复制链接',
      copy_short_title: '复制短链接',
      toast_downloaded: '图片已下载',
      toast_download_fail: '无法下载图片',
      toast_img_copied: '图片已复制到剪贴板',
      toast_copy_unsupported: '此处不支持复制 — 请尝试下载',
      toast_link_copied_share: '链接已复制 — 粘贴到您的帖子中',
      toast_copied: '已复制',
      toast_copy_fail: '复制失败',
      toast_enter_code: '请先输入您的推荐码',
      toast_short_created: '短链接已生成',
      toast_short_fail: '无法生成短链接',
      toast_link_copied: '链接已复制',
      toast_short_copied: '短链接已复制',
    },
  };

  let current = 'en';
  const listeners = [];

  function t(key) {
    return (DICT[current] && DICT[current][key]) || DICT.en[key] || key;
  }

  function apply(lang) {
    if (!DICT[lang]) lang = 'en';
    current = lang;
    try { localStorage.setItem('juno_lang', lang); } catch (e) { /* ignore */ }

    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });

    listeners.forEach((fn) => { try { fn(lang); } catch (e) { /* ignore */ } });
  }

  function onChange(fn) { listeners.push(fn); }

  function preferred() {
    // English is the default. A partner's explicit choice is remembered.
    let saved;
    try { saved = localStorage.getItem('juno_lang'); } catch (e) { /* ignore */ }
    return saved && DICT[saved] ? saved : 'en';
  }

  function init() { apply(preferred()); }

  return { t, apply, onChange, init, LANGS, isRTL: (l) => RTL.includes(l || current), current: () => current };
})();
