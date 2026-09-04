// Inlines the stylesheet, the app script and the whole question bank into one
// self-contained HTML file. No <html>/<head>/<body> wrapper, so the output works
// both as a published artifact and opened straight off disk in a browser.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist', 'trivia.html');

const collect = async (dir) => {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isFile() && d.name.endsWith('.json') && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort();
  const out = [];
  for (const f of files) {
    const parsed = JSON.parse(await readFile(join(dir, f), 'utf8'));
    if (Array.isArray(parsed)) out.push(...parsed);
  }
  return out;
};

const bank = [
  ...(await collect(join(ROOT, 'data', 'core'))),
  ...(await collect(join(ROOT, 'data', 'house'))),
];

// Drop any accidental duplicate ids; first one wins.
const seen = new Set();
const deduped = bank.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));

if (!deduped.length) {
  console.error('Question bank is empty. Run `npm run merge` first.');
  process.exit(1);
}

const [html, css, js] = await Promise.all([
  readFile(join(SRC, 'index.html'), 'utf8'),
  readFile(join(SRC, 'styles.css'), 'utf8'),
  readFile(join(SRC, 'app.js'), 'utf8'),
]);

// Escaping "<" keeps a stray "</script>" inside question text from closing the tag early.
const bankJson = JSON.stringify(deduped).replace(/</g, '\u003c');

const page = html
  .replace('<!-- @styles -->', `<style>\n${css}\n</style>`)
  .replace('<!-- @bank -->', `<script type="application/json" id="bank">${bankJson}</script>`)
  .replace('<!-- @app -->', `<script>\n${js}\n</script>`);

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, page, 'utf8');

const byCat = {};
for (const q of deduped) byCat[q.category] = (byCat[q.category] ?? 0) + 1;
const kb = (Buffer.byteLength(page, 'utf8') / 1024).toFixed(0);

console.log(`Built dist/trivia.html — ${deduped.length} questions, ${kb} KB`);
for (const [cat, n] of Object.entries(byCat).sort()) console.log(`  ${cat.padEnd(15)} ${n}`);
if (bank.length !== deduped.length) console.log(`  (dropped ${bank.length - deduped.length} duplicate ids)`);
