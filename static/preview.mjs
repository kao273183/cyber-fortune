// Serves dist/ under a sub-path, the way GitHub Pages serves a project site
// (https://<user>.github.io/<repo>/), so broken absolute paths show up locally.
//
// Usage: npm run build:static && npm run preview:static

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const express = require('express');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = `/${process.env.PAGES_BASE || 'cyber-fortune'}`;
const port = Number(process.env.PORT || 4173);

const app = express();
app.use(base, express.static(path.join(root, 'dist')));
app.get('/', (_req, res) => res.redirect(`${base}/`));
app.listen(port, () => {
  console.log(`Static preview: http://127.0.0.1:${port}${base}/`);
});
