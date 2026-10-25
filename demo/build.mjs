// Builds demo/sonnet18.pxml: Shakespeare's Sonnet 18 (1609, public domain) marked up through the
// Editor, the way a person would in the app. Run: node demo/build.mjs
//
// The scansion below is an EXAMPLE marked by the agent for the demo, not a scholarly reading.
// Only lines 1 to 4 and 13 to 14 are scanned, so the demo also shows work in progress. Check it
// before showing it as anyone's analysis.
import { readFileSync, writeFileSync } from 'node:fs';
import { load, save, Editor } from '../src/core/index.js';
import { providerFor } from '../src/providers/index.js';

const LINES = [
  "Shall I compare thee to a summer's day?",
  'Thou art more lovely and more temperate:',
  'Rough winds do shake the darling buds of May,',
  'And summer\'s lease hath all too short a date;',
  'Sometime too hot the eye of heaven shines,',
  "And often is his gold complexion dimm'd;",
  'And every fair from fair sometime declines,',
  "By chance or nature's changing course untrimm'd;",
  'But thy eternal summer shall not fade,',
  "Nor lose possession of that fair thou ow'st;",
  "Nor shall death brag thou wander'st in his shade,",
  "When in eternal lines to time thou grow'st:",
  'So long as men can breathe or eyes can see,',
  'So long lives this, and this gives life to thee.',
];
const STANZAS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13]];
const text = STANZAS.map((s) => s.map((i) => LINES[i]).join('\n')).join('\n\n');

// Syllables and stress for the lines scanned. u unstressed, S primary, s secondary.
const SCAN = {
  0: [['Shall', 'I', 'com', 'pare', 'thee', 'to', 'a', 'sum', "mer's", 'day'], 'uSuSuSuSuS'],
  1: [['Thou', 'art', 'more', 'love', 'ly', 'and', 'more', 'tem', 'per', 'ate'], 'uSuSuSuSus'],
  2: [['Rough', 'winds', 'do', 'shake', 'the', 'dar', 'ling', 'buds', 'of', 'May'], 'SSuSuSuSuS'],   // initial inversion
  3: [['And', 'sum', "mer's", 'lease', 'hath', 'all', 'too', 'short', 'a', 'date'], 'uSuSuSuSuS'],
  12: [['So', 'long', 'as', 'men', 'can', 'breathe', 'or', 'eyes', 'can', 'see'], 'uSuSuSuSuS'],
  13: [['So', 'long', 'lives', 'this', 'and', 'this', 'gives', 'life', 'to', 'thee'], 'uSuSuSuSuS'],
};
// End rhymes, ABAB CDCD EFEF GG, by line.
const RHYME = ['A', 'B', 'A', 'B', 'C', 'D', 'C', 'D', 'E', 'F', 'E', 'F', 'G', 'G'];

const meta = '<meta title="Sonnet 18" author="William Shakespeare" year="1609" language="en"/>';
const source = `${meta}\n\n<text xml:space="preserve">\n${text}\n</text>\n\n<markup xml:space="preserve">\n${text}\n</markup>\n`;
const { doc } = load(source);
const ed = new Editor(doc, { providers: providerFor });

// Where each line starts, in code points.
const starts = [];
{ let at = 0; for (const s of STANZAS) { for (const i of s) { starts[i] = at; at += [...LINES[i]].length + 1; } at += 1; } }

ed.addStandardTier('text.line@1');
ed.addStandardTier('text.stanza@1');
const words = ed.addStandardTier('english.word@1');
ed.setTier(words, { disabled: 'true' });                  // there for the asking, hidden by default
const lineSpans = doc.tiers.find((t) => t.attrs.role === 'line').sets[0].members;   // in text order

// Rhyme scheme: the lines themselves, by letter (these are the spans the line provider made, E-08).
const scheme = ed.addTier({ name: 'Rhyme scheme', role: 'rhyme-scheme', kind: 'relation' });
const letters = [...new Set(RHYME)];
const schemeSets = Object.fromEntries(letters.map((l) => [l, ed.addSet(scheme, { name: l })]));
RHYME.forEach((l, i) => ed.addMember(schemeSets[l], lineSpans[i]));

// Stress, by hand: syllables of the scanned lines.
const stress = ed.addTier({ name: 'Stress', role: 'stress' });
const sets = {
  S: ed.addSet(stress, { name: 'primary', key: 'primary' }),
  s: ed.addSet(stress, { name: 'secondary', key: 'secondary' }),
  u: ed.addSet(stress, { name: 'unstressed', key: 'unstressed' }),
};
for (const [i, [syls, pattern]] of Object.entries(SCAN)) {
  const line = [...LINES[i]];
  let p = 0;
  syls.forEach((syl, k) => {
    const at = line.join('').indexOf(syl, p);
    if (at < 0 || !/^[\s,.;:?!]*$/.test(line.slice(p, at).join(''))) throw new Error(`line ${+i + 1}: cannot place "${syl}"`);
    ed.mark(sets[pattern[k]], [[starts[i] + at, starts[i] + at + [...syl].length]]);
    p = at + [...syl].length;
  });
  if (line.slice(p).join('').replace(/[\s,.;:?!]/g, '')) throw new Error(`line ${+i + 1}: syllables stop short`);
}

// End rhyme: the last word of each line, in a set per letter.
const rhyme = ed.addTier({ name: 'End rhyme', role: 'rhyme', kind: 'relation' });
const rhymeSets = Object.fromEntries(letters.map((l) => [l, ed.addSet(rhyme, { name: l })]));
LINES.forEach((line, i) => {
  const m = line.match(/([A-Za-z']+)[^A-Za-z']*$/);
  const a = starts[i] + [...line.slice(0, m.index)].length;
  ed.mark(rhymeSets[RHYME[i]], [[a, a + [...m[1]].length]]);
});

// Two themes; the plain one is active.
ed.addTheme('Community', readFileSync(new URL('../themes/community.css', import.meta.url), 'utf8'));
ed.addTheme('Plain', readFileSync(new URL('../themes/plain.css', import.meta.url), 'utf8'));

const out = save(doc);
if (process.argv[1]?.endsWith('build.mjs')) {
  writeFileSync(new URL('./sonnet18.pxml', import.meta.url), out);
  console.log(`wrote demo/sonnet18.pxml (${doc.tiers.length} tiers, ${doc.spans.size} spans)`);
}
export { out as built };
