---
name: 吉時行樂 Lucky Hour
description: Six fortune systems printed as one red-and-black farmer's almanac.
colors:
  vermilion: "#b8231f"
  vermilion-deep: "#8f1a17"
  ink: "#1a1a1a"
  ink-soft: "#3d3830"
  note-gray: "#6e6a60"
  almanac-paper: "#f4eedf"
  paper-shade: "#ece4d0"
  paper-shade-deep: "#e3d8bf"
  paper-sheet: "#fbf7ec"
  ochre-warning: "#8a5a0b"
  on-vermilion: "#f8f1e2"
  vermilion-rule: "rgba(184, 35, 31, 0.32)"
  vermilion-rule-strong: "rgba(184, 35, 31, 0.6)"
  vermilion-wash: "rgba(184, 35, 31, 0.08)"
  ink-hair: "rgba(26, 26, 26, 0.14)"
  ink-hair-strong: "rgba(26, 26, 26, 0.26)"
  dark-paper: "#16120e"
  dark-paper-sheet: "#1b1611"
  dark-ink: "#efe6d2"
  dark-note-gray: "#a69c88"
  dark-vermilion: "#e5554a"
  dark-vermilion-deep: "#f07a6f"
  dark-ochre: "#d9a441"
typography:
  display:
    fontFamily: "Noto Serif TC, Songti TC, PMingLiU, serif"
    fontSize: "clamp(68px, 19vw, 96px)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  seal:
    fontFamily: "Noto Serif TC, Songti TC, PMingLiU, serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.08em"
  headline:
    fontFamily: "Noto Serif TC, Songti TC, PMingLiU, serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Noto Serif TC, Songti TC, PMingLiU, serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
  value:
    fontFamily: "Noto Serif TC, Songti TC, PMingLiU, serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "22px"
  body:
    fontFamily: "Noto Sans TC, PingFang TC, Microsoft JhengHei, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "tnum"
  control:
    fontFamily: "Noto Sans TC, PingFang TC, Microsoft JhengHei, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.04em"
  label-vertical:
    fontFamily: "Noto Serif TC, Songti TC, PMingLiU, serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.2em"
  label-row:
    fontFamily: "Noto Serif TC, Songti TC, PMingLiU, serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
  note:
    fontFamily: "Noto Sans TC, PingFang TC, Microsoft JhengHei, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
  glyph:
    fontFamily: "Noto Sans Symbols, Apple Symbols, Segoe UI Symbol, Noto Serif TC, serif"
    fontSize: "clamp(54px, 15vw, 72px)"
    fontWeight: 400
    lineHeight: 1
rounded:
  hair: "2px"
  sm: "3px"
  md: "4px"
  seal: "7px 5px 8px 6px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  tap: "44px"
  gutter-mobile: "16px"
  gutter-wide: "32px"
components:
  button:
    backgroundColor: "{colors.paper-sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-hover:
    backgroundColor: "{colors.paper-shade}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.almanac-paper}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  button-secondary:
    backgroundColor: "{colors.vermilion-wash}"
    textColor: "{colors.vermilion}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.on-vermilion}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.paper-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  tab:
    textColor: "{colors.note-gray}"
    padding: "0 14px"
    height: "48px"
  tab-active:
    textColor: "{colors.ink}"
  badge:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-brand:
    backgroundColor: "{colors.vermilion-wash}"
    textColor: "{colors.vermilion}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  almanac-sheet:
    backgroundColor: "{colors.paper-sheet}"
    textColor: "{colors.ink}"
  seal:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.on-vermilion}"
    typography: "{typography.seal}"
    rounded: "{rounded.seal}"
    size: "80px"
  seal-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.almanac-paper}"
    rounded: "{rounded.seal}"
    size: "80px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.almanac-paper}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
---

# Design System: 吉時行樂 Lucky Hour

## Overview

**Creative North Star: "The Two-Ink Almanac"**

Every screen is a page of a red-and-black Taiwanese farmer's almanac (紅黑雙色農民曆). Thin cream almanac paper carries exactly two printing inks: vermilion and black, with a warm gray reserved for notes. Each fortune system sets its result as a ruled almanac sheet: a thick-and-thin double vermilion frame, hairline vermilion rules between rows, and a vertical vermilion heading column reading top to bottom. Six tools read as one book because they share one sheet grammar.

The verdict is a rotated vermilion seal stamp, pressed onto the sheet. Good fortune prints red, bad fortune prints ink: 吉 is vermilion, 凶 is black, and the same red/ink split carries through 宜/忌, good and bad hours, 正位/逆位, and star brightness. The dark theme is not a new palette; it reprints the same two inks on ink-black paper, lifting vermilion so it holds contrast.

Density is that of a printed almanac: tight ruled rows, tabular figures, serif values, small gray notes. It refuses the category's starry purple mystic gradients, glassy blurred panels and the generic soft card stack. Depth comes from print (frames and rules), not from floating surfaces.

**Key Characteristics:**
- Two inks on paper: vermilion and black, warm gray for notes only.
- Double vermilion frame (2px border plus 1px outline at 2px offset) around every result sheet.
- Vertical vermilion heading columns (`writing-mode: vertical-rl`) in a 28px rail.
- Rotated vermilion seal stamps for verdicts, with an inset hairline rim.
- Ming serif for headings, dates and values; sans for controls and notes.
- Signature motion: seals stamp down and settle; sheets slide in with slight weighted overshoot.

## Colors

A strict two-ink print: vermilion and black on cream almanac paper, each reprinted for the dark theme.

### Primary
- **Almanac Vermilion** (light `vermilion`, dark `dark-vermilion`): the first ink. Sheet frames, heading columns, row labels, seals, the active-tab underline, the focused hour, 吉 marks, links, focus rings and selection. Its deeper step (`vermilion-deep` / `dark-vermilion-deep`) is for hover on red fills, alert text and error toasts.

### Secondary
- **Printer's Black** (light `ink`, dark `dark-ink`): the second ink. Body text, values, the primary button, the 忌 heading block, ink seals, 凶 marks and toasts. `ink-soft` is its lighter impression for secondary text and primary-button hover.

### Tertiary
- **Ochre Warning** (light `ochre-warning`, dark `dark-ochre`): the only third hue, used solely for warning badges and warning toasts. Never decorative.

### Neutral
- **Almanac Paper** (`almanac-paper` / `dark-paper`): the page ground.
- **Sheet Paper** (`paper-sheet` / `dark-paper-sheet`): the surface inside framed sheets, inputs and buttons.
- **Paper Shade** (`paper-shade`, `paper-shade-deep`): pressed and hover surfaces, quiet fills.
- **Note Gray** (`note-gray` / `dark-note-gray`): notes, captions, inactive tabs, placeholders.
- **Vermilion Rule** (`vermilion-rule`, `vermilion-rule-strong`): hairlines between ruled rows and cells, strong rules around control strips and tags.
- **Ink Hair** (`ink-hair`, `ink-hair-strong`): neutral hairlines for un-framed areas (tab-row baseline, lucky strip, control borders).
- **Vermilion Wash** (`vermilion-wash`, 8%; a 14% step for hover): tinted fill for the today tag, secondary buttons, brand badges and hour hover.

### Named Rules
**The Two-Ink Rule.** Every mark on a sheet is vermilion, black or note gray. A new hue enters only as data the user asked for (a lucky colour swatch, tarot or oracle artwork), never as interface colour.

**The 吉 Red, 凶 Ink Rule.** Auspicious marks print vermilion; inauspicious marks print black. Never colour 凶 red or use green/amber for good/bad.

**The Reprint Rule.** Dark theme swaps the paper to ink-black and lifts both inks; it never introduces glow, gradients or new accents.

## Typography

**Display Font:** Noto Serif TC (with Songti TC, PMingLiU, serif)
**Body Font:** Noto Sans TC (with PingFang TC, Microsoft JhengHei, sans-serif)
**Glyph Font:** Noto Sans Symbols (with Apple Symbols, Segoe UI Symbol, then the serif), weights 400 and 600; zodiac and planet symbols only.
**Label/Mono Font:** system mono, used only for technical strings.

**Character:** A Ming serif carries everything that is printed on the almanac (dates, palace names, values, verdicts); a plain sans handles the machinery of the app (buttons, fields, notes). Figures are tabular throughout.

### Hierarchy
- **Display** (900, clamp(68px, 19vw, 96px), 0.92, -0.03em): the red date numeral on the day sheet; clamp(56px, 16vw, 72px) under 480px.
- **Seal** (900, 30px): the verdict characters inside an 80px seal; 25px in the 66px phone seal.
- **Headline** (700, 22px, 1.3): sheet and page titles. Brand name is 19px 700 at 0.08em.
- **Title** (700, 18px / 16px, 1.3): section headings within a sheet.
- **Value** (600, 15px/22px): the printed answer in every ruled row, 宜/忌 item, hour; larger values step to 17px and 20px.
- **Body** (400, 15px, 1.6): reading prose; quotes set in serif 500 at 1.7.
- **Control** (500, 14px, 0.04em): buttons and fields; tabs are 15px at 0.12em, 700 when active.
- **Label** (vertical heading 700 13px at 0.2em; row label 600 13px at 0.16em, centred): always serif, always vermilion.
- **Note** (400, 12px/18px, sans, note gray): explanation under each value.
- **Glyph** (400, Noto Sans Symbols, line-height 1): zodiac signs (♈–♓) and planet symbols (☉☽☿♀♂♃♄♅♆♇) in the 十二星座 and 西洋星盤 tabs. It runs from 17–21px in selectors and tables, through clamp(54px, 15vw, 72px) on the sign sheet, up to a fixed 150px watermark pressed into the 今日星盤綜述 slip's empty bottom field (never under the reading text); the astro wheel uses the same stack.

### Named Rules
**The Printed vs. Operated Rule.** If it would appear in a paper almanac, set it in the serif; if it is an app control or a gloss, set it in the sans.

**The Glyph Is Content Rule.** Noto Sans Symbols sets astrological symbols as data, inked in vermilion or black like any other value. It is never a UI icon set.

**The Vertical Heading Rule.** Section headings on a sheet run vertically in the 28px vermilion rail, not as a horizontal label above the content.

## Layout

A single centred column, max 1180px, with a 16px gutter on phones and 32px from 768px (safe-area insets respected). A sticky serif app bar (56px, 64px from 768px) holds the brand seal, 中/EN toggle and theme button; below it a sticky, horizontally scrolling tab row with snap.

The day sheet grid is one column on phones and splits at 960px into a sheet column (up to 600px) beside a sticky side column (min 260px, 32px column gap). Inside sheets, layout is tabular: a 3-column day header (date / 76px vertical lunar column / seal), a 28px heading rail plus content, 58px row-label column, 宜 and 忌 side by side, and a 12-cell 時辰 strip.

Spacing follows a 4px base: 4, 8, 12, 16, 24, 32, 48. Tap targets rise to 44px on coarse pointers, and fields go to 16px text there to avoid zoom. Under 480px the day sheet tightens (smaller numeral and seal, 36px rows, 54px hours) and the 宜/忌 notes collapse behind a tap (44px toggles with a rotating chevron; owner decision 收合宜忌說明), so the date, 宜/忌 titles, the current hour, the one-line lucky notes and the ink 複製分享 button all land in the 390x844 first viewport; desktop always prints the notes; under 380px the lucky strip stacks. Birth-data control strips wrap into three-up fields at 600px. Modals become bottom sheets at 600px.

## Elevation & Depth

Depth is printed, not floated. Sheets are defined by the double vermilion frame and sit almost flat; the one shadow is soft enough to read as paper lifting off paper. Only transient layers (modals, toasts, popovers) get a stronger lift.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,0,0,0.16)`; dark `0 1px 2px rgba(0,0,0,0.4), 0 10px 28px -14px rgba(0,0,0,0.7)`): every framed almanac sheet.
- **Pop** (`box-shadow: 0 2px 6px rgba(0,0,0,0.1), 0 18px 40px -12px rgba(0,0,0,0.26)`; dark `0 2px 8px rgba(0,0,0,0.5), 0 20px 44px -12px rgba(0,0,0,0.8)`): modals, toasts, dialogs.

### Named Rules
**The Frame Before Shadow Rule.** Separate content with a vermilion rule or frame first; reach for a shadow only for a layer that sits above the page. No blur, no glass, no offset block shadows.

## Shapes

Almost square, as cut paper: 4px on controls, fields and cards, 3px on badges and tags, 2px on swatches and small marks. Framed sheets have square corners. The one irregular shape is the seal: unequal corners (7px 5px 8px 6px), rotated -4deg, with a 1px paper-coloured inner rim inset 5px, like a carved stone stamp. The brand mark is a 30px version rotated -3deg. Lines are hairlines (1px) for rules and 2px only for frames and active underlines.

## Components

### Buttons
Printed and plain; ink for the main action, never a gradient.
- **Shape:** gently squared (4px), 40px tall (44px on touch), 0 16px padding.
- **Default:** sheet paper with a strong ink hairline; hover shifts to paper shade with an ink-soft border.
- **Primary:** solid black with paper text (e.g. 複製分享); hover to ink-soft.
- **Secondary:** vermilion wash fill, strong vermilion rule, vermilion text.
- **Danger:** solid vermilion with paper text.
- **Ghost / Active:** transparent; the active/toggled state is vermilion wash with a vermilion border and text.
- **Press:** translateY(1px) scale(0.98) at 120ms. Sizes: 28px (xs), 34px (sm), 48px (lg).

### Chips / Badges
- **Style:** small printed tags, 12px sans 500 at 0.04em, 3px radius, transparent fill with ink hairline.
- **Variants:** brand (vermilion wash + vermilion rule), warning (ochre), muted (gray), danger (solid black). The today tag on the date bar is a serif tag in the brand style.

### Cards / Containers
- **Almanac sheet:** the default result container. Sheet paper, 2px vermilion border plus 1px vermilion outline offset 2px, sheet shadow, square corners; internal sections divided by 1px vermilion lines and rows by vermilion hairlines.
- **Plain card:** sheet paper, ink hairline, 4px radius, 16px padding; for secondary content outside the book's pages.

### Inputs / Fields
- **Style:** sheet paper, strong ink hairline, 4px radius, 40px tall, 15px sans; selects use a vermilion chevron.
- **Focus:** border turns vermilion with a 3px vermilion-wash outline. Global focus-visible is a 2px vermilion outline at 2px offset.
- **Control strip:** birth-data fields sit in a band ruled top and bottom with strong vermilion rules.

### Navigation
- **App bar:** brand seal (吉) plus serif name 吉時行樂 left; 中/EN toggle (active language bold ink, other gray) and a theme icon button right.
- **Tab row:** gray sans labels at 0.12em; hover inks them; active is bold ink with a 2px vermilion underline that scales in from 0. Sub-mode switches (單人/雙人) are a segmented strip with a strong vermilion rule.

### Seal Stamp (signature)
The verdict mark: 80px vermilion square (66px on phones, 52px for small statuses), 900 serif, rotated -4deg, inset paper rim. Ink variant for unfavourable verdicts. Enters with the stamp animation: from rotate(-12deg) scale(1.55) and transparent to rotate(-4deg) scale(1) over 620ms on the stamp curve.

### Vertical Heading Column (signature)
A 28px rail with a vermilion right rule and vertical 13px serif heading. The filled variant is a solid vermilion (宜) or black (忌) block with a 20px 900 character.

### Hour Strip
Twelve equal cells divided by vermilion hairlines; stem in serif 15px, 吉 in vermilion, 凶 in ink. Hover is vermilion wash; the selected hour is filled vermilion with paper text; the current hour carries a 4px dot.

### Toasts and Modals
Toasts are black slips rising 12px from the bottom edge (error: deep vermilion; warning: ochre). Modals are framed almanac slips (the double frame, pop shadow) that become bottom sheets on phones with only a top 2px vermilion border, sliding up.

### Motion
Ease-out `cubic-bezier(0.16, 1, 0.3, 1)` for state; sheet `cubic-bezier(0.34, 1.32, 0.64, 1)` for weighted overshoot; stamp `cubic-bezier(0.2, 1.6, 0.4, 1)`. Durations 120 / 220 / 420ms. Tab bodies and sheets slide up 14px on the sheet curve; ruled rows and chart marks ink in on short staggers. Under reduced motion every animation collapses to a fade (160ms max) with no transforms.

## Do's and Don'ts

### Do:
- **Do** set every system's result on an almanac sheet with the double vermilion frame and ruled rows.
- **Do** head sheet sections with the vertical vermilion heading column in a 28px rail.
- **Do** print 吉, 宜, good hours and favourable marks in vermilion and 凶, 忌 and unfavourable marks in ink.
- **Do** use the rotated vermilion seal (or its ink variant) for a reading's verdict, stamped in with the stamp curve.
- **Do** set dates, values and headings in Noto Serif TC and controls and notes in Noto Sans TC, with tabular figures.
- **Do** keep tap targets at 44px on coarse pointers and fields at 16px text on touch.
- **Do** fall back to fades under reduced motion.

### Don't:
- **Don't** introduce purple, starry or mystic gradients, glow, or glassy blurred panels.
- **Don't** add interface hues beyond vermilion, black, note gray and the ochre warning.
- **Don't** colour good/bad outcomes green/amber/red; the only split is red and ink.
- **Don't** stack soft rounded cards; radius stays at 4px or less outside the seal.
- **Don't** put small tracked labels above headings; sheet headings run in the vertical rail.
- **Don't** separate content with shadows where a vermilion rule will do.
