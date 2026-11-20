/**
 * server/lib/fortune-tarot.js
 * 萊德·偉特 (Rider-Waite-Smith) 78 張標準塔羅牌核心服務層
 * 
 * 核心規範 (依照 docs/FORTUNE-TAROT-IMPLEMENTATION-PLAN.md):
 * 1. 嚴格 78 張完整牌池 (22 大阿爾克那 + 56 小阿爾克那)
 * 2. 密碼學真隨機 Fisher-Yates 洗牌 (crypto.randomInt)
 * 3. 不透明 Slot 抽牌架構：未揭示前絕不提前向前端洩漏真實 cardId
 * 4. 支援單張牌陣 (當下指引) 與三張牌陣 (現況 · 阻礙 · 建議)
 * 5. 正逆位抽牌前鎖定，抽後不允許透過重設方向切換
 * 6. 狀態機與冪等性防重放
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DATA_DIR = path.join(__dirname, 'tarot-data');
const RWS_PATH = path.join(DATA_DIR, 'rws-78.json');

// 記憶體快取
let decksCache = null;
let cardsMapCache = new Map(); // deckId -> Map<cardId, card>

// 活動中的 Reading 會話快取 (定時自動回收過期會話，保存期限 2 小時)
const activeReadings = new Map();
const READING_TTL_MS = 2 * 60 * 60 * 1000;

function cleanupExpiredReadings() {
  const now = Date.now();
  for (const [id, r] of activeReadings.entries()) {
    if (now - r.createdAt > READING_TTL_MS) {
      activeReadings.delete(id);
    }
  }
}

function loadTarotData() {
  if (decksCache) return;

  if (!fs.existsSync(RWS_PATH)) {
    throw new Error(`塔羅牌庫檔案未找到: ${RWS_PATH}`);
  }

  const raw = fs.readFileSync(RWS_PATH, 'utf-8');
  const rwsData = JSON.parse(raw);

  decksCache = {
    [rwsData.deckId]: {
      deckId: rwsData.deckId,
      name: rwsData.name,
      nameEn: rwsData.nameEn,
      editionVersion: rwsData.editionVersion,
      system: rwsData.system,
      description: rwsData.description,
      totalCards: rwsData.totalCards,
      majorCount: rwsData.majorCount,
      minorCount: rwsData.minorCount,
      drawAlgorithm: rwsData.drawAlgorithm,
      updatedAt: rwsData.updatedAt,
      supportedSpreads: rwsData.supportedSpreads,
    },
  };

  const map = new Map();
  for (const card of rwsData.cards) {
    map.set(card.cardId, card);
  }
  cardsMapCache.set(rwsData.deckId, map);
}

/**
 * 取得支援的牌組清單
 */
function getTarotDecks() {
  loadTarotData();
  return Object.values(decksCache);
}

/**
 * 取得指定牌組之 Manifest
 */
function getTarotManifest(deckId = 'rws_standard') {
  loadTarotData();
  const manifest = decksCache[deckId];
  if (!manifest) {
    throw new Error(`找不到指定的牌組: ${deckId}`);
  }
  return manifest;
}

/**
 * 列出指定牌組之全部 78 張卡牌簡明資料 (供圖鑑 Codex、檢索與篩選)
 */
function listTarotCards(deckId = 'rws_standard') {
  loadTarotData();
  const map = cardsMapCache.get(deckId);
  if (!map) {
    throw new Error(`找不到牌庫: ${deckId}`);
  }

  return Array.from(map.values()).map((c) => ({
    cardId: c.cardId,
    nameZh: c.nameZh,
    nameEn: c.nameEn,
    arcana: c.arcana,
    suit: c.suit,
    number: c.number,
    roman: c.roman,
    element: c.element,
    symbol: c.symbol,
    keywords: c.keywords,
  }));
}

/**
 * 查詢單張卡牌完整資料 (含正逆位詳盡釋義、反思提問)
 */
function getTarotCard(cardId, deckId = 'rws_standard') {
  loadTarotData();
  const map = cardsMapCache.get(deckId);
  if (!map) {
    throw new Error(`找不到牌庫: ${deckId}`);
  }
  const card = map.get(cardId);
  if (!card) {
    throw new Error(`找不到卡牌: ${cardId}`);
  }
  return card;
}

/**
 * 取得指定牌組支援的牌陣清單
 */
function getTarotSpreads(deckId = 'rws_standard') {
  const manifest = getTarotManifest(deckId);
  return manifest.supportedSpreads || [];
}

/**
 * 使用密碼學 Fisher-Yates 洗牌演算法
 */
function cryptoShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 建立一次全新的占卜 Reading 會話 (T0 & T2)
 * 洗牌後分配好牌卡與正逆位，但前端僅會收到 opaque slots，翻牌前絕不洩漏牌底
 */
function createTarotReading({
  deckId = 'rws_standard',
  spreadId = 'single',
  allowReversed = true,
  topic = 'general',
  question = '',
  userId = null,
} = {}) {
  cleanupExpiredReadings();
  loadTarotData();

  const manifest = getTarotManifest(deckId);
  const spreads = manifest.supportedSpreads || [];
  const spread = spreads.find((s) => s.spreadId === spreadId);
  if (!spread) {
    throw new Error(`不支援的牌陣: ${spreadId}`);
  }

  const map = cardsMapCache.get(deckId);
  const allCards = Array.from(map.values());
  if (allCards.length !== 78) {
    throw new Error(`牌池數量異常 (目前: ${allCards.length}，預期: 78)`);
  }

  // 1. 使用加密隨機數完全打亂 78 張牌
  const shuffledCards = cryptoShuffle(allCards);

  // 2. 依牌陣所需張數抽取，並決定正逆位
  const cardCount = spread.cardCount;
  const pickedAllocations = [];

  for (let i = 0; i < cardCount; i++) {
    const card = shuffledCards[i];
    const pos = spread.positions[i] || { index: i, nameZh: `牌位 ${i + 1}`, nameEn: `Position ${i + 1}`, focus: '' };
    // 若啟用正逆位，每張獨立以 50% 機率決定方向
    const isReversed = allowReversed ? Boolean(crypto.randomInt(0, 2) === 1) : false;

    pickedAllocations.push({
      slotIndex: i,
      position: pos,
      isReversed,
      isRevealed: false,
      card, // 保留在後端，未揭示前絕不向客戶端回傳
    });
  }

  const readingId = 'tr_' + crypto.randomBytes(12).toString('hex');
  const now = Date.now();

  const readingRecord = {
    readingId,
    deckId,
    spreadId,
    spread,
    allowReversed: Boolean(allowReversed),
    topic: String(topic || 'general').trim(),
    question: String(question || '').trim(),
    userId,
    createdAt: now,
    status: 'ready', // ready -> completed
    allocations: pickedAllocations,
  };

  activeReadings.set(readingId, readingRecord);

  // 返回客戶端安全的摘要 (遮罩所有 card 內容)
  return sanitizeReadingForClient(readingRecord);
}

/**
 * 揭示單張或指定 Slot 之卡牌 (Flip Card)
 */
function revealTarotSlot({ readingId, slotIndex, requestId = '' }) {
  cleanupExpiredReadings();
  const reading = activeReadings.get(readingId);
  if (!reading) {
    throw new Error(`占卜會話不存在或已過期: ${readingId}`);
  }

  const idx = Number(slotIndex);
  const target = reading.allocations.find((a) => a.slotIndex === idx);
  if (!target) {
    throw new Error(`找不到指定的牌位 Slot: ${slotIndex}`);
  }

  // 冪等性防護：若該 Slot 已經翻開，直接回傳結果
  if (!target.isRevealed) {
    target.isRevealed = true;
    target.revealedAt = Date.now();
  }

  // 檢查是否全部牌位皆已翻開
  const allRevealed = reading.allocations.every((a) => a.isRevealed);
  if (allRevealed) {
    reading.status = 'completed';
    reading.completedAt = Date.now();
  }

  return {
    reading: sanitizeReadingForClient(reading),
    revealedSlot: formatRevealedSlot(target),
    allCompleted: allRevealed,
  };
}

/**
 * 一鍵揭示全部牌位 (Reveal All)
 */
function revealAllTarotSlots({ readingId }) {
  cleanupExpiredReadings();
  const reading = activeReadings.get(readingId);
  if (!reading) {
    throw new Error(`占卜會話不存在或已過期: ${readingId}`);
  }

  for (const slot of reading.allocations) {
    slot.isRevealed = true;
    if (!slot.revealedAt) slot.revealedAt = Date.now();
  }

  reading.status = 'completed';
  reading.completedAt = Date.now();

  return {
    reading: sanitizeReadingForClient(reading),
    allCompleted: true,
  };
}

/**
 * 查詢當前占卜進度
 */
function getTarotReading(readingId) {
  cleanupExpiredReadings();
  const reading = activeReadings.get(readingId);
  if (!reading) {
    throw new Error(`占卜會話不存在或已過期: ${readingId}`);
  }
  return sanitizeReadingForClient(reading);
}

/**
 * 格式化已揭示的單個 Slot 資料
 */
function formatRevealedSlot(alloc) {
  const card = alloc.card;
  const isRev = alloc.isReversed;
  const directionText = isRev ? '逆位' : '正位';
  const directionTextEn = isRev ? 'Reversed' : 'Upright';

  const interpretation = isRev ? card.reversed : card.upright;
  const keywords = isRev ? card.keywords.reversed : card.keywords.upright;

  return {
    slotIndex: alloc.slotIndex,
    position: alloc.position,
    isReversed: alloc.isReversed,
    directionText,
    directionTextEn,
    isRevealed: true,
    revealedAt: alloc.revealedAt,
    card: {
      cardId: card.cardId,
      nameZh: card.nameZh,
      nameEn: card.nameEn,
      arcana: card.arcana,
      suit: card.suit,
      number: card.number,
      roman: card.roman,
      element: card.element,
      symbol: card.symbol,
      keywords,
      interpretation,
      questions: card.questions,
    },
  };
}

/**
 * 遮罩未翻開的牌卡資訊，杜絕前端提前偷看 cardId
 */
function sanitizeReadingForClient(reading) {
  return {
    readingId: reading.readingId,
    deckId: reading.deckId,
    spreadId: reading.spreadId,
    spread: reading.spread,
    allowReversed: reading.allowReversed,
    topic: reading.topic,
    question: reading.question,
    status: reading.status,
    createdAt: reading.createdAt,
    completedAt: reading.completedAt || null,
    totalSlots: 78,
    slots: reading.allocations.map((alloc) => {
      if (alloc.isRevealed) {
        return formatRevealedSlot(alloc);
      }
      // 未翻開：只回傳不透明 slotIndex 與牌位名稱，卡牌詳情與正逆位完全隱藏！
      return {
        slotIndex: alloc.slotIndex,
        position: alloc.position,
        isRevealed: false,
      };
    }),
  };
}

module.exports = {
  loadTarotData,
  getTarotDecks,
  getTarotManifest,
  listTarotCards,
  getTarotCard,
  getTarotSpreads,
  createTarotReading,
  revealTarotSlot,
  revealAllTarotSlots,
  getTarotReading,
};
