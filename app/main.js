// The app shell (docs/ui-plan.md, step 1 and the first part of step 2): open a .pxml file,
// render it with the layer painter, restack and toggle tiers, switch themes, add tiers and
// sets, mark selected text into the selected set, undo and redo, save.
import { load, save, spanText, Editor, PxmlError } from '../src/core/index.js';
import { paint, offsetAt } from '../src/render/paint.js';
import sample from './sample.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let ed, view, fileName = 'twinkle.pxml';
let selTier = null, selSet = null;

function status(msg, error = false) { const s = $('status'); s.textContent = msg; s.className = error ? 'error' : ''; }

function open(source, name) {
  try {
    const { doc, warnings } = load(source);
    ed = new Editor(doc);
    fileName = name;
    selTier = doc.tiers.at(-1)?.id ?? null;
    selSet = null;
    render();
    status(warnings.length ? `Opened ${name}, with warnings: ${[...new Set(warnings.map((w) => w.code))].join(', ')}` : `Opened ${name}.`);
  } catch (e) {
    if (!(e instanceof PxmlError)) throw e;
    status(`Could not open ${name}: ${e.message}`, true);
  }
}

// Run an edit; report a refusal instead of throwing.
function act(fn, done) {
  try { const out = fn(); render(); if (done) status(done); return out; }
  catch (e) { if (!(e instanceof PxmlError)) throw e; status(`Not done: ${e.message}`, true); }
}

function render() {
  const doc = ed.doc;
  view = paint($('poem'), doc);
  $('undo').disabled = !ed.canUndo;
  $('redo').disabled = !ed.canRedo;

  const sel = $('theme');
  sel.replaceChildren(new Option('none', ''), ...ed.themes.map((t) => new Option(t.name, t.name, false, t.active)));
  if (!ed.themes.some((t) => t.active)) sel.value = '';

  if (selTier && !doc.tiers.some((t) => t.id === selTier)) selTier = null;
  $('tiers').replaceChildren(...doc.tiers.map((t, i) => {
    const li = document.createElement('li');
    li.className = t.id === selTier ? 'selected' : '';
    li.innerHTML = `<input type="checkbox" title="Shown" ${t.attrs.disabled === 'true' ? '' : 'checked'}>
      <span>${esc(t.attrs.name ?? t.id)} <span class="meta">${t.attrs.role ? esc(t.attrs.role) : 'no role'}${t.attrs.kind === 'relation' ? ' · relation' : ''}${t.attrs.provider ? ' · ' + esc(t.attrs.provider) : ''}</span></span>
      <span class="moves"><button title="Up a layer" ${i === doc.tiers.length - 1 ? 'disabled' : ''}>↑</button><button title="Down a layer" ${i === 0 ? 'disabled' : ''}>↓</button></span>`;
    const [cb] = li.getElementsByTagName('input');
    const [up, down] = li.getElementsByTagName('button');
    cb.onclick = (ev) => { ev.stopPropagation(); act(() => ed.setTier(t.id, { disabled: cb.checked ? undefined : 'true' })); };
    up.onclick = (ev) => { ev.stopPropagation(); act(() => ed.moveTier(t.id, i + 1)); };
    down.onclick = (ev) => { ev.stopPropagation(); act(() => ed.moveTier(t.id, i - 1)); };
    li.onclick = () => { selTier = t.id; selSet = null; render(); };
    return li;
  }));

  const box = $('sets');
  box.replaceChildren();
  const tier = doc.tiers.find((t) => t.id === selTier);
  if (!tier) { box.innerHTML = '<p class="hint">Select a tier to see its sets.</p>'; return; }
  const h = document.createElement('h3');
  h.textContent = `Sets in ${tier.attrs.name ?? tier.id}`;
  box.append(h);
  if (selSet && !tier.sets.some((s) => s.id === selSet)) selSet = null;
  for (const s of tier.sets) {
    const div = document.createElement('div');
    div.className = 'set' + (s.id === selSet ? ' selected' : '');
    div.innerHTML = `<header><strong>${esc(s.attrs.name ?? s.id)}</strong>${s.attrs.tags ? ` <span class="hint">${esc(s.attrs.tags)}</span>` : ''}<span class="count">${s.members.length}</span></header>`;
    div.querySelector('header').onclick = () => { selSet = s.id; render(); };
    const ul = document.createElement('ul');
    for (const m of s.members) {
      const li = document.createElement('li');
      if (tier.attrs.provider && !s.confirmed.includes(m)) li.className = 'inferred';
      li.innerHTML = `<span>${esc(spanText(doc, m))}</span><button title="Remove from set">×</button>`;
      li.querySelector('button').onclick = () => act(() => ed.removeMember(s.id, m));
      ul.append(li);
    }
    div.append(ul);
    box.append(div);
  }
  const form = document.createElement('form');
  form.className = 'inline';
  form.innerHTML = '<input name="name" placeholder="New set name"><button>Add set</button>';
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const name = form.elements.name.value.trim();
    selSet = act(() => ed.addSet(tier.id, { name: name || undefined })) ?? selSet;
    render();
  };
  box.append(form);
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = selSet ? 'Select text in the poem and press M (or Mark) to add it to the selected set.' : 'Select a set, then select text and press M to mark it.';
  const mark = document.createElement('button');
  mark.textContent = 'Mark selection';
  mark.disabled = !selSet;
  mark.onclick = markSelection;
  box.append(mark, hint);
}

function markSelection() {
  if (!selSet) return status('Select a set first.', true);
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return status('Select some text in the poem first.', true);
  const r = sel.getRangeAt(0);
  const a = offsetAt(view, r.startContainer, r.startOffset), b = offsetAt(view, r.endContainer, r.endOffset);
  if (a === null || b === null || b <= a) return status('The selection must be inside the poem.', true);
  const id = act(() => ed.mark(selSet, [[a, b]]));
  if (id) { sel.removeAllRanges(); status(`Marked “${spanText(ed.doc, id)}”.`); }
}

$('open').onchange = async (ev) => {
  const f = ev.target.files[0];
  if (f) open(await f.text(), f.name);
  ev.target.value = '';
};
$('save').onclick = () => {
  const blob = new Blob([save(ed.doc)], { type: 'application/xml' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: fileName.replace(/(\.pxml)?$/, '.pxml') });
  a.click();
  URL.revokeObjectURL(a.href);
  status(`Saved ${a.download}.`);
};
$('undo').onclick = () => { ed.undo(); render(); };
$('redo').onclick = () => { ed.redo(); render(); };
$('theme').onchange = (ev) => act(() => ed.useTheme(ev.target.value || null));
$('new-tier').onsubmit = (ev) => {
  ev.preventDefault();
  const f = ev.target.elements;
  const id = act(() => ed.addTier({ name: f.name.value.trim(), role: f.role.value.trim() || undefined, kind: f.relation.checked ? 'relation' : 'label' }));
  if (id) { selTier = id; selSet = null; ev.target.reset(); render(); }
};
addEventListener('keydown', (ev) => {
  if (ev.target.closest('input, select, textarea')) return;
  const mod = ev.metaKey || ev.ctrlKey;
  if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? ed.redo() : ed.undo(); render(); }
  else if (!mod && ev.key.toLowerCase() === 'm') { ev.preventDefault(); markSelection(); }
});

open(sample, 'twinkle.pxml');
