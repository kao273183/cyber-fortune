/**
 * server/lib/fortune-birth-normalizer.js
 * 紫微斗數出生資料與時區正規化器（MVP 支援台灣 Asia/Taipei 1900–2100）
 *
 * 職責：
 * 1. 驗證 rulesetId（目前支援 ziwei-compatibility-v1）
 * 2. 嚴格驗證國曆／農曆／閏月日期有效性，不共用國曆日數檢查、不靜默補值
 * 3. 驗證時間精度（minute / shichen / unknown），拒絕 unknown 與跨子初換日界之曖昧子時辰
 * 4. 依 IANA Asia/Taipei 計算歷史夏令時間偏移與 UTC instant，確保結果不因伺服器 TZ 改變
 */

const {
  ZHI,
  isValidSolarDate,
  lunarToSolar,
  solarToLunarParts,
} = require('./fortune-lunar');

const SUPPORTED_RULESETS = Object.freeze({
  'ziwei-compatibility-v1': {
    rulesetId: 'ziwei-compatibility-v1',
    yearDivide: 'normal', // 農曆正月初一換年
    ziHourRule: 'next_day', // 23:00 子初換日算隔天
    leapMonthRule: 'mid_month', // 15 日含以前算當月，16 日含以後算下月
    algorithm: 'default',
    supportedTimeZones: ['Asia/Taipei'],
    minYear: 1900,
    maxYear: 2100,
  },
});

const SHICHEN_WINDOWS = Object.freeze([
  { index: 0, branch: '子', label: '23:00–00:59', crossesDayBoundaryUnderNextDay: true },
  { index: 1, branch: '丑', label: '01:00–02:59', repHour: 2, repMinute: 0 },
  { index: 2, branch: '寅', label: '03:00–04:59', repHour: 4, repMinute: 0 },
  { index: 3, branch: '卯', label: '05:00–06:59', repHour: 6, repMinute: 0 },
  { index: 4, branch: '辰', label: '07:00–08:59', repHour: 8, repMinute: 0 },
  { index: 5, branch: '巳', label: '09:00–10:59', repHour: 10, repMinute: 0 },
  { index: 6, branch: '午', label: '11:00–12:59', repHour: 12, repMinute: 0 },
  { index: 7, branch: '未', label: '13:00–14:59', repHour: 14, repMinute: 0 },
  { index: 8, branch: '申', label: '15:00–16:59', repHour: 16, repMinute: 0 },
  { index: 9, branch: '酉', label: '17:00–18:59', repHour: 18, repMinute: 0 },
  { index: 10, branch: '戌', label: '19:00–20:59', repHour: 20, repMinute: 0 },
  { index: 11, branch: '亥', label: '21:00–22:59', repHour: 22, repMinute: 0 },
]);

function createValidationError(code, message, details = {}) {
  const err = new Error(message);
  err.code = code;
  err.status = 400;
  err.details = details;
  return err;
}

/**
 * 取得指定 IANA 時區在特定 UTC 毫秒時間點的當地壁鐘時間各欄位
 */
function getZonedParts(utcMs, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = {};
  for (const p of fmt.formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  const hour = parts.hour === 24 ? 0 : parts.hour;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function computeOffsetMinutesAtWallClock(year, month, day, hour, minute, timeZone) {
  const targetAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guessMs = targetAsUtcMs;
  for (let i = 0; i < 4; i++) {
    const zp = getZonedParts(guessMs, timeZone);
    const zonedAsUtcMs = Date.UTC(zp.year, zp.month - 1, zp.day, zp.hour, zp.minute, 0);
    const diffMs = targetAsUtcMs - zonedAsUtcMs;
    if (diffMs === 0) break;
    guessMs += diffMs;
  }
  const actualOffsetMinutes = Math.round((targetAsUtcMs - guessMs) / 60000);
  return { guessMs, actualOffsetMinutes };
}

/**
 * 將特定時區的壁鐘時間 (year, month, day, hour, minute) 反推為確切 UTC instant 與實際時區偏移（含歷史夏令時間）
 * 不依賴伺服器 process.env.TZ，支援全球 IANA 時區
 */
function resolveWallClockInTimeZone(year, month, day, hour, minute, timeZone) {
  const { guessMs, actualOffsetMinutes } = computeOffsetMinutesAtWallClock(year, month, day, hour, minute, timeZone);
  const finalParts = getZonedParts(guessMs, timeZone);

  // 取該年 1 月 1 日與 7 月 1 日偏移較小者作為該地標準時偏移（南北半球 DST 皆適用）
  const janOffset = computeOffsetMinutesAtWallClock(year, 1, 1, 12, 0, timeZone).actualOffsetMinutes;
  const julOffset = computeOffsetMinutesAtWallClock(year, 7, 1, 12, 0, timeZone).actualOffsetMinutes;
  const standardOffsetMinutes = Math.min(janOffset, julOffset);
  const isDstActive = actualOffsetMinutes !== standardOffsetMinutes;

  return {
    utcInstant: new Date(guessMs).toISOString(),
    wallClock: `${String(finalParts.year).padStart(4, '0')}-${String(finalParts.month).padStart(2, '0')}-${String(finalParts.day).padStart(2, '0')} ${String(finalParts.hour).padStart(2, '0')}:${String(finalParts.minute).padStart(2, '0')}`,
    standardOffsetMinutes,
    actualOffsetMinutes,
    isDstActive,
  };
}

function parseDateStringStrict(dateStr, personKey) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    throw createValidationError(
      'INVALID_DATE_FORMAT',
      `出生日期格式須為 YYYY-MM-DD`,
      { personKey, field: 'date' }
    );
  }
  const [year, month, day] = dateStr.trim().split('-').map(Number);
  return { year, month, day };
}

function parseTimeStringStrict(timeStr, personKey) {
  if (typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr.trim())) {
    throw createValidationError(
      'INVALID_TIME_FORMAT',
      `出生時間格式須為 HH:MM`,
      { personKey, field: 'time' }
    );
  }
  const [hour, minute] = timeStr.trim().split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw createValidationError(
      'INVALID_TIME_RANGE',
      `出生時間超出有效範圍 (00:00–23:59)`,
      { personKey, field: 'time' }
    );
  }
  return { hour, minute };
}

function resolveShichenInput(shichenInput, personKey) {
  let entry = null;
  if (typeof shichenInput === 'number' && Number.isInteger(shichenInput)) {
    entry = SHICHEN_WINDOWS.find((s) => s.index === shichenInput) || null;
  } else if (typeof shichenInput === 'string') {
    const trimmed = shichenInput.trim();
    const idxByZhi = ZHI.indexOf(trimmed.replace(/時$/, ''));
    if (idxByZhi !== -1) {
      entry = SHICHEN_WINDOWS[idxByZhi];
    } else if (/^\d+$/.test(trimmed)) {
      const idxNum = Number(trimmed);
      entry = SHICHEN_WINDOWS.find((s) => s.index === idxNum) || null;
    }
  }

  if (!entry) {
    throw createValidationError(
      'INVALID_SHICHEN',
      `無效的時辰輸入，請提供子至亥之一或改用精確時分`,
      { personKey, field: 'shichen' }
    );
  }

  if (entry.crossesDayBoundaryUnderNextDay) {
    throw createValidationError(
      'AMBIGUOUS_ZI_SHICHEN',
      `子時橫跨 23:00–23:59（算隔天）與 00:00–00:59（算當天），請改用精確時分（HH:MM）以確認是否換日`,
      { personKey, field: 'shichen' }
    );
  }

  return entry;
}

/**
 * 正規化單一出生者資料
 * @param {object} rawPerson
 * @param {string} expectedKey 'A' | 'B'
 * @param {string} rulesetId
 */
function normalizeBirthInput(rawPerson, expectedKey, rulesetId = 'ziwei-compatibility-v1') {
  const ruleset = SUPPORTED_RULESETS[rulesetId];
  if (!ruleset) {
    throw createValidationError('UNSUPPORTED_RULESET', `不支援的規則集: ${rulesetId}`, { rulesetId });
  }

  if (!rawPerson || typeof rawPerson !== 'object') {
    throw createValidationError('MISSING_PERSON_DATA', `缺少第 ${expectedKey} 人出生資料`, { personKey: expectedKey });
  }

  const personKey = rawPerson.key === 'A' || rawPerson.key === 'B' ? rawPerson.key : expectedKey;
  const nickname = typeof rawPerson.nickname === 'string' ? rawPerson.nickname.trim().slice(0, 32) : '';
  const birthCity = typeof rawPerson.birthCity === 'string' ? rawPerson.birthCity.trim().slice(0, 16) : '';

  const calendar = rawPerson.calendar;
  if (calendar !== 'solar' && calendar !== 'lunar') {
    throw createValidationError(
      'INVALID_CALENDAR_TYPE',
      `曆別必須為 solar（國曆）或 lunar（農曆）`,
      { personKey, field: 'calendar' }
    );
  }

  const timeZone = rawPerson.timeZone || 'Asia/Taipei';
  if (!ruleset.supportedTimeZones.includes(timeZone)) {
    throw createValidationError(
      'UNSUPPORTED_TIMEZONE',
      `首版僅支援台灣時間 (Asia/Taipei)，尚未支援時區: ${timeZone}`,
      { personKey, field: 'timeZone', timeZone }
    );
  }

  const chartSex = rawPerson.chartSex;
  if (chartSex !== 'M' && chartSex !== 'F') {
    throw createValidationError(
      'MISSING_CHART_SEX',
      `請明確選擇傳統排盤性別參數（M 或 F）`,
      { personKey, field: 'chartSex' }
    );
  }

  const timePrecision = rawPerson.timePrecision;
  if (timePrecision === 'unknown') {
    throw createValidationError(
      'TIME_PRECISION_UNKNOWN',
      `缺少出生時間或時辰時，首版不靜默補值或輸出看似完整的合盤結論`,
      { personKey, field: 'timePrecision' }
    );
  }
  if (timePrecision !== 'minute' && timePrecision !== 'shichen') {
    throw createValidationError(
      'INVALID_TIME_PRECISION',
      `時間精度必須為 minute 或 shichen`,
      { personKey, field: 'timePrecision' }
    );
  }

  const { year, month, day } = parseDateStringStrict(rawPerson.date, personKey);
  if (year < ruleset.minYear || year > ruleset.maxYear) {
    throw createValidationError(
      'UNSUPPORTED_YEAR_RANGE',
      `出生年份須介於 ${ruleset.minYear}–${ruleset.maxYear}（已驗證曆法涵蓋範圍）`,
      { personKey, field: 'date', year }
    );
  }

  const isLeapMonth = Boolean(rawPerson.isLeapMonth);
  let solarDateParts;
  let lunarDateParts;

  if (calendar === 'solar') {
    if (isLeapMonth) {
      throw createValidationError(
        'SOLAR_CANNOT_BE_LEAP_MONTH',
        `國曆日期不應設定閏月旗標`,
        { personKey, field: 'isLeapMonth' }
      );
    }
    if (!isValidSolarDate(year, month, day)) {
      throw createValidationError(
        'INVALID_SOLAR_DATE',
        `無效的國曆日期: ${rawPerson.date}`,
        { personKey, field: 'date' }
      );
    }
    solarDateParts = { year, month, day };
    lunarDateParts = solarToLunarParts(year, month, day);
  } else {
    try {
      solarDateParts = lunarToSolar(year, month, day, isLeapMonth);
    } catch (err) {
      throw createValidationError(
        err.code || 'INVALID_LUNAR_DATE',
        err.message,
        { personKey, field: 'date' }
      );
    }
    lunarDateParts = {
      lunarYear: year,
      lunarMonth: month,
      lunarDay: day,
      isLeap: isLeapMonth,
    };
  }

  let hour;
  let minute;
  let shichenInfo = null;
  if (timePrecision === 'minute') {
    const parsedTime = parseTimeStringStrict(rawPerson.time, personKey);
    hour = parsedTime.hour;
    minute = parsedTime.minute;
  } else {
    shichenInfo = resolveShichenInput(rawPerson.shichen, personKey);
    hour = shichenInfo.repHour;
    minute = shichenInfo.repMinute;
  }

  const tzInfo = resolveWallClockInTimeZone(
    solarDateParts.year,
    solarDateParts.month,
    solarDateParts.day,
    hour,
    minute,
    timeZone
  );

  const isLateZiHour = hour === 23;

  return {
    personKey,
    nickname,
    rulesetId,
    rawInput: {
      calendar,
      date: rawPerson.date.trim(),
      isLeapMonth,
      time: timePrecision === 'minute' ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : null,
      shichen: shichenInfo ? shichenInfo.branch : null,
      timePrecision,
      timeZone,
      birthCity: birthCity || null,
      chartSex,
    },
    timeNormalization: {
      timeZone,
      wallClock: tzInfo.wallClock,
      utcInstant: tzInfo.utcInstant,
      standardOffsetMinutes: tzInfo.standardOffsetMinutes,
      actualOffsetMinutes: tzInfo.actualOffsetMinutes,
      isDstActive: tzInfo.isDstActive,
      isLateZiHour,
      ziHourRuleApplied: ruleset.ziHourRule,
      leapMonthRuleApplied: ruleset.leapMonthRule,
      shichenWindow: shichenInfo ? shichenInfo.label : null,
    },
    resolvedSolar: solarDateParts,
    resolvedLunar: lunarDateParts,
    chartInput: {
      year,
      month,
      day,
      hour,
      minute,
      gender: chartSex,
      isLunar: calendar === 'lunar',
      isLeapMonth: calendar === 'lunar' ? isLeapMonth : false,
      ziHourRule: ruleset.ziHourRule,
      leapMonthRule: ruleset.leapMonthRule,
    },
  };
}

module.exports = {
  SUPPORTED_RULESETS,
  SHICHEN_WINDOWS,
  normalizeBirthInput,
  resolveWallClockInTimeZone,
  createValidationError,
};
