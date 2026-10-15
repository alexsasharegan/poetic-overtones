"""Reference providers for spec/providers/ (stdlib only).

A provider is a pure function: text, the contents of the tiers it reads, and a lexicon go in;
the members of each set it owns come out. A member is a list of pieces, a piece is a
(start, end) pair of code point offsets in the input text. This file is a reference for
the rules in contract.md and english.md, not the implementation.
"""
import unicodedata

QUOTE = {'\u2019': "'", '\u2010': '-'}


def norm(s):
    """Lookup form: apostrophe and hyphen variants unified, simple one-to-one lower-casing."""
    out = []
    for ch in s:
        ch = QUOTE.get(ch, ch)
        lo = ch.lower()
        out.append(lo if len(lo) == 1 else ch)
    return ''.join(out)


def word_char(ch):
    return unicodedata.category(ch)[0] in ('L', 'M', 'N')


# ---- language-neutral

def _line_extents(text):
    pos = 0
    for ln in text.split('\n'):
        s, e = len(ln) - len(ln.lstrip()), len(ln.rstrip())
        yield (pos + s, pos + e) if e > s else None
        pos += len(ln) + 1


def lines(text):
    return [[ext] for ext in _line_extents(text) if ext]


def stanzas(text):
    out, start, end = [], None, None
    for ext in _line_extents(text):
        if ext:
            start = ext[0] if start is None else start
            end = ext[1]
        elif start is not None:
            out.append([(start, end)])
            start = None
    if start is not None:
        out.append([(start, end)])
    return out


# ---- English

def words(text):
    out, i, n = [], 0, len(text)
    while i < n:
        if not word_char(text[i]):
            i += 1
            continue
        j = i + 1
        while j < n:
            if word_char(text[j]):
                j += 1
            elif text[j] in "'\u2019-\u2010" and j + 1 < n and word_char(text[j + 1]):
                j += 2
            else:
                break
        out.append([(i, j)])
        i = j
    return out


def parse_lexicon(txt):
    """word TAB syllable syllable ...   with  syllable = letters|ipa|stress  (stress 0, 1 or 2)."""
    lex = {}
    for line in txt.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        word, rest = line.split('\t', 1)
        sylls = []
        for tok in rest.split():
            letters, ipa, stress = tok.split('|')
            sylls.append((letters, ipa, int(stress)))
        lex.setdefault(norm(word), []).append(sylls)
    return lex


def _lookup(key, lex):
    entries = lex.get(key)
    if not entries:
        return None
    first = entries[0]
    if ''.join(norm(l) for l, _, _ in first) != key:
        return None                      # a malformed entry counts as no entry
    out, off = [], 0
    for letters, ipa, st in first:
        out.append((off, off + len(letters), ipa, st))
        off += len(letters)
    amb = any([s for _, _, s in e] != [s for _, _, s in first] for e in entries[1:])
    return out, amb


def analyze_word(wtext, lex):
    """(syllables, ambiguous) for a word, or None. Syllables are (start, end, ipa, stress)
    relative to the word. A hyphenated word not in the lexicon is tried part by part."""
    key = norm(wtext)
    r = _lookup(key, lex)
    if r is not None:
        return r
    parts = key.split('-')
    if len(parts) == 1:
        return None
    out, off, amb = [], 0, False
    for p in parts:
        r = _lookup(p, lex)
        if r is None:
            return None
        sylls, a = r
        out += [(off + x, off + y, ipa, st) for x, y, ipa, st in sylls]
        amb = amb or a
        off += len(p) + 1
    return out, amb


# ---- providers

PROVIDERS = {
    'text.line': ((), ['line']),
    'text.stanza': ((), ['stanza']),
    'english.word': ((), ['word']),
    'english.syllable': (('english.word',), ['syllable', 'unknown']),
    'english.stress': (('english.word', 'english.syllable'),
                       ['primary', 'secondary', 'unstressed', 'check', 'unmarked']),
}
STRESS_KEY = {1: 'primary', 2: 'secondary', 0: 'unstressed'}
ROLE = {'text.line': 'line', 'text.stanza': 'stanza', 'english.word': 'word',
        'english.syllable': 'syllable', 'english.stress': 'stress'}


def run(pid, text, inp, lex):
    if pid == 'text.line':
        return {'line': lines(text)}
    if pid == 'text.stanza':
        return {'stanza': stanzas(text)}
    if pid == 'english.word':
        return {'word': words(text)}
    if pid == 'english.syllable':
        syl, unk = [], []
        for m in inp['english.word']['word']:
            a, b = m[0]
            r = analyze_word(text[a:b], lex)
            if r is None:
                unk.append(m)
            else:
                syl += [[(a + x, a + y)] for x, y, _, _ in r[0]]
        return {'syllable': syl, 'unknown': unk}
    if pid == 'english.stress':
        res = {k: [] for k in PROVIDERS[pid][1]}
        sylls = inp['english.syllable']['syllable']
        for m in inp['english.word']['word']:
            a, b = m[0]
            r = analyze_word(text[a:b], lex)
            if r is None:
                continue
            entry, amb = r
            if amb:
                res['check'].append(m)
            inside = [s for s in sylls if s[0][0] >= a and s[-1][1] <= b]
            if len(inside) != len(entry):
                res['unmarked'] += inside
                continue
            for s, (_, _, _, st) in zip(inside, entry):
                res[STRESS_KEY[st]].append(s)
        for v in res.values():
            v.sort()
        return res
    raise KeyError(pid)
