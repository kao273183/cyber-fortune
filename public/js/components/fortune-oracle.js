/**
 * public/js/components/fortune-oracle.js
 * 靈籤求索 — 媽祖六十甲子籤 (Mazu 60-lot temple oracle), set as a two-colour almanac slip.
 *   1. 虔心求籤：選定所問、寫下問題、搖籤筒 → 籤枝浮起 → 籤箋落定、卦印蓋下
 *   2. 依籤號查籤：六十甲子籤譜 (十天干 × 六籤) 與下拉索引
 *   3. 我的求籤紀錄：統計、篩選、印證狀態、心得筆記
 *   以及複製籤詩、匯出 PNG 籤箋、收藏至紀錄庫
 */

const ORACLE_ICONS = {
  cylinder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10a2 2 0 0 0 2-2V9H5v10a2 2 0 0 0 2 2Z"/><path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="9" y1="3" x2="10" y2="5"/><line x1="15" y1="3" x2="14" y2="5"/></svg>',
  lookup: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  history: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>',
  exportImg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
  bookmark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
  bookmarkFilled: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  chevron: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  general: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/></svg>',
  career: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  study: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  love: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  wealth: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
  health: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
};

const ORACLE_TOPICS = [
  { key: 'general', name: '綜合運勢', short: '綜合', en: 'General', icon: ORACLE_ICONS.general },
  { key: 'career', name: '工作事業', short: '工作', en: 'Career', icon: ORACLE_ICONS.career },
  { key: 'study', name: '學業考試', short: '學業', en: 'Study', icon: ORACLE_ICONS.study },
  { key: 'love', name: '感情姻緣', short: '感情', en: 'Love', icon: ORACLE_ICONS.love },
  { key: 'wealth', name: '財運投資', short: '財運', en: 'Wealth', icon: ORACLE_ICONS.wealth },
  { key: 'health', name: '身心健康', short: '健康', en: 'Health', icon: ORACLE_ICONS.health },
];

// 六十甲子籤以天干為序：每一天干六籤，陽干配陽支、陰干配陰支。
const ORACLE_STEMS = '甲乙丙丁戊己庚辛壬癸';
const ORACLE_YANG_BRANCHES = '子寅辰午申戌';
const ORACLE_YIN_BRANCHES = '丑卯巳未酉亥';
const ZH_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const oracleLotGanZhi = (n) => {
  const stemIdx = Math.floor((n - 1) / 6);
  const branches = stemIdx % 2 === 0 ? ORACLE_YANG_BRANCHES : ORACLE_YIN_BRANCHES;
  return ORACLE_STEMS[stemIdx] + branches[(n - 1) % 6];
};

const oracleZhNum = (n) => {
  if (n <= 10) return n === 10 ? '十' : ZH_DIGITS[n];
  const tens = Math.floor(n / 10);
  return `${tens === 1 ? '' : ZH_DIGITS[tens]}十${ZH_DIGITS[n % 10]}`;
};

// 「中平 (宜守)」→ main 中平, note 宜守。含「吉」者印紅，其餘印墨。
const oracleParseRank = (rank) => {
  const m = String(rank || '').trim().match(/^([^\s(（]+)\s*(?:[（(]([^)）]*)[)）])?/);
  const main = m ? m[1] : '';
  return { main, note: m && m[2] ? m[2] : '', good: main.includes('吉') };
};

const oracleIsEn = () => window.CyberFortuneCore?.getLang?.() === 'en';
const oracleL = (zh, en) => (oracleIsEn() ? en : zh);
const oracleTopicName = (top) => (oracleIsEn() ? top.en : top.name);
const oracleIcon = (svg) => h('span.btn-icon', { html: svg, 'aria-hidden': 'true' });
const oracleWait = (ms) => new Promise((r) => setTimeout(r, ms));
const oracleReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The stick art carries a baked-in white aura; this filter derives an alpha matte from its own
// luminance so only the bamboo, the red cap and the tassel print on the page.
const ensureOracleMatte = () => {
  if (document.getElementById('oracle-matte-defs')) return;
  const holder = document.createElement('div');
  holder.innerHTML = '<svg id="oracle-matte-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">'
    + '<filter id="oracle-matte" color-interpolation-filters="sRGB">'
    // alpha = 12.5 × (0.82 − luminance): the near-white aura drops out, bamboo and cord stay
    + '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -3.75 -7.5 -1.25 0 10.25" result="lum"/>'
    + '<feComposite in="SourceGraphic" in2="lum" operator="in" result="matte"/>'
    // a small opening clears the scattered sparkle specks
    + '<feMorphology in="matte" operator="erode" radius="1.2" result="eroded"/>'
    + '<feMorphology in="eroded" operator="dilate" radius="1.4" result="opened"/>'
    + '<feComposite in="matte" in2="opened" operator="in"/>'
    + '</filter>'
    // dark print only: lifts the pale ground shadow from under the cylinder
    + '<filter id="oracle-matte-soft" color-interpolation-filters="sRGB">'
    + '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -3.75 -7.5 -1.25 0 10.75" result="lum"/>'
    + '<feComposite in="SourceGraphic" in2="lum" operator="in"/>'
    + '</filter></svg>';
  document.body.appendChild(holder.firstChild);
};

/**
 * 建立求籤/查籤/紀錄的主視圖控制器
 */
function createFortuneOracleView() {
  let subMode = 'draw'; // 'draw' | 'lookup' | 'records'
  let selectedTopic = 'career';
  let questionText = '';
  let drawPhase = null; // null | 'shake' | 'rise' — the drawing ritual in progress
  let landNext = false; // the next slip render lands and stamps (only right after a new draw)
  let revealNext = false; // after a lookup pick on a phone, bring the slip into view
  let currentLot = null; // 當前展示之籤詩
  let drawnLotInfo = null; // 抽得之籤詩包裝
  let drawnRecord = null; // 這次抽籤自動記入「我的求籤紀錄」的那一筆
  let lookupNumber = 1; // 查籤當前選中號碼
  let lotsSummaryList = null; // 60 籤快速清單快取
  let loadingLots = false;
  let lastContainer = null;

  // 個人求籤紀錄
  let recordsList = [];
  let recordsTotal = 0;
  let recordsStats = null;
  let loadingRecords = false;
  let recordsFilterTopic = 'all';
  let recordsFilterStatus = 'all';
  const savedRecordLotIds = new Set();

  const rerender = () => {
    if (lastContainer && lastContainer.isConnected) render(lastContainer);
  };

  const fetchLotsList = async () => {
    if (lotsSummaryList || loadingLots) return;
    loadingLots = true;
    try {
      const res = await api.get('/api/fortune/oracle/collections/mazu_60_jiazi/lots');
      if (res?.ok && Array.isArray(res.lots)) {
        lotsSummaryList = res.lots;
        if (subMode === 'lookup') rerender();
      }
    } catch (err) {
      console.warn('載入籤詩清單失敗:', err);
    } finally {
      loadingLots = false;
    }
  };

  const fetchRecordsList = async () => {
    if (!App?.user) return;
    loadingRecords = true;
    try {
      const query = new URLSearchParams();
      if (recordsFilterTopic && recordsFilterTopic !== 'all') query.set('topic', recordsFilterTopic);
      if (recordsFilterStatus && recordsFilterStatus !== 'all') query.set('status', recordsFilterStatus);
      const [resList, resStats] = await Promise.all([
        api.get(`/api/fortune/oracle/records?${query.toString()}`),
        api.get('/api/fortune/oracle/records/stats'),
      ]);
      if (resList?.ok && Array.isArray(resList.records)) {
        recordsList = resList.records;
        recordsTotal = resList.total || 0;
        recordsList.forEach((r) => savedRecordLotIds.add(Number(r.lotNumber)));
      }
      if (resStats?.ok && resStats.stats) {
        recordsStats = resStats.stats;
      }
    } catch (err) {
      console.warn('載入求籤紀錄失敗:', err);
    } finally {
      loadingRecords = false;
    }
  };

  fetchLotsList();
  fetchRecordsList();

  // 每次求籤都自動記入「我的求籤紀錄」（心得之後再補）
  const recordDraw = async (lot, topic, question) => {
    if (!App?.user) return null;
    try {
      const res = await api.post('/api/fortune/oracle/records', {
        collectionId: 'mazu_60_jiazi',
        lotNumber: lot.lotNumber,
        topic,
        question: question || '',
        userNotes: '',
        verifiedStatus: 'pending',
      });
      if (res?.ok && res.record) {
        savedRecordLotIds.add(Number(lot.lotNumber));
        await fetchRecordsList();
        return res.record;
      }
    } catch (err) {
      console.warn('自動記錄求籤失敗:', err);
    }
    return null;
  };

  // 儲存求籤至個人收藏庫
  const executeSaveRecord = async (lot, topic, question, refreshFn) => {
    if (!App?.user) {
      toast('請先登入即可保存個人求籤紀錄', 'warn');
      return;
    }
    const note = await promptModal(
      t('fortune.oracle_save_note_prompt') || '記錄個人心得、後續進展或驗證筆記（選填）：',
      {
        title: `收藏【第 ${lot.lotNumber} 籤 · ${lot.ganZhi}】`,
        confirmLabel: '確認保存',
      }
    );
    if (note === null) return;

    try {
      const res = await api.post('/api/fortune/oracle/records', {
        collectionId: 'mazu_60_jiazi',
        lotNumber: lot.lotNumber,
        topic,
        question: question || '',
        userNotes: note.trim(),
        verifiedStatus: 'pending',
      });
      if (res?.ok && res.record) {
        savedRecordLotIds.add(Number(lot.lotNumber));
        toast(t('fortune.oracle_save_success') || '求籤紀錄已成功保存至個人紀錄庫！', 'ok');
        await fetchRecordsList();
        refreshFn?.();
      } else {
        toast(res?.error || '保存失敗', 'error');
      }
    } catch (err) {
      toast(err.message || '連線異常，保存失敗', 'error');
    }
  };

  // 匯出籤箋卡圖 (Canvas 本地渲染)：紙底、朱紅雙框、直書籤詩、卦印，跟隨目前深淺色印刷
  const exportLotCardImage = async (lot, question, topic) => {
    try {
      const css = getComputedStyle(document.documentElement);
      const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
      const ink = {
        paper: token('--paper', '#f4eedf'),
        red: token('--red', '#b8231f'),
        onRed: token('--on-red', '#f8f1e2'),
        ink: token('--ink', '#1a1a1a'),
        onInk: token('--on-ink', '#f4eedf'),
        gray: token('--gray', '#6e6a60'),
        rule: token('--rule', 'rgba(184, 35, 31, 0.32)'),
      };
      const serif = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
      const sans = '"Noto Sans TC", "PingFang TC", sans-serif';
      const lines = lot.poem?.lines || (Array.isArray(lot.poemLines) ? lot.poemLines : []);
      const storyTitle = lot.story?.title || lot.storyTitle || '';
      const summary = lot.explanation?.summary || lot.explanationSummary || '';
      const rank = oracleParseRank(lot.guaRank);
      const sample = `天上聖母六十甲子靈籤第籤${lot.ganZhi}${lot.guaRank || ''}${lines.join('')}${storyTitle}${summary}歷史典故${question || ''}`;
      if (document.fonts?.load) {
        await Promise.all([
          document.fonts.load(`700 40px ${serif}`, sample),
          document.fonts.load(`900 120px ${serif}`, String(lot.lotNumber)),
          document.fonts.load(`400 16px ${sans}`, sample),
        ]).catch(() => {});
      }

      const width = 800;
      const height = 1080;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const cx = width / 2;

      ctx.fillStyle = ink.paper;
      ctx.fillRect(0, 0, width, height);

      // 粗細雙線朱框
      ctx.strokeStyle = ink.red;
      ctx.lineWidth = 6;
      ctx.strokeRect(32, 32, width - 64, height - 64);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(44, 44, width - 88, height - 88);

      const rule = (y, x0 = 80, x1 = width - 80) => {
        ctx.strokeStyle = ink.red;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      };

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = ink.red;
      ctx.font = `700 22px ${serif}`;
      ctx.fillText('天上聖母六十甲子靈籤', cx, 98);
      rule(122);

      // 籤號 · 干支 · 卦印
      ctx.fillStyle = ink.red;
      ctx.font = `900 120px ${serif}`;
      ctx.fillText(String(lot.lotNumber), 220, 262);
      ctx.fillStyle = ink.ink;
      ctx.font = `600 26px ${serif}`;
      ctx.fillText(`第${oracleZhNum(Number(lot.lotNumber))}籤`, 220, 308);

      ctx.font = `700 46px ${serif}`;
      String(lot.ganZhi || '').split('').forEach((ch, i) => ctx.fillText(ch, cx, 200 + i * 56));

      if (rank.main) {
        ctx.save();
        ctx.translate(590, 228);
        ctx.rotate((-4 * Math.PI) / 180);
        ctx.fillStyle = rank.good ? ink.red : ink.ink;
        ctx.fillRect(-72, -72, 144, 144);
        ctx.strokeStyle = rank.good ? ink.onRed : ink.onInk;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-63, -63, 126, 126);
        ctx.fillStyle = rank.good ? ink.onRed : ink.onInk;
        ctx.textBaseline = 'middle';
        const chars = rank.main.split('');
        if (chars.length >= 3) {
          // 四字印：右行先讀，自上而下
          ctx.font = `900 44px ${serif}`;
          const cols = [chars.slice(0, 2), chars.slice(2, 4)];
          cols.forEach((col, ci) => col.forEach((ch, ri) => ctx.fillText(ch, 26 - ci * 52, -26 + ri * 52)));
        } else {
          ctx.font = `900 ${chars.length === 1 ? 72 : 52}px ${serif}`;
          ctx.fillText(rank.main, 0, 2);
        }
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
        if (rank.note) {
          ctx.fillStyle = ink.red;
          ctx.font = `600 22px ${serif}`;
          ctx.fillText(rank.note, 590, 340);
        }
      }
      rule(372);

      let y = 372;
      if (question) {
        ctx.fillStyle = ink.gray;
        ctx.font = `400 18px ${sans}`;
        const topicName = ORACLE_TOPICS.find((x) => x.key === topic)?.name || '問事';
        ctx.fillText(`【${topicName}】「${String(question).slice(0, 30)}」`, cx, y + 40);
        y += 64;
        rule(y, 160, width - 160);
      }

      // 籤詩直書，由右至左
      const charStep = 52;
      const colStep = 92;
      const poemTop = y + 50;
      ctx.fillStyle = ink.ink;
      ctx.font = `700 40px ${serif}`;
      ctx.textBaseline = 'top';
      lines.forEach((line, li) => {
        const x = cx + ((lines.length - 1) / 2 - li) * colStep;
        String(line).split('').forEach((ch, ci) => ctx.fillText(ch, x, poemTop + ci * charStep));
      });
      ctx.textBaseline = 'alphabetic';
      y = poemTop + 7 * charStep + 24;
      rule(y);

      if (storyTitle) {
        ctx.fillStyle = ink.red;
        ctx.font = `700 22px ${serif}`;
        ctx.fillText(`【歷史典故】${storyTitle}`, cx, y + 46);
        y += 46;
      }

      if (summary) {
        ctx.fillStyle = ink.ink;
        ctx.font = `500 19px ${serif}`;
        const maxW = width - 200;
        const wrapped = [];
        let cur = '';
        for (const ch of summary) {
          if (ctx.measureText(cur + ch).width > maxW) {
            wrapped.push(cur);
            cur = ch;
          } else {
            cur += ch;
          }
        }
        if (cur) wrapped.push(cur);
        const room = Math.max(1, Math.floor((height - 120 - (y + 44)) / 32));
        wrapped.slice(0, room).forEach((ln, i) => ctx.fillText(ln, cx, y + 44 + i * 32));
      }

      ctx.fillStyle = ink.gray;
      ctx.font = `400 15px ${sans}`;
      ctx.fillText('吉時行樂 · 誠心敬求 · 供處事啟發與心靈沈澱', cx, height - 72);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mazu-lot-${lot.lotNumber}-${lot.ganZhi}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast(t('fortune.oracle_export_success') || '籤詩卡圖已成功產生並下載！', 'ok');
      }, 'image/png');
    } catch (err) {
      toast('卡圖匯出異常: ' + err.message, 'error');
    }
  };

  // 執行求籤：搖籤 (與求籤請求並行) → 籤枝浮起 → 籤箋落定
  const executeDraw = async (container, refreshFn) => {
    if (drawPhase) return;
    const reduced = oracleReducedMotion();
    drawPhase = 'shake';
    refreshFn();

    try {
      const [res] = await Promise.all([
        api.post('/api/fortune/oracle/draw', {
          collectionId: 'mazu_60_jiazi',
          topic: selectedTopic,
          question: questionText.trim(),
        }),
        oracleWait(reduced ? 0 : 380),
      ]);

      if (res?.ok && res.lot) {
        if (!reduced) {
          drawPhase = 'rise';
          refreshFn();
          await oracleWait(240);
        }
        drawnLotInfo = res;
        currentLot = res.lot;
        landNext = true;
        drawnRecord = await recordDraw(res.lot, selectedTopic, questionText.trim());
        toast(drawnRecord
          ? (t('fortune.oracle_recorded_toast', { num: res.lot.lotNumber, ganZhi: res.lot.ganZhi }) || `【第 ${res.lot.lotNumber} 籤 · ${res.lot.ganZhi}】已記入求籤紀錄`)
          : `【第 ${res.lot.lotNumber} 籤 · ${res.lot.ganZhi}】求籤成功！`, 'ok');
      } else {
        toast(res?.error || '求籤異常，請重新嘗試', 'error');
      }
    } catch (err) {
      toast(err.message || '連線異常，求籤失敗', 'error');
    } finally {
      drawPhase = null;
      refreshFn();
    }
  };

  // 依籤號查籤
  const executeLookup = async (lotNum, refreshFn) => {
    const num = Number(lotNum);
    if (!num || num < 1 || num > 60) return;
    lookupNumber = num;
    try {
      const res = await api.get(`/api/fortune/oracle/collections/mazu_60_jiazi/lots/${num}`);
      if (res?.ok && res.lot) {
        if (lookupNumber !== num) return; // a newer pick already won
        currentLot = res.lot;
        refreshFn();
      } else {
        toast(res?.error || '查籤失敗', 'error');
      }
    } catch (err) {
      toast(err.message || '查籤異常', 'error');
    }
  };

  // 複製籤文
  const copyPoemToClipboard = (lot) => {
    if (!lot) return;
    const lines = lot.poem?.lines ? lot.poem.lines.join('\n') : lot.poem?.fullText || '';
    const text = `【媽祖六十甲子靈籤 · 第 ${lot.lotNumber} 籤 ${lot.ganZhi}】${lot.guaRank ? ` (${lot.guaRank})` : ''}
${lot.elementOrientation || ''}

${lines}

【典故】${lot.story?.title || ''}
${lot.story?.summary || ''}

【白話籤意】
${lot.explanation?.summary || ''}

（來源：傳統公有領域六十甲子媽祖靈籤 · 吉時行樂）`;

    navigator.clipboard.writeText(text).then(() => {
      toast(t('fortune.oracle_copy_success') || '籤詩內容已複製到剪貼簿！', 'ok');
    }).catch(() => {
      toast('複製失敗，請手動複製文字', 'error');
    });
  };

  // ----------------------------------------------------------------
  // 主渲染函數
  // ----------------------------------------------------------------
  const render = (container) => {
    lastContainer = container;
    ensureOracleMatte();
    container.innerHTML = '';
    const refresh = () => render(container);

    const root = h(`div.oracle-hub-wrap.is-${subMode}`);
    root.appendChild(renderHead(refresh));

    if (subMode === 'draw') {
      renderDrawMode(root, refresh);
    } else if (subMode === 'lookup') {
      renderLookupMode(root, refresh);
    } else {
      renderRecordsMode(root, refresh);
    }

    container.appendChild(root);
  };

  // 標題與模式切換 (虔心求籤 / 依籤號查籤 / 我的求籤紀錄)
  const renderHead = (refresh) => {
    const modes = [
      {
        key: 'draw',
        icon: ORACLE_ICONS.cylinder,
        label: t('fortune.oracle_sub_draw') || '虔心求籤',
        open: () => {
          subMode = 'draw';
          // 若之前未抽過籤，清空當前展示籤，回到籤筒
          currentLot = drawnLotInfo ? drawnLotInfo.lot : null;
          refresh();
        },
      },
      {
        key: 'lookup',
        icon: ORACLE_ICONS.lookup,
        label: t('fortune.oracle_sub_lookup') || '依籤號查籤',
        open: () => {
          subMode = 'lookup';
          refresh();
          if (!currentLot || currentLot.lotNumber !== lookupNumber || !currentLot.topics) {
            executeLookup(lookupNumber, refresh);
          }
        },
      },
      {
        key: 'records',
        icon: ORACLE_ICONS.history,
        label: t('fortune.oracle_sub_records') || '我的求籤紀錄',
        open: () => {
          subMode = 'records';
          refresh();
          fetchRecordsList().then(rerender);
        },
      },
    ];

    return h('header.oracle-head', [
      h('div.oracle-head-text', [
        h('h2.oracle-title', t('fortune.oracle_title') || '天上聖母六十甲子靈籤'),
        h('p.oracle-title-sub', oracleL('共六十首 · 純隨機等機率抽取', '60 lots · every lot equally likely')),
      ]),
      h('div.oracle-modes', { role: 'group', 'aria-label': oracleL('靈籤功能', 'Oracle modes') }, modes.map((m) => {
        const active = subMode === m.key;
        return h(`button.oracle-mode-btn${active ? '.is-active' : ''}`, {
          type: 'button',
          'aria-pressed': active ? 'true' : 'false',
          onclick: () => {
            if (drawPhase) return;
            m.open();
          },
        }, [
          oracleIcon(m.icon),
          h('span', m.label),
          m.key === 'records' && recordsTotal > 0 && h('span.oracle-mode-count', { 'aria-label': oracleL(`${recordsTotal} 筆`, `${recordsTotal} saved`) }, String(recordsTotal)),
        ].filter(Boolean));
      })),
    ]);
  };

  // ----------------------------------------------------------------
  // 求籤模式
  // ----------------------------------------------------------------
  const renderDrawMode = (parent, refresh) => {
    if (currentLot) {
      parent.appendChild(renderResult(currentLot, {
        topic: selectedTopic,
        question: questionText,
        record: drawnRecord,
        refresh,
        onRedraw: () => {
          currentLot = null;
          drawnLotInfo = null;
          drawnRecord = null;
          refresh();
        },
      }));
      return;
    }

    const busy = Boolean(drawPhase);
    const doDraw = () => executeDraw(parent, refresh);

    const sheet = h('article.cf-sheet.oracle-ask', { 'aria-label': oracleL('求籤', 'Draw a lot') }, [
      h('section.oracle-ask-part', [
        h('h3.cf-vh', h('span', oracleL('一、整理所求之事', 'Your question'))),
        h('div.oracle-ask-body', [
          h('p.oracle-ask-desc', '心誠則靈，先選定所問主題，並在心中沈思或寫下問題'),
          h('div.oracle-topic-grid', { role: 'group', 'aria-label': (t('fortune.oracle_topic_label') || '問事主題：').replace(/[：:]\s*$/, '') }, ORACLE_TOPICS.map((top) => {
            const isSelected = selectedTopic === top.key;
            return h(`button.oracle-topic${isSelected ? '.is-active' : ''}`, {
              type: 'button',
              'aria-pressed': isSelected ? 'true' : 'false',
              disabled: busy,
              onclick: () => {
                selectedTopic = top.key;
                refresh();
              },
            }, [
              oracleIcon(top.icon),
              h('span', oracleTopicName(top)),
            ]);
          })),
          h('label.oracle-field', [
            h('span.oracle-field-label', oracleL('所問之事（選填，亦可在心中默念）', 'Your question (optional, or keep it silent)')),
            h('input.oracle-question-input', {
              type: 'text',
              value: questionText,
              placeholder: oracleL('例：下個月適合換工作嗎？', 'e.g. Is next month a good time to change jobs?'),
              maxlength: 100,
              enterkeyhint: 'go',
              oninput: (e) => { questionText = e.target.value; },
              onkeydown: (e) => {
                if (e.key === 'Enter' && !e.isComposing) {
                  e.preventDefault();
                  doDraw();
                }
              },
            }),
          ]),
          h('ol.oracle-rite', { 'aria-label': oracleL('求籤步驟', 'How to draw') }, [
            oracleL('默念姓名與所問之事', 'Say your name and question silently'),
            oracleL('搖動籤筒，待一支籤浮出', 'Shake until one stick rises'),
            oracleL('依籤號取籤詩，細讀聖意', 'Read the poem for that lot'),
          ].map((step) => h('li', step))),
        ]),
      ]),
      h('section.oracle-altar', [
        h('h3.cf-vh', h('span', oracleL('二、虔心搖籤', 'Shake'))),
        h('div.oracle-altar-body', [
          // The cylinder is a second, pointer-only target; the button below is the accessible control.
          h(`div.oracle-cylinder${drawPhase === 'shake' ? '.is-shaking' : ''}${drawPhase === 'rise' ? '.is-rising' : ''}`, {
            title: '點擊籤筒亦可直接求籤',
            'aria-hidden': 'true',
            onclick: doDraw,
          }, [
            h('img.oracle-cylinder-stick', { src: 'img/oracle/oracle-stick.png', alt: '', draggable: 'false' }),
            h('img.oracle-cylinder-img', { src: 'img/oracle/oracle-cylinder.png', alt: '天上聖母靈籤實木籤筒', draggable: 'false' }),
          ]),
          h('button.btn.btn-primary.btn-lg.oracle-draw-btn', {
            type: 'button',
            disabled: busy,
            'aria-busy': busy ? 'true' : null,
            onclick: doDraw,
          }, [
            oracleIcon(ORACLE_ICONS.cylinder),
            h('span', busy ? (t('fortune.oracle_drawing') || '虔心搖動籤筒中...') : (t('fortune.oracle_draw_btn') || '搖籤求籤')),
          ]),
          h('p.oracle-draw-hint', '每一支籤皆以真隨機方式抽出、機率均等，誠心默禱即可'),
        ]),
      ]),
    ]);

    parent.appendChild(h('div.oracle-draw', [sheet]));
  };

  // ----------------------------------------------------------------
  // 查籤模式：六十甲子籤譜
  // ----------------------------------------------------------------
  const renderLookupMode = (parent, refresh) => {
    const pick = (num) => {
      revealNext = true;
      lookupNumber = Number(num);
      refresh();
      executeLookup(num, refresh);
    };
    const metaFor = (n) => (lotsSummaryList || []).find((l) => Number(l.lotNumber) === n);

    const matrix = h('div.oracle-matrix', { role: 'group', 'aria-label': oracleL('六十甲子籤號', 'Lots 1 to 60') },
      ORACLE_STEMS.split('').map((stem, si) => h('div.oracle-matrix-row', [
        h('span.oracle-matrix-stem', { 'aria-hidden': 'true' }, stem),
        ...Array.from({ length: 6 }, (_, bi) => {
          const num = si * 6 + bi + 1;
          const meta = metaFor(num);
          const gz = meta?.ganZhi || oracleLotGanZhi(num);
          const good = meta ? oracleParseRank(meta.guaRank).good : false;
          const isSelected = num === lookupNumber;
          return h(`button.oracle-num${good ? '.is-good' : ''}${isSelected ? '.is-active' : ''}`, {
            type: 'button',
            'aria-pressed': isSelected ? 'true' : 'false',
            'aria-label': `第 ${num} 籤 ${gz}${meta?.guaRank ? ` ${meta.guaRank}` : ''}`,
            title: `第 ${num} 籤`,
            onclick: () => pick(num),
          }, [
            h('b', String(num)),
            h('small', gz.slice(1)),
          ]);
        }),
      ])));

    const nav = h('aside.oracle-browse-nav', [
      h('label.oracle-field', [
        h('span.oracle-field-label', t('fortune.oracle_lookup_select') || '選擇甲子籤號：'),
        h('select.fortune-select-sm.oracle-lot-select', {
          onchange: (e) => pick(e.target.value),
        }, (lotsSummaryList || []).map((l) => h('option', {
          value: l.lotNumber,
          selected: Number(l.lotNumber) === lookupNumber,
        }, `第 ${String(l.lotNumber).padStart(2, '0')} 籤 · ${l.ganZhi} - ${l.firstLine} (${l.storyTitle})`))),
      ]),
      h('p.oracle-browse-note', '直接瀏覽傳統六十甲子全篇詩文與分項聖意'),
      h('h3.oracle-matrix-title', oracleL('六十甲子籤譜', 'The sixty lots')),
      matrix,
      h('p.oracle-matrix-legend', [h('b', oracleL('吉籤印紅', 'Auspicious lots in red')), oracleL('，平籤與先難後易印墨', ', the rest in ink')]),
    ]);

    // While a new pick loads, the previous slip stays in place (dimmed) so nothing jumps.
    const showLot = currentLot;
    const pending = Boolean(showLot) && Number(showLot.lotNumber) !== lookupNumber;
    const slipArea = h(`div.oracle-browse-slip${pending ? '.is-pending' : ''}`, { 'aria-busy': pending ? 'true' : null }, [
      showLot
        ? renderResult(showLot, { topic: selectedTopic, isLookup: true, refresh })
        : h('p.oracle-loading', { role: 'status' }, oracleL(`正在取出第 ${lookupNumber} 籤…`, `Opening lot ${lookupNumber}…`)),
    ]);

    parent.appendChild(h('div.oracle-browse', [nav, slipArea]));

    if (revealNext && showLot && !pending) {
      revealNext = false;
      requestAnimationFrame(() => {
        const top = slipArea.getBoundingClientRect().top;
        if (top > window.innerHeight * 0.6) {
          slipArea.scrollIntoView({ block: 'start', behavior: oracleReducedMotion() ? 'auto' : 'smooth' });
        }
      });
    }
  };

  // ----------------------------------------------------------------
  // 籤箋：操作列 + 雙框籤紙
  // ----------------------------------------------------------------
  const renderResult = (lot, cfg = {}) => {
    const land = landNext;
    landNext = false;
    const { topic = 'general', question = '', isLookup = false, onRedraw, refresh, record = null } = cfg;
    const isSaved = savedRecordLotIds.has(Number(lot.lotNumber));
    const hasNote = Boolean(record?.userNotes);

    // A drawn lot is already in 我的求籤紀錄, so its first action is the reflection note.
    const noteButton = record && h('button.btn.btn-ghost.oracle-act', {
      type: 'button',
      title: oracleL('已記入我的求籤紀錄，可寫下心得', 'Already in My Records — add a note'),
      onclick: () => executeUpdateRecordNote(record, () => {
        if (drawnRecord?.id === record.id) drawnRecord = recordsList.find((r) => r.id === record.id) || drawnRecord;
        refresh?.();
      }),
    }, [
      oracleIcon(ORACLE_ICONS.edit),
      h('span', hasNote
        ? (t('fortune.oracle_note_edit_btn') || '編輯心得')
        : (t('fortune.oracle_note_btn') || '寫下心得')),
    ]);

    const actions = h('div.oracle-actions', { role: 'toolbar', 'aria-label': oracleL('籤詩操作', 'Lot actions') }, [
      noteButton || App?.user && (isSaved
        ? h('span.oracle-act.oracle-saved', { title: '已儲存至個人求籤紀錄庫' }, [
          oracleIcon(ORACLE_ICONS.bookmarkFilled),
          h('span', t('fortune.oracle_saved_badge') || '已收藏'),
        ])
        : h('button.btn.btn-ghost.oracle-act', {
          type: 'button',
          title: t('fortune.oracle_save_btn') || '收藏此籤',
          onclick: () => executeSaveRecord(lot, topic, question, refresh),
        }, [
          oracleIcon(ORACLE_ICONS.bookmark),
          h('span', t('fortune.oracle_save_btn') || '收藏此籤'),
        ])),
      h('button.btn.btn-ghost.oracle-act', {
        type: 'button',
        title: t('fortune.oracle_export_card') || '匯出卡圖',
        onclick: () => exportLotCardImage(lot, question, topic),
      }, [
        oracleIcon(ORACLE_ICONS.exportImg),
        h('span', t('fortune.oracle_export_card') || '匯出卡圖'),
      ]),
      h('button.btn.btn-primary.oracle-act', {
        type: 'button',
        title: t('fortune.oracle_copy_btn') || '複製籤詩',
        onclick: () => copyPoemToClipboard(lot),
      }, [
        oracleIcon(ORACLE_ICONS.copy),
        h('span', t('fortune.oracle_copy_btn') || '複製籤詩'),
      ]),
      !isLookup && h('button.btn.btn-secondary.oracle-act', {
        type: 'button',
        title: t('fortune.oracle_redraw_btn') || '重新求籤',
        onclick: onRedraw,
      }, [
        oracleIcon(ORACLE_ICONS.refresh),
        h('span', t('fortune.oracle_redraw_btn') || '重新求籤'),
      ]),
    ].filter(Boolean));

    const slip = renderSlip(lot, { topic, question, land });
    const wrap = h('div.oracle-result', [actions, slip]);

    if (land) {
      requestAnimationFrame(() => {
        slip.focus({ preventScroll: true });
        const top = wrap.getBoundingClientRect().top;
        if (top < 96 || top > window.innerHeight * 0.45) {
          wrap.scrollIntoView({ block: 'start', behavior: oracleReducedMotion() ? 'auto' : 'smooth' });
        }
      });
    }
    return wrap;
  };

  const renderSlip = (lot, { topic, question, land }) => {
    const num = Number(lot.lotNumber);
    const rank = oracleParseRank(lot.guaRank);
    const topicObj = ORACLE_TOPICS.find((x) => x.key === topic) || ORACLE_TOPICS[0];
    const topicAdvice = lot.topics?.[topic] || lot.topics?.general || lot.explanation?.summary;
    const orientation = String(lot.elementOrientation || '').split(/\s+/).filter(Boolean);
    const otherTopics = ORACLE_TOPICS.filter((x) => x.key !== topic);
    const otherStories = (lot.story?.allStories || []).filter((s) => s && s !== lot.story?.title);
    const titleId = `oracle-slip-title-${num}`;
    const sealSize = rank.main.length >= 3 ? '.is-four' : rank.main.length === 1 ? '.is-one' : '';

    const topicRow = (top, advice, asked) => h(`div.cf-row.oracle-topic-row${asked ? '.is-asked' : ''}`, [
      h('dt', oracleIsEn() ? top.en : top.short),
      h('dd', h('p', advice || '—')),
    ]);

    const readSection = (zh, en, body) => h('section.oracle-read', [
      h('h3.cf-vh', h('span', oracleL(zh, en))),
      h('div.oracle-read-body', body),
    ]);

    return h(`article.cf-sheet.oracle-slip${land ? '.is-landing' : ''}`, { tabindex: '-1', 'aria-labelledby': titleId }, [
      h('div.oracle-slip-main', [
        // 籤號 · 干支 · 卦印
        h('section.oracle-slip-head', [
          h('div.oracle-slip-no', [
            h('small', oracleL('媽祖靈籤', 'Mazu lot')),
            h('strong', { 'aria-hidden': 'true' }, String(num)),
            h(`h3.oracle-slip-title#${titleId}`, oracleL(`第${oracleZhNum(num)}籤`, `Lot ${num}`)),
          ]),
          h('div.oracle-slip-gz', [
            h('div.oracle-gz', [
              h('p.oracle-gz-main', lot.ganZhi),
              ...orientation.map((part) => h('p', part)),
            ]),
          ]),
          h('div.oracle-slip-rank', [
            rank.main && h(`div.cf-seal.oracle-seal${rank.good ? '' : '.is-ink'}${sealSize}`, { role: 'img', 'aria-label': `卦象 ${lot.guaRank}` }, h('span', sealSize === '.is-four' ? [...rank.main].map((ch) => h('i', ch)) : rank.main)),
            h('p', [
              rank.note && h('b', rank.note),
              h('span', `${oracleL('所問', 'Asked')} · ${oracleTopicName(topicObj)}`),
            ]),
          ]),
        ]),
        // 所問之事回顧
        question && h('section.oracle-slip-asked', [
          h('dl.cf-rows', h('div.cf-row', [
            h('dt', oracleL('所問', 'Asked')),
            h('dd', h('b', `「${question}」`)),
          ])),
        ]),
        // 籤枝與籤詩
        h('section.oracle-slip-poem', [
          h('figure.oracle-stick', [
            h('img', { src: 'img/oracle/oracle-stick.png', alt: `第 ${num} 籤靈籤竹籤`, draggable: 'false' }),
            // The stick art has one lot number carved into it; reprint the carving with the drawn lot.
            h('span.oracle-stick-carve', { 'aria-hidden': 'true' }, `靈籤第${oracleZhNum(num)}首　媽祖慈悲`),
          ]),
          h('div.oracle-paper', [
            h('ol.oracle-poem', { 'aria-label': oracleL('籤詩', 'Poem') }, (lot.poem?.lines || []).map((line) => h('li', line))),
          ]),
        ]),
      ]),
      h('div.oracle-slip-read', [
        readSection('歷史典故', 'Story', [
          h('p.oracle-story-title', lot.story?.title || '民間傳說'),
          lot.story?.summary && h('p.oracle-story-sum', lot.story.summary),
          otherStories.length > 0 && h('p.oracle-note', `${oracleL('相關典故', 'Related')}：${otherStories.join('、')}`),
        ]),
        readSection('白話總意', 'Meaning', [
          h('p.oracle-meaning', lot.explanation?.summary || ''),
          lot.explanation?.metaphor && h('p.oracle-note', lot.explanation.metaphor),
        ]),
        h('section.oracle-read.oracle-topics', [
          h('h3.cf-vh', h('span', oracleL('分項聖意', 'By topic'))),
          h('div.oracle-topics-body', [
            h('dl.cf-rows', topicRow(topicObj, topicAdvice, true)),
            h('details.oracle-more', [
              h('summary', [
                h('span.oracle-more-chev', { html: ORACLE_ICONS.chevron, 'aria-hidden': 'true' }),
                h('span', oracleL(
                  `查看其餘維度聖意指引（${otherTopics.map((x) => x.short).join(' / ')}）`,
                  `Other topics (${otherTopics.map((x) => x.en).join(' / ')})`
                )),
              ]),
              h('dl.cf-rows', otherTopics.map((top) => topicRow(top, lot.topics?.[top.key], false))),
            ]),
          ]),
        ]),
        Array.isArray(lot.actionGuidelines) && lot.actionGuidelines.length > 0 && readSection('處事方針', 'Guidance', [
          h('p.oracle-guides-title', '處事實踐方針'),
          h('ol.oracle-guides', lot.actionGuidelines.map((guide) => h('li', guide))),
        ]),
      ]),
      h('footer.oracle-slip-foot', [
        h('span', t('fortune.oracle_disclaimer') || '傳統公有領域民間文化文獻 · 供處事啟發與心靈沈澱參考'),
        h('span', '天上聖母六十甲子籤 · 吉時行樂整理'),
      ]),
    ]);
  };

  // ----------------------------------------------------------------
  // 個人求籤紀錄庫
  // ----------------------------------------------------------------
  const STATUS_LABELS = () => ({
    pending: t('fortune.oracle_status_pending') || '待印證',
    fulfilled: t('fortune.oracle_status_fulfilled') || '已印證 (靈驗)',
    insight: t('fortune.oracle_status_insight') || '另有領悟',
    unfulfilled: t('fortune.oracle_status_unfulfilled') || '未應驗',
  });

  const renderRecordsMode = (parent, refreshFn) => {
    const labels = STATUS_LABELS();

    const filterBar = h('div.oracle-filter-bar', [
      h('label.oracle-field', [
        h('span.oracle-field-label', t('fortune.oracle_records_filter_topic') || '主題篩選：'),
        h('select.fortune-select-sm', {
          onchange: (e) => {
            recordsFilterTopic = e.target.value;
            fetchRecordsList().then(refreshFn);
          },
        }, [
          h('option', { value: 'all' }, '全部主題'),
          ...ORACLE_TOPICS.map((top) => h('option', { value: top.key, selected: top.key === recordsFilterTopic }, oracleTopicName(top))),
        ]),
      ]),
      h('label.oracle-field', [
        h('span.oracle-field-label', t('fortune.oracle_records_filter_status') || '印證狀態：'),
        h('select.fortune-select-sm', {
          onchange: (e) => {
            recordsFilterStatus = e.target.value;
            fetchRecordsList().then(refreshFn);
          },
        }, [
          h('option', { value: 'all' }, '全部狀態'),
          ...['pending', 'fulfilled', 'insight', 'unfulfilled'].map((key) => h('option', { value: key, selected: recordsFilterStatus === key }, labels[key])),
        ]),
      ]),
      h('span.oracle-filter-total', { role: 'status' }, t('fortune.oracle_records_total', { n: recordsTotal }) || `累計 ${recordsTotal} 籤`),
    ]);

    const stats = recordsStats && h('section.oracle-stats', [
      h('dl.oracle-stats-grid', [
        ['累計收藏', recordsStats.total || 0, ''],
        [labels.fulfilled, recordsStats.statusCounts?.fulfilled || 0, '.is-red'],
        [labels.pending, recordsStats.statusCounts?.pending || 0, ''],
        [labels.insight, recordsStats.statusCounts?.insight || 0, '.is-red'],
      ].map(([label, value, cls]) => h('div.oracle-stat', [
        h('dt', label),
        h(`dd${cls}`, String(value)),
      ]))),
    ]);

    let body;
    if (loadingRecords && recordsList.length === 0) {
      body = h('p.oracle-loading', { role: 'status' }, t('common.loading') || '正在讀取個人求籤紀錄庫...');
    } else if (!recordsList || recordsList.length === 0) {
      body = h('div.oracle-empty', [
        h('p.oracle-empty-title', t('fortune.oracle_records_empty') || '尚無求籤紀錄，去抽一支靈籤吧！'),
        h('p.oracle-empty-desc', '誠心向天上聖母求籤，可將抽中的籤詩保存至個人歷史筆記庫，日後追蹤驗證與心境變化。'),
        h('button.btn.btn-primary', {
          type: 'button',
          onclick: () => {
            subMode = 'draw';
            refreshFn();
          },
        }, [
          oracleIcon(ORACLE_ICONS.cylinder),
          h('span', t('fortune.oracle_sub_draw') || '虔心求籤'),
        ]),
      ]);
    } else {
      body = h('ol.oracle-record-list', recordsList.map((rec) => renderRecord(rec, labels, refreshFn)));
    }

    parent.appendChild(h('div.oracle-records', [
      filterBar,
      h('article.cf-sheet.oracle-ledger', { 'aria-label': t('fortune.oracle_sub_records') || '我的求籤紀錄' }, [
        stats,
        h('section.oracle-ledger-body', [
          h('h3.cf-vh', h('span', oracleL('求籤紀錄', 'Records'))),
          body,
        ]),
      ].filter(Boolean)),
    ]));
  };

  const renderRecord = (rec, labels, refreshFn) => {
    const topicObj = ORACLE_TOPICS.find((x) => x.key === rec.topic) || ORACLE_TOPICS[0];
    const status = labels[rec.verifiedStatus] ? rec.verifiedStatus : 'pending';
    const rank = oracleParseRank(rec.guaRank);
    const created = rec.createdAt ? new Date(String(rec.createdAt).replace(' ', 'T')) : null;
    const createdText = created && !Number.isNaN(created.getTime())
      ? created.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      : '';

    return h('li.oracle-record', [
      h('div.oracle-record-no', [
        h('strong', String(rec.lotNumber)),
        h('span', rec.ganZhi),
        rank.main && h(`em${rank.good ? '' : '.is-ink'}`, rank.main),
        rank.note && h('small', rank.note),
      ]),
      h('div.oracle-record-main', [
        h('div.oracle-record-top', [
          h('span.oracle-record-topic', [oracleIcon(topicObj.icon), h('span', oracleTopicName(topicObj))]),
          createdText && h('time.oracle-record-date', { datetime: rec.createdAt }, createdText),
          h(`button.oracle-status.is-${status}`, {
            type: 'button',
            title: '點擊切換印證狀態 (待印證 / 已印證 / 另有領悟 / 未應驗)',
            'aria-label': `${oracleL('印證狀態', 'Status')}：${labels[status]}，${oracleL('點擊切換', 'tap to change')}`,
            onclick: () => executeToggleRecordStatus(rec, refreshFn),
          }, labels[status]),
        ]),
        rec.question && h('p.oracle-record-ask', [h('b', '所求：'), `「${rec.question}」`]),
        h('p.oracle-record-poem', `${(rec.poemLines || []).slice(0, 2).join('，')}……`),
        rec.storyTitle && h('p.oracle-note', `典故：${rec.storyTitle}`),
        rec.userNotes && h('div.oracle-record-notes', [
          h('span', '個人驗證心得筆記'),
          h('p', rec.userNotes),
        ]),
        h('div.oracle-record-actions', [
          h('button.btn.btn-xs.btn-ghost', {
            type: 'button',
            title: '查看完整詩箋與各項解說',
            onclick: () => {
              currentLot = {
                lotNumber: rec.lotNumber,
                ganZhi: rec.ganZhi,
                guaRank: rec.guaRank,
                poem: { lines: rec.poemLines },
                story: { title: rec.storyTitle, summary: rec.storySummary },
                explanation: { summary: rec.explanationSummary },
              };
              subMode = 'lookup';
              lookupNumber = Number(rec.lotNumber);
              refreshFn();
              executeLookup(rec.lotNumber, refreshFn); // fill in topics and guidance
            },
          }, '查看完整籤詩'),
          h('button.btn.btn-xs.btn-ghost', {
            type: 'button',
            title: '編輯心得筆記',
            onclick: () => executeUpdateRecordNote(rec, refreshFn),
          }, [
            oracleIcon(ORACLE_ICONS.edit),
            h('span', t('fortune.oracle_records_edit_note') || '筆記'),
          ]),
          h('button.btn.btn-xs.btn-ghost', {
            type: 'button',
            title: '匯出卡圖 (PNG)',
            onclick: () => exportLotCardImage(rec, rec.question, rec.topic),
          }, [
            oracleIcon(ORACLE_ICONS.exportImg),
            h('span', t('fortune.oracle_export_card') || '卡圖'),
          ]),
          h('button.btn.btn-xs.btn-ghost.oracle-del', {
            type: 'button',
            title: t('fortune.oracle_records_delete') || '刪除紀錄',
            'aria-label': `${t('fortune.oracle_records_delete') || '刪除紀錄'} · 第 ${rec.lotNumber} 籤`,
            onclick: () => executeDeleteRecord(rec, refreshFn),
          }, [oracleIcon(ORACLE_ICONS.trash)]),
        ]),
      ]),
    ]);
  };

  // 切換紀錄印證狀態
  const executeToggleRecordStatus = async (record, refreshFn) => {
    const cycle = ['pending', 'fulfilled', 'insight', 'unfulfilled'];
    const nextIdx = (cycle.indexOf(record.verifiedStatus) + 1) % cycle.length;
    const nextStatus = cycle[nextIdx];

    try {
      const res = await api.put(`/api/fortune/oracle/records/${record.id}`, {
        verifiedStatus: nextStatus,
      });
      if (res?.ok) {
        toast(t('fortune.oracle_records_update_success') || '筆記與印證狀態已更新', 'ok');
        await fetchRecordsList();
        refreshFn?.();
      } else {
        toast(res?.error || '更新狀態失敗', 'error');
      }
    } catch (err) {
      toast(err.message || '更新異常', 'error');
    }
  };

  // 編輯紀錄筆記
  const executeUpdateRecordNote = async (record, refreshFn) => {
    const newNotes = await promptModal(
      t('fortune.oracle_save_note_prompt') || '記錄個人心得、後續進展或驗證筆記（選填）：',
      {
        title: `編輯【第 ${record.lotNumber} 籤 · ${record.ganZhi}】心得筆記`,
        defaultValue: record.userNotes || '',
        confirmLabel: '確認儲存',
      }
    );
    if (newNotes === null) return;

    try {
      const res = await api.put(`/api/fortune/oracle/records/${record.id}`, {
        userNotes: newNotes.trim(),
      });
      if (res?.ok) {
        toast(t('fortune.oracle_records_update_success') || '筆記與印證狀態已更新', 'ok');
        await fetchRecordsList();
        refreshFn?.();
      } else {
        toast(res?.error || '儲存失敗', 'error');
      }
    } catch (err) {
      toast(err.message || '連線異常，儲存失敗', 'error');
    }
  };

  // 刪除紀錄
  const executeDeleteRecord = async (record, refreshFn) => {
    const ok = await confirmModal(
      t('fortune.oracle_records_delete_confirm') || '確定要刪除這筆求籤紀錄嗎？刪除後無法復原。',
      {
        title: `刪除求籤紀錄【第 ${record.lotNumber} 籤】`,
        danger: true,
        confirmLabel: t('common.delete') || '刪除',
      }
    );
    if (!ok) return;

    try {
      const res = await api.delete(`/api/fortune/oracle/records/${record.id}`);
      if (res?.ok) {
        toast(t('fortune.oracle_records_delete_success') || '求籤紀錄已成功刪除', 'ok');
        await fetchRecordsList();
        refreshFn?.();
      } else {
        toast(res?.error || '刪除失敗', 'error');
      }
    } catch (err) {
      toast(err.message || '刪除異常', 'error');
    }
  };

  return {
    render,
    executeDraw,
    executeLookup,
    fetchRecordsList,
  };
}

// 註冊至全域供 views-fortune.js 與外部呼叫
window.createFortuneOracleView = createFortuneOracleView;
