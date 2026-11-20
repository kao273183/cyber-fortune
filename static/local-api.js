// Entry point for the static (GitHub Pages) build.
//
// Bundles server/routes/fortune.js and server/lib/* for the browser and serves
// /api/fortune/* requests in-page, so the frontend runs with no backend.
// public/js/core.js routes API calls here whenever window.CyberFortuneLocalApi exists.

const initSqlJs = require('sql.js');
const localDb = require('./shims/db');
const router = require('../server/routes/fortune');

// The SQLite wasm binary is embedded into this bundle (esbuild "binary" loader,
// see static/build.mjs) instead of fetched at runtime. A runtime fetch breaks when
// dist/index.html is opened from disk: Chrome blocks fetch() on file:// URLs.
const wasmBinary = require('sql.js/dist/sql-wasm-browser.wasm');

const API_PREFIX = '/api/fortune';

const ready = initSqlJs({ wasmBinary }).then((SQL) => {
  localDb.initDatabase(SQL);
});
// Requests still reject via `await ready`; this just reports the root cause once.
ready.catch((err) => console.error('[cyber-fortune] local database failed to start:', err));

function handles(url) {
  return typeof url === 'string' && (url === API_PREFIX || url.startsWith(`${API_PREFIX}/`) || url.startsWith(`${API_PREFIX}?`));
}

/** fetch()-compatible: resolves to a real Response object. */
async function localFetch(url, opts = {}) {
  await ready;
  const parsed = new URL(url, 'http://cyber-fortune.local');
  const path = parsed.pathname.slice(API_PREFIX.length) || '/';
  let body;
  if (typeof opts.body === 'string' && opts.body) {
    body = JSON.parse(opts.body);
  }
  const result = await router.handle({
    method: opts.method || 'GET',
    path,
    searchParams: parsed.searchParams,
    body,
  });
  return new Response(result.body, { status: result.status, headers: result.headers });
}

window.CyberFortuneLocalApi = { handles, fetch: localFetch, ready };
