// Standard tiers and reset (spec/app.md E-01 to E-09) with the JavaScript providers.
// Usage: node tests/reset.mjs
import { readFileSync } from 'node:fs';
import { load, save, spanText, Editor, PxmlError } from '../src/core/index.js';
import { providerFor } from '../src/providers/index.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failed++;
};
const throwsCode = (fn, code) => { try { fn(); return false; } catch (e) { return e instanceof PxmlError && e.code === code; } };
const texts = (doc, set) => set.members.map((m) => spanText(doc, m));

const src = readFileSync(new URL('../spec/fixtures/01-basic.pxml', import.meta.url), 'utf8');
const { doc } = load(src);
const ed = new Editor(doc, { providers: providerFor });
const before = save(doc);

// add standard tiers
const lines = ed.addStandardTier('text.line@1');
const words = ed.addStandardTier('english.word@1');
const tl = doc.tiers.find((t) => t.id === lines), tw = doc.tiers.find((t) => t.id === words);
check('line tier has role, provider and a keyed set', tl.attrs.role === 'line' && tl.attrs.provider === 'text.line@1' && tl.sets[0].attrs.key === 'line');
check('lines are the four lines', JSON.stringify(texts(doc, tl.sets[0])) === JSON.stringify(['Twinkle, twinkle, little star,', 'How I wonder what you are!', 'Up above the world so high,', 'Like a diamond in the sky.']));
check('existing line spans are reused (E-08)', tl.sets[0].members.join() === '1,2,3,4', tl.sets[0].members.join());
check('words split as specified', texts(doc, tw.sets[0]).slice(0, 4).join('|') === 'Twinkle|twinkle|little|star' && tw.sets[0].members.length === 22, String(tw.sets[0].members.length));
check('saved file is valid and stable', (() => { const s = save(doc); return save(load(s).doc) === s; })());

// hand edits on a standard tier, then reset
const ws = tw.sets[0];
const star = ws.members[3];
ed.confirm(ws.id, star);
ed.removeMember(ws.id, ws.members[0]);                              // the user drops "Twinkle"
const mine = ed.addSet(words, { name: 'my favourites' });           // a keyless set: the user's
ed.list(mine, star);
ed.reset(words);
check('reset restores the provider members', ws.members.length === 22 && texts(doc, ws)[0] === 'Twinkle');
check('reset keeps a set without a key', tw.sets.some((s) => s.id === mine && s.members.join() === star));
check('a member produced again stays confirmed', ws.confirmed.join() === star);

// reset after a hand-made span: the provider's span ids are stable across resets
const ids1 = ws.members.join();
ed.reset(words);
check('a second reset changes nothing', ws.members.join() === ids1);

// unlink, refusals, undo
ed.unlink(lines);
check('unlink removes the provider', !tl.attrs.provider && throwsCode(() => ed.reset(lines), 'edit-not-standard'));
check('unknown provider refused', throwsCode(() => ed.addStandardTier('english.stress@1'), 'edit-unknown-provider'));
while (ed.undo());
check('undo all restores the original', save(doc) === before);

// without providers, the core has none (E-07)
const bare = new Editor(load(src).doc);
check('the core ships with no provider', throwsCode(() => bare.addStandardTier('text.line@1'), 'edit-unknown-provider'));

console.log(failed ? `${failed} failed` : 'all reset checks passed');
process.exit(failed ? 1 : 0);
