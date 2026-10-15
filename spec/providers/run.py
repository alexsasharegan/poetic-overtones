#!/usr/bin/env python3
"""Provider conformance runner (stdlib only).

    run.py [FILE.pxml ...]     (default: every *.pxml in providers/fixtures/)

A provider fixture is an ordinary document in which the provider tiers are already filled,
plus an <x-lexicon> block. For every tier with a provider, the runner recomputes what the
provider would put in each of its sets (the sets that carry a key) from the text, the
tiers it reads and the lexicon, and requires the result to equal the file. Ids are opaque,
so the comparison is by position: the pieces of each member, in document order.
"""
import importlib.util, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import reference as ref

_spec = importlib.util.spec_from_file_location('chk', os.path.join(HERE, '..', 'fixtures', 'check.py'))
chk = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(chk)


def members_of(model, st):
    return [sorted(model['heads'][m]) for m in st['members']]


def run_file(path):
    problems, warnings = [], []
    try:
        model = chk.load(path, warnings)
    except chk.Fail as e:
        return ['file does not load: %s %s' % (e.code, e.detail)]
    text = model['text']
    lexblock = model['xblocks'].get('x-lexicon')
    lex = ref.parse_lexicon(''.join(lexblock[0].itertext())) if lexblock else {}
    tier_of, file_out, hand = {}, {}, set()
    for t in model['tiers']:
        if t['attrs'].get('x-as') and not t['provider']:   # a hand-made tier standing in as a provider's input
            pid = t['attrs']['x-as']
            tier_of[pid] = t
            file_out[pid] = {s['key']: members_of(model, s) for s in t['sets'] if s['key']}
            hand.add(pid)
            continue
        if t['provider']:
            pid, ver = t['provider'].split('@')
            if pid not in ref.PROVIDERS or ver != '1':
                problems.append('tier %s: unknown provider %s' % (t['id'], t['provider']))
                continue
            tier_of[pid] = t
            file_out[pid] = {s['key']: members_of(model, s) for s in t['sets'] if s['key']}
    for pid, t in tier_of.items():
        if pid in hand:
            continue
        needs, keys = ref.PROVIDERS[pid]
        reads = t['reads'].replace(',', ' ').split()
        for need in needs:
            if need not in tier_of:
                problems.append('%s: needs a %s tier in the file' % (pid, need))
            elif tier_of[need]['id'] not in reads:
                problems.append('%s: reads should list tier %s (%s)' % (pid, tier_of[need]['id'], need))
        if set(file_out[pid]) != set(keys):
            problems.append('%s: set keys %s, expected %s' % (pid, sorted(file_out[pid]), sorted(keys)))
            continue
        if any(n not in tier_of for n in needs):
            continue
        got = ref.run(pid, text, {n: file_out[n] for n in needs}, lex)
        for k in keys:
            want = [[list(p) for p in m] for m in file_out[pid][k]]
            have = [[list(p) for p in m] for m in got[k]]
            if want != have:
                show = lambda ms: [text[m[0][0]:m[0][1]] if len(m) == 1 else m for m in ms]
                problems.append('%s / %s:\n        file     %r\n        provider %r' % (pid, k, show(file_out[pid][k]), show(got[k])))
    if not tier_of:
        problems.append('no tier with a provider')
    return problems


def main(argv):
    files = argv or sorted(os.path.join(HERE, 'fixtures', f) for f in os.listdir(os.path.join(HERE, 'fixtures')) if f.endswith('.pxml'))
    failed = 0
    for p in files:
        probs = run_file(p)
        print(('FAIL ' if probs else 'ok   ') + os.path.basename(p))
        for x in probs:
            print('      ' + x)
        failed += bool(probs)
    print('%d provider fixture(s), %d failed' % (len(files), failed))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
