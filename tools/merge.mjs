// Merges the per-sub-topic question blocks in data/core/parts/ into one file
// per category in data/core/. Safe to re-run; it always rebuilds from parts.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PARTS = join(ROOT, 'data', 'core', 'parts');
const CORE = join(ROOT, 'data', 'core');

if (!existsSync(PARTS)) {
  console.error(`No parts directory at ${PARTS} — nothing to merge.`);
  process.exit(1);
}

const files = (await readdir(PARTS)).filter((f) => f.endsWith('.json')).sort();
const byCategory = new Map();
const problems = [];

for (const file of files) {
  const raw = await readFile(join(PARTS, file), 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    problems.push(`${file}: invalid JSON — ${err.message}`);
    continue;
  }
  if (!Array.isArray(parsed)) {
    problems.push(`${file}: expected a JSON array, got ${typeof parsed}`);
    continue;
  }
  for (const q of parsed) {
    const cat = q?.category;
    if (!cat) {
      problems.push(`${file}: an entry is missing "category"`);
      continue;
    }
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(q);
  }
  console.log(`  read ${file.padEnd(22)} ${parsed.length} questions`);
}

await mkdir(CORE, { recursive: true });

let total = 0;
for (const [cat, questions] of [...byCategory].sort()) {
  questions.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const out = join(CORE, `${cat}.json`);
  await writeFile(out, JSON.stringify(questions, null, 2) + '\n', 'utf8');
  console.log(`\nwrote data/core/${cat}.json  (${questions.length} questions)`);
  total += questions.length;
}

console.log(`\nMerged ${total} questions across ${byCategory.size} categories.`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ! ${p}`);
  process.exitCode = 1;
}
