/**
 * public/js/views-fortune.js
 * 吉時行樂命理系統前端模組 (Lucky Hour)
 * 涵蓋：
 *   Tab 1: 老黃曆 (Daily Almanac & Zodiac)
 *   Tab 2: 紫微斗數 (Zi Wei Dou Shu: 4x4 中空方盤、三方四正光束、八字排盤與流年運勢)
 *   Tab 3: 西洋天宮星盤 (Western Natal & Transit Wheel: SVG 向量同心圓星盤、相位網絡與水逆警報)
 *   Tab 4: 靈籤求索、Tab 5: 塔羅占卜 (components/fortune-oracle.js, components/fortune-tarot.js)
 */

const FORTUNE_ICONS = {
  crystalBall: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="11" r="8"/><path d="M7 21h10"/><path d="M9 18h6"/><path d="M8.5 8a4.5 4.5 0 0 1 5 0"/></svg>',
  ziwei: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>',
  astro: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
  oracle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10a2 2 0 0 0 2-2V9H5v10a2 2 0 0 0 2 2Z"/><path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="9" y1="3" x2="10" y2="5"/><line x1="15" y1="3" x2="14" y2="5"/></svg>',
  tarot: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 6v1.5M12 16.5V18M7.5 12H9M15 12h1.5"/></svg>',
  maximize: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
  minimize: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
  share: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><rect x="5.25" y="5.25" width="8.5" height="8.5" rx="1"/><path d="M10.75 5.25V3.2a.95.95 0 0 0-.95-.95H3.2a.95.95 0 0 0-.95.95v6.6c0 .52.43.95.95.95h2.05"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  sparkles: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
  zodiac: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="3"/></svg>',
  bulb: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
  starFilled: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  // 可愛萌系安全月曆專用 SVG 向量標籤
  cuteRocket: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/></svg>',
  cuteCoffee: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
  cuteMoon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>',
  cuteShield: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  chevronLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
};

/**
 * 建立並管理吉時行樂命理面板
 */
function createFortuneHub(options = {}) {
  const {
    dailyData,
    horoscopeData,
    activeSign = 'scorpio',
    onShareDaily,
    onSignChange,
  } = options;

  // Tabs deep-link through the URL hash (#zodiac, #ziwei, ...) so a section can be shared or reopened.
  const VALID_TABS = ['almanac', 'zodiac', 'ziwei', 'astro', 'oracle', 'tarot'];
  const hashTab = String(window.location.hash || '').replace(/^#/, '');
  let activeTab = options.initialTab || (hashTab === 'ziwei-compat' ? 'ziwei' : null) || (VALID_TABS.includes(hashTab) ? hashTab : null) || window._lastFortuneActiveTab || 'almanac';
  let isMaximized = false;

  const switchTab = (tab) => {
    activeTab = tab;
    window._lastFortuneActiveTab = tab;
    try {
      const url = tab === 'almanac' ? window.location.pathname + window.location.search : '#' + tab;
      window.history.replaceState(null, '', url);
    } catch {}
    if (tab === 'ziwei' && !ziweiChart && !loadingZiwei) {
      loadZiweiChart();
    }
  };

  const calcAddDays = (dateStr, days) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0])) return null;
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
    const ny = d.getUTCFullYear();
    const nm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const nd = String(d.getUTCDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  };

  const fetchDailyAlmanac = async (dateStr) => {
    if (!dateStr || dateStr < '1901-01-01' || dateStr > '2099-12-31') {
      toast(t('fortune.date_out_of_range') || '日期超出支援範圍 (1901~2099)', 'warn');
      return;
    }
    const reqId = ++dailyRequestId;
    selectedDailyDate = dateStr;
    loadingDaily = true;
    dailyError = null;
    renderHub();
    try {
      const res = await api.get(`/api/fortune/daily?date=${encodeURIComponent(dateStr)}`);
      if (reqId === dailyRequestId && res?.ok) {
        activeDailyData = res;
      }
    } catch (err) {
      if (reqId === dailyRequestId) {
        dailyError = err.message || t('fortune.load_daily_error') || '載入老黃曆失敗';
        toast(dailyError, 'error');
      }
    } finally {
      if (reqId === dailyRequestId) {
        loadingDaily = false;
        renderHub();
      }
    }
  };

  // 每日星座狀態
  let currentSign = localStorage.getItem('zuto_daily_zodiac_sign') || activeSign || 'scorpio';
  let localHoroscope = horoscopeData || null;
  let loadingHoroscope = false;
  let horoscopeLangMode = (localStorage.getItem('zuto_lang') || 'zh-TW') === 'en' ? 'en' : 'zh';
  let horoscopeRequestId = 0;

  // 老黃曆選日狀態 (Almanac Date Selection)
  let selectedDailyDate = dailyData?.date || new Date().toISOString().slice(0, 10);
  let activeDailyData = dailyData || null;
  let loadingDaily = false;
  let dailyError = null;
  let dailyRequestId = 0;

  // 紫微斗數狀態
  let ziweiChart = null;
  let ziweiYearly = null;
  let ziweiPalaceInterpretations = null;
  let ziweiSelectedBranch = 6; // 預設午宮
  let ziweiHistory = []; // 宮位閱讀跳轉歷史
  let ziweiShowRays = true;
  let ziweiBirthYear = 1996;
  let ziweiBirthMonth = 8;
  let ziweiBirthDay = 18;
  let ziweiBirthHour = 10;
  let ziweiGender = 'M';
  let ziweiIsLunar = false;
  let ziweiIsLeapMonth = false;
  let ziweiZiHourRule = 'early_late';
  let ziweiLeapMonthRule = 'mid_month';
  let ziweiTargetYear = new Date().getFullYear();
  let ziweiIsDemo = false;
  let loadingZiwei = false;
  let ziweiMode = 'single'; // 'single' | 'compat'

  // 西洋星盤狀態
  let astroNatal = null;
  let astroTransit = null;
  let astroRetrograde = null;
  let loadingAstro = false;

  const rootEl = h('div.projects-fortune-hub-root');

  // 嘗試預載使用者的出生八字設定
  api.get('/api/fortune/profile').then((res) => {
    if (res?.ok && res.profile) {
      ziweiBirthYear = res.profile.birth_year;
      ziweiBirthMonth = res.profile.birth_month;
      ziweiBirthDay = res.profile.birth_day;
      ziweiBirthHour = res.profile.birth_hour;
      ziweiGender = res.profile.gender;
      ziweiIsLunar = res.profile.calendar_type === 'lunar';
    }
  }).catch(() => {});

  const toggleMaximize = () => {
    isMaximized = !isMaximized;
    const popup = rootEl.closest('.auth-drawer-popup');
    if (popup) {
      popup.classList.toggle('fortune-maximized', isMaximized);
    }
    renderHub();
  };

  // -------------------------------------------------------------
  // 每日星座非同步獲取
  // -------------------------------------------------------------
  const fetchHoroscope = async (sign) => {
    currentSign = sign;
    localStorage.setItem('zuto_daily_zodiac_sign', sign);
    if (typeof onSignChange === 'function') {
      try { onSignChange(sign); } catch {}
    }
    const reqId = ++horoscopeRequestId;
    loadingHoroscope = true;
    renderHub();
    try {
      const currentAppLang = (localStorage.getItem('zuto_lang') || 'zh-TW') === 'en' ? 'en' : 'zh-TW';
      const res = await api.get(`/api/fortune/horoscope?sign=${encodeURIComponent(sign)}&lang=${currentAppLang}`);
      if (reqId === horoscopeRequestId && res?.ok) {
        localHoroscope = res;
      }
    } catch (err) {
      if (reqId === horoscopeRequestId) {
        toast(err.message || '載入每日星座失敗', 'error');
      }
    } finally {
      if (reqId === horoscopeRequestId) {
        loadingHoroscope = false;
        renderHub();
      }
    }
  };

  // -------------------------------------------------------------
  // 紫微斗數非同步獲取
  // -------------------------------------------------------------
  const loadZiweiChart = async () => {
    loadingZiwei = true;
    renderHub();
    try {
      const res = await api.post('/api/fortune/ziwei/chart', {
        year: ziweiBirthYear,
        month: ziweiBirthMonth,
        day: ziweiBirthDay,
        hour: ziweiBirthHour,
        gender: ziweiGender,
        isLunar: ziweiIsLunar,
        isLeapMonth: ziweiIsLeapMonth,
        ziHourRule: ziweiZiHourRule,
        leapMonthRule: ziweiLeapMonthRule,
        targetYear: ziweiTargetYear,
      });
      if (res?.ok) {
        ziweiChart = res.chart;
        ziweiYearly = res.yearly;
        ziweiPalaceInterpretations = res.palaceInterpretations;
        ziweiIsDemo = Boolean(res.isDemo);
        ziweiHistory = [];
        // 預設選中命宮
        if (ziweiChart.palaces?.[0]) {
          ziweiSelectedBranch = ziweiChart.palaces[0].branchIndex;
        }
      }
    } catch (err) {
      toast(err.message || '紫微排盤計算異常', 'error');
    } finally {
      loadingZiwei = false;
      renderHub();
    }
  };

  const saveZiweiProfile = async () => {
    try {
      const res = await api.post('/api/fortune/profile', {
        calendar_type: ziweiIsLunar ? 'lunar' : 'solar',
        birth_year: ziweiBirthYear,
        birth_month: ziweiBirthMonth,
        birth_day: ziweiBirthDay,
        birth_hour: ziweiBirthHour,
        gender: ziweiGender,
      });
      if (res?.ok) {
        ziweiIsDemo = false;
        toast(t('fortune.ziwei_profile_saved') || '生辰八字已成功儲存！', 'ok');
        renderHub();
      }
    } catch (err) {
      toast(err.message || '儲存生辰失敗', 'error');
    }
  };

  // -------------------------------------------------------------
  // 西洋星盤非同步獲取
  // -------------------------------------------------------------
  const loadAstroChart = async () => {
    loadingAstro = true;
    renderHub();
    try {
      const [natalRes, transitRes] = await Promise.all([
        api.post('/api/fortune/astrology/natal', {
          year: ziweiBirthYear,
          month: ziweiBirthMonth,
          day: ziweiBirthDay,
          hour: ziweiBirthHour,
        }),
        api.get('/api/fortune/astrology/transit'),
      ]);
      if (natalRes?.ok) astroNatal = natalRes.natal;
      if (transitRes?.ok) {
        astroTransit = transitRes.transit;
        astroRetrograde = transitRes.retrograde;
      }
    } catch (err) {
      toast(err.message || '星盤運算異常', 'error');
    } finally {
      loadingAstro = false;
      renderHub();
    }
  };

  // -------------------------------------------------------------
  // 視圖渲染器
  // -------------------------------------------------------------
  // Tab row: one book, six sections. Labels stay short so all six fit a phone row.
  const TAB_DEFS = [
    { key: 'almanac', zh: '老黃曆', en: 'Almanac', onOpen: () => renderHub() },
    { key: 'zodiac', zh: '星座', en: 'Zodiac', onOpen: () => { if (!localHoroscope && !loadingHoroscope) fetchHoroscope(currentSign); else renderHub(); } },
    { key: 'ziwei', zh: '紫微', en: 'Ziwei', onOpen: () => { if (!ziweiChart && !loadingZiwei) loadZiweiChart(); else renderHub(); } },
    { key: 'astro', zh: '星盤', en: 'Natal', onOpen: () => { if (!astroNatal && !loadingAstro) loadAstroChart(); else renderHub(); } },
    { key: 'oracle', zh: '靈籤', en: 'Oracle', onOpen: () => renderHub() },
    { key: 'tarot', zh: '塔羅', en: 'Tarot', onOpen: () => renderHub() },
  ];
  let lastRenderedTab = null;

  const renderHub = () => {
    const isEnLang = window.CyberFortuneCore?.getLang?.() === 'en';
    const prevTabScroll = rootEl.querySelector('.cf-tabs')?.scrollLeft || 0;
    clear(rootEl);

    // 1. 分頁列 (scrollable on phones, active tab underlined in vermilion)
    const tabRow = h('nav.cf-tabs', { 'aria-label': isEnLang ? 'Fortune sections' : '命理分類' },
      TAB_DEFS.map((tab) => h(`button.cf-tab${activeTab === tab.key ? '.is-active' : ''}`, {
        type: 'button',
        'aria-current': activeTab === tab.key ? 'page' : null,
        onclick: () => {
          if (activeTab === tab.key) return;
          switchTab(tab.key);
          tab.onOpen();
        },
      }, isEnLang ? tab.en : tab.zh)),
    );
    rootEl.appendChild(tabRow);
    tabRow.scrollLeft = prevTabScroll;
    requestAnimationFrame(() => {
      const activeEl = tabRow.querySelector('.cf-tab.is-active');
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    });

    // 2. 分頁本體內容 (slides in only when the tab actually changes)
    const isTabChange = lastRenderedTab !== null && lastRenderedTab !== activeTab;
    lastRenderedTab = activeTab;
    const bodyWrap = h(`div.almanac-body${isTabChange ? '.cf-enter' : ''}`);

    if (activeTab === 'almanac') {
      renderAlmanacTab(bodyWrap);
    } else if (activeTab === 'zodiac') {
      renderZodiacTab(bodyWrap);
    } else if (activeTab === 'ziwei') {
      renderZiweiTab(bodyWrap);
    } else if (activeTab === 'astro') {
      renderAstroTab(bodyWrap);
    } else if (activeTab === 'oracle') {
      renderOracleTab(bodyWrap);
    } else if (activeTab === 'tarot') {
      renderTarotTab(bodyWrap);
    }

    rootEl.appendChild(bodyWrap);
  };

  const handleShareAlmanac = () => {
    const curDaily = activeDailyData || dailyData;
    if (!curDaily) return;
    const isTodayDate = curDaily.isToday !== false;
    const dateTitle = isTodayDate
      ? (t('fortune.copy_template_header', { date: curDaily.date }) || `🔮【吉時行樂 今日老黃曆】${curDaily.date}`)
      : (t('fortune.copy_template_header_custom', { date: curDaily.date }) || `🔮【吉時行樂 老黃曆】${curDaily.date}`);

    const lines = [
      dateTitle,
      `👤 ${t('fortune.copy_user', { name: curDaily.username }) || `算命道友：${curDaily.username}`}`,
      `🌟 ${t('fortune.copy_luck', { level: curDaily.luck.label, badge: curDaily.luck.badge }) || `今日天命：${curDaily.luck.label}（${curDaily.luck.badge}）`}`,
      curDaily.almanac ? `📅 農曆：${curDaily.almanac.lunar.fullLunarText} · ${curDaily.almanac.traditional?.dutyGod?.pathType || ''}` : null,
      `✅【${t('fortune.auspicious') || '宜'}】：` + curDaily.auspicious.map((a) => `\n   • ${a.action}（${a.desc}）`).join(''),
      `❌【${t('fortune.inauspicious') || '忌'}】：` + curDaily.inauspicious.map((a) => `\n   • ${a.action}（${a.desc}）`).join(''),
      `🍵 ${t('fortune.lucky_status_code') || '幸運數字'}：${curDaily.lucky_code.code} · ${curDaily.lucky_code.meaning}`,
      `🎨 ${t('fortune.lucky_color') || '幸運色'}：${curDaily.lucky_color.name} (${curDaily.lucky_color.hex})`,
      `🧭 ${t('fortune.lucky_direction') || '吉神方位'}：${curDaily.lucky_direction}`,
      localHoroscope && isTodayDate ? `♈ 星座星相（${localHoroscope.sign_name} ${localHoroscope.sign_symbol}）：工作 ${localHoroscope.work_index}% · 健康 ${localHoroscope.health_index}%\n💡 提醒：${localHoroscope.daily_advice}` : null,
      `📜 ${t('fortune.geek_quote') || '每日禪語'}：${curDaily.geek_quote}`,
    ].filter(Boolean).join('\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines).then(() => {
        toast(t('fortune.copied_toast') || '老黃曆已複製到剪貼簿！');
      }).catch(() => {
        promptModal(t('fortune.share_btn') || '複製分享', { defaultValue: lines });
      });
    } else {
      promptModal(t('fortune.share_btn') || '複製分享', { defaultValue: lines });
    }
  };

  // -------------------------------------------------------------
  // Tab 1: 老黃曆渲染 — the day as a ruled two-colour almanac sheet
  // -------------------------------------------------------------
  const HOUR_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let almanacHourIdx = null; // tapped 時辰; null follows the current hour
  let lastStampKey = null; // the seal stamps only when the shown date changes
  // Phones collapse 宜/忌 notes behind a tap so the lucky line and share button fit the first screen
  // (owner decision: 收合宜忌說明). Desktop always prints the notes.
  const PHONE_MQ = window.matchMedia ? window.matchMedia('(max-width: 480px)') : null;
  const openYJ = new Set();
  let focusYJ = null; // keep keyboard focus on the toggled entry across the re-render
  if (PHONE_MQ && typeof PHONE_MQ.addEventListener === 'function') {
    PHONE_MQ.addEventListener('change', () => { if (activeTab === 'almanac') renderHub(); });
  }

  const taipeiHourIndex = () => {
    const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }).format(new Date())) % 24;
    return Math.floor(((hour + 1) % 24) / 2);
  };
  const hourSpanText = (idx) => {
    const start = (idx * 2 + 23) % 24;
    const end = (start + 2) % 24;
    return `${String(start).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`;
  };

  const renderAlmanacTab = (container) => {
    const curDaily = activeDailyData || dailyData;
    const isEn = window.CyberFortuneCore?.getLang?.() === 'en';
    if (!curDaily && loadingDaily) {
      container.appendChild(h('div.cf-empty', t('common.loading') || '載入中...'));
      return;
    }
    if (!curDaily) {
      container.appendChild(h('div.cf-empty', t('fortune.load_daily_error') || '無老黃曆資料'));
      return;
    }

    const todayStr = curDaily.today || new Date().toISOString().slice(0, 10);
    const isToday = curDaily.isToday !== false && selectedDailyDate === todayStr;
    const isPast = selectedDailyDate < todayStr;
    const alm = curDaily.almanac;

    const page = h('div.cf-almanac');
    container.appendChild(page);

    // 0. 日期控制列
    const dateBar = h('div.cf-datebar', [
      h('button.btn.btn-ghost.cf-datebar-nav', {
        type: 'button',
        'aria-label': t('fortune.prev_day') || '前一天',
        disabled: loadingDaily || selectedDailyDate <= '1901-01-01',
        onclick: () => {
          const prev = calcAddDays(selectedDailyDate, -1);
          if (prev) fetchDailyAlmanac(prev);
        },
      }, [h('span.btn-icon', { html: FORTUNE_ICONS.chevronLeft })]),
      h('label.cf-datebar-field', [
        h('span.sr-only', t('fortune.query_date') || '查詢日期'),
        h('input.cf-datebar-input', {
          type: 'date',
          value: selectedDailyDate,
          min: '1901-01-01',
          max: '2099-12-31',
          disabled: loadingDaily,
          onchange: (e) => { if (e.target.value) fetchDailyAlmanac(e.target.value); },
        }),
      ]),
      h('button.btn.btn-ghost.cf-datebar-nav', {
        type: 'button',
        'aria-label': t('fortune.next_day') || '後一天',
        disabled: loadingDaily || selectedDailyDate >= '2099-12-31',
        onclick: () => {
          const next = calcAddDays(selectedDailyDate, 1);
          if (next) fetchDailyAlmanac(next);
        },
      }, [h('span.btn-icon', { html: FORTUNE_ICONS.chevronRight })]),
      isToday
        ? h('span.cf-datebar-tag.is-today', t('fortune.tag_today') || '今天')
        : h('button.btn.btn-secondary.cf-datebar-today', {
          type: 'button',
          disabled: loadingDaily,
          onclick: () => fetchDailyAlmanac(todayStr),
        }, t('fortune.today_btn') || '回到今天'),
      !isToday && h('span.cf-datebar-tag', isPast ? (t('fortune.tag_past') || '歷史日期') : (t('fortune.tag_future') || '未來日期')),
      loadingDaily && h('span.cf-datebar-loading', t('common.loading') || '載入中...'),
    ].filter(Boolean));
    page.appendChild(dateBar);

    if (dailyError) {
      page.appendChild(h('div.cf-alert', { role: 'alert' }, [
        h('span', dailyError),
        h('button.btn.btn-sm.btn-primary', { type: 'button', onclick: () => fetchDailyAlmanac(selectedDailyDate) }, t('common.retry') || '重試'),
      ]));
    }

    if (!alm) return;

    const [y, m, d] = String(alm.date || selectedDailyDate).split('-').map(Number);
    const weekdayIdx = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const isBadLuck = curDaily.luck.level === 'slight_trouble' || curDaily.luck.level === 'bad_luck';
    const stampKey = `${alm.date}`;
    const shouldStamp = lastStampKey !== stampKey;
    if (shouldStamp) openYJ.clear();
    lastStampKey = stampKey;

    const compactYJ = Boolean(PHONE_MQ && PHONE_MQ.matches);
    const renderYJItem = (item, key) => {
      if (!compactYJ) return h('li', [h('b', item.action), h('span', item.desc)]);
      const open = openYJ.has(key);
      const noteId = `cf-yj-note-${key}`;
      return h('li', [
        h('button.cf-yj-toggle', {
          type: 'button',
          'aria-expanded': open ? 'true' : 'false',
          'aria-controls': noteId,
          dataset: { yj: key },
          onclick: () => { if (open) openYJ.delete(key); else openYJ.add(key); focusYJ = key; renderHub(); },
        }, [h('b', item.action), h('span.cf-yj-chev', { 'aria-hidden': 'true', html: FORTUNE_ICONS.chevronRight })]),
        h('span', { id: noteId, hidden: !open }, item.desc),
      ]);
    };

    const lunarLeap = alm.lunar.isLeap ? '閏' : '';
    const rows = [
      {
        label: isEn ? 'Term' : '節氣',
        value: alm.solarTerm.currentTerm || alm.solarTerm.name,
        note: alm.solarTerm.isTermDay
          ? (isEn ? 'term begins today' : '今日交節')
          : alm.solarTerm.nextTerm ? (isEn ? `${alm.solarTerm.daysToNextTerm}d to ${alm.solarTerm.nextTerm}` : `距${alm.solarTerm.nextTerm} ${alm.solarTerm.daysToNextTerm} 天`) : '',
      },
      { label: isEn ? 'Officer' : '建除', value: `${alm.traditional.jianChu.name}日`, note: alm.traditional.jianChu.rating },
      { label: isEn ? 'Spirit' : '值日', value: alm.traditional.dutyGod.name, note: alm.traditional.dutyGod.pathType, good: alm.traditional.dutyGod.isAuspicious },
      { label: isEn ? 'Clash' : '沖煞', value: alm.traditional.chongSha.notice, note: '' },
      { label: isEn ? 'Mansion' : '星宿', value: alm.traditional.constellation.name, note: alm.traditional.constellation.desc, good: alm.traditional.constellation.lucky },
    ];

    const hours = Array.isArray(alm.hoursLuck) && alm.hoursLuck.length === 12 ? alm.hoursLuck : null;
    const nowIdx = isToday ? taipeiHourIndex() : null;
    const focusIdx = almanacHourIdx ?? nowIdx ?? 0;
    const focusHour = hours ? hours[focusIdx] : null;

    const sheet = h('article.cf-sheet.cf-day-sheet', { 'aria-label': isEn ? 'Daily almanac' : '今日農民曆' }, [
      // 日期 · 農曆 · 吉凶印
      h('section.cf-day', [
        h('div.cf-day-date', [
          h('small', isEn ? `${MONTHS_EN[m - 1]} ${y}` : `${y}年${m}月`),
          h('strong', String(d)),
          h('span', isEn ? WEEKDAYS_EN[weekdayIdx] : alm.weekdayZh),
        ]),
        h('div.cf-day-lunar', [
          h('div.cf-lv', [
            h('p.cf-lv-main', [h('i', '農曆'), `${lunarLeap}${alm.lunar.monthText}${alm.lunar.dayText}`]),
            h('p', `${alm.lunar.yearGanZhi}年・${alm.lunar.zodiac}年`),
            h('p', ['民國', h('span.cf-tcy', String(alm.rocYear)), '年']),
          ]),
        ]),
        h('div.cf-day-luck', [
          h(`div.cf-seal${isBadLuck ? '.is-ink' : ''}${shouldStamp ? '.is-stamping' : ''}`, { role: 'img', 'aria-label': curDaily.luck.label }, curDaily.luck.label),
          h('p', curDaily.luck.badge),
        ]),
      ]),
      // 今日黃曆 ruled table
      h('section.cf-ruled', [
        h('h2.cf-vh', h('span', isEn ? 'Today' : '今日黃曆')),
        h('dl.cf-rows', rows.map((row) => h('div.cf-row', [
          h('dt', row.label),
          h('dd', [
            h(`b${row.good === true ? '.is-red' : ''}`, row.value),
            row.note && h('small', row.note),
          ]),
        ]))),
      ]),
      // 宜 / 忌
      h('section.cf-yj', [
        h('div.cf-yj-col', [
          h('h2.cf-vh.cf-vh-fill.is-red', h('span', t('fortune.auspicious') || '宜')),
          h('ul', curDaily.auspicious.map((item, idx) => renderYJItem(item, `yi-${idx}`))),
        ]),
        h('div.cf-yj-col', [
          h('h2.cf-vh.cf-vh-fill.is-ink', h('span', t('fortune.inauspicious') || '忌')),
          h('ul', curDaily.inauspicious.map((item, idx) => renderYJItem(item, `ji-${idx}`))),
        ]),
      ]),
      // 十二時辰
      hours && h('section.cf-hours', [
        h('h2.cf-vh', h('span', isEn ? 'Hours' : '十二時辰')),
        h('div.cf-hours-body', [
          h('ol.cf-hours-strip', { role: 'list' }, hours.map((hr, idx) => h('li', [
            h(`button.cf-hour${hr.isAuspicious ? '.is-good' : '.is-bad'}${idx === nowIdx ? '.is-now' : ''}${idx === focusIdx ? '.is-focus' : ''}`, {
              type: 'button',
              'aria-pressed': idx === focusIdx ? 'true' : 'false',
              'aria-label': `${HOUR_BRANCHES[idx]}時 ${hourSpanText(idx)} ${hr.isAuspicious ? '吉' : '凶'}${idx === nowIdx ? '（現在）' : ''}`,
              onclick: () => { almanacHourIdx = idx; renderHub(); },
            }, [
              h('b', HOUR_BRANCHES[idx]),
              h('i', hr.isAuspicious ? '吉' : '凶'),
            ]),
          ]))),
          focusHour && h('p.cf-hour-note', { 'aria-live': 'polite' }, [
            h('b', `${HOUR_BRANCHES[focusIdx]}時`),
            h('span.cf-hour-span', hourSpanText(focusIdx)),
            focusIdx === nowIdx && h('span.cf-hour-now', isEn ? 'now' : '現在'),
            h(`span.cf-hour-spirit${focusHour.isAuspicious ? '' : '.is-ink'}`, focusHour.spiritName),
            h('span.cf-hour-desc', focusHour.desc),
          ]),
        ]),
      ]),
    ]);
    page.appendChild(sheet);

    // 幸運小記 + 分享
    const directionText = String(curDaily.lucky_direction || '').replace(/^[^\p{L}\p{N}]+/u, '');
    const [dirShort, ...dirRest] = directionText.split('，');

    // Phones: the sketch's one-line lucky footer with the ink share button, inside the first screen
    page.appendChild(h('div.cf-lucky-bar', [
      // three self-labelled groups that wrap whole, never splitting a value from its label
      h('p.cf-lucky-inline', [
        h('span.cf-li', [h('span', t('fortune.lucky_status_code') || '幸運數字'), h('b', curDaily.lucky_code.code)]),
        h('span.cf-li', [h('span.cf-swatch', { style: `background-color: ${curDaily.lucky_color.hex}` }), h('b', curDaily.lucky_color.name)]),
        h('span.cf-li', [h('b', dirShort)]),
      ]),
      h('button.btn.btn-primary.cf-share-btn.cf-lucky-bar-share', { type: 'button', onclick: handleShareAlmanac }, [
        h('span.btn-icon', { html: FORTUNE_ICONS.copy || FORTUNE_ICONS.share }),
        h('span', t('fortune.share_btn') || '複製分享'),
      ]),
    ]));

    const side = h('aside.cf-almanac-side');
    page.appendChild(side);
    if (focusYJ) {
      const target = page.querySelector(`[data-yj="${focusYJ}"]`);
      focusYJ = null;
      if (target) queueMicrotask(() => target.focus({ preventScroll: true }));
    }
    side.appendChild(h('section.cf-lucky', { 'aria-label': isEn ? 'Lucky notes' : '幸運小記' }, [
      h('div.cf-lucky-cell', [
        h('span.cf-lucky-label', t('fortune.lucky_status_code') || '幸運數字'),
        h('b.cf-lucky-num', curDaily.lucky_code.code),
        h('small', curDaily.lucky_code.meaning),
      ]),
      h('div.cf-lucky-cell', [
        h('span.cf-lucky-label', t('fortune.lucky_color') || '幸運色'),
        h('b', [h('span.cf-swatch', { style: `background-color: ${curDaily.lucky_color.hex}` }), curDaily.lucky_color.name]),
        h('small', curDaily.lucky_color.desc),
      ]),
      h('div.cf-lucky-cell', [
        h('span.cf-lucky-label', isEn ? 'Direction' : '方位'),
        h('b', dirShort),
        dirRest.length > 0 && h('small', dirRest.join('，')),
      ]),
    ]));

    side.appendChild(h('footer.cf-day-foot', [
      h('p.cf-quote', `「${curDaily.geek_quote}」`),
      h('button.btn.btn-primary.cf-share-btn', { type: 'button', onclick: handleShareAlmanac }, [
        h('span.btn-icon', { html: FORTUNE_ICONS.copy || FORTUNE_ICONS.share }),
        h('span', t('fortune.share_btn') || '複製分享'),
      ]),
    ]));

    side.appendChild(h('p.cf-fineprint', [
      h('span', curDaily.fun_almanac?.disclaimer || (isEn ? 'Dos, don\'ts and luck are for fun only.' : '宜忌與吉凶為趣味推算，僅供休閒娛樂')),
      alm.metadata?.source && h('span', `${isEn ? 'Calendar check' : '曆法校對'}：${alm.metadata.source}`),
    ]));
  };

  // -------------------------------------------------------------
  // Tab 2: 每日星座運勢渲染
  // -------------------------------------------------------------
  const ZODIAC_LIST = [
    { key: 'aries', name: '白羊', symbol: '♈' },
    { key: 'taurus', name: '金牛', symbol: '♉' },
    { key: 'gemini', name: '雙子', symbol: '♊' },
    { key: 'cancer', name: '巨蟹', symbol: '♋' },
    { key: 'leo', name: '獅子', symbol: '♌' },
    { key: 'virgo', name: '處女', symbol: '♍' },
    { key: 'libra', name: '天秤', symbol: '♎' },
    { key: 'scorpio', name: '天蠍', symbol: '♏' },
    { key: 'sagittarius', name: '射手', symbol: '♐' },
    { key: 'capricorn', name: '摩羯', symbol: '♑' },
    { key: 'aquarius', name: '水瓶', symbol: '♒' },
    { key: 'pisces', name: '雙魚', symbol: '♓' },
  ];

  // Zodiac sheet helpers. The sign strip keeps its scroll across re-renders; the seal and
  // index meters re-ink only when the sign on the sheet actually changes.
  const ZODIAC_EN = {
    aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo',
    libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
  };
  const ZODIAC_RANK = ['一', '二', '三', '四', '五'];
  let zodiacStripScroll = null; // last user scroll position of the sign strip
  let zodiacStripLock = 0; // programmatic scroll in flight until this timestamp
  let zodiacStripSign = null; // sign the strip was last centred on
  let zodiacInkedSign = null; // sign whose meters were last inked
  // Force text presentation (VS15) so the sign glyphs print as type, never as emoji.
  const TEXT_VS = String.fromCharCode(0xfe0e);
  const VS_ANY = new RegExp(`[${String.fromCharCode(0xfe0e, 0xfe0f)}]`, 'g');
  const zodiacGlyph = (s) => String(s || '').replace(VS_ANY, '') + TEXT_VS;
  const prefersReducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  // Numbers settle from zero alongside the meters; the final value is already in the DOM.
  const settleZodiacNumbers = (root) => {
    if (prefersReducedMotion()) return;
    const start = performance.now();
    root.querySelectorAll('[data-settle]').forEach((el, i) => {
      const target = Number(el.dataset.settle);
      if (!Number.isFinite(target)) return;
      const delay = 120 + i * 90;
      const dur = 620;
      const tick = (now) => {
        const p = Math.min(1, Math.max(0, (now - start - delay) / dur));
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  // A ten-cell printed scale; each cell inks in turn when the sign changes.
  const renderZodiacMeter = (label, value, row) => {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    return h('span.cf-zd-meter', { role: 'img', 'aria-label': `${label} ${v}/100`, style: `--row: ${row}` },
      Array.from({ length: 10 }, (_, k) => h('i', { style: `--k: ${k}; --f: ${Math.max(0, Math.min(1, v / 10 - k)).toFixed(2)}` })));
  };

  const renderZodiacTab = (container) => {
    const isEn = window.CyberFortuneCore?.getLang?.() === 'en'
      || (localStorage.getItem('zuto_lang') || 'zh-TW') === 'en';
    const page = h(`div.cf-zd${isEn ? '.is-en' : ''}`);
    container.appendChild(page);

    // 1. 十二星座 strip: one ruled row like the 十二時辰, scrollable on phones
    const strip = h('div.cf-zd-signs', { role: 'group', 'aria-label': isEn ? 'Choose a sign' : '選擇星座' },
      ZODIAC_LIST.map((z) => {
        const isActive = z.key === currentSign;
        return h(`button.cf-zd-sign${isActive ? '.is-active' : ''}`, {
          type: 'button',
          'aria-pressed': isActive ? 'true' : 'false',
          title: isEn ? ZODIAC_EN[z.key] : `${z.name}座`,
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentSign !== z.key) {
              fetchHoroscope(z.key);
            }
          },
        }, [
          h('span.cf-zd-sign-glyph', { 'aria-hidden': 'true' }, zodiacGlyph(z.symbol)),
          h('span.cf-zd-sign-name', isEn ? ZODIAC_EN[z.key] : z.name),
        ]);
      }));
    strip.addEventListener('scroll', () => {
      if (performance.now() > zodiacStripLock) zodiacStripScroll = strip.scrollLeft;
    }, { passive: true });
    page.appendChild(strip);
    requestAnimationFrame(() => {
      if (!strip.isConnected) return;
      const firstVisit = zodiacStripScroll === null;
      if (!firstVisit) strip.scrollLeft = zodiacStripScroll;
      const activeBtn = strip.querySelector('.cf-zd-sign.is-active');
      if (activeBtn && (firstVisit || zodiacStripSign !== currentSign) && strip.scrollWidth > strip.clientWidth) {
        const target = Math.max(0, activeBtn.offsetLeft - (strip.clientWidth - activeBtn.offsetWidth) / 2);
        zodiacStripScroll = target;
        zodiacStripLock = performance.now() + 700;
        strip.scrollTo({ left: target, behavior: firstVisit || prefersReducedMotion() ? 'auto' : 'smooth' });
      }
      zodiacStripSign = currentSign;
    });

    // 2. 星座 sheet
    if (loadingHoroscope && !localHoroscope) {
      page.appendChild(h('div.cf-empty', t('common.loading') || '星盤連線運算中...'));
      return;
    }
    if (!localHoroscope) {
      page.appendChild(h('div.cf-empty', [
        h('p', isEn ? 'No horoscope loaded yet.' : '尚未載入星座運勢資料'),
        h('button.btn.btn-sm.btn-primary.cf-zd-retry', {
          type: 'button',
          onclick: () => fetchHoroscope(currentSign),
        }, t('fortune.zodiac_retry') || '重新載入'),
      ]));
      return;
    }

    const hz = localHoroscope;
    const signKey = hz.sign || currentSign;
    const shouldInk = zodiacInkedSign !== signKey;
    zodiacInkedSign = signKey;
    const rating = Math.max(0, Math.min(5, Math.round(Number(hz.star_rating) || 0)));
    const sealText = rating > 0 ? (isEn ? `${rating}/5` : `${ZODIAC_RANK[rating - 1]}星`) : '—';
    const compatName = (isEn ? (hz.compatible_sign_en || hz.compatible_sign) : (hz.compatible_sign_zh || hz.compatible_sign)) || '—';
    const compatEntry = ZODIAC_LIST.find((z) => z.key === hz.compatible_sign_key);
    const indexRows = [
      { label: t('fortune.zodiac_work_index') || '工作指數', value: hz.work_index },
      { label: t('fortune.zodiac_health_index') || '健康指數', value: hz.health_index },
      { label: t('fortune.zodiac_love_index') || '愛情指數', value: hz.love_index },
    ];

    const sheet = h(`article.cf-sheet.cf-zd-sheet${shouldInk ? '.is-inking' : ''}${loadingHoroscope ? '.is-busy' : ''}`, {
      'aria-label': isEn ? 'Daily horoscope' : '今日星座運勢',
      'aria-busy': loadingHoroscope ? 'true' : null,
    }, [
      // 星座 · 日期與元素 · 星等印
      h('section.cf-zd-head', [
        h('div.cf-zd-id', [
          h('strong.cf-zd-glyph', { 'aria-hidden': 'true' }, zodiacGlyph(hz.sign_symbol)),
          h('h2.cf-zd-name', hz.sign_name),
          hz.sign_en && hz.sign_en !== hz.sign_name && h('small.cf-zd-en', hz.sign_en),
        ]),
        h('dl.cf-zd-facts', [
          h('div', [h('dt', isEn ? 'Dates' : '日期'), h('dd', String(hz.sign_date || '').replace(/\s*-\s*/, ' – '))]),
          h('div', [h('dt', isEn ? 'Element' : '元素'), h('dd', hz.element)]),
        ]),
        h('div.cf-zd-verdict', [
          h(`div.cf-seal${rating <= 2 ? '.is-ink' : ''}${shouldInk ? '.is-stamping' : ''}`, {
            role: 'img',
            'aria-label': isEn ? `${rating} of 5 stars today` : `今日星等 ${rating} / 5`,
          }, sealText),
          h('p.cf-zd-stars', { 'aria-hidden': 'true' }, Array.from({ length: 5 }, (_, i) =>
            h(`span${i < rating ? '.is-on' : ''}`, { html: FORTUNE_ICONS.starFilled }))),
        ]),
      ]),
      // 今日指數 ruled table
      h('section.cf-ruled.cf-zd-index', [
        h('h2.cf-vh', h('span', isEn ? 'Indices' : '今日指數')),
        h('dl.cf-rows', [
          ...indexRows.map((row, i) => h('div.cf-row.cf-zd-row', [
            h('dt', row.label),
            h('dd', [
              renderZodiacMeter(row.label, row.value, i),
              h('b.cf-zd-num', [
                h('span', { 'data-settle': shouldInk ? String(row.value ?? '') : null }, String(row.value ?? '—')),
                h('small', '%'),
              ]),
            ]),
          ])),
          h('div.cf-row.cf-zd-row', [
            h('dt', t('fortune.zodiac_lucky_num') || '幸運數字'),
            h('dd', h('b.cf-zd-lucky', String(hz.lucky_number ?? '—'))),
          ]),
          h('div.cf-row.cf-zd-row', [
            h('dt', t('fortune.zodiac_compatible') || '速配星座'),
            h('dd', compatEntry && compatEntry.key !== currentSign
              ? h('button.cf-zd-match', {
                type: 'button',
                title: isEn ? `Read ${compatName}` : `查看${compatName}`,
                onclick: (e) => {
                  e.stopPropagation();
                  fetchHoroscope(compatEntry.key);
                },
              }, [h('span.cf-zd-match-glyph', { 'aria-hidden': 'true' }, zodiacGlyph(compatEntry.symbol)), h('span', compatName)])
              : h('b.cf-zd-match', compatName)),
          ]),
        ]),
      ]),
      // 今日星座建議
      h('section.cf-zd-advice', [
        h('h2.cf-vh', h('span', isEn ? 'Advice' : (t('fortune.zodiac_daily_advice') || '今日星座建議'))),
        h('p', hz.daily_advice),
      ]),
    ]);
    page.appendChild(sheet);

    // 綜述: a serif reading printed on the page beside the sheet
    const hasBothLangs = hz.summary_en && hz.summary_zh && hz.summary_en !== hz.summary_zh;
    const showEnSummary = horoscopeLangMode === 'en';
    const langBtn = (mode, label) => h(`button.cf-zd-lang-btn${horoscopeLangMode === mode ? '.is-active' : ''}`, {
      type: 'button',
      'aria-pressed': horoscopeLangMode === mode ? 'true' : 'false',
      onclick: (e) => {
        e.stopPropagation();
        if (horoscopeLangMode === mode) return;
        horoscopeLangMode = mode;
        renderHub();
      },
    }, label);
    const side = h('aside.cf-zd-side', [
      h('section.cf-zd-reading', { dataset: { glyph: hz.sign_symbol || '' } }, [
        h('header.cf-zd-reading-head', [
          h('h2', t('fortune.zodiac_summary_label') || '今日星盤綜述'),
          hasBothLangs && h('div.cf-zd-lang', { role: 'group', 'aria-label': isEn ? 'Summary language' : '綜述語言' }, [
            langBtn('zh', t('fortune.zodiac_lang_zh') || '中文'),
            langBtn('en', t('fortune.zodiac_lang_en') || 'EN 原文'),
          ]),
        ]),
        h('p.cf-zd-summary', { lang: showEnSummary && hz.summary_en ? 'en' : null },
          showEnSummary ? (hz.summary_en || hz.summary) : (hz.summary_zh || hz.summary)),
      ]),
      h('p.cf-fineprint', [
        h('span', `${isEn ? 'Source' : '來源'}：${hz.external_source ? 'FreeHoroscopeAPI' : (isEn ? 'built-in engine' : '本站星象推算')} · ${hz.date || (isEn ? 'today' : '今日')}`),
        h('span', t('fortune.zodiac_disclaimer') || '各項指數為本地趣味內容'),
        loadingHoroscope && h('span.cf-zd-updating', { role: 'status' }, t('common.loading') || '更新中...'),
      ]),
    ]);
    page.appendChild(side);

    if (shouldInk) settleZodiacNumbers(sheet);
  };

  // -------------------------------------------------------------
  // Tab 3: 紫微斗數 — 命盤印成一張雙框朱紅曆紙
  // 選宮改變時，三方四正朱線從新選的宮位畫出、宮位詳解頁滑入。
  // renderHub 每次都重繪整頁，所以用閉包記住上一次的選宮，只在改變時播放。
  // -------------------------------------------------------------
  const renderZiweiTab = (() => {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const SIHUA_CLASS = { 祿: 'lu', 權: 'quan', 科: 'ke', 忌: 'ji' };
    const brightClass = (b) => {
      if (b === '廟' || b === '旺') return 'is-strong';
      if (b === '陷' || b === '不') return 'is-weak';
      return 'is-mid';
    };
    let lastRayKey; // 上次畫出的三方四正：宮位地支或 'off'
    let lastDetailBranch; // 上次展開詳解的宮位
    let raysObserver = null; // 中堂尺寸改變時重算朱線

    return (container) => {
      if (raysObserver) {
        raysObserver.disconnect();
        raysObserver = null;
      }
      const isEn = window.CyberFortuneCore?.getLang?.() === 'en';

      // 單人命盤 / 雙人合盤切換列
      const modeSwitch = h('div.ziwei-mode-switch.cf-modes', { role: 'group', 'aria-label': isEn ? 'Chart mode' : '命盤模式' }, [
        h(`button.cf-mode${ziweiMode === 'single' ? '.is-active' : ''}`, {
          type: 'button',
          'aria-pressed': String(ziweiMode === 'single'),
          onclick: () => { ziweiMode = 'single'; renderHub(); },
        }, t('fortune.ziwei_mode_single')),
        h(`button.cf-mode${ziweiMode === 'compat' ? '.is-active' : ''}`, {
          type: 'button',
          'aria-pressed': String(ziweiMode === 'compat'),
          onclick: () => { ziweiMode = 'compat'; renderHub(); },
        }, t('fortune.ziwei_mode_compat')),
      ]);
      container.appendChild(modeSwitch);

      if (ziweiMode === 'compat') {
        if (typeof window.renderZiweiCompatibilityPanel === 'function') {
          const compatHost = h('div.ziwei-compat-host');
          container.appendChild(compatHost);
          window.renderZiweiCompatibilityPanel(compatHost, { h, t, api, toast, input, select });
        }
        return;
      }

      // 0. 示範命盤提示
      if (ziweiIsDemo) {
        container.appendChild(h('div.ziwei-demo-banner', { role: 'note' }, [
          h('span.btn-icon', { html: FORTUNE_ICONS.alert }),
          h('p.ziwei-demo-text', [
            h('strong', t('fortune.ziwei_demo_badge') || '示範命盤：'),
            h('span', t('fortune.ziwei_demo_notice') || '目前使用示範生辰 (1996-08-18 10:00 巳時)，請於上方輸入生辰或點擊「儲存生辰」以推算您的專屬天盤。'),
          ]),
        ]));
      }

      // 1. 生辰輸入列
      const controlStrip = h('div.fortune-control-strip', [
        h('div.fortune-form-group', [
          h('strong.small', t('fortune.ziwei_birth_title') || '生辰設定：'),
          h('select.fortune-select-sm', {
            onchange: (e) => { ziweiIsLunar = e.target.value === 'lunar'; },
          }, [
            h('option', { value: 'solar', selected: !ziweiIsLunar }, t('fortune.ziwei_solar') || '國曆'),
            h('option', { value: 'lunar', selected: ziweiIsLunar }, t('fortune.ziwei_lunar') || '農曆'),
          ]),
          h('input.fortune-input-sm', {
            type: 'number',
            value: ziweiBirthYear,
            style: 'width: calc(4ch + 52px); font-variant-numeric: tabular-nums;',
            title: '出生西元年',
            oninput: (e) => { ziweiBirthYear = Number(e.target.value); },
            onchange: (e) => { ziweiBirthYear = Number(e.target.value); },
          }),
          h('span.small.muted', '年'),
          h('input.fortune-input-sm', {
            type: 'number',
            value: ziweiBirthMonth,
            min: 1,
            max: 12,
            style: 'width: calc(2ch + 52px); font-variant-numeric: tabular-nums;',
            title: '月份',
            oninput: (e) => { ziweiBirthMonth = Number(e.target.value); },
            onchange: (e) => { ziweiBirthMonth = Number(e.target.value); },
          }),
          h('span.small.muted', '月'),
          h('input.fortune-input-sm', {
            type: 'number',
            value: ziweiBirthDay,
            min: 1,
            max: 31,
            style: 'width: calc(2ch + 52px); font-variant-numeric: tabular-nums;',
            title: '日期',
            oninput: (e) => { ziweiBirthDay = Number(e.target.value); },
            onchange: (e) => { ziweiBirthDay = Number(e.target.value); },
          }),
          h('span.small.muted', '日'),
          h('select.fortune-select-sm', {
            onchange: (e) => { ziweiBirthHour = Number(e.target.value); renderHub(); },
          }, [
            h('option', { value: 0, selected: ziweiBirthHour === 0 }, '早子時 (00:00~01:00)'),
            h('option', { value: 2, selected: ziweiBirthHour === 2 }, '丑時 (01:00~03:00)'),
            h('option', { value: 4, selected: ziweiBirthHour === 4 }, '寅時 (03:00~05:00)'),
            h('option', { value: 6, selected: ziweiBirthHour === 6 }, '卯時 (05:00~07:00)'),
            h('option', { value: 8, selected: ziweiBirthHour === 8 }, '辰時 (07:00~09:00)'),
            h('option', { value: 10, selected: ziweiBirthHour === 10 }, '巳時 (09:00~11:00)'),
            h('option', { value: 12, selected: ziweiBirthHour === 12 }, '午時 (11:00~13:00)'),
            h('option', { value: 14, selected: ziweiBirthHour === 14 }, '未時 (13:00~15:00)'),
            h('option', { value: 16, selected: ziweiBirthHour === 16 }, '申時 (15:00~17:00)'),
            h('option', { value: 18, selected: ziweiBirthHour === 18 }, '酉時 (17:00~19:00)'),
            h('option', { value: 20, selected: ziweiBirthHour === 20 }, '戌時 (19:00~21:00)'),
            h('option', { value: 22, selected: ziweiBirthHour === 22 }, '亥時 (21:00~23:00)'),
            h('option', { value: 23, selected: ziweiBirthHour === 23 }, '夜子時 (23:00~24:00)'),
          ]),
          (ziweiBirthHour === 0 || ziweiBirthHour === 23) && h('select.fortune-select-sm', {
            title: '子時早晚日柱換日基準',
            onchange: (e) => { ziweiZiHourRule = e.target.value; },
          }, [
            h('option', { value: 'early_late', selected: ziweiZiHourRule === 'early_late' }, '子正換日 (標準早晚子)'),
            h('option', { value: 'next_day', selected: ziweiZiHourRule === 'next_day' }, '子初換日 (23點即跨日)'),
          ]),
          ziweiIsLunar && h('label.flex.items-center.gap-1.small.cursor-pointer', [
            h('input', {
              type: 'checkbox',
              checked: ziweiIsLeapMonth,
              onchange: (e) => { ziweiIsLeapMonth = e.target.checked; renderHub(); },
            }),
            h('span', '閏月'),
          ]),
          ziweiIsLunar && ziweiIsLeapMonth && h('select.fortune-select-sm', {
            title: '閏月排盤起宮規則',
            onchange: (e) => { ziweiLeapMonthRule = e.target.value; },
          }, [
            h('option', { value: 'mid_month', selected: ziweiLeapMonthRule === 'mid_month' }, '月中分界 (前15日當月/後15日次月)'),
            h('option', { value: 'current', selected: ziweiLeapMonthRule === 'current' }, '作當月算'),
            h('option', { value: 'next', selected: ziweiLeapMonthRule === 'next' }, '作次月算'),
          ]),
          h('select.fortune-select-sm', {
            onchange: (e) => { ziweiGender = e.target.value; },
          }, [
            h('option', { value: 'M', selected: ziweiGender === 'M' }, t('fortune.ziwei_gender_m') || '乾造 (男)'),
            h('option', { value: 'F', selected: ziweiGender === 'F' }, t('fortune.ziwei_gender_f') || '坤造 (女)'),
          ]),
        ]),
        h('div.fortune-form-group', [
          h('button.btn.btn-sm.btn-primary', {
            type: 'button',
            onclick: loadZiweiChart,
          }, t('fortune.ziwei_calculate') || '立即排盤'),
          h('button.btn.btn-sm.btn-ghost', {
            type: 'button',
            onclick: saveZiweiProfile,
          }, t('fortune.ziwei_save_profile') || '儲存生辰'),
        ]),
      ]);
      container.appendChild(controlStrip);

      if (loadingZiwei) {
        container.appendChild(h('div.cf-empty', { role: 'status' }, t('common.loading') || '正在推算紫微天盤與流年四化...'));
        return;
      }

      if (!ziweiChart) {
        container.appendChild(h('div.cf-empty', '點擊「立即排盤」即可排出個人專屬紫微斗數天盤'));
        return;
      }

      // 2. 4x4 中空方盤：朱紅細線分格的曆表，中堂印命主資料並承載三方四正朱線
      // 地支對應位置：
      // Row 1: 巳(5), 午(6), 未(7), 申(8)
      // Row 2: 辰(4), [中堂], 酉(9)
      // Row 3: 卯(3), [中堂], 戌(10)
      // Row 4: 寅(2), 丑(1), 子(0), 亥(11)
      const palaceByBranch = {};
      ziweiChart.palaces.forEach((p) => { palaceByBranch[p.branchIndex] = p; });

      // 選中宮位的三方四正
      const oppositeBranch = (ziweiSelectedBranch + 6) % 12;
      const sanHe1Branch = (ziweiSelectedBranch + 4) % 12;
      const sanHe2Branch = (ziweiSelectedBranch + 8) % 12;

      // 動態只在選宮 (或光束重新開啟) 時播放；第一次進入直接顯示完成狀態
      const rayKey = ziweiShowRays ? String(ziweiSelectedBranch) : 'off';
      const shouldDrawRays = ziweiShowRays && lastRayKey !== undefined && lastRayKey !== rayKey;
      lastRayKey = rayKey;
      const shouldSlideDetail = lastDetailBranch !== undefined && lastDetailBranch !== ziweiSelectedBranch;
      lastDetailBranch = ziweiSelectedBranch;

      const goToBranch = (branchIdx) => {
        if (ziweiSelectedBranch !== branchIdx) {
          ziweiHistory.push(ziweiSelectedBranch);
        }
        ziweiSelectedBranch = branchIdx;
        renderHub();
      };

      const cellEls = {};
      const renderPalaceCell = (branchIdx) => {
        const p = palaceByBranch[branchIdx];
        if (!p) return h('div.ziwei-palace-cell.is-blank', { 'aria-hidden': 'true' });

        const isSelected = ziweiSelectedBranch === branchIdx;
        const isSanFang = ziweiShowRays && [oppositeBranch, sanHe1Branch, sanHe2Branch].includes(branchIdx);
        const isYearlyMing = Boolean(ziweiYearly && ziweiYearly.yearlyMingBranch === p.branch);

        let cellClass = 'ziwei-palace-cell';
        if (isSelected) cellClass += '.highlight-selected';
        else if (isSanFang) cellClass += '.highlight-sanfang';

        const cell = h(`button.${cellClass}`, {
          type: 'button',
          'aria-pressed': String(isSelected),
          'aria-controls': 'ziwei-palace-detail',
          onclick: () => goToBranch(branchIdx),
        }, [
          h('span.ziwei-palace-head', [
            h('span.ziwei-palace-name', [
              h('b', p.name),
              p.isShenGong && h('span.ziwei-shen-badge', { title: '身宮' }, '身'),
              isYearlyMing && h('span.ziwei-yearly-badge', '流年命'),
            ]),
            h('span.ziwei-branch-tag', p.stemBranch),
          ]),
          h('span.ziwei-stars-area', [
            // 主星 (光度：廟旺印紅、陷不印墨)
            ...p.mainStars.map((s) => h('span.ziwei-main-star-row', [
              h('span.ziwei-star-item', [
                h('b', s.name),
                h(`span.ziwei-star-bright.${brightClass(s.brightness)}`, s.brightness),
              ]),
              // 窄格只印單字 (祿權科忌)，「化」字留給讀屏
              s.sihua && h(`span.ziwei-sihua-tag.${SIHUA_CLASS[s.sihua] || 'ji'}`, [h('span.ziwei-sihua-hua', '化'), s.sihua]),
            ])),
            p.mainStars.length === 0 && h('span.ziwei-star-empty', '空宮'),
            // 吉煞輔星 (吉曜印紅、煞曜印墨)
            p.minorStars.length > 0 && h('span.ziwei-minor-stars', p.minorStars.map((m) => h(`span.ziwei-minor-chip.${m.type}`, [
              m.name,
              m.sihua && h('i', m.sihua),
            ]))),
          ]),
          h('span.ziwei-palace-foot', [
            h('span.ziwei-role', p.devRole.title),
            p.daXian && h('span.ziwei-daxian-badge', { title: `大限十年大運 (${p.daXian.isClockwise ? '順行' : '逆行'})` }, `${p.daXian.startAge}–${p.daXian.endAge}歲`),
            h('span.ziwei-opp', `${p.sanFangSiZheng.opposite}照`),
          ]),
        ]);
        cellEls[branchIdx] = cell;
        return cell;
      };

      const gridEl = h('div.ziwei-grid');
      [5, 6, 7, 8, 4].forEach((b) => gridEl.appendChild(renderPalaceCell(b)));

      // 中堂 (Center 2x2)：命主資料 + 三方四正朱線
      const profile = ziweiChart.profile;
      const raysSvg = ziweiShowRays ? document.createElementNS(SVG_NS, 'svg') : null;
      const centerEl = h('div.ziwei-center-info', [
        raysSvg,
        h('div.ziwei-center-body', [
          h('p.ziwei-center-title', [
            h('span', profile.gender),
            ziweiIsDemo && h('span.badge.badge-sm.warning', t('fortune.ziwei_demo_badge') || '示範盤'),
          ]),
          h('p.ziwei-center-bureau', profile.bureau),
          h('dl.ziwei-center-facts', [
            h('div', [h('dt', '命主'), h('dd', profile.mingZhu || '破軍')]),
            h('div', [h('dt', '身主'), h('dd', profile.shenZhu || '鈴星')]),
            h('div', [h('dt', '生肖'), h('dd', `屬${profile.zodiac}`)]),
          ]),
          h('p.ziwei-center-lunar', profile.lunarDate),
          profile.ziHourType && profile.ziHourType !== 'normal' && h('p.ziwei-center-warn', profile.ziHourType === 'late_zi' ? '夜子時 (23:00~23:59)' : '晨子時 (00:00~00:59)'),
          h('dl.ziwei-bazi-strip', { 'aria-label': '八字' }, [
            ['年柱', profile.bazi.year],
            ['月柱', profile.bazi.month],
            ['日柱', profile.bazi.day],
            ['時柱', profile.bazi.hour],
          ].map(([label, val]) => h('div.ziwei-bazi-col', [
            h('dt.ziwei-bazi-label', label),
            h('dd.ziwei-bazi-val', val),
          ]))),
        ]),
      ]);
      gridEl.appendChild(centerEl);
      [9, 3, 10, 2, 1, 0, 11].forEach((b) => gridEl.appendChild(renderPalaceCell(b)));

      // 三方四正朱線：每宮對應中堂邊界上的一點 (宮格中心夾進中堂矩形：角宮落在角、邊宮落在邊)，
      // 由選中宮位畫向對宮與兩個三合宮，再連起三合的底邊。尺寸改變時重算。
      if (raysSvg) {
        raysSvg.setAttribute('class', `ziwei-rays-overlay${shouldDrawRays ? ' is-drawing' : ''}`);
        raysSvg.setAttribute('aria-hidden', 'true');
        raysSvg.setAttribute('focusable', 'false');
        const addShape = (tag, cls) => {
          const el = document.createElementNS(SVG_NS, tag);
          el.setAttribute('class', cls);
          raysSvg.appendChild(el);
          return el;
        };
        const rays = ['is-opp', 'is-he', 'is-he', 'is-base'].map((kind) => {
          const path = addShape('path', `ziwei-ray ${kind}`);
          path.setAttribute('pathLength', '1');
          return path;
        });
        const dot = addShape('circle', 'ziwei-ray-dot');
        dot.setAttribute('r', '3.5');

        const layoutRays = () => {
          const w = centerEl.clientWidth;
          const ht = centerEl.clientHeight;
          if (!w || !ht) return;
          const anchor = (b) => {
            const cell = cellEls[b];
            if (!cell) return [w / 2, ht / 2];
            const x = cell.offsetLeft + cell.offsetWidth / 2 - centerEl.offsetLeft;
            const y = cell.offsetTop + cell.offsetHeight / 2 - centerEl.offsetTop;
            return [Math.min(Math.max(x, 0), w), Math.min(Math.max(y, 0), ht)];
          };
          const [sel, opp, he1, he2] = [ziweiSelectedBranch, oppositeBranch, sanHe1Branch, sanHe2Branch].map(anchor);
          const seg = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
          raysSvg.setAttribute('viewBox', `0 0 ${w} ${ht}`);
          rays[0].setAttribute('d', seg(sel, opp));
          rays[1].setAttribute('d', seg(sel, he1));
          rays[2].setAttribute('d', seg(sel, he2));
          rays[3].setAttribute('d', seg(he1, he2));
          dot.setAttribute('cx', sel[0].toFixed(1));
          dot.setAttribute('cy', sel[1].toFixed(1));
        };
        if (typeof ResizeObserver === 'function') {
          raysObserver = new ResizeObserver(() => layoutRays());
          raysObserver.observe(gridEl);
        } else {
          requestAnimationFrame(layoutRays);
        }
      }

      // 命盤頁首：標題、操作提示、流年切換與三方四正開關
      const yearOptions = [[2025, '2025 乙巳年'], [2026, '2026 丙午年'], [2027, '2027 丁未年'], [2028, '2028 戊申年']];
      const chartSheet = h('section.cf-sheet.ziwei-chart', { 'aria-label': isEn ? 'Zi Wei chart' : '紫微斗數命盤' }, [
        h('header.ziwei-chart-head', [
          h('div.ziwei-chart-heading', [
            h('h2.ziwei-chart-title', '紫微天命盤'),
            h('p.ziwei-chart-hint', isEn ? 'Tap a palace to read its stars' : '點選宮位，看星曜詳解'),
          ]),
          h('div.ziwei-chart-tools', [
            h('label.ziwei-year-field', [
              h('span', '流年切換'),
              h('select.fortune-select-sm', {
                onchange: async (e) => {
                  ziweiTargetYear = Number(e.target.value);
                  const res = await api.get(`/api/fortune/ziwei/yearly?year=${ziweiTargetYear}&birthYear=${ziweiBirthYear}&birthMonth=${ziweiBirthMonth}&birthDay=${ziweiBirthDay}&birthHour=${ziweiBirthHour}&gender=${ziweiGender}&isLunar=${ziweiIsLunar}&isLeapMonth=${ziweiIsLeapMonth}&ziHourRule=${ziweiZiHourRule}&leapMonthRule=${ziweiLeapMonthRule}`);
                  if (res?.ok) ziweiYearly = res.yearly;
                  renderHub();
                },
              }, yearOptions.map(([year, label]) => h('option', { value: year, selected: ziweiTargetYear === year }, label))),
            ]),
            h(`button.btn.btn-sm.ziwei-rays-toggle${ziweiShowRays ? '.active' : ''}`, {
              type: 'button',
              'aria-pressed': String(ziweiShowRays),
              title: t('fortune.ziwei_sanfang_toggle') || '三方四正光束',
              onclick: () => {
                ziweiShowRays = !ziweiShowRays;
                renderHub();
              },
            }, '三方四正'),
          ]),
        ]),
        h('div.ziwei-board-wrap', gridEl),
      ]);

      // 3. 宮位深度解讀頁 (Palace Interpretation Detail Sheet)：選宮改變時滑入
      const renderPalaceDetailPanel = () => {
        const p = palaceByBranch[ziweiSelectedBranch];
        if (!p) return null;

        const pInterp = ziweiPalaceInterpretations?.byBranch?.[ziweiSelectedBranch]
          || ziweiPalaceInterpretations?.list?.find((x) => x.branchIndex === ziweiSelectedBranch);
        const sf = pInterp?.sanFangSiZheng;

        // 直書朱紅標題欄 + 朱線分格內文
        const section = (title, body) => h('section.ziwei-detail-section', [
          h('h4.cf-vh', h('span', title)),
          h('div.ziwei-detail-body', body),
        ]);
        const noteRow = (label, value) => h('div', [h('dt', label), h('dd', value)]);
        const sanfangRow = (labelText, isOpposite, target) => h('button.ziwei-sanfang-card', {
          type: 'button',
          onclick: () => goToBranch(target.branchIndex),
        }, [
          h(`span.ziwei-sanfang-kind${isOpposite ? '.is-opp' : ''}`, labelText),
          h('span.ziwei-sanfang-main', [
            h('b', target.name),
            target.stemBranch && h('span', target.stemBranch),
          ]),
          h('span.ziwei-sanfang-stars', [h('b', '星曜'), target.mainStars.join('、') || '空宮']),
          h('span.ziwei-sanfang-role', target.role),
          h('span.ziwei-sanfang-go', [
            h('span', '跳轉'),
            h('span.btn-icon', { html: FORTUNE_ICONS.chevronRight }),
          ]),
        ]);

        return h(`article.cf-sheet.ziwei-palace-detail-card${shouldSlideDetail ? '.is-entering' : ''}`, {
          id: 'ziwei-palace-detail',
          'aria-label': `${p.name} ${t('fortune.ziwei_palace_detail_title') || '宮位星曜詳解'}`,
        }, [
          // 1. 標題列：宮名、干支、身宮/流年命宮/空宮、大限與宮職
          h('header.ziwei-detail-head', [
            h('div.ziwei-detail-title-group', [
              h('h3.ziwei-detail-main-title', [h('span', p.name), h('small', `${p.stemBranch}位`)]),
              p.isShenGong && h('span.ziwei-shen-badge', '身宮所在'),
              ziweiYearly && ziweiYearly.yearlyMingBranch === p.branch && h('span.ziwei-yearly-badge', '流年命宮'),
              pInterp?.isEmptyPalace && h('span.ziwei-detail-tag', t('fortune.ziwei_empty_palace_title') || '空宮'),
            ]),
            ziweiHistory.length > 0 && h('div.ziwei-detail-actions', h('button.btn.btn-sm.btn-ghost', {
              type: 'button',
              title: t('fortune.ziwei_back_palace') || '返回上一宮',
              onclick: () => {
                const prev = ziweiHistory.pop();
                if (typeof prev === 'number') {
                  ziweiSelectedBranch = prev;
                  renderHub();
                }
              },
            }, [
              h('span.btn-icon', { html: FORTUNE_ICONS.chevronLeft }),
              h('span', t('fortune.ziwei_back_palace') || '返回上一宮'),
            ])),
            h('p.ziwei-detail-meta', [
              p.daXian && h('span', [h('b', '大限'), `${p.daXian.startAge}–${p.daXian.endAge} 歲 (${p.daXian.isClockwise ? '順行' : '逆行'})`]),
              p.devRole?.title && h('span', [h('b', '宮職'), p.devRole.title]),
            ]),
          ]),

          // 2. 宮位主題說明
          pInterp?.theme && h('dl.ziwei-detail-theme-box', [
            h('div.ziwei-detail-theme-row', [
              h('dt.ziwei-theme-label', t('fortune.ziwei_palace_theme') || '宮位主題'),
              h('dd.ziwei-theme-text', pInterp.theme.traditional),
            ]),
            h('div.ziwei-detail-theme-row', [
              h('dt.ziwei-theme-label', '現代解讀'),
              h('dd.ziwei-theme-text', pInterp.theme.modernDev),
            ]),
          ]),

          // 3. 主星與光度能量
          section(t('fortune.ziwei_main_stars_title') || '主星與光度能量', pInterp?.isEmptyPalace
            ? h('div.ziwei-empty-palace-box', [
              h('strong', pInterp.emptyPalaceGuidance?.notice || '本宮無十四主星落入 (空宮)'),
              pInterp.emptyPalaceGuidance?.characteristics && h('p', pInterp.emptyPalaceGuidance.characteristics),
              pInterp.emptyPalaceGuidance?.oppositeReference && h('p', pInterp.emptyPalaceGuidance.oppositeReference),
            ])
            : h('div.ziwei-stars-detail-list', (pInterp?.mainStars || p.mainStars).map((s) => h('div.ziwei-star-detail-row', [
              h('div.ziwei-star-detail-head', [
                h('b.ziwei-star-name', s.name),
                h(`span.ziwei-brightness-tag.${brightClass(s.brightness)}`, s.brightness),
                s.sihua && h(`span.ziwei-sihua-tag.${SIHUA_CLASS[s.sihua] || 'ji'}`, `化${s.sihua}`),
                s.nature && h('span.ziwei-star-nature', s.nature),
              ]),
              h('dl.ziwei-star-detail-body', [
                s.brightnessDefinition && noteRow('光度意涵', s.brightnessDefinition),
                s.sihuaDefinition && noteRow(`本命化${s.sihua}`, [
                  s.sihuaDefinition,
                  s.sihuaDevAdvice && h('span.ziwei-advice', `（${s.sihuaDevAdvice}）`),
                ]),
                s.traditional && noteRow('星曜本質', s.traditional),
                s.modernDev && noteRow('現代解讀', s.modernDev),
              ]),
            ])))),

          // 4. 輔曜神煞作用
          pInterp?.minorStars?.length > 0 && section(t('fortune.ziwei_minor_stars_title') || '吉煞輔曜神煞',
            h('ul.ziwei-minor-detail-grid', pInterp.minorStars.map((m) => h('li.ziwei-minor-detail-card', [
              h('div.ziwei-minor-card-head', [
                h(`b.ziwei-minor-chip.${m.type}`, m.name),
                h('span.ziwei-minor-kind', m.type === 'auspicious' ? '吉曜助力' : '煞曜磨練'),
              ]),
              m.traditional && h('p.ziwei-minor-trad', m.traditional),
              m.modernDev && h('p.ziwei-minor-modern', m.modernDev),
            ])))),

          // 5. 組合格局與依據 (Matched Rules)
          pInterp?.matchedRules?.length > 0 && section(
            [t('fortune.ziwei_patterns_title') || '組合格局與依據', h('b.ziwei-vh-count', String(pInterp.matchedRules.length))],
            h('ol.ziwei-rules-list', pInterp.matchedRules.map((rule) => h('li.ziwei-rule-item', [
              h('div.ziwei-rule-head', [
                h('b.ziwei-rule-name', rule.name),
                h('span.badge.badge-sm', rule.type === 'same_palace' ? '同宮格局' : '三方會照'),
                rule.source && h('span.badge.badge-sm.muted', rule.source),
              ]),
              h('p.ziwei-rule-summary', rule.summary),
              h('p.ziwei-rule-desc', rule.explanation),
              rule.techMetaphor && h('p.ziwei-rule-tech', [h('b', '生活比喻'), rule.techMetaphor]),
            ]))),
          ),

          // 6. 三方四正會照：點選即跳到該宮
          sf && section(t('fortune.ziwei_sanfang_title') || '三方四正關聯會照', [
            h('div.ziwei-sanfang-grid', [
              sanfangRow(t('fortune.ziwei_opposite_label') || '對宮', true, sf.opposite),
              sanfangRow(t('fortune.ziwei_sanhe_label') || '三合宮', false, sf.sanHe1),
              sanfangRow(t('fortune.ziwei_sanhe_label') || '三合宮', false, sf.sanHe2),
            ]),
            sf.synthesis && h('p.ziwei-sanfang-synthesis', sf.synthesis),
          ]),

          // 7. 規則庫版本標示
          h('footer.ziwei-detail-footer', `規則體系：中州派正統排盤與十四主星亮度表 · Ruleset v${pInterp?.rulesetVersion || '1.0.0'} (${pInterp?.contentVersion || '2026.11'})`),
        ]);
      };

      container.appendChild(h('div.ziwei-layout', [chartSheet, renderPalaceDetailPanel()]));

      // 4. 流年運勢天機點評：朱線分隔的流年帶
      if (ziweiYearly) {
        const yearlySiHua = ziweiYearly.yearlySiHua || {};
        const yearlyWrap = h('section.ziwei-yearly-wrap', { 'aria-label': t('fortune.ziwei_yearly_title') || '流年運勢天機評述' }, [
          h('h2.cf-vh', h('span', isEn ? 'Year' : '流年運勢')),
          h('div.ziwei-yearly-main', [
            h('header.ziwei-yearly-head', [
              h('h3', [
                h('span.ziwei-yearly-year', `${ziweiYearly.year} ${ziweiYearly.yearlyGanZhi}`),
                ` · ${t('fortune.ziwei_yearly_title') || '流年運勢天機評述'}`,
              ]),
            ]),
            h('dl.ziwei-yearly-sihua', { 'aria-label': '流年四化' }, [
              ['祿', yearlySiHua.lu],
              ['權', yearlySiHua.quan],
              ['科', yearlySiHua.ke],
              ['忌', yearlySiHua.ji],
            ].map(([kind, star]) => h(`div.${SIHUA_CLASS[kind]}`, [h('dt', `流年化${kind}`), h('dd', star || '—')]))),
            h('div.ziwei-yearly-grid', (ziweiYearly.devInterpretations || []).map((item) => h('article.ziwei-yearly-card', [
              h('h4.ziwei-yearly-card-title', [
                // Domains arrive as "事業發展與突破 (Career)"; zh mode drops the English gloss.
                h('span', isEn ? item.domain : String(item.domain || '').replace(/\s*[（(][^）)]*[）)]\s*$/, '')),
                (item.factor || item.highlight) && h('span.ziwei-yearly-factor', { title: item.highlight }, item.factor || item.highlight),
              ]),
              h('p.ziwei-yearly-card-desc', item.content),
            ]))),
          ]),
        ]);
        container.appendChild(yearlyWrap);
      }
    };
  })();

  // -------------------------------------------------------------
  // Tab 4: 西洋天宮星盤渲染 (含星體自訂說明浮窗 P4)
  // -------------------------------------------------------------
  // One aspect key for the wheel, the legend and the slip: 吉 prints red and solid,
  // 凶 prints ink and dashed, 合 prints gray and dotted.
  const aspectTone = (harmony) => (harmony === 'harmonious' ? 'harm' : (harmony === 'challenging' ? 'chal' : 'neut'));
  const aspectSwatch = (tone) => `<svg width="24" height="8" viewBox="0 0 24 8" aria-hidden="true"><line class="cf-asp-line cf-asp-${tone}" x1="1" y1="4" x2="23" y2="4"/></svg>`;
  const fmtDeg = (s) => String(s || '').replace(/'/g, '′');

  // The planet slip: a framed paper note that rises over the wheel (a bottom sheet on phones).
  const renderPlanetPopover = (planet, natal, onClose, isPinned) => {
    const isEn = window.CyberFortuneCore?.getLang?.() === 'en';
    const houseLabel = planet.houseName || `第 ${planet.house} 宮`;
    return h(`div.astro-planet-popover${isPinned ? '.is-pinned' : ''}`, {
      role: 'dialog',
      'aria-label': `${planet.name}${planet.en ? ` (${planet.en})` : ''}`,
    }, [
      // 1. 標頭 (符號、名稱、英文名、本命標籤與關閉按鈕)
      h('header.astro-popover-head', [
        h('span.astro-popover-symbol', { 'aria-hidden': 'true' }, planet.planetSymbol || planet.symbol),
        h('div.astro-popover-name', [
          h('strong', planet.name),
          planet.en && h('span.astro-popover-en', planet.en),
        ]),
        h('span.badge.badge-brand.astro-natal-badge', t('fortune.astro_natal_tag') || '本命星體'),
        h('button.astro-popover-close-btn', {
          type: 'button',
          title: t('fortune.astro_close_popover') || '關閉說明',
          'aria-label': t('fortune.astro_close_popover') || '關閉說明',
          onclick: (e) => {
            e.stopPropagation();
            onClose();
          },
        }, [
          h('span.btn-icon', { html: FORTUNE_ICONS.close }),
        ]),
      ]),

      // 2. 落點 (星座度數、宮位、逆行) as ruled rows
      h('dl.astro-popover-loc', [
        h('div', [
          h('dt', isEn ? 'Sign' : '落點'),
          h('dd', [h('span.cf-astro-g', planet.signSymbol || ''), ` ${planet.signName} `, h('span.cf-astro-deg', fmtDeg(planet.displayDeg))]),
        ]),
        h('div', [
          h('dt', isEn ? 'House' : '宮位'),
          h('dd', `${houseLabel} · 第 ${planet.house} 宮`),
        ]),
        planet.isRetrograde && h('div.is-retro', [
          h('dt', isEn ? 'Motion' : '運行'),
          h('dd', { title: `逆行角速度: ${planet.speed}°/日` }, '℞ 逆行中 (Retrograde)'),
        ]),
      ]),

      // 3. 核心意涵與宮位解讀
      h('div.astro-popover-body', [
        planet.isRetrograde && h('p.astro-popover-retro-alert', [
          h('span.btn-icon', { html: FORTUNE_ICONS.alert }),
          h('span', `星體逆行中（角速度 ${planet.speed}°/日）：能量偏向內省反思、重新整理與謹慎行事。`),
        ]),
        planet.keywords && h('p.astro-popover-keywords', planet.keywords),
        planet.astroMeaning && h('p.astro-popover-desc', planet.astroMeaning),
        planet.houseDesc && h('p.astro-popover-note', [
          h('strong', `${houseLabel} (${planet.houseTheme || ''})：`),
          h('span', planet.houseDesc),
        ]),
        planet.role && h('p.astro-popover-note', [
          h('strong', `${t('fortune.astro_dev_role') || '個人特質'}：`),
          h('span', planet.role),
        ]),
      ]),

      // 4. 相連主要相位清單
      h('section.astro-popover-aspects', [
        h('h3.astro-popover-aspects-header', t('fortune.astro_aspects_list') || '相連主要相位'),
        planet.aspects && planet.aspects.length > 0
          ? h('ul.astro-popover-aspects-list', planet.aspects.map((asp) => h(`li.astro-aspect-item.is-${aspectTone(asp.harmony)}`, [
            h('div.astro-aspect-item-head', [
              h('span.astro-aspect-swatch', { html: aspectSwatch(aspectTone(asp.harmony)) }),
              h('span.astro-aspect-symbol', { 'aria-hidden': 'true' }, asp.aspectSymbol),
              h('span.astro-aspect-name', [`${asp.aspectName} `, h('span.cf-astro-g', asp.otherSymbol || ''), ` ${asp.otherName}`]),
              h('span.astro-aspect-orb', `(${asp.exactOrb}°)`),
            ]),
            h('p.astro-aspect-desc', asp.desc),
          ])))
          : h('p.astro-popover-empty', t('fortune.astro_no_aspects') || '目前無主相位（空相 / 聚焦專注特質）'),
      ]),

      // 5. 水星逆行天象提示 (若為水星且當前逆行)
      (planet.key === 'mercury' && astroRetrograde?.isRetrograde) ? h('p.astro-popover-retro-alert', [
        h('span.btn-icon', { html: FORTUNE_ICONS.alert }),
        h('span', t('fortune.astro_mercury_retro_warning') || '天象提示：目前實時水星正處於逆行期'),
      ]) : null,
    ].filter(Boolean));
  };

  let astroSettledNatal = null; // planets settle onto the wheel only when a new chart first renders
  const isAstroSheetMode = () => Boolean(window.matchMedia?.('(max-width: 640px)').matches);

  const renderAstroTab = (container) => {
    // 清理舊有全域事件監聽
    if (window._astroCleanup) {
      window._astroCleanup();
      window._astroCleanup = null;
    }
    const isEn = window.CyberFortuneCore?.getLang?.() === 'en';
    const pad2 = (n) => String(n).padStart(2, '0');
    const page = h('div.cf-astro');
    container.appendChild(page);

    // 0. 生辰來源與設定資訊列 (讓使用者清楚看見西洋星盤是依據哪個生辰推算)
    const birthText = `${ziweiBirthYear}-${pad2(ziweiBirthMonth)}-${pad2(ziweiBirthDay)} ${pad2(ziweiBirthHour)}:00`;
    page.appendChild(h('div.fortune-control-strip.cf-astro-birth', [
      h('p.cf-astro-birth-info', [
        h('span.cf-astro-birth-label', t('fortune.astro_birth_label') || '星盤依據生辰'),
        h('strong.cf-astro-birth-value', isEn ? birthText : `西曆 ${birthText}`),
        h('span.cf-astro-birth-city', t('fortune.astro_city_taipei') || '台北 (東八區)'),
      ]),
      h('div.cf-astro-birth-actions', [
        h('button.btn.btn-sm.btn-ghost', {
          type: 'button',
          onclick: () => {
            switchTab('ziwei');
            renderHub();
          },
        }, [
          h('span.btn-icon', { html: FORTUNE_ICONS.calendar }),
          h('span', t('fortune.astro_tweak_birth') || '修改生辰'),
        ]),
        h('button.btn.btn-sm.btn-primary', {
          type: 'button',
          disabled: loadingAstro,
          onclick: loadAstroChart,
        }, t('fortune.astro_recalc') || '重算星盤'),
      ]),
    ]));

    // 1. 水星運行: a small seal plus the printed notice, warnings in ochre
    if (astroRetrograde) {
      const ret = astroRetrograde;
      const state = ret.isRetrograde ? 'retro' : (ret.isInShadow ? 'shadow' : 'direct');
      const message = String(ret.statusMessage || '').replace(/^[^\p{L}\p{N}【]+/u, '');
      const parts = message.match(/^【([^】]+)】\s*([\s\S]*)$/);
      const period = ret.isRetrograde ? ret.currentPeriod : ret.nextPeriod;
      const periodText = period && period.start
        ? [
          ret.isRetrograde ? (isEn ? 'This cycle' : '本輪') : (isEn ? 'Next retrograde' : '下次逆行'),
          `${period.start} – ${period.end || ''}`,
          period.sign,
          !ret.isRetrograde && Number.isFinite(period.daysUntil) ? (isEn ? `in ${period.daysUntil} days` : `${period.daysUntil} 天後`) : null,
        ].filter(Boolean).join(' · ')
        : '';
      page.appendChild(h(`section.cf-astro-retro.is-${state}`, {
        role: state === 'direct' ? null : 'status',
        'aria-label': t('fortune.astro_retrograde_label') || '水星逆行狀態',
      }, [
        h(`div.cf-seal${state === 'direct' ? '' : '.is-ink'}`, { 'aria-hidden': 'true' },
          state === 'retro' ? '逆行' : (state === 'shadow' ? '陰影' : '順行')),
        h('div.cf-astro-retro-text', [
          parts && h('p.cf-astro-retro-title', [
            state !== 'direct' && h('span.btn-icon', { html: FORTUNE_ICONS.alert }),
            h('span', parts[1]),
          ]),
          h('p.cf-astro-retro-body', parts ? parts[2] : message),
          periodText && h('p.cf-astro-retro-period', periodText),
        ]),
      ]));
    }

    if (loadingAstro) {
      page.appendChild(h('div.cf-empty', t('common.loading') || '正在解算天體軌道與相位幾何...'));
      return;
    }

    if (!astroNatal) {
      page.appendChild(h('div.cf-empty', [
        h('p', '點擊載入即可產出個人西洋天宮向量星盤'),
        h('button.btn.btn-sm.btn-primary', { type: 'button', onclick: loadAstroChart }, isEn ? 'Cast chart' : '載入星盤'),
      ]));
      return;
    }

    // 2. 星盤 sheet: the wheel beside ruled tables (stacked on phones)
    const shouldSettle = astroSettledNatal !== astroNatal;
    astroSettledNatal = astroNatal;
    const bodyGrid = h('article.cf-sheet.cf-astro-sheet', { 'aria-label': isEn ? 'Natal chart' : '本命星盤' });

    // 左欄：SVG 向量同心圓星盤
    const wheelContainer = h(`figure.cf-astro-wheel${shouldSettle ? '.is-settling' : ''}`);
    const dataPanel = h('div.cf-astro-data');

    let pinnedPlanetKey = null;
    let hoveredPlanetKey = null;
    let popoverEl = null;
    let popoverOpenedAt = 0;
    let leaveTimeout = null;

    const hidePopover = () => {
      if (popoverEl && popoverEl.parentNode) {
        popoverEl.parentNode.removeChild(popoverEl);
      }
      popoverEl = null;
      pinnedPlanetKey = null;
      hoveredPlanetKey = null;
      updateHighlights(null);
    };

    const updateHighlights = (targetKey) => {
      // 1. 高亮 SVG 星體節點
      const nodes = wheelContainer.querySelectorAll('.astro-planet-node');
      nodes.forEach((n) => {
        if (targetKey && n.getAttribute('data-planet-key') === targetKey) {
          n.classList.add('is-active');
        } else {
          n.classList.remove('is-active');
        }
      });

      // 2. 聚焦相連相位線，淡化非相關線條
      const lines = wheelContainer.querySelectorAll('.astro-aspect-line');
      lines.forEach((l) => {
        if (!targetKey) {
          l.classList.remove('is-highlighted', 'is-dimmed');
        } else {
          const p1 = l.getAttribute('data-aspect-p1');
          const p2 = l.getAttribute('data-aspect-p2');
          if (p1 === targetKey || p2 === targetKey) {
            l.classList.add('is-highlighted');
            l.classList.remove('is-dimmed');
          } else {
            l.classList.remove('is-highlighted');
            l.classList.add('is-dimmed');
          }
        }
      });

      // 3. 高亮右側行星清單表格列
      const rows = dataPanel.querySelectorAll('.astro-planets-table tbody tr');
      rows.forEach((r) => {
        if (targetKey && r.getAttribute('data-planet-key') === targetKey) {
          r.classList.add('is-active');
        } else {
          r.classList.remove('is-active');
        }
      });
    };

    const showPopover = (planetKey, isPin = false) => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
        leaveTimeout = null;
      }
      const planet = astroNatal.planets[planetKey];
      if (!planet) return;

      if (isPin) {
        if (pinnedPlanetKey === planetKey) {
          hidePopover();
          return;
        }
        pinnedPlanetKey = planetKey;
      } else {
        if (pinnedPlanetKey) return;
        hoveredPlanetKey = planetKey;
      }

      updateHighlights(planetKey);

      // A slip already settled on the page swaps its content in place; only a fresh one rises.
      // (A tap fires hover and click back to back; that still counts as a fresh slip.)
      const now = performance.now();
      const wasSettled = Boolean(popoverEl && popoverEl.parentNode) && now - popoverOpenedAt > 300;
      if (popoverEl && popoverEl.parentNode) {
        popoverEl.parentNode.removeChild(popoverEl);
      } else {
        popoverOpenedAt = now;
      }

      popoverEl = renderPlanetPopover(planet, astroNatal, () => {
        hidePopover();
      }, Boolean(pinnedPlanetKey));
      if (wasSettled) popoverEl.classList.add('is-swap');

      popoverEl.addEventListener('mouseenter', () => {
        if (leaveTimeout) {
          clearTimeout(leaveTimeout);
          leaveTimeout = null;
        }
      });
      popoverEl.addEventListener('mouseleave', () => {
        if (!pinnedPlanetKey) {
          leaveTimeout = setTimeout(() => {
            hidePopover();
          }, 200);
        }
      });

      wheelContainer.appendChild(popoverEl);

      // Phones: the slip becomes a bottom sheet instead of covering the small wheel.
      if (isAstroSheetMode()) {
        popoverEl.classList.add('is-sheet');
        return;
      }

      // 智能計算位置與邊界避讓 (Collision Avoidance) — anchored on the node's drawn position
      const nodeEl = svgEl.querySelector(`.astro-planet-node[data-planet-key="${planetKey}"]`);
      const px = Number(nodeEl?.getAttribute('data-px')) || 200;
      const py = Number(nodeEl?.getAttribute('data-py')) || 200;
      const containerRect = wheelContainer.getBoundingClientRect();
      const svgRect = svgEl.getBoundingClientRect();

      const scaleX = svgRect.width / 400;
      const scaleY = svgRect.height / 400;
      const clientX = (svgRect.left - containerRect.left) + px * scaleX;
      const clientY = (svgRect.top - containerRect.top) + py * scaleY;

      const popWidth = Math.min(320, containerRect.width - 20);
      popoverEl.style.width = `${popWidth}px`;
      const popHeight = popoverEl.offsetHeight || 260;

      let left = clientX - popWidth / 2;
      if (left < 10) left = 10;
      if (left + popWidth > containerRect.width - 10) {
        left = containerRect.width - popWidth - 10;
      }

      let top = clientY - popHeight - 14;
      if (top < 10) {
        top = clientY + 16;
      }
      if (top + popHeight > containerRect.height - 10) {
        top = Math.max(10, containerRect.height - popHeight - 10);
      }

      popoverEl.style.left = `${Math.round(left)}px`;
      popoverEl.style.top = `${Math.round(top)}px`;
    };

    const svgEl = renderSvgAstroWheel(astroNatal, {
      onHoverPlanet: (key) => showPopover(key, false),
      onLeavePlanet: (key, force) => {
        if (force) {
          hidePopover();
          return;
        }
        if (!pinnedPlanetKey) {
          leaveTimeout = setTimeout(() => {
            hidePopover();
          }, 200);
        }
      },
      onSelectPlanet: (key) => showPopover(key, true),
    });
    wheelContainer.appendChild(svgEl);

    // Aspect key: the same printed line samples the wheel uses
    const legendItem = (tone, label, glyphs) => h('li', [
      h('span.astro-aspect-swatch', { html: aspectSwatch(tone) }),
      h('span', label),
      glyphs && h('span.cf-astro-g', { 'aria-hidden': 'true' }, glyphs),
    ]);
    wheelContainer.appendChild(h('figcaption.cf-astro-legend', [
      h('ul', [
        legendItem('harm', isEn ? 'Harmonious' : '和諧', '△ ⚹'),
        legendItem('chal', isEn ? 'Challenging' : '緊張', '□ ☍'),
        legendItem('neut', isEn ? 'Conjunction' : '合相', '☌'),
        legendItem('axis', isEn ? 'ASC · MC axes' : '上升・天頂軸', null),
      ]),
    ]));
    bodyGrid.appendChild(wheelContainer);

    // 右欄：軸點、行星落點、天賦亮點 — ruled almanac tables
    if (astroNatal.asc && astroNatal.mc) {
      const angleRow = (label, abbr, point, note) => h('div.cf-row.cf-astro-angle', [
        h('dt', [h('span', label), h('small', abbr)]),
        h('dd', [
          h('b', [h('span.cf-astro-g', point.signSymbol || point.symbol || ''), ` ${point.signName} `, h('span.cf-astro-deg', fmtDeg(point.displayDeg))]),
          h('small', note),
        ]),
      ]);
      dataPanel.appendChild(h('section.cf-ruled.cf-astro-angles', [
        h('h2.cf-vh', h('span', isEn ? 'Angles' : '軸點')),
        h('dl.cf-rows', [
          angleRow('上升', 'ASC', astroNatal.asc, '第 1 宮起點 · 外在生命濾鏡'),
          angleRow('天頂', 'MC', astroNatal.mc, '第 10 宮起點 · 事業與社會成就'),
        ]),
      ]));
    }

    // 行星清單表格 (rows reflow into two lines on phones; roles keep the table semantics)
    const tableEl = h('table.astro-planets-table', { role: 'table' }, [
      h('caption.sr-only', isEn ? 'Planet positions' : '行星落點'),
      h('thead', { role: 'rowgroup' }, h('tr', { role: 'row' },
        ['星體', '星座', '度數', '宮位', '生活意涵'].map((label) => h('th', { role: 'columnheader', scope: 'col' }, label)))),
      h('tbody', { role: 'rowgroup' }, [
        ...Object.values(astroNatal.planets).map((p) => {
          const row = h('tr', { role: 'row' }, [
            h('td.cf-astro-pcell', { role: 'cell' }, h('button.cf-astro-pbtn', { type: 'button', 'aria-haspopup': 'dialog' }, [
              h('span.cf-astro-g.cf-astro-pglyph', { 'aria-hidden': 'true' }, p.planetSymbol || p.symbol),
              h('span.cf-astro-pname', p.name),
              p.isRetrograde && h('span.astro-retrograde-badge', { title: `逆行 (速度 ${p.speed}°/日)` }, '℞ 逆行'),
            ])),
            h('td.cf-astro-sign', { role: 'cell' }, [h('span.cf-astro-g', p.signSymbol || p.symbol), ` ${p.signName}`]),
            h('td.cf-astro-deg', { role: 'cell' }, fmtDeg(p.displayDeg)),
            h('td.cf-astro-house', { role: 'cell' }, p.houseName || `第 ${p.house} 宮`),
            h('td.cf-astro-role', { role: 'cell' }, p.role),
          ]);
          row.setAttribute('data-planet-key', p.key);
          row.addEventListener('mouseenter', () => {
            if (leaveTimeout) clearTimeout(leaveTimeout);
            showPopover(p.key, false);
          });
          row.addEventListener('mouseleave', () => {
            if (!pinnedPlanetKey) {
              leaveTimeout = setTimeout(() => {
                hidePopover();
              }, 200);
            }
          });
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            showPopover(p.key, true);
          });
          return row;
        }),
      ]),
    ]);
    dataPanel.appendChild(h('section.cf-astro-planets', [
      h('h2.cf-vh', h('span', isEn ? 'Planets' : '行星落點')),
      h('div.cf-astro-planets-body', [
        h('p.cf-astro-hint', t('fortune.astro_click_to_inspect') || '點擊星體或列表可檢視深度意涵與相位'),
        tableEl,
      ]),
    ]));

    // 個人天賦亮點
    if (astroNatal.engineerHighlights?.length) {
      dataPanel.appendChild(h('section.cf-astro-gifts', [
        h('h2.cf-vh', h('span', isEn ? 'Highlights' : '天賦亮點')),
        h('ul', astroNatal.engineerHighlights.map((item) => h('li', [
          h('b', item.title),
          h('span', item.desc),
        ]))),
      ]));
    }

    bodyGrid.appendChild(dataPanel);
    page.appendChild(bodyGrid);

    // 全域鍵盤 Escape 與點擊外部關閉處理
    const onDocClick = (e) => {
      if (!wheelContainer.contains(e.target) && !dataPanel.contains(e.target)) {
        hidePopover();
      }
    };
    const onDocKeyDown = (e) => {
      if (e.key === 'Escape') {
        hidePopover();
      }
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onDocKeyDown);

    window._astroCleanup = () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onDocKeyDown);
      if (leaveTimeout) clearTimeout(leaveTimeout);
    };
  };

  /**
   * 繪製同心圓向量 SVG 星盤 (防重疊交錯階層與天象刻度), printed in the two inks:
   * vermilion frame, rules and sign glyphs; ink planets; aspects told apart by dash pattern.
   * Colours live in tab-astro.css classes so both themes reprint it.
   */
  const renderSvgAstroWheel = (natal, handlers = {}) => {
    const { onSelectPlanet, onHoverPlanet, onLeavePlanet } = handlers;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const cx = 200;
    const cy = 200;
    const rOuter = 192; // thick frame line
    const rOuterThin = 188.5; // thin frame line
    const rZodiac = 160; // inner edge of the sign band
    const rHouseRing = 92; // house-number ring
    const rCenter = 76; // aspect web
    const TIER_R = [143, 125, 107]; // staggered planet radii
    const ascOffset = natal.asc?.longitude || 0;
    const planets = natal.planets || {};
    const r2 = (n) => Math.round(n * 100) / 100;
    const angleOf = (lon) => ((180 - (lon - ascOffset)) * Math.PI) / 180;
    const at = (r, rad) => [r2(cx + r * Math.cos(rad)), r2(cy - r * Math.sin(rad))];

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('class', 'astro-wheel-svg');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', '本命星盤 · Natal wheel');
    const draw = (tag, attrs, parent = svg) => {
      const node = document.createElementNS(SVG_NS, tag);
      Object.entries(attrs).forEach(([k, v]) => {
        if (v !== null && v !== undefined) node.setAttribute(k, String(v));
      });
      parent.appendChild(node);
      return node;
    };
    const label = (x, y, cls, text, parent) => {
      const node = draw('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: cls }, parent);
      node.textContent = text;
      return node;
    };

    // 1. Paper, the sign band in a light vermilion wash, and the thick-and-thin frame
    draw('circle', { cx, cy, r: rOuter, class: 'cf-w-paper' });
    draw('circle', { cx, cy, r: (rOuter + rZodiac) / 2, 'stroke-width': rOuter - rZodiac, class: 'cf-w-band' });
    draw('circle', { cx, cy, r: rZodiac, class: 'cf-w-rule-red' });
    draw('circle', { cx, cy, r: rHouseRing, class: 'cf-w-rule' });
    draw('circle', { cx, cy, r: rCenter, class: 'cf-w-core' });
    draw('circle', { cx, cy, r: rOuterThin, class: 'cf-w-frame-thin' });
    draw('circle', { cx, cy, r: rOuter, class: 'cf-w-frame' });

    // Degree scale on the band's inner edge: 5° ticks, longer every 10°
    let ticks = '';
    for (let d = 5; d < 360; d += 5) {
      if (d % 30 === 0) continue;
      const [x1, y1] = at(rZodiac, angleOf(d));
      const [x2, y2] = at(rZodiac + (d % 10 === 0 ? 5 : 3), angleOf(d));
      ticks += `M${x1} ${y1}L${x2} ${y2}`;
    }
    draw('path', { d: ticks, class: 'cf-w-ticks' });

    const zodiacSymbols = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎'];

    // 2. 十二星座: sign divisions across the band, glyphs printed in vermilion
    for (let i = 0; i < 12; i++) {
      const [dx1, dy1] = at(rZodiac, angleOf(i * 30));
      const [dx2, dy2] = at(rOuterThin, angleOf(i * 30));
      draw('line', { x1: dx1, y1: dy1, x2: dx2, y2: dy2, class: 'cf-w-sign-div' });

      // 星座符號文字 (使用 \uFE0E 與專屬字型杜絕 Apple Emoji 方塊)
      const [tx, ty] = at((rOuterThin + rZodiac) / 2 + 1, angleOf(i * 30 + 15));
      label(tx, ty, 'cf-w-sign', zodiacSymbols[i]);
    }

    // 3. 十二宮: hairline cusps; the four axes in vermilion with a register tick past the frame
    if (Array.isArray(natal.houses) && natal.houses.length) {
      natal.houses.forEach((hInfo, idx) => {
        const rad = angleOf(hInfo.cuspLongitude);
        const isMainAxis = idx === 0 || idx === 3 || idx === 6 || idx === 9; // ASC, IC, DSC, MC
        const [hx1, hy1] = at(rCenter, rad);
        const [hx2, hy2] = at(rZodiac, rad);
        draw('line', { x1: hx1, y1: hy1, x2: hx2, y2: hy2, class: isMainAxis ? 'cf-w-axis' : 'cf-w-cusp' });
        if (isMainAxis) {
          const [ox1, oy1] = at(rOuter, rad);
          const [ox2, oy2] = at(rOuter + 6, rad);
          draw('line', { x1: ox1, y1: oy1, x2: ox2, y2: oy2, class: 'cf-w-axis' });
        }

        // 宮位編號文字
        const nextCusp = natal.houses[(idx + 1) % natal.houses.length];
        const span = (nextCusp.cuspLongitude - hInfo.cuspLongitude + 360) % 360;
        const [numX, numY] = at((rCenter + rHouseRing) / 2, angleOf(hInfo.cuspLongitude + span / 2));
        label(numX, numY, 'cf-w-house-num', String(hInfo.house));
      });
    }

    // 4. 相位: chords inside the core — 吉 red solid, 凶 ink dashed, 合 gray dotted
    (natal.aspects || []).forEach((asp) => {
      const p1 = planets[asp.p1Key];
      const p2 = planets[asp.p2Key];
      if (!p1 || !p2) return;
      const [ax1, ay1] = at(rCenter - 3, angleOf(p1.longitude));
      const [ax2, ay2] = at(rCenter - 3, angleOf(p2.longitude));
      draw('line', {
        x1: ax1,
        y1: ay1,
        x2: ax2,
        y2: ay2,
        class: `astro-aspect-line cf-asp-line cf-asp-${aspectTone(asp.harmony)}`,
        'data-aspect-p1': asp.p1Key,
        'data-aspect-p2': asp.p2Key,
      });
    });

    // 5. 行星標記點與徽章 (具備智能防撞多層階梯演算法)
    const rawPlanetList = Object.values(planets).map((p) => {
      const pDeg = ((180 - (p.longitude - ascOffset)) % 360 + 360) % 360;
      return { ...p, pDeg };
    }).sort((a, b) => a.pDeg - b.pDeg);

    // 計算各行星的防碰撞半徑 (交替三層)
    const staggeredList = rawPlanetList.map((p, idx) => {
      let tier = 0;
      for (let prevIdx = 0; prevIdx < idx; prevIdx++) {
        const prev = rawPlanetList[prevIdx];
        let diff = Math.abs(p.pDeg - prev.pDeg);
        if (diff > 180) diff = 360 - diff;
        if (diff < 13) {
          tier = (prev.tier + 1) % 3;
        }
      }
      p.tier = tier;
      p.rBadge = TIER_R[tier];
      p.rad = (p.pDeg * Math.PI) / 180;
      [p.px, p.py] = at(p.rBadge, p.rad);
      return p;
    });

    // Exact-degree marks on the band edge, dotted leaders, and the projection dots the aspects start from
    staggeredList.forEach((p) => {
      const [mx1, my1] = at(rZodiac, p.rad);
      const [mx2, my2] = at(rZodiac - 5, p.rad);
      const [dx, dy] = at(rCenter, p.rad);
      draw('line', { x1: mx1, y1: my1, x2: mx2, y2: my2, class: 'cf-w-pmark' });
      draw('line', { x1: p.px, y1: p.py, x2: mx2, y2: my2, class: 'cf-w-leader' });
      draw('circle', { cx: dx, cy: dy, r: 1.8, class: 'cf-w-pdot' });
    });

    staggeredList.forEach((p, idx) => {
      const { px, py } = p;
      // Where the badge settles from on first render: the band edge, along its own ray
      const [sx, sy] = at(rZodiac - 4, p.rad);

      // 行星圓形徽章群組 (drawn position kept on the node for the slip's anchor)
      const g = draw('g', {
        class: 'astro-planet-node',
        tabindex: '0',
        role: 'button',
        'aria-haspopup': 'dialog',
        'aria-label': `${p.name} (${p.en || ''}) 在 ${p.signName} ${p.displayDeg}，第 ${p.house} 宮`,
        'data-planet-key': p.key,
        'data-px': px,
        'data-py': py,
        style: `--i: ${idx}; --sx: ${r2(sx - px)}px; --sy: ${r2(sy - py)}px`,
      });
      draw('circle', { cx: px, cy: py, r: 15, class: 'cf-pn-hit' }, g);
      draw('circle', { cx: px, cy: py, r: 14, class: 'cf-pn-focus' }, g);
      draw('circle', { cx: px, cy: py, r: 10.5, class: 'cf-pn-ring' }, g);

      // 行星符號文字 (☉, ☽, ☿, ♀︎, ♂︎, ♃, ♄, ♅, ♆, ♇)
      label(px, py, 'cf-pn-glyph', p.planetSymbol || p.symbol, g);
      if (p.isRetrograde) label(r2(px + 11), r2(py + 9), 'cf-pn-retro', '℞', g);

      // 互動事件綁定 (Hover, Focus, Click, Keydown)
      g.addEventListener('mouseenter', () => {
        onHoverPlanet?.(p.key);
      });
      g.addEventListener('mouseleave', () => {
        onLeavePlanet?.(p.key, false);
      });
      g.addEventListener('focus', () => {
        onHoverPlanet?.(p.key);
      });
      g.addEventListener('blur', () => {
        onLeavePlanet?.(p.key, false);
      });
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPlanet?.(p.key);
      });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onSelectPlanet?.(p.key);
        } else if (e.key === 'Escape') {
          onLeavePlanet?.(p.key, true);
        }
      });

      // 原生 Title 作為輔助無障礙降級相容
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = `${p.name} 在 ${p.signName} ${p.displayDeg} (第 ${p.house} 宮)`;
      g.appendChild(title);
    });

    return svg;
  };

  // -------------------------------------------------------------
  // Tab 6: 靈籤求索 (台灣求籤六十甲子籤)
  // -------------------------------------------------------------
  let oracleViewController = null;
  const renderOracleTab = (container) => {
    if (!oracleViewController && typeof window.createFortuneOracleView === 'function') {
      oracleViewController = window.createFortuneOracleView();
    }
    if (oracleViewController) {
      oracleViewController.render(container);
    } else {
      container.appendChild(h('div.p-4.text-center.muted', t('common.loading') || '正在載入天上聖母六十甲子籤庫...'));
    }
  };

  let tarotViewController = null;
  const renderTarotTab = (container) => {
    if (!tarotViewController && typeof window.createFortuneTarotView === 'function') {
      tarotViewController = window.createFortuneTarotView();
    }
    if (tarotViewController) {
      tarotViewController.render(container);
    } else {
      container.appendChild(h('div.p-4.text-center.muted', t('common.loading') || '正在載入經典韋特塔羅牌庫...'));
    }
  };

  // 初次掛載 (a deep-linked tab loads its own data)
  if (hashTab === 'ziwei-compat') ziweiMode = 'compat';
  renderHub();
  if (activeTab !== 'almanac') {
    const initialDef = TAB_DEFS.find((tab) => tab.key === activeTab);
    if (initialDef) initialDef.onOpen();
  }

  return rootEl;
}

window.createFortuneHub = createFortuneHub;

// -------------------------------------------------------------
// Global Fortune Cache & Standalone Drawer Launcher
// -------------------------------------------------------------
let _globalDailyFortuneCache = null;
let _globalDailyFortunePromise = null;

async function getOrFetchDailyFortune(force = false) {
  if (!force && _globalDailyFortuneCache) return _globalDailyFortuneCache;
  if (!force && typeof window !== 'undefined' && window._globalDailyFortuneCache) {
    _globalDailyFortuneCache = window._globalDailyFortuneCache;
    return _globalDailyFortuneCache;
  }
  if (!force && _globalDailyFortunePromise) return _globalDailyFortunePromise;

  const apiClient = (typeof window !== 'undefined' && window.api)
    || (typeof api !== 'undefined' && api)
    || null;
  if (!apiClient || typeof apiClient.get !== 'function') return null;

  _globalDailyFortunePromise = apiClient.get('/api/fortune/daily')
    .then((res) => {
      if (res && res.ok) {
        _globalDailyFortuneCache = res;
        if (typeof window !== 'undefined') window._globalDailyFortuneCache = res;
        return res;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      _globalDailyFortunePromise = null;
    });
  return _globalDailyFortunePromise;
}

function openFortuneDrawer(options = {}) {
  const cardWrap = h('div.dev-almanac-wrap.projects-fortune-panel');
  const userId = (typeof App !== 'undefined' && App.user?.id) || 'guest';
  const storageKeySign = `zuto_fortune_sign_${userId}`;
  let currentSign = (typeof localStorage !== 'undefined' && localStorage.getItem(storageKeySign)) || 'scorpio';
  let dailyData = _globalDailyFortuneCache || (typeof window !== 'undefined' ? window._globalDailyFortuneCache : null);
  let horoscopeData = null;

  const copyShareText = () => {
    if (!dailyData) return;
    const lines = [
      t('fortune.copy_template_header', { date: dailyData.date }) || `🔮【吉時行樂 今日老黃曆】${dailyData.date}`,
      `👤 ${t('fortune.copy_user', { name: dailyData.username }) || `算命道友：${dailyData.username}`}`,
      `🌟 ${t('fortune.copy_luck', { level: dailyData.luck.label, badge: dailyData.luck.badge }) || `今日天命：${dailyData.luck.label}（${dailyData.luck.badge}）`}`,
      `✅【${t('fortune.auspicious') || '宜'}】：` + dailyData.auspicious.map((a) => `\n   • ${a.action}（${a.desc}）`).join(''),
      `❌【${t('fortune.inauspicious') || '忌'}】：` + dailyData.inauspicious.map((a) => `\n   • ${a.action}（${a.desc}）`).join(''),
      `🍵 ${t('fortune.lucky_status_code') || '幸運數字'}：${dailyData.lucky_code.code} · ${dailyData.lucky_code.meaning}`,
      `🎨 ${t('fortune.lucky_color') || '幸運色'}：${dailyData.lucky_color.name} (${dailyData.lucky_color.hex})`,
      `🧭 ${t('fortune.lucky_direction') || '吉神方位'}：${dailyData.lucky_direction}`,
      horoscopeData ? `♈ 星座星相（${horoscopeData.sign_name} ${horoscopeData.sign_symbol}）：工作 ${horoscopeData.work_index}% · 健康 ${horoscopeData.health_index}%\n💡 提醒：${horoscopeData.daily_advice}` : null,
      `📜 ${t('fortune.geek_quote') || '每日禪語'}：${dailyData.geek_quote}`,
    ].filter(Boolean).join('\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(lines).then(() => {
        toast(t('fortune.copied_toast') || '今日老黃曆已複製到剪貼簿！');
      }).catch(() => {
        promptModal(t('fortune.share_btn') || '複製分享', { defaultValue: lines });
      });
    } else {
      promptModal(t('fortune.share_btn') || '複製分享', { defaultValue: lines });
    }
  };

  const renderPanel = () => {
    clear(cardWrap);
    if (!dailyData) {
      cardWrap.appendChild(h('div.p-4.text-center.muted.small', t('common.loading') || '載入今日老黃曆中...'));
      return;
    }
    if (window.createFortuneHub) {
      const hubEl = window.createFortuneHub({
        dailyData,
        horoscopeData,
        activeSign: currentSign,
        initialTab: options.initialTab,
        onShareDaily: copyShareText,
        onSignChange: (sign) => {
          currentSign = sign;
          try { localStorage.setItem(storageKeySign, sign); } catch {}
        },
      });
      cardWrap.appendChild(hubEl);
    }
  };

  renderPanel();

  const closeDrawer = typeof window.openAuthDrawer === 'function' ? window.openAuthDrawer(cardWrap, t('fortune.title') || '今日運勢', {
    wide: true,
  }) : null;

  setTimeout(() => {
    const popup = document.querySelector('.auth-drawer-popup:has(.projects-fortune-panel), .auth-drawer-popup:has(.projects-fortune-hub-root)');
    if (popup) popup.classList.add('auth-drawer-fortune');
  }, 50);

  if (!dailyData) {
    getOrFetchDailyFortune().then((res) => {
      if (res) {
        dailyData = res;
        renderPanel();
      }
    });
  }

  return closeDrawer;
}

window.getOrFetchDailyFortune = getOrFetchDailyFortune;
window.openFortuneDrawer = openFortuneDrawer;

