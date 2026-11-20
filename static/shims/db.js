// Browser stand-in for server/db.js: the same SQLite schema and get/all/run
// helpers, running on sql.js (SQLite compiled to WebAssembly). The database
// file is persisted to localStorage, so each visitor keeps their own data.

const SCHEMA_SQL = require('../../server/db-schema');

const STORAGE_KEY = 'cyber-fortune.sqlite.v1';
let db = null;

function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function loadSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? fromBase64(saved) : null;
  } catch {
    return null;
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, toBase64(db.export()));
  } catch (err) {
    // Private mode / quota exceeded: keep working in memory for this tab.
    console.warn('[cyber-fortune] could not persist local database:', err);
  }
}

function initDatabase(SQL) {
  const saved = loadSaved();
  if (saved) {
    try {
      db = new SQL.Database(saved);
      db.exec('SELECT 1');
    } catch (err) {
      console.warn('[cyber-fortune] saved database unreadable, starting fresh:', err);
      db = null;
    }
  }
  if (!db) db = new SQL.Database();
  db.exec(SCHEMA_SQL);
  return db;
}

function requireDb() {
  if (!db) throw new Error('Local database is not ready yet');
  return db;
}

function query(sql, params) {
  const stmt = requireDb().prepare(sql);
  try {
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

function get(sql, ...params) {
  return query(sql, params)[0];
}

function all(sql, ...params) {
  return query(sql, params);
}

function run(sql, ...params) {
  const conn = requireDb();
  conn.run(sql, params);
  const changes = conn.getRowsModified();
  const lastInsertRowid = conn.exec('SELECT last_insert_rowid()')[0]?.values[0][0] ?? 0;
  persist();
  return { changes, lastInsertRowid };
}

module.exports = { initDatabase, get, all, run, get db() { return db; } };
