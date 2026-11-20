/**
 * server/lib/fortune-oracle.js
 * 台灣傳統靈籤 (媽祖六十甲子籤) 核心服務層：
 * 籤庫管理、依籤號查籤、以及基於 crypto.randomInt() 之等機率後端安全抽籤
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { get, all, run } = require('../db');

const DATA_DIR = path.join(__dirname, 'oracle-data');
const MAZU_60_PATH = path.join(DATA_DIR, 'mazu-60.json');

// 記憶體快取
let collectionsCache = null;
let lotsMapCache = new Map(); // collectionId -> Map<lotNumber, lot>

function loadOracleData() {
  if (collectionsCache) return;

  if (!fs.existsSync(MAZU_60_PATH)) {
    throw new Error(`籤庫檔案未找到: ${MAZU_60_PATH}`);
  }

  const raw = fs.readFileSync(MAZU_60_PATH, 'utf-8');
  const mazuData = JSON.parse(raw);

  collectionsCache = {
    [mazuData.collectionId]: {
      collectionId: mazuData.collectionId,
      name: mazuData.name,
      nameEn: mazuData.nameEn,
      editionVersion: mazuData.editionVersion,
      description: mazuData.description,
      totalLots: mazuData.totalLots,
      hasKingLot: mazuData.hasKingLot,
      kingLotPolicy: mazuData.kingLotPolicy,
      drawAlgorithm: mazuData.drawAlgorithm,
      updatedAt: mazuData.updatedAt,
      supportedTopics: [
        { key: 'general', name: '綜合運勢', icon: 'sparkles' },
        { key: 'career', name: '工作事業', icon: 'briefcase' },
        { key: 'study', name: '學業考試', icon: 'academic' },
        { key: 'love', name: '感情姻緣', icon: 'heart' },
        { key: 'wealth', name: '財運投資', icon: 'cash' },
        { key: 'health', name: '身心健康', icon: 'shield' }
      ]
    }
  };

  const map = new Map();
  for (const lot of mazuData.lots) {
    map.set(Number(lot.lotNumber), lot);
  }
  lotsMapCache.set(mazuData.collectionId, map);
}

/**
 * 取得支援的籤系列表
 */
function getOracleCollections() {
  loadOracleData();
  return Object.values(collectionsCache);
}

/**
 * 取得指定籤系之 Metadata
 * @param {string} collectionId
 */
function getOracleManifest(collectionId = 'mazu_60_jiazi') {
  loadOracleData();
  const manifest = collectionsCache[collectionId];
  if (!manifest) {
    throw new Error(`找不到指定的籤系: ${collectionId}`);
  }
  return manifest;
}

/**
 * 取得指定籤系之簡明清單 (供前端快速下拉或選號盤)
 * @param {string} collectionId
 */
function listOracleLots(collectionId = 'mazu_60_jiazi') {
  loadOracleData();
  const map = lotsMapCache.get(collectionId);
  if (!map) {
    throw new Error(`找不到指定的籤系籤庫: ${collectionId}`);
  }

  return Array.from(map.values()).map((lot) => ({
    lotNumber: lot.lotNumber,
    ganZhi: lot.ganZhi,
    guaRank: lot.guaRank,
    firstLine: lot.poem?.lines?.[0] || '',
    storyTitle: lot.story?.title || ''
  }));
}

/**
 * 依籤號取得單首完整籤詩
 * @param {number|string} lotNumber 1 ~ 60
 * @param {string} collectionId
 */
function getOracleLot(lotNumber, collectionId = 'mazu_60_jiazi') {
  loadOracleData();
  const num = Number(lotNumber);
  const map = lotsMapCache.get(collectionId);
  if (!map) {
    throw new Error(`找不到指定的籤系籤庫: ${collectionId}`);
  }

  const lot = map.get(num);
  if (!lot) {
    throw new Error(`查無籤號 ${lotNumber} (此籤系有效籤號為 1 ~ ${map.size})`);
  }

  return lot;
}

/**
 * 核心抽籤函數：使用 Node.js crypto.randomInt 進行真隨機等機率取籤
 * @param {object} options
 * @param {string} [options.collectionId='mazu_60_jiazi']
 * @param {string} [options.topic='general']
 * @param {string} [options.question='']
 */
function drawOracleLot(options = {}) {
  loadOracleData();
  const { collectionId = 'mazu_60_jiazi', topic = 'general', question = '' } = options;

  const manifest = getOracleManifest(collectionId);
  const map = lotsMapCache.get(collectionId);
  const total = manifest.totalLots || map.size;

  // 使用 crypto.randomInt(min, max) -> [1, total + 1) 等機率離散均勻分佈
  const chosenNumber = crypto.randomInt(1, total + 1);
  const lot = map.get(chosenNumber);

  const drawId = crypto.randomUUID();
  const drawnAt = new Date().toISOString();

  // 若有指定主題，提取特定主題指引
  const topicAdvice = lot.topics?.[topic] || lot.topics?.general || lot.explanation?.summary;

  return {
    drawId,
    drawnAt,
    collectionId,
    collectionName: manifest.name,
    topic,
    question: String(question || '').slice(0, 100), // 限制字數
    lot,
    topicAdvice
  };
}

/**
 * 格式化資料庫回傳之求籤紀錄
 */
function formatOracleRecord(row) {
  if (!row) return null;
  let poemLines = [];
  try {
    poemLines = JSON.parse(row.poem_lines);
  } catch {
    poemLines = [row.poem_lines];
  }
  return {
    id: row.id,
    userId: row.user_id,
    collectionId: row.collection_id,
    editionVersion: row.edition_version,
    lotNumber: row.lot_number,
    ganZhi: row.gan_zhi,
    guaRank: row.gua_rank,
    topic: row.topic,
    question: row.question || '',
    poemLines,
    storyTitle: row.story_title || '',
    storySummary: row.story_summary || '',
    explanationSummary: row.explanation_summary || '',
    topicAdvice: row.topic_advice || '',
    userNotes: row.user_notes || '',
    verifiedStatus: row.verified_status || 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * 保存求籤結果至個人紀錄 (包含不可變快照與個人備註)
 */
function saveOracleRecord(userId, data = {}) {
  if (!userId) {
    throw new Error('未授權：保存求籤紀錄需登入');
  }

  const {
    collectionId = 'mazu_60_jiazi',
    lotNumber,
    topic = 'general',
    question = '',
    userNotes = '',
    verifiedStatus = 'pending'
  } = data;

  const lot = getOracleLot(lotNumber, collectionId);
  const id = `rec_${crypto.randomUUID()}`;
  const status = ['pending', 'fulfilled', 'unfulfilled', 'insight'].includes(verifiedStatus)
    ? verifiedStatus
    : 'pending';

  const topicAdvice = data.topicAdvice || lot.topics?.[topic] || lot.topics?.general || lot.explanation?.summary || '';

  run(
    `INSERT INTO fortune_oracle_records (
      id, user_id, collection_id, edition_version, lot_number,
      gan_zhi, gua_rank, topic, question, poem_lines,
      story_title, story_summary, explanation_summary, topic_advice,
      user_notes, verified_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    Number(userId),
    collectionId,
    lot.editionVersion || '1.0.0',
    Number(lot.lotNumber),
    lot.ganZhi,
    lot.guaRank || '',
    topic,
    String(question || '').slice(0, 200),
    JSON.stringify(lot.poem?.lines || []),
    lot.story?.title || '',
    lot.story?.summary || '',
    lot.explanation?.summary || '',
    topicAdvice,
    String(userNotes || '').slice(0, 2000),
    status
  );

  return getOracleRecordById(id, userId);
}

/**
 * 查詢本人的求籤歷史紀錄列表
 */
function listOracleRecords(userId, options = {}) {
  if (!userId) {
    throw new Error('未授權：查詢求籤紀錄需登入');
  }

  const { topic, status, limit = 50, offset = 0 } = options;
  const conditions = ['user_id = ?'];
  const params = [Number(userId)];

  if (topic && topic !== 'all') {
    conditions.push('topic = ?');
    params.push(topic);
  }

  if (status && status !== 'all') {
    conditions.push('verified_status = ?');
    params.push(status);
  }

  const whereClause = conditions.join(' AND ');
  const countRow = get(`SELECT COUNT(*) as total FROM fortune_oracle_records WHERE ${whereClause}`, ...params);
  const total = countRow?.total || 0;

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const rows = all(
    `SELECT * FROM fortune_oracle_records WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    safeLimit,
    safeOffset
  );

  return {
    records: rows.map(formatOracleRecord),
    total,
    limit: safeLimit,
    offset: safeOffset
  };
}

/**
 * 取得單筆求籤紀錄詳情
 */
function getOracleRecordById(recordId, userId, isAdmin = false) {
  const row = get('SELECT * FROM fortune_oracle_records WHERE id = ?', recordId);
  if (!row) {
    throw new Error(`找不到求籤紀錄: ${recordId}`);
  }
  if (!isAdmin && Number(row.user_id) !== Number(userId)) {
    throw new Error('權限不足：無法檢視他人之求籤紀錄');
  }
  return formatOracleRecord(row);
}

/**
 * 更新求籤紀錄之個人筆記或印證狀態
 */
function updateOracleRecord(recordId, userId, updates = {}, isAdmin = false) {
  const existing = getOracleRecordById(recordId, userId, isAdmin);
  const userNotes = updates.userNotes !== undefined ? String(updates.userNotes).slice(0, 2000) : existing.userNotes;
  let verifiedStatus = existing.verifiedStatus;
  if (updates.verifiedStatus && ['pending', 'fulfilled', 'unfulfilled', 'insight'].includes(updates.verifiedStatus)) {
    verifiedStatus = updates.verifiedStatus;
  }
  const question = updates.question !== undefined ? String(updates.question).slice(0, 200) : existing.question;

  run(
    `UPDATE fortune_oracle_records
     SET user_notes = ?, verified_status = ?, question = ?, updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
    userNotes,
    verifiedStatus,
    question,
    recordId
  );

  return getOracleRecordById(recordId, userId, isAdmin);
}

/**
 * 刪除個人求籤紀錄
 */
function deleteOracleRecord(recordId, userId, isAdmin = false) {
  getOracleRecordById(recordId, userId, isAdmin); // 權限與存在性驗證
  run('DELETE FROM fortune_oracle_records WHERE id = ?', recordId);
  return { ok: true, deletedId: recordId };
}

/**
 * 統計使用者的求籤歷史指標
 */
function getOracleRecordStats(userId) {
  if (!userId) {
    throw new Error('未授權：統計求籤歷史需登入');
  }

  const uId = Number(userId);
  const totalRow = get('SELECT COUNT(*) as total FROM fortune_oracle_records WHERE user_id = ?', uId);
  const total = totalRow?.total || 0;

  const statusRows = all(
    'SELECT verified_status, COUNT(*) as count FROM fortune_oracle_records WHERE user_id = ? GROUP BY verified_status',
    uId
  );
  const statusCounts = { pending: 0, fulfilled: 0, unfulfilled: 0, insight: 0 };
  for (const r of statusRows) {
    if (r.verified_status in statusCounts) {
      statusCounts[r.verified_status] = r.count;
    }
  }

  const topicRows = all(
    'SELECT topic, COUNT(*) as count FROM fortune_oracle_records WHERE user_id = ? GROUP BY topic ORDER BY count DESC',
    uId
  );
  const topicCounts = {};
  for (const r of topicRows) {
    topicCounts[r.topic] = r.count;
  }

  const recentRow = get(
    'SELECT created_at FROM fortune_oracle_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    uId
  );

  return {
    total,
    statusCounts,
    topicCounts,
    lastDrawnAt: recentRow?.created_at || null
  };
}

module.exports = {
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
  getOracleRecordStats
};
