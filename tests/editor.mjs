// Editing operations (src/core/edit.js): every change saves to a valid file that loads back
// the same, undo and redo restore exactly, ids are not reused within a session, and bad edits change nothing.
// Usage: node tests/editor.mjs
import { readFileSync } from 'node:fs';
import { load, save, spanText, Editor, cpIndex, utf16Index, PxmlError } from '../src/core/index.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failed++;
};
const roundTrips = (doc) => { const s = save(doc); return save(load(s).doc) === s; };
const throwsCode = (fn, code) => { try { fn(); return false; } catch (e) { return e instanceof PxmlError && e.code === code; } };

const src = readFileSync(new URL('../spec/fixtures/01-basic.pxml', import.meta.url), 'utf8');
const { doc } = load(src);
const ed = new Editor(doc);
const original = save(doc);
const text = doc.text;
const at = (word, from = 0) => { const k = [...text].join('').indexOf(word, from); return [cpIndex(text, k), cpIndex(text, k + word.length)]; };

// tiers
const t = ed.addTier({ name: 'Alliteration', role: 'alliteration', kind: 'relation' });
check('new tier goes on top', doc.tiers[doc.tiers.length - 1].id === t);
const s = ed.addSet(t, { name: 'tw', tags: ['sound:t'] });
const a = ed.mark(s, [at('Tw')]);
const b = ed.mark(s, [at('tw', 2)]);
check('marked members read back', doc.tiers.at(-1).sets[0].members.map((m) => spanText(doc, m)).join('|') === 'Tw|tw');
check('document still round-trips', roundTrips(doc));

// span reuse (E-08)
const again = ed.addSpan([at('Tw')]);
check('identical pieces reuse the span', again === a);

// members are kept in document order for undirected sets (A-05)
const s2 = ed.addSet(t, { name: 'later first' });
ed.mark(s2, [at('sky')]);
ed.mark(s2, [at('star')]);
check('undirected members in document order', doc.tiers.at(-1).sets[1].members.map((m) => spanText(doc, m)).join('|') === 'star|sky');

// directed relations keep the listed order and can be reordered
const d = ed.addTier({ name: 'Echo', kind: 'relation', directed: 'true' });
const ds = ed.addSet(d, {});
const m1 = ed.mark(ds, [at('sky')]), m2 = ed.mark(ds, [at('star')]);
check('directed members keep listed order', doc.tiers.at(-1).sets[0].members.join() === [m1, m2].join());
ed.moveMember(ds, m2, 0);
check('directed member moved', doc.tiers.at(-1).sets[0].members.join() === [m2, m1].join());
check('cannot reorder an undirected set', throwsCode(() => ed.moveMember(s, a, 0), 'edit-unordered-set'));

// layer order
ed.moveTier(t, 0);
check('tier moved to the bottom layer', doc.tiers[0].id === t);
check('tier order survives a save', load(save(doc)).doc.tiers[0].id === t);

// confirm
ed.setTier(t, { provider: 'demo.rhyme@1' });
ed.confirm(s, a);
check('confirmed saved', load(save(doc)).doc.tiers[0].sets[0].confirmed.join() === a);
ed.removeMember(s, a);
check('removing a member unconfirms it', doc.tiers[0].sets[0].confirmed.length === 0);

// validation: a bad edit throws and changes nothing
const before = save(doc);
check('bad role rejected', throwsCode(() => ed.setTier(t, { role: 'Rhyme Scheme' }), 'role-bad'));
check('directed needs relation', throwsCode(() => ed.setTier(t, { kind: 'label', directed: 'true' }), 'directed-without-relation'));
check('duplicate key rejected', throwsCode(() => { const x = ed.addSet(t, { key: 'k' }); ed.addSet(t, { key: 'k' }); }, 'key-duplicate'));
ed.undo();       // the first addSet of the previous line did apply
check('out-of-range span rejected', throwsCode(() => ed.addSpan([[0, 10_000]]), 'edit-bad-range'));
check('self-overlapping pieces rejected', throwsCode(() => ed.addSpan([[0, 5], [3, 8]]), 'span-self-overlap'));
check('failed edits changed nothing', save(doc) === before);

// ids are not reused within a session (S-04, ADR-0015)
const gone = ed.addTier({ name: 'temporary' });
ed.removeTier(gone);
const fresh = ed.addTier({ name: 'next' });
check('a deleted id is not reused', fresh !== gone);
ed.removeTier(fresh);

// removing a tier that others read keeps the file valid
const base = ed.addTier({ name: 'Base' });
const reader = ed.addTier({ name: 'Reader' });
ed.setTier(reader, { reads: base });
ed.removeTier(base);
check('reads cleaned up', !doc.tiers.find((x) => x.id === reader).attrs.reads && roundTrips(doc));

// undo everything, redo everything
const end = save(doc);
let n = 0;
while (ed.undo()) n++;
check(`undo all (${n} steps) restores the original`, save(doc) === original);
while (ed.redo()) n--;
check('redo all restores the end state', save(doc) === end && n === 0);

// themes (S-05)
{
  const { doc: td } = load(readFileSync(new URL('../spec/fixtures/16-disabled.pxml', import.meta.url), 'utf8'));
  const te = new Editor(td);
  te.useTheme('dark');
  check('useTheme switches the active theme', JSON.stringify(te.themes) === JSON.stringify([{ name: 'light', active: false }, { name: 'dark', active: true }]));
  check('unknown theme rejected', throwsCode(() => te.useTheme('nope'), 'edit-unknown-theme'));
  te.undo();
  check('theme switch undoes', te.themes[0].active && !te.themes[1].active);
}

// code points and UTF-16
const sh = '𐑑𐑢 star';
check('cpIndex/utf16Index', cpIndex(sh, 4) === 2 && utf16Index(sh, 2) === 4 && cpIndex(sh, sh.length) === 7);

console.log(failed ? `${failed} failed` : 'all editor checks passed');
process.exit(failed ? 1 : 0);
