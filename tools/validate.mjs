// Checks the merged question bank for the things that actually ruin a game night:
// malformed entries, duplicate IDs, near-duplicate questions, lopsided difficulty,
// and answers phrased in a way that will go stale.
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = [join(ROOT, 'data', 'core'), join(ROOT, 'data', 'house')];

const REQUIRED = ['id', 'category', 'difficulty', 'q', 'a', 'note', 'era', 'topic', 'pack'];
const CATEGORIES = ['geography', 'entertainment', 'history', 'arts', 'science', 'sports'];

// Phrasing whose answer drifts over time — the exact failure mode of an old card deck.
const VOLATILE = [
  /\bcurrent(ly)?\b/i, /\bmost recent(ly)?\b/i, /\breigning\b/i, /\bto date\b/i,
  /\bpresent day\b/i, /\bas of today\b/i, /\bnowadays\b/i, /\bso far\b/i,
  /\brecord for (the )?most\b/i, /\bholds the record\b/i, /\bever sold\b/i,
  /\bhighest[- ]grossing\b/i, /\bstill (alive|active|standing|holds)\b/i,
  /\bthe (tallest|largest|richest|fastest|biggest|longest|newest) (building|company|person|man|woman|skyscraper)\b/i,
];

const errors = [];
const warnings = [];
const all = [];

for (const dir of SOURCES) {
  if (!existsSync(dir)) continue;
  const files = (await readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isFile() && d.name.endsWith('.json'))
    .map((d) => d.name)
    .sort();

  for (const file of files) {
    const rel = `${dir.split(/[\/]/).slice(-2).join('/')}/${file}`;
    let parsed;
    try {
      parsed = JSON.parse(await readFile(join(dir, file), 'utf8'));
    } catch (err) {
      errors.push(`${rel}: invalid JSON — ${err.message}`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${rel}: expected a JSON array`);
      continue;
    }
    parsed.forEach((q, i) => all.push({ q, where: `${rel}[${i}]` }));
  }
}

if (!all.length) {
  console.error('No questions found. Run `npm run merge` first.');
  process.exit(1);
}

// --- per-question schema checks -------------------------------------------
const seenIds = new Map();
for (const { q, where } of all) {
  const at = `${where} (${q?.id ?? 'no id'})`;

  for (const field of REQUIRED) {
    if (q[field] === undefined || q[field] === null || q[field] === '') {
      errors.push(`${at}: missing "${field}"`);
    }
  }
  if (!Array.isArray(q.accept)) errors.push(`${at}: "accept" must be an array (use [] if none)`);
  if (![1, 2, 3].includes(q.difficulty)) errors.push(`${at}: difficulty must be 1, 2 or 3`);
  if (q.category && !CATEGORIES.includes(q.category)) {
    errors.push(`${at}: unknown category "${q.category}"`);
  }
  if (typeof q.q === 'string' && q.q.length < 12) warnings.push(`${at}: question looks truncated`);
  if (typeof q.a === 'string' && q.a.length > 90) warnings.push(`${at}: answer is very long to read aloud`);

  if (q.id) {
    if (seenIds.has(q.id)) errors.push(`${at}: duplicate id, also at ${seenIds.get(q.id)}`);
    else seenIds.set(q.id, where);
  }

  const text = `${q.q ?? ''} ${q.a ?? ''}`;
  for (const rx of VOLATILE) {
    if (rx.test(text)) {
      warnings.push(`${at}: answer may go stale — matches ${rx}`);
      break;
    }
  }
}

// --- near-duplicate detection ---------------------------------------------
const STOP = new Set(['the','a','an','of','in','is','was','what','which','who','name','and','to','for','on','at','by','with','that','this','it','its','from','as','are','were','did','does','how','many','whose','whom','be','been']);
const fingerprint = (s) =>
  new Set(
    String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );

// Two questions that merely share a sentence shape ("Which metal has the symbol
// Fe/Pb?") are not duplicates. A real duplicate lands on the same answer, so the
// answer decides which threshold applies.
const normAnswer = (s) => String(s).toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');

const prints = all.map(({ q }) => ({
  id: q.id, tokens: fingerprint(q.q), text: q.q, answer: normAnswer(q.a),
}));

for (let i = 0; i < prints.length; i++) {
  for (let j = i + 1; j < prints.length; j++) {
    const a = prints[i], b = prints[j];
    if (!a.tokens.size || !b.tokens.size) continue;
    let shared = 0;
    for (const t of a.tokens) if (b.tokens.has(t)) shared++;
    const union = a.tokens.size + b.tokens.size - shared;
    if (!union) continue;
    const similarity = shared / union;
    const sameAnswer = a.answer && a.answer === b.answer;

    if (sameAnswer && similarity >= 0.5) {
      warnings.push(`DUPLICATE (same answer): ${a.id} / ${b.id}\n      "${a.text}"\n      "${b.text}"`);
    } else if (!sameAnswer && similarity >= 0.85) {
      warnings.push(`similar phrasing, different answers: ${a.id} / ${b.id}\n      "${a.text}"\n      "${b.text}"`);
    }
  }
}

// --- distribution report ---------------------------------------------------
console.log('\nQuestion bank\n' + '-'.repeat(58));
const counts = {};
for (const { q } of all) {
  const c = (counts[q.category] ??= { total: 0, 1: 0, 2: 0, 3: 0, house: 0 });
  c.total++;
  if (c[q.difficulty] !== undefined) c[q.difficulty]++;
  if (q.pack === 'house') c.house++;
}
console.log('category         total    easy   medium   hard    house');
for (const cat of CATEGORIES) {
  const c = counts[cat];
  if (!c) { console.log(`${cat.padEnd(16)} ${'—'.padStart(5)}   (none yet)`); continue; }
  const pct = (n) => `${String(n).padStart(3)} ${`(${Math.round((n / c.total) * 100)}%)`.padEnd(6)}`;
  console.log(`${cat.padEnd(16)} ${String(c.total).padStart(5)}   ${pct(c[1])} ${pct(c[2])} ${pct(c[3])} ${String(c.house).padStart(5)}`);

  const easyPct = (c[1] / c.total) * 100;
  const hardPct = (c[3] / c.total) * 100;
  if (c.total >= 30 && (easyPct < 15 || easyPct > 50)) warnings.push(`${cat}: easy share is ${Math.round(easyPct)}%, target ~30%`);
  if (c.total >= 30 && hardPct > 35) warnings.push(`${cat}: hard share is ${Math.round(hardPct)}%, target ~20% — this category will feel brutal`);
}
console.log('-'.repeat(58));
console.log(`total            ${String(all.length).padStart(5)}`);

// --- results ---------------------------------------------------------------
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s) — review, but not blocking:`);
  for (const w of warnings.slice(0, 40)) console.log(`  ~ ${w}`);
  if (warnings.length > 40) console.log(`  ... and ${warnings.length - 40} more`);
}
if (errors.length) {
  console.log(`\n${errors.length} ERROR(s) — must fix before building:`);
  for (const e of errors.slice(0, 40)) console.log(`  ! ${e}`);
  if (errors.length > 40) console.log(`  ... and ${errors.length - 40} more`);
  process.exit(1);
}
console.log('\nNo errors. Bank is good to build.');
