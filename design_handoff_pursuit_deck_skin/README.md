# Handoff: Pursuit Deck — party-game skin

## Overview

Pursuit Deck is the card half of a physical trivia board game, running on one phone
that gets passed around the table. Pick the wedge you landed on, get a question, reveal
the answer, tally it. The board, pieces, dice and wedges stay on the table.

This handoff covers a **re-skin only**. Every feature in the existing app stays exactly
as it is — six categories, difficulty filter, house-question mix, per-category renaming,
no-repeat draw with reshuffle, flagging, session tally. What changes is the visual
language: a loud party-game look (chunky slab display type, thick black outlines, hard
offset shadows, a tilted card, and a question screen that floods with the wedge colour).

Source app: `src/index.html`, `src/styles.css`, `src/app.js`, question bank in
`data/core/*.json` + `data/house/house.json`, built to `dist/trivia.html` by `tools/build.mjs`.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes showing
the intended look and behaviour. They are not production code to copy verbatim.

The existing app is vanilla HTML + CSS + JS with no dependencies and no build step
beyond inlining (`npm run all`). **Keep that.** The task is to port the visual language
into `src/styles.css` and `src/index.html`, adjusting `src/app.js` only where the DOM
structure changes (the wheel becomes a tile grid). Do not introduce a framework, a
bundler, or npm dependencies.

The prototypes are written as Design Components (a streaming HTML format) and use React
under the hood — that is an artefact of the design tool, not a recommendation.

## Fidelity

**High-fidelity.** Colours, type sizes, weights, spacing, radii, shadows and copy in the
prototypes are final. Recreate them exactly. Board colours are dictated by the physical
game and are already in `styles.css` — do not re-pick them.

## Files in this bundle

| File | What it is |
| --- | --- |
| `Pursuit Deck — Prototype.dc.html` | **The design to build.** Working prototype of the new skin: home, question, answer, settings sheet, toast. |
| `Pursuit Deck — Current.dc.html` | Faithful recreation of today's app, for before/after comparison. |
| `Pursuit Deck — Redesign.dc.html` | The three explored directions (1a Table Read, 1b Buzzer Board, 1c Dealer). The approved design is 1b's home + 1a's question screen — that combination is what the prototype implements. |
| `ios-frame.jsx` | Device frame used by the options file only. Not part of the app. |

Open any of them in a browser.

## Design tokens

### Type

Two families, both Google Fonts:

```
Display:  "Lilita One", cursive          — one weight (400), always the display face
UI/body:  "Archivo", system-ui, sans-serif — weights 400/500/600/700
```

Replaces Fraunces (display) and keeps Archivo (UI) from the current app. Fraunces is no
longer used anywhere.

| Role | Font | Size | Weight | Line height | Notes |
| --- | --- | --- | --- | --- | --- |
| Wordmark | Lilita One | 30px | — | 1 | `text-transform: uppercase` |
| Home prompt ("Where did you land?") | Lilita One | 17px | — | 1.25 | uppercase, accent colour |
| Tile code letter (G, E, H, AL, SN, SL) | Lilita One | 44px | — | 0.9 | |
| Tile category name | Archivo | 13px | 600 | — | ellipsis on overflow |
| Tile count | Lilita One | 16px | — | — | `opacity: .75` |
| Deck tally ("13 LEFT") | Lilita One | 20px | — | — | |
| Session line | Archivo | 12px | 500 | — | `rgba(26,22,24,.62)`, tabular-nums |
| Category chip | Lilita One | 15px | — | — | `letter-spacing: .06em` |
| Question text | Lilita One | 31px | — | 1.16 | `text-wrap: pretty` |
| Reader hint | Archivo | 12.5px | 500 | 1.45 | `rgba(26,22,24,.68)` |
| Answer recap | Archivo | 14.5px | 500 | 1.42 | `rgba(26,22,24,.7)` |
| Answer | Lilita One | 40px | — | 1.06 | category light-theme ink, `text-wrap: balance` |
| "Also accept" | Archivo | 13px | 400 | 1.45 | `rgba(26,22,24,.72)`, label in 700 |
| Note | Archivo | 13.5px | 500 | 1.5 | `rgba(26,22,24,.78)` |
| Primary button label | Lilita One | 22px | — | — | `letter-spacing: .02em` |
| Got it / Missed it | Lilita One | 20px | — | — | |
| Ghost button label | Archivo | 14px | 600 | — | |
| Settings section label | Archivo | 11.5px | 700 | — | uppercase, `letter-spacing: .14em`, `rgba(26,22,24,.65)` |
| Settings help text | Archivo | 12.5px | 500 | 1.5 | `rgba(26,22,24,.66)` |
| Toast | Archivo | 13.5px | 600 | 1.4 | |

Nothing on screen is below 12px.

### Colour

```
--paper:   #f7f1e4   /* app ground and card face */
--ink:     #1a1618   /* body ink */
--outline: #14100f   /* every border and hard shadow */
--white:   #ffffff   /* settings-button and input fill */
--accent:  #c8462f   /* home prompt, flagged state */
```

Board colours — unchanged, already in `styles.css`:

```
geography     #2f7fd1     entertainment #de5599     history #e3b32c
arts          #a9663f     science       #3f9e58     sports  #e5752c
```

Ink on a saturated fill: `#ffffff`, except history `#2b2210` (the yellow needs dark type).
This is the existing `--on-fill` / `--on-fill-dark` rule.

Answer type on the cream card uses the **light-theme** ink variants already defined in
`styles.css` (`:root[data-theme="light"]`), because the card is light:

```
geography #1a5fa8   entertainment #b52d72   history #8a6608
arts      #7d4626   science       #24713a   sports  #b45210
```

Muted inks are alpha over `#f7f1e4`: `.78` / `.72` / `.7` / `.68` / `.66` / `.62`.
Do not go below `.62` — anything dimmer fails contrast at these sizes.

### Shape, shadow, texture

```
Border:        3px solid #14100f  (controls, inputs, chips)
               4px solid #14100f  (tiles, cards, primary buttons)
Hard shadow:   6px 6px 0 #14100f  (tiles)
              10px 10px 0 #14100f (question / answer card)
               6px 6px 0 rgba(20,16,15,.35) (primary button)
Radius:        8px  tiles
               6px  cards
             999px  buttons, chips, toast
              16px 16px 0 0  settings sheet
              50%  round icon buttons (46px)
Card tilt:     rotate(-1.4deg)  — question and answer card only
Tap target:    46px minimum; primary buttons 58-60px
```

Backgrounds carry texture:

```
Home (paper):     radial-gradient(rgba(20,16,15,.11) 1.5px, transparent 1.6px) / 16px 16px
Flooded screens:  repeating-linear-gradient(135deg, rgba(0,0,0,.07) 0 16px, transparent 16px 32px)
```

### Layout

```
Container:  width 100%, max-width 460px, centred
Padding:    22px 22px 30px
Stack gap:  18px (home), 20px (question, answer)
Tile grid:  2 columns, gap 12px, tile min-height 120px
```

Mobile-first, single column. 460px is the existing app's max width — keep it.

## Screens

### 1. Home

**Purpose:** the turn hub — you rolled, you moved, now tap the wedge you landed on.

Vertical stack:

1. **Header row** — wordmark left (`PURSUIT DECK`, Lilita One 30px, uppercase), settings
   button right: 46px circle, `background #fff`, `border 3px solid #14100f`, containing the
   gear SVG already in `src/index.html` (21px, `stroke: currentColor`, `stroke-width: 2`,
   fill none). Active state: `translateY(2px)`.
2. **Prompt** — "Where did you land?" in Lilita One 17px uppercase, accent `#c8462f`.
3. **Tile grid** — `flex: 1`, 2 columns, gap 12px. One tile per category in board order
   (Geography, Entertainment, History, Arts & Literature, Science & Nature, Sports & Leisure).
   Each tile: min-height 120px, `background` = board colour, `border 4px solid #14100f`,
   `border-radius 8px`, `box-shadow 6px 6px 0 #14100f`, padding `12px 13px`,
   `space-between` column, left-aligned text. Top: code letter (Lilita One 44px). Bottom row:
   category name (Archivo 600 13px, truncating) and remaining count (Lilita One 16px, `opacity .75`).
   Ink is white, except History `#2b2210`.
   - **Active:** `transform: translate(4px, 4px)` with the shadow left in place, so the tile
     presses into its own shadow. Transition `transform 90ms ease, box-shadow 90ms ease`.
   - **Spent wedge (0 questions left at the current difficulty):** `opacity: .34` and no
     shadow. This is the new skin's version of `.sector.is-empty { opacity: .28 }` in
     `styles.css`. Still tappable; tapping shows the existing "no questions at this
     difficulty" toast.
4. **Tally strip** — `border-top: 3px solid #14100f`, `padding-top: 8px`. Left: "N LEFT"
   (Lilita One 20px), summing remaining questions across all six categories. Right: either
   "13 questions in the deck" before the first turn, or "4 asked · 3 got · 1 missed" once
   the session has started (tabular-nums). Same copy logic as `refreshHome()` today.

### 2. Question

**Purpose:** read the question out loud; the answer stays hidden.

The whole screen background floods with the category's board colour plus the diagonal
stripe texture.

1. **Chip row** — chip: `background #14100f`, cream text, `border-radius 999px`,
   `padding 7px 12px`, Lilita One 15px, content `"E · ENTERTAINMENT"` (code + renamed
   category, uppercased). Right: three difficulty pips, 9px circles, gap 5px —
   filled `#14100f`, empty `rgba(20,16,15,.25)`.
2. **Card** — `flex: 1`, `background #f7f1e4`, `border 4px solid #14100f`,
   `border-radius 6px`, `box-shadow 10px 10px 0 #14100f`, `padding 26px 22px 24px`,
   `transform: rotate(-1.4deg)`. Question in Lilita One 31px/1.16. Reader hint pinned to the
   card floor with `margin: auto 0 0`: "Hold the phone yourself — the answer is one tap away."
3. **Actions** — `REVEAL ANSWER`: full width, min-height 60px, `background #14100f`, cream
   Lilita One 22px, `border 4px solid #14100f`, `border-radius 999px`,
   `box-shadow 6px 6px 0 rgba(20,16,15,.35)`, active `translate(3px, 3px)`.
   Below, a row: "Different question" (flex 1) and "Back" (fixed 96px), both ghost —
   transparent fill, `border 3px solid #14100f`, `#14100f` label, min-height 50px.

### 3. Answer

Same flood, same card treatment, `padding 24px 22px`.

1. Chip row (no pips).
2. Card contents in order: question recap (Archivo 500 14.5px, `rgba(26,22,24,.7)`);
   the answer in Lilita One 40px/1.06 in the category's **light-theme** ink;
   "**Also accept:** White Russian · Caucasian" when `accept` is non-empty (`·` separator);
   the note last, pushed to the card floor with `margin: auto 0 0` above a
   `3px solid #14100f` rule and `padding-top: 14px`.
3. Actions: `GOT IT` (filled `#14100f`, cream) and `MISSED IT` (transparent, `4px` outline,
   `#14100f` label), both flex 1, min-height 58px, Lilita One 20px.
   Below: the flag toggle — text button, min-height 44px, Archivo 600 13px, underlined with
   `text-underline-offset: 3px`. Label "Flag this question" / "Flagged — tap to unflag";
   ink `rgba(26,22,24,.7)` unflagged, accent `#c8462f` flagged.

### 4. Settings sheet

Bottom sheet, `position: fixed`, `width min(460px, 100%)`, centred, `max-height 90dvh`,
scrollable, `background #f7f1e4`, `border 4px solid #14100f` with no bottom border,
`border-radius 16px 16px 0 0`, `padding 20px 20px 34px`, section gap 24px. Scrim:
`rgba(20,16,15,.55)`, closes on tap (as today, plus Escape).

Header: "SETTINGS" (Lilita One 26px uppercase) and a 46px round `✕` button.

Fields, same four as today, same copy:

- **Difficulty** — segmented row, `border 3px solid #14100f`, `border-radius 999px`,
  `overflow: hidden`, three buttons (Everything / Gentler / Tougher) each min-height 48px,
  Lilita One 16px, divided by `3px solid #14100f`. Selected: `background #14100f`, cream label.
  Help text below is the existing per-difficulty string.
- **House questions** — label row with the percentage in Lilita One 15px on the right,
  then `<input type="range" min="0" max="100" step="5">`, `accent-color: #c8462f`, height 34px.
- **Category names** — one row per category: a 34px square swatch in the board colour
  (`border 3px solid #14100f`, `border-radius 6px`) showing the code letter in Lilita One 14px,
  then a text input (min-height 46px, `background #fff`, `border 3px solid #14100f`,
  `border-radius 8px`, Archivo 500 14px). Renaming updates the tiles and chips live.
- **This deck** — bank summary line, then "Reshuffle the deck" / "Copy flagged" as a
  two-up ghost row (min-height 50px), then the flag summary line.

### 5. Toast

`position: fixed`, `bottom: 24px`, centred, `background #14100f`, cream Archivo 600 13.5px,
`border-radius 999px`, `padding 14px 18px`, `box-shadow 6px 6px 0 rgba(20,16,15,.3)`,
`max-width min(420px, calc(100% - 36px))`. Auto-dismiss after 3400ms — unchanged.

## Interactions & behaviour

All of this exists in `src/app.js` and must keep working identically:

- Tap a tile → draw a question from that category, filtered by difficulty, excluding
  already-asked ids, rolling `housePct` for the house pack first and falling back to core.
- "Different question" → redraw the same category, excluding the current question's id.
- When a category is exhausted → clear its asked ids, toast
  "<Category> is reshuffled — you had been through all N.", and draw again.
- "Reveal answer" → answer view. "Got it" / "Missed it" → mark asked, increment the tally,
  return home. "Back" → home without marking.
- Flag toggles membership in the flagged set and toasts on first flag.
- Renaming a category updates every surface immediately.
- Difficulty change re-pools every count, which can empty a wedge — apply the spent-tile
  state described above.
- State persists to `localStorage` under `pursuitdeck.v1`, every read and write guarded so
  blocked storage degrades to an in-memory game (see `load` / `save` in `app.js`). The
  prototype does not persist; the shipped app must keep doing so.

Transitions are short and physical: `transform 90ms ease` press states on tiles and
buttons. No page transitions, no entrance animations. Respect
`@media (prefers-reduced-motion: reduce)` — the existing blanket rule in `styles.css`
already covers this.

## State

Unchanged from `app.js`: `asked` (Set of ids), `flagged` (Set of ids),
`settings { difficulty, housePct, labels }`, `session { asked, got, missed }`, `current`
(the drawn question). No data fetching — the bank is inlined at build time by
`tools/build.mjs`.

## What to delete

The wheel goes away: the `#wheel` SVG, `buildWheel()`, `polar()`, `sectorPath()`, the
`el()` SVG helper, `#legend` / `buildLegend()`, and the `.wheel*`, `.sector*`, `.legend*`
rules in `styles.css`. The tile grid replaces both the wheel and the legend, since each
tile already shows its own remaining count. `refreshHome()` stays but now updates tiles.

Dark mode: the current app is dark-first with a full light theme. The new skin is
**light only** — the flooded question screens carry the contrast. Remove the
`prefers-color-scheme` and `[data-theme]` blocks, or leave them dormant if you want to
revisit a dark variant later.

## Assets

None. No images, no icon fonts. The only icon is the gear SVG already inline in
`src/index.html` (reused as-is) and a `✕` glyph for closing the sheet. Fonts load from
Google Fonts, which is how the current app loads Archivo:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Archivo:wght@400;500;600;700&display=swap">
```

`dist/trivia.html` stays one self-contained file with webfonts as its only external
dependency.
