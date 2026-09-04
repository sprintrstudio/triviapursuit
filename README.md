# Pursuit Deck

The card half of Trivial Pursuit, on a phone. The board, pieces, dice and wedges stay
on the table exactly as they are — this replaces only the deck, because the questions
in an old box are the part that goes stale.

Roll, move your piece, tap the wedge you landed on, get a question. Tap to reveal the
answer. That's the whole thing.

## Playing

Open the published link on whichever phone is nearest. First run asks who's playing —
two people minimum, six maximum. The reader holds the phone; the answer stays hidden
until someone taps **Reveal answer**, so you can pass it around without spoiling
anything.

- **Tap a tile** to draw from that category.
- **Different question** if you get one you've already argued about or don't like.
- **Got it / Missed it** credits whoever's turn it is, then a miss passes the turn to
  the next player — the same rule as the board. A normal turn needs no extra tapping.
- **Scoring for …** on the answer screen switches the player if the turn was set wrong.
- **Flag this question** on anything wrong or unfair. The flagged IDs collect in
  settings so they can be fixed later.

The player chips above the tiles carry each person's running tally (✓ right, ✕ wrong).
Your physical pie pieces are still the real score — this is just the count.

Questions never repeat. When a category runs dry it reshuffles itself and says so.

### Settings

| Setting | What it does |
| --- | --- |
| Difficulty | *Everything* is the full spread. *Gentler* drops the hard ones for faster turns. *Tougher* drops the easy ones. |
| Players | Rename, add or remove players mid-game. Two is the minimum. |
| End session & start a new game | Reopens the name prompt and zeroes the scores. Deliberately does **not** touch the deck, so a new game won't hand you questions you answered last night. |
| House questions | How often a question comes from your own pack instead of the general deck. 0% turns them off without deleting them. |
| Category names | Rename any category if your box words them differently. |
| Reshuffle the deck | Puts every question back in play. Separate from starting a new game. |

## Adding your own questions

Everything you need is in [`data/house/README.md`](data/house/README.md) — the schema,
a worked example, and the two rules that keep a question from going stale. Add them to
`data/house/house.json`, then rebuild.

## Working on it

No dependencies. Node 18+.

```bash
npm run all
```

That runs three steps, which you can also run on their own:

| Command | What it does |
| --- | --- |
| `npm run merge` | Combines the per-topic blocks in `data/core/parts/` into one file per category in `data/core/`. |
| `npm run validate` | Checks the schema, finds duplicate and near-duplicate questions, reports the difficulty spread, and flags any question phrased in a way that will expire. |
| `npm run build` | Inlines the stylesheet, the script and the whole question bank into `dist/trivia.html`. |

`dist/trivia.html` is one self-contained file with no external dependencies except the
webfonts. It's what gets published, and you can also just open it in a browser.

### Layout

```
src/          index.html, styles.css, app.js — edited separately, shipped as one file
data/core/    the general question bank, one file per category
data/house/   your own questions
tools/        merge, validate, build
dist/         build output
```

### Why validate exists

The old box became unplayable because its answers expired — "the current record
holder" stopped being current. `npm run validate` greps for that phrasing (*currently*,
*most recent*, *reigning*, *holds the record*, *highest-grossing*) and warns on every
hit. It also catches near-duplicate questions, which is the failure mode when questions
are written in parallel batches.

Warnings are advisory. Errors — malformed JSON, missing fields, duplicate IDs — stop
the build.
