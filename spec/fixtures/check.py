#!/usr/bin/env python3
"""Reference checker for the pxml fixtures (stdlib only).

    check.py [--show] [FILE.pxml ...]     (default: every *.pxml beside this script)

Each fixture carries its own expectation in a comment:  <!-- expect {json} -->
  outcome   "ok" | "error"                    (default "ok")
  errors    [code]                            (default [])
  warnings  [code, ...]                       (default [])
  sets      {set id: [text of each member]}   (only the sets listed are compared)
  tiers     [[tier id, role or null], ...]    (every tier, in order; compared when given)

This is a reference for the draft rules in spec/format.md, not the implementation.
"""
import json, os, re, sys
import xml.etree.ElementTree as ET

ID_RE = re.compile(r'[A-Za-z0-9_]+')
PROVIDER_RE = re.compile(r'[a-z][a-z0-9.-]*@[0-9]+')
BLOCKS = ('meta', 'text', 'markup', 'analysis', 'style')
TIER_ATTRS = {'id', 'name', 'role', 'kind', 'directed', 'provider', 'reads', 'disabled'}
STYLE_ATTRS = {'name', 'disabled', 'src'}
SET_ATTRS = {'id', 'name', 'key', 'members', 'confirmed', 'tags'}
KEY_RE = re.compile(r'[a-z][a-z0-9_]*')
ROLE_RE = re.compile(r'[a-z][a-z0-9_-]*')
TAG_RE = re.compile(r'[A-Za-z0-9_.:+-]+')


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


def keep_mask(raw, lead=True):
    """Which characters of a block survive: one leading LF and the trailing LF plus
    indentation before the end tag are sliced off, then the common indentation of the
    non-blank lines is removed. Returns a list of booleans over raw."""
    n = len(raw)
    keep = [True] * n
    if lead and raw.startswith('\n'):
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
    """Concatenate the markup's text nodes; record every span element's raw offsets."""
    parts, frags, pos = [], [], [0]

    def add(t):
        parts.append(t)
        pos[0] += len(t)

    def walk(e):
        if e.text:
            add(e.text)
        for ch in e:
            if not isinstance(ch.tag, str):
                raise Fail('comment-in-text')
            if ch.tag != 'span':
                raise Fail('markup-unknown-element', ch.tag)
            sid, cont = ch.get('id'), ch.get('cont')
            if sid is None:
                raise Fail('span-no-id')
            for v in (sid, cont):
                if v is not None and not ID_RE.fullmatch(v):
                    raise Fail('id-bad', v)
            if set(ch.attrib) - {'id', 'cont'}:
                warnings.append('span-extra-attribute')
            start = pos[0]
            walk(ch)
            frags.append((sid, cont, start, pos[0]))
            if ch.tail:
                add(ch.tail)

    walk(markup)
    return ''.join(parts), frags


def bad_src(p):
    return (p == '' or p.startswith('/') or p.startswith('~') or '\\' in p
            or re.match(r'[A-Za-z][A-Za-z0-9+.-]*:', p) is not None
            or '..' in p.split('/'))


def read_ref(ch, base, warnings, kind):
    """Body of a self-closing src reference: raw file contents, BOM ignored, LF line ends."""
    ref = ch.get('src')
    if ''.join(ch.itertext()).strip():
        raise Fail(kind + '-src-and-body')
    if bad_src(ref):
        raise Fail(kind + '-src-invalid', ref)
    p = os.path.join(base, *ref.split('/'))
    if not os.path.isfile(p):
        raise Fail(kind + '-src-missing', ref)
    with open(p, 'rb') as f:
        raw = f.read().decode('utf-8').lstrip('\ufeff')
    return sanitize(raw, warnings).replace('\r\n', '\n')


def load_style(ch, base, warnings):
    if any(k not in STYLE_ATTRS and not k.startswith('x-') for k in ch.attrib):
        warnings.append('unknown-attribute')
    if ch.get('disabled') not in (None, 'true', 'false'):
        raise Fail('disabled-bad', ch.get('disabled'))
    if ch.get('src') is not None:
        return read_ref(ch, base, warnings, 'style')
    return ''.join(ch.itertext())


def parse_ids(value):
    """Explicit ids separated by commas and/or whitespace. No ranges."""
    out = []
    for tok in re.split(r'[,\s]+', value.strip()):
        if not tok:
            continue
        if not ID_RE.fullmatch(tok):
            raise Fail('id-bad', tok)
        out.append(tok)
    return out


def load(path, warnings):
    """Parse and validate one file. Returns the model: text, heads, tiers, sets, x-blocks."""
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
    if re.search(r'<!DOCTYPE', re.sub(r'<!--.*?-->', '', wrapped, flags=re.S), re.I):
        raise Fail('doctype-not-allowed')
    try:
        root = ET.fromstring(wrapped, parser=ET.XMLParser(
            target=ET.TreeBuilder(insert_comments=True, insert_pis=True)))
    except ET.ParseError as e:
        raise Fail('xml-not-wellformed', str(e))

    blocks, css, xblocks = {}, [], {}
    for ch in root:
        if not isinstance(ch.tag, str):
            continue          # comments and processing instructions between blocks
        if ch.tag in BLOCKS:
            if ch.tag == 'style':
                css.append(load_style(ch, base, warnings))
            elif ch.tag in blocks:
                raise Fail('block-duplicate', ch.tag)
            else:
                blocks[ch.tag] = ch
        elif ch.tag.startswith('x-'):
            xblocks.setdefault(ch.tag, []).append(ch)
        else:
            warnings.append('unknown-block')
    if 'text' not in blocks:
        raise Fail('block-missing-text')
    if 'markup' not in blocks:
        raise Fail('block-missing-markup')

    # ---- text
    t = blocks['text']
    if any(not isinstance(x.tag, str) for x in t):
        raise Fail('comment-in-text')
    if len(t):
        raise Fail('text-has-elements')
    body = t.text or ''
    ref = t.get('src')
    if ref is not None:
        raw = read_ref(t, base, warnings, 'text')
        text, _ = apply_mask(raw, keep_mask(raw, lead=False))
    else:
        text, _ = apply_mask(body, keep_mask(body))

    # ---- markup and the strip invariant
    raw, frags = flatten(blocks['markup'], warnings)
    mtext, newidx = apply_mask(raw, keep_mask(raw))
    if mtext != text:
        i = next((k for k in range(min(len(mtext), len(text))) if mtext[k] != text[k]),
                 min(len(mtext), len(text)))
        raise Fail('strip-mismatch', 'at %d: markup %r vs text %r' % (i, mtext[i:i + 12], text[i:i + 12]))
    all_ids = {}

    def claim(i, what):
        if i in all_ids:
            raise Fail('id-duplicate', i)
        all_ids[i] = what

    heads, conts = {}, []
    for sid, cont, a0, b0 in sorted(frags, key=lambda f: (f[2], -f[3])):
        a1, b1 = newidx[a0], newidx[b0]
        if sid is not None:
            claim(sid, 'span')
        if cont is None:
            heads[sid] = [(a1, b1)]
        else:
            conts.append((cont, sid, a1, b1))
    cont_ids = {sid for _, sid, _, _ in conts if sid is not None}
    for cont, sid, a1, b1 in conts:
        if cont in cont_ids:
            raise Fail('cont-not-head', cont)
        if cont not in heads:
            raise Fail('cont-unknown', cont)
        if heads[cont][0][0] > a1:
            raise Fail('cont-before-head', cont)
        heads[cont].append((a1, b1))
    for sid, fr in heads.items():
        fr.sort()
        for (a1, b1), (a2, b2) in zip(fr, fr[1:]):
            if a2 < b1:
                raise Fail('span-self-overlap', sid)
        if any(a1 == b1 for a1, b1 in fr):
            warnings.append('span-empty')

    def span_text(sid):
        return ''.join(text[a1:b1] for a1, b1 in heads[sid])

    # ---- analysis: tiers contain sets; sets list span ids
    tiers, sets = {}, {}
    if 'analysis' in blocks:
        for tr in (x for x in blocks['analysis'] if isinstance(x.tag, str)):
            if tr.tag != 'tier':
                raise Fail('analysis-unknown-element', tr.tag)
            if any(k not in TIER_ATTRS and not k.startswith('x-') for k in tr.attrib):
                warnings.append('unknown-attribute')
            tid = tr.get('id')
            if tid is None:
                raise Fail('tier-no-id')
            if not ID_RE.fullmatch(tid):
                raise Fail('id-bad', tid)
            claim(tid, 'tier')
            role = tr.get('role')
            if role is not None and not ROLE_RE.fullmatch(role):
                raise Fail('role-bad', role)
            kind = tr.get('kind', 'label')
            if kind not in ('label', 'relation'):
                raise Fail('tier-bad-kind', kind)
            directed = tr.get('directed')
            if directed is not None:
                if directed not in ('true', 'false'):
                    raise Fail('tier-bad-directed', directed)
                if directed == 'true' and kind != 'relation':
                    raise Fail('directed-without-relation', tid)
            is_directed = directed == 'true'
            if tr.get('disabled') not in (None, 'true', 'false'):
                raise Fail('disabled-bad', tr.get('disabled'))
            prov = tr.get('provider')
            if prov is not None and not PROVIDER_RE.fullmatch(prov):
                raise Fail('provider-bad', prov)
            tiers[tid] = {'id': tid, 'name': tr.get('name'), 'role': role, 'kind': kind, 'directed': is_directed,
                          'provider': prov, 'reads': tr.get('reads', ''),
                          'disabled': tr.get('disabled') == 'true', 'attrs': dict(tr.attrib), 'sets': []}
            keys = set()
            for st in (x for x in tr if isinstance(x.tag, str)):
                if st.tag != 'set':
                    raise Fail('analysis-unknown-element', st.tag)
                if any(k not in SET_ATTRS and not k.startswith('x-') for k in st.attrib):
                    warnings.append('unknown-attribute')
                setid = st.get('id')
                if setid is None:
                    raise Fail('set-no-id')
                if not ID_RE.fullmatch(setid):
                    raise Fail('id-bad', setid)
                claim(setid, 'set')
                key = st.get('key')
                if key is not None:
                    if not KEY_RE.fullmatch(key):
                        raise Fail('key-bad', key)
                    if key in keys:
                        raise Fail('key-duplicate', key)
                    keys.add(key)
                members = parse_ids(st.get('members', ''))
                for m in members:
                    if m in cont_ids:
                        raise Fail('member-is-continuation', m)
                    if m not in heads:
                        raise Fail('set-unknown-member', m)
                if len(set(members)) != len(members):
                    warnings.append('set-duplicate-member')
                for tg in st.get('tags', '').split():
                    if not TAG_RE.fullmatch(tg):
                        raise Fail('tag-bad', tg)
                if not is_directed:      # an undirected set is unordered: report document order
                    members = sorted(members, key=lambda m: heads[m][0][0])
                confirmed = parse_ids(st.get('confirmed', ''))
                for c in confirmed:
                    if c not in members:
                        raise Fail('confirmed-not-member', c)
                sets[setid] = [span_text(m) for m in members]
                tiers[tid]['sets'].append({'id': setid, 'name': st.get('name'), 'key': key, 'members': members,
                                           'confirmed': confirmed, 'tags': st.get('tags', '').split()})
        for tid, info in tiers.items():
            for r in re.split(r'[,\s]+', info['reads'].strip()):
                if r and r not in tiers:
                    raise Fail('reads-unknown', r)

    if re.search(r'url\s*\(|@import', '\n'.join(css), re.I):
        warnings.append('style-url')
    return {'text': text, 'heads': heads, 'tiers': list(tiers.values()), 'sets': sets, 'xblocks': xblocks}


def check(path, warnings):
    return load(path, warnings)


def run(path):
    warnings = []
    try:
        model = check(path, warnings)
        return {'outcome': 'ok', 'errors': [], 'warnings': sorted(set(warnings)), 'sets': model['sets'],
                'tiers': [[t['id'], t['role']] for t in model['tiers']]}
    except Fail as e:
        return {'outcome': 'error', 'errors': [e.code], 'warnings': sorted(set(warnings)),
                'sets': {}, 'detail': e.detail}


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
    if 'tiers' in exp and got.get('tiers') != exp['tiers']:
        probs.append('tiers %r, expected %r' % (got.get('tiers'), exp['tiers']))
    for sid, texts in exp.get('sets', {}).items():
        if got['sets'].get(sid) != texts:
            probs.append('set %s: got %r, expected %r' % (sid, got['sets'].get(sid), texts))
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
