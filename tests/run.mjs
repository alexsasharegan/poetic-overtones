// Runs the core library against every fixture in spec/fixtures/ (the same expectations
// check.py uses), then checks round trips: load -> save -> load gives the same document,
// and saving twice gives the same text. Usage: node tests/run.mjs [FILE.pxml ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, save, spanText, PxmlError } from '../src/core/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixdir = join(here, '..', 'spec', 'fixtures');
const files = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(fixdir).filter((f) => f.endsWith('.pxml')).sort().map((f) => join(fixdir, f));

const reader = (base) => (rel) => {
  const p = join(base, ...rel.split('/'));
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};

function run(path) {
  const src = readFileSync(path, 'utf8');
  try {
    const { doc, warnings } = load(src, { readFile: reader(dirname(path)) });
    const sets = {};
    for (const t of doc.tiers) for (const s of t.sets) sets[s.id] = s.members.map((m) => spanText(doc, m));
    return { outcome: 'ok', errors: [], warnings: [...new Set(warnings.map((w) => w.code))].sort(), sets,
             tiers: doc.tiers.map((t) => [t.id, t.attrs.role ?? null]), doc };
  } catch (e) {
    if (!(e instanceof PxmlError)) throw e;
    return { outcome: 'error', errors: [e.code], warnings: [], sets: {}, detail: e.message };
  }
}

function expectation(path) {
  const m = readFileSync(path, 'utf8').match(/<!--\s*expect\s*(\{[\s\S]*?\})\s*-->/);
  return m ? JSON.parse(m[1]) : null;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function compare(exp, got) {
  const p = [];
  if (got.outcome !== (exp.outcome ?? 'ok')) p.push(`outcome ${got.outcome}, expected ${exp.outcome ?? 'ok'} ${got.detail ?? ''}`);
  if (!same(got.errors, exp.errors ?? [])) p.push(`errors ${JSON.stringify(got.errors)}, expected ${JSON.stringify(exp.errors ?? [])}`);
  if (got.outcome === 'ok' && !same(got.warnings, [...(exp.warnings ?? [])].sort())) p.push(`warnings ${JSON.stringify(got.warnings)}, expected ${JSON.stringify(exp.warnings ?? [])}`);
  if (exp.tiers && !same(got.tiers, exp.tiers)) p.push(`tiers ${JSON.stringify(got.tiers)}, expected ${JSON.stringify(exp.tiers)}`);
  for (const [sid, texts] of Object.entries(exp.sets ?? {})) if (!same(got.sets[sid], texts)) p.push(`set ${sid}: got ${JSON.stringify(got.sets[sid])}, expected ${JSON.stringify(texts)}`);
  return p;
}

// What a document means, for comparing round trips (I-01): spans no set lists do not count.
function meaning(doc) {
  const listed = new Set(doc.tiers.flatMap((t) => t.sets.flatMap((s) => s.members)));
  return {
    meta: doc.meta, text: doc.text,
    spans: [...doc.spans.values()].filter((s) => listed.has(s.id)).map((s) => [s.id, s.pieces.map((p) => [p.start, p.end])]),
    tiers: doc.tiers,
    styles: doc.styles.map((s) => { const { src, ...a } = s.attrs; return [a, s.css]; }),
    blocks: doc.blocks.map((b) => b.name),
  };
}

function roundTrip(doc) {
  const p = [];
  const s1 = save(doc);
  let d2;
  try { d2 = load(s1).doc; } catch (e) { return [`saved file does not load: ${e.message}`]; }
  if (!same(meaning(doc), meaning(d2))) p.push('load(save(doc)) differs from doc');
  const s2 = save(d2);
  if (s1 !== s2) p.push('save is not stable: saving the reloaded document gives different text');
  return p;
}

let failed = 0, trips = 0;
for (const path of files) {
  const exp = expectation(path);
  const got = run(path);
  const probs = exp ? compare(exp, got) : ['no <!-- expect {...} --> comment'];
  if (got.outcome === 'ok') { trips++; probs.push(...roundTrip(got.doc)); }
  console.log(`${probs.length ? 'FAIL' : 'ok  '} ${basename(path)}`);
  for (const q of probs) console.log('      ' + q);
  if (probs.length) failed++;
}
console.log(`${files.length} fixture(s), ${trips} round trip(s), ${failed} failed`);
process.exit(failed ? 1 : 0);
