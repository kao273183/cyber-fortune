# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, all confirmed:

- **Casual daily checkers (primary)**: the general public opening the site on a phone for a few minutes to read today's almanac and their horoscope.
- **Fortune-telling enthusiasts**: people who enter birth data carefully and read Ziwei palace details, star meanings, and natal-chart planets and houses.
- **Sharers**: people using oracle lots and tarot for fun and sending screenshots or copied text to friends.

All three arrive mostly on mobile web; the interface is Traditional Chinese first, with an English toggle.

## Product Purpose

A free, no-signup hub that puts six fortune systems in one place: Taiwanese farmer's almanac (老黃曆), daily zodiac horoscope, Zi Wei Dou Shu charts (single and couple compatibility), Western natal and transit charts, Mazu 60-lot temple oracle (媽祖六十甲子籤), and tarot. Success is a visitor finding today's reading in seconds on a phone, and enthusiasts trusting the charts enough to explore the details.

## Positioning

Six fortune systems in one site, with no download and no account. Neighbors typically cover one system or gate the rest behind an app install or sign-up.

## Operating Context

- Mobile web is the main context: quick glances, one-handed use, sharing via the copy-share button or screenshots.
- Enthusiasts also use desktop for the dense Ziwei 4x4 palace grid and the SVG natal-chart wheel.
- Deployed as a static GitHub Pages site under a sub-path; all calculations run in the browser.

## Capabilities and Constraints

- Six tabs: 老黃曆, 十二星座, 紫微斗數 (single chart, yearly fortune, two-person compatibility), 西洋星盤 (natal + transit, retrograde status), 靈籤求索 (draw, read, save, records), 塔羅占卜 (spreads, reveal, 78-card codex).
- Vanilla HTML/CSS/JS front end (no framework, no build step for the UI); `static/` bundles the calculation code for the browser with esbuild.
- No backend in production: data is stored per visitor in localStorage (SQLite via sql.js). No accounts, no cross-device sync.
- Same results for the same inputs on the same day; the daily almanac and horoscope are seeded by date.
- Bilingual UI (zh-TW default, English), light and dark themes.
- Content is for a general audience; software-engineering jargon was deliberately removed.
- Name: 「吉時行樂 / Lucky Hour」 (decided 2026-11-20). A pun on 及時行樂 (seize the day): 吉時 is the auspicious hour the almanac lists, and Lucky Hour echoes Happy Hour. The header seal reads 吉. Internal identifiers (repo name cyber-fortune, JS globals CyberFortune*, the localStorage key) stay unchanged so saved data and the Pages URL keep working.

## Evidence on Hand

- Mazu 60-lot oracle data: `server/lib/oracle-data/mazu-60.json`.
- Rider-Waite-Smith 78-card tarot data and card art: `server/lib/tarot-data/rws-78.json`, `public/assets/tarot/rws/`.
- Oracle illustrations: `public/img/oracle/` (lot cylinder, stick, slip background).
- No testimonials, user counts, press, or ratings exist; do not invent them.

## Product Principles

1. Today first: the daily reading is reachable in one tap on a phone.
2. Depth on demand: charts stay accurate and detailed for enthusiasts without burdening casual visitors.
3. One home for six systems: the systems share one coherent experience rather than feeling like six bolted-on tools.
4. Shareable by default: readings are easy to copy and screenshot.
5. Entertainment with sincerity: playful where it fits, but traditions such as the temple oracle are presented with respect.
