/**
 * public/js/fortune-ziwei-compatibility.js
 * 紫微斗數雙人合盤前端介面模組（C3：表單、雙盤並排／切換、地支疊宮、計算依據）
 * 紅黑雙色農民曆：甲乙兩張生辰帖 → 一張合盤總紙（雙方對照 + 合盤印 + 條目統計）。
 * 規範：純 SVG 圖示、token 配色、全面 i18n、無總分、不寫 localStorage / URL
 */

(function initZiweiCompatibilityModule() {
  const SHICHEN_OPTIONS = [
    { value: '丑', labelZh: '丑時 (01:00–02:59)', labelEn: 'Chou (01:00–02:59)' },
    { value: '寅', labelZh: '寅時 (03:00–04:59)', labelEn: 'Yin (03:00–04:59)' },
    { value: '卯', labelZh: '卯時 (05:00–06:59)', labelEn: 'Mao (05:00–06:59)' },
    { value: '辰', labelZh: '辰時 (07:00–08:59)', labelEn: 'Chen (07:00–08:59)' },
    { value: '巳', labelZh: '巳時 (09:00–10:59)', labelEn: 'Si (09:00–10:59)' },
    { value: '午', labelZh: '午時 (11:00–12:59)', labelEn: 'Wu (11:00–12:59)' },
    { value: '未', labelZh: '未時 (13:00–14:59)', labelEn: 'Wei (13:00–14:59)' },
    { value: '申', labelZh: '申時 (15:00–16:59)', labelEn: 'Shen (15:00–16:59)' },
    { value: '酉', labelZh: '酉時 (17:00–18:59)', labelEn: 'You (17:00–18:59)' },
    { value: '戌', labelZh: '戌時 (19:00–20:59)', labelEn: 'Xu (19:00–20:59)' },
    { value: '亥', labelZh: '亥時 (21:00–22:59)', labelEn: 'Hai (21:00–22:59)' },
  ];

  // 4x4 中空紫微方盤地支排列 (與 views-fortune.js 相同座標)
  const GRID_BRANCH_MAP = [
    [5, 6, 7, 8],
    [4, -1, -1, 9],
    [3, -2, -2, 10],
    [2, 1, 0, 11],
  ];

  const ICONS = {
    compare: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
  };

  const PALACE_MEANINGS = {
    ming: { zh: '代表一個人的核心性格、自我意識、價值觀與面對世界的基本姿態，是整張命盤的總綱。', en: 'Core temperament, self-identity, values, and default way of engaging with the world.' },
    xiongdi: { zh: '反映手足互動、親近同儕、日常合作默契，以及金錢流動與私房資源的調度感。', en: 'Siblings, close peers, everyday teamwork, and liquid personal resources.' },
    fuqi: { zh: '象徵伴侶關係、親密互動模式、對另一半的期待，以及婚姻與長期承諾的相處課題。', en: 'Romantic partnership, intimacy dynamics, partner expectations, and long-term commitment.' },
    zinv: { zh: '代表子女緣分、共同創作與培養下一代的態度，也反映親密關係中的熱情與玩心。', en: 'Children, shared creative projects, nurturing style, and playful romance.' },
    caibo: { zh: '反映理財觀念、賺錢與花錢習慣、資源安全感，以及兩人共同處理金錢的節奏。', en: 'Financial habits, earning/spending style, resource security, and money teamwork.' },
    jie: { zh: '象徵身心健康、壓力反應、情緒疲勞點與需要被照顧的身體或心理界線。', en: 'Physical and mental wellness, stress responses, and personal care boundaries.' },
    qianyi: { zh: '代表外出發展、旅行適應、外在形象與社交場域給人的第一印象。', en: 'Travel, external opportunities, public persona, and first impressions.' },
    jiaoyou: { zh: '反映朋友圈、同事與社群人際互動，以及對伴侶社交圈的包容與界線。', en: 'Friends, colleagues, broader social circles, and peer boundaries.' },
    guanlu: { zh: '象徵事業方向、工作投入程度、行事作風與面對責任目標的執行方式。', en: 'Career direction, work ethic, ambition, and how responsibilities are handled.' },
    tianzhai: { zh: '代表居家環境、家庭氛圍、置產與生活空間的安全感，以及同居／成家習慣。', en: 'Home environment, family atmosphere, living space habits, and domestic security.' },
    fude: { zh: '反映精神生活、內心安全感、興趣嗜好與獨處時如何消化情緒、獲得滿足。', en: 'Inner peace, mental nourishment, hobbies, and how emotional energy recharges.' },
    fumu: { zh: '象徵與長輩／父母的相處模式、原生家庭影響、文書規範與對權威的態度。', en: 'Parents/elders, family-of-origin dynamics, formal agreements, and authority.' },
  };

  const MAIN_STAR_TRAITS = {
    紫微: { zh: '領導統御、自尊與大局觀，重視體面與主導節奏。', en: 'Leadership, dignity, big-picture poise.' },
    天機: { zh: '思緒敏捷、善於規劃協調，容易多慮或反覆推敲。', en: 'Analytical agility, planning, thoughtful adaptability.' },
    太陽: { zh: '熱情直爽、樂於付出照顧，但也較在乎被看見與肯定。', en: 'Warmth, generosity, expressive vitality.' },
    武曲: { zh: '務實果斷、重視承諾與執行力，較不擅長繞彎表達柔情。', en: 'Pragmatism, decisiveness, steady execution.' },
    天同: { zh: '溫和隨緣、重視情感舒適度，遇衝突偏向先求和平。', en: 'Gentleness, harmony-seeking, emotional comfort.' },
    廉貞: { zh: '敏銳執著、重原則與自我標準，在親密關係中愛恨分明。', en: 'Intensity, strong principles, emotional focus.' },
    天府: { zh: '穩重包容、重視安全感與生活品質，偏向守成與照顧。', en: 'Stability, inclusiveness, steady stewardship.' },
    太陰: { zh: '細膩體貼、重視內心感受與居家氛圍，情緒較內斂。', en: 'Sensitivity, tenderness, quiet depth.' },
    貪狼: { zh: '魅力多元、好奇心強、重視生活情趣與人際互動。', en: 'Charisma, curiosity, zest for life and social warmth.' },
    巨門: { zh: '觀察入微、重視溝通真相與邏輯，語氣直接時易顯犀利。', en: 'Perceptiveness, probing communication, seeking clarity.' },
    天相: { zh: '講究禮節分寸、重視平衡與協調，樂於替對方設想。', en: 'Diplomacy, fairness, balanced consideration.' },
    天梁: { zh: '成熟照顧、重道義與保護感，有時容易帶出說教口吻。', en: 'Mentoring care, integrity, protective steadiness.' },
    七殺: { zh: '獨立果敢、行動力強、不喜拖泥帶水，重視自由空間。', en: 'Independence, boldness, direct action.' },
    破軍: { zh: '勇於突破、重視真實感與改變，不喜歡一成不變的相處。', en: 'Transformation, pioneering energy, authenticity.' },
  };

  const TAIWAN_CITIES = [
    { value: '台北市', labelZh: '台北市', labelEn: 'Taipei City, Taiwan' },
    { value: '新北市', labelZh: '新北市', labelEn: 'New Taipei City, Taiwan' },
    { value: '基隆市', labelZh: '基隆市', labelEn: 'Keelung City, Taiwan' },
    { value: '桃園市', labelZh: '桃園市', labelEn: 'Taoyuan City, Taiwan' },
    { value: '新竹市', labelZh: '新竹市', labelEn: 'Hsinchu City, Taiwan' },
    { value: '新竹縣', labelZh: '新竹縣', labelEn: 'Hsinchu County, Taiwan' },
    { value: '苗栗縣', labelZh: '苗栗縣', labelEn: 'Miaoli County, Taiwan' },
    { value: '台中市', labelZh: '台中市', labelEn: 'Taichung City, Taiwan' },
    { value: '彰化縣', labelZh: '彰化縣', labelEn: 'Changhua County, Taiwan' },
    { value: '南投縣', labelZh: '南投縣', labelEn: 'Nantou County, Taiwan' },
    { value: '雲林縣', labelZh: '雲林縣', labelEn: 'Yunlin County, Taiwan' },
    { value: '嘉義市', labelZh: '嘉義市', labelEn: 'Chiayi City, Taiwan' },
    { value: '嘉義縣', labelZh: '嘉義縣', labelEn: 'Chiayi County, Taiwan' },
    { value: '台南市', labelZh: '台南市', labelEn: 'Tainan City, Taiwan' },
    { value: '高雄市', labelZh: '高雄市', labelEn: 'Kaohsiung City, Taiwan' },
    { value: '屏東縣', labelZh: '屏東縣', labelEn: 'Pingtung County, Taiwan' },
    { value: '宜蘭縣', labelZh: '宜蘭縣', labelEn: 'Yilan County, Taiwan' },
    { value: '花蓮縣', labelZh: '花蓮縣', labelEn: 'Hualien County, Taiwan' },
    { value: '台東縣', labelZh: '台東縣', labelEn: 'Taitung County, Taiwan' },
    { value: '澎湖縣', labelZh: '澎湖縣', labelEn: 'Penghu County, Taiwan' },
    { value: '金門縣', labelZh: '金門縣', labelEn: 'Kinmen County, Taiwan' },
    { value: '連江縣', labelZh: '連江縣', labelEn: 'Lienchiang County, Taiwan' },
  ];

  // 甲／乙 printed names (glyph for the heading column, short name for the sheet head)
  const PARTY = {
    A: { glyph: { zh: '甲', en: 'A' }, short: { zh: '甲方', en: 'Person A' } },
    B: { glyph: { zh: '乙', en: 'B' }, short: { zh: '乙方', en: 'Person B' } },
  };

  // Labels this panel prints that have no i18n key yet
  const COPY = {
    seal: { zh: '合盤', en: '合盤' },
    sealCaption: { zh: ['雙向比對', '不計總分'], en: ['Both ways', 'No total score'] },
    tallyUnit: { zh: '條' },
    tallyLabel: { zh: '合盤條目統計', en: 'Findings tally' },
    viewsLabel: { zh: '合盤檢視方式', en: 'Result views' },
    switchLabel: { zh: '切換命盤', en: 'Choose chart' },
    jumpToChart: { zh: '在盤上看', en: 'Show on chart' },
    mingGong: { zh: '命宮', en: 'Life palace' },
    stem: { zh: '天干', en: 'Stem' },
    sihua: { zh: '四化', en: 'SiHua' },
    star: { zh: '星曜', en: 'Star' },
    targetPalace: { zh: '落入宮位', en: 'Target palace' },
    branch: { zh: '地支', en: 'Branch' },
    status: { zh: '狀態', en: 'Status' },
    minorTag: { zh: '輔', en: 'minor' },
    raw: { zh: '原始輸入', en: 'Raw' },
    wallClock: { zh: '當地時間', en: 'Wall clock' },
    utc: { zh: 'UTC 時刻', en: 'UTC instant' },
    offset: { zh: '時差', en: 'Offset' },
    dst: { zh: '夏令時間', en: 'DST' },
    yes: { zh: '是', en: 'Yes' },
    no: { zh: '否', en: 'No' },
    ruleset: { zh: '規則集', en: 'Ruleset' },
    engine: { zh: '排盤引擎', en: 'Engine' },
    calendar: { zh: '曆法資料', en: 'Calendar' },
    layer: { zh: '支援時間層', en: 'Supported layer' },
    excluded: { zh: '未納入', en: 'Excluded' },
    warnings: { zh: '注意事項', en: 'Warnings' },
  };

  const SIHUA_STATUS = {
    matched: { zh: '已落宮', en: 'matched' },
    uncovered: { zh: '未涵蓋', en: 'uncovered' },
    ambiguous: { zh: '待確認', en: 'ambiguous' },
  };

  // 僅保留於元件記憶體，不寫入 localStorage 或 URL
  const state = {
    personA: {
      key: 'A',
      nickname: '',
      calendar: 'solar',
      date: '1992-08-15',
      isLeapMonth: false,
      timePrecision: 'minute',
      time: '10:30',
      shichen: '巳',
      timeZone: 'Asia/Taipei',
      birthCity: '台北市',
      chartSex: 'M',
    },
    personB: {
      key: 'B',
      nickname: '',
      calendar: 'solar',
      date: '1994-03-12',
      isLeapMonth: false,
      timePrecision: 'minute',
      time: '15:20',
      shichen: '申',
      timeZone: 'Asia/Taipei',
      birthCity: '台北市',
      chartSex: 'F',
    },
    loading: false,
    result: null,
    isStale: false,
    activeView: 'summary', // 'summary' | 'dual' | 'overlay' | 'evidence'
    mobileChartKey: 'A', // 'A' | 'B'
    highlight: null, // { personKey: 'A' | 'B', branchIndex: number, starId?: string }
    popoverPalace: null, // { personKey: 'A' | 'B', branchIndex: number }
    requestSeq: 0,
    focusKey: null, // data-zc-key of the control to refocus after a re-render
  };

  // The result the seal last stamped for: the moment plays once per new result, never on re-render.
  let lastStampedResult = null;
  let popoverKeyHandler = null;

  function getLang() {
    // The hub stores the language through CyberFortuneCore (zuto_lang); fall back to zh-TW.
    return window.CyberFortuneCore?.getLang?.() || 'zh-TW';
  }

  function pickText(bilingual) {
    if (!bilingual) return '';
    if (typeof bilingual === 'string') return bilingual;
    const isEn = getLang() === 'en';
    return isEn ? (bilingual.en || bilingual.zh || '') : (bilingual.zh || bilingual.en || '');
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Star label with its 四化 mark: 祿權科 print red, 忌 prints ink.
  function starLabel(h, s) {
    if (!s.sihua) return s.name;
    return [s.name, h(`i.ziwei-compat-hua${s.sihua === '忌' ? '.is-ji' : ''}`, `(${s.sihua})`)];
  }

  function renderMiniChart(chart, personKey, h) {
    const isHighlightedPerson = state.highlight && state.highlight.personKey === personKey;
    const grid = h('div.ziwei-compat-mini-grid');

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cellCode = GRID_BRANCH_MAP[r][c];
        if (cellCode === -1) {
          if (r === 1 && c === 1) {
            const center = h('div.ziwei-compat-mini-center', {
              style: 'grid-column: 2 / span 2; grid-row: 2 / span 2;',
            }, [
              h('div.ziwei-compat-center-title', `${personKey === 'A' ? 'A' : 'B'}${chart.nickname ? ` · ${chart.nickname}` : ''}`),
              h('div.ziwei-compat-center-line', `${chart.profile.mingGong} · ${chart.profile.bureau}`),
              h('div.ziwei-compat-center-line', `${chart.profile.lunarDate}`),
              h('div.ziwei-compat-center-line', `${chart.profile.bazi.year}年 ${chart.profile.bazi.month}月 ${chart.profile.bazi.day}日`),
            ]);
            grid.appendChild(center);
          }
          continue;
        }
        if (cellCode === -2) continue;

        const palace = chart.palaces.find((p) => p.branchIndex === cellCode);
        if (!palace) continue;

        const isPalaceHit = isHighlightedPerson && state.highlight.branchIndex === palace.branchIndex;
        const cell = h(`button.ziwei-compat-cell${isPalaceHit ? '.is-highlighted' : ''}`, {
          type: 'button',
          'data-zc-key': `cell-${personKey}-${palace.branchIndex}`,
          'aria-haspopup': 'dialog',
          'aria-current': isPalaceHit ? 'true' : null,
          onclick: () => {
            state.highlight = { personKey, branchIndex: palace.branchIndex, starId: null };
            state.popoverPalace = { personKey, branchIndex: palace.branchIndex };
            if (typeof window._rerenderZiweiCompat === 'function') window._rerenderZiweiCompat();
          },
        }, [
          h('span.ziwei-compat-cell-head', [
            h('span.ziwei-compat-palace-name', palace.name),
            h('span.ziwei-compat-branch', `${palace.stemBranch}`),
          ]),
          h('span.ziwei-compat-stars', [
            ...palace.mainStars.map((s) => {
              const starHit = isPalaceHit && state.highlight?.starId === s.name;
              return h(`span.ziwei-compat-star.is-main${starHit ? '.is-star-hit' : ''}`, starLabel(h, s));
            }),
            ...palace.minorStars.map((s) => {
              const starHit = isPalaceHit && state.highlight?.starId === s.name;
              return h(`span.ziwei-compat-star.is-minor${starHit ? '.is-star-hit' : ''}`, starLabel(h, s));
            }),
          ]),
        ]);
        grid.appendChild(cell);
      }
    }

    return grid;
  }

  window.renderZiweiCompatibilityPanel = function renderZiweiCompatibilityPanel(container, deps) {
    const { h, t, api, toast, input, select } = deps;
    const isEn = getLang() === 'en';
    const partyShort = (k) => pickText(PARTY[k].short);
    const personTitle = (k) => t(k === 'A' ? 'fortune.ziwei_compat_person_a' : 'fortune.ziwei_compat_person_b');

    const rerender = () => {
      const active = document.activeElement;
      if (active && container.contains(active) && active.getAttribute('data-zc-key')) {
        state.focusKey = active.getAttribute('data-zc-key');
      }
      container.innerHTML = '';
      window.renderZiweiCompatibilityPanel(container, deps);
    };
    window._rerenderZiweiCompat = rerender;

    const markDirty = () => {
      if (state.result) state.isStale = true;
    };

    // Each render starts clean: drop a stale Escape handler from a previous popover.
    if (popoverKeyHandler) {
      document.removeEventListener('keydown', popoverKeyHandler);
      popoverKeyHandler = null;
    }

    // 1. 甲／乙生辰帖：each slip is a ruled form with a vermilion heading column
    const ruledRow = (label, controls, opts = {}) => {
      const tag = opts.wrapLabel ? 'label' : 'div';
      return h(`${tag}.ziwei-compat-row${opts.className ? `.${opts.className}` : ''}`, [
        h('span.ziwei-compat-row-label', label),
        h('span.ziwei-compat-row-ctl', controls),
      ]);
    };

    const buildPersonCard = (person, isPersonA) => {
      const k = isPersonA ? 'A' : 'B';
      const card = h(`article.ziwei-compat-slip.${isPersonA ? 'is-a' : 'is-b'}`, { 'aria-label': personTitle(k) });

      card.appendChild(h('div.cf-vh.ziwei-compat-slip-vh', { 'aria-hidden': 'true' }, h('span', pickText(PARTY[k].glyph))));

      const body = h('div.ziwei-compat-slip-body');
      body.appendChild(h('header.ziwei-compat-slip-head', [
        h('h3.ziwei-compat-slip-title', personTitle(k)),
        isPersonA
          ? h('button.btn.btn-sm.btn-ghost.ziwei-compat-profile-btn', {
              type: 'button',
              'data-zc-key': 'load-profile',
              onclick: async () => {
                try {
                  const res = await api.get('/api/fortune/profile');
                  if (!res?.profile) {
                    toast(t('fortune.ziwei_compat_profile_missing'), 'warn');
                    return;
                  }
                  const p = res.profile;
                  person.calendar = p.calendar_type === 'lunar' ? 'lunar' : 'solar';
                  person.date = `${String(p.birth_year).padStart(4, '0')}-${String(p.birth_month).padStart(2, '0')}-${String(p.birth_day).padStart(2, '0')}`;
                  person.isLeapMonth = Boolean(p.is_leap_month);
                  person.timePrecision = 'minute';
                  person.time = `${String(p.birth_hour).padStart(2, '0')}:${String(p.birth_minute || 0).padStart(2, '0')}`;
                  person.chartSex = p.gender === 'F' ? 'F' : 'M';
                  markDirty();
                  toast(t('fortune.ziwei_compat_profile_loaded'), 'ok');
                  rerender();
                } catch {
                  toast(t('fortune.ziwei_compat_profile_missing'), 'warn');
                }
              },
            }, t('fortune.ziwei_compat_use_my_profile'))
          : null,
      ]));

      const rows = h('div.ziwei-compat-rows');

      // 暱稱
      rows.appendChild(ruledRow(t('fortune.ziwei_compat_nickname'), input({
        value: person.nickname,
        placeholder: t('fortune.ziwei_compat_nickname_ph'),
        maxlength: 32,
        autocomplete: 'off',
        'data-zc-key': `${k}-nickname`,
        oninput: (e) => { person.nickname = e.target.value; markDirty(); },
      }), { wrapLabel: true }));

      // 出生日期：曆別 + 日期 (+ 閏月，僅農曆)
      rows.appendChild(ruledRow(t('fortune.ziwei_compat_date'), [
        select([
          { value: 'solar', label: t('fortune.ziwei_solar') },
          { value: 'lunar', label: t('fortune.ziwei_lunar') },
        ], {
          value: person.calendar,
          class: 'ziwei-compat-cal',
          'aria-label': `${t('fortune.ziwei_solar')} / ${t('fortune.ziwei_lunar')}`,
          'data-zc-key': `${k}-calendar`,
          onchange: (e) => {
            person.calendar = e.target.value;
            if (person.calendar === 'solar') person.isLeapMonth = false;
            markDirty();
            rerender();
          },
        }),
        input({
          type: 'date',
          value: person.date,
          min: '1900-01-01',
          max: '2100-12-31',
          class: 'ziwei-compat-date',
          'aria-label': t('fortune.ziwei_compat_date'),
          'data-zc-key': `${k}-date`,
          onchange: (e) => { person.date = e.target.value; markDirty(); },
        }),
        person.calendar === 'lunar'
          ? h('label.ziwei-compat-check', [
              h('input', {
                type: 'checkbox',
                checked: person.isLeapMonth,
                'data-zc-key': `${k}-leap`,
                onchange: (e) => { person.isLeapMonth = e.target.checked; markDirty(); },
              }),
              h('span', t('fortune.ziwei_compat_leap_month')),
            ])
          : null,
      ], { className: 'is-date' }));

      // 時間精度
      rows.appendChild(ruledRow(t('fortune.ziwei_compat_precision'), select([
        { value: 'minute', label: t('fortune.ziwei_compat_precision_minute') },
        { value: 'shichen', label: t('fortune.ziwei_compat_precision_shichen') },
        { value: 'unknown', label: t('fortune.ziwei_compat_precision_unknown') },
      ], {
        value: person.timePrecision,
        'data-zc-key': `${k}-precision`,
        onchange: (e) => { person.timePrecision = e.target.value; markDirty(); rerender(); },
      }), { wrapLabel: true }));

      // 時間或時辰
      if (person.timePrecision === 'minute') {
        rows.appendChild(ruledRow(t('fortune.ziwei_compat_time'), input({
          type: 'time',
          value: person.time,
          'data-zc-key': `${k}-time`,
          onchange: (e) => { person.time = e.target.value; markDirty(); },
        }), { wrapLabel: true }));
      } else if (person.timePrecision === 'shichen') {
        rows.appendChild(ruledRow(t('fortune.ziwei_compat_shichen'), select(
          SHICHEN_OPTIONS.map((s) => ({ value: s.value, label: isEn ? s.labelEn : s.labelZh })),
          {
            value: person.shichen,
            'data-zc-key': `${k}-shichen`,
            onchange: (e) => { person.shichen = e.target.value; markDirty(); },
          }
        ), { wrapLabel: true }));
      }

      // 傳統排盤性別參數
      rows.appendChild(ruledRow(t('fortune.ziwei_compat_sex'), select([
        { value: 'M', label: t('fortune.ziwei_compat_sex_m') },
        { value: 'F', label: t('fortune.ziwei_compat_sex_f') },
      ], {
        value: person.chartSex,
        'data-zc-key': `${k}-sex`,
        onchange: (e) => { person.chartSex = e.target.value; markDirty(); },
      }), { wrapLabel: true }));

      // 出生地／時區（台灣各縣市，統一採 Asia/Taipei）
      rows.appendChild(ruledRow(t('fortune.ziwei_compat_timezone'), select(
        TAIWAN_CITIES.map((c) => ({ value: c.value, label: isEn ? c.labelEn : c.labelZh })),
        {
          value: person.birthCity || '台北市',
          'data-zc-key': `${k}-city`,
          onchange: (e) => {
            person.birthCity = e.target.value;
            person.timeZone = 'Asia/Taipei';
            markDirty();
          },
        }
      ), { wrapLabel: true }));

      body.appendChild(rows);

      if (person.timePrecision === 'unknown') {
        body.appendChild(h('p.ziwei-compat-inline-warn', { role: 'note' }, [
          h('span.btn-icon', { html: ICONS.warn }),
          h('span', t('fortune.ziwei_compat_unknown_time_warn')),
        ]));
      }

      card.appendChild(body);
      return card;
    };

    container.appendChild(h('div.ziwei-compat-pair-grid', [
      buildPersonCard(state.personA, true),
      buildPersonCard(state.personB, false),
    ]));

    // 送出列：規則說明（細字）+ 比對按鈕
    const hasUnknownTime = state.personA.timePrecision === 'unknown' || state.personB.timePrecision === 'unknown';
    const submitBtn = h('button.btn.btn-primary.btn-lg.ziwei-compat-submit', {
      type: 'button',
      'data-zc-key': 'submit',
      disabled: state.loading || hasUnknownTime,
      'aria-busy': state.loading ? 'true' : null,
      onclick: async () => {
        const seq = ++state.requestSeq;
        state.loading = true;
        rerender();
        try {
          const payload = {
            rulesetId: 'ziwei-compatibility-v1',
            persons: [state.personA, state.personB],
          };
          const res = await api.post('/api/fortune/ziwei/compatibility', payload);
          if (seq !== state.requestSeq) return; // 丟棄過期回應
          state.result = res;
          state.isStale = false;
          state.highlight = null;
        } catch (err) {
          if (seq !== state.requestSeq) return;
          const msg = err?.status === 401
            ? t('fortune.ziwei_compat_login_required')
            : (err?.message || 'Calculation failed');
          toast(msg, 'error');
        } finally {
          if (seq === state.requestSeq) {
            state.loading = false;
            rerender();
          }
        }
      },
    }, [
      h('span.btn-icon', { html: ICONS.compare }),
      h('span', state.loading ? t('fortune.ziwei_compat_calculating') : t('fortune.ziwei_compat_calculate')),
    ]);

    const submitRow = h('div.ziwei-compat-submit-row', [
      h('p.ziwei-compat-policy', t('fortune.ziwei_compat_policy_notice')),
      submitBtn,
    ]);
    container.appendChild(submitRow);

    if (!state.result) {
      state.focusKey = restoreFocus(container, state.focusKey);
      return;
    }

    const res = state.result;
    const isFresh = res !== lastStampedResult && container.isConnected;
    if (isFresh) lastStampedResult = res;
    // A new result that lands below the fold scrolls up first; the stamp waits for it.
    const needsLeadIn = isFresh && submitRow.getBoundingClientRect().bottom > window.innerHeight * 0.6;
    let findingIdx = 0;

    const result = h('section.ziwei-compat-result', {
      'aria-label': t('fortune.ziwei_compat_title'),
      'aria-busy': state.loading ? 'true' : null,
    });

    // 2. Stale 警示
    if (state.isStale) {
      result.appendChild(h('p.ziwei-compat-stale', { role: 'status' }, [
        h('span.btn-icon', { html: ICONS.warn }),
        h('span', t('fortune.ziwei_compat_stale_banner')),
      ]));
    }

    const sheet = h(`article.cf-sheet.ziwei-compat-sheet${state.loading ? '.is-loading' : ''}${isFresh ? '.is-fresh' : ''}${needsLeadIn ? '.is-lead-in' : ''}`);

    // 3. 合盤總紙表頭：甲 · 合盤印 · 乙
    const partyBlock = (k) => {
      const chart = res.charts[k];
      const profile = chart?.profile || {};
      return h(`div.ziwei-compat-party.is-${k.toLowerCase()}`, [
        h('strong.ziwei-compat-party-glyph', { 'aria-hidden': 'true' }, pickText(PARTY[k].glyph)),
        h('span.ziwei-compat-party-name', chart?.nickname || partyShort(k)),
        h('span.ziwei-compat-party-meta', [profile.solarDate, profile.solarTime].filter(Boolean).join(' ')),
        profile.mingGong ? h('span.ziwei-compat-party-meta', profile.mingGong) : null,
        profile.bureau ? h('span.ziwei-compat-party-meta', profile.bureau) : null,
      ]);
    };

    sheet.appendChild(h('section.ziwei-compat-head', [
      partyBlock('A'),
      h('div.ziwei-compat-verdict', [
        h(`div.cf-seal.ziwei-compat-seal${isFresh ? '.is-stamping' : ''}`, {
          role: 'img',
          'aria-label': `${pickText(COPY.seal)} · ${pickText(COPY.sealCaption).join(' · ')}`,
        }, pickText(COPY.seal)),
        h('p.ziwei-compat-seal-caption', pickText(COPY.sealCaption).map((line) => h('span', line))),
      ]),
      partyBlock('B'),
    ]));

    // 共同判讀：三類條目統計（不計總分）
    const tallyCell = (label, count, cls) => h(`div.ziwei-compat-tally-cell.${cls}`, [
      h('dt', label),
      h('dd', [h('b', String(count)), isEn ? null : h('small', COPY.tallyUnit.zh)]),
    ]);
    sheet.appendChild(h('dl.ziwei-compat-tally', { 'aria-label': pickText(COPY.tallyLabel) }, [
      tallyCell(t('fortune.ziwei_compat_support_title'), res.summary.support.length, 'is-support'),
      tallyCell(t('fortune.ziwei_compat_coordinate_title'), res.summary.coordinate.length, 'is-coordinate'),
      tallyCell(t('fortune.ziwei_compat_insufficient_title'), res.summary.insufficient.length, 'is-insufficient'),
    ]));

    // 4. 檢視切換列（朱線底標）
    const viewTabs = [
      { id: 'summary', label: t('fortune.ziwei_compat_view_summary') },
      { id: 'dual', label: t('fortune.ziwei_compat_view_dual') },
      { id: 'overlay', label: t('fortune.ziwei_compat_view_overlay') },
      { id: 'evidence', label: t('fortune.ziwei_compat_view_evidence') },
    ];
    sheet.appendChild(h('nav.ziwei-compat-views', { 'aria-label': pickText(COPY.viewsLabel) }, viewTabs.map((vt) =>
      h(`button.ziwei-compat-view-btn${state.activeView === vt.id ? '.is-active' : ''}`, {
        type: 'button',
        'data-zc-key': `view-${vt.id}`,
        'aria-pressed': String(state.activeView === vt.id),
        onclick: () => {
          if (state.activeView === vt.id) return;
          state.activeView = vt.id;
          rerender();
        },
      }, vt.label)
    )));

    const view = h(`div.ziwei-compat-view.is-${state.activeView}`);
    sheet.appendChild(view);

    // View 1: 重點摘要 — three ruled columns, like 宜 / 忌
    if (state.activeView === 'summary') {
      const renderRuleBucket = (title, rules, bucketClass) => {
        const section = h(`section.ziwei-compat-bucket.${bucketClass}`, [
          h('h3.cf-vh.ziwei-compat-bucket-vh', h('span', title)),
        ]);
        if (!rules.length) {
          section.appendChild(h('p.ziwei-compat-empty', t('fortune.ziwei_compat_no_items')));
          return section;
        }
        const list = h('ul.ziwei-compat-findings', { role: 'list' });
        for (const rule of rules) {
          const dirClass = rule.direction === 'A_to_B' ? 'is-ab' : (rule.direction === 'B_to_A' ? 'is-ba' : 'is-mutual');
          const dirLabel = rule.direction === 'A_to_B'
            ? t('fortune.ziwei_compat_direction_ab')
            : (rule.direction === 'B_to_A' ? t('fortune.ziwei_compat_direction_ba') : t('fortune.ziwei_compat_direction_mutual'));

          const targetPerson = rule.evidence?.targetPerson;
          const targetBranch = rule.evidence?.targetBranch;
          const targetStar = rule.evidence?.starId;
          const canJumpToChart = Boolean(targetPerson && targetBranch);
          const idx = findingIdx++;

          list.appendChild(h('li.ziwei-compat-finding', { style: `--zc-i: ${Math.min(idx, 4)}` }, [
            h('h4.ziwei-compat-finding-title', pickText(rule.title)),
            h('p.ziwei-compat-finding-text', pickText(rule.traditionalInterpretation)),
            h('p.ziwei-compat-prompt', [
              h('b', t('fortune.ziwei_compat_prompt_label')),
              h('span', pickText(rule.discussionPrompts)),
            ]),
            h('div.ziwei-compat-finding-foot', [
              h(`span.ziwei-compat-dir.${dirClass}`, dirLabel),
              canJumpToChart
                ? h('button.btn.btn-xs.btn-ghost.ziwei-compat-jump', {
                    type: 'button',
                    onclick: () => {
                      const chart = res.charts[targetPerson];
                      const p = chart?.palaces?.find((x) => x.branch === targetBranch);
                      if (p) {
                        state.highlight = { personKey: targetPerson, branchIndex: p.branchIndex, starId: targetStar || null };
                        state.mobileChartKey = targetPerson;
                        state.activeView = 'dual';
                        state.focusKey = `cell-${targetPerson}-${p.branchIndex}`;
                        rerender();
                        const cellEl = container.querySelector(`[data-zc-key="cell-${targetPerson}-${p.branchIndex}"]`);
                        if (cellEl) cellEl.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
                      }
                    },
                  }, [h('span.btn-icon', { html: ICONS.chart }), h('span', pickText(COPY.jumpToChart))])
                : null,
            ]),
          ]));
        }
        section.appendChild(list);
        return section;
      };

      view.appendChild(h('div.ziwei-compat-summary-grid', [
        renderRuleBucket(t('fortune.ziwei_compat_support_title'), res.summary.support, 'is-support'),
        renderRuleBucket(t('fortune.ziwei_compat_coordinate_title'), res.summary.coordinate, 'is-coordinate'),
        renderRuleBucket(t('fortune.ziwei_compat_insufficient_title'), res.summary.insufficient, 'is-insufficient'),
      ]));
    }

    // View 2: 雙盤並排 / 窄螢幕切換 + 宮位解釋浮窗
    if (state.activeView === 'dual') {
      view.appendChild(h('div.ziwei-compat-dual-bar', [
        h('p.ziwei-compat-hint', t('fortune.ziwei_compat_popover_click_hint')),
        h('div.ziwei-compat-mobile-toggle', { role: 'group', 'aria-label': pickText(COPY.switchLabel) }, ['A', 'B'].map((k) =>
          h(`button.ziwei-compat-toggle-btn${state.mobileChartKey === k ? '.is-active' : ''}`, {
            type: 'button',
            'data-zc-key': `mobile-${k}`,
            'aria-pressed': String(state.mobileChartKey === k),
            onclick: () => { state.mobileChartKey = k; rerender(); },
          }, t(k === 'A' ? 'fortune.ziwei_compat_switch_a' : 'fortune.ziwei_compat_switch_b'))
        )),
      ]));

      view.appendChild(h('div.ziwei-compat-dual-wrap', ['A', 'B'].map((k) =>
        h(`section.ziwei-compat-chart-pane${state.mobileChartKey === k ? '.is-mobile-active' : ''}`, [
          h('h4.ziwei-compat-pane-title', personTitle(k)),
          renderMiniChart(res.charts[k], k, h),
        ])
      )));

      // 浮窗：解釋點擊之宮位意義、主星特質、三方四正與對方同地支疊宮
      if (state.popoverPalace) {
        const { personKey, branchIndex } = state.popoverPalace;
        const chart = res.charts[personKey];
        const partnerKey = personKey === 'A' ? 'B' : 'A';
        const partnerChart = res.charts[partnerKey];
        const palace = chart?.palaces?.find((p) => p.branchIndex === branchIndex);
        const partnerPalace = partnerChart?.palaces?.find((p) => p.branchIndex === branchIndex);

        if (palace) {
          const closePopover = () => {
            state.popoverPalace = null;
            state.focusKey = `cell-${personKey}-${branchIndex}`;
            rerender();
          };

          const crossHits = [
            ...(res.comparisonFacts.crossChartSiHua.A_to_B || []),
            ...(res.comparisonFacts.crossChartSiHua.B_to_A || []),
          ].filter((item) => item.targetPerson === personKey && item.targetBranch === palace.branch && item.status === 'matched');

          const popRow = (label, content) => h('div.ziwei-compat-pop-row', [
            h('dt', label),
            h('dd', content),
          ]);

          const titleId = `zc-pop-title-${personKey}-${branchIndex}`;
          const closeBtn = h('button.btn.btn-ghost.ziwei-compat-pop-close', {
            type: 'button',
            'aria-label': t('fortune.ziwei_compat_popover_close'),
            onclick: closePopover,
          }, h('span.btn-icon', { html: ICONS.close }));

          const dialog = h('div.ziwei-compat-popover', {
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': titleId,
            tabindex: '-1',
          }, [
            h('header.ziwei-compat-popover-head', [
              h('div.ziwei-compat-popover-title', [
                h('span.ziwei-compat-dir', personTitle(personKey)),
                h('h3', { id: titleId }, [palace.name, h('small', palace.stemBranch)]),
              ]),
              closeBtn,
            ]),
            h('dl.ziwei-compat-popover-body', [
              popRow(t('fortune.ziwei_compat_popover_palace_meaning'), h('p', pickText(PALACE_MEANINGS[palace.palaceId]))),
              popRow(t('fortune.ziwei_compat_popover_main_stars'), palace.mainStars.length
                ? h('ul.ziwei-compat-popover-list', palace.mainStars.map((s) =>
                    h('li', [
                      h('b', `${s.name}${s.brightness ? ` [${s.brightness}]` : ''}${s.sihua ? ` · ${s.sihua}` : ''}：`),
                      h('span', pickText(MAIN_STAR_TRAITS[s.name])),
                    ])
                  ))
                : h('p.ziwei-compat-note', t('fortune.ziwei_compat_popover_empty_palace'))),
              palace.minorStars.length
                ? popRow(t('fortune.ziwei_compat_popover_minor_stars'),
                    h('p', palace.minorStars.map((s) => `${s.name}${s.sihua ? `(${s.sihua})` : ''}`).join('、')))
                : null,
              popRow(t('fortune.ziwei_compat_popover_sanfang'),
                h('p', `${t('fortune.ziwei_opposite_label')}: ${palace.sanFangSiZheng.opposite} ｜ ${t('fortune.ziwei_sanhe_label')}: ${palace.sanFangSiZheng.sanHe1}、${palace.sanFangSiZheng.sanHe2}`)),
              partnerPalace
                ? popRow(t('fortune.ziwei_compat_popover_partner_overlay'),
                    h('p', `${personTitle(partnerKey)}：${partnerPalace.name}（${partnerPalace.stemBranch}）${partnerPalace.mainStars.length ? `— ${partnerPalace.mainStars.map((s) => s.name).join('、')}` : ''}`))
                : null,
              crossHits.length
                ? popRow(t('fortune.ziwei_compat_popover_cross_sihua'),
                    h('ul.ziwei-compat-popover-list', crossHits.map((hit) =>
                      h('li', `${hit.originPerson}→${hit.targetPerson}：${hit.stem}干${hit.huaLabel}「${hit.starId}」`)
                    )))
                : null,
            ]),
          ]);

          const backdrop = h('div.ziwei-compat-popover-backdrop', {
            onclick: (e) => { if (e.target === backdrop) closePopover(); },
          }, [dialog]);

          popoverKeyHandler = (ev) => {
            if (ev.key === 'Escape') {
              ev.preventDefault();
              closePopover();
            } else if (ev.key === 'Tab') {
              // Keep focus inside the slip: the close button is its only control.
              ev.preventDefault();
              closeBtn.focus();
            }
          };
          document.addEventListener('keydown', popoverKeyHandler);

          container.appendChild(backdrop);
          state.focusKey = null;
          closeBtn.focus({ preventScroll: true });
        }
      }
    }

    // View 3: 地支疊宮 — ruled three-column table
    if (state.activeView === 'overlay') {
      const overlayCell = (side) => h('td', side ? [
        h('b', side.palaceName || ''),
        h('small', side.stemBranch ? ` (${side.stemBranch})` : ''),
        side.mainStars?.length ? h('span.ziwei-compat-overlay-stars', side.mainStars.join('、')) : null,
      ] : '');
      view.appendChild(h('div.ziwei-compat-table-wrap', [
        h('table.ziwei-compat-table.is-overlay', [
          h('thead', [
            h('tr', [
              h('th', { scope: 'col' }, t('fortune.ziwei_compat_overlay_branch')),
              h('th', { scope: 'col' }, personTitle('A')),
              h('th', { scope: 'col' }, personTitle('B')),
            ]),
          ]),
          h('tbody', res.comparisonFacts.branchOverlays.byBranch.map((row) =>
            h('tr', [
              h('th', { scope: 'row' }, row.branch),
              overlayCell(row.personA),
              overlayCell(row.personB),
            ])
          )),
        ]),
      ]));
    }

    // View 4: 計算依據與版本資訊
    if (state.activeView === 'evidence') {
      const evWrap = h('div.ziwei-compat-evidence');

      // 4a. 本命年干四化跨盤對照表
      const renderSiHuaTable = (rows, dirLabel, dirClass) => h('div.ziwei-compat-sihua-block', [
        h(`span.ziwei-compat-dir.${dirClass}`, dirLabel),
        h('div.ziwei-compat-table-wrap', [
          h('table.ziwei-compat-table.is-sihua', [
            h('thead', [
              h('tr', [COPY.stem, COPY.sihua, COPY.star, COPY.targetPalace, COPY.branch, COPY.status]
                .map((c) => h('th', { scope: 'col' }, pickText(c)))),
            ]),
            h('tbody', rows.map((r) => h('tr', [
              h('td', r.stem),
              h(`td.ziwei-compat-hua-cell${r.huaType === 'ji' ? '.is-ji' : ''}`, r.huaLabel),
              h('td', [r.starId, r.isMainStar === false ? h('small', ` (${pickText(COPY.minorTag)})`) : null]),
              h('td', r.targetPalaceName || '—'),
              h('td', r.targetBranch || '—'),
              h(`td.ziwei-compat-status.is-${r.status}`, pickText(SIHUA_STATUS[r.status]) || r.status),
            ]))),
          ]),
        ]),
      ]);

      evWrap.appendChild(h('section.ziwei-compat-ev-sec', [
        h('h4.ziwei-compat-ev-title', t('fortune.ziwei_compat_sihua_mapping_title')),
        h('p.ziwei-compat-note', t('fortune.ziwei_compat_sihua_disclaimer')),
        h('div.ziwei-compat-pair', [
          renderSiHuaTable(res.comparisonFacts.crossChartSiHua.A_to_B, t('fortune.ziwei_compat_direction_ab'), 'is-ab'),
          renderSiHuaTable(res.comparisonFacts.crossChartSiHua.B_to_A, t('fortune.ziwei_compat_direction_ba'), 'is-ba'),
        ]),
      ]));

      // 4b. 時間與曆法正規化紀錄
      const factRow = (label, value) => h('div.ziwei-compat-fact', [h('dt', label), h('dd', value)]);
      evWrap.appendChild(h('section.ziwei-compat-ev-sec', [
        h('h4.ziwei-compat-ev-title', t('fortune.ziwei_compat_norm_title')),
        h('div.ziwei-compat-pair', ['A', 'B'].map((k) => {
          const n = res.normalizedInputs[k];
          return h('div.ziwei-compat-norm', [
            h('h5.ziwei-compat-norm-title', personTitle(k)),
            h('dl.ziwei-compat-facts', [
              factRow(pickText(COPY.raw), `${n.rawInput.calendar} ${n.rawInput.date} ${n.rawInput.time || n.rawInput.shichen}`),
              factRow(`${pickText(COPY.wallClock)} (${n.timeNormalization.timeZone})`, n.timeNormalization.wallClock),
              factRow(pickText(COPY.utc), n.timeNormalization.utcInstant),
              factRow(pickText(COPY.offset), `+${n.timeNormalization.actualOffsetMinutes}m (${pickText(COPY.dst)}: ${pickText(n.timeNormalization.isDstActive ? COPY.yes : COPY.no)})`),
            ]),
          ]);
        })),
      ]));

      // 4c. 覆蓋範圍與版本
      evWrap.appendChild(h('section.ziwei-compat-ev-sec', [
        h('h4.ziwei-compat-ev-title', t('fortune.ziwei_compat_coverage_title')),
        h('dl.ziwei-compat-facts.is-wide', [
          factRow(pickText(COPY.ruleset), res.versions.rulesetId),
          factRow(pickText(COPY.engine), res.versions.engineVersion),
          factRow(pickText(COPY.calendar), res.versions.calendarVersion),
          factRow(pickText(COPY.layer), res.coverage.supportedTimeLayer),
          factRow(pickText(COPY.excluded), res.coverage.unsupportedLayers.join(', ')),
        ]),
        res.warnings.length
          ? h('ul.ziwei-compat-warnings', { role: 'list', 'aria-label': pickText(COPY.warnings) }, res.warnings.map((w) =>
              h('li', [h('code', w.code), h('span', w.message)])
            ))
          : null,
      ]));

      view.appendChild(evWrap);
    }

    result.appendChild(sheet);
    // The popover backdrop (if any) was appended to the container before the result; keep it last.
    const backdropEl = container.querySelector(':scope > .ziwei-compat-popover-backdrop');
    container.insertBefore(result, backdropEl || null);

    state.focusKey = restoreFocus(container, state.focusKey);

    if (needsLeadIn) {
      (result.firstChild || sheet).scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  // Refocus the control a re-render replaced; keep the key while that control is disabled (e.g. submit while loading).
  function restoreFocus(container, key) {
    if (!key) return null;
    const el = container.querySelector(`[data-zc-key="${key}"]`);
    if (!el) return null;
    if (el.disabled) return key;
    el.focus({ preventScroll: true });
    return null;
  }
})();
