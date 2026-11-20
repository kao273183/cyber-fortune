/**
 * server/lib/fortune-ziwei.js
 * 純 JavaScript 紫微斗數八字排盤、十四主星、吉煞四化與流年生活解讀引擎
 * 零原生 C++ 編譯依賴，相容 Node.js 24 與跨平台環境
 */

const {
  GAN,
  ZHI,
  calculateBaZi,
  solarToLunar,
  lunarToSolar,
  isValidSolarDate,
} = require('./fortune-lunar');

// 十二宮名稱 (以命宮為首逆時針排列)
const PALACE_NAMES = [
  '命宮', '兄弟宮', '夫妻宮', '子女宮',
  '財帛宮', '疾厄宮', '遷移宮', '交友宮',
  '官祿宮', '田宅宮', '福德宮', '父母宮',
];

// 六十甲子納音五行局計算表 (五行局局數: 水二局=2, 木三局=3, 金四局=4, 土五局=5, 火六局=6)
const NA_YIN_BUREAU = {
  甲子: 4, 乙丑: 4, 丙寅: 6, 丁卯: 6, 戊辰: 3, 己巳: 3, 庚午: 5, 辛未: 5, 壬申: 4, 癸酉: 4,
  甲戌: 6, 乙亥: 6, 丙子: 2, 丁丑: 2, 戊寅: 5, 己卯: 5, 庚辰: 4, 辛巳: 4, 壬午: 3, 癸未: 3,
  甲申: 2, 乙酉: 2, 丙戌: 5, 丁亥: 5, 戊子: 6, 己丑: 6, 庚寅: 3, 辛卯: 3, 壬辰: 2, 癸巳: 2,
  甲午: 4, 乙未: 4, 丙申: 6, 丁酉: 6, 戊戌: 3, 己亥: 3, 庚子: 5, 辛丑: 5, 壬寅: 4, 癸卯: 4,
  甲辰: 6, 乙巳: 6, 丙午: 2, 丁未: 2, 戊申: 5, 己酉: 5, 庚戌: 4, 辛亥: 4, 壬子: 3, 癸丑: 3,
  甲寅: 2, 乙卯: 2, 丙辰: 5, 丁巳: 5, 戊午: 6, 己未: 6, 庚申: 3, 辛酉: 3, 壬戌: 2, 癸亥: 2,
};

const BUREAU_NAMES = {
  2: { name: '水二局', element: '水', number: 2 },
  3: { name: '木三局', element: '木', number: 3 },
  4: { name: '金四局', element: '金', number: 4 },
  5: { name: '土五局', element: '土', number: 5 },
  6: { name: '火六局', element: '火', number: 6 },
};

// 十天干四化表 (祿、權、科、忌)
const SI_HUA_MAP = {
  甲: { lu: '廉貞', quan: '破軍', ke: '武曲', ji: '太陽' },
  乙: { lu: '天機', quan: '天梁', ke: '紫微', ji: '太陰' },
  丙: { lu: '天同', quan: '天機', ke: '文昌', ji: '廉貞' },
  丁: { lu: '太陰', quan: '天同', ke: '天機', ji: '巨門' },
  戊: { lu: '貪狼', quan: '太陰', ke: '右弼', ji: '天機' },
  己: { lu: '武曲', quan: '貪狼', ke: '天梁', ji: '文曲' },
  庚: { lu: '太陽', quan: '武曲', ke: '太陰', ji: '天同' },
  辛: { lu: '巨門', quan: '太陽', ke: '文曲', ji: '文昌' },
  壬: { lu: '天梁', quan: '紫微', ke: '左輔', ji: '武曲' },
  癸: { lu: '破軍', quan: '巨門', ke: '太陰', ji: '貪狼' },
};

// 十四主星在十二地支之廟旺平陷 (地支 0=子, 1=丑, 2=寅, 3=卯, 4=辰, 5=巳, 6=午, 7=未, 8=申, 9=酉, 10=戌, 11=亥)
const STAR_BRIGHTNESS = {
  紫微: ['平', '廟', '廟', '旺', '得', '旺', '廟', '廟', '旺', '平', '得', '旺'],
  天機: ['廟', '陷', '得', '旺', '平', '平', '廟', '陷', '得', '旺', '平', '平'],
  太陽: ['陷', '陷', '旺', '廟', '廟', '旺', '廟', '得', '得', '平', '不', '陷'],
  武曲: ['旺', '廟', '得', '平', '廟', '平', '旺', '廟', '得', '平', '廟', '平'],
  天同: ['旺', '不', '利', '平', '平', '廟', '陷', '不', '利', '平', '平', '廟'],
  廉貞: ['平', '利', '廟', '平', '旺', '陷', '平', '廟', '廟', '平', '旺', '陷'],
  天府: ['廟', '廟', '廟', '旺', '廟', '得', '旺', '廟', '得', '廟', '廟', '旺'],
  太陰: ['廟', '廟', '陷', '陷', '陷', '陷', '陷', '不', '平', '旺', '旺', '廟'],
  貪狼: ['旺', '廟', '平', '平', '廟', '陷', '旺', '廟', '平', '平', '廟', '陷'],
  巨門: ['旺', '不', '廟', '廟', '平', '平', '旺', '不', '廟', '廟', '平', '平'],
  天相: ['廟', '廟', '廟', '陷', '旺', '平', '得', '得', '廟', '陷', '旺', '平'],
  天梁: ['廟', '旺', '廟', '廟', '旺', '陷', '廟', '旺', '陷', '得', '廟', '陷'],
  七殺: ['旺', '廟', '廟', '平', '旺', '平', '旺', '廟', '廟', '平', '旺', '平'],
  破軍: ['廟', '旺', '陷', '陷', '旺', '平', '廟', '旺', '陷', '陷', '旺', '平'],
};

// 十二宮位生活意涵字典
const PALACE_DEV_ROLES = {
  命宮: { title: '天賦本色與核心靈魂', focus: '內在韌性抗壓、處世心態與做事風格' },
  兄弟宮: { title: '同儕協作與夥伴支援', focus: '手足情誼與搭檔默契、同事互相照應、緊要關頭挺身補位' },
  夫妻宮: { title: '感情牽絆與伴侶關係', focus: '伴侶支持度、家庭與工作平衡、兩人生活步調合拍度' },
  子女宮: { title: '子女緣份與新計畫誕生', focus: '子女親緣、開創新事物、提攜後進與晚輩成長' },
  財帛宮: { title: '績效分紅與薪資回報', focus: '調薪談判籌碼、年終獎金、副業接案與投資收益' },
  疾厄宮: { title: '身體健康與防護保養', focus: '腰椎頸椎抗壓、防範熬夜乾眼、心理健康警戒' },
  遷移宮: { title: '出外發展與遠方機運', focus: '出差旅行順暢度、異地發展機會、轉職面試運勢' },
  交友宮: { title: '人脈交友與防背刺', focus: '朋友與貴人助力、同事間溝通摩擦係數、慎防小人' },
  官祿宮: { title: '職場話語權與升遷天梯', focus: '關鍵決策主導權、重大任務達陣戰功、升職加薪運' },
  田宅宮: { title: '居家環境與置產根基', focus: '居家舒適度、工作環境佈置、置產購屋與家運' },
  福德宮: { title: '功德福報與身心靈平衡', focus: '日子平順無事的鬆弛感、生活美感追求、精神幸福感' },
  父母宮: { title: '長輩緣份與主管關係', focus: '老闆信任度、父母長輩支持、背鍋防禦力' },
};

// 命主星對照表 (依命宮地支)
const MING_ZHU_MAP = {
  子: '貪狼', 丑: '巨門', 寅: '祿存', 卯: '文曲', 辰: '廉貞', 巳: '武曲',
  午: '破軍', 未: '武曲', 申: '廉貞', 酉: '文曲', 戌: '祿存', 亥: '巨門',
};

// 身主星對照表 (依生年地支)
const SHEN_ZHU_MAP = {
  子: '火星', 丑: '天相', 寅: '天梁', 卯: '天同', 辰: '文昌', 巳: '天機',
  午: '火星', 未: '天相', 申: '天梁', 酉: '天同', 戌: '文昌', 亥: '天機',
};

/**
 * 依納音五行局與農曆出生日計算紫微星落宮 (地支索引 0..11)
 */
function findZiweiBranch(bureauNum, lunarDay) {
  // 標準紫微星起數算法
  let day = lunarDay;
  let remainder = day % bureauNum;
  let quotient = Math.floor(day / bureauNum);
  let x = 0;
  if (remainder !== 0) {
    x = bureauNum - remainder;
    day += x;
    quotient = Math.floor(day / bureauNum);
  }

  let pos = (quotient + 1) % 12; // 寅宮起數基礎
  if (x % 2 === 1) {
    // 奇數逆數 x
    pos = (pos - x + 12) % 12;
  } else {
    // 偶數順數 x
    pos = (pos + x) % 12;
  }
  return (pos + 12) % 12;
}

/**
 * 計算紫微斗數全盤排盤 (基準盤精確校準與早晚子時、閏月法則)
 * @param {Object} options
 * @param {number} options.year 西元年 (1900~2100)
 * @param {number} options.month 國曆/農曆月 (1~12)
 * @param {number} options.day 國曆/農曆日 (1~31)
 * @param {number} options.hour 出生時 (0~23)
 * @param {number} [options.minute=0] 出生分 (0~59)
 * @param {string} [options.gender='M'] 性別 'M' (乾造/男) 或 'F' (坤造/女)
 * @param {boolean} [options.isLunar=false] 是否已為農曆輸入
 * @param {boolean} [options.isLeapMonth=false] 農曆輸入時是否為閏月
 * @param {'early_late'|'next_day'} [options.ziHourRule='early_late'] 早晚子時規則 (子正換日 vs 子初換日)
 * @param {'mid_month'|'current'|'next'} [options.leapMonthRule='mid_month'] 閏月推算規則 (月中分界法 vs 當月 vs 下月)
 */
function calculateZiweiChart(options) {
  const {
    year,
    month,
    day,
    hour = 12,
    minute = 0,
    gender = 'M',
    isLunar = false,
    isLeapMonth = false,
    ziHourRule = 'early_late',
    leapMonthRule = 'mid_month',
  } = options;

  const isLateZi = hour === 23;
  const isEarlyZi = hour === 0;
  const ziHourType = isLateZi ? 'late_zi' : (isEarlyZi ? 'early_zi' : 'normal');

  let baziInfo;
  if (isLunar) {
    // 農曆輸入：先嚴格驗證並反解為國曆，再交由 calculateBaZi 統一處理晚子換日、跨月/跨年進位與四柱
    const solar = lunarToSolar(year, month, day, Boolean(isLeapMonth));
    baziInfo = calculateBaZi(solar.year, solar.month, solar.day, hour, minute, { ziHourRule });
  } else {
    if (!isValidSolarDate(year, month, day)) {
      const err = new Error(`Invalid solar date: ${year}-${month}-${day}`);
      err.code = 'INVALID_SOLAR_DATE';
      throw err;
    }
    baziInfo = calculateBaZi(year, month, day, hour, minute, { ziHourRule });
  }

  const lunarYear = baziInfo.lunar.year;
  const lunarMonth = baziInfo.lunar.month;
  const lunarDay = baziInfo.lunar.day;
  const isLeap = baziInfo.lunar.isLeap;

  // 閏月有效月份推算 (Leap Month Calibration)
  // 中州派與正統紫微月中分界法：閏月 15 日(含)以前算當月，16 日(含)以後算下個月
  let effectiveLunarMonth = lunarMonth;
  if (isLeap) {
    if (leapMonthRule === 'mid_month') {
      if (lunarDay > 15) {
        effectiveLunarMonth = (lunarMonth % 12) + 1;
      } else {
        effectiveLunarMonth = lunarMonth;
      }
    } else if (leapMonthRule === 'next') {
      effectiveLunarMonth = (lunarMonth % 12) + 1;
    } else {
      effectiveLunarMonth = lunarMonth;
    }
  }

  const { yearGan, yearZhi, hourZhi } = baziInfo.bazi;
  const hourZhiIdx = ZHI.indexOf(hourZhi);

  // 1. 定命宮與身宮
  // 寅宮 (2) 起正月順數至生月 (effectiveLunarMonth)，再逆數至生時安命宮；順數至生時安身宮
  const mingGongBranchIdx = ((2 + (effectiveLunarMonth - 1) - hourZhiIdx) % 12 + 12) % 12;
  const shenGongBranchIdx = ((2 + (effectiveLunarMonth - 1) + hourZhiIdx) % 12 + 12) % 12;

  // 2. 定十二宮地支與天干 (五虎遁年起月訣：甲己之年丙作首，乙庚之歲戊為頭...)
  const tigerStartGan = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
  const baseMonthGan = tigerStartGan[GAN.indexOf(yearGan)];

  // 計算十二地支對應之宮干 (從寅宮=2 開始填入天干)
  const branchGans = {};
  for (let i = 0; i < 12; i++) {
    const branchIdx = (2 + i) % 12; // 寅卯辰巳午未申酉戌亥子丑
    const ganIdx = (baseMonthGan + i) % 10;
    branchGans[branchIdx] = GAN[ganIdx];
  }

  // 3. 定命宮五行局
  const mingGan = branchGans[mingGongBranchIdx];
  const mingZhi = ZHI[mingGongBranchIdx];
  const nayinKey = `${mingGan}${mingZhi}`;
  const bureauNum = NA_YIN_BUREAU[nayinKey] || 2;
  const bureau = BUREAU_NAMES[bureauNum];

  // 4. 起紫微星與天府星
  const ziweiBranchIdx = findZiweiBranch(bureauNum, lunarDay);
  // 天府與紫微在寅申軸對稱：(4 - ziweiBranchIdx + 12) % 12
  const tianfuBranchIdx = ((4 - ziweiBranchIdx) + 12) % 12;

  // 5. 安十四主星
  // 紫微星系 (逆行): 紫微(0), 天機(-1), 太陽(-3), 武曲(-4), 天同(-5), 廉貞(-8)
  const mainStarsPos = {
    紫微: ziweiBranchIdx,
    天機: (ziweiBranchIdx - 1 + 12) % 12,
    太陽: (ziweiBranchIdx - 3 + 12) % 12,
    武曲: (ziweiBranchIdx - 4 + 12) % 12,
    天同: (ziweiBranchIdx - 5 + 12) % 12,
    廉貞: (ziweiBranchIdx - 8 + 12) % 12,
    // 天府星系 (順行): 天府(0), 太陰(+1), 貪狼(+2), 巨門(+3), 天相(+4), 天梁(+5), 七殺(+6), 破軍(+10)
    天府: tianfuBranchIdx,
    太陰: (tianfuBranchIdx + 1) % 12,
    貪狼: (tianfuBranchIdx + 2) % 12,
    巨門: (tianfuBranchIdx + 3) % 12,
    天相: (tianfuBranchIdx + 4) % 12,
    天梁: (tianfuBranchIdx + 5) % 12,
    七殺: (tianfuBranchIdx + 6) % 12,
    破軍: (tianfuBranchIdx + 10) % 12,
  };

  // 6. 安六吉星、六煞星、祿存、天馬 (全套正統起法校準)
  // 左輔辰順，右弼戌逆 (依有效農曆月)
  const zuoFuIdx = (4 + (effectiveLunarMonth - 1)) % 12;
  const youBiIdx = ((10 - (effectiveLunarMonth - 1)) % 12 + 12) % 12;
  // 文昌戌逆，文曲辰順 (以生時推算)
  const wenChangIdx = ((10 - hourZhiIdx) % 12 + 12) % 12;
  const wenQuIdx = (4 + hourZhiIdx) % 12;
  // 天魁天鉞
  const kuiYueMap = {
    甲: [1, 7], 戊: [1, 7], 庚: [1, 7],
    乙: [8, 0], 己: [8, 0],
    丙: [11, 9], 丁: [11, 9],
    辛: [6, 2],
    壬: [3, 5], 癸: [3, 5],
  };
  const [tianKuiIdx, tianYueIdx] = kuiYueMap[yearGan] || [1, 7];

  // 祿存與羊陀
  const luCunMap = { 甲: 2, 乙: 3, 丙: 5, 丁: 6, 戊: 5, 己: 6, 庚: 8, 辛: 9, 壬: 11, 癸: 0 };
  const luCunIdx = luCunMap[yearGan] || 2;
  const qingYangIdx = (luCunIdx + 1) % 12;
  const tuoLuoIdx = (luCunIdx - 1 + 12) % 12;

  // 地空地劫 (亥宮起子時，地空逆行，地劫順行)
  const diKongIdx = ((11 - hourZhiIdx) % 12 + 12) % 12;
  const diJieIdx = (11 + hourZhiIdx) % 12;

  // 火星與鈴星 (依《紫微斗數全書》年支三合起宮 + 生時順數，校準修正)
  const huoXingBase = {
    寅: 1, 午: 1, 戌: 1, // 丑起
    申: 2, 子: 2, 辰: 2, // 寅起
    巳: 3, 酉: 3, 丑: 3, // 卯起
    亥: 9, 卯: 9, 未: 9, // 酉起
  };
  const lingXingBase = {
    寅: 3, 午: 3, 戌: 3, // 卯起
    申: 10, 子: 10, 辰: 10, // 戌起
    巳: 10, 酉: 10, 丑: 10, // 戌起
    亥: 10, 卯: 10, 未: 10, // 戌起
  };
  const huoXingIdx = (huoXingBase[yearZhi] + hourZhiIdx) % 12;
  const lingXingIdx = (lingXingBase[yearZhi] + hourZhiIdx) % 12;

  // 天馬 (依生年地支三合局長生驛馬位)
  const tianMaMap = {
    申: 2, 子: 2, 辰: 2, // 寅
    寅: 8, 午: 8, 戌: 8, // 申
    巳: 11, 酉: 11, 丑: 11, // 亥
    亥: 5, 卯: 5, 未: 5, // 巳
  };
  const tianMaIdx = tianMaMap[yearZhi] || 2;

  // 命主星與身主星
  const mingZhu = MING_ZHU_MAP[mingZhi];
  const shenZhu = SHEN_ZHU_MAP[yearZhi];

  // 7. 本命四化 (正統中州派十天干四化)
  const birthSiHua = SI_HUA_MAP[yearGan] || SI_HUA_MAP.甲;
  const getBirthSiHuaType = (starName) => {
    if (birthSiHua.lu === starName) return '祿';
    if (birthSiHua.quan === starName) return '權';
    if (birthSiHua.ke === starName) return '科';
    if (birthSiHua.ji === starName) return '忌';
    return null;
  };

  // 大限順逆判定：陽男陰女順行 (clockwise)，陰男陽女逆行 (counter-clockwise)
  const isYangYear = [0, 2, 4, 6, 8].includes(GAN.indexOf(yearGan)); // 甲丙戊庚壬為陽
  const isMale = gender === 'M';
  const isDaXianClockwise = (isYangYear && isMale) || (!isYangYear && !isMale);

  // 8. 組織十二宮數據
  const palaces = [];
  for (let i = 0; i < 12; i++) {
    // 宮位名稱依命宮逆時針排列
    const palaceName = PALACE_NAMES[i];
    const branchIdx = ((mingGongBranchIdx - i) % 12 + 12) % 12;
    const branch = ZHI[branchIdx];
    const stem = branchGans[branchIdx];

    // 尋找落在此宮的主星
    const mainStars = [];
    for (const [starName, sBranchIdx] of Object.entries(mainStarsPos)) {
      if (sBranchIdx === branchIdx) {
        const brightness = STAR_BRIGHTNESS[starName][branchIdx] || '平';
        mainStars.push({
          name: starName,
          brightness,
          sihua: getBirthSiHuaType(starName),
        });
      }
    }

    // 尋找落在此宮的輔曜神煞（同步標記輔星四化，如文昌、文曲、左輔、右弼）
    const minorStars = [];
    const pushMinor = (name, type) => {
      minorStars.push({ name, type, sihua: getBirthSiHuaType(name) });
    };
    if (zuoFuIdx === branchIdx) pushMinor('左輔', 'auspicious');
    if (youBiIdx === branchIdx) pushMinor('右弼', 'auspicious');
    if (wenChangIdx === branchIdx) pushMinor('文昌', 'auspicious');
    if (wenQuIdx === branchIdx) pushMinor('文曲', 'auspicious');
    if (tianKuiIdx === branchIdx) pushMinor('天魁', 'auspicious');
    if (tianYueIdx === branchIdx) pushMinor('天鉞', 'auspicious');
    if (luCunIdx === branchIdx) pushMinor('祿存', 'auspicious');
    if (tianMaIdx === branchIdx) pushMinor('天馬', 'auspicious');

    if (qingYangIdx === branchIdx) pushMinor('擎羊', 'inauspicious');
    if (tuoLuoIdx === branchIdx) pushMinor('陀羅', 'inauspicious');
    if (huoXingIdx === branchIdx) pushMinor('火星', 'inauspicious');
    if (lingXingIdx === branchIdx) pushMinor('鈴星', 'inauspicious');
    if (diKongIdx === branchIdx) pushMinor('地空', 'inauspicious');
    if (diJieIdx === branchIdx) pushMinor('地劫', 'inauspicious');

    const isShenGong = (shenGongBranchIdx === branchIdx);
    const devRole = PALACE_DEV_ROLES[palaceName] || { title: palaceName, focus: '日常生活' };

    // 三方四正對照 (對宮、三合宮)
    const oppositeBranchIdx = (branchIdx + 6) % 12;
    const sanHe1BranchIdx = (branchIdx + 4) % 12;
    const sanHe2BranchIdx = (branchIdx + 8) % 12;

    palaces.push({
      index: i,
      name: palaceName,
      branch,
      branchIndex: branchIdx,
      stem,
      stemBranch: `${stem}${branch}`,
      isShenGong,
      mainStars,
      minorStars,
      devRole,
      sanFangSiZheng: {
        opposite: ZHI[oppositeBranchIdx],
        sanHe1: ZHI[sanHe1BranchIdx],
        sanHe2: ZHI[sanHe2BranchIdx],
      },
    });
  }

  // 大限年齡區間賦予至各宮位
  // 起始年齡為五行局數，每宮掌管 10 年
  for (let s = 0; s < 12; s++) {
    const targetBranchIdx = isDaXianClockwise
      ? (mingGongBranchIdx + s) % 12
      : ((mingGongBranchIdx - s) % 12 + 12) % 12;
    const targetPalace = palaces.find((p) => p.branchIndex === targetBranchIdx);
    if (targetPalace) {
      const startAge = bureauNum + s * 10;
      const endAge = startAge + 9;
      targetPalace.daXian = {
        startAge,
        endAge,
        step: s + 1,
        isClockwise: isDaXianClockwise,
      };
    }
  }

  // 9. 總體格局與命格評述
  const mingPalace = palaces[0];

  return {
    profile: {
      solarDate: `${baziInfo.solar.year}-${String(baziInfo.solar.month).padStart(2, '0')}-${String(baziInfo.solar.day).padStart(2, '0')}`,
      solarTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      lunarDate: `農曆 ${lunarYear} 年 ${isLeap ? '閏' : ''}${lunarMonth} 月 ${lunarDay} 日`,
      effectiveLunarMonth,
      zodiac: baziInfo.lunar.zodiac,
      gender: gender === 'M' ? '乾造 (男)' : '坤造 (女)',
      bazi: baziInfo.bazi,
      bureau: bureau.name,
      bureauNum,
      mingGong: `${mingPalace.stemBranch} (${mingPalace.name})`,
      shenGong: `${ZHI[shenGongBranchIdx]} (身宮)`,
      mingZhu,
      shenZhu,
      ziHourType,
      ziHourRule,
      leapMonthRule,
      engineVersion: '2026.3-orthodox',
    },
    palaces,
    birthSiHua,
  };
}

// 十二宮生活與職場角色、四化對應語意庫 (P2-D 動態解讀引擎)
const PALACE_ENGINEERING_ROLES = {
  命宮: {
    theme: '核心意志與自我驅動',
    lu: '個人能量爆發期，對未來方向的靈感源源不絕，自信心與自主執行力全面拉滿',
    quan: '在人生重要抉擇上展現絕對主導魄力，敢於承擔核心決策，個人影響力大幅擴展',
    ji: '自我要求過苛容易陷入執念或反覆推翻重來，切忌獨自硬扛所有壓力與舊帳，宜適時尋求親友分擔',
    ke: '個人聲譽與口碑大漲，提出的想法或親手完成的作品獲得廣泛認可與身邊人讚揚',
  },
  兄弟宮: {
    theme: '手足同儕與並肩夥伴',
    lu: '兄弟姊妹或身邊同儕提供關鍵助力，與好搭檔並肩合作、集思廣益產出豐厚成果',
    quan: '在同儕圈中扮演核心把關人角色，提出的規矩與建議能讓大家信服遵守',
    ji: '與手足或同儕溝通易因做事風格歧見產生摩擦，給意見時多提建設性建議而非直接否定',
    ke: '同儕夥伴互為貴人，彼此交流分享的氛圍極佳，形成互相砥礪的良性循環',
  },
  夫妻宮: {
    theme: '伴侶感情與一對一緊密搭檔 (如另一半、事業合夥人)',
    lu: '與另一半或關鍵搭檔默契無間，溝通與想法對齊異常順暢，大幅縮短磨合期',
    quan: '在與伴侶或搭檔的協商中佔據主動權，能引導彼此朝最理想的共同方向推進',
    ji: '彼此約定或期待的細節易出現理解偏差，做重要決定前務必把話說清楚、反覆確認共識',
    ke: '與伴侶或搭檔互相成就，攜手經營的關係與成果成為身邊親友眼中的楷模典範',
  },
  子女宮: {
    theme: '子女晚輩、傳承提攜與創意成果',
    lu: '指導晚輩或新人成效斐然，親手發想的小點子或作品廣受身邊人歡迎',
    quan: '帶領年輕後輩攻堅成效卓著，培養出具備獨當一面能力的得力幫手',
    ji: '子女晚輩或交辦出去的事情容易遺漏細節，新計畫起步時務必多叮嚀、多檢查一遍',
    ke: '經驗傳承清晰踏實，帶出來的新人上手極快，展現極佳的領導與教育潛能',
  },
  財帛宮: {
    theme: '財富累積、考核回報與專長變現',
    lu: '努力付出轉化為實質回報，績效考評、年終獎金或調薪具備強勁上行動能',
    quan: '精準掌控個人預算與資源分配，花錢與投資都注重最高投資報酬率 (ROI)',
    ji: '防範因判斷估算失誤導致的開銷超支，留意合約條款、訂閱扣款與隱藏費用',
    ke: '因專業長才獲得穩健的報酬與津貼獎勵，個人身價水漲船高',
  },
  疾厄宮: {
    theme: '身體健康維護與精力可持續性',
    lu: '身心能量充沛，即使面對高強度工作仍能維持高昂精力與良好睡眠',
    quan: '高度重視辦公座位與居家的人體工學配置，能主動調節作息與工作節奏，抗壓性強',
    ji: '需特別警惕久坐帶來的腰椎頸椎抗議、眼睛乾澀或過勞，切勿連續熬夜硬撐',
    ke: '找到最佳的健康調節與工作平衡之道，藉由規律運動保持大腦清醒明晰',
  },
  遷移宮: {
    theme: '出外發展、遠方機緣與外部人脈圈',
    lu: '出外打拚平穩順遂，跨縣市或海外發展大獲成功，在外的人氣與影響力擴大',
    quan: '在陌生環境與大型場合中展現權威掌控力，遇到突發狀況也能果斷處置',
    ji: '防範出門在外的交通延誤、行程變卦或意外狀況，凡事預留備案與緩衝時間',
    ke: '在外部場合或社群活動分享獲得極高口碑，顯著提升個人形象與知名度',
  },
  交友宮: {
    theme: '朋友人脈、同事協作與社交圈',
    lu: '人際往來與跨部門溝通順暢無阻，獲得朋友、同事與各方貴人的鼎力相助',
    quan: '在朋友圈與團體活動中具備重大號召力，能協調多方意見推動大型計畫成真',
    ji: '倚賴的朋友或合作對象容易臨時變卦、事前沒打招呼，重要約定需多確認、留後路',
    ke: '廣結善緣，獲得同行前輩高手指點，資訊互通有無帶來寶貴靈感',
  },
  官祿宮: {
    theme: '核心職涯晉升、重大抉擇與事業地位',
    lu: '迎來職涯躍升的關鍵機遇，承接公司級重大任務或組織調整，工作成就備受高層矚目',
    quan: '正式挑起主管或團隊領頭羊大樑，擁有專案方向與團隊人事的話語權',
    ji: '面臨高難度關鍵任務的交辦壓力，目標反覆變更易產生挫折感，需沉住氣穩步拆解',
    ke: '在公司重大考核或關鍵任務中脫穎而出，專業水準深得主管與客戶高度肯定',
  },
  田宅宮: {
    theme: '居家根基、生活環境、置產與家族資產',
    lu: '居家環境與生活機能大幅升級，住家與辦公環境舒適度顯著提升',
    quan: '主導居家整修、搬遷或置產規劃，徹底清除遺留已久的雜物與歷史包袱',
    ji: '需防範家中漏水、電器損壞或重要文件遺失，重要資料與物品務必勤加備份、妥善收納',
    ke: '居家空間整潔有序，房產文件與家中帳務完備，家族共享資產穩健',
  },
  福德宮: {
    theme: '心理韌性、專注心流與對生活的熱情',
    lu: '在投入熱愛的事物中體會深層心流樂趣，精神飽滿從容，焦慮感大幅降低',
    quan: '思維敏捷果決，能以極強的意志力排除外界干擾，專注攻克最艱難的挑戰',
    ji: '容易產生焦慮或完美主義內耗，切勿因細微瑕疵而全盤推翻成果，多包容自我',
    ke: '心境豁達明朗，能以哲學視角看待人生的得失，享受探索新知的精神滿足',
  },
  父母宮: {
    theme: '父母長輩、主管支持、文書契約與規範對齊',
    lu: '深得父母長輩、主管或資深前輩的信任與資源傾斜，關鍵決策獲得堅實後盾',
    quan: '在向長官匯報或面對外部審核時展現強大說服力，輕鬆取得資源與支持',
    ji: '與長輩或主管溝通時務必留存明確的書面紀錄，防範口頭約定產生認知分歧',
    ke: '順利通過嚴格的考試、審查或資格認證，獲得長輩與高層的榮譽嘉獎與肯定',
  },
};

// 十四主星坐鎮流年命宮之氣質與處事特質
const MAIN_STAR_CAREER_STYLES = {
  紫微: '具備帝王星的領袖氣度與全局視角，注重長遠規劃與整體格局',
  天機: '思維邏輯與謀略敏銳度拔群，善於推演複雜局勢並快速靈活應變',
  太陽: '熱情外向且樂於分享付出，主動承擔核心重任，照亮身邊人引領團隊前進',
  武曲: '做事簡潔明快、追求高執行效率，注重投入產出比，抗壓衝鋒力強',
  天同: '擅長化繁為簡與消除身邊人焦慮，能以沉穩節奏慢慢理順繁雜舊事',
  廉貞: '對細節死角與關鍵瓶頸嗅覺敏銳，精益求精，追求極致完美',
  天府: '沉著包容、善於守成，是家庭與團隊中最可靠的定海神針',
  太陰: '心思細膩、審美品味高，專注於生活質感與極致細節呈現',
  貪狼: '觸角敏銳、多才多藝，善於探索新鮮事物與前衛潮流（如新興話題與跨界嗜好）',
  巨門: '深究本質、找出問題的嗅覺驚人，善於抽絲剝繭釐清疑難雜症與僵局',
  天相: '注重規矩分寸與公平對等，善於協調多方利益，是極佳的得力副手',
  天梁: '老練穩重、化解危局，最擅長梳理多年未解的陳年舊帳與疑難雜症',
  七殺: '大開大闔、獨擋一面，敢於打破陳規舊習，推動重大變革雷厲風行',
  破軍: '敢於破舊立新、顛覆傳統，徹底告別過時做法，開創全新格局與典範轉移',
};

/**
 * 計算指定年份之流年運勢 (P2-D 動態解讀引擎：依命盤實際四化落宮與流年主星推導)
 * @param {Object} chart 已排盤之命盤資料
 * @param {number} targetYear 目標年份 (例如 2026)
 */
function calculateYearlyFortune(chart, targetYear = new Date().getFullYear()) {
  const yearGanIdx = (targetYear - 4) % 10;
  const yearZhiIdx = (targetYear - 4) % 12;
  const yearlyGan = GAN[(yearGanIdx + 10) % 10];
  const yearlyZhi = ZHI[(yearZhiIdx + 12) % 12];
  const yearlyZodiac = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'][(yearZhiIdx + 12) % 12];

  // 1. 流年命宮地支等於該年地支
  const yearlyMingBranchIdx = ZHI.indexOf(yearlyZhi);

  // 2. 找到本命盤中落在此地支的本命宮位
  const originPalaceAtYearlyBranch = chart.palaces.find((p) => p.branchIndex === yearlyMingBranchIdx);

  // 3. 流年天干四化
  const yearlySiHua = SI_HUA_MAP[yearlyGan] || SI_HUA_MAP.丙;

  // 4. 動態搜尋四化星各落入本命盤的哪一個宮位
  const findPalaceForStar = (starName) => {
    return (
      chart.palaces.find((p) =>
        (p.mainStars && p.mainStars.some((s) => s.name === starName)) ||
        (p.minorStars && p.minorStars.some((s) => s.name === starName))
      ) || chart.palaces[0]
    );
  };

  const palaceLu = findPalaceForStar(yearlySiHua.lu);
  const palaceQuan = findPalaceForStar(yearlySiHua.quan);
  const palaceKe = findPalaceForStar(yearlySiHua.ke);
  const palaceJi = findPalaceForStar(yearlySiHua.ji);

  const roleLu = PALACE_ENGINEERING_ROLES[palaceLu.name] || PALACE_ENGINEERING_ROLES.命宮;
  const roleQuan = PALACE_ENGINEERING_ROLES[palaceQuan.name] || PALACE_ENGINEERING_ROLES.官祿宮;
  const roleKe = PALACE_ENGINEERING_ROLES[palaceKe.name] || PALACE_ENGINEERING_ROLES.福德宮;
  const roleJi = PALACE_ENGINEERING_ROLES[palaceJi.name] || PALACE_ENGINEERING_ROLES.疾厄宮;

  // 5. 解析流年命宮主星特色
  const mingStars = originPalaceAtYearlyBranch ? originPalaceAtYearlyBranch.mainStars.map((s) => s.name) : [];
  let mingStarDesc = '';
  if (mingStars.length > 0) {
    const matched = mingStars.map((sn) => MAIN_STAR_CAREER_STYLES[sn]).filter(Boolean);
    mingStarDesc = matched.length > 0 ? matched.join('；') : '具備敏捷靈活的臨場應變力';
  } else {
    mingStarDesc = '藉對宮星曜借力打力，具備靈活整合多方人脈與資源的彈性與包容力';
  }

  const mingPalaceName = originPalaceAtYearlyBranch ? originPalaceAtYearlyBranch.name : '本命命宮';

  // 6. 依命盤實際宮位與四化星曜組合，產出千人千面的個人化職場評述 (P2-D)
  const devInterpretations = [
    {
      domain: '事業發展與突破 (Career)',
      highlight: `流年命宮【${mingPalaceName}】逢 ${mingStars.join('、') || '借星'} 之氣`,
      factor: `化祿【${yearlySiHua.lu}】入【${palaceLu.name}】`,
      content: `在 ${targetYear} (${yearlyGan}${yearlyZhi}年)，流年命宮坐落本命【${mingPalaceName}】，${mingStarDesc}。流年祿星【${yearlySiHua.lu}】照耀你的【${palaceLu.name}】（${roleLu.theme}），${roleLu.lu}。今年最適合在此領域深耕突破，容易產出令人驚豔的成果。`,
    },
    {
      domain: '團隊協同與話語權 (Collaboration)',
      highlight: `流年權星【${yearlySiHua.quan}】坐鎮【${palaceQuan.name}】`,
      factor: `化權【${yearlySiHua.quan}】入【${palaceQuan.name}】`,
      content: `流年化權星【${yearlySiHua.quan}】進入你的本命【${palaceQuan.name}】（${roleQuan.theme}），${roleQuan.quan}。在重要會議與關鍵決策中你的主張極具分量，善於引領方向能為團隊凝聚強大戰鬥力。`,
    },
    {
      domain: '風險防護與避坑 (Caution & Risk)',
      highlight: `流年忌星【${yearlySiHua.ji}】警示【${palaceJi.name}】`,
      factor: `化忌【${yearlySiHua.ji}】入【${palaceJi.name}】`,
      content: `流年化忌星【${yearlySiHua.ji}】落入本命【${palaceJi.name}】（${roleJi.theme}），提醒你此領域是今年最需留意的潛在防線：${roleJi.ji}。做出重大改變前務必三思而行、預留後路並多聽身邊人意見，防患未然即可安度波折。`,
    },
    {
      domain: '身心健康與靈性精力 (Health & Energy)',
      highlight: `科星護持【${palaceKe.name}】· 守護身心平衡`,
      factor: `化科【${yearlySiHua.ke}】入【${palaceKe.name}】`,
      content: `流年化科星【${yearlySiHua.ke}】入本命【${palaceKe.name}】（${roleKe.theme}），${roleKe.ke}。建議生活與工作空間保持通風與舒適配置，維持「專注做事 50 分鐘、伸展遠眺放鬆」節奏，充足精力是迎接每一天的最佳後盾。`,
    },
  ];

  return {
    year: targetYear,
    yearlyGanZhi: `${yearlyGan}${yearlyZhi}`,
    yearlyZodiac,
    yearlyMingBranch: yearlyZhi,
    originPalaceName: mingPalaceName,
    yearlySiHua,
    palacePlacements: {
      lu: { star: yearlySiHua.lu, palace: palaceLu.name, theme: roleLu.theme },
      quan: { star: yearlySiHua.quan, palace: palaceQuan.name, theme: roleQuan.theme },
      ke: { star: yearlySiHua.ke, palace: palaceKe.name, theme: roleKe.theme },
      ji: { star: yearlySiHua.ji, palace: palaceJi.name, theme: roleJi.theme },
    },
    engineVersion: '2026.2',
    devInterpretations,
  };
}

module.exports = {
  PALACE_NAMES,
  BUREAU_NAMES,
  SI_HUA_MAP,
  STAR_BRIGHTNESS,
  PALACE_DEV_ROLES,
  calculateZiweiChart,
  calculateYearlyFortune,
};
