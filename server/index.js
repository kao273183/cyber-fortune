const path = require('node:path');
const express = require('express');
const fortuneRoutes = require('./routes/fortune');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  app.use('/api/fortune', fortuneRoutes);

  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.use((err, _req, res, _next) => {
    console.error('[cyber-fortune] unhandled error:', err);
    res.status(err.status || 500).json({ ok: false, error: err.message || 'Internal Server Error' });
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3100);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Lucky Hour listening on http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
