// The JavaScript providers (src/providers/) against the provider fixtures (spec/providers/fixtures/),
// with the same "reset equality" as spec/providers/run.py: for every tier whose provider is
// implemented here, recompute each keyed set and compare member pieces with the file.
// Providers that need a lexicon are not implemented in JavaScript yet and are reported as skipped.
// Usage: node tests/providers.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from '../src/core/index.js';
import { providerFor } from '../src/providers/index.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'providers', 'fixtures');
let failed = 0, checked = 0;
const skipped = new Set();
for (const f of readdirSync(dir).filter((x) => x.endsWith('.pxml')).sort()) {
  const { doc } = load(readFileSync(join(dir, f), 'utf8'));
  const probs = [];
  for (const t of doc.tiers) {
    if (!t.attrs.provider) continue;
    const p = providerFor(t.attrs.provider);
    if (!p) { skipped.add(t.attrs.provider); continue; }
    checked++;
    if (t.attrs.role !== p.provider.role) probs.push(`${p.id}: role ${t.attrs.role}, expected ${p.provider.role}`);
    const out = p.provider.run(doc.text);
    for (const key of p.provider.keys) {
      const set = t.sets.find((s) => s.attrs.key === key);
      const file = set ? set.members.map((m) => doc.spans.get(m).pieces.map((x) => [x.start, x.end])) : null;
      if (JSON.stringify(file) !== JSON.stringify(out[key])) probs.push(`${p.id} / ${key}:\n        file     ${JSON.stringify(file)}\n        provider ${JSON.stringify(out[key])}`);
    }
  }
  console.log(`${probs.length ? 'FAIL' : 'ok  '} ${f}`);
  for (const q of probs) console.log('      ' + q);
  if (probs.length) failed++;
}
console.log(`${checked} provider tier(s) checked, ${failed} file(s) failed; not in JavaScript yet: ${[...skipped].sort().join(', ') || 'none'}`);
process.exit(failed ? 1 : 0);
