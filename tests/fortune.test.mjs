import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Use a temporary SQLite DB for tests
const tmpDb = path.join(os.tmpdir(), `cyber-fortune-test-${Date.now()}.db`);
process.env.DB_PATH = tmpDb;

const { createApp } = require('../server/index.js');

test('Cyber Fortune standalone server & API suite', async (t) => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    for (const suffix of ['', '-wal', '-shm']) {
      try { fs.unlinkSync(`${tmpDb}${suffix}`); } catch {}
    }
  });

  await t.test('GET /healthz returns ok', async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  await t.test('GET / serves standalone index.html', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('id="fortune-page-root"'));
    assert.ok(html.includes('js/app.js'));
  });

  await t.test('GET /api/fortune/daily returns almanac data', async () => {
    const res = await fetch(`${baseUrl}/api/fortune/daily`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(body.luck);
    assert.ok(Array.isArray(body.auspicious));
  });

  await t.test('GET /api/fortune/horoscope?sign=scorpio returns zodiac horoscope', async () => {
    const res = await fetch(`${baseUrl}/api/fortune/horoscope?sign=scorpio&lang=zh-TW`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.sign, 'scorpio');
  });

  await t.test('POST /api/fortune/ziwei/chart calculates chart', async () => {
    const res = await fetch(`${baseUrl}/api/fortune/ziwei/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 1996, month: 8, day: 18, hour: 10, gender: 'M' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.chart?.palaces));
    assert.equal(body.chart.palaces.length, 12);
  });

  await t.test('POST /api/fortune/oracle/draw draws a lot and POST /oracle/records persists it', async () => {
    const res = await fetch(`${baseUrl}/api/fortune/oracle/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'work', question: 'Test standalone oracle' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(body.lot);

    const saveRes = await fetch(`${baseUrl}/api/fortune/oracle/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lotNumber: body.lot.lotNumber || body.lot.number || 1,
        topic: 'work',
        question: 'Test standalone oracle',
      }),
    });
    assert.equal(saveRes.status, 201);
    const saveBody = await saveRes.json();
    assert.equal(saveBody.ok, true);
    assert.ok(saveBody.record?.id);
  });

  await t.test('POST /api/fortune/tarot/readings creates a reading', async () => {
    const res = await fetch(`${baseUrl}/api/fortune/tarot/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadId: 'single', question: 'Test standalone tarot' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(body.reading?.readingId);
  });
});
