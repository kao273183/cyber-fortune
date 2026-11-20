---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/css/fortune.css","public/css/base.css","public/js/views-fortune.js"]
---

# Surface: 吉時行樂 app shell (all six tabs)

Mode: Operate. Mobile web first; desktop also used for the Ziwei grid and natal wheel.
Audience and job: casual phone checkers want today's verdict in seconds; enthusiasts read chart details; sharers copy or screenshot a reading.
Constraints: keep all six tabs and every feature, the zh-TW/EN toggle, light and dark themes, and the oracle and tarot image assets. Avoid an AI-generated look, stiffness, and emptiness.
Owner decision (2026-11-20, asked when the phone first screen could not hold the lucky line and share button): 「收合宜忌說明」. On phones (≤480px) the 宜/忌 notes collapse behind a tap so the lucky line and the ink 複製分享 button fit the 390x844 first screen; desktop prints the notes in full.

## Direction contract

THESIS: The whole hub is one living red-and-black farmer's almanac. Every system's result is set as a ruled almanac sheet with a vertical vermilion heading column. It refuses the category's starry purple mystic gradient and the generic soft card stack.

OWN-WORLD: thin almanac paper ground #F4EEDF; vermilion #B8231F and ink #1A1A1A only, with warm gray #6E6A60 for notes; thick-and-thin double vermilion frame; hairline vermilion rules; Noto Serif TC for headings, dates and values, Noto Sans TC for controls and notes; rotated vermilion seal stamps for verdicts; 吉 in red, 凶 in ink. Dark theme reprints the same two inks on ink-black paper.

STORY: Open on a phone, read the seal and 宜/忌 at a glance, check the current hour, switch systems from the underlined tab row; every tab speaks the same sheet grammar, so six tools read as one book.

FIRST VIEWPORT: serif app bar with 中/EN and theme; scrollable tab row, active tab underlined in vermilion; day sheet: big red date numeral, vertical lunar column, rotated 中吉 seal; ruled 今日黃曆 table; 宜 and 忌 columns under red and ink heading blocks; 十二時辰 strip with the current hour filled red; lucky line and ink 複製分享 button.

FORM: 紅黑雙色農民曆, position 1 on the ordered list (pick card, chosen by the user); seed:6fea3748c6c148d5. Signature motion: verdict seals stamp down and settle; sheets slide in with slight weighted overshoot; reduced motion falls back to fades.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
