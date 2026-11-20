// Builds the static GitHub Pages site into dist/.
//
//   1. copy public/ -> dist/
//   2. bundle static/local-api.js (server routes + libs + browser shims + embedded
//      sql.js wasm) -> dist/js/local-api.js
//   3. load local-api.js in dist/index.html before the app scripts
//
// Usage: npm run build:static

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

const bundleBytes = Object.values(result.metafile.outputs).find((o) => o.entryPoint)?.bytes ?? 0;
console.log(`Static site built in dist/ (local-api.js ${(bundleBytes / 1024).toFixed(0)} KB)`);
