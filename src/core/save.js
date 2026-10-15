// Canonical export of a document model (spec/format.md I-01, I-02).
//
//   save(doc) -> string
//
// Blocks in the order meta, text, markup, analysis, style, then extension blocks. `text` and
// `markup` are written flush left with xml:space="preserve" (T-03, M-07). Tiers and sets keep
// their order; undirected members are in document order (A-05). Spans no set lists are
// dropped (A-12). Styles are written inline, a src being replaced by the CSS it pointed to.
// Spans whose pieces would cross are written as heads and continuations (M-05); a piece that
// has to be cut gets a new id that is unique in the file; of two crossing spans the newer one
// (later in doc.spans) is cut, so spans already in the file keep their pieces and ids.

import { escAttr, escText, writeNode } from './xml.js';

const attrs = (o) => Object.entries(o).map(([k, v]) => ` ${k}="${escAttr(String(v))}"`).join('');

export function save(doc) {
  const out = [];
  if (doc.meta) out.push(`<meta${attrs(doc.meta.attrs)}/>`);
  out.push(`<text xml:space="preserve">\n${escText(doc.text)}\n</text>`);
  out.push(`<markup xml:space="preserve">\n${markup(doc)}\n</markup>`);
  if (doc.tiers.length) {
    const tiers = doc.tiers.map((t) => {
      const sets = t.sets.map((s) => {
        const a = { id: s.id, ...s.attrs, members: orderedMembers(doc, t, s).join(',') };
        if (s.confirmed.length) a.confirmed = s.confirmed.join(',');
        return `    <set${attrs(a)}/>`;
      });
      const head = `  <tier${attrs({ id: t.id, ...t.attrs })}`;
      return sets.length ? `${head}>\n${sets.join('\n')}\n  </tier>` : `${head}/>`;
    });
    out.push(`<analysis>\n${tiers.join('\n')}\n</analysis>`);
  }
  for (const s of doc.styles) {
    const { src: _src, ...a } = s.attrs;
    out.push(`<style${attrs(a)}>${escText(s.css)}</style>`);
  }
  for (const b of doc.blocks) out.push(writeNode(b));
  return out.join('\n\n') + '\n';
}

function orderedMembers(doc, tier, set) {
  if (tier.attrs.kind === 'relation' && tier.attrs.directed === 'true') return set.members;
  const start = (id) => doc.spans.get(id).pieces[0].start;
  return [...set.members].sort((a, b) => start(a) - start(b));
}

// The markup block: the text with every listed span's pieces as nested <span> elements.
function markup(doc) {
  const listed = new Set();
  for (const t of doc.tiers) for (const s of t.sets) for (const m of s.members) listed.add(m);
  const used = new Set();
  for (const sp of doc.spans.values()) for (const p of sp.pieces) used.add(p.id);
  for (const t of doc.tiers) { used.add(t.id); for (const s of t.sets) used.add(s.id); }
  let serial = 0;
  const fresh = (base) => { let id; do id = `${base}_${++serial}`; while (used.has(id)); used.add(id); return id; };

  // pieces of listed spans, outer before inner, then in the order they were made
  const pieces = [];
  let order = 0;
  for (const id of doc.spans.keys()) {
    if (!listed.has(id)) continue;
    for (const p of doc.spans.get(id).pieces) pieces.push({ head: id, id: p.id, start: p.start, end: p.end, order: order++ });
  }
  const sortPieces = () => pieces.sort((a, b) => a.start - b.start || b.end - a.end || a.order - b.order);
  sortPieces();

  // cut any piece that would cross the piece it starts inside of
  const nests = (q, top) => q.start >= top.start && q.end <= top.end;
  for (let changed = true; changed;) {
    changed = false;
    const stack = [];
    for (const p of pieces) {
      while (stack.length && !nests(p, stack[stack.length - 1]) && stack[stack.length - 1].end <= p.start) stack.pop();
      const top = stack[stack.length - 1];
      if (top && !nests(p, top)) {          // starts inside top, ends after it: cut the newer of the two
        if (top.order > p.order) {          // so spans that were already in the file keep their ids
          pieces.push({ head: top.head, id: fresh(top.head), start: p.start, end: top.end, order: order++ });
          top.end = p.start;
        } else {
          pieces.push({ head: p.head, id: fresh(p.head), start: top.end, end: p.end, order: order++ });
          p.end = top.end;
        }
        changed = true;
        break;
      }
      stack.push(p);
    }
    if (changed) sortPieces();
  }

  // emit
  const text = Array.from(doc.text);
  let out = '', pos = 0;
  const stack = [];
  const close = () => { out += '</span>'; stack.pop(); };
  const emitTo = (k) => { if (k > pos) { out += escText(text.slice(pos, k).join('')); pos = k; } };
  for (const p of pieces) {
    while (stack.length && !nests(p, stack[stack.length - 1])) {
      emitTo(stack[stack.length - 1].end);
      close();
    }
    emitTo(p.start);
    const isHead = p.id === p.head;
    out += `<span id="${escAttr(p.id)}"${isHead ? '' : ` cont="${escAttr(p.head)}"`}>`;
    stack.push(p);
  }
  while (stack.length) { emitTo(stack[stack.length - 1].end); close(); }
  emitTo(text.length);
  return out;
}
