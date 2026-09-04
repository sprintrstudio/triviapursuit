# House questions

Your own questions go in `house.json`. They mix into the general deck at whatever
percentage the settings slider is set to — 15% by default, 0% to turn them off
entirely without deleting anything.

Add them to the array in `house.json`, then run:

```bash
npm run all
```

## One question looks like this

```json
{
  "id": "house-001",
  "category": "entertainment",
  "difficulty": 2,
  "q": "In the 1998 film The Big Lebowski, what drink does the Dude order throughout?",
  "a": "A White Russian",
  "accept": ["White Russian", "Caucasian"],
  "note": "The Dude calls it a Caucasian; the film made the drink popular again.",
  "era": "1990s",
  "topic": "film",
  "pack": "house"
}
```

## The fields

| Field | What it does |
| --- | --- |
| `id` | Must be unique across the whole deck. Use the `house-` prefix and you'll never collide with the general questions. |
| `category` | One of exactly: `geography`, `entertainment`, `history`, `arts`, `science`, `sports`. This decides which wedge it appears under. |
| `difficulty` | `1` easy, `2` medium, `3` hard. Used by the difficulty setting. |
| `q` | The question, as it will be read aloud. |
| `a` | The answer, phrased how you'd say it. |
| `accept` | Other answers to count as correct. Use `[]` if there are none. This is what settles arguments. |
| `note` | One sentence read out after the reveal. Optional but it's the nicest part. |
| `era` | `"timeless"`, or a decade like `"1990s"` if the question is tied to a period. |
| `topic` | A short label for your own reference. Anything you like. |
| `pack` | Always `"house"` — this is what makes the mix slider work. |

## Two rules worth keeping

**Don't write questions whose answers expire.** Nothing about who *currently* holds
a record or *most recently* won something — that's exactly what made the old deck
unplayable. Anchor to a year instead.

**Say the year in the question.** "In the 2004 season…" rather than "last season."
It costs four words and the question stays fair forever.

If `npm run validate` spots either problem it will warn you about it by name.
