/**
 * server/lib/fortune-astro.js
 * 西洋天宮星盤地心黃道星曆引擎 (Natal & Transit Geocentric Ephemeris)
 * 包含太陽、月亮、水星等十大行星地心經緯度、順逆行判斷、ASC 上升點 / MC 天頂、
 * 12 宮位（Equal / Whole Sign）、五大相位幾何分析、水星逆行監測與個人星盤天賦
 * 零原生 C++ 編譯依賴，相容 Node.js 24 與跨平台伺服器環境 (Server TZ Independent)
 */

'use strict';

const ZODIAC_SIGNS = [
  { key: 'aries', name: '白羊座', en: 'Aries', symbol: '♈︎', element: '火', ruler: '火星', startDeg: 0 },
  { key: 'taurus', name: '金牛座', en: 'Taurus', symbol: '♉︎', element: '土', ruler: '金星', startDeg: 30 },
  { key: 'gemini', name: '雙子座', en: 'Gemini', symbol: '♊︎', element: '風', ruler: '水星', startDeg: 60 },
  { key: 'cancer', name: '巨蟹座', en: 'Cancer', symbol: '♋︎', element: '水', ruler: '月亮', startDeg: 90 },
  { key: 'leo', name: '獅子座', en: 'Leo', symbol: '♌︎', element: '火', ruler: '太陽', startDeg: 120 },
  { key: 'virgo', name: '處女座', en: 'Virgo', symbol: '♍︎', element: '土', ruler: '水星', startDeg: 150 },
  { key: 'libra', name: '天秤座', en: 'Libra', symbol: '♎︎', element: '風', ruler: '金星', startDeg: 180 },
  { key: 'scorpio', name: '天蠍座', en: 'Scorpio', symbol: '♏︎', element: '水', ruler: '冥王星', startDeg: 210 },
  { key: 'sagittarius', name: '射手座', en: 'Sagittarius', symbol: '♐︎', element: '火', ruler: '木星', startDeg: 240 },
  { key: 'capricorn', name: '摩羯座', en: 'Capricorn', symbol: '♑︎', element: '土', ruler: '土星', startDeg: 270 },
  { key: 'aquarius', name: '水瓶座', en: 'Aquarius', symbol: '♒︎', element: '風', ruler: '天王星', startDeg: 300 },
  { key: 'pisces', name: '雙魚座', en: 'Pisces', symbol: '♓︎', element: '水', ruler: '海王星', startDeg: 330 },
];

const PLANET_METADATA = {
  sun: {
    name: '太陽',
    en: 'Sun',
    symbol: '☉',
    role: '核心追求與人生意志',
    keywords: '核心自我 · 生命意志 · 尊嚴原動力',
    keywordsEn: 'Core Will · Self Identity · Purpose',
    astroMeaning: '西洋占星中的核心星體，象徵個人的自我意識、生命目標、尊嚴展現與推動事物前進的原動力。',
    astroMeaningEn: 'Represents the core ego, life vitality, willpower, and personal mission in the world.',
  },
  moon: {
    name: '月亮',
    en: 'Moon',
    symbol: '☽',
    role: '內在情緒與直覺安全感',
    keywords: '直覺情緒 · 心理安全 · 潛意識習慣',
    keywordsEn: 'Intuition · Emotional Core · Subconscious',
    astroMeaning: '掌管個人潛意識、直覺反應、情感需求與安全感歸屬，反映面臨壓力時的本能應對。',
    astroMeaningEn: 'Governs subconscious habits, emotional security, intuition, and reflexive reactions to stress.',
  },
  mercury: {
    name: '水星',
    en: 'Mercury',
    symbol: '☿',
    role: '思考邏輯、學習敏銳度與表達溝通',
    keywords: '邏輯思維 · 資訊傳遞 · 分析學習',
    keywordsEn: 'Logic · Communication · Analytical Mind',
    astroMeaning: '掌管思維模式、邏輯推理、語言文字與資訊流通，決定分析問題與溝通協調的風格。',
    astroMeaningEn: 'Governs reasoning, communication, information processing, and problem-solving agility.',
  },
  venus: {
    name: '金星',
    en: 'Venus',
    symbol: '♀︎',
    role: '審美品味、戀愛相處與人際關係',
    keywords: '審美偏好 · 人際和諧 · 價值取向',
    keywordsEn: 'Aesthetics · Social Harmony · Values',
    astroMeaning: '掌管人際和諧、審美品味、合作意願與價值標準，體現追求優雅與美好事物的本能。',
    astroMeaningEn: 'Represents aesthetics, harmony, social relationships, and core appreciation of beauty and balance.',
  },
  mars: {
    name: '火星',
    en: 'Mars',
    symbol: '♂︎',
    role: '果斷行動力與迎難而上的衝勁',
    keywords: '行動魄力 · 競爭驅動 · 突破攻堅',
    keywordsEn: 'Drive · Action · Courage & Assertiveness',
    astroMeaning: '掌管行動力、勇氣決斷、主動開創與克服障礙的能量，是面對挑戰時的先鋒力量。',
    astroMeaningEn: 'Embodies physical energy, assertive drive, competitive spirit, and the capacity to take bold action.',
  },
  jupiter: {
    name: '木星',
    en: 'Jupiter',
    symbol: '♃',
    role: '眼界格局與升職加薪幸運星',
    keywords: '擴展願景 · 智慧機遇 · 樂觀包容',
    keywordsEn: 'Expansion · Wisdom · Fortune & Vision',
    astroMeaning: '占星傳統中的第一吉星，象徵視野拓展、哲學智慧、幸運機遇與對未來的樂觀信心。',
    astroMeaningEn: 'Known as the Greater Benefic, symbolizing expansion, philosophical wisdom, growth, and optimism.',
  },
  saturn: {
    name: '土星',
    en: 'Saturn',
    symbol: '♄',
    role: '自我紀律、責任承擔與穩健把關',
    keywords: '紀律規範 · 責任底線 · 長期沉澱',
    keywordsEn: 'Discipline · Responsibility · Structure',
    astroMeaning: '象徵規則邊界、長遠責任、自我約束與磨練，鍛造經得起時間考驗的深厚基石。',
    astroMeaningEn: 'Represents boundaries, endurance, realism, discipline, and building lasting resilient structures.',
  },
  uranus: {
    name: '天王星',
    en: 'Uranus',
    symbol: '♅',
    role: '革新靈感、打破常規與獨特原創力',
    keywords: '革新破局 · 科技原創 · 自由顛覆',
    keywordsEn: 'Innovation · Freedom · Paradigm Shifts',
    astroMeaning: '象徵打破常規的突破、革命性創新、科技顛覆與追求原創獨立的覺醒力量。',
    astroMeaningEn: 'Symbolizes disruptive innovation, freedom, sudden insights, and radical departures from tradition.',
  },
  neptune: {
    name: '海王星',
    en: 'Neptune',
    symbol: '♆',
    role: '藝術想像直覺與避免沉溺幻想',
    keywords: '抽象靈感 · 直覺想像 · 精神邊界',
    keywordsEn: 'Inspiration · Fluid Boundaries · Ideals',
    astroMeaning: '象徵高度抽象想像、無邊界共情、藝術直覺與超越物質框架的精神理想追求。',
    astroMeaningEn: 'Represents imagination, subtle intuition, dreams, idealism, and dissolving rigid boundaries.',
  },
  pluto: {
    name: '冥王星',
    en: 'Pluto',
    symbol: '♇',
    role: '徹底蛻變重生與強大自我療癒力',
    keywords: '深度轉化 · 浴火重生 · 極致洞察',
    keywordsEn: 'Transformation · Regeneration · Inner Power',
    astroMeaning: '象徵深層本質轉變、汰舊換新的重生、極致的意志力與洞察深淵的強大修復力。',
    astroMeaningEn: 'Signifies profound psychological transformation, regenerative power, depth, and cataclysmic renewal.',
  },
};

const HOUSE_METADATA = {
  1: {
    house: 1,
    name: '命宮',
    en: '1st House',
    theme: '自我認同與外在氣質',
    themeEn: 'Self & Persona',
    desc: '象徵個人的核心個性、外在生命力、第一印象與應對外界的生命濾鏡。',
    descEn: 'Represents personal identity, vitality, physical appearance, and initial approach to life.',
  },
  2: {
    house: 2,
    name: '財帛宮',
    en: '2nd House',
    theme: '個人資源與價值認同',
    themeEn: 'Resources & Self-Worth',
    desc: '象徵物質資產、金錢觀、個人才幹資源與內在自我價值感。',
    descEn: 'Governs material resources, personal finances, earned income, and inner sense of self-worth.',
  },
  3: {
    house: 3,
    name: '兄弟宮',
    en: '3rd House',
    theme: '思維交流與學習溝通',
    themeEn: 'Communication & Learning',
    desc: '象徵邏輯表達、短期學習、日常溝通協作與周遭環境互動。',
    descEn: 'Pertains to communication, short journeys, learning style, and daily mental exchanges.',
  },
  4: {
    house: 4,
    name: '田宅宮',
    en: '4th House',
    theme: '內在安全感與家庭根基',
    themeEn: 'Roots & Foundations',
    desc: '象徵心理基石、歸屬感、原生家庭以及內在最私密的安全感來源。',
    descEn: 'Embodies home, ancestral roots, emotional foundations, and private inner sanctuary.',
  },
  5: {
    house: 5,
    name: '男女宮',
    en: '5th House',
    theme: '創造表達與熱情展現',
    themeEn: 'Creativity & Joy',
    desc: '象徵自發創造力、玩心樂趣、才華表現與個人熱情投入之處。',
    descEn: 'Represents creative self-expression, hobbies, romance, playfulness, and personal spark.',
  },
  6: {
    house: 6,
    name: '奴僕宮',
    en: '6th House',
    theme: '日常工作與健康條理',
    themeEn: 'Work Craft & Routine',
    desc: '象徵日常工作習慣、服務奉獻、生活條理性與身心健康維護。',
    descEn: 'Governs day-to-day workflow, attention to detail, service, physical health, and self-care routines.',
  },
  7: {
    house: 7,
    name: '夫妻宮',
    en: '7th House',
    theme: '合作夥伴與一對一關係',
    themeEn: 'Partnerships & Balance',
    desc: '象徵一對一合作盟友、婚姻與契約關係、事業結盟與對等協商模式。',
    descEn: 'Signifies one-on-one partnerships, business alliances, balance, and committed collaborations.',
  },
  8: {
    house: 8,
    name: '疾厄宮',
    en: '8th House',
    theme: '深度轉化與共有資源',
    themeEn: 'Transformation & Shared Assets',
    desc: '象徵深層信任、共有資源整合、危機因應與徹底蛻變重生的力量。',
    descEn: 'Involves deep psychological transformation, joint resources, crisis management, and rebirth.',
  },
  9: {
    house: 9,
    name: '遷移宮',
    en: '9th House',
    theme: '高階哲學與遠見探索',
    themeEn: 'Higher Vision & Philosophy',
    desc: '象徵高階思考、高等教育、遠行探索與追求宏觀智慧。',
    descEn: 'Encompasses higher education, philosophy, expanding worldviews, and forward-looking exploration.',
  },
  10: {
    house: 10,
    name: '官祿宮',
    en: '10th House',
    theme: '職業志向與公眾形象',
    themeEn: 'Career & Public Legacy',
    desc: '象徵長遠職業志業、公眾聲望、社會成就與專業影響力。',
    descEn: 'Represents career ambitions, public reputation, professional authority, and lasting impact.',
  },
  11: {
    house: 11,
    name: '福德宮',
    en: '11th House',
    theme: '社群願景與團隊協作',
    themeEn: 'Community & Team Ideals',
    desc: '象徵朋友社群、團隊願景、共同理想同盟與對未來的期待。',
    descEn: 'Governs community networks, group collaboration, shared ideals, and future aspirations.',
  },
  12: {
    house: 12,
    name: '相貌宮',
    en: '12th House',
    theme: '潛意識沈澱與靈性修復',
    themeEn: 'Subconscious & Renewal',
    desc: '象徵潛意識、幕後沈澱修復、直覺靈感與釋放過往心結。',
    descEn: 'Reflects the subconscious, solitude, healing, intuitive insights, and closing old cycles.',
  },
};

const ASPECT_TYPES = [
  { name: '合相', en: 'Conjunction', symbol: '☌', angle: 0, orb: 8, harmony: 'neutral', desc: '能量高度融合與放大', descEn: 'Energy fusion and concentrated magnification' },
  { name: '六分相', en: 'Sextile', symbol: '⚹', angle: 60, orb: 5, harmony: 'harmonious', desc: '協同順暢，易獲得靈感助力', descEn: 'Smooth synergy and creative opportunity' },
  { name: '四分相', en: 'Square', symbol: '□', angle: 90, orb: 7, harmony: 'challenging', desc: '挑戰與摩擦，需設好界線與分寸', descEn: 'Dynamic friction driving growth and boundaries' },
  { name: '三分相', en: 'Trine', symbol: '△', angle: 120, orb: 8, harmony: 'harmonious', desc: '天賦順遂，自然水到渠成', descEn: 'Harmonious flow and natural effortless talent' },
  { name: '對分相', en: 'Opposition', symbol: '☍', angle: 180, orb: 7, harmony: 'challenging', desc: '對峙與張力，需兼顧兩端平衡', descEn: 'Polarity tension requiring conscious balance' },
];

/**
 * 權威天文星曆水星逆行區間基準表 (2024 ~ 2027)
 * 基準來源：NASA JPL Horizons & Astronomical Ephemeris
 */
const MERCURY_RETROGRADE_PERIODS = [
  // 2024
  { start: '2024-04-01', end: '2024-04-25', sign: '白羊座', signEn: 'Aries' },
  { start: '2024-08-05', end: '2024-08-28', sign: '處女座/獅子座', signEn: 'Virgo/Leo' },
  { start: '2024-11-26', end: '2024-12-15', sign: '射手座', signEn: 'Sagittarius' },
  // 2025
  { start: '2025-03-15', end: '2025-04-07', sign: '白羊座/雙魚座', signEn: 'Aries/Pisces' },
  { start: '2025-07-18', end: '2025-08-11', sign: '獅子座', signEn: 'Leo' },
  { start: '2025-11-09', end: '2025-11-29', sign: '射手座/天蠍座', signEn: 'Sagittarius/Scorpio' },
  // 2026
  { start: '2026-02-26', end: '2026-03-20', sign: '雙魚座/水瓶座', signEn: 'Pisces/Aquarius' },
  { start: '2026-06-29', end: '2026-07-23', sign: '巨蟹座', signEn: 'Cancer' },
  { start: '2026-10-24', end: '2026-11-13', sign: '天蠍座', signEn: 'Scorpio' },
  // 2027
  { start: '2027-02-09', end: '2027-03-03', sign: '水瓶座', signEn: 'Aquarius' },
  { start: '2027-06-10', end: '2027-07-04', sign: '雙子座', signEn: 'Gemini' },
  { start: '2027-10-07', end: '2027-10-28', sign: '天秤座', signEn: 'Libra' },
];

/**
 * 角度與弧度輔助轉換函數
 */
const degToRad = (d) => (d * Math.PI) / 180;
const radToDeg = (r) => (r * 180) / Math.PI;
const norm360 = (d) => ((d % 360) + 360) % 360;

/**
 * 計算精確儒略日 (Julian Day)
 * 嚴格基於 UTC 日期時間計算，不受伺服器本機時區影響 (Server TZ Independent)
 * @param {Date} date
 * @returns {number}
 */
function getJulianDay(date) {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const utHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5 + (utHours / 24);
  return jd;
}

/**
 * 由指定出生時間與時區偏移植產出精確 UTC Date 物件
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 * @param {number} tzOffset
 * @returns {Date}
 */
function getUtcDate(year, month, day, hour = 12, minute = 0, tzOffset = 8) {
  const utcMs = Date.UTC(year, month - 1, day, hour - tzOffset, minute, 0);
  return new Date(utcMs);
}

/**
 * 計算太陽與地球日心座標 (J2000.0 Keplerian + Secular Terms)
 */
function getSunAndEarth(jd) {
  const d = jd - 2451545.0;
  const T = d / 36525.0;

  // 太陽平黃經 L0 與平近點角 M_sun
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * (T ** 2));
  const M_sun = norm360(357.52911 + 35999.05029 * T - 0.0001537 * (T ** 2));

  // 中心差修正 C_sun
  const C_sun = (1.914602 - 0.004817 * T - 0.000014 * (T ** 2)) * Math.sin(degToRad(M_sun)) +
                (0.019993 - 0.000101 * T) * Math.sin(degToRad(2 * M_sun)) +
                0.000289 * Math.sin(degToRad(3 * M_sun));

  const sunLon = norm360(L0 + C_sun);

  // 地球軌道離心率與日地距離 R_earth (AU)
  const e_earth = 0.0167086 - 0.000042037 * T - 0.0000001267 * (T ** 2);
  const trueAnomalySun = norm360(M_sun + C_sun);
  const R_earth = (1.000001018 * (1 - e_earth ** 2)) / (1 + e_earth * Math.cos(degToRad(trueAnomalySun)));

  // 地球日心黃經 (Sun Lon + 180°)
  const earthLon = norm360(sunLon + 180);
  const Xe = R_earth * Math.cos(degToRad(earthLon));
  const Ye = R_earth * Math.sin(degToRad(earthLon));

  return { sunLon, R_earth, Xe, Ye, T, d };
}

/**
 * 計算高精度月球地心黃經 (Brown 簡化月球運動理論 + 主要週期性攝動)
 */
function getMoonLongitude(jd, sunLon, T, d) {
  const L_moon = norm360(218.3164477 + 481267.88128 * T); // 平黃經
  const D_moon = norm360(297.8501921 + 445267.11140 * T); // 平距角 (Moon - Sun)
  const M_sun = norm360(357.5291092 + 35999.05029 * T);   // 太陽平近點角
  const M_moon = norm360(134.9633964 + 477198.86751 * T); // 月球平近點角
  const F_moon = norm360(93.2720950 + 483202.01752 * T);  // 升交點角距

  // 主要黃道經度攝動項 (Evection, Variation, Annual Equation, etc.)
  const pert = +6.288774 * Math.sin(degToRad(M_moon))
               + 1.274027 * Math.sin(degToRad(2 * D_moon - M_moon))
               + 0.658314 * Math.sin(degToRad(2 * D_moon))
               + 0.213618 * Math.sin(degToRad(2 * M_moon))
               - 0.185116 * Math.sin(degToRad(M_sun))
               - 0.114332 * Math.sin(degToRad(2 * F_moon))
               + 0.058793 * Math.sin(degToRad(2 * D_moon - 2 * M_moon))
               + 0.057066 * Math.sin(degToRad(2 * D_moon - M_sun - M_moon))
               + 0.053322 * Math.sin(degToRad(2 * D_moon + M_moon))
               + 0.046208 * Math.sin(degToRad(2 * D_moon - M_sun));

  return norm360(L_moon + pert);
}

/**
 * 八大行星軌道根數 (NASA JPL Keplerian Elements / Mean Elements of J2000)
 */
const PLANET_ORBITS = {
  mercury: { a: 0.38709893, e: 0.20563069, i: 7.00487, base: 252.25084, daily: 4.0923344368, perihelion: 77.45645, node: 48.33167 },
  venus:   { a: 0.72333199, e: 0.00677323, i: 3.39471, base: 181.97973, daily: 1.6021302244, perihelion: 131.53298, node: 76.68069 },
  mars:    { a: 1.52366231, e: 0.09341233, i: 1.85061, base: 355.43300, daily: 0.5240330350, perihelion: 336.04084, node: 49.55740 },
  jupiter: { a: 5.20336301, e: 0.04839266, i: 1.30530, base: 34.40438,  daily: 0.0830853001, perihelion: 14.75385,  node: 100.55615 },
  saturn:  { a: 9.53707032, e: 0.05415060, i: 2.48446, base: 49.94432,  daily: 0.0334442282, perihelion: 92.43194,  node: 113.71504 },
  uranus:  { a: 19.1912639, e: 0.04716771, i: 0.76986, base: 313.23218, daily: 0.0117258060, perihelion: 170.96424, node: 74.22988 },
  neptune: { a: 30.0689634, e: 0.00858587, i: 1.76917, base: 304.88003, daily: 0.0059951470, perihelion: 44.97135,  node: 131.72169 },
  pluto:   { a: 39.4816867, e: 0.24880766, i: 17.14175, base: 238.92881, daily: 0.0039757040, perihelion: 224.06676, node: 110.30347 },
};

/**
 * 依據儒略日推算特定行星之地心視黃經 (Geocentric Ecliptic Longitude)
 */
function getGeocentricPlanetLongitude(jd, planetKey) {
  const { sunLon, Xe, Ye, T, d } = getSunAndEarth(jd);

  if (planetKey === 'sun') {
    return sunLon;
  }
  if (planetKey === 'moon') {
    return getMoonLongitude(jd, sunLon, T, d);
  }

  const cfg = PLANET_ORBITS[planetKey];
  if (!cfg) return 0;

  // 1. 平近點角 M
  const L = norm360(cfg.base + cfg.daily * d);
  const M = norm360(L - cfg.perihelion);

  // 2. 中心差修正 C
  const C = (2 * cfg.e - (cfg.e ** 3) / 4) * Math.sin(degToRad(M)) +
            1.25 * (cfg.e ** 2) * Math.sin(degToRad(2 * M)) +
            (13 / 12) * (cfg.e ** 3) * Math.sin(degToRad(3 * M));

  // 3. 真近點角 nu 與軌道徑向半徑 r
  const nu = norm360(M + radToDeg(C));
  const r = (cfg.a * (1 - cfg.e ** 2)) / (1 + cfg.e * Math.cos(degToRad(nu)));

  // 4. 軌道平面日心座標轉換至黃道日心 3D 座標 (Xh, Yh, Zh)
  const u = degToRad(nu + cfg.perihelion - cfg.node);
  const nodeRad = degToRad(cfg.node);
  const iRad = degToRad(cfg.i);

  const Xh = r * (Math.cos(nodeRad) * Math.cos(u) - Math.sin(nodeRad) * Math.sin(u) * Math.cos(iRad));
  const Yh = r * (Math.sin(nodeRad) * Math.cos(u) + Math.cos(nodeRad) * Math.sin(u) * Math.cos(iRad));
  const Zh = r * (Math.sin(u) * Math.sin(iRad));

  // 5. 地心向量轉換 (Xg, Yg, Zg) = (Xh - Xe, Yh - Ye, Zh)
  const Xg = Xh - Xe;
  const Yg = Yh - Ye;

  // 地心視黃經
  const geoLon = norm360(radToDeg(Math.atan2(Yg, Xg)));
  return geoLon;
}

/**
 * 批量計算十大行星之地心黃道經度與角速度 (含順逆行偵測)
 * @param {Date} date
 * @returns {Record<string, { longitude: number, speed: number, isRetrograde: boolean, motion: string, motionSymbol: string }>}
 */
function calculatePlanetLongitudes(date) {
  const jd = getJulianDay(date);
  const jdPrev = jd - 0.5;
  const jdNext = jd + 0.5;

  const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const results = {};

  for (const key of planetKeys) {
    const lon = getGeocentricPlanetLongitude(jd, key);
    const lonPrev = getGeocentricPlanetLongitude(jdPrev, key);
    const lonNext = getGeocentricPlanetLongitude(jdNext, key);

    let speed = lonNext - lonPrev;
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;

    // 太陽與月亮永不逆行
    let isRetrograde = false;
    let motion = 'direct';
    let motionSymbol = '';

    if (key !== 'sun' && key !== 'moon') {
      if (speed < -0.0001) {
        isRetrograde = true;
        motion = 'retrograde';
        motionSymbol = '℞';
      } else if (Math.abs(speed) < 0.005) {
        motion = 'stationary';
        motionSymbol = 'S';
      }
    }

    results[key] = {
      longitude: lon,
      speed: Math.round(speed * 1000) / 1000,
      isRetrograde,
      motion,
      motionSymbol,
    };
  }

  return results;
}

/**
 * 檢查指定日期水星是否逆行 (Mercury Retrograde)
 * 結合精密日心-地心相對角速度計算與權威天文台公布之逆行週期表 (P3-4)
 * @param {Date} date
 * @returns {object}
 */
function checkMercuryRetrograde(date) {
  const jd = getJulianDay(date);
  const mercCurrent = getGeocentricPlanetLongitude(jd, 'mercury');
  const mercTomorrow = getGeocentricPlanetLongitude(jd + 1, 'mercury');

  let dailyDelta = mercTomorrow - mercCurrent;
  if (dailyDelta > 180) dailyDelta -= 360;
  if (dailyDelta < -180) dailyDelta += 360;

  // 格式化當前日期 YYYY-MM-DD
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  // 比對權威星曆資料表
  const matchedPeriod = MERCURY_RETROGRADE_PERIODS.find((p) => dateStr >= p.start && dateStr <= p.end);
  const isRetrograde = Boolean(matchedPeriod) || dailyDelta < -0.01;

  // 尋找下一次逆行週期
  const upcomingPeriod = MERCURY_RETROGRADE_PERIODS.find((p) => p.start > dateStr) || null;

  let daysUntilNext = null;
  if (upcomingPeriod) {
    const nextStart = new Date(`${upcomingPeriod.start}T00:00:00Z`);
    daysUntilNext = Math.ceil((nextStart.getTime() - date.getTime()) / 86400000);
  }

  // 陰影期判定 (逆行開始前或結束後 14 天內)
  let isInShadow = false;
  if (!isRetrograde && upcomingPeriod && daysUntilNext <= 14) {
    isInShadow = true;
  }

  let statusMessage = '';
  if (isRetrograde) {
    statusMessage = `🚨【水星逆行中 (${matchedPeriod ? matchedPeriod.sign : '雙魚/水瓶'})】簽約或做重大決定前務必再三確認細節、備份重要資料，留意溝通誤會與交通延誤！`;
  } else if (isInShadow) {
    statusMessage = `⚠️【水逆風暴前夕陰影期】距離下輪水逆僅剩 ${daysUntilNext} 天，建議把重要的簽約、採購與待辦事項提前完成，避免卡在水逆期間。`;
  } else {
    statusMessage = '✨【水星順行穩定】天體運行平穩順暢，思維敏銳邏輯清晰，極為適合溝通協調、簽約與規劃新計畫！';
  }

  return {
    isRetrograde,
    isInShadow,
    mercuryDailyMotion: Math.round(dailyDelta * 1000) / 1000,
    currentPeriod: matchedPeriod || null,
    nextPeriod: upcomingPeriod ? { ...upcomingPeriod, daysUntil: daysUntilNext } : null,
    statusMessage,
  };
}

/**
 * 計算星座、度數與顯示格式 (0~30 度)
 * @param {number} longitude
 * @returns {object}
 */
function getSignInfo(longitude) {
  const norm = norm360(longitude);
  const signIndex = Math.floor(norm / 30);
  const sign = ZODIAC_SIGNS[signIndex];
  const degreeInSign = norm % 30;
  const degInt = Math.floor(degreeInSign);
  const minInt = Math.floor((degreeInSign - degInt) * 60);

  return {
    longitude: norm,
    signKey: sign.key,
    signName: sign.name,
    signEn: sign.en,
    symbol: sign.symbol,
    element: sign.element,
    ruler: sign.ruler,
    degreeInSign: Math.round(degreeInSign * 100) / 100,
    displayDeg: `${degInt}° ${String(minInt).padStart(2, '0')}'`,
  };
}

/**
 * 計算宮位系統 (Ascendant 上升點、Midheaven 天頂與 12 宮位)
 * 支援 Equal House (等宮制) 與 Whole Sign (整宮制) 雙模式
 * @param {Date} date
 * @param {number} lat
 * @param {number} lng
 * @param {'equal'|'whole_sign'} [system='equal']
 * @returns {object}
 */
function calculateHouses(date, lat = 25.0330, lng = 121.5654, system = 'equal') {
  const jd = getJulianDay(date);
  const T = (jd - 2451545.0) / 36525.0;

  // 格林威治平恆星時 (GMST)
  const gmst = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * (T ** 2) - (T ** 3) / 38710000);
  const localSiderealTime = norm360(gmst + lng);
  const ramc = degToRad(localSiderealTime);
  const eps = degToRad(23.4392911 - 0.0130042 * T); // 精確黃赤交角
  const phi = degToRad(lat);

  // 天頂 MC 計算：tan(MC) = tan(RAMC) / cos(eps)
  const mcRad = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
  const mcDeg = norm360(radToDeg(mcRad));

  // 上升點 ASC 計算：tan(ASC) = cos(RAMC) / (-sin(RAMC)*cos(eps) - tan(phi)*sin(eps))
  const ascY = Math.cos(ramc);
  const ascX = -Math.sin(ramc) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps);
  const ascRad = Math.atan2(ascY, ascX);
  const ascDeg = norm360(radToDeg(ascRad));

  // 12 宮位推算
  const houses = [];
  const baseDeg = system === 'whole_sign' ? Math.floor(ascDeg / 30) * 30 : ascDeg;

  for (let i = 0; i < 12; i++) {
    const cuspLon = norm360(baseDeg + i * 30);
    const signInfo = getSignInfo(cuspLon);
    const houseMeta = HOUSE_METADATA[i + 1] || {};

    houses.push({
      house: i + 1,
      cuspLongitude: cuspLon,
      sign: signInfo.signName,
      signKey: signInfo.signKey,
      signEn: signInfo.signEn,
      signSymbol: signInfo.symbol,
      displayDeg: signInfo.displayDeg,
      name: houseMeta.name || `第 ${i + 1} 宮`,
      en: houseMeta.en || `${i + 1}th House`,
      theme: houseMeta.theme || '',
      themeEn: houseMeta.themeEn || '',
      desc: houseMeta.desc || '',
      descEn: houseMeta.descEn || '',
    });
  }

  return {
    asc: getSignInfo(ascDeg),
    mc: getSignInfo(mcDeg),
    houses,
    houseSystem: system,
    localSiderealTime: Math.round(localSiderealTime * 100) / 100,
  };
}

/**
 * 計算兩天體之間的相位交角 (Major Aspects)
 * @param {Record<string, object>} planetsWithPos
 * @returns {Array<object>}
 */
function calculateAspects(planetsWithPos) {
  const items = Object.entries(planetsWithPos);
  const aspects = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const [key1, p1] = items[i];
      const [key2, p2] = items[j];

      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const aspectCfg of ASPECT_TYPES) {
        const orbDist = Math.abs(diff - aspectCfg.angle);
        if (orbDist <= aspectCfg.orb) {
          aspects.push({
            p1Key: key1,
            p1Name: p1.name,
            p1Symbol: p1.planetSymbol || p1.symbol,
            p2Key: key2,
            p2Name: p2.name,
            p2Symbol: p2.planetSymbol || p2.symbol,
            aspectName: aspectCfg.name,
            aspectEn: aspectCfg.en,
            aspectSymbol: aspectCfg.symbol,
            aspectAngle: aspectCfg.angle,
            exactOrb: Math.round(orbDist * 10) / 10,
            harmony: aspectCfg.harmony,
            desc: aspectCfg.desc,
            descEn: aspectCfg.descEn,
          });
          break;
        }
      }
    }
  }

  return aspects;
}

/**
 * 產生個人西洋星盤資料 (Natal Chart - P3 西洋星盤核心計算引擎)
 * 嚴格保持伺服器時區獨立性 (Server TZ Independent)，支援完整經緯度、城市、時區與宮位自訂
 * @param {object} options
 * @param {number} options.year
 * @param {number} options.month
 * @param {number} options.day
 * @param {number} [options.hour=12]
 * @param {number} [options.minute=0]
 * @param {number} [options.tz=8]
 * @param {number} [options.lat=25.0330]
 * @param {number} [options.lng=121.5654]
 * @param {string} [options.city='Taipei']
 * @param {'equal'|'whole_sign'} [options.houseSystem='equal']
 * @returns {object}
 */
function calculateNatalChart(options = {}) {
  const {
    year,
    month,
    day,
    hour = 12,
    minute = 0,
    tz = 8,
    lat = 25.0330,
    lng = 121.5654,
    city = 'Taipei',
    houseSystem = 'equal',
  } = options;

  // 嚴格透過 UTC 基準構造 Date，確保跨伺服器 TZ 結果 100% 一致 (P3-1 & P3-4)
  const utcDate = getUtcDate(year, month, day, hour, minute, tz);
  const planetPositions = calculatePlanetLongitudes(utcDate);
  const houseData = calculateHouses(utcDate, lat, lng, houseSystem);

  // 組織各行星落點
  const planets = {};
  for (const [key, pPos] of Object.entries(planetPositions)) {
    const meta = PLANET_METADATA[key] || { name: key, symbol: '★', role: '行星' };
    const signInfo = getSignInfo(pPos.longitude);

    // 判斷落入第幾宮 (1~12)
    let houseNum = 1;
    for (let h = 0; h < 12; h++) {
      const nextH = (h + 1) % 12;
      const start = houseData.houses[h].cuspLongitude;
      const end = houseData.houses[nextH].cuspLongitude;
      let inHouse = false;
      if (start < end) {
        inHouse = pPos.longitude >= start && pPos.longitude < end;
      } else {
        inHouse = pPos.longitude >= start || pPos.longitude < end;
      }
      if (inHouse) {
        houseNum = h + 1;
        break;
      }
    }

    const houseMeta = HOUSE_METADATA[houseNum] || {};

    planets[key] = {
      key,
      name: meta.name,
      en: meta.en,
      planetSymbol: meta.symbol,
      symbol: meta.symbol,
      role: meta.role,
      keywords: meta.keywords,
      keywordsEn: meta.keywordsEn,
      astroMeaning: meta.astroMeaning,
      astroMeaningEn: meta.astroMeaningEn,
      house: houseNum,
      houseName: houseMeta.name,
      houseEn: houseMeta.en,
      houseTheme: houseMeta.theme,
      houseThemeEn: houseMeta.themeEn,
      houseDesc: houseMeta.desc,
      houseDescEn: houseMeta.descEn,
      ...signInfo,
      signSymbol: signInfo.symbol,
      speed: pPos.speed,
      isRetrograde: pPos.isRetrograde,
      motion: pPos.motion,
      motionSymbol: pPos.motionSymbol,
    };
  }

  const aspects = calculateAspects(planets);

  // 為每顆行星附加上關聯相位清單，供浮窗與輪盤雙向交互直接存取 (P4)
  for (const [key, planet] of Object.entries(planets)) {
    planet.aspects = aspects
      .filter((asp) => asp.p1Key === key || asp.p2Key === key)
      .map((asp) => {
        const isP1 = asp.p1Key === key;
        const otherKey = isP1 ? asp.p2Key : asp.p1Key;
        const otherPlanet = planets[otherKey];
        return {
          otherKey,
          otherName: otherPlanet?.name || otherKey,
          otherEn: otherPlanet?.en || otherKey,
          otherSymbol: otherPlanet?.planetSymbol || otherPlanet?.symbol || '★',
          aspectName: asp.aspectName,
          aspectEn: asp.aspectEn,
          aspectSymbol: asp.aspectSymbol,
          aspectAngle: asp.aspectAngle,
          exactOrb: asp.exactOrb,
          harmony: asp.harmony,
          desc: asp.desc,
          descEn: asp.descEn,
        };
      });
  }

  const retrogradeInfo = checkMercuryRetrograde(utcDate);

  // 生成個人專屬星盤天賦點評
  const sunSign = planets.sun.signName;
  const mercSign = planets.mercury.signName;
  const marsSign = planets.mars.signName;
  const mercRetroNote = planets.mercury.isRetrograde ? ' (出生時逢水逆，具備深度反思與逆向思考特質)' : '';

  const engineerHighlights = [
    {
      title: `核心人生態度：太陽落【${sunSign}】`,
      desc: `具備【${sunSign}】的堅韌思維，在面對人生轉折與重大抉擇時能堅守原則，重視生活品質與長遠發展。`,
    },
    {
      title: `思考與溝通天賦：水星落【${mercSign}】${mercRetroNote}`,
      desc: `思考邏輯深受【${mercSign}】賦能，學習吸收新知時細膩扎實，與家人、朋友或同事溝通時條理分明。`,
    },
    {
      title: `臨危應變衝鋒力：火星落【${marsSign}】`,
      desc: `遇到突發狀況時【${marsSign}】冷靜果斷，能迅速釐清來龍去脈、找出問題癥結，處理事情一針見血。`,
    },
  ];

  return {
    chartType: 'natal',
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    city,
    lat,
    lng,
    tz,
    engineVersion: '2026.3-geocentric',
    houseSystem,
    asc: houseData.asc,
    mc: houseData.mc,
    houses: houseData.houses,
    planets,
    aspects,
    retrogradeInfo,
    engineerHighlights,
    houseMetadata: HOUSE_METADATA,
    aspectMetadata: ASPECT_TYPES,
  };
}

module.exports = {
  ZODIAC_SIGNS,
  PLANET_METADATA,
  HOUSE_METADATA,
  ASPECT_TYPES,
  MERCURY_RETROGRADE_PERIODS,
  calculatePlanetLongitudes,
  checkMercuryRetrograde,
  calculateNatalChart,
  calculateHouses,
  getJulianDay,
  getSignInfo,
};
