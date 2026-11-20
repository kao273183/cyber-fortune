/**
 * server/lib/fortune-date.js
 * 老黃曆日期校驗、台灣 Asia/Taipei 時區標準化與日曆計算模組
 * 零原生 C++ 依賴，跨平台時區一致性驗證
 */

const MIN_DATE = '1901-01-01';
const MAX_DATE = '2099-12-31';
const SUPPORTED_RANGE = Object.freeze({ min: MIN_DATE, max: MAX_DATE });

/**
 * 取得指定西曆年月之真實天數（精確校驗閏年與大小月）
 * @param {number} year 
 * @param {number} month 1~12
 * @returns {number} 28~31
 */
function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * 嚴格解析並驗證 YYYY-MM-DD 國曆日期字串
 * 阻絕非法格式、無效閏日（如平年 2/29）、超出支援範圍
 * @param {string} dateStr
 * @returns {{ valid: boolean, year?: number, month?: number, day?: number, dateStr?: string, error?: string, message?: string, supportedRange?: { min: string, max: string } }}
 */
function parseDateString(dateStr) {
  if (typeof dateStr !== 'string') {
    return {
      valid: false,
      error: 'INVALID_TYPE',
      message: '查詢日期參數必須為字串',
      supportedRange: SUPPORTED_RANGE,
    };
  }

  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      valid: false,
      error: 'INVALID_FORMAT',
      message: '日期格式必須嚴格符合 YYYY-MM-DD',
      supportedRange: SUPPORTED_RANGE,
    };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    return {
      valid: false,
      error: 'INVALID_DATE',
      message: `月份超出有效範圍 (1~12): ${month}`,
      supportedRange: SUPPORTED_RANGE,
    };
  }

  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    return {
      valid: false,
      error: 'INVALID_DATE',
      message: `${year} 年 ${month} 月僅有 ${maxDay} 天，日期 ${day} 不存在`,
      supportedRange: SUPPORTED_RANGE,
    };
  }

  const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (normalized < MIN_DATE || normalized > MAX_DATE) {
    return {
      valid: false,
      error: 'DATE_OUT_OF_RANGE',
      message: `日期 ${normalized} 超出支援範圍 (${MIN_DATE} ~ ${MAX_DATE})`,
      supportedRange: SUPPORTED_RANGE,
    };
  }

  return {
    valid: true,
    year,
    month,
    day,
    dateStr: normalized,
    supportedRange: SUPPORTED_RANGE,
  };
}

/**
 * 取得台北時區 (Asia/Taipei) 當前真實日曆日 (YYYY-MM-DD)
 * @param {Date} [now=new Date()]
 * @returns {string} YYYY-MM-DD
 */
function getTaipeiToday(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * 產生台北時區正午 12:00:00 之 UTC Date 物件
 * 台北時間 12:00:00 等價於 UTC 04:00:00
 * 確保在任何伺服器時區環境中均能準確代表台北當日
 * @param {number} year
 * @param {number} month 1~12
 * @param {number} day 1~31
 * @returns {Date}
 */
function createTaipeiNoonDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 4, 0, 0));
}

/**
 * 精確日曆加減天數（跨月、跨年、閏年安全運算）
 * @param {string} dateStr YYYY-MM-DD
 * @param {number} days
 * @returns {string|null}
 */
function addDays(dateStr, days) {
  const parsed = parseDateString(dateStr);
  if (!parsed.valid) return null;
  const d = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));
  const ny = d.getUTCFullYear();
  const nm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(d.getUTCDate()).padStart(2, '0');
  const result = `${ny}-${nm}-${nd}`;
  if (result < MIN_DATE || result > MAX_DATE) return null;
  return result;
}

/**
 * 計算程式紀元天數 (從 2024-01-01 基準日起算)
 * 2024-01-01 為第 1 天，2024-01-02 為第 2 天
 * 2024-01-01 之前的歷史日期計算為非正數天數，忠實反映時間序
 * @param {string} dateStr YYYY-MM-DD
 * @returns {number}
 */
function calculateEraDays(dateStr) {
  const parsed = parseDateString(dateStr);
  if (!parsed.valid) return 1;
  const targetUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day);
  const epochUtc = Date.UTC(2024, 0, 1);
  const diffDays = Math.floor((targetUtc - epochUtc) / 86400000) + 1;
  return diffDays;
}

module.exports = {
  MIN_DATE,
  MAX_DATE,
  SUPPORTED_RANGE,
  getDaysInMonth,
  parseDateString,
  getTaipeiToday,
  createTaipeiNoonDate,
  addDays,
  calculateEraDays,
};
