// Builds the static GitHub Pages site into dist/.
//
//   1. copy public/ -> dist/
//   2. bundle static/local-api.js (server routes + libs + browser shims + embedded
//      sql.js wasm) -> dist/js/local-api.js
//   3. load local-api.js in dist/index.html before the app scripts
//   4. fill the service worker's offline precache list and version (dist/sw.js)
//
// Usage: npm run build:static

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');
const shimDir = path.join(root, 'static', 'shims');
const serverDir = path.join(root, 'server') + path.sep;

// Swap Node-only modules for browser shims, but only for code under server/.
const SHIMS = {
  express: 'express.js',
  'node:crypto': 'crypto.js',
  crypto: 'crypto.js',
  'node:fs': 'fs.js',
  fs: 'fs.js',
  'node:path': 'path.js',
  path: 'path.js',
  '../db': 'db.js',
};

const serverShimPlugin = {
  name: 'server-shims',
  setup(build) {
    build.onResolve({ filter: /^(express|(node:)?(crypto|fs|path)|\.\.\/db)$/ }, (args) => {
      if (!args.importer.startsWith(serverDir)) return undefined;
      return { path: path.join(shimDir, SHIMS[args.path]) };
    });
  },
};

fs.rmSync(distDir, { recursive: true, force: true });
fs.cpSync(publicDir, distDir, { recursive: true });

const result = await esbuild.build({
  entryPoints: [path.join(root, 'static', 'local-api.js')],
  outfile: path.join(distDir, 'js', 'local-api.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  define: { __dirname: '"/server/lib"' },
  // Embed sql.js's wasm as bytes so the page never has to fetch it (works on file:// too).
  loader: { '.wasm': 'binary' },
  plugins: [serverShimPlugin],
  logLevel: 'warning',
  metafile: true,
});

const indexPath = path.join(distDir, 'index.html');
const marker = '<script src="js/core.js"></script>';
const html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes(marker)) {
  throw new Error(`build:static could not find ${marker} in public/index.html`);
}
fs.writeFileSync(indexPath, html.replace(marker, `<script src="js/local-api.js"></script>\n  ${marker}`));

// 4. service worker: precache the app shell, versioned by its content so every deploy
//    that changes it replaces the offline copy. Images are cached as they are viewed.
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [path.relative(distDir, full).split(path.sep).join('/')];
});
const shellFiles = walk(distDir)
  .filter((file) => /^(index\.html|manifest\.webmanifest|css\/.+\.css|js\/.+\.js|icons\/.+\.png)$/.test(file))
  .sort();
const shellHash = crypto.createHash('sha256');
for (const file of shellFiles) shellHash.update(file).update(fs.readFileSync(path.join(distDir, file)));
const swVersion = shellHash.digest('hex').slice(0, 12);
const swPath = path.join(distDir, 'sw.js');
const swSource = fs.readFileSync(swPath, 'utf8');
const swBuilt = swSource
  .replace("const VERSION = 'dev';", `const VERSION = '${swVersion}';`)
  .replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(['./', ...shellFiles])};`);
if (swBuilt === swSource || !swBuilt.includes(swVersion)) {
  throw new Error('build:static could not fill VERSION / PRECACHE in public/sw.js');
}
fs.writeFileSync(swPath, swBuilt);

const bundleBytes = Object.values(result.metafile.outputs).find((o) => o.entryPoint)?.bytes ?? 0;
console.log(`Static site built in dist/ (local-api.js ${(bundleBytes / 1024).toFixed(0)} KB, offline shell ${shellFiles.length} files, sw ${swVersion})`);
