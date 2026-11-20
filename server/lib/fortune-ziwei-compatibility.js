/**
 * server/lib/fortune-ziwei-compatibility.js
 * 紫微斗數雙人合盤核心比較引擎（純函式、雙向 A→B / B→A、無總分、附規則依據）
 *
 * 依據：docs/FORTUNE-ZIWEI-COMPATIBILITY-RESEARCH-PLAN.md (rulesetId: ziwei-compatibility-v1)
 */

const { ZHI } = require('./fortune-lunar');
const { SI_HUA_MAP } = require('./fortune-ziwei');
const { normalizeBirthInput, createValidationError } = require('./fortune-birth-normalizer');
const { calculateCanonicalZiweiChart } = require('./fortune-ziwei-engine-adapter');

const RULESET_ID = 'ziwei-compatibility-v1';
const RULES_VERSION = '1.0.0';
const CONTENT_VERSION = '1.0.0';
const SOURCE_ID = 'zuto-ziwei-compatibility-v1-reviewed';

const HUA_META = Object.freeze({
  lu: { key: 'lu', label: '化祿', labelEn: 'Lu (Flow / Affluence)' },
  quan: { key: 'quan', label: '化權', labelEn: 'Quan (Authority / Drive)' },
  ke: { key: 'ke', label: '化科', labelEn: 'Ke (Clarity / Reputation)' },
  ji: { key: 'ji', label: '化忌', labelEn: 'Ji (Attachment / Friction)' },
});

const HUA_ORDER = ['lu', 'quan', 'ke', 'ji'];

const KEY_OVERLAY_PALACES = new Set(['ming', 'fuqi', 'fude']);

function getPalaceById(chart, palaceId) {
  return chart.palaces.find((p) => p.palaceId === palaceId) || null;
}

function getPalaceByBranch(chart, branchIndex) {
  return chart.palaces.find((p) => p.branchIndex === branchIndex) || null;
}

/**
 * 1. 各自關係主題（命宮、夫妻宮、福德宮）
 */
function buildIndividualTheme(chart) {
  const targetIds = ['ming', 'fuqi', 'fude'];
  return targetIds.map((palaceId) => {
    const palace = getPalaceById(chart, palaceId);
    const opposite = getPalaceByBranch(chart, palace.sanFangSiZheng.oppositeBranchIndex);
    return {
      palaceId: palace.palaceId,
      palaceName: palace.name,
      branchIndex: palace.branchIndex,
      branch: palace.branch,
      stemBranch: palace.stemBranch,
      isEmptyPalace: palace.isEmptyPalace,
      mainStars: palace.mainStars,
      minorStars: palace.minorStars,
      borrowedOppositeReference: palace.isEmptyPalace && opposite
        ? {
            sourcePalaceId: opposite.palaceId,
            sourcePalaceName: opposite.name,
            sourceBranch: opposite.branch,
            mainStars: opposite.mainStars,
          }
        : null,
    };
  });
}

/**
 * 2. 命宮／夫妻宮對照（明確區分本宮同宮與三方四正會照）
 */
function buildMingFuqiDirection(originChart, targetChart, direction) {
  const originFuqi = getPalaceById(originChart, 'fuqi');
  const targetMing = getPalaceById(targetChart, 'ming');

  const originFuqiMainNames = originFuqi.mainStars.map((s) => s.name);
  const targetMingMainNames = targetMing.mainStars.map((s) => s.name);

  const directSharedMainStars = originFuqiMainNames.filter((name) => targetMingMainNames.includes(name));

  // 三方四正擴充（明確標示來源宮位，不與同宮混為一談）
  const targetMingSanFangBranches = [
    targetMing.sanFangSiZheng.oppositeBranchIndex,
    targetMing.sanFangSiZheng.sanHe1BranchIndex,
    targetMing.sanFangSiZheng.sanHe2BranchIndex,
  ];
  const sanFangMatches = [];
  const seenSanFangStars = new Set();

  for (const bIdx of targetMingSanFangBranches) {
    const p = getPalaceByBranch(targetChart, bIdx);
    if (!p) continue;
    for (const ms of p.mainStars) {
      if (originFuqiMainNames.includes(ms.name) && !directSharedMainStars.includes(ms.name) && !seenSanFangStars.has(ms.name)) {
        seenSanFangStars.add(ms.name);
        sanFangMatches.push({
          starId: ms.name,
          targetSourcePalaceId: p.palaceId,
          targetSourcePalaceName: p.name,
          targetSourceBranch: p.branch,
          relationType: bIdx === targetMing.sanFangSiZheng.oppositeBranchIndex ? 'opposite' : 'san_he',
        });
      }
    }
  }

  return {
    direction,
    originPerson: originChart.personKey,
    targetPerson: targetChart.personKey,
    originPalace: {
      palaceId: originFuqi.palaceId,
      palaceName: originFuqi.name,
      branch: originFuqi.branch,
      mainStars: originFuqi.mainStars,
      minorStars: originFuqi.minorStars,
    },
    targetPalace: {
      palaceId: targetMing.palaceId,
      palaceName: targetMing.name,
      branch: targetMing.branch,
      mainStars: targetMing.mainStars,
      minorStars: targetMing.minorStars,
    },
    directSharedMainStars,
    sanFangMatches,
  };
}

/**
 * 3. 地支疊宮（固定子=0..亥=11，並提供 A→B / B→A 重點宮位對照）
 */
function buildBranchOverlays(chartA, chartB) {
  const byBranch = ZHI.map((branch, branchIndex) => {
    const palaceA = getPalaceByBranch(chartA, branchIndex);
    const palaceB = getPalaceByBranch(chartB, branchIndex);
    return {
      branchIndex,
      branch,
      personA: palaceA
        ? {
            palaceId: palaceA.palaceId,
            palaceName: palaceA.name,
            stemBranch: palaceA.stemBranch,
            mainStars: palaceA.mainStars.map((s) => s.name),
          }
        : null,
      personB: palaceB
        ? {
            palaceId: palaceB.palaceId,
            palaceName: palaceB.name,
            stemBranch: palaceB.stemBranch,
            mainStars: palaceB.mainStars.map((s) => s.name),
          }
        : null,
    };
  });

  const mapKeyPalaces = (originChart, targetChart, direction) =>
    ['ming', 'fuqi', 'fude'].map((palaceId) => {
      const originP = getPalaceById(originChart, palaceId);
      const targetP = getPalaceByBranch(targetChart, originP.branchIndex);
      return {
        direction,
        originPerson: originChart.personKey,
        targetPerson: targetChart.personKey,
        branchIndex: originP.branchIndex,
        branch: originP.branch,
        originPalaceId: originP.palaceId,
        originPalaceName: originP.name,
        targetPalaceId: targetP.palaceId,
        targetPalaceName: targetP.name,
      };
    });

  return {
    byBranch,
    A_to_B: mapKeyPalaces(chartA, chartB, 'A_to_B'),
    B_to_A: mapKeyPalaces(chartB, chartA, 'B_to_A'),
  };
}

/**
 * 4. 本命年干四化跨盤星名對照（Section 5.3 精確演算法）
 */
function buildCrossChartSiHuaDirection(originChart, targetChart, direction) {
  const stem = originChart.yearStem;
  const siHuaTable = SI_HUA_MAP[stem];
  const entries = [];

  for (const huaType of HUA_ORDER) {
    const huaMeta = HUA_META[huaType];
    const starId = siHuaTable[huaType];
    const matches = targetChart.starLocations.get(starId) || [];

    if (matches.length === 1) {
      const m = matches[0];
      entries.push({
        direction,
        originPerson: originChart.personKey,
        targetPerson: targetChart.personKey,
        originLayer: 'natal_year_stem',
        method: 'cross_chart_star_mapping',
        stem,
        huaType,
        huaLabel: huaMeta.label,
        starId,
        isMainStar: m.isMainStar,
        targetPalaceId: m.palaceId,
        targetPalaceName: m.palaceName,
        targetBranchIndex: m.branchIndex,
        targetBranch: m.branch,
        status: 'matched',
      });
    } else if (matches.length === 0) {
      entries.push({
        direction,
        originPerson: originChart.personKey,
        targetPerson: targetChart.personKey,
        originLayer: 'natal_year_stem',
        method: 'cross_chart_star_mapping',
        stem,
        huaType,
        huaLabel: huaMeta.label,
        starId,
        isMainStar: null,
        targetPalaceId: null,
        targetPalaceName: null,
        targetBranchIndex: null,
        targetBranch: null,
        status: 'uncovered',
      });
    } else {
      entries.push({
        direction,
        originPerson: originChart.personKey,
        targetPerson: targetChart.personKey,
        originLayer: 'natal_year_stem',
        method: 'cross_chart_star_mapping',
        stem,
        huaType,
        huaLabel: huaMeta.label,
        starId,
        isMainStar: null,
        targetPalaceId: null,
        targetPalaceName: null,
        targetBranchIndex: null,
        targetBranch: null,
        status: 'ambiguous',
        anomalyCount: matches.length,
        anomalyPalaces: matches.map((m) => ({ palaceId: m.palaceId, palaceName: m.palaceName, branch: m.branch })),
      });
    }
  }

  return entries;
}

/**
 * 5. 已審閱解讀規則產生器（每條必帶 ruleId, methodId, direction, category, sourceId, reviewStatus, version, evidence）
 */
const SIHUA_PALACE_INTERPRETATIONS = Object.freeze({
  lu: {
    fuqi: {
      category: 'support',
      zhTitle: '生年化祿星落入對方夫妻宮',
      enTitle: 'Natal Lu Star Lands in Partner Spouse Palace',
      zhText: '傳統上代表互動中容易展現欣賞、親和與情感資源流通，雙方較易感受到被照顧與正面的親密氛圍。',
      enText: 'Traditionally indicates warmth, appreciation, and smooth emotional exchange in couple interaction.',
      zhPrompt: '你們最容易讓彼此感到被肯定或被照顧的日常小事是什麼？',
      enPrompt: 'What small daily gestures make each of you feel most appreciated and cared for?',
    },
    ming: {
      category: 'support',
      zhTitle: '生年化祿星落入對方命宮',
      enTitle: 'Natal Lu Star Lands in Partner Life Palace',
      zhText: '傳統詮釋偏向自然好感與接納度高，相處時較容易看見對方的優點並給予善意回應。',
      enText: 'Traditionally suggests natural goodwill and acceptance, making it easier to see each other’s strengths.',
      zhPrompt: '初次相處或意見不同時，你們如何維持這份善意與耐心？',
      enPrompt: 'How do you preserve this goodwill and patience when opinions differ?',
    },
    fude: {
      category: 'support',
      zhTitle: '生年化祿星落入對方福德宮',
      enTitle: 'Natal Lu Star Lands in Partner Fortune & Virtue Palace',
      zhText: '傳統上表示精神層面與休閒節奏容易互相滋養，在一起時較能放鬆心情、共享生活樂趣。',
      enText: 'Traditionally points to mental comfort and shared enjoyment during downtime together.',
      zhPrompt: '有哪些共同興趣或放鬆方式能讓你們一起充電？',
      enPrompt: 'What shared hobbies or downtime routines help both of you recharge?',
    },
    caibo: {
      category: 'support',
      zhTitle: '生年化祿星落入對方財帛宮',
      enTitle: 'Natal Lu Star Lands in Partner Wealth Palace',
      zhText: '傳統上偏向資源觀念與合作回饋感較順，適合一起討論生活支出或共同目標。',
      enText: 'Traditionally favors smoother financial cooperation and practical resource sharing.',
      zhPrompt: '對於共同開銷、儲蓄或財務透明度，你們期待的分工方式是什麼？',
      enPrompt: 'How would you like to divide shared expenses, savings, and financial transparency?',
    },
    tianzhai: {
      category: 'support',
      zhTitle: '生年化祿星落入對方田宅宮',
      enTitle: 'Natal Lu Star Lands in Partner Property & Home Palace',
      zhText: '傳統詮釋重視居家舒適感與安全感，對打造共同生活空間常有正面期待。',
      enText: 'Traditionally highlights comfort and warmth in building a shared home environment.',
      zhPrompt: '你們理想中的居家環境與生活習慣有哪些需要提前對齊？',
      enPrompt: 'What expectations about living space and daily habits should you align on early?',
    },
    jiaoyou: {
      category: 'support',
      zhTitle: '生年化祿星落入對方交友宮',
      enTitle: 'Natal Lu Star Lands in Partner Friends & Peers Palace',
      zhText: '傳統上代表容易融入彼此的朋友圈與人際場合，互動氛圍較親切自然。',
      enText: 'Traditionally suggests ease in blending into each other’s social circles.',
      zhPrompt: '你們各自最重視的朋友聚會頻率與社交界線是什麼？',
      enPrompt: 'What social frequency and friend-group boundaries matter most to each of you?',
    },
    qianyi: {
      category: 'support',
      zhTitle: '生年化祿星落入對方遷移宮',
      enTitle: 'Natal Lu Star Lands in Partner Travel & External Palace',
      zhText: '傳統詮釋偏向外出旅行、跨出舒適圈或共同對外互動時容易有順暢愉快的體驗。',
      enText: 'Traditionally favors enjoyable shared travel and external social experiences.',
      zhPrompt: '一起旅行或面對陌生環境時，你們偏好怎樣的行程節奏？',
      enPrompt: 'When traveling or navigating new environments together, what pace works best?',
    },
  },
  quan: {
    fuqi: {
      category: 'coordinate',
      zhTitle: '生年化權星落入對方夫妻宮',
      enTitle: 'Natal Quan Star Lands in Partner Spouse Palace',
      zhText: '傳統上代表關係中主導意識與推動力較強，能積極推進承諾，但也需留意掌控感與語氣界線。',
      enText: 'Traditionally indicates strong drive and commitment in the relationship, requiring mindful boundaries around control.',
      zhPrompt: '做重大決定時，你們如何確保雙方都有發聲與選擇空間？',
      enPrompt: 'When making big decisions, how do you ensure both partners have an equal voice?',
    },
    ming: {
      category: 'coordinate',
      zhTitle: '生年化權星落入對方命宮',
      enTitle: 'Natal Quan Star Lands in Partner Life Palace',
      zhText: '傳統詮釋偏向對彼此有推動與要求，容易激發行動力，同時要避免把期待變成單向壓力。',
      enText: 'Traditionally suggests mutual motivation and high standards, which works best without one-sided pressure.',
      zhPrompt: '當一方想快速推進而另一方想慢一點時，你們的協調暗號是什麼？',
      enPrompt: 'When one partner wants to move fast and the other wants to pause, how do you signal and adjust?',
    },
    guanlu: {
      category: 'support',
      zhTitle: '生年化權星落入對方官祿宮',
      enTitle: 'Natal Quan Star Lands in Partner Career Palace',
      zhText: '傳統上表示在工作目標與行事節奏上容易互相督促或支援，適合做彼此的行動夥伴。',
      enText: 'Traditionally reflects mutual encouragement in career goals and execution.',
      zhPrompt: '在工作忙碌期，你們希望對方如何支持而不覺得被干預？',
      enPrompt: 'During busy work periods, what kind of support feels helpful rather than intrusive?',
    },
    jiaoyou: {
      category: 'coordinate',
      zhTitle: '生年化權星落入對方交友宮',
      enTitle: 'Natal Quan Star Lands in Partner Friends & Peers Palace',
      zhText: '傳統詮釋提醒在朋友圈或人際互動中主見較強，需留意對彼此社交圈的尊重與分寸。',
      enText: 'Traditionally notes strong opinions around social circles, calling for mutual respect in peer boundaries.',
      zhPrompt: '當對彼此的朋友或同事有不同看法時，你們如何溝通才不會傷和氣？',
      enPrompt: 'How do you share differing views about each other’s friends or colleagues respectfully?',
    },
    qianyi: {
      category: 'coordinate',
      zhTitle: '生年化權星落入對方遷移宮',
      enTitle: 'Natal Quan Star Lands in Partner Travel & External Palace',
      zhText: '傳統上表示在外表現或規劃行程時容易由一方主導，事先分工能減少出門摩擦。',
      enText: 'Traditionally points to one partner taking the lead externally; agreeing on roles early avoids friction.',
      zhPrompt: '外出或對外溝通時，哪些事適合由誰主導、哪些事需要先商量？',
      enPrompt: 'In external plans or travel, which decisions can one lead and which need joint agreement?',
    },
  },
  ke: {
    fuqi: {
      category: 'support',
      zhTitle: '生年化科星落入對方夫妻宮',
      enTitle: 'Natal Ke Star Lands in Partner Spouse Palace',
      zhText: '傳統上象徵理性溝通、互相尊重與講道理的相處模式，遇事較能用體面且溫和的方式討論。',
      enText: 'Traditionally signifies respectful, articulate communication and mutual courtesy in conflict resolution.',
      zhPrompt: '發生爭執時，什麼樣的溝通方式能讓你們冷靜下來好好談？',
      enPrompt: 'During disagreements, what communication style helps both of you stay calm and constructive?',
    },
    ming: {
      category: 'support',
      zhTitle: '生年化科星落入對方命宮',
      enTitle: 'Natal Ke Star Lands in Partner Life Palace',
      zhText: '傳統詮釋認為彼此容易欣賞對方的氣質、專業或談吐，相處上重視信任與名聲分寸。',
      enText: 'Traditionally indicates appreciation for each other’s character, intellect, and mutual respect.',
      zhPrompt: '在親友或公開場合中，你們最重視彼此維持哪些相處禮貌與界線？',
      enPrompt: 'In social or family settings, what boundaries and courtesies matter most to you both?',
    },
    fude: {
      category: 'support',
      zhTitle: '生年化科星落入對方福德宮',
      enTitle: 'Natal Ke Star Lands in Partner Fortune & Virtue Palace',
      zhText: '傳統上偏向精神共鳴與價值觀整理，能透過深度對話幫彼此釐清思緒。',
      enText: 'Traditionally supports thoughtful dialogue and clarity around personal values.',
      zhPrompt: '多久安排一次沒有手機打擾的深度聊天比較適合你們？',
      enPrompt: 'How often would you like to set aside distraction-free time for deep conversations?',
    },
    jiaoyou: {
      category: 'support',
      zhTitle: '生年化科星落入對方交友宮',
      enTitle: 'Natal Ke Star Lands in Partner Friends & Peers Palace',
      zhText: '傳統上代表在共同社交場合表現得體、互相留面子，也容易成為彼此的理性相談對象。',
      enText: 'Traditionally indicates poise in shared social settings and thoughtful peer-like counsel.',
      zhPrompt: '在朋友面前，什麼樣的互動方式會讓你們都感到被尊重？',
      enPrompt: 'Around friends, what kind of interaction makes both of you feel respected?',
    },
    qianyi: {
      category: 'support',
      zhTitle: '生年化科星落入對方遷移宮',
      enTitle: 'Natal Ke Star Lands in Partner Travel & External Palace',
      zhText: '傳統詮釋偏向對外形象協調、出門相處有禮有節，容易給旁人穩定可靠的印象。',
      enText: 'Traditionally suggests a composed, mutually respectful presence when out in public together.',
      zhPrompt: '你們期待彼此在公開場合展現怎樣的默契與分寸？',
      enPrompt: 'What kind of teamwork and boundaries do you appreciate when out in public together?',
    },
  },
  ji: {
    fuqi: {
      category: 'coordinate',
      zhTitle: '生年化忌星落入對方夫妻宮',
      enTitle: 'Natal Ji Star Lands in Partner Spouse Palace',
      zhText: '傳統上代表特別在意與牽掛這段關係，但也容易在親密界線、安全感或執著點上產生反覆摩擦；這是需要練習的課題，而非單一斷言。',
      enText: 'Traditionally reflects deep emotional investment and sensitivity around boundaries; it marks a growth area rather than a negative verdict.',
      zhPrompt: '當其中一方感到不安或想確認關係時，最有效的安撫與界線約定是什麼？',
      enPrompt: 'When either of you feels insecure or overly worried, what reassurance and boundaries help most?',
    },
    ming: {
      category: 'coordinate',
      zhTitle: '生年化忌星落入對方命宮',
      enTitle: 'Natal Ji Star Lands in Partner Life Palace',
      zhText: '傳統詮釋偏向對對方的行為細節特別敏感、容易放在心上；若能把「在意」轉成清楚表達需求，較不易累積誤會。',
      enText: 'Traditionally indicates heightened sensitivity to each other’s habits; expressing needs directly prevents silent buildup.',
      zhPrompt: '有哪些小習慣容易踩到對方的地雷？你們願意怎麼提前講開？',
      enPrompt: 'Which small habits tend to trigger frustration, and how can you address them openly?',
    },
    fude: {
      category: 'coordinate',
      zhTitle: '生年化忌星落入對方福德宮',
      enTitle: 'Natal Ji Star Lands in Partner Fortune & Virtue Palace',
      zhText: '傳統上代表情緒消化節奏不同或內心容易過度思慮，需要留給彼此獨處與冷靜空間。',
      enText: 'Traditionally points to different emotional processing speeds and the need for personal space.',
      zhPrompt: '心情低落或壓力大時，你偏好立刻傾訴還是先獨處一段時間？',
      enPrompt: 'When stressed, do you prefer talking immediately or taking quiet time first?',
    },
    caibo: {
      category: 'coordinate',
      zhTitle: '生年化忌星落入對方財帛宮',
      enTitle: 'Natal Ji Star Lands in Partner Wealth Palace',
      zhText: '傳統上提醒在金錢使用習慣、風險承受度或價值交換感上較容易產生焦慮，建議將財務規則說清楚。',
      enText: 'Traditionally highlights potential differences in spending habits or financial anxiety that benefit from clear agreements.',
      zhPrompt: '關於消費習慣、儲蓄比例與各自保留的零用金，你們的底線是什麼？',
      enPrompt: 'What are your boundaries around personal spending, savings ratios, and discretionary money?',
    },
    jiaoyou: {
      category: 'coordinate',
      zhTitle: '生年化忌星落入對方交友宮',
      enTitle: 'Natal Ji Star Lands in Partner Friends & Peers Palace',
      zhText: '傳統上代表對彼此的朋友互動或異性／同儕社交界線較敏感，需要明確約定而非猜測。',
      enText: 'Traditionally indicates sensitivity around social circles or peer boundaries, best handled with clear agreements.',
      zhPrompt: '對於單獨與朋友聚會、報備或社交界線，你們各自能感到安心的標準是什麼？',
      enPrompt: 'What expectations around solo hangouts and social boundaries help both of you feel secure?',
    },
    qianyi: {
      category: 'coordinate',
      zhTitle: '生年化忌星落入對方遷移宮',
      enTitle: 'Natal Ji Star Lands in Partner Travel & External Palace',
      zhText: '傳統詮釋提醒外出變動、遠行適應或對外壓力下較容易出現急躁，預留緩衝時間能降低摩擦。',
      enText: 'Traditionally notes potential impatience during travel changes or external stress; building in buffer time helps.',
      zhPrompt: '當行程臨時變動或在外遇到突發狀況時，你們如何先安撫情緒再處理問題？',
      enPrompt: 'When plans change unexpectedly away from home, how do you stay calm and solve it together?',
    },
  },
});

function buildMatchedRules(chartA, chartB, facts) {
  const matchedRules = [];

  const addRule = (rule) => {
    matchedRules.push({
      ...rule,
      sourceId: SOURCE_ID,
      reviewStatus: 'reviewed',
      version: RULES_VERSION,
      timeLayer: 'natal',
    });
  };

  // A. 本命四化跨盤星名對照規則（雙向獨立）
  const processSiHuaList = (list) => {
    for (const item of list) {
      if (item.status !== 'matched') continue;
      const spec = SIHUA_PALACE_INTERPRETATIONS[item.huaType]?.[item.targetPalaceId];
      if (!spec) continue;
      addRule({
        ruleId: `sihua_${item.direction}_${item.huaType}_${item.targetPalaceId}`,
        methodId: 'cross_chart_star_mapping',
        direction: item.direction,
        category: spec.category,
        title: {
          zh: `${item.originPerson}→${item.targetPerson}：${spec.zhTitle}（${item.stem}干${item.huaLabel}「${item.starId}」→ ${item.targetPerson} ${item.targetPalaceName}）`,
          en: `${item.originPerson}→${item.targetPerson}: ${spec.enTitle} (${item.starId} → ${item.targetPerson} ${item.targetPalaceName})`,
        },
        traditionalInterpretation: {
          zh: spec.zhText,
          en: spec.enText,
        },
        discussionPrompts: {
          zh: spec.zhPrompt,
          en: spec.enPrompt,
        },
        evidence: {
          originPerson: item.originPerson,
          targetPerson: item.targetPerson,
          originLayer: item.originLayer,
          stem: item.stem,
          huaType: item.huaType,
          starId: item.starId,
          targetPalaceId: item.targetPalaceId,
          targetPalaceName: item.targetPalaceName,
          targetBranch: item.targetBranch,
        },
      });
    }
  };

  processSiHuaList(facts.crossChartSiHua.A_to_B);
  processSiHuaList(facts.crossChartSiHua.B_to_A);

  // B. 命宮／夫妻宮主星共鳴（雙向獨立）
  const processMingFuqi = (mf) => {
    if (mf.directSharedMainStars.length > 0) {
      addRule({
        ruleId: `ming_fuqi_direct_${mf.direction}`,
        methodId: 'ming_fuqi_resonance',
        direction: mf.direction,
        category: 'support',
        title: {
          zh: `${mf.originPerson}→${mf.targetPerson}：${mf.originPerson}夫妻宮與${mf.targetPerson}命宮同見主星（${mf.directSharedMainStars.join('、')}）`,
          en: `${mf.originPerson}→${mf.targetPerson}: Shared main star(s) between ${mf.originPerson} Spouse Palace and ${mf.targetPerson} Life Palace (${mf.directSharedMainStars.join(', ')})`,
        },
        traditionalInterpretation: {
          zh: '傳統合盤觀察中，一方夫妻宮主星與另一方命宮主星相同，常被解讀為對伴侶氣質的想像與對方本命特質有直接呼應。',
          en: 'Traditionally interpreted as a direct alignment between one partner’s relationship expectations and the other’s core temperament.',
        },
        discussionPrompts: {
          zh: '你們覺得對方最吸引自己的特質，和實際日常相處中的表現一致嗎？',
          en: 'Do the qualities that initially attracted you align with how you experience each other day to day?',
        },
        evidence: {
          originPerson: mf.originPerson,
          targetPerson: mf.targetPerson,
          originPalaceId: 'fuqi',
          targetPalaceId: 'ming',
          sharedMainStars: mf.directSharedMainStars,
        },
      });
    }
  };

  processMingFuqi(facts.mingFuqiComparison.A_to_B);
  processMingFuqi(facts.mingFuqiComparison.B_to_A);

  // C. 地支疊宮重點對照（命宮落對方夫妻宮／福德宮／命宮）
  const processOverlay = (overlays) => {
    for (const ov of overlays) {
      if (ov.originPalaceId !== 'ming') continue;
      if (ov.targetPalaceId === 'fuqi') {
        addRule({
          ruleId: `overlay_${ov.direction}_ming_on_fuqi`,
          methodId: 'branch_overlay',
          direction: ov.direction,
          category: 'support',
          title: {
            zh: `${ov.originPerson}→${ov.targetPerson}：${ov.originPerson}命宮地支（${ov.branch}）疊入${ov.targetPerson}夫妻宮`,
            en: `${ov.originPerson}→${ov.targetPerson}: ${ov.originPerson} Life Palace (${ov.branch}) overlays ${ov.targetPerson} Spouse Palace`,
          },
          traditionalInterpretation: {
            zh: '傳統上代表一方的自我核心位置與另一方的伴侶宮位在同一地支座標重疊，互動上較容易產生親密角色感。',
            en: 'Traditionally indicates spatial alignment between one partner’s Life Palace and the other’s Spouse Palace.',
          },
          discussionPrompts: {
            zh: '在關係裡，你們如何平衡「做自己」與「配合伴侶角色」？',
            en: 'How do you balance staying true to yourself while stepping into a supportive partner role?',
          },
          evidence: {
            originPerson: ov.originPerson,
            targetPerson: ov.targetPerson,
            branch: ov.branch,
            originPalaceId: ov.originPalaceId,
            targetPalaceId: ov.targetPalaceId,
          },
        });
      } else if (ov.targetPalaceId === 'fude') {
        addRule({
          ruleId: `overlay_${ov.direction}_ming_on_fude`,
          methodId: 'branch_overlay',
          direction: ov.direction,
          category: 'support',
          title: {
            zh: `${ov.originPerson}→${ov.targetPerson}：${ov.originPerson}命宮地支（${ov.branch}）疊入${ov.targetPerson}福德宮`,
            en: `${ov.originPerson}→${ov.targetPerson}: ${ov.originPerson} Life Palace (${ov.branch}) overlays ${ov.targetPerson} Fortune & Virtue Palace`,
          },
          traditionalInterpretation: {
            zh: '傳統詮釋偏向精神與情緒層面的陪伴感較強，容易在生活節奏與價值感上產生共鳴。',
            en: 'Traditionally suggests emotional companionship and resonance in lifestyle values.',
          },
          discussionPrompts: {
            zh: '你們在哪些價值觀或生活儀式感上最有共鳴？',
            en: 'Which personal values or daily rituals resonate most strongly between you?',
          },
          evidence: {
            originPerson: ov.originPerson,
            targetPerson: ov.targetPerson,
            branch: ov.branch,
            originPalaceId: ov.originPalaceId,
            targetPalaceId: ov.targetPalaceId,
          },
        });
      } else if (ov.targetPalaceId === 'ming') {
        addRule({
          ruleId: `overlay_${ov.direction}_ming_on_ming`,
          methodId: 'branch_overlay',
          direction: ov.direction,
          category: 'coordinate',
          title: {
            zh: `${ov.originPerson}→${ov.targetPerson}：雙方命宮同落「${ov.branch}」宮位`,
            en: `${ov.originPerson}→${ov.targetPerson}: Both Life Palaces share branch ${ov.branch}`,
          },
          traditionalInterpretation: {
            zh: '傳統上代表兩人宮位結構軸線相似，容易理解彼此處境，但也可能同時放大相似的固執點或盲點。',
            en: 'Traditionally implies parallel life-axis framing—easy mutual understanding, yet similar blind spots may amplify.',
          },
          discussionPrompts: {
            zh: '當你們遇到相似的壓力反應時，誰比較能先退一步提醒彼此？',
            en: 'When both of you react similarly under stress, how do you help each other step back?',
          },
          evidence: {
            originPerson: ov.originPerson,
            targetPerson: ov.targetPerson,
            branch: ov.branch,
            originPalaceId: ov.originPalaceId,
            targetPalaceId: ov.targetPalaceId,
          },
        });
      }
    }
  };

  processOverlay(facts.branchOverlays.A_to_B);
  processOverlay(facts.branchOverlays.B_to_A);

  // D. 若同生年天干，必須明確標註「規則自然結果，非特殊緣分宣稱」
  if (chartA.yearStem === chartB.yearStem) {
    addRule({
      ruleId: 'same_natal_year_stem_note',
      methodId: 'same_year_stem_note',
      direction: 'mutual',
      category: 'insufficient',
      title: {
        zh: `雙方本命年干同為「${chartA.yearStem}」`,
        en: `Both charts share the same natal year stem (${chartA.yearStem})`,
      },
      traditionalInterpretation: {
        zh: '因生年天干相同，A→B 與 B→A 所查的四化星名必然相同；此為天干四化對照表的自然結果，不代表特殊緣分或額外加權。',
        en: 'Because both share the same natal year stem, both directions map the same four SiHua stars—a mathematical consequence of the table, not an extra compatibility claim.',
      },
      discussionPrompts: {
        zh: '相同天干四化星仍會因各自星曜落宮不同而有不同體會，建議對照雙方實際落宮與主星討論。',
        en: 'Even with identical SiHua stars, their palace placements differ—focus on the actual target palaces.',
      },
      evidence: {
        yearStemA: chartA.yearStem,
        yearStemB: chartB.yearStem,
      },
    });
  }

  return matchedRules;
}

/**
 * 主函式：執行雙人合盤（從原始請求輸入到完整結構化回應）
 * @param {object} input { persons: [personA, personB], rulesetId }
 */
function calculateZiweiCompatibility(input) {
  if (!input || typeof input !== 'object') {
    throw createValidationError('INVALID_REQUEST_BODY', '請求內容須為 JSON 物件');
  }

  const rulesetId = input.rulesetId || RULESET_ID;
  if (!Array.isArray(input.persons) || input.persons.length !== 2) {
    throw createValidationError('INVALID_PERSONS_ARRAY', 'persons 須包含剛好 2 位出生者資料（A 與 B）');
  }

  const normA = normalizeBirthInput(input.persons[0], 'A', rulesetId);
  const normB = normalizeBirthInput(input.persons[1], 'B', rulesetId);

  const chartA = calculateCanonicalZiweiChart(normA);
  const chartB = calculateCanonicalZiweiChart(normB);

  const individualThemes = {
    A: buildIndividualTheme(chartA),
    B: buildIndividualTheme(chartB),
  };

  const mingFuqiComparison = {
    A_to_B: buildMingFuqiDirection(chartA, chartB, 'A_to_B'),
    B_to_A: buildMingFuqiDirection(chartB, chartA, 'B_to_A'),
  };

  const branchOverlays = buildBranchOverlays(chartA, chartB);

  const crossChartSiHua = {
    A_to_B: buildCrossChartSiHuaDirection(chartA, chartB, 'A_to_B'),
    B_to_A: buildCrossChartSiHuaDirection(chartB, chartA, 'B_to_A'),
  };

  const comparisonFacts = {
    individualThemes,
    mingFuqiComparison,
    branchOverlays,
    crossChartSiHua,
  };

  const matchedRules = buildMatchedRules(chartA, chartB, comparisonFacts);

  const directionalFindings = {
    A_to_B: matchedRules.filter((r) => r.direction === 'A_to_B'),
    B_to_A: matchedRules.filter((r) => r.direction === 'B_to_A'),
    mutual: matchedRules.filter((r) => r.direction === 'mutual'),
  };

  const summary = {
    hasTotalScore: false,
    support: matchedRules.filter((r) => r.category === 'support'),
    coordinate: matchedRules.filter((r) => r.category === 'coordinate'),
    insufficient: matchedRules.filter((r) => r.category === 'insufficient'),
  };

  const uncoveredOrAmbiguous = [
    ...crossChartSiHua.A_to_B,
    ...crossChartSiHua.B_to_A,
  ].filter((item) => item.status !== 'matched');

  const warnings = [
    {
      code: 'ZI_HOUR_RULE_DIFFERENCE',
      message: '合盤統一採 23:00 子初換日（next_day）；若與單人命盤預設（early_late）不同，請以校正後排盤日期為準。',
    },
    {
      code: 'TRADITIONAL_INTERPRETATION_NOTICE',
      message: '合盤解讀屬傳統命理詮釋與反思對話參考，不作為科學驗證之關係預測或婚姻承諾保證。',
    },
  ];

  if (normA.timeNormalization.isDstActive || normB.timeNormalization.isDstActive) {
    warnings.push({
      code: 'HISTORICAL_DST_DETECTED',
      message: '偵測到出生日期處於台灣歷史夏令時間實施期間，已記錄實際時區偏移並以當地壁鐘時間排盤，未重複扣除。',
    });
  }

  if (
    normA.timeNormalization.utcInstant === normB.timeNormalization.utcInstant &&
    normA.rawInput.chartSex === normB.rawInput.chartSex
  ) {
    warnings.push({
      code: 'IDENTICAL_BIRTH_INPUTS',
      message: '甲、乙兩人正規化後出生時刻與排盤性別相同，屬於同盤／自身對照情境。',
    });
  }

  const formatPublicChart = (c) => ({
    personKey: c.personKey,
    nickname: c.nickname,
    engine: c.engine,
    engineVersion: c.engineVersion,
    yearStem: c.yearStem,
    birthSiHua: c.birthSiHua,
    profile: c.profile,
    palaces: c.palaces,
  });

  return {
    ok: true,
    rulesetId,
    charts: {
      A: formatPublicChart(chartA),
      B: formatPublicChart(chartB),
    },
    normalizedInputs: {
      A: normA,
      B: normB,
    },
    comparisonFacts,
    directionalFindings,
    matchedRules,
    summary,
    coverage: {
      supportedTimeLayer: 'natal',
      unsupportedLayers: ['palace_stem_flying', 'daxian_interaction', 'yearly_interaction'],
      missingOrUncoveredStars: uncoveredOrAmbiguous,
      isCompleteNatalMapping: uncoveredOrAmbiguous.length === 0,
    },
    warnings,
    versions: {
      rulesetId,
      engineVersion: chartA.engineVersion,
      calendarVersion: 'fortune-lunar-1900-2100',
      rulesVersion: RULES_VERSION,
      contentVersion: CONTENT_VERSION,
      sourceId: SOURCE_ID,
    },
  };
}

module.exports = {
  RULESET_ID,
  KEY_OVERLAY_PALACES,
  calculateZiweiCompatibility,
};
