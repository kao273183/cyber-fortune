// Browser stand-in for node:fs. The fortune libs only read two bundled JSON
// data files, so those are embedded into the bundle and served by basename.

const EMBEDDED = {
  'mazu-60.json': () => require('../../server/lib/oracle-data/mazu-60.json'),
  'rws-78.json': () => require('../../server/lib/tarot-data/rws-78.json'),
};

function basename(p) {
  return String(p).split('/').pop();
}

function existsSync(p) {
  return Object.prototype.hasOwnProperty.call(EMBEDDED, basename(p));
}

function readFileSync(p) {
  const loader = EMBEDDED[basename(p)];
  if (!loader) {
    const err = new Error(`ENOENT: no such file (static build): ${p}`);
    err.code = 'ENOENT';
    throw err;
  }
  return JSON.stringify(loader());
}

module.exports = { existsSync, readFileSync };
