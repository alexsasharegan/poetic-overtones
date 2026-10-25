// The demo document (demo/sonnet18.pxml): it loads cleanly, saves back unchanged, and is what
// demo/build.mjs makes. Usage: node tests/demo.mjs
import { readFileSync } from 'node:fs';
import { load, save, spanText } from '../src/core/index.js';
import { built } from '../demo/build.mjs';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failed++;
};

const file = readFileSync(new URL('../demo/sonnet18.pxml', import.meta.url), 'utf8');
const { doc, warnings } = load(file);
check('loads with no warnings', warnings.length === 0, JSON.stringify(warnings));
check('saves back unchanged', save(doc) === file);
check('is what demo/build.mjs makes', file === built, 'run: node demo/build.mjs');
const tier = (role) => doc.tiers.find((t) => t.attrs.role === role);
check('14 lines in 4 stanzas', tier('line').sets[0].members.length === 14 && tier('stanza').sets[0].members.length === 4);
check('the words tier is hidden', tier('word').attrs.disabled === 'true');
const stress = tier('stress');
check('60 syllables scanned, 31 of them stressed',
  stress.sets.reduce((n, s) => n + s.members.length, 0) === 60
  && stress.sets.find((s) => s.attrs.key === 'primary').members.length + stress.sets.find((s) => s.attrs.key === 'secondary').members.length === 31, stress.sets.map((s) => s.members.length).join());
check('seven rhyme letters, two words each', tier('rhyme').sets.length === 7 && tier('rhyme').sets.every((s) => s.members.length === 2));
check('rhyme words are the line ends', ['day', 'May'].join() === tier('rhyme').sets[0].members.map((m) => spanText(doc, m)).join());
check('rhyme scheme reuses the line spans', tier('rhyme-scheme').sets[0].members.every((m) => tier('line').sets[0].members.includes(m)));
check('two themes, Plain active', doc.styles.map((s) => s.attrs.name).join() === 'Community,Plain' && doc.styles[0].attrs.disabled === 'true' && doc.styles[1].attrs.disabled === undefined);

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
