#!/usr/bin/env python3
"""Reference checker for the pxml fixtures (stdlib only).

    check.py [--show] [FILE.pxml ...]     (default: every *.pxml beside this script)

Each fixture carries its own expectation in a comment:  <!-- expect {json} -->
  outcome   "ok" | "error"                    (default "ok")
  errors    [code]                            (default [])
  warnings  [code, ...]                       (default [])
  tiers     {channel: [text of each member]}  (only the tiers listed are compared)

This is a reference for the draft rules in spec/format.md, not the implementation.
"""
import json, os, re, sys
import xml.etree.ElementTree as ET

ID_RE = re.compile(r'[A-Za-z0-9_.]+')
CHANNEL_RE = re.compile(r'[A-Za-z][A-Za-z0-9_-]*')
PROVIDER_RE = re.compile(r'[a-z][a-z0-9.-]*@[0-9]+')
BLOCKS = ('meta', 'text', 'markup', 'analysis', 'style')
TIER_ATTRS = {'name', 'channel', 'members', 'kind', 'directed', 'group',
              'provider', 'reads', 'confirmed'}


class Fail(Exception):
    def __init__(self, code, detail=''):
        super().__init__(code)
        self.code, self.detail = code, detail


def xml_char_ok(c):
    n = ord(c)
    return n in (9, 10, 13) or 0x20 <= n <= 0xD7FF or 0xE000 <= n <= 0xFFFD or 0x10000 <= n <= 0x10FFFF


def sanitize(s, warnings):
    """Characters XML 1.0 forbids become U+FFFD, with a warning."""
    out, bad = [], False
    for c in s:
        if xml_char_ok(c):
            out.append(c)
        else:
            out.append('�')
            bad = True
    if bad:
        warnings.append('control-char')
    return ''.join(out)


def slug(name):
    s = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    if not s or not s[0].isalpha():
        s = 't-' + s
    return s.rstrip('-')


def keep_mask(raw):
    """Which characters of a block survive: one leading LF and the trailing LF plus
    indentation before the end tag are sliced off, then the common indentation of the
    non-blank lines is removed. Returns a list of booleans over raw."""
    n = len(raw)
    keep = [True] * n
    if raw.startswith('\n'):
        keep[0] = False
    m = re.search(r'\n[ \t]*\Z', raw)
    if m:
        for k in range(m.start(), n):
            keep[k] = False
    lines, cur = [], []
    for i in range(n):
        if not keep[i]:
            continue
        if raw[i] == '\n':
            lines.append(cur)
            cur = []
        else:
            cur.append(i)
    lines.append(cur)
    prefixes = []
    for ln in lines:
        s = ''.join(raw[i] for i in ln)
        if s.strip(' \t'):
            prefixes.append(s[:len(s) - len(s.lstrip(' \t'))])
    common = os.path.commonprefix(prefixes) if prefixes else ''
    for ln in lines:
        s = ''.join(raw[i] for i in ln)
        k = len(os.path.commonprefix([s, common]))
        for i in ln[:k]:
            keep[i] = False
    return keep


def apply_mask(raw, keep):
    text = ''.join(c for c, k in zip(raw, keep) if k)
    newidx = [0] * (len(raw) + 1)
    for i, k in enumerate(keep):
        newidx[i + 1] = newidx[i] + (1 if k else 0)
    return text, newidx


def flatten(markup, warnings):
    """Concatenate the markup's text nodes; record every span fragment's raw offsets."""
    parts, frags, pos = [], [], [0]

    def add(s):
        parts.append(s)
        pos[0] += len(s)

    def walk(e):
        if e.text:
            add(e.text)
        for ch in e:
            if ch.tag != 'span':
                raise Fail('markup-unknown-element', ch.tag)
            sid = ch.get('id')
            if sid is None:
                raise Fail('span-no-id')
            if not ID_RE.fullmatch(sid):
                raise Fail('span-bad-id', sid)
            if set(ch.attrib) - {'id'}:
                warnings.append('span-extra-attribute')
            start = pos[0]
            walk(ch)
            frags.append((sid, start, pos[0]))
            if ch.tail:
                add(ch.tail)

    walk(markup)
    return ''.join(parts), frags


def bad_src(p):
    return (p == '' or p.startswith('/') or p.startswith('~') or '\\' in p
            or re.match(r'[A-Za-z][A-Za-z0-9+.-]*:', p) is not None
            or '..' in p.split('/'))


def parse_ids(value):
    out = []
    for tok in re.split(r'[,\s]+', value.strip()):
        if not tok:
            continue
        m = re.fullmatch(r'(\d+)-(\d+)', tok)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            if a > b:
                raise Fail('tier-bad-range', tok)
            out.extend(str(i) for i in range(a, b + 1))
        else:
            out.append(tok)
    return out


def check(path, warnings):
    base = os.path.dirname(os.path.abspath(path))
    with open(path, 'rb') as f:
        data = f.read()
    try:
        src = data.decode('utf-8')
    except UnicodeDecodeError:
        raise Fail('not-utf8')
    src = sanitize(src.lstrip('﻿'), warnings)
    s = re.sub(r'\A\s*<\?xml[^>]*\?>', '', src)
    probe = re.sub(r'<!--.*?-->', '', s, flags=re.S).lstrip()
    wrapped = s if re.match(r'<pxml[\s>/]', probe) else '<pxml>' + s + '</pxml>'
    if '<![CDATA[' in re.sub(r'<!--.*?-->', '', wrapped, flags=re.S):
        raise Fail('cdata-not-allowed')
    try:
        root = ET.fromstring(wrapped)
    except ET.ParseError as e:
        raise Fail('xml-not-wellformed', str(e))

    blocks, css = {}, []
    for ch in root:
        if ch.tag in BLOCKS:
            if ch.tag == 'style':
                css.append(ch.text or '')
            elif ch.tag in blocks:
                raise Fail('block-duplicate', ch.tag)
            else:
                blocks[ch.tag] = ch
        elif not ch.tag.startswith('x-'):
            warnings.append('unknown-block')
    if 'text' not in blocks:
        raise Fail('block-missing-text')
    if 'markup' not in blocks:
        raise Fail('block-missing-markup')

    # ---- text
    t = blocks['text']
    if len(t):
        raise Fail('text-has-elements')
    body = t.text or ''
    ref = t.get('src')
    if ref is not None:
        if body.strip():
            raise Fail('text-src-and-body')
        if bad_src(ref):
            raise Fail('text-src-invalid', ref)
        p = os.path.join(base, *ref.split('/'))
        if not os.path.isfile(p):
            raise Fail('text-src-missing', ref)
        with open(p, 'rb') as f:
            raw = f.read().decode('utf-8').lstrip('﻿')
        raw = sanitize(raw, warnings).replace('\r\n', '\n')
        text = raw[:-1] if raw.endswith('\n') else raw
    else:
        text, _ = apply_mask(body, keep_mask(body))

    # ---- markup and the strip invariant
    raw, frags = flatten(blocks['markup'], warnings)
    mtext, newidx = apply_mask(raw, keep_mask(raw))
    if mtext != text:
        i = next((k for k in range(min(len(mtext), len(text))) if mtext[k] != text[k]),
                 min(len(mtext), len(text)))
        raise Fail('strip-mismatch', 'at %d: markup %r vs text %r' % (i, mtext[i:i + 12], text[i:i + 12]))
    spans = {}
    for sid, a, b in frags:
        spans.setdefault(sid, []).append((newidx[a], newidx[b]))
    for sid, fr in spans.items():
        fr.sort()
        for (a1, b1), (a2, b2) in zip(fr, fr[1:]):
            if a2 < b1:
                raise Fail('span-self-overlap', sid)
        if any(a == b for a, b in fr):
            warnings.append('span-empty')

    def span_text(sid):
        return ''.join(text[a:b] for a, b in spans[sid])

    # ---- analysis
    tiers = {}
    if 'analysis' in blocks:
        for tr in blocks['analysis']:
            if tr.tag != 'tier':
                raise Fail('analysis-unknown-element', tr.tag)
            if any(a not in TIER_ATTRS and not a.startswith('x-') for a in tr.attrib):
                warnings.append('tier-unknown-attribute')
            name = tr.get('name')
            if not name:
                raise Fail('tier-no-name')
            explicit = tr.get('channel') is not None
            channel = tr.get('channel') if explicit else slug(name)
            if not explicit and re.search(r'[^\x00-\x7f]', name):
                warnings.append('tier-slug-lossy')
            if not CHANNEL_RE.fullmatch(channel):
                raise Fail('tier-bad-channel', channel)
            if channel in tiers:
                both = explicit and tiers[channel]['explicit']
                raise Fail('tier-duplicate-channel' if both else 'tier-slug-collision', channel)
            kind = tr.get('kind', 'set')
            if kind not in ('set', 'relation'):
                raise Fail('tier-bad-kind', kind)
            directed = tr.get('directed')
            if directed is not None:
                if directed not in ('true', 'false'):
                    raise Fail('tier-bad-directed', directed)
                if directed == 'true' and kind != 'relation':
                    raise Fail('directed-without-relation', channel)
            prov = tr.get('provider')
            if prov is not None and not PROVIDER_RE.fullmatch(prov):
                raise Fail('provider-bad', prov)
            members = parse_ids(tr.get('members', ''))
            for m in members:
                if m not in spans:
                    raise Fail('tier-unknown-member', m)
            if len(set(members)) != len(members):
                warnings.append('tier-duplicate-member')
            for c in parse_ids(tr.get('confirmed', '')):
                if c not in members:
                    raise Fail('confirmed-not-member', c)
            tiers[channel] = {'explicit': explicit, 'reads': tr.get('reads', ''),
                              'texts': [span_text(m) for m in members]}
        for ch, info in tiers.items():
            for r in re.split(r'[,\s]+', info['reads'].strip()):
                if r and r not in tiers:
                    raise Fail('reads-unknown', r)

    if re.search(r'url\s*\(|@import', '\n'.join(css), re.I):
        warnings.append('style-url')
    return {ch: info['texts'] for ch, info in tiers.items()}


def run(path):
    warnings = []
    try:
        tiers = check(path, warnings)
        return {'outcome': 'ok', 'errors': [], 'warnings': sorted(set(warnings)), 'tiers': tiers}
    except Fail as e:
        return {'outcome': 'error', 'errors': [e.code], 'warnings': sorted(set(warnings)),
                'tiers': {}, 'detail': e.detail}


def expectation(path):
    with open(path, encoding='utf-8') as f:
        s = f.read()
    m = re.search(r'<!--\s*expect\s*(\{.*?\})\s*-->', s, re.S)
    return json.loads(m.group(1)) if m else None


def compare(exp, got):
    probs = []
    if got['outcome'] != exp.get('outcome', 'ok'):
        probs.append('outcome %s, expected %s' % (got['outcome'], exp.get('outcome', 'ok')))
    if got['errors'] != exp.get('errors', []):
        probs.append('errors %r, expected %r (%s)' % (got['errors'], exp.get('errors', []), got.get('detail', '')))
    if got['warnings'] != sorted(exp.get('warnings', [])):
        probs.append('warnings %r, expected %r' % (got['warnings'], sorted(exp.get('warnings', []))))
    for ch, texts in exp.get('tiers', {}).items():
        if got['tiers'].get(ch) != texts:
            probs.append('tier %s: got %r, expected %r' % (ch, got['tiers'].get(ch), texts))
    return probs


def main(argv):
    show = '--show' in argv
    files = [a for a in argv if not a.startswith('--')]
    if not files:
        here = os.path.dirname(os.path.abspath(__file__))
        files = sorted(os.path.join(here, f) for f in os.listdir(here) if f.endswith('.pxml'))
    failed = 0
    for path in files:
        got = run(path)
        name = os.path.basename(path)
        if show:
            print(name, json.dumps(got, ensure_ascii=False, indent=1))
            continue
        exp = expectation(path)
        if exp is None:
            probs = ['no <!-- expect {...} --> comment']
        else:
            probs = compare(exp, got)
        if probs:
            failed += 1
            print('FAIL', name)
            for p in probs:
                print('     ', p)
        else:
            print('ok  ', name)
    if not show:
        print('%d fixture(s), %d failed' % (len(files), failed))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
