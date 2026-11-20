/**
 * server/lib/fortune-ziwei-engine-adapter.js
 * 紫微斗數排盤引擎 Adapter（統一地支座標 子=0..亥=11、宮位 ID 與主／輔星索引）
 */

const { ZHI } = require('./fortune-lunar');
const { calculateZiweiChart, SI_HUA_MAP } = require('./fortune-ziwei');

const PALACE_ID_BY_NAME = Object.freeze({
  命宮: 'ming',
  兄弟宮: 'xiongdi',
  夫妻宮: 'fuqi',
  子女宮: 'zinv',
  財帛宮: 'caibo',
  疾厄宮: 'jie',
  遷移宮: 'qianyi',
  交友宮: 'jiaoyou',
  官祿宮: 'guanlu',
  田宅宮: 'tianzhai',
  福德宮: 'fude',
  父母宮: 'fumu',
});

const FOURTEEN_MAIN_STARS = Object.freeze([
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞',
  '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍',
]);

function createAdapterError(code, message, details = {}) {
  const err = new Error(message);
  err.code = code;
  err.status = 500;
  err.details = details;
  return err;
}

/**
 * 將 calculateZiweiChart 的輸出轉為合盤用 Canonical Chart，並驗證地支與十四主星唯一性
 * @param {object} normalizedPerson 由 fortune-birth-normalizer 產出
 */
function calculateCanonicalZiweiChart(normalizedPerson) {
  const rawChart = calculateZiweiChart(normalizedPerson.chartInput);

  if (!rawChart || !Array.isArray(rawChart.palaces) || rawChart.palaces.length !== 12) {
    throw createAdapterError('INVALID_PALACE_COUNT', '排盤結果異常：宮位數不為 12');
  }

  const branchSeen = new Set();
  const mainStarCount = new Map();
  const starLocations = new Map(); // starName -> Array<location>

  const canonicalPalaces = rawChart.palaces.map((p) => {
    if (!Number.isInteger(p.branchIndex) || p.branchIndex < 0 || p.branchIndex > 11) {
      throw createAdapterError('INVALID_BRANCH_INDEX', `無效地支座標: ${p.branchIndex}`);
    }
    if (branchSeen.has(p.branchIndex)) {
      throw createAdapterError('DUPLICATE_BRANCH_INDEX', `重複地支座標: ${p.branchIndex}`);
    }
    branchSeen.add(p.branchIndex);

    const palaceId = PALACE_ID_BY_NAME[p.name];
    if (!palaceId) {
      throw createAdapterError('UNKNOWN_PALACE_NAME', `未知宮位名稱: ${p.name}`);
    }

    const recordStar = (star, isMainStar) => {
      const loc = {
        starId: star.name,
        starName: star.name,
        isMainStar,
        type: isMainStar ? 'main' : (star.type || 'minor'),
        brightness: star.brightness || null,
        sihua: star.sihua || null,
        palaceId,
        palaceName: p.name,
        branchIndex: p.branchIndex,
        branch: p.branch,
      };
      if (!starLocations.has(star.name)) {
        starLocations.set(star.name, []);
      }
      starLocations.get(star.name).push(loc);
    };

    for (const ms of p.mainStars) {
      mainStarCount.set(ms.name, (mainStarCount.get(ms.name) || 0) + 1);
      recordStar(ms, true);
    }
    for (const min of p.minorStars) {
      recordStar(min, false);
    }

    const b = p.branchIndex;
    return {
      index: p.index,
      palaceId,
      name: p.name,
      branchIndex: b,
      branch: ZHI[b],
      stem: p.stem,
      stemBranch: p.stemBranch,
      isShenGong: Boolean(p.isShenGong),
      isEmptyPalace: p.mainStars.length === 0,
      mainStars: p.mainStars.map((s) => ({
        starId: s.name,
        name: s.name,
        brightness: s.brightness || null,
        sihua: s.sihua || null,
      })),
      minorStars: p.minorStars.map((s) => ({
        starId: s.name,
        name: s.name,
        type: s.type || 'minor',
        sihua: s.sihua || null,
      })),
      sanFangSiZheng: {
        selfBranchIndex: b,
        oppositeBranchIndex: (b + 6) % 12,
        sanHe1BranchIndex: (b + 4) % 12,
        sanHe2BranchIndex: (b + 8) % 12,
        opposite: p.sanFangSiZheng?.opposite || ZHI[(b + 6) % 12],
        sanHe1: p.sanFangSiZheng?.sanHe1 || ZHI[(b + 4) % 12],
        sanHe2: p.sanFangSiZheng?.sanHe2 || ZHI[(b + 8) % 12],
      },
      daXian: p.daXian || null,
    };
  });

  if (branchSeen.size !== 12) {
    throw createAdapterError('INCOMPLETE_BRANCHES', '排盤結果異常：未涵蓋全部十二地支');
  }

  for (const starName of FOURTEEN_MAIN_STARS) {
    const count = mainStarCount.get(starName) || 0;
    if (count !== 1) {
      throw createAdapterError(
        'INVALID_MAIN_STAR_INVARIANT',
        `十四主星唯一性檢查失敗：${starName} 出現 ${count} 次`,
        { starName, count }
      );
    }
  }

  const yearStem = rawChart.profile?.bazi?.year?.[0];
  if (!yearStem || !SI_HUA_MAP[yearStem]) {
    throw createAdapterError('INVALID_YEAR_STEM', `無效的本命年干: ${yearStem}`);
  }

  return {
    personKey: normalizedPerson.personKey,
    nickname: normalizedPerson.nickname,
    engine: 'orthodox-local',
    engineVersion: rawChart.profile.engineVersion || '2026.3-orthodox',
    rulesetId: normalizedPerson.rulesetId,
    yearStem,
    birthSiHua: rawChart.birthSiHua || SI_HUA_MAP[yearStem],
    profile: rawChart.profile,
    palaces: canonicalPalaces,
    starLocations,
    rawChart,
  };
}

module.exports = {
  PALACE_ID_BY_NAME,
  FOURTEEN_MAIN_STARS,
  calculateCanonicalZiweiChart,
};
