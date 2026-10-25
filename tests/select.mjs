// Selection helpers (spec/app.md W-06). Usage: node tests/select.mjs
import { snapToWords, overlaps } from '../src/render/select.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failed++;
};
const snap = (text, a, b) => JSON.stringify(snapToWords(text, a, b));
const t = "Twinkle, twinkle, don't stop";

check('a partial selection widens to the whole word', snap(t, 2, 5) === '[0,7]');
check('a selection across two words widens at both ends', snap(t, 4, 12) === '[0,16]', snap(t, 4, 12));
check('an apostrophe inside a word keeps it whole', snap(t, 19, 21) === '[18,23]', snap(t, 19, 21));
check('punctuation at the end is not taken in', snap(t, 0, 8) === '[0,7]', snap(t, 0, 8));
check('leading spaces are trimmed', snap('a  bc', 1, 4) === '[3,5]', snap('a  bc', 1, 4));
check('a collapsed range is unchanged', snap(t, 3, 3) === '[3,3]');
check('only spaces: unchanged', snap('a   b', 1, 3) === '[1,3]');
check('combining marks stay with their letter', snap('café au', 3, 4) === '[0,5]', snap('café au', 3, 4));
check('code points above the BMP count once', snap('𐑞 𐑐𐑮𐑦𐑯', 3, 4) === '[2,6]', snap('𐑞 𐑐𐑮𐑦𐑯', 3, 4));
check('hyphen between letters joins', snap('mother-in-law is', 7, 9) === '[0,13]', snap('mother-in-law is', 7, 9));
check('overlap test', overlaps([[0, 3]], [2, 5]) && !overlaps([[0, 3]], [3, 5]) && !overlaps([], [0, 1]));

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
