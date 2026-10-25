// Selection helpers for the app (spec/app.md W-06). Pure functions over code point offsets (S-01).

const isWordChar = (c) => c !== undefined && /[\p{L}\p{M}\p{N}_]/u.test(c);
const isJoiner = (c) => c === "'" || c === '’' || c === '-';        // inside a word: don't, mother-in-law

// Widen the range [a, b) to whole words. A joiner counts as part of a word only when letters lie
// on both sides of it. An empty or all-space range is returned as it was.
export function snapToWords(text, a, b) {
  const cs = Array.from(text);
  const inWord = (i) => isWordChar(cs[i]) || (isJoiner(cs[i]) && isWordChar(cs[i - 1]) && isWordChar(cs[i + 1]));
  if (!(a < b)) return [a, b];
  let lo = a, hi = b;
  while (lo > 0 && inWord(lo - 1) && inWord(lo)) lo--;
  while (hi < cs.length && inWord(hi) && inWord(hi - 1)) hi++;
  // trim spaces the user's selection caught at the ends
  while (lo < hi && !inWord(lo)) lo++;
  while (hi > lo && !inWord(hi - 1)) hi--;
  return lo < hi ? [lo, hi] : [a, b];
}

// Does the piece [a, b) overlap any of the pieces already collected?
export const overlaps = (pieces, [a, b]) => pieces.some(([p, q]) => a < q && p < b);
