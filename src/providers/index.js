// Standard providers that need no lexicon (spec/providers/contract.md, english.md E-01 to E-14).
// A port of spec/providers/reference.py; the provider fixtures test both.
//
// A provider is a pure function (C-01): given the text and the tiers it reads, it returns, for
// each set it owns (by key), the members as lists of pieces [start, end] in code points (C-03).
//
//   PROVIDERS['text.line'].run(text)  ->  { line: [[[0, 14]], [[15, 32]], ...] }
//
// Each entry also says its version, the role it gives its tier (C-09), the providers it reads,
// the keys of the sets it owns, and a default name for the tier and for each set.

const WORD_CHAR = /[\p{L}\p{M}\p{N}]/u;
const JOINERS = new Set(["'", '’', '-', '‐']);
const isSpace = (c) => /\s/u.test(c);

// The non-blank lines, each trimmed: [start, end] in code points, or null for a blank line.
function lineExtents(chars) {
  const out = [];
  let pos = 0;
  while (pos <= chars.length) {
    let end = chars.indexOf('\n', pos);
    if (end < 0) end = chars.length;
    let a = pos, b = end;
    while (a < b && isSpace(chars[a])) a++;
    while (b > a && isSpace(chars[b - 1])) b--;
    out.push(b > a ? [a, b] : null);
    pos = end + 1;
  }
  return out;
}

export function lines(text) {                 // E-01
  return lineExtents(Array.from(text)).filter(Boolean).map((e) => [e]);
}

export function stanzas(text) {               // E-02: runs of non-blank lines
  const out = [];
  let start = null, end = null;
  for (const e of lineExtents(Array.from(text))) {
    if (e) { if (start === null) start = e[0]; end = e[1]; }
    else if (start !== null) { out.push([[start, end]]); start = null; }
  }
  if (start !== null) out.push([[start, end]]);
  return out;
}

export function words(text) {                 // E-10 to E-14
  const chars = Array.from(text), n = chars.length, out = [];
  let i = 0;
  while (i < n) {
    if (!WORD_CHAR.test(chars[i])) { i++; continue; }
    let j = i + 1;
    while (j < n) {
      if (WORD_CHAR.test(chars[j])) j++;
      else if (JOINERS.has(chars[j]) && j + 1 < n && WORD_CHAR.test(chars[j + 1])) j += 2;
      else break;
    }
    out.push([[i, j]]);
    i = j;
  }
  return out;
}

export const PROVIDERS = {
  'text.line': {
    version: 1, role: 'line', reads: [], keys: ['line'], name: 'Lines', setNames: { line: 'Line' },
    run: (text) => ({ line: lines(text) }),
  },
  'text.stanza': {
    version: 1, role: 'stanza', reads: [], keys: ['stanza'], name: 'Stanzas', setNames: { stanza: 'Stanza' },
    run: (text) => ({ stanza: stanzas(text) }),
  },
  'english.word': {
    version: 1, role: 'word', reads: [], keys: ['word'], name: 'Words', setNames: { word: 'Word' },
    run: (text) => ({ word: words(text) }),
  },
};

// 'text.line@1' -> { id: 'text.line', version: 1, provider } or null when unknown.
export function providerFor(ref) {
  const m = /^(.+)@(\d+)$/.exec(ref || '');
  if (!m || !PROVIDERS[m[1]] || PROVIDERS[m[1]].version !== +m[2]) return null;
  return { id: m[1], version: +m[2], provider: PROVIDERS[m[1]] };
}
