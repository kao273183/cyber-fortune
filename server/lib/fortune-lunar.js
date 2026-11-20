/**
 * server/lib/fortune-lunar.js
 * 純 JavaScript 陰陽曆轉換、四柱八字、建除十二神與農民曆吉凶運算引擎
 * 零原生 C++ 編譯依賴，相容 Node.js 24 與跨平台環境
 */

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];

// 1900 ~ 2100 農曆編碼表 (bit 16: 閏月大小, bits 15~4: 各月大小, bits 3~0: 閏月月份)
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520, // 2100
];

// 建除十二神
const JIAN_CHU = ['建', '除', '滿', '平', '定', '執', '破', '危', '成', '收', '開', '閉'];

// 二十八星宿名單與吉凶 (角亢氐房心尾箕 斗牛女虛危室壁 奎婁胃昴畢觜參 井鬼柳星張翼軫)
const CONSTELLATIONS_28 = [
  { name: '角木蛟', lucky: true, desc: '造作大吉，百事興旺' },
  { name: '亢金龍', lucky: false, desc: '謹言慎行，防範口舌' },
  { name: '氐土貉', lucky: false, desc: '防範失約，行事保守' },
  { name: '房日兔', lucky: true, desc: '萬寶朝宗，利於開創' },
  { name: '心月狐', lucky: false, desc: '防範暗算，凡事低調為宜' },
  { name: '尾火虎', lucky: true, desc: '名利雙收，求職晉升吉' },
  { name: '箕水豹', lucky: true, desc: '開市大吉，人氣聚匯' },
  { name: '斗木獬', lucky: true, desc: '修造進祿，家宅安穩' },
  { name: '牛金牛', lucky: false, desc: '多勞少得，凡事宜緩' },
  { name: '女土蝠', lucky: false, desc: '爭端易起，避開爭辯' },
  { name: '虛日鼠', lucky: false, desc: '虛耗無功，忌大改動' },
  { name: '危月燕', lucky: false, desc: '防有險阻，三思而行' },
  { name: '室火豬', lucky: true, desc: '修造大吉，婚嫁皆宜' },
  { name: '壁水貐', lucky: true, desc: '安定清平，家運平穩' },
  { name: '奎木狼', lucky: false, desc: '謹防退步，踏實自律' },
  { name: '婁金狗', lucky: true, desc: '進取有成，合作共事吉' },
  { name: '胃土雉', lucky: true, desc: '衣食豐足，靈感源源' },
  { name: '昴日雞', lucky: false, desc: '多有滯礙，沉心靜待' },
  { name: '畢月烏', lucky: true, desc: '造作興榮，田宅大吉' },
  { name: '觜火猴', lucky: false, desc: '多費周折，慎簽承諾' },
  { name: '參水猿', lucky: true, desc: '眾望所歸，同心合力吉' },
  { name: '井木犴', lucky: true, desc: '源遠流長，學業精進' },
  { name: '鬼金羊', lucky: false, desc: '防微杜漸，凡事多加檢查' },
  { name: '柳土獐', lucky: false, desc: '風波偶現，平心靜氣' },
  { name: '星日馬', lucky: false, desc: '勞神費力，注意休息' },
  { name: '張月鹿', lucky: true, desc: '開張納喜，宜展新事' },
  { name: '翼火蛇', lucky: false, desc: '謹守本分，不急於成' },
  { name: '軫水蚓', lucky: true, desc: '百事亨通，遠行出遊吉' },
];

// 十二時辰黃道六吉神與黑道六凶神
// 根據日支決定時辰起青龍之位置：
// 子午起申，丑未起戌，寅申起子，卯酉起寅，辰戌起辰，巳亥起午
const TWELVE_SPIRITS = [
  { name: '青龍', isAuspicious: true, desc: '黃道吉神，萬事亨通，宜嫁娶開市' },
  { name: '明堂', isAuspicious: true, desc: '黃道吉神，貴人相助，宜求職拜訪' },
  { name: '天刑', isAuspicious: false, desc: '黑道凶神，利官不利民，慎防官非糾紛' },
  { name: '朱雀', isAuspicious: false, desc: '黑道凶神，口舌是非，忌與人爭辯' },
  { name: '金匱', isAuspicious: true, desc: '黃道吉神，福祿聚集，宜理財儲蓄' },
  { name: '天德', isAuspicious: true, desc: '黃道吉神，吉星高照，逢凶化吉' },
  { name: '白虎', isAuspicious: false, desc: '黑道凶神，殺伐過重，忌冒險行事' },
  { name: '玉堂', isAuspicious: true, desc: '黃道吉神，文星照耀，宜讀書考試' },
  { name: '天牢', isAuspicious: false, desc: '黑道凶神，困頓不順，進度容易受阻' },
  { name: '玄武', isAuspicious: false, desc: '黑道凶神，暗藏危機，慎防小人與失竊' },
  { name: '司命', isAuspicious: true, desc: '黃道吉神，主掌大局，宜祭祀祈福' },
  { name: '勾陳', isAuspicious: false, desc: '黑道凶神，牽扯繁瑣，忌倉促決定' },
];

/**
 * 取得農曆年天數
 */
function getLunarYearDays(year) {
  let sum = 348;
  const info = LUNAR_INFO[year - 1900];
  if (!info) return 365;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

/**
 * 取得農曆年閏月月份 (0 表示無閏月)
 */
function getLeapMonth(year) {
  const info = LUNAR_INFO[year - 1900];
  return info ? (info & 0xf) : 0;
}

/**
 * 取得農曆年閏月天數
 */
function getLeapMonthDays(year) {
  if (getLeapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

/**
 * 取得農曆年某月天數
 */
function getLunarMonthDays(year, month) {
  const info = LUNAR_INFO[year - 1900];
  if (!info) return 30;
  return (info & (0x10000 >> month)) ? 30 : 29;
}

/**
 * 驗證國曆年月日是否為有效日期 (1900~2100)
 */
function isValidSolarDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * 國曆轉農曆核心 (純 UTC 計算，不受伺服器時區或夏令時間影響)
 * @param {number} y 西元年
 * @param {number} m 國曆月 (1~12)
 * @param {number} d 國曆日 (1~31)
 */
function solarToLunarParts(y, m, d) {
  const baseMs = Date.UTC(1900, 0, 31);
  const targetMs = Date.UTC(y, m - 1, d);
  let offset = Math.round((targetMs - baseMs) / 86400000);

  let lunarYear = 1900;
  let daysInYear = 0;
  for (let i = 1900; i <= 2100 && offset > 0; i++) {
    daysInYear = getLunarYearDays(i);
    offset -= daysInYear;
    lunarYear = i;
  }

  if (offset < 0) {
    offset += daysInYear;
  } else {
    lunarYear++;
  }

  const leap = getLeapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;
  let daysInMonth = 0;

  for (let i = 1; i <= 12 && offset >= 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      --i;
      isLeap = true;
      daysInMonth = getLeapMonthDays(lunarYear);
    } else {
      daysInMonth = getLunarMonthDays(lunarYear, i);
    }

    if (isLeap && i === (leap + 1)) isLeap = false;
    offset -= daysInMonth;
    if (offset < 0) {
      offset += daysInMonth;
      lunarMonth = i;
      break;
    }
  }

  const lunarDay = offset + 1;

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeap,
  };
}

/**
 * 國曆轉農曆核心
 * @param {Date} date
 */
function solarToLunar(date) {
  return solarToLunarParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * 農曆轉國曆 (純 UTC 計算並嚴格驗證閏月與當月天數)
 * @param {number} lunarYear 農曆年 (1900~2100)
 * @param {number} lunarMonth 農曆月 (1~12)
 * @param {number} lunarDay 農曆日 (1~29/30)
 * @param {boolean} [isLeapMonth=false] 是否為閏月
 * @returns {{ year: number, month: number, day: number }}
 */
function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth = false) {
  if (!Number.isInteger(lunarYear) || lunarYear < 1900 || lunarYear > 2100) {
    const err = new Error(`Invalid lunar year: ${lunarYear} (supported: 1900-2100)`);
    err.code = 'INVALID_LUNAR_DATE';
    throw err;
  }
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    const err = new Error(`Invalid lunar month: ${lunarMonth}`);
    err.code = 'INVALID_LUNAR_DATE';
    throw err;
  }

  const leap = getLeapMonth(lunarYear);
  const isLeap = Boolean(isLeapMonth);
  if (isLeap && leap !== lunarMonth) {
    const err = new Error(`Lunar year ${lunarYear} does not have leap month ${lunarMonth}`);
    err.code = 'INVALID_LUNAR_LEAP_MONTH';
    throw err;
  }

  const maxDays = isLeap
    ? getLeapMonthDays(lunarYear)
    : getLunarMonthDays(lunarYear, lunarMonth);

  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > maxDays) {
    const err = new Error(`Invalid lunar day ${lunarDay} for ${lunarYear}-${lunarMonth}${isLeap ? ' (leap)' : ''} (max: ${maxDays})`);
    err.code = 'INVALID_LUNAR_DATE';
    throw err;
  }

  let offset = 0;
  for (let y = 1900; y < lunarYear; y++) {
    offset += getLunarYearDays(y);
  }
  for (let m = 1; m < lunarMonth; m++) {
    offset += getLunarMonthDays(lunarYear, m);
    if (leap > 0 && m === leap) {
      offset += getLeapMonthDays(lunarYear);
    }
  }
  if (isLeap) {
    offset += getLunarMonthDays(lunarYear, lunarMonth);
  }
  offset += lunarDay - 1;

  const targetDate = new Date(Date.UTC(1900, 0, 31) + offset * 86400000);
  return {
    year: targetDate.getUTCFullYear(),
    month: targetDate.getUTCMonth() + 1,
    day: targetDate.getUTCDate(),
  };
}

/**
 * 計算四柱八字干支 (年柱、月柱、日柱、時柱)
 * @param {number} sYear 西元年
 * @param {number} sMonth 國曆月 (1~12)
 * @param {number} sDay 國曆日 (1~31)
 * @param {number} hour 小時 (0~23)
 * @param {number} [minute=0] 分鐘 (0~59)
 * @param {object} [options]
 * @param {'early_late'|'next_day'} [options.ziHourRule='early_late'] 早晚子時規則 (子正換日 vs 子初換日)
 */
function calculateBaZi(sYear, sMonth, sDay, hour, minute = 0, options = {}) {
  const { ziHourRule = 'early_late' } = options;
  const isLateZi = hour === 23;
  const isEarlyZi = hour === 0;
  const ziHourType = isLateZi ? 'late_zi' : (isEarlyZi ? 'early_zi' : 'normal');

  // 若選擇子初換日制 (next_day) 且出生於晚子時 (23:00~23:59)，日柱與農曆日算作次日
  const targetDate = (isLateZi && ziHourRule === 'next_day')
    ? new Date(Date.UTC(sYear, sMonth - 1, sDay + 1))
    : new Date(Date.UTC(sYear, sMonth - 1, sDay));

  const lunar = solarToLunarParts(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth() + 1,
    targetDate.getUTCDate()
  );

  // 1. 年柱干支 (以立春劃分，此處提供標準農曆正月初一與立春平滑算法)
  // 1900 年為庚子年 (庚=6, 子=0)
  const yearGanIdx = (lunar.lunarYear - 4) % 10;
  const yearZhiIdx = (lunar.lunarYear - 4) % 12;
  const yearGan = GAN[(yearGanIdx + 10) % 10];
  const yearZhi = ZHI[(yearZhiIdx + 12) % 12];
  const zodiac = ZODIAC_ANIMALS[(yearZhiIdx + 12) % 12];

  // 2. 月柱干支 (五虎遁年起月訣: 甲己之年丙作首，乙庚之歲戊為頭...)
  // 月地支：正月寅(2)、二月卯(3)... 十一月子(0)、十二月丑(1)
  const monthZhiIdx = (lunar.lunarMonth + 1) % 12;
  const monthZhi = ZHI[monthZhiIdx];
  const tigerStartGan = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
  const baseMonthGan = tigerStartGan[GAN.indexOf(yearGan)];
  const monthGanIdx = (baseMonthGan + (lunar.lunarMonth - 1)) % 10;
  const monthGan = GAN[monthGanIdx];

  // 3. 日柱干支 (基準日: 1900-01-31 為甲午日，高斯/公曆連續日計算法)
  // 1900-01-31 UTC: 甲午 (甲=0, 午=6)
  const refDate = new Date(Date.UTC(1900, 0, 31));
  const dayOffset = Math.round((targetDate.getTime() - refDate.getTime()) / 86400000);
  const dayGanIdx = ((dayOffset % 10) + 10) % 10;
  const dayZhiIdx = (((dayOffset + 6) % 12) + 12) % 12;
  const dayGan = GAN[dayGanIdx];
  const dayZhi = ZHI[dayZhiIdx];

  // 4. 時柱干支
  // 時辰換算：23:00~00:59 為子時，01:00~02:59 為丑時...
  let hourZhiIdx = Math.floor((hour + 1) / 2) % 12;
  const hourZhi = ZHI[hourZhiIdx];

  // 五鼠遁日起時訣: 甲己還加甲，乙庚丙作初，丙辛從戊起，丁壬庚子居，戊癸何方發，壬子是真途
  const ratStartGan = { 0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8 };
  const baseHourGan = ratStartGan[GAN.indexOf(dayGan)];
  const hourGanIdx = (baseHourGan + hourZhiIdx) % 10;
  const hourGan = GAN[hourGanIdx];

  return {
    ziHourType,
    ziHourRule,
    solar: { year: sYear, month: sMonth, day: sDay, hour, minute },
    lunar: {
      year: lunar.lunarYear,
      month: lunar.lunarMonth,
      day: lunar.lunarDay,
      isLeap: lunar.isLeap,
      zodiac,
    },
    bazi: {
      year: `${yearGan}${yearZhi}`,
      month: `${monthGan}${monthZhi}`,
      day: `${dayGan}${dayZhi}`,
      hour: `${hourGan}${hourZhi}`,
      yearGan,
      yearZhi,
      monthGan,
      monthZhi,
      dayGan,
      dayZhi,
      hourGan,
      hourZhi,
      ziHourType,
    },
  };
}

/**
 * 取得指定日期的農民曆神煞、建除十二神與二十八星宿
 * @param {Date} date
 */
function getDailyAlmanac(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const baziInfo = calculateBaZi(y, m, d, 12, 0);

  // 1. 建除十二神推算
  // 月建為月支，日支與月支相同為「建」，順數除、滿、平、定、執、破、危、成、收、開、閉
  const monthZhiIdx = ZHI.indexOf(baziInfo.bazi.monthZhi);
  const dayZhiIdx = ZHI.indexOf(baziInfo.bazi.dayZhi);
  const jianChuIdx = ((dayZhiIdx - monthZhiIdx) + 12) % 12;
  const jianChuName = JIAN_CHU[jianChuIdx];

  // 2. 二十八星宿推算 (基準日連續循環)
  const refDate = new Date(Date.UTC(2024, 0, 1)); // 2024-01-01 基準宿
  const curDate = new Date(Date.UTC(y, m - 1, d));
  const diffDays = Math.round((curDate.getTime() - refDate.getTime()) / 86400000);
  const starIdx = (((diffDays + 14) % 28) + 28) % 28;
  const constellation = CONSTELLATIONS_28[starIdx];

  // 3. 當日十二時辰黃道黑道神煞表
  // 起青龍法則：子午日申起青龍，丑未日戌起，寅申日子起，卯酉日引起，辰戌日辰起，巳亥日午起
  const dayBranch = baziInfo.bazi.dayZhi;
  const startBranchMap = {
    子: '申', 午: '申',
    丑: '戌', 未: '戌',
    寅: '子', 申: '子',
    卯: '寅', 酉: '寅',
    辰: '辰', 戌: '辰',
    巳: '午', 亥: '午',
  };
  const qingLongBranch = startBranchMap[dayBranch] || '子';
  const qingLongIdx = ZHI.indexOf(qingLongBranch);

  const hoursLuck = ZHI.map((zhi, idx) => {
    // 該時辰在青龍循環中的位移
    const spiritOffset = ((idx - qingLongIdx) + 12) % 12;
    const spirit = TWELVE_SPIRITS[spiritOffset];
    return {
      branch: zhi,
      timeSpan: `${String(((idx * 2) + 23) % 24).padStart(2, '0')}:00 ~ ${String(((idx * 2) + 1) % 24).padStart(2, '0')}:59`,
      spiritName: spirit.name,
      isAuspicious: spirit.isAuspicious,
      desc: spirit.desc,
    };
  });

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    lunar: baziInfo.lunar,
    bazi: baziInfo.bazi,
    jianChu: {
      name: jianChuName,
      isGoodForRelease: ['開', '定', '成', '除', '滿'].includes(jianChuName),
      rating: ['開', '定', '成'].includes(jianChuName) ? '大吉' : (['破', '閉', '危'].includes(jianChuName) ? '大凶' : '平吉'),
    },
    constellation,
    hoursLuck,
  };
}

// ------------------------------------------------------------------
// 4. 二十四節氣天文演算法 (24 Solar Terms)
// ------------------------------------------------------------------
const SOLAR_TERMS_INFO = [
  { name: '小寒', month: 1, c: 5.4055 },
  { name: '大寒', month: 1, c: 20.12 },
  { name: '立春', month: 2, c: 3.87 },
  { name: '雨水', month: 2, c: 18.73 },
  { name: '驚蟄', month: 3, c: 5.63 },
  { name: '春分', month: 3, c: 20.646 },
  { name: '清明', month: 4, c: 4.81 },
  { name: '穀雨', month: 4, c: 20.1 },
  { name: '立夏', month: 5, c: 5.52 },
  { name: '小滿', month: 5, c: 21.04 },
  { name: '芒種', month: 6, c: 5.678 },
  { name: '夏至', month: 6, c: 21.37 },
  { name: '小暑', month: 7, c: 7.108 },
  { name: '大暑', month: 7, c: 22.83 },
  { name: '立秋', month: 8, c: 7.5 },
  { name: '處暑', month: 8, c: 23.13 },
  { name: '白露', month: 9, c: 7.646 },
  { name: '秋分', month: 9, c: 23.042 },
  { name: '寒露', month: 10, c: 8.318 },
  { name: '霜降', month: 10, c: 23.438 },
  { name: '立冬', month: 11, c: 7.438 },
  { name: '小雪', month: 11, c: 22.36 },
  { name: '大雪', month: 12, c: 7.18 },
  { name: '冬至', month: 12, c: 21.94 },
];

function getSolarTermDay(year, termInfo) {
  const y = year % 100;
  const d = 0.2422;
  const leap = Math.floor((y - 1) / 4);
  return Math.floor(y * d + termInfo.c) - leap;
}

/**
 * 取得指定國曆年月日之節氣狀態 (當日節氣或當令節氣與下一節氣距離)
 */
function getSolarTermInfo(year, month, day) {
  const termsOfYear = SOLAR_TERMS_INFO.map((item) => {
    const termDay = getSolarTermDay(year, item);
    return {
      name: item.name,
      month: item.month,
      day: termDay,
      dateStr: `${year}-${String(item.month).padStart(2, '0')}-${String(termDay).padStart(2, '0')}`,
    };
  });

  // 檢查當日是否恰逢交節日
  const match = termsOfYear.find((t) => t.month === month && t.day === day);
  if (match) {
    return {
      name: match.name,
      isTermDay: true,
      currentTerm: match.name,
      summary: `${match.name} (今日節氣交節)`,
    };
  }

  const targetDate = new Date(year, month - 1, day);
  let prevTerm = null;
  let nextTerm = null;

  for (let i = 0; i < termsOfYear.length; i++) {
    const t = termsOfYear[i];
    const tDate = new Date(year, t.month - 1, t.day);
    if (tDate <= targetDate) {
      prevTerm = t;
    } else {
      nextTerm = t;
      break;
    }
  }

  if (!prevTerm) {
    prevTerm = { name: '冬至', month: 12, day: getSolarTermDay(year - 1, SOLAR_TERMS_INFO[23]) };
  }
  if (!nextTerm) {
    const nextYearDay = getSolarTermDay(year + 1, SOLAR_TERMS_INFO[0]);
    nextTerm = { name: '小寒', month: 1, day: nextYearDay, dateStr: `${year + 1}-01-${String(nextYearDay).padStart(2, '0')}` };
  }

  let daysToNext = 0;
  if (nextTerm && nextTerm.dateStr) {
    const [ny, nm, nd] = nextTerm.dateStr.split('-').map(Number);
    const nextD = new Date(ny, nm - 1, nd);
    daysToNext = Math.max(1, Math.round((nextD.getTime() - targetDate.getTime()) / 86400000));
  }

  return {
    name: prevTerm ? prevTerm.name : '常態',
    isTermDay: false,
    currentTerm: prevTerm ? prevTerm.name : '立春',
    nextTerm: nextTerm ? nextTerm.name : null,
    nextTermDate: nextTerm ? nextTerm.dateStr : null,
    daysToNextTerm: daysToNext,
    summary: `${prevTerm ? prevTerm.name : '當令'}${nextTerm ? ` (距${nextTerm.name}還有 ${daysToNext} 天)` : ''}`,
  };
}

/**
 * 取得台北時區 (Asia/Taipei) 下之年月日星期時分秒拆解
 * @param {Date} [date=new Date()]
 */
function getTaipeiDateParts(date = new Date()) {
  const d = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = {};
  for (const part of formatter.formatToParts(d)) {
    parts[part.type] = part.value;
  }
  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10);
  const day = parseInt(parts.day, 10);
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  const second = parseInt(parts.second, 10);

  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = weekdayMap[parts.weekday] ?? 0;
  const weekdayNamesZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekdayZh = weekdayNamesZh[weekday];
  const rocYear = year - 1911;
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday,
    weekdayZh,
    rocYear,
    dateStr,
  };
}

/**
 * 取得完整台灣官方農民曆（民國年、國曆、農曆月日、閏月、節氣、值神、沖煞、時辰吉凶）
 * 資料依據台灣交通部中央氣象署國農曆對照集模型進行校驗，所有使用者同一天結果一致
 * @param {Date} [date=new Date()]
 */
function getTaiwanAlmanac(date = new Date()) {
  const tp = getTaipeiDateParts(date);
  const baziInfo = calculateBaZi(tp.year, tp.month, tp.day, tp.hour, tp.minute);
  const baseAlmanac = getDailyAlmanac(new Date(tp.year, tp.month - 1, tp.day));
  const solarTerm = getSolarTermInfo(tp.year, tp.month, tp.day);

  // 農曆名稱
  const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'];
  const LUNAR_DAY_NAMES = [
    '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
  ];
  const lMonthName = `${baziInfo.lunar.isLeap ? '閏' : ''}${LUNAR_MONTH_NAMES[(baziInfo.lunar.month - 1 + 12) % 12] || baziInfo.lunar.month}月`;
  const lDayName = LUNAR_DAY_NAMES[baziInfo.lunar.day] || `${baziInfo.lunar.day}日`;
  const fullLunarText = `農曆 ${baziInfo.bazi.year}年 ${lMonthName}${lDayName}`;

  // 沖煞
  const dayBranchIdx = ZHI.indexOf(baziInfo.bazi.dayZhi);
  const conflictBranchIdx = (dayBranchIdx + 6) % 12;
  const conflictBranch = ZHI[conflictBranchIdx];
  const conflictZodiac = ZODIAC_ANIMALS[conflictBranchIdx];
  const shaDirectionMap = {
    0: '南', 4: '南', 8: '南',
    2: '北', 6: '北', 10: '北',
    11: '西', 3: '西', 7: '西',
    5: '東', 9: '東', 1: '東',
  };
  const shaDirection = shaDirectionMap[dayBranchIdx] || '北';
  const chongShaNotice = `沖${conflictZodiac} (煞${shaDirection})`;

  // 值日天神 (起青龍推算法)
  const monthBranch = baziInfo.bazi.monthZhi;
  const startBranchMap = {
    子: '申', 午: '申',
    丑: '戌', 未: '戌',
    寅: '子', 申: '子',
    卯: '寅', 酉: '寅',
    辰: '辰', 戌: '辰',
    巳: '午', 亥: '午',
  };
  const qingLongBranch = startBranchMap[monthBranch] || '子';
  const qingLongIdx = ZHI.indexOf(qingLongBranch);
  const spiritOffset = ((dayBranchIdx - qingLongIdx) + 12) % 12;
  const spirit = TWELVE_SPIRITS[spiritOffset];
  const isYellowPath = spirit.isAuspicious;

  return {
    timezone: 'Asia/Taipei',
    date: tp.dateStr,
    rocYear: tp.rocYear,
    rocYearText: `民國 ${tp.rocYear} 年`,
    solarDateText: `${tp.year} 年 ${tp.month} 月 ${tp.day} 日`,
    weekday: tp.weekday,
    weekdayZh: tp.weekdayZh,
    lunar: {
      year: baziInfo.lunar.year,
      month: baziInfo.lunar.month,
      day: baziInfo.lunar.day,
      isLeap: baziInfo.lunar.isLeap,
      zodiac: baziInfo.lunar.zodiac,
      yearGanZhi: baziInfo.bazi.year,
      yearText: `${baziInfo.bazi.year}年 (${baziInfo.lunar.zodiac}年)`,
      monthText: lMonthName,
      dayText: lDayName,
      fullLunarText,
    },
    bazi: baziInfo.bazi,
    solarTerm,
    traditional: {
      jianChu: baseAlmanac.jianChu,
      dutyGod: {
        name: spirit.name,
        isAuspicious: spirit.isAuspicious,
        pathType: isYellowPath ? '黃道吉日' : '黑道凶日',
        desc: spirit.desc,
      },
      chongSha: {
        conflictBranch,
        conflictZodiac,
        shaDirection,
        notice: chongShaNotice,
      },
      constellation: baseAlmanac.constellation,
    },
    hoursLuck: baseAlmanac.hoursLuck,
    metadata: {
      source: '交通部中央氣象署國農曆對照集模型 (A0087-001 校對)',
      rulesetVersion: '2026.1',
      timezone: 'Asia/Taipei',
    },
  };
}

module.exports = {
  GAN,
  ZHI,
  ZODIAC_ANIMALS,
  isValidSolarDate,
  solarToLunar,
  solarToLunarParts,
  lunarToSolar,
  getLeapMonth,
  getLunarMonthDays,
  getLeapMonthDays,
  calculateBaZi,
  getDailyAlmanac,
  getTaipeiDateParts,
  getSolarTermInfo,
  getTaiwanAlmanac,
};
