// Browser stand-in for node:path (only join/basename/dirname are needed).

function normalize(p) {
  const out = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return (p.startsWith('/') ? '/' : '') + out.join('/');
}

function join(...parts) {
  return normalize(parts.filter((x) => x !== undefined && x !== '').join('/'));
}

function basename(p) {
  return String(p).split('/').pop();
}

function dirname(p) {
  const n = normalize(String(p));
  const i = n.lastIndexOf('/');
  return i <= 0 ? (n.startsWith('/') ? '/' : '.') : n.slice(0, i);
}

module.exports = { join, basename, dirname, sep: '/' };
