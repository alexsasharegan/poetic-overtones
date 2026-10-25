// Editing operations on a document model, with undo and redo (spec/app.md T-05, E-08, E-09).
//
//   const ed = new Editor(doc);
//   const t = ed.addTier({ name: 'Rhyme', role: 'rhyme', kind: 'relation' });
//   const s = ed.addSet(t, { name: 'A' });
//   ed.mark(s, [[10, 13]]);          // make (or reuse) a span and list it in the set
//   ed.undo(); ed.redo();
//
// Every operation either applies completely or throws a PxmlError and changes nothing. Ids
// are made by the editor, unique in the document and not reused within a session, even after
// a delete (S-04, ADR-0015). Positions are code points (S-01); cpIndex() converts a UTF-16 index from the UI.

import { PxmlError } from './xml.js';

const ROLE_RE = /^[a-z][a-z0-9_-]*$/;
const KEY_RE = /^[a-z][a-z0-9_]*$/;
const TAG_RE = /^[A-Za-z0-9_.:+-]+$/;
const ID_RE = /^[A-Za-z0-9_]+$/;

export function cpIndex(text, utf16) {           // UTF-16 offset -> code point offset
  let cp = 0;
  for (let i = 0; i < utf16 && i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) i++;
    cp++;
  }
  return cp;
}

export function utf16Index(text, cp) {           // code point offset -> UTF-16 offset
  let i = 0;
  for (let k = 0; k < cp && i < text.length; k++) {
    const c = text.charCodeAt(i);
    i += c >= 0xd800 && c <= 0xdbff ? 2 : 1;
  }
  return i;
}

const isDirected = (t) => t.attrs.kind === 'relation' && t.attrs.directed === 'true';

export class Editor {
  // `providers` maps a provider reference ('text.line@1') to { provider } or null
  // (src/providers/index.js providerFor). The core ships with none (spec/app.md E-07).
  constructor(doc, { limit = 200, providers = () => null } = {}) {
    this.doc = doc;
    this.providers = providers;
    this.limit = limit;
    this.past = [];
    this.future = [];
    this.used = new Set();
    this.serial = 0;
    for (const s of doc.spans.values()) for (const p of s.pieces) this.used.add(p.id);
    for (const t of doc.tiers) { this.used.add(t.id); for (const s of t.sets) this.used.add(s.id); }
    this.length = [...doc.text].length;
  }

  // ---- history (E-09): a snapshot before each change
  change(fn) {
    const before = structuredClone(this.doc);
    try {
      const out = fn();
      this.past.push(before);
      if (this.past.length > this.limit) this.past.shift();
      this.future = [];
      return out;
    } catch (e) {
      this.restore(before);
      throw e;
    }
  }
  restore(snapshot) {               // keep the same doc object so callers' references stay valid
    for (const k of Object.keys(this.doc)) delete this.doc[k];
    Object.assign(this.doc, snapshot);
  }
  undo() {
    if (!this.past.length) return false;
    this.future.push(structuredClone(this.doc));
    this.restore(this.past.pop());
    return true;
  }
  redo() {
    if (!this.future.length) return false;
    this.past.push(structuredClone(this.doc));
    this.restore(this.future.pop());
    return true;
  }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }

  // ---- ids (S-04)
  newId(prefix) {
    let id;
    do id = prefix + (++this.serial).toString(36); while (this.used.has(id));
    this.used.add(id);
    return id;
  }

  // ---- lookups
  tier(id) {
    const t = this.doc.tiers.find((x) => x.id === id);
    if (!t) throw new PxmlError('edit-unknown-tier', id);
    return t;
  }
  set(id) {
    for (const t of this.doc.tiers) { const s = t.sets.find((x) => x.id === id); if (s) return { tier: t, set: s }; }
    throw new PxmlError('edit-unknown-set', id);
  }
  span(id) {
    const s = this.doc.spans.get(id);
    if (!s) throw new PxmlError('edit-unknown-span', id);
    return s;
  }

  // ---- tiers (T-05)
  addTier({ name, role, kind = 'label', directed, at } = {}) {
    return this.change(() => {
      const attrs = {};
      if (name !== undefined) attrs.name = name;
      const t = { id: this.newId('t'), attrs, sets: [] };
      this.doc.tiers.splice(at ?? this.doc.tiers.length, 0, t);   // a new tier goes on top (Y-11)
      setTierAttrs(t, { role, kind: kind === 'label' ? undefined : kind, directed });
      return t.id;
    });
  }
  removeTier(id) {
    this.change(() => {
      const t = this.tier(id);
      this.doc.tiers.splice(this.doc.tiers.indexOf(t), 1);
      for (const o of this.doc.tiers) {       // a tier that read it no longer can
        if (!o.attrs.reads) continue;
        const left = o.attrs.reads.split(/[,\s]+/).filter((r) => r && r !== id);
        if (left.length) o.attrs.reads = left.join(' '); else delete o.attrs.reads;
      }
    });
  }
  moveTier(id, to) {                // layer order (S-07): the user's, saved as tier order
    this.change(() => {
      const t = this.tier(id), list = this.doc.tiers;
      if (!(to >= 0 && to < list.length)) throw new PxmlError('edit-bad-position', String(to));
      list.splice(list.indexOf(t), 1);
      list.splice(to, 0, t);
    });
  }
  setTier(id, attrs) {              // { name, role, kind, directed, disabled, provider, reads, ... }
    this.change(() => setTierAttrs(this.tier(id), attrs));
  }

  // ---- sets
  addSet(tierId, { name, key, tags, at } = {}) {
    return this.change(() => {
      const t = this.tier(tierId);
      const s = { id: this.newId('s'), attrs: {}, members: [], confirmed: [] };
      t.sets.splice(at ?? t.sets.length, 0, s);
      setSetAttrs(t, s, { name, key, tags });
      return s.id;
    });
  }
  removeSet(id) {
    this.change(() => { const { tier, set } = this.set(id); tier.sets.splice(tier.sets.indexOf(set), 1); });
  }
  moveSet(id, to, toTier) {         // position in a tier (A-06), optionally into another tier
    this.change(() => {
      const { tier, set } = this.set(id);
      const dest = toTier ? this.tier(toTier) : tier;
      tier.sets.splice(tier.sets.indexOf(set), 1);
      if (!(to >= 0 && to <= dest.sets.length)) throw new PxmlError('edit-bad-position', String(to));
      if (set.attrs.key !== undefined && dest.sets.some((s) => s.attrs.key === set.attrs.key)) throw new PxmlError('key-duplicate', set.attrs.key);
      dest.sets.splice(to, 0, set);
      if (dest !== tier) set.members = ordered(this.doc, dest, set.members);
    });
  }
  setSet(id, attrs) {               // { name, key, tags, ... }
    this.change(() => { const { tier, set } = this.set(id); setSetAttrs(tier, set, attrs); });
  }

  // ---- spans and members
  // Make a span from pieces [[start, end], ...] (code points), or reuse the span that has
  // exactly these pieces (E-08). Returns its id.
  addSpan(pieces) {
    return this.change(() => this.spanFor(pieces));
  }
  spanFor(pieces) {
    const ps = pieces.map(([a, b]) => [a, b]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    if (!ps.length) throw new PxmlError('edit-bad-range', 'no pieces');
    for (const [a, b] of ps) if (!(Number.isInteger(a) && Number.isInteger(b) && 0 <= a && a <= b && b <= this.length)) throw new PxmlError('edit-bad-range', `${a}-${b}`);
    for (let k = 1; k < ps.length; k++) if (ps[k][0] < ps[k - 1][1]) throw new PxmlError('span-self-overlap', `${ps[k - 1]} ${ps[k]}`);
    const sig = JSON.stringify(ps);
    for (const s of this.doc.spans.values())
      if (JSON.stringify(s.pieces.map((p) => [p.start, p.end])) === sig) return s.id;
    const id = this.newId('n');
    this.doc.spans.set(id, { id, pieces: ps.map(([start, end], k) => ({ id: k ? this.newId('n') : id, start, end })) });
    return id;
  }
  addMember(setId, spanId) {
    this.change(() => this.list(setId, spanId));
  }
  list(setId, spanId) {
    const { tier, set } = this.set(setId);
    this.span(spanId);
    if (set.members.includes(spanId)) return;
    set.members = isDirected(tier) ? [...set.members, spanId] : ordered(this.doc, tier, [...set.members, spanId]);
  }
  removeMember(setId, spanId) {
    this.change(() => {
      const { set } = this.set(setId);
      if (!set.members.includes(spanId)) throw new PxmlError('edit-not-member', spanId);
      set.members = set.members.filter((m) => m !== spanId);
      set.confirmed = set.confirmed.filter((m) => m !== spanId);
    });
  }
  moveMember(setId, spanId, to) {   // only a directed relation has a member order (A-05)
    this.change(() => {
      const { tier, set } = this.set(setId);
      if (!isDirected(tier)) throw new PxmlError('edit-unordered-set', setId);
      const k = set.members.indexOf(spanId);
      if (k < 0) throw new PxmlError('edit-not-member', spanId);
      if (!(to >= 0 && to < set.members.length)) throw new PxmlError('edit-bad-position', String(to));
      set.members.splice(k, 1);
      set.members.splice(to, 0, spanId);
    });
  }
  // Mark pieces of text as a member of a set: one step, one undo.
  mark(setId, pieces) {
    return this.change(() => { const id = this.spanFor(pieces); this.list(setId, id); return id; });
  }
  confirm(setId, spanId, yes = true) {   // A-08: a person accepted an inferred member
    this.change(() => {
      const { set } = this.set(setId);
      if (!set.members.includes(spanId)) throw new PxmlError('confirmed-not-member', spanId);
      set.confirmed = set.confirmed.filter((m) => m !== spanId);
      if (yes) set.confirmed.push(spanId);
    });
  }
  // Switch the active theme: the named style block that is not disabled (format.md S-05).
  // Pass null to turn every named theme off. Unnamed blocks (a document's own tweaks) stay as they are.
  useTheme(name) {
    this.change(() => {
      const named = this.doc.styles.filter((st) => st.attrs.name !== undefined);
      if (name !== null && !named.some((st) => st.attrs.name === name)) throw new PxmlError('edit-unknown-theme', name);
      for (const st of named) {
        if (st.attrs.name === name) delete st.attrs.disabled; else st.attrs.disabled = 'true';
      }
    });
  }
  get themes() { return this.doc.styles.filter((st) => st.attrs.name !== undefined).map((st) => ({ name: st.attrs.name, active: st.attrs.disabled !== 'true' })); }

  // ---- standard tiers (spec/app.md E-01 to E-08)
  // Add a tier filled by a provider ('text.line@1'), with a set for each key it owns, and fill it.
  addStandardTier(ref, { at } = {}) {
    return this.change(() => {
      const p = this.providerOf(ref);
      const reads = p.reads.map((pid) => {
        const t = this.doc.tiers.find((x) => (x.attrs.provider || '').startsWith(pid + '@'));
        if (!t) throw new PxmlError('edit-needs-tier', pid);
        return t.id;
      });
      const attrs = { name: p.name, role: p.role, provider: ref };
      if (reads.length) attrs.reads = reads.join(' ');
      const t = { id: this.newId('t'), attrs, sets: [] };
      for (const key of p.keys) t.sets.push({ id: this.newId('s'), attrs: { name: p.setNames?.[key] ?? key, key }, members: [], confirmed: [] });
      this.doc.tiers.splice(at ?? this.doc.tiers.length, 0, t);
      this.fill(t, p);
      return t.id;
    });
  }
  // Reset (E-03): rerun the provider and replace what its keyed sets list. Sets without a key are
  // the user's and stay (format.md A-03). Spans with the same pieces are reused (E-08), so other
  // sets that list them are untouched. A confirmed member that the provider produces again stays
  // confirmed; the rest of the confirmations go with the members they named.
  reset(tierId) {
    this.change(() => {
      const t = this.tier(tierId);
      if (!t.attrs.provider) throw new PxmlError('edit-not-standard', tierId);
      this.fill(t, this.providerOf(t.attrs.provider));
    });
  }
  // Unlink (E-05): the tier becomes an ordinary tier; reset is no longer offered.
  unlink(tierId) {
    this.change(() => { const t = this.tier(tierId); delete t.attrs.provider; delete t.attrs.reads; });
  }
  providerOf(ref) {
    const found = this.providers(ref);
    if (!found) throw new PxmlError('edit-unknown-provider', ref);
    return found.provider;
  }
  fill(t, p) {
    const inputs = {};
    for (const rid of (t.attrs.reads || '').split(/[,\s]+/).filter(Boolean)) {
      const r = this.tier(rid), pid = (r.attrs.provider || '').split('@')[0];
      inputs[pid] = Object.fromEntries(r.sets.filter((x) => x.attrs.key).map((x) => [x.attrs.key, x.members.map((m) => this.span(m).pieces.map((q) => [q.start, q.end]))]));
    }
    const out = p.run(this.doc.text, inputs);
    for (const key of p.keys) {
      let set = t.sets.find((x) => x.attrs.key === key);
      if (!set) { set = { id: this.newId('s'), attrs: { name: p.setNames?.[key] ?? key, key }, members: [], confirmed: [] }; t.sets.push(set); }
      const members = [];
      for (const pieces of out[key] || []) { const id = this.spanFor(pieces); if (!members.includes(id)) members.push(id); }
      set.members = ordered(this.doc, t, members);
      set.confirmed = set.confirmed.filter((m) => set.members.includes(m));
    }
  }

  // Drop spans that no set lists (A-12 does this on export anyway).
  prune() {
    this.change(() => {
      const listed = new Set(this.doc.tiers.flatMap((t) => t.sets.flatMap((s) => s.members)));
      for (const id of [...this.doc.spans.keys()]) if (!listed.has(id)) this.doc.spans.delete(id);
    });
  }
}

function ordered(doc, tier, members) {
  if (isDirected(tier)) return members;
  const start = (id) => doc.spans.get(id).pieces[0].start;
  return [...members].sort((a, b) => start(a) - start(b));
}

function put(attrs, k, v) { if (v === undefined || v === null || v === '') delete attrs[k]; else attrs[k] = String(v); }

function setTierAttrs(t, a) {
  const next = { ...t.attrs };
  for (const [k, v] of Object.entries(a)) if (k !== 'id') put(next, k, v);
  if (next.role !== undefined && !ROLE_RE.test(next.role)) throw new PxmlError('role-bad', next.role);
  if (next.kind === 'label') delete next.kind;
  if (next.kind !== undefined && next.kind !== 'relation') throw new PxmlError('tier-bad-kind', next.kind);
  if (next.directed === 'false') delete next.directed;
  if (next.directed !== undefined && next.directed !== 'true') throw new PxmlError('tier-bad-directed', next.directed);
  if (next.directed === 'true' && next.kind !== 'relation') throw new PxmlError('directed-without-relation', t.id);
  if (next.disabled === 'false') delete next.disabled;
  if (next.disabled !== undefined && next.disabled !== 'true') throw new PxmlError('disabled-bad', next.disabled);
  t.attrs = next;
}

function setSetAttrs(t, s, a) {
  const next = { ...s.attrs };
  for (const [k, v] of Object.entries(a)) {
    if (k === 'id' || k === 'members' || k === 'confirmed') continue;
    put(next, k, Array.isArray(v) ? v.join(' ') : v);
  }
  if (next.key !== undefined) {
    if (!KEY_RE.test(next.key)) throw new PxmlError('key-bad', next.key);
    if (t.sets.some((o) => o !== s && o.attrs.key === next.key)) throw new PxmlError('key-duplicate', next.key);
  }
  for (const tg of (next.tags || '').split(/\s+/).filter(Boolean)) if (!TAG_RE.test(tg)) throw new PxmlError('tag-bad', tg);
  s.attrs = next;
}

export { ID_RE };
