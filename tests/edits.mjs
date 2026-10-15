// Edits made to the model in memory must save to a valid file that loads back the same:
// crossing spans become heads and continuations, unlisted spans are dropped (A-12), and
// positions are code points (M-06). Usage: node tests/edits.mjs
import { load, save, spanText, PxmlError } from '../src/core/index.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failed++;
};

const base = `<text>
Twinkle, twinkle, little star,
</text>
<markup>
<span id="w1">Twinkle</span>, <span id="w2">twinkle</span>, <span id="w3">little</span> <span id="w4">star</span>,
</markup>
<analysis>
  <tier id="t1" name="Words" role="word">
    <set id="s1" members="w1,w2,w3,w4"/>
  </tier>
</analysis>`;

// 1. a span that crosses two others is cut into a head and continuations
{
  const { doc } = load(base);
  doc.spans.set('x1', { id: 'x1', pieces: [{ id: 'x1', start: 3, end: 12 }] });   // "nkle, twi"
  doc.tiers.push({ id: 't2', attrs: { name: 'Cross', kind: 'relation' }, sets: [{ id: 's2', attrs: {}, members: ['x1'], confirmed: [] }] });
  const out = save(doc);
  let d2;
  try { d2 = load(out).doc; } catch (e) { d2 = null; check('crossing span saves to a loadable file', false, e.message + '\n' + out); }
  if (d2) {
    check('crossing span saves to a loadable file', true);
    check('crossing span keeps its text', spanText(d2, 'x1') === 'nkle, twi', spanText(d2, 'x1'));
    check('crossing span is written in pieces', d2.spans.get('x1').pieces.length > 1, JSON.stringify(d2.spans.get('x1').pieces));
    check('other spans unchanged', ['w1', 'w2', 'w3', 'w4'].every((w) => spanText(d2, w) === spanText(doc, w)));
    check('saving again is stable', save(d2) === out);
  }
}

// 2. a span no set lists is dropped on export, with its continuations
{
  const { doc } = load(base);
  doc.tiers[0].sets[0].members = ['w1', 'w2', 'w4'];
  const d2 = load(save(doc)).doc;
  check('unlisted span is dropped', !d2.spans.has('w3') && d2.spans.size === 3);
}

// 3. positions are code points, even outside the Basic Multilingual Plane
{
  const src = `<text>
𐑑𐑢𐑦𐑙𐑒𐑩𐑤 star
</text>
<markup>
<span id="a">𐑑𐑢𐑦𐑙</span><span id="b">𐑒𐑩𐑤</span> <span id="c">star</span>
</markup>
<analysis><tier id="t"><set id="s" members="a,b,c"/></tier></analysis>`;
  const { doc } = load(src);
  const p = (id) => doc.spans.get(id).pieces[0];
  check('Shavian offsets are code points', p('a').start === 0 && p('a').end === 4 && p('b').end === 7 && p('c').start === 8,
        JSON.stringify([p('a'), p('b'), p('c')]));
  check('Shavian round trip', save(load(save(doc)).doc) === save(doc));
}

// 4. errors carry a line number
{
  let err = null;
  try { load('<text>\none\n</text>\n<markup>\none\n</markup>\n<analysis>\n<tier id="t"><set id="s" members="nope"/></tier>\n</analysis>'); }
  catch (e) { err = e; }
  check('error has code and line', err instanceof PxmlError && err.code === 'set-unknown-member' && err.line === 8, err && `${err.code} line ${err.line}`);
}

// 5. a DOCTYPE is rejected (B-03)
{
  let code = null;
  try { load('<!DOCTYPE pxml>\n<text>\na\n</text>\n<markup>\na\n</markup>'); } catch (e) { code = e.code; }
  check('DOCTYPE rejected', code === 'doctype-not-allowed', code);
}

console.log(failed ? `${failed} failed` : 'all edit checks passed');
process.exit(failed ? 1 : 0);
