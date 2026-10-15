// Loader for .pxml documents (spec/format.md). A port of spec/fixtures/check.py that keeps
// everything a document holds, so it can be saved again (save.js).
//
//   load(source, { readFile }) -> { doc, warnings }      throws PxmlError
//
// `source` is the file as a string. `readFile(relativePath)` returns the contents of a file
// referenced by <text src> or <style src>, or null if there is none; without it, any src is
// reported missing. Positions in the model are Unicode code points (M-06).
//
// The model:
//   doc.meta      { attrs } or null
//   doc.text      the input text
//   doc.spans     Map id -> { id, pieces: [{ id, start, end }] }     (pieces in text order)
//   doc.tiers     [{ id, attrs, sets: [{ id, attrs, members: [ids], confirmed: [ids] }] }]
//                 attrs hold every other attribute as written; members are in the order of A-05
//   doc.styles    [{ attrs, css }]                                   (a src is read; attrs keep it)
//   doc.blocks    [node]   extension and unknown blocks, kept as parsed (B-04)

import { parseXml, PxmlError, textOf, xmlCharOk } from './xml.js';

export { PxmlError };

const ID_RE = /^[A-Za-z0-9_]+$/;
const PROVIDER_RE = /^[a-z][a-z0-9.-]*@[0-9]+$/;
const KEY_RE = /^[a-z][a-z0-9_]*$/;
const ROLE_RE = /^[a-z][a-z0-9_-]*$/;
const TAG_RE = /^[A-Za-z0-9_.:+-]+$/;
const BLOCKS = ['meta', 'text', 'markup', 'analysis', 'style'];
const TIER_ATTRS = new Set(['id', 'name', 'role', 'kind', 'directed', 'provider', 'reads', 'disabled']);
const SET_ATTRS = new Set(['id', 'name', 'key', 'members', 'confirmed', 'tags']);
const STYLE_ATTRS = new Set(['name', 'disabled', 'src']);

// ---------- text utilities (code points) ----------

export function sanitize(s, warnings) {          // B-07
  let bad = false, out = '';
  for (const ch of s) {
    if (xmlCharOk(ch.codePointAt(0))) out += ch; else { out += '�'; bad = true; }
  }
  if (bad) warn(warnings, 'control-char');
  return out;
}

// Which characters of a block survive slicing (T-02) and dedenting (T-03). Over code points.
export function keepMask(raw, lead = true) {
  const n = raw.length;
  const keep = new Array(n).fill(true);
  if (lead && raw[0] === '\n') keep[0] = false;
  let k = n;
  while (k > 0 && (raw[k - 1] === ' ' || raw[k - 1] === '\t')) k--;
  if (k > 0 && raw[k - 1] === '\n') for (let j = k - 1; j < n; j++) keep[j] = false;
  const lines = [];
  let cur = [];
  for (let j = 0; j < n; j++) {
    if (!keep[j]) continue;
    if (raw[j] === '\n') { lines.push(cur); cur = []; } else cur.push(j);
  }
  lines.push(cur);
  const str = (ln) => ln.map((j) => raw[j]).join('');
  const prefixes = [];
  for (const ln of lines) {
    const s = str(ln);
    if (s.replace(/[ \t]/g, '')) prefixes.push(s.slice(0, s.length - s.replace(/^[ \t]+/, '').length));
  }
  const common = prefixes.length ? prefixes.reduce(commonPrefix) : '';
  for (const ln of lines) {
    const p = commonPrefix(str(ln), common).length;
    for (const j of ln.slice(0, p)) keep[j] = false;
  }
  return keep;
}

function commonPrefix(a, b) {
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  return a.slice(0, k);
}

export function applyMask(raw, keep) {
  const kept = [];
  const newidx = new Array(raw.length + 1);
  newidx[0] = 0;
  for (let j = 0; j < raw.length; j++) {
    if (keep[j]) kept.push(raw[j]);
    newidx[j + 1] = newidx[j] + (keep[j] ? 1 : 0);
  }
  return { text: kept.join(''), newidx };
}

const cps = (s) => Array.from(s);
const splitIds = (v) => (v || '').trim().split(/[,\s]+/).filter(Boolean);
function warn(warnings, code, line = null) { warnings.push({ code, line }); }

function parseIds(value, line) {   // explicit ids, commas and/or whitespace, no ranges
  const out = splitIds(value);
  for (const tok of out) if (!ID_RE.test(tok)) throw new PxmlError('id-bad', tok, line);
  return out;
}

function badSrc(p) {
  return p === '' || p.startsWith('/') || p.startsWith('~') || p.includes('\\') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(p) || p.split('/').includes('..');
}

function readRef(el, readFile, warnings, kind) {
  const ref = el.attrs.src;
  if (textOf(el).trim()) throw new PxmlError(kind + '-src-and-body', '', el.line);
  if (badSrc(ref)) throw new PxmlError(kind + '-src-invalid', ref, el.line);
  const raw = readFile ? readFile(ref) : null;
  if (raw == null) throw new PxmlError(kind + '-src-missing', ref, el.line);
  return sanitize(raw.replace(/^﻿/, ''), warnings).replace(/\r\n/g, '\n');
}

const elements = (node) => node.children.filter((c) => c.type === 'element');

// ---------- load ----------

export function load(source, { readFile = null } = {}) {
  const warnings = [];
  let src = sanitize(source.replace(/^﻿/, ''), warnings);
  // B-03: an XML declaration is allowed at the start; blank it out so line numbers stay put
  src = src.replace(/^\s*<\?xml[^>]*\?>/, (m) => m.replace(/[^\n]/g, ' '));
  const probe = src.replace(/<!--[\s\S]*?-->/g, '').trimStart();
  const explicit = /^<pxml[\s>/]/.test(probe);
  if (src.replace(/<!--[\s\S]*?-->/g, '').includes('<![CDATA[')) throw new PxmlError('cdata-not-allowed');
  const tree = parseXml(explicit ? src : '<pxml>' + src + '</pxml>');
  const root = elements(tree).find((e) => e.name === 'pxml');
  if (!root || elements(tree).length !== 1) throw new PxmlError('xml-not-wellformed', 'one root element expected');
  const junk = tree.children.find((c) => c.type === 'text' && c.value.trim());
  if (junk) throw new PxmlError('xml-not-wellformed', 'text outside the root element', junk.line);

  const doc = { meta: null, text: '', spans: new Map(), tiers: [], styles: [], blocks: [] };
  const blocks = {};
  for (const ch of elements(root)) {
    if (BLOCKS.includes(ch.name)) {
      if (ch.name === 'style') doc.styles.push(loadStyle(ch, readFile, warnings));
      else if (blocks[ch.name]) throw new PxmlError('block-duplicate', ch.name, ch.line);
      else blocks[ch.name] = ch;
    } else {
      if (!ch.name.startsWith('x-')) warn(warnings, 'unknown-block', ch.line);
      doc.blocks.push(ch);
    }
  }
  if (!blocks.text) throw new PxmlError('block-missing-text');
  if (!blocks.markup) throw new PxmlError('block-missing-markup');
  if (blocks.meta) doc.meta = { attrs: { ...blocks.meta.attrs } };

  // ---- text
  const t = blocks.text;
  if (t.children.some((c) => c.type === 'comment' || c.type === 'pi')) throw new PxmlError('comment-in-text', '', t.line);
  if (elements(t).length) throw new PxmlError('text-has-elements', '', t.line);
  let text;
  if (t.attrs.src !== undefined) {
    const raw = cps(readRef(t, readFile, warnings, 'text'));
    text = applyMask(raw, keepMask(raw, false)).text;
  } else {
    const raw = cps(textOf(t));
    text = applyMask(raw, keepMask(raw)).text;
  }

  // ---- markup and the strip invariant (M-01)
  const { raw, frags } = flatten(blocks.markup, warnings);
  const { text: mtext, newidx } = applyMask(raw, keepMask(raw));
  if (mtext !== text) {
    const a = cps(mtext), b = cps(text);
    let k = 0;
    while (k < a.length && k < b.length && a[k] === b[k]) k++;
    throw new PxmlError('strip-mismatch', `at ${k}: markup ${JSON.stringify(a.slice(k, k + 12).join(''))} vs text ${JSON.stringify(b.slice(k, k + 12).join(''))}`, blocks.markup.line);
  }
  doc.text = text;

  const ids = new Map();
  const claim = (id, what, line) => {
    if (ids.has(id)) throw new PxmlError('id-duplicate', id, line);
    ids.set(id, what);
  };
  const heads = new Map(), conts = [];
  frags.sort((x, y) => x.start - y.start || y.end - x.end || x.seq - y.seq);
  for (const f of frags) {
    const a = newidx[f.start], b = newidx[f.end];
    claim(f.id, 'span', f.line);
    if (f.cont === undefined) heads.set(f.id, { id: f.id, pieces: [{ id: f.id, start: a, end: b }] });
    else conts.push({ ...f, start: a, end: b });
  }
  const contIds = new Set(conts.map((c) => c.id));
  for (const c of conts) {
    if (contIds.has(c.cont)) throw new PxmlError('cont-not-head', c.cont, c.line);
    const h = heads.get(c.cont);
    if (!h) throw new PxmlError('cont-unknown', c.cont, c.line);
    if (h.pieces[0].start > c.start) throw new PxmlError('cont-before-head', c.cont, c.line);
    h.pieces.push({ id: c.id, start: c.start, end: c.end });
  }
  for (const [sid, h] of heads) {
    h.pieces.sort((x, y) => x.start - y.start || x.end - y.end);
    for (let k = 1; k < h.pieces.length; k++)
      if (h.pieces[k].start < h.pieces[k - 1].end) throw new PxmlError('span-self-overlap', sid);
    if (h.pieces.some((p) => p.start === p.end)) warn(warnings, 'span-empty');
  }
  doc.spans = heads;

  // ---- analysis
  const tierIds = new Set();
  if (blocks.analysis) {
    for (const tr of elements(blocks.analysis)) {
      if (tr.name !== 'tier') throw new PxmlError('analysis-unknown-element', tr.name, tr.line);
      if (Object.keys(tr.attrs).some((k) => !TIER_ATTRS.has(k) && !k.startsWith('x-'))) warn(warnings, 'unknown-attribute', tr.line);
      const tid = tr.attrs.id;
      if (tid === undefined) throw new PxmlError('tier-no-id', '', tr.line);
      if (!ID_RE.test(tid)) throw new PxmlError('id-bad', tid, tr.line);
      claim(tid, 'tier', tr.line);
      tierIds.add(tid);
      const role = tr.attrs.role;
      if (role !== undefined && !ROLE_RE.test(role)) throw new PxmlError('role-bad', role, tr.line);
      const kind = tr.attrs.kind ?? 'label';
      if (kind !== 'label' && kind !== 'relation') throw new PxmlError('tier-bad-kind', kind, tr.line);
      const directed = tr.attrs.directed;
      if (directed !== undefined) {
        if (directed !== 'true' && directed !== 'false') throw new PxmlError('tier-bad-directed', directed, tr.line);
        if (directed === 'true' && kind !== 'relation') throw new PxmlError('directed-without-relation', tid, tr.line);
      }
      const disabled = tr.attrs.disabled;
      if (disabled !== undefined && disabled !== 'true' && disabled !== 'false') throw new PxmlError('disabled-bad', disabled, tr.line);
      const prov = tr.attrs.provider;
      if (prov !== undefined && !PROVIDER_RE.test(prov)) throw new PxmlError('provider-bad', prov, tr.line);
      const { id: _id, ...tattrs } = tr.attrs;
      const tier = { id: tid, attrs: tattrs, sets: [] };
      const keys = new Set();
      for (const st of elements(tr)) {
        if (st.name !== 'set') throw new PxmlError('analysis-unknown-element', st.name, st.line);
        if (Object.keys(st.attrs).some((k) => !SET_ATTRS.has(k) && !k.startsWith('x-'))) warn(warnings, 'unknown-attribute', st.line);
        const setid = st.attrs.id;
        if (setid === undefined) throw new PxmlError('set-no-id', '', st.line);
        if (!ID_RE.test(setid)) throw new PxmlError('id-bad', setid, st.line);
        claim(setid, 'set', st.line);
        const key = st.attrs.key;
        if (key !== undefined) {
          if (!KEY_RE.test(key)) throw new PxmlError('key-bad', key, st.line);
          if (keys.has(key)) throw new PxmlError('key-duplicate', key, st.line);
          keys.add(key);
        }
        let members = parseIds(st.attrs.members, st.line);
        for (const m of members) {
          if (contIds.has(m)) throw new PxmlError('member-is-continuation', m, st.line);
          if (!heads.has(m)) throw new PxmlError('set-unknown-member', m, st.line);
        }
        if (new Set(members).size !== members.length) warn(warnings, 'set-duplicate-member', st.line);
        for (const tg of splitIds2(st.attrs.tags)) if (!TAG_RE.test(tg)) throw new PxmlError('tag-bad', tg, st.line);
        if (directed !== 'true') members = [...members].sort((x, y) => heads.get(x).pieces[0].start - heads.get(y).pieces[0].start);
        const confirmed = parseIds(st.attrs.confirmed, st.line);
        for (const c of confirmed) if (!members.includes(c)) throw new PxmlError('confirmed-not-member', c, st.line);
        const { id: _s, members: _m, confirmed: _c, ...sattrs } = st.attrs;
        tier.sets.push({ id: setid, attrs: sattrs, members, confirmed });
      }
      doc.tiers.push(tier);
    }
    for (const tier of doc.tiers)
      for (const r of splitIds(tier.attrs.reads)) if (!tierIds.has(r)) throw new PxmlError('reads-unknown', r);
  }

  if (/url\s*\(|@import/i.test(doc.styles.map((s) => s.css).join('\n'))) warn(warnings, 'style-url');   // S-02
  return { doc, warnings };
}

const splitIds2 = (v) => (v || '').split(/\s+/).filter(Boolean);

function loadStyle(el, readFile, warnings) {
  if (Object.keys(el.attrs).some((k) => !STYLE_ATTRS.has(k) && !k.startsWith('x-'))) warn(warnings, 'unknown-attribute', el.line);
  const d = el.attrs.disabled;
  if (d !== undefined && d !== 'true' && d !== 'false') throw new PxmlError('disabled-bad', d, el.line);
  const css = el.attrs.src !== undefined ? readRef(el, readFile, warnings, 'style') : textOf(el);
  return { attrs: { ...el.attrs }, css };
}

// Concatenate the markup's text (code points) and record each span's raw offsets.
function flatten(markup, warnings) {
  const raw = [];
  const frags = [];
  const walk = (node) => {
    for (const ch of node.children) {
      if (ch.type === 'text') { for (const c of ch.value) raw.push(c); continue; }
      if (ch.type !== 'element') throw new PxmlError('comment-in-text', '', ch.line);
      if (ch.name !== 'span') throw new PxmlError('markup-unknown-element', ch.name, ch.line);
      const { id, cont } = ch.attrs;
      if (id === undefined) throw new PxmlError('span-no-id', '', ch.line);
      for (const v of [id, cont]) if (v !== undefined && !ID_RE.test(v)) throw new PxmlError('id-bad', v, ch.line);
      if (Object.keys(ch.attrs).some((k) => k !== 'id' && k !== 'cont')) warn(warnings, 'span-extra-attribute', ch.line);
      const start = raw.length, seq = frags.length;
      const f = { id, cont, start, end: raw.length, line: ch.line, seq };
      frags.push(f);                  // in document order: an outer span before the spans inside it
      walk(ch);
      f.end = raw.length;
    }
  };
  walk(markup);
  return { raw, frags };
}

// ---------- helpers on the model ----------

export function spanText(doc, id) {
  const t = cps(doc.text);
  return doc.spans.get(id).pieces.map((p) => t.slice(p.start, p.end).join('')).join('');
}
