// Standalone anonymous/cookie session middleware (no external account system required)

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of String(cookieHeader).split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function resolveGuestUser(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  let uid = Number.parseInt(cookies.fortune_uid, 10);
  if (!Number.isFinite(uid) || uid <= 0) {
    uid = 1;
    if (res && typeof res.cookie === 'function') {
      res.cookie('fortune_uid', String(uid), {
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
  }
  return {
    id: uid,
    username: '道友',
    nickname: '道友',
    display_name: '道友',
  };
}

function attachUser(req, res, next) {
  req.user = resolveGuestUser(req, res);
  next();
}

function requireAuth(req, res, next) {
  req.user = resolveGuestUser(req, res);
  next();
}

module.exports = { attachUser, requireAuth };
