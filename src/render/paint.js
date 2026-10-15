// Renderer: paints a document model (src/core) onto the page (spec/format.md S-03 to S-09).
//
//   const view = paint(host, doc);     // host: an empty element; call again after any change
//   view.report                         // what each member asked for, per layer
//
// Themes style a hidden mirror of the analysis (tier > set > member) in its own shadow root,
// never the text, and reach nothing else on the page (S-03, S-09). For each member the computed style is read through the chain
// member > set > tier (S-08) and handed to two painters, both plain CSS on ordinary elements:
//   text styles - colour, weight, italic, size (clamped, Y-12), shadow, underlines and added
//                 characters, on the text cut at every span boundary; the top layer wins per
//                 character, every layer's underline shows;
//   box styles  - fill, opacity, border, outline, radius, padding, box shadow, drawn under the
//                 letters as invisible copies of the text, all layers stacked (S-07).
// Nothing is measured, so the result is the same when the text rewraps, is zoomed or is printed.

const SENTINEL = 'rgb(1, 2, 3)';
const BASE_PX = 16, SIZE_MIN = 0.75, SIZE_MAX = 1.5;

const BOX_GROUPS = {
  fill:    { props: ['background-color'], on: (c) => c.backgroundColor !== 'rgba(0, 0, 0, 0)' },
  border:  { props: ['top', 'right', 'bottom', 'left'].flatMap((s) => [`border-${s}-width`, `border-${s}-style`, `border-${s}-color`]),
             on: (c) => ['Top', 'Right', 'Bottom', 'Left'].some((s) => c['border' + s + 'Style'] !== 'none') },
  outline: { props: ['outline-width', 'outline-style', 'outline-color', 'outline-offset'], on: (c) => c.outlineStyle !== 'none' },
  radius:  { props: ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
             on: (c) => ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].some((s) => c['border' + s + 'Radius'] !== '0px') },
  shadow:  { props: ['box-shadow'], on: (c) => c.boxShadow !== 'none' },
  opacity: { props: ['opacity'], on: (c) => c.opacity !== '1' },
  padding: { props: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
             on: (c) => ['Top', 'Right', 'Bottom', 'Left'].some((s) => c['padding' + s] !== '0px') },
};
const DECO = ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'];

// The painted text lives in the page (so it can be selected); its few rules are prefixed.
const HOST_CSS = `
  .pp-layers { display: grid; }
  .pp-layers > *, .pp-boxes > * { grid-area: 1 / 1; }
  .pp-boxes { display: grid; pointer-events: none; user-select: none; }
  .pp-text, .pp-copy { white-space: pre-wrap; }
  .pp-text { position: relative; }
  .pp-copy, .pp-copy * { color: transparent !important; text-decoration: none !important; text-shadow: none !important; }
  .pp-copy .pp-box { -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .pp-layers, .pp-layers * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pp-text [aria-hidden] { user-select: none; }
  .pp-mirror { display: none; }
`;

const css = (o) => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join('; ');

function quoted(content) {
  if (!content || content === 'none' || content === 'normal') return null;
  const m = content.match(/^"((?:[^"\\]|\\.)*)"$/);
  return m ? m[1].replace(/\\(.)/g, '$1') : null;
}

// The style sheets that apply: the active theme (the named style block that is not disabled,
// S-05) and the document's own unnamed, enabled blocks, in file order.
export function activeCss(doc) {
  return doc.styles.filter((s) => s.attrs.disabled !== 'true').map((s) => s.css).join('\n');
}

function wants(chain) {
  const cs = chain.map((el) => getComputedStyle(el)), me = cs[0];
  const text = {}, box = {}, notes = [];
  if (me.color !== SENTINEL) text.color = me.color;
  if (me.fontWeight !== '400') text['font-weight'] = me.fontWeight;
  if (me.fontStyle !== 'normal') text['font-style'] = me.fontStyle;
  if (me.textShadow !== 'none') text['text-shadow'] = me.textShadow;
  const px = parseFloat(me.fontSize);
  if (px !== BASE_PX) {
    const f = px / BASE_PX, c = Math.min(SIZE_MAX, Math.max(SIZE_MIN, f));
    text['font-size'] = +c.toFixed(3) + 'em';
    if (c !== f) notes.push(`font-size ${+f.toFixed(2)}em clamped to ${+c.toFixed(2)}em`);
  }
  const pseudo = (which) => {
    for (const el of chain.slice(0, 2)) { const q = quoted(getComputedStyle(el, which).content); if (q !== null) return q; }
    return null;
  };
  const decoFrom = cs.find((c) => c.textDecorationLine !== 'none');
  const deco = decoFrom ? Object.fromEntries(DECO.map((p) => [p, decoFrom.getPropertyValue(p)])) : null;
  for (const g of Object.values(BOX_GROUPS)) {
    const from = cs.find((c) => g.on(c));
    if (from) for (const p of g.props) box[p] = from.getPropertyValue(p);
  }
  const hasBox = ['fill', 'border', 'outline', 'shadow'].some((k) => cs.some((c) => BOX_GROUPS[k].on(c)));
  return { text, deco, box: hasBox ? box : null, before: pseudo('::before'), after: pseudo('::after'), notes };
}

export function paint(host, doc) {
  const root = host;
  root.replaceChildren();
  const base = document.createElement('style');
  base.textContent = HOST_CSS;
  const mirrorWrap = document.createElement('div');
  mirrorWrap.className = 'pp-mirror';
  const layers = document.createElement('div');
  layers.className = 'pp-layers';
  const boxes = document.createElement('div'); boxes.className = 'pp-boxes';
  const textEl = document.createElement('div'); textEl.className = 'pp-text';
  layers.append(boxes, textEl);
  root.append(base, mirrorWrap, layers);

  // ---- the mirror, in its own shadow root so theme CSS reaches nothing else (S-09)
  const mroot = mirrorWrap.attachShadow({ mode: 'open' });
  const mbase = document.createElement('style');
  mbase.textContent = `div { color: ${SENTINEL}; font: 400 normal ${BASE_PX}px serif; }`;
  const theme = document.createElement('style');
  theme.textContent = activeCss(doc);
  const box = document.createElement('div');
  mroot.append(mbase, theme, box);

  const entries = [];
  doc.tiers.forEach((t, ti) => {
    if (t.attrs.disabled === 'true') return;
    const te = document.createElement('tier');
    te.setAttribute('id', t.id);
    for (const k of ['role', 'kind', 'directed', 'provider']) if (t.attrs[k] !== undefined) te.setAttribute(k, t.attrs[k]);
    box.append(te);
    t.sets.forEach((s, si) => {
      const se = document.createElement('set');
      se.setAttribute('id', s.id);
      for (const k of ['key', 'tags']) if (s.attrs[k] !== undefined) se.setAttribute(k, s.attrs[k]);
      te.append(se);
      const mes = s.members.map((id) => {
        const me = document.createElement('member');
        me.setAttribute('id', id);
        if (t.attrs.provider && !s.confirmed.includes(id)) me.setAttribute('inferred', '');   // S-04
        se.append(me);
        return me;
      });
      entries.push({ ti, si, tier: t, set: s, mes, se, te, layer: entries.length,
                     members: s.members.map((id) => doc.spans.get(id).pieces.map((p) => [p.start, p.end])) });
    });
  });
  for (const e of entries) e.ws = e.mes.map((me) => wants([me, e.se, e.te]));

  // ---- text painter
  const chars = Array.from(doc.text);
  const cuts = new Set([0, chars.length]);
  for (const e of entries) for (const m of e.members) for (const [a, b] of m) { cuts.add(a); cuts.add(b); }
  const pts = [...cuts].sort((a, b) => a - b);
  const segs = [], atoms = [];
  const gen = (c, which) => {
    const w = c.e.ws[c.mi];
    const g = document.createElement('span');
    g.textContent = w[which]; g.setAttribute('aria-hidden', 'true'); g.style.cssText = css(w.text);
    g.layer = c.e.layer;
    textEl.append(g); atoms.push(g);
  };
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const firstAtom = atoms.length;
    const cover = [];
    for (const e of entries) e.members.forEach((m, mi) => {
      if (m.some(([p, q]) => p <= a && b <= q)) cover.push({ e, mi, first: m[0][0] === a, last: m[m.length - 1][1] === b });
    });
    for (const c of cover) if (c.first && c.e.ws[c.mi].before) gen(c, 'before');           // lower layers outside
    const seg = document.createElement('span');
    const style = {};
    for (const c of cover) Object.assign(style, c.e.ws[c.mi].text);                           // top layer wins
    seg.style.cssText = css(style);
    let inner = seg;
    for (const c of cover) if (c.e.ws[c.mi].deco) {                                          // every underline shows
      const d = document.createElement('span'); d.style.cssText = css(c.e.ws[c.mi].deco); inner.append(d); inner = d;
    }
    inner.append(chars.slice(a, b).join(''));
    seg.dataset.start = a; seg.dataset.end = b;
    textEl.append(seg); atoms.push(seg);
    for (const c of cover.slice().reverse()) if (c.last && c.e.ws[c.mi].after) gen(c, 'after');
    segs.push({ a, b, firstAtom, lastAtom: atoms.length - 1 });
  }

  // ---- box painter: one invisible copy of the text per box layer
  for (const e of entries) {
    const runs = [];
    e.members.forEach((m, mi) => {
      const b = e.ws[mi].box;
      if (!b) return;
      const px = (k) => parseFloat(b[k] || 0);
      const look = { ...b,
        'margin-left': -(px('padding-left') + px('border-left-width')) + 'px',
        'margin-right': -(px('padding-right') + px('border-right-width')) + 'px' };
      let cur = null, end = null;
      for (const [p, q] of m) {
        let a = segs.find((s) => s.a === p)?.firstAtom, z = segs.find((s) => s.b === q)?.lastAtom;
        if (a === undefined || z === undefined) continue;          // an empty piece draws no box
        while (atoms[a].layer < e.layer) a++;                       // lower layers' characters stay outside
        while (atoms[z].layer < e.layer) z--;
        if (cur && end === p) cur[1] = z; else runs.push(cur = [a, z, look]);
        end = q;
      }
    });
    if (!runs.length) continue;
    const copies = [];
    for (const r of runs.sort((x, y) => x[0] - y[0])) {
      const c = copies.find((c) => c[c.length - 1][1] < r[0]);
      if (c) c.push(r); else copies.push([r]);
    }
    for (const c of copies) {
      const copy = document.createElement('div'); copy.className = 'pp-copy'; copy.setAttribute('aria-hidden', 'true');
      let k = 0;
      for (const [a, z, look] of c) {
        for (; k < a; k++) copy.append(atoms[k].cloneNode(true));
        const bx = document.createElement('span'); bx.className = 'pp-box'; bx.style.cssText = css(look);
        for (; k <= z; k++) bx.append(atoms[k].cloneNode(true));
        copy.append(bx);
      }
      for (; k < atoms.length; k++) copy.append(atoms[k].cloneNode(true));
      boxes.append(copy);
    }
  }

  return {
    textElement: textEl,
    report: entries.map((e) => ({ tier: e.tier.id, set: e.set.id, layer: e.layer, members: e.set.members.map((id, mi) => ({ id, ...e.ws[mi] })) })),
  };
}

// The code point offset in the text of a DOM position inside the painted text, or null.
export function offsetAt(view, node, offset) {
  let el = node.nodeType === 3 ? node.parentElement : node;
  while (el && !el.dataset?.start) el = el.parentElement;
  if (!el) return null;
  const start = +el.dataset.start;
  if (node.nodeType !== 3) return offset === 0 ? start : +el.dataset.end;
  return start + Array.from(node.data.slice(0, offset)).length;
}
