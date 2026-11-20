const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const A = require('../lib/auth');
const { get, run, all } = require('../db');
const { calculateBaZi, solarToLunar, getDailyAlmanac, getTaiwanAlmanac } = require('../lib/fortune-lunar');
const { calculateZiweiChart, calculateYearlyFortune } = require('../lib/fortune-ziwei');
const {
  parseDateString,
  getTaipeiToday,
  createTaipeiNoonDate,
  MIN_DATE,
  MAX_DATE,
} = require('../lib/fortune-date');
const { analyzePalaceInterpretations } = require('../lib/fortune-ziwei-interpretation');
const { calculateZiweiCompatibility } = require('../lib/fortune-ziwei-compatibility');
const { calculateNatalChart, checkMercuryRetrograde } = require('../lib/fortune-astro');
const {
  getOracleCollections,
  getOracleManifest,
  listOracleLots,
  getOracleLot,
  drawOracleLot,
  saveOracleRecord,
  listOracleRecords,
  getOracleRecordById,
  updateOracleRecord,
  deleteOracleRecord,
  getOracleRecordStats,
} = require('../lib/fortune-oracle');
const {
  getTarotDecks,
  getTarotManifest,
  listTarotCards,
  getTarotCard,
  getTarotSpreads,
  createTarotReading,
  revealTarotSlot,
  revealAllTarotSlots,
  getTarotReading,
} = require('../lib/fortune-tarot');

// 記憶體快取：key: `${dateStr}_${sign}`, value: { data, expiresAt }
const horoscopeCache = new Map();

// ------------------------------------------------------------------
// 1. 老黃曆趣味詞庫 (Daily Almanac Vocabulary)
// ------------------------------------------------------------------
const AUSPICIOUS_POOL = [
  { action: '早點出門', desc: '避開塞車人潮，一路綠燈心情好' },
  { action: '喝杯手搖飲', desc: '半糖少冰剛剛好，一整天元氣滿滿' },
  { action: '準時下班', desc: '今天的事今天做完，晚上留給自己' },
  { action: '整理房間', desc: '斷捨離一次，運氣跟著空間一起流動' },
  { action: '打電話給家人', desc: '簡單一句問候，比什麼禮物都珍貴' },
  { action: '出門散步', desc: '曬曬太陽走一走，煩惱自然少一半' },
  { action: '嘗試新餐廳', desc: '巷口那家排隊名店，今天剛好不用等' },
  { action: '早點睡覺', desc: '睡飽了，明天的你會感謝今天的自己' },
  { action: '讚美身邊的人', desc: '一句真心的好話，能讓對方開心一整天' },
  { action: '多喝溫開水', desc: '補充水分，氣色和精神都會變好' },
  { action: '運動流汗', desc: '動一動，壓力跟著汗水一起排出去' },
  { action: '讀幾頁書', desc: '安靜的閱讀時光，是給心靈最好的禮物' },
  { action: '整理手機相簿', desc: '刪掉重複的照片，順便回味美好回憶' },
  { action: '學一樣新東西', desc: '今天特別有悟性，學什麼都上手' },
  { action: '約朋友吃飯', desc: '好久不見的老朋友，聊起來特別投緣' },
  { action: '存一筆小錢', desc: '積少成多，未來的自己會感謝你' },
  { action: '換個新髮型', desc: '新造型帶來新氣象，桃花運跟著上門' },
  { action: '照顧花草植物', desc: '替小盆栽澆澆水，心情也跟著發芽' },
  { action: '寫下今天的感謝', desc: '記下三件小確幸，幸福感自動加倍' },
  { action: '泡個熱水澡', desc: '放鬆全身肌肉，好運從洗去疲憊開始' },
  { action: '聽喜歡的音樂', desc: '熟悉的旋律一響起，煩躁一掃而空' },
  { action: '完成一件拖很久的小事', desc: '劃掉待辦清單的那一刻，成就感滿分' },
  { action: '捐發票、做點小善事', desc: '小小善舉，累積滿滿福報' },
  { action: '曬棉被', desc: '吸飽陽光的棉被，今晚一定睡得特別香' },
];

const INAUSPICIOUS_POOL = [
  { action: '熬夜滑手機', desc: '越滑越清醒，明天的黑眼圈會出賣你' },
  { action: '衝動購物', desc: '購物車裡的東西，放三天再決定也不遲' },
  { action: '空腹喝咖啡', desc: '胃會默默抗議，記得先吃點東西' },
  { action: '跟人爭吵', desc: '退一步海闊天空，今天不適合爭輸贏' },
  { action: '勉強答應不想做的事', desc: '委屈自己的結果，往往是兩邊都不開心' },
  { action: '把事情拖到最後一刻', desc: '截止前的手忙腳亂，最容易出錯' },
  { action: '在背後說人閒話', desc: '話會繞一圈傳回來，還是少說為妙' },
  { action: '吃太飽', desc: '七分飽剛剛好，吃撐了只會想睡' },
  { action: '借錢給不熟的人', desc: '錢財往來要謹慎，以免傷財又傷情' },
  { action: '出門不帶傘', desc: '今天的天氣說變就變，出門前看一下預報' },
  { action: '邊走路邊看手機', desc: '小心腳下，安全最重要' },
  { action: '狂喝冰飲', desc: '透心涼的代價，可能是肚子不舒服' },
  { action: '一次答應太多邀約', desc: '行程塞太滿，反而哪裡都玩不盡興' },
  { action: '在氣頭上傳訊息', desc: '生氣時打的字，先存草稿冷靜一下再送出' },
  { action: '久坐不動', desc: '每坐一小時，記得起來伸展一下' },
  { action: '輕信網路謠言', desc: '轉傳之前，先查證一下比較保險' },
  { action: '臨時更改計畫', desc: '今天照原定安排走，最為順利' },
  { action: '跟自己過不去', desc: '不完美也沒關係，對自己溫柔一點' },
  { action: '忽略身體的警訊', desc: '累了就休息，身體比什麼都重要' },
  { action: '出門忘記關燈關電', desc: '省電又省錢，出門前多看一眼' },
];

// 回應欄位沿用 lucky_code: { code, meaning }，內容為幸運數字
const LUCKY_NUMBERS = [
  { code: '1', meaning: '一馬當先，適合勇敢踏出第一步' },
  { code: '3', meaning: '三生萬物，新的機會正在萌芽' },
  { code: '5', meaning: '五福臨門，健康與快樂都到位' },
  { code: '6', meaning: '六六大順，做什麼都順順利利' },
  { code: '7', meaning: '幸運七，今天容易有意外驚喜' },
  { code: '8', meaning: '一路發，財運與好運同步提升' },
  { code: '9', meaning: '長長久久，適合經營感情與人際' },
];

const LUCKY_COLORS = [
  { hex: '#10B981', name: '翡翠綠', desc: '象徵生機與成長，帶來平靜的好心情' },
  { hex: '#3B82F6', name: '晴空藍', desc: '像萬里無雲的天空，讓思緒清晰開闊' },
  { hex: '#8B5CF6', name: '薰衣草紫', desc: '溫柔又神秘，提升直覺與靈感' },
  { hex: '#F59E0B', name: '琥珀金', desc: '溫暖明亮，招來財運與自信' },
  { hex: '#EC4899', name: '櫻花粉', desc: '浪漫柔和，人緣與桃花運加分' },
  { hex: '#06B6D4', name: '湖水青', desc: '清新透亮，幫助放鬆與專注' },
  { hex: '#6366F1', name: '星夜靛', desc: '沉穩深邃，帶來安定與自信' },
];

const LUCKY_DIRECTIONS = [
  '朝東方出發，迎接朝氣與新機會',
  '面向南方，熱情與人緣運加分',
  '往西方走走，適合沉澱與收穫',
  '朝北方靜坐片刻，有助專注與思考',
  '靠窗而坐，陽光會帶來好心情',
  '往有水的地方去，財運跟著流動',
];

const DAILY_QUOTES = [
  '千里之行，始於足下。',
  '船到橋頭自然直。',
  '塞翁失馬，焉知非福。',
  '天下無難事，只怕有心人。',
  '退一步海闊天空。',
  '知足常樂，平安就是福。',
  '一日之計在於晨。',
  '笑一笑，十年少。',
  '日日是好日。',
  '行到水窮處，坐看雲起時。',
  '有朋自遠方來，不亦樂乎。',
  '心寬了，路就寬了。',
  '慢慢來，比較快。',
  '今天的努力，是明天的底氣。',
  '好運，是留給準備好的人。',
  '把每一天都當作新的開始。',
  '休息不是放棄，是為了走更遠的路。',
  '小確幸也是一種幸福。',
  '別人的步調，不必是你的步調。',
  '凡事盡力就好，其餘交給時間。',
  '多一分寬容，少一分計較。',
  '今天也辛苦了，記得好好吃飯。',
  '晴天曬曬太陽，雨天聽聽雨聲。',
  '人生不如意十之八九，常想一二。',
  '願你所求皆如願，所行皆坦途。',
  '吃飽睡好，就是最好的開運法。',
  '把心放寬，好事自然來。',
  '每個轉角，都可能遇見驚喜。',
];

// ------------------------------------------------------------------
// 2. 十二星座資料與每日建議 (Zodiac Data & Daily Advice)
// ------------------------------------------------------------------
const ZODIAC_METADATA = {
  aries: { name: '白羊座', en: 'Aries', date: '03/21 - 04/19', symbol: '♈', element: '火象星座' },
  taurus: { name: '金牛座', en: 'Taurus', date: '04/20 - 05/20', symbol: '♉', element: '土象星座' },
  gemini: { name: '雙子座', en: 'Gemini', date: '05/21 - 06/21', symbol: '♊', element: '風象星座' },
  cancer: { name: '巨蟹座', en: 'Cancer', date: '06/22 - 07/22', symbol: '♋', element: '水象星座' },
  leo: { name: '獅子座', en: 'Leo', date: '07/23 - 08/22', symbol: '♌', element: '火象星座' },
  virgo: { name: '處女座', en: 'Virgo', date: '08/23 - 09/22', symbol: '♍', element: '土象星座' },
  libra: { name: '天秤座', en: 'Libra', date: '09/23 - 10/23', symbol: '♎', element: '風象星座' },
  scorpio: { name: '天蠍座', en: 'Scorpio', date: '10/24 - 11/22', symbol: '♏', element: '水象星座' },
  sagittarius: { name: '射手座', en: 'Sagittarius', date: '11/23 - 12/21', symbol: '♐', element: '火象星座' },
  capricorn: { name: '摩羯座', en: 'Capricorn', date: '12/22 - 01/19', symbol: '♑', element: '土象星座' },
  aquarius: { name: '水瓶座', en: 'Aquarius', date: '01/20 - 02/18', symbol: '♒', element: '風象星座' },
  pisces: { name: '雙魚座', en: 'Pisces', date: '02/19 - 03/20', symbol: '♓', element: '水象星座' },
};

const ZODIAC_DAILY_ADVICE = {
  aries: [
    '今日衝勁十足，適合處理擱置已久的難題，但做重大決定前記得先深呼吸、多想三秒。',
    '執行力極高的一天，能迅速推動手邊的計畫，說話直率有力，也記得多給身邊的人一些肯定。',
  ],
  taurus: [
    '穩定如山的一天，適合處理需要耐心的事務，理財規劃與長期目標特別容易有進展。',
    '對細節與品質格外講究，耐得住性子把事情做好，是身邊的人最可靠的後盾。',
  ],
  gemini: [
    '思維敏捷跳躍，即使同時處理好幾件事也能切換自如，非常適合腦力激盪新點子。',
    '溝通運極佳，今天主動和家人或同事把話說開，能省下往後許多誤會與麻煩。',
  ],
  cancer: [
    '防禦力滿分，考慮事情周全細膩，能提前避開許多潛在的小麻煩。',
    '今天適合整理居家環境、陪伴家人，用心照顧身邊的人，溫暖也會回到自己身上。',
  ],
  leo: [
    '氣場強大，今天在會議或聚會上的發言極具說服力，大家都會信賴你的判斷。',
    '適合帶頭完成一件大事，順利之後記得請大家吃頓下午茶，一起好好慶祝。',
  ],
  virgo: [
    '細心天賦發揮到極致，今天經你手的事情都井井有條、一絲不苟。',
    '觀察力敏銳，再細微的問題也逃不過你的法眼，適合核對帳目與檢查重要細節。',
  ],
  libra: [
    '平衡感極佳，能在理想與現實之間找到最恰當的平衡點，做決定特別得宜。',
    '適合扮演朋友之間的和事佬，你的圓融與好品味，讓大家都感到舒服自在。',
  ],
  scorpio: [
    '直覺與洞察力驚人，一眼就能看穿事情的關鍵，今天特別適合分析與判斷。',
    '專注力突破天際，適合深入鑽研一件事，再複雜的謎團也能被你抽絲剝繭。',
  ],
  sagittarius: [
    '冒險探索精神旺盛，適合嘗試新事物、安排一趟小旅行，為生活注入新鮮活力。',
    '心態開朗樂觀，就算遇到小挫折也能笑著化解，正能量感染身邊每一個人。',
  ],
  capricorn: [
    '條理分明、抗壓性極強，面對繁重的任務絲毫不亂，一步一腳印穩穩推進。',
    '今天適合訂定長期目標與計畫，為未來半年的生活與工作打下穩固基礎。',
  ],
  aquarius: [
    '奇思妙想頻出，常能用與眾不同的角度突破難關，點子讓人拍案叫絕。',
    '靈感充沛，適合創意發想、學習新知，或結交志同道合的新朋友。',
  ],
  pisces: [
    '富有同理心，說出的話溫柔體貼，身邊的人都能感受到你的善意與關懷。',
    '靈感源源不絕，適合聽音樂、畫畫或寫點東西，讓心情跟著創作一起流動。',
  ],
};

// 偽隨機數產生器 (LCG Deterministic PRNG)
function createSeededRandom(seed) {
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ------------------------------------------------------------------
// 3. API 路由定義
// ------------------------------------------------------------------

/**
 * GET /api/fortune/daily
 * 取得當前用戶今日或指定日期之老黃曆 (含台灣官方曆法校驗與趣味宜忌)
 */
router.get('/daily', A.attachUser, (req, res) => {
  const userId = req.user?.id || 1;
  const username = req.user?.nickname || req.user?.username || '道友';

  const rawDate = req.query.date;
  const todayTaipei = getTaipeiToday();
  let selectedDateStr = todayTaipei;

  if (rawDate !== undefined) {
    if (typeof rawDate !== 'string' || Array.isArray(rawDate) || rawDate.trim() === '') {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_DATE_PARAM',
        message: '查詢日期參數格式錯誤，請傳遞符合 YYYY-MM-DD 之有效日期字串',
        supportedRange: { min: MIN_DATE, max: MAX_DATE },
      });
    }
    const parseRes = parseDateString(rawDate.trim());
    if (!parseRes.valid) {
      return res.status(400).json({
        ok: false,
        error: parseRes.error,
        message: parseRes.message,
        supportedRange: parseRes.supportedRange || { min: MIN_DATE, max: MAX_DATE },
      });
    }
    selectedDateStr = parseRes.dateStr;
  }

  const parsed = parseDateString(selectedDateStr);
  const targetDate = createTaipeiNoonDate(parsed.year, parsed.month, parsed.day);
  const almanac = getTaiwanAlmanac(targetDate);
  const dateStr = almanac.date; // 台北時區 YYYY-MM-DD
  const isToday = (dateStr === todayTaipei);
  const seed = stringToSeed(`${userId}-${dateStr}-zutoapi-fortune`);
  const rng = createSeededRandom(seed);

  // 1. 吉凶等級 (趣味推算)
  const luckRoll = rng();
  let luckLevel = 'good_luck';
  let luckLabel = '中吉';
  let luckBadge = '小有收穫 · 心想事成';
  if (luckRoll < 0.20) {
    luckLevel = 'great_luck'; luckLabel = '大吉'; luckBadge = '諸事順遂 · 好運連連';
  } else if (luckRoll < 0.55) {
    luckLevel = 'good_luck'; luckLabel = '中吉'; luckBadge = '小有收穫 · 心想事成';
  } else if (luckRoll < 0.80) {
    luckLevel = 'peaceful'; luckLabel = '平吉'; luckBadge = '平安順心 · 歲月靜好';
  } else if (luckRoll < 0.95) {
    luckLevel = 'slight_trouble'; luckLabel = '小凶'; luckBadge = '凡事多留心 · 三思而後行';
  } else {
    luckLevel = 'bad_luck'; luckLabel = '大凶'; luckBadge = '宜靜不宜動 · 喝杯熱茶緩一緩';
  }

  // 2. 隨機選取 2~3 個【宜】與【忌】
  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const auspiciousCount = rng() > 0.4 ? 3 : 2;
  const inauspiciousCount = rng() > 0.4 ? 3 : 2;
  const auspicious = shuffle(AUSPICIOUS_POOL).slice(0, auspiciousCount);
  const inauspicious = shuffle(INAUSPICIOUS_POOL).slice(0, inauspiciousCount);

  // 3. 幸運數字、幸運色、方位、每日一句
  const luckyCode = LUCKY_NUMBERS[Math.floor(rng() * LUCKY_NUMBERS.length)];
  const luckyColor = LUCKY_COLORS[Math.floor(rng() * LUCKY_COLORS.length)];
  const luckyDirection = LUCKY_DIRECTIONS[Math.floor(rng() * LUCKY_DIRECTIONS.length)];
  const dailyQuote = DAILY_QUOTES[Math.floor(rng() * DAILY_QUOTES.length)];

  res.json({
    ok: true,
    user_id: userId,
    username,
    date: dateStr,
    timezone: 'Asia/Taipei',
    today: todayTaipei,
    isToday,
    supportedRange: { min: MIN_DATE, max: MAX_DATE },
    rulesetVersion: '1.0.0',
    almanac,
    fun_almanac: {
      is_fun_content: true,
      disclaimer: '宜忌與吉凶為趣味推算，僅供休閒娛樂',
      seed_date: dateStr,
      luck: {
        level: luckLevel,
        label: luckLabel,
        badge: luckBadge,
      },
      auspicious,
      inauspicious,
      lucky_code: luckyCode,
      lucky_color: luckyColor,
      lucky_direction: luckyDirection,
      geek_quote: dailyQuote,
    },
    // 向下相容既有欄位
    luck: {
      level: luckLevel,
      label: luckLabel,
      badge: luckBadge,
    },
    auspicious,
    inauspicious,
    lucky_code: luckyCode,
    lucky_color: luckyColor,
    lucky_direction: luckyDirection,
    geek_quote: dailyQuote,
  });
});

// ------------------------------------------------------------------
// 2.1 星座高品質每日綜述資料庫 (Chinese & English Fallback Banks)
// ------------------------------------------------------------------
const ZODIAC_CHINESE_SUMMARIES = {
  aries: [
    '今日白羊座整體氣場旺盛，執行力與決策果斷度達到顛峰，適合在關鍵專案或疑難問題上主動出擊，開闢嶄新局面。',
    '思維清晰敏銳，適合制定短中期規劃並付諸行動；在人際與團隊協作中展現積極領導力，但需注意多傾聽隊友想法。',
    '直覺敏銳且活力充沛，今日面對複雜挑戰能迅速理清頭緒，保持平常心即能穩步收穫令人欣慰的成果。',
  ],
  taurus: [
    '今日金牛座步調沉穩踏實，心境平和而堅定，在繁瑣細節與重要事務中展現出令人安心的專注力。',
    '務實的直覺與對品質的堅持為你帶來極佳助益，適合清理積壓事務或調整生活步調，成果長久穩健。',
    '人際互動溫暖和諧，能給身邊夥伴帶來滿滿的安全感，按部就班推進目標便是最快的大道。',
  ],
  gemini: [
    '今日雙子座思緒靈活跳躍，溝通交流運勢高漲，極適合跨部門協作、頭腦風暴與分享創意洞見。',
    '靈感如湧泉般豐富，能輕鬆突破常規思維找到巧妙解法，多方資訊的整合能力在今天格外耀眼。',
    '心態輕盈愉悅，與團隊夥伴的溝通能迅速達成共識，是推動新構想與新嘗試的絕佳日子。',
  ],
  cancer: [
    '今日巨蟹座情感與直覺格外敏銳，關懷他人與協調氣氛的能力滿分，適合深化人際關係與解決長期溝通困擾。',
    '細心照顧周遭細節與身邊人的需要，為大家帶來如家般的包容與安全感，你的付出與溫暖會收穫真誠感謝。',
    '心境安寧澄澈，適合在熟悉的環境中專心深耕，防守與邊界檢查異常嚴密，任何隱患都難逃你的感知。',
  ],
  leo: [
    '今日獅子座魅力四射，自信與氣場如旭日東昇，在公開場合、面試或重要會議中能輕易贏得信賴。',
    '胸懷開闊且富有感染力，能激發整個團隊的鬥志與向心力，適當給予同伴肯定會讓聲望更上一層樓。',
    '創作慾與表現力達到高點，敢於承擔責任並推動關鍵進展，迎難而上便能創造亮眼的精彩成績。',
  ],
  virgo: [
    '今日處女座洞察力與邏輯條理性極佳，對品質的精雕細琢讓人驚嘆，任何細微瑕疵都能被你優雅修復。',
    '條理分明的思緒適合用來梳理複雜流程與規格細節，去蕪存菁的高效風格能大幅提升整體交付水準。',
    '心境專注而純粹，在安靜專研中收穫充實成就感，保持溫和與包容將使你收穫更多夥伴的崇敬。',
  ],
  libra: [
    '今日天秤座平衡感與審美感知優異，能精準拿捏各方需求與利益平衡點，是最佳的溝通橋樑與和解使者。',
    '優雅得體的談吐與協調能力令人如沐春風，在複雜的人際或重要抉擇中能迅速找到雙贏的最佳路徑。',
    '思緒開闊包容，適合審視整體藍圖並調整未來規劃，內心的平和與從容是今天最強大的能量泉源。',
  ],
  scorpio: [
    '今日天蠍座專注力與深層洞察力驚人，能穿透表面雜音直擊問題核心，在深度攻堅與謎題排查中大放異彩。',
    '意志堅定且抗壓能力超群，一旦鎖定目標便能耐住孤獨沉浸其中，展現出無可匹敵的穿透力與決斷力。',
    '直覺精準無比，適合進行底層分析與重大決策，給予信任的同伴以最堅實的後盾與支持。',
  ],
  sagittarius: [
    '今日射手座探索慾與求知心旺盛，視野宏大開朗，對新知識、新概念與前瞻方向擁有極高熱情與包容力。',
    '樂觀陽光的感染力驅散了周遭的沉悶，即使面對偶爾的波折也能轉化為寶貴的學習經驗，活力十足。',
    '適合跳出條條框框開拓全新領域，宏觀思維能為團隊注入遠見與信心，勇敢邁出步伐即可見寬闊新天地。',
  ],
  capricorn: [
    '今日摩羯座自律與耐心極為出色，心如磐石且目標導向明確，能在龐大繁複的任務中穩紮穩打推進。',
    '深思熟慮的規劃與強大執行力相輔相成，適合敲定長遠規劃與建構基礎骨架，為未來的成功打下堅實地基。',
    '面對挑戰展現出令人欽佩的定力與擔當，一步一個腳印的累積將在今天迎來實質且令人振奮的回報。',
  ],
  aquarius: [
    '今日水瓶座獨特視角與創新靈感源源不絕，擅長打破常規慣性思維，提出令人耳目一新的前衛解法。',
    '對未來趨勢具有敏銳感知，適合嘗試創新、探索新領域或發揮天馬行空的創意，靈光閃現。',
    '自由豁達的心境帶來極高的創造效率，與志同道合的夥伴切磋將激發出成倍的耀眼火花。',
  ],
  pisces: [
    '今日雙魚座共情力與藝術直覺達到高峰，感受細膩敏銳，能深刻體會身邊的人未說出口的心事。',
    '靈動豐沛的想像力為生硬的邏輯注入溫度與靈魂，在設計體驗、互動細節與美化展示上表現尤為突出。',
    '心境柔和寧靜，適合在放鬆舒適的節奏中專注創作，善待自己的內心將轉化為強大且治癒的創作動能。',
  ],
};

const ZODIAC_ENGLISH_SUMMARIES = {
  aries: [
    'Aries, your energy and determination are at an all-time high today. Take initiative on challenging goals with confidence.',
    'Clear and decisive thinking guides your steps. Focus on forward momentum while staying open to input from your teammates.',
    'Your natural instincts are sharp. Tackle complex problems methodically and enjoy the rewarding breakthroughs that follow.',
  ],
  taurus: [
    'Taurus, a calm and grounded mindset brings immense stability today. Your persistence turns ambitious tasks into solid reality.',
    'Attention to detail and quality pays off handsomely. It is an ideal day for tidying up, steady progress, and dependable teamwork.',
    'Warm and steady interactions cultivate harmony around you. Steady progress leads directly to lasting satisfaction.',
  ],
  gemini: [
    'Gemini, quick wit and brilliant versatility illuminate your path today. Great opportunities await in discussions and brainstorming.',
    'Inspiration flows effortlessly. Use your adaptable approach to bridge ideas and resolve questions that seemed puzzling before.',
    'A lighthearted mood makes collaboration delightful. Share your perspectives freely to spark exciting creative energy.',
  ],
  cancer: [
    'Cancer, your empathy and intuition are especially resonant today. Nurture your connections and bring thoughtful warmth to those around you.',
    'Careful attention to relationships and delicate nuances clears any misunderstandings, leaving you feeling deeply connected and appreciated.',
    'A serene focus allows you to build solid safeguards and protect what truly matters with patience and quiet strength.',
  ],
  leo: [
    'Leo, your radiant warmth and magnetic confidence inspire everyone in the room today. Lead by example and celebrate collective wins.',
    'Your natural creative flair makes presentations and critical discussions shine. Encourage your peers to amplify success together.',
    'Bold choices aligned with authentic passion bring notable progress. Stand tall and let your positive leadership guide the day.',
  ],
  virgo: [
    'Virgo, precision and keen clarity are your superpowers today. You can spot the subtle key details that others easily overlook.',
    'Streamlining complicated workflows comes naturally. Your thoughtful refinement elevates standards and earns sincere admiration.',
    'A calm, focused state of mind makes deep work exceptionally productive and deeply satisfying.',
  ],
  libra: [
    'Libra, harmony and graceful balance define your day. You have a special gift for bringing differing perspectives into agreement.',
    'Your aesthetic sense and diplomatic touch elevate every project you touch. Seek win-win outcomes and enjoy tranquil clarity.',
    'A balanced perspective keeps stress at bay. Cherish the pleasant synergy found in open and honest communication.',
  ],
  scorpio: [
    'Scorpio, penetrating insight and profound focus guide your efforts. Dive beneath the surface to uncover core truths and solutions.',
    'Your resilience is unmatched. Quiet concentration allows you to crack stubborn mysteries and deliver impactful results.',
    'Deep trust and unwavering resolve strengthen your closest alliances. Follow your powerful intuition with complete poise.',
  ],
  sagittarius: [
    'Sagittarius, an adventurous spirit and boundless optimism light your horizon today. Embrace fresh horizons and novel perspectives.',
    'Enthusiasm is contagious. Share your inspiring vision and encourage companions to aim for higher, exciting milestones.',
    'A broad philosophical outlook helps you navigate any small hurdles with a cheerful grin and eager curiosity.',
  ],
  capricorn: [
    'Capricorn, structured discipline and dependable patience pave your path to milestone accomplishments today.',
    'Your steady perseverance establishes solid foundations. Strategic planning and responsible execution yield impressive rewards.',
    'A grounded sense of purpose keeps you centered. Celebrate the steady progress born of enduring dedication.',
  ],
  aquarius: [
    'Aquarius, original concepts and innovative thinking flourish today. Challenge outdated conventions with inventive brilliance.',
    'Your inventive outlook helps teams discover smarter, more elegant approaches. Value the spark of authentic collaboration.',
    'A refreshing burst of insight opens exciting possibilities. Follow unusual angles to uncover delightful breakthroughs.',
  ],
  pisces: [
    'Pisces, intuitive empathy and artistic sensitivity reach a peak today. Infuse creativity and kindness into every interaction.',
    'Deep imagination softens rigid logic into warm, human-centered craftsmanship. Listen to your gentle inner voice.',
    'Peace of mind nurtures profound creative energy. Taking good care of yourself radiates uplifting comfort to everyone near.',
  ],
};

/**
 * 嘗試將英文星座運勢即時翻譯為繁體中文
 */
async function translateToTraditionalChinese(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  if (!clean) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item) => (item && item[0]) || '').join('').trim();
        if (translated) return translated;
      }
    }
  } catch {
    // 翻譯服務逾時或失敗時，無縫降級
  }
  return null;
}

/**
 * GET /api/fortune/horoscope?sign=aries&lang=zh-TW
 * 取得指定星座今日運勢 (含外部 API 拉取、自動繁中翻譯與賽博星盤兜底)
 */
router.get('/horoscope', async (req, res) => {
  const rawSign = String(req.query.sign || 'scorpio').toLowerCase().trim();
  const sign = ZODIAC_METADATA[rawSign] ? rawSign : 'scorpio';
  const meta = ZODIAC_METADATA[sign];
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const cacheKey = `${dateStr}_${sign}`;
  const requestedLang = String(req.query.lang || '').toLowerCase().trim();
  const isEn = requestedLang === 'en';

  // 1. 檢查記憶體快取
  const cached = horoscopeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    const currentSummary = isEn
      ? (cached.data.summary_en || cached.data.summary)
      : (cached.data.summary_zh || cached.data.summary);
    const compSign = isEn
      ? (cached.data.compatible_sign_en || cached.data.compatible_sign)
      : (cached.data.compatible_sign_zh || cached.data.compatible_sign);
    return res.json({
      ok: true,
      cached: true,
      ...cached.data,
      summary: currentSummary,
      compatible_sign: compSign,
    });
  }

  // 2. 本地賽博星盤演算法生成高品質星象基底
  const signSeed = stringToSeed(`${dateStr}_${sign}_zodiac_horoscope`);
  const rng = createSeededRandom(signSeed);

  const starRating = 3 + Math.floor(rng() * 3); // 3 ~ 5 星
  const workIndex = 70 + Math.floor(rng() * 29); // 70% ~ 98%
  const healthIndex = 68 + Math.floor(rng() * 31); // 68% ~ 98%
  const loveIndex = 65 + Math.floor(rng() * 34); // 65% ~ 98%
  const luckyNum = [1, 2, 3, 5, 6, 7, 8, 9, 11, 18][Math.floor(rng() * 10)];
  const allSigns = Object.keys(ZODIAC_METADATA);
  const compSignKey = allSigns[Math.floor(rng() * allSigns.length)];
  const compMeta = ZODIAC_METADATA[compSignKey];
  const compatibleSignZh = compMeta.name;
  const compatibleSignEn = compMeta.en;
  const compatibleSign = isEn ? compatibleSignEn : compatibleSignZh;

  const adviceList = ZODIAC_DAILY_ADVICE[sign] || ZODIAC_DAILY_ADVICE.scorpio;
  const dailyAdvice = adviceList[Math.floor(rng() * adviceList.length)];

  const zhFallbackList = ZODIAC_CHINESE_SUMMARIES[sign] || ZODIAC_CHINESE_SUMMARIES.scorpio;
  const enFallbackList = ZODIAC_ENGLISH_SUMMARIES[sign] || ZODIAC_ENGLISH_SUMMARIES.scorpio;
  const fallbackIndex = Math.floor(rng() * zhFallbackList.length);
  let summaryZh = zhFallbackList[fallbackIndex];
  let summaryEn = enFallbackList[fallbackIndex];
  let externalFetched = false;
  let translatedOnline = false;

  // 3. 嘗試從外部免費 Horoscope API 擷取實時星座概況 (2 秒超時)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${sign}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (response.ok) {
      const json = await response.json();
      if (json && json.data?.horoscope) {
        summaryEn = json.data.horoscope;
        externalFetched = true;
        // 即時繁體中文翻譯
        const translated = await translateToTraditionalChinese(summaryEn);
        if (translated) {
          summaryZh = translated;
          translatedOnline = true;
        }
      }
    }
  } catch {
    // 外部 API 逾時或離線時，無縫採用本地高品質星盤綜述
  }

  const currentSummary = isEn ? summaryEn : summaryZh;

  const resultData = {
    sign,
    sign_name: meta.name,
    sign_en: meta.en,
    sign_date: meta.date,
    sign_symbol: meta.symbol,
    element: meta.element,
    date: dateStr,
    external_source: externalFetched,
    translated_online: translatedOnline,
    star_rating: starRating,
    work_index: workIndex,
    health_index: healthIndex,
    love_index: loveIndex,
    lucky_number: luckyNum,
    compatible_sign: compatibleSign,
    compatible_sign_zh: compatibleSignZh,
    compatible_sign_en: compatibleSignEn,
    compatible_sign_key: compSignKey,
    summary: currentSummary,
    summary_zh: summaryZh,
    summary_en: summaryEn,
    daily_advice: dailyAdvice,
  };

  // 存入快取 (有效期間直到明日凌晨)
  const tomorrowMidnight = new Date(now);
  tomorrowMidnight.setHours(24, 0, 0, 0);
  horoscopeCache.set(cacheKey, {
    data: resultData,
    expiresAt: tomorrowMidnight.getTime(),
  });

  res.json({ ok: true, cached: false, ...resultData });
});

/**
 * GET /api/fortune/signs
 * 取得全部十二星座清單
 */
router.get('/signs', (req, res) => {
  res.json({ ok: true, signs: ZODIAC_METADATA });
});

// ------------------------------------------------------------------
// 4. 八字、紫微斗數、西洋星盤擴充端點
// ------------------------------------------------------------------

/**
 * GET /api/fortune/profile
 * 取得當前登入使用者的出生八字與命理偏好設定
 */
router.get('/profile', A.attachUser, (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.json({ ok: true, profile: null });
  }

  const profile = get('SELECT * FROM user_fortune_profiles WHERE user_id = ?', userId);
  res.json({ ok: true, profile: profile || null });
});

/**
 * POST /api/fortune/profile
 * 儲存或更新當前登入使用者的出生八字與命理設定
 */
router.post('/profile', A.requireAuth, (req, res) => {
  const userId = req.user.id;
  const {
    calendar_type = 'solar',
    birth_year,
    birth_month,
    birth_day,
    birth_hour = 12,
    birth_minute = 0,
    is_leap_month = 0,
    gender = 'M',
    city = 'Taipei',
    latitude = 25.0330,
    longitude = 121.5654,
  } = req.body || {};

  if (!birth_year || !birth_month || !birth_day) {
    return res.status(400).json({ error: '請提供有效的出生年月日' });
  }

  const existing = get('SELECT id FROM user_fortune_profiles WHERE user_id = ?', userId);
  if (existing) {
    run(`
      UPDATE user_fortune_profiles
      SET calendar_type = ?, birth_year = ?, birth_month = ?, birth_day = ?,
          birth_hour = ?, birth_minute = ?, is_leap_month = ?, gender = ?,
          city = ?, latitude = ?, longitude = ?, updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `, calendar_type, birth_year, birth_month, birth_day, birth_hour, birth_minute, is_leap_month ? 1 : 0, gender, city, latitude, longitude, userId);
  } else {
    run(`
      INSERT INTO user_fortune_profiles (
        user_id, calendar_type, birth_year, birth_month, birth_day,
        birth_hour, birth_minute, is_leap_month, gender, city, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, userId, calendar_type, birth_year, birth_month, birth_day, birth_hour, birth_minute, is_leap_month ? 1 : 0, gender, city, latitude, longitude);
  }

  const updated = get('SELECT * FROM user_fortune_profiles WHERE user_id = ?', userId);
  res.json({ ok: true, profile: updated });
});

/**
 * POST /api/fortune/ziwei/chart
 * 計算紫微斗數八字排盤與流年
 */
router.post('/ziwei/chart', A.attachUser, (req, res) => {
  const body = req.body || {};
  let year = Number(body.year);
  let month = Number(body.month);
  let day = Number(body.day);
  let hour = Number(body.hour ?? 12);
  let minute = Number(body.minute ?? 0);
  let gender = body.gender === 'F' ? 'F' : 'M';
  let isLunar = Boolean(body.isLunar);
  let isLeapMonth = Boolean(body.isLeapMonth);
  let ziHourRule = body.ziHourRule === 'next_day' ? 'next_day' : 'early_late';
  let leapMonthRule = body.leapMonthRule === 'current' || body.leapMonthRule === 'next' ? body.leapMonthRule : 'mid_month';

  let isDemo = false;

  // 若未傳遞參數，嘗試從當前登入者 Profile 載入，否則給予預設示範值
  if (!year || !month || !day) {
    const profile = req.user?.id ? get('SELECT * FROM user_fortune_profiles WHERE user_id = ?', req.user.id) : null;
    if (profile) {
      year = profile.birth_year;
      month = profile.birth_month;
      day = profile.birth_day;
      hour = profile.birth_hour;
      minute = profile.birth_minute;
      gender = profile.gender;
      isLunar = profile.calendar_type === 'lunar';
      isDemo = false;
    } else {
      year = 1996;
      month = 8;
      day = 18;
      hour = 10;
      minute = 0;
      isDemo = true;
    }
  }

  try {
    const chart = calculateZiweiChart({
      year,
      month,
      day,
      hour,
      minute,
      gender,
      isLunar,
      isLeapMonth,
      ziHourRule,
      leapMonthRule,
    });

    const targetYear = Number(body.targetYear) || new Date().getFullYear();
    const yearly = calculateYearlyFortune(chart, targetYear);
    const palaceInterpretations = analyzePalaceInterpretations(chart);

    res.json({
      ok: true,
      isDemo,
      demoNotice: isDemo ? '此為示範命盤（預設生辰 1996-08-18 10:00），請輸入您的真實生辰八字以排定個人命盤' : null,
      chart,
      yearly,
      palaceInterpretations,
    });
  } catch (err) {
    res.status(500).json({ error: `紫微排盤計算異常: ${err.message}` });
  }
});

/**
 * GET /api/fortune/ziwei/yearly
 * 指定年份之流年運勢切換
 */
router.get('/ziwei/yearly', A.attachUser, (req, res) => {
  const targetYear = Number(req.query.year) || new Date().getFullYear();
  let isDemo = (!req.query.birthYear || !req.query.birthMonth || !req.query.birthDay);
  let year = Number(req.query.birthYear);
  let month = Number(req.query.birthMonth);
  let day = Number(req.query.birthDay);
  let hour = Number(req.query.birthHour ?? 12);
  let minute = Number(req.query.birthMinute ?? 0);
  let gender = req.query.gender === 'F' ? 'F' : 'M';
  let isLunar = req.query.isLunar === 'true' || req.query.isLunar === '1';
  let isLeapMonth = req.query.isLeapMonth === 'true' || req.query.isLeapMonth === '1';
  let ziHourRule = req.query.ziHourRule === 'next_day' ? 'next_day' : 'early_late';
  let leapMonthRule = req.query.leapMonthRule === 'current' || req.query.leapMonthRule === 'next' ? req.query.leapMonthRule : 'mid_month';

  if (!year || !month || !day) {
    const profile = req.user?.id ? get('SELECT * FROM user_fortune_profiles WHERE user_id = ?', req.user.id) : null;
    if (profile) {
      year = profile.birth_year;
      month = profile.birth_month;
      day = profile.birth_day;
      hour = profile.birth_hour;
      minute = profile.birth_minute;
      gender = profile.gender;
      isLunar = profile.calendar_type === 'lunar';
      isDemo = false;
    } else {
      year = 1996;
      month = 8;
      day = 18;
      hour = 10;
      minute = 0;
      isDemo = true;
    }
  }

  try {
    const chart = calculateZiweiChart({ year, month, day, hour, minute, gender, isLunar, isLeapMonth, ziHourRule, leapMonthRule });
    const yearly = calculateYearlyFortune(chart, targetYear);
    res.json({ ok: true, isDemo, yearly });
  } catch (err) {
    res.status(500).json({ error: `流年推算異常: ${err.message}` });
  }
});

// 雙人合盤簡易滑動視窗速率限制（每帳號每分鐘最多 30 次）
const compatibilityRateBuckets = new Map();
function checkCompatibilityRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 30;
  const key = String(userId);
  const timestamps = (compatibilityRateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= maxRequests) {
    compatibilityRateBuckets.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  compatibilityRateBuckets.set(key, timestamps);
  return true;
}

/**
 * POST /api/fortune/ziwei/compatibility
 * 計算紫微斗數雙人合盤（A→B / B→A 雙向比對，即時計算不落盤，嚴禁讀取第三人資料）
 */
router.post('/ziwei/compatibility', A.requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');

  if (!checkCompatibilityRateLimit(req.user.id)) {
    return res.status(429).json({
      ok: false,
      code: 'RATE_LIMIT_EXCEEDED',
      error: '請求過於頻繁，請稍後再試',
    });
  }

  const body = req.body || {};
  const rawPersons = Array.isArray(body.persons) ? body.persons : [];

  // 僅允許當事人本人（key='A' 且明確要求 useMyProfile=true）帶入自己的個人檔案，嚴禁以任意 userId 查詢第三人
  const hydratedPersons = rawPersons.map((p, idx) => {
    if (!p || typeof p !== 'object') return p;
    const sanitized = { ...p };
    delete sanitized.userId;
    delete sanitized.targetUserId;
    delete sanitized.charts;
    delete sanitized.palaces;

    if (sanitized.useMyProfile === true && (sanitized.key === 'A' || idx === 0)) {
      const profile = get('SELECT * FROM user_fortune_profiles WHERE user_id = ?', req.user.id);
      if (!profile) {
        return { __missingMyProfile: true, key: sanitized.key || 'A' };
      }
      const dateStr = `${String(profile.birth_year).padStart(4, '0')}-${String(profile.birth_month).padStart(2, '0')}-${String(profile.birth_day).padStart(2, '0')}`;
      const timeStr = `${String(profile.birth_hour).padStart(2, '0')}:${String(profile.birth_minute || 0).padStart(2, '0')}`;
      return {
        key: 'A',
        nickname: sanitized.nickname || req.user.display_name || req.user.username || '',
        calendar: profile.calendar_type === 'lunar' ? 'lunar' : 'solar',
        date: dateStr,
        isLeapMonth: Boolean(profile.is_leap_month),
        time: timeStr,
        timePrecision: 'minute',
        timeZone: 'Asia/Taipei',
        chartSex: profile.gender === 'F' ? 'F' : 'M',
      };
    }
    return sanitized;
  });

  const missingProfilePerson = hydratedPersons.find((p) => p && p.__missingMyProfile);
  if (missingProfilePerson) {
    return res.status(400).json({
      ok: false,
      code: 'MY_PROFILE_NOT_FOUND',
      error: '尚未設定您的個人生辰檔案，請先手動輸入或至個人生辰設定儲存',
      details: { personKey: missingProfilePerson.key },
    });
  }

  try {
    const result = calculateZiweiCompatibility({
      persons: hydratedPersons,
      rulesetId: body.rulesetId || 'ziwei-compatibility-v1',
    });
    return res.json(result);
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({
      ok: false,
      code: err.code || 'COMPATIBILITY_CALCULATION_ERROR',
      error: err.message,
      details: err.details || {},
    });
  }
});

/**
 * POST /api/fortune/astrology/natal
 * 計算西洋本命天宮星盤
 */
router.post('/astrology/natal', A.attachUser, (req, res) => {
  const body = req.body || {};
  let year = Number(body.year);
  let month = Number(body.month);
  let day = Number(body.day);
  let hour = Number(body.hour ?? 12);
  let minute = Number(body.minute ?? 0);
  let lat = Number(body.lat ?? 25.0330);
  let lng = Number(body.lng ?? 121.5654);
  let city = body.city || 'Taipei';
  let tz = Number(body.tz ?? 8);
  let houseSystem = body.houseSystem === 'whole_sign' ? 'whole_sign' : 'equal';

  if (!year || !month || !day) {
    const profile = req.user?.id ? get('SELECT * FROM user_fortune_profiles WHERE user_id = ?', req.user.id) : null;
    if (profile) {
      year = profile.birth_year;
      month = profile.birth_month;
      day = profile.birth_day;
      hour = profile.birth_hour;
      minute = profile.birth_minute;
      lat = profile.latitude || 25.0330;
      lng = profile.longitude || 121.5654;
      city = profile.city || 'Taipei';
    } else {
      year = 1996;
      month = 8;
      day = 18;
      hour = 10;
      minute = 0;
    }
  }

  try {
    const natal = calculateNatalChart({ year, month, day, hour, minute, lat, lng, city, tz, houseSystem });
    res.json({ ok: true, natal });
  } catch (err) {
    res.status(500).json({ error: `星盤運算異常: ${err.message}` });
  }
});

/**
 * GET /api/fortune/astrology/transit
 * 取得當前實時天象與水星逆行監測
 */
router.get('/astrology/transit', (req, res) => {
  try {
    const now = new Date();
    const transitChart = calculateNatalChart({
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      tz: 0,
      city: 'UTC Ground',
    });
    const retrograde = checkMercuryRetrograde(now);

    res.json({
      ok: true,
      transit: transitChart,
      retrograde,
    });
  } catch (err) {
    res.status(500).json({ error: `即時天象計算異常: ${err.message}` });
  }
});

// ==================================================================
// 6. 台灣傳統靈籤 (媽祖六十甲子籤) API
// ==================================================================

/**
 * GET /api/fortune/oracle/collections
 * 取得支援的籤系列表
 */
router.get('/oracle/collections', (req, res) => {
  try {
    const collections = getOracleCollections();
    res.json({ ok: true, collections });
  } catch (err) {
    res.status(500).json({ error: `取得籤系列表失敗: ${err.message}` });
  }
});

/**
 * GET /api/fortune/oracle/collections/:id/lots
 * 取得指定籤系之簡明清單 (供前端選號盤或速覽)
 */
router.get('/oracle/collections/:id/lots', (req, res) => {
  try {
    const collection = getOracleManifest(req.params.id);
    const lots = listOracleLots(req.params.id);
    res.json({ ok: true, collection, lots });
  } catch (err) {
    res.status(404).json({ error: `取得籤號清單失敗: ${err.message}` });
  }
});

/**
 * GET /api/fortune/oracle/collections/:id/lots/:number
 * 依籤號查籤 (取得單首完整籤文、白話解讀、分項指引)
 */
router.get('/oracle/collections/:id/lots/:number', (req, res) => {
  try {
    const lot = getOracleLot(req.params.number, req.params.id);
    res.json({ ok: true, lot });
  } catch (err) {
    res.status(404).json({ error: `查籤失敗: ${err.message}` });
  }
});

/**
 * POST /api/fortune/oracle/draw
 * 執行直接抽籤 (後端 crypto.randomInt 真隨機等機率取籤)
 */
router.post('/oracle/draw', A.attachUser, (req, res) => {
  const { collectionId = 'mazu_60_jiazi', topic = 'general', question = '' } = req.body || {};
  try {
    const result = drawOracleLot({ collectionId, topic, question });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: `抽籤執行異常: ${err.message}` });
  }
});

// ==================================================================
// 個人求籤紀錄與印證筆記 (M2 Oracle Records & Notes API)
// ==================================================================

/**
 * GET /api/fortune/oracle/records/stats
 * 取得使用者的求籤統計指標
 */
router.get('/oracle/records/stats', A.requireAuth, (req, res) => {
  try {
    const stats = getOracleRecordStats(req.user.id);
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({ error: `取得求籤統計失敗: ${err.message}` });
  }
});

/**
 * GET /api/fortune/oracle/records
 * 查詢本人的求籤紀錄列表 (支援 topic, status 過濾與分頁)
 */
router.get('/oracle/records', A.requireAuth, (req, res) => {
  try {
    const { topic, status, limit, offset } = req.query;
    const result = listOracleRecords(req.user.id, { topic, status, limit, offset });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: `查詢求籤歷史失敗: ${err.message}` });
  }
});

/**
 * POST /api/fortune/oracle/records
 * 保存當前抽中之靈籤至個人收藏庫 (包含不可變快照與印證筆記)
 */
router.post('/oracle/records', A.requireAuth, (req, res) => {
  try {
    const record = saveOracleRecord(req.user.id, req.body);
    res.status(201).json({ ok: true, record });
  } catch (err) {
    res.status(400).json({ error: `保存求籤紀錄失敗: ${err.message}` });
  }
});

/**
 * GET /api/fortune/oracle/records/:id
 * 取得單筆求籤紀錄詳情
 */
router.get('/oracle/records/:id', A.requireAuth, (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const record = getOracleRecordById(req.params.id, req.user.id, isAdmin);
    res.json({ ok: true, record });
  } catch (err) {
    res.status(404).json({ error: `取得紀錄詳情失敗: ${err.message}` });
  }
});

/**
 * PUT /api/fortune/oracle/records/:id
 * 更新求籤紀錄之個人筆記或後續印證狀態
 */
router.put('/oracle/records/:id', A.requireAuth, (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const record = updateOracleRecord(req.params.id, req.user.id, req.body, isAdmin);
    res.json({ ok: true, record });
  } catch (err) {
    res.status(400).json({ error: `更新求籤紀錄失敗: ${err.message}` });
  }
});

/**
 * DELETE /api/fortune/oracle/records/:id
 * 刪除個人求籤紀錄
 */
router.delete('/oracle/records/:id', A.requireAuth, (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = deleteOracleRecord(req.params.id, req.user.id, isAdmin);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: `刪除求籤紀錄失敗: ${err.message}` });
  }
});

// ------------------------------------------------------------------
// 9. 塔羅占卜 (Tarot Readings & 78-Card RWS Library)
// ------------------------------------------------------------------

/**
 * GET /api/fortune/tarot/decks
 * 取得所有可用塔羅牌組清單
 */
router.get('/tarot/decks', (req, res) => {
  try {
    const decks = getTarotDecks();
    res.json({ ok: true, decks });
  } catch (err) {
    res.status(500).json({ error: `取得塔羅牌組失敗: ${err.message}` });
  }
});

/**
 * GET /api/fortune/tarot/decks/:id/cards
 * 取得指定牌組之 78 張完整圖鑑 (支援 arcana, suit 過濾)
 */
router.get('/tarot/decks/:id/cards', (req, res) => {
  try {
    const deckId = String(req.params.id || 'rws_standard').trim();
    const manifest = getTarotManifest(deckId);
    let cards = listTarotCards(deckId);
    if (req.query.arcana) {
      cards = cards.filter((c) => c.arcana === req.query.arcana);
    }
    if (req.query.suit) {
      cards = cards.filter((c) => c.suit === req.query.suit);
    }
    res.json({ ok: true, manifest, cards });
  } catch (err) {
    res.status(404).json({ error: `取得塔羅牌庫失敗: ${err.message}` });
  }
});

/**
 * GET /api/fortune/tarot/decks/:id/cards/:cardId
 * 取得單張塔羅牌之詳細釋義
 */
router.get('/tarot/decks/:id/cards/:cardId', (req, res) => {
  try {
    const deckId = String(req.params.id || 'rws_standard').trim();
    const card = getTarotCard(req.params.cardId, deckId);
    res.json({ ok: true, card });
  } catch (err) {
    res.status(404).json({ error: `找不到塔羅牌: ${err.message}` });
  }
});

/**
 * GET /api/fortune/tarot/spreads
 * 取得支援的牌陣清單
 */
router.get('/tarot/spreads', (req, res) => {
  try {
    const deckId = String(req.query.deckId || 'rws_standard').trim();
    const spreads = getTarotSpreads(deckId);
    res.json({ ok: true, spreads });
  } catch (err) {
    res.status(404).json({ error: `取得牌陣設定失敗: ${err.message}` });
  }
});

/**
 * POST /api/fortune/tarot/readings
 * 建立新占卜會話並洗牌，回傳遮罩後的牌位 (不洩漏牌底)
 */
router.post('/tarot/readings', A.attachUser, (req, res) => {
  try {
    const body = req.body || {};
    const reading = createTarotReading({
      deckId: body.deckId || 'rws_standard',
      spreadId: body.spreadId || 'single',
      allowReversed: body.allowReversed !== false,
      topic: body.topic || 'general',
      question: body.question || '',
      userId: req.user ? req.user.id : null,
    });
    res.json({ ok: true, reading });
  } catch (err) {
    res.status(400).json({ error: `建立塔羅占卜失敗: ${err.message}` });
  }
});

/**
 * POST /api/fortune/tarot/readings/:id/reveal
 * 揭示單一牌位 (slotIndex) 或全部牌位 (revealAll: true)
 */
router.post('/tarot/readings/:id/reveal', A.attachUser, (req, res) => {
  try {
    const readingId = String(req.params.id || '').trim();
    const body = req.body || {};
    if (body.revealAll) {
      const result = revealAllTarotSlots({ readingId });
      return res.json({ ok: true, ...result });
    }
    if (body.slotIndex === undefined || body.slotIndex === null) {
      return res.status(400).json({ error: '缺少 slotIndex 參數' });
    }
    const result = revealTarotSlot({
      readingId,
      slotIndex: Number(body.slotIndex),
      requestId: body.requestId || '',
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ error: `翻開塔羅牌失敗: ${err.message}` });
  }
});

/**
 * GET /api/fortune/tarot/readings/:id
 * 查詢當前占卜進度
 */
router.get('/tarot/readings/:id', A.attachUser, (req, res) => {
  try {
    const reading = getTarotReading(String(req.params.id || '').trim());
    res.json({ ok: true, reading });
  } catch (err) {
    res.status(404).json({ error: `找不到占卜紀錄: ${err.message}` });
  }
});

module.exports = router;
