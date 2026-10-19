// The app shell (docs/ui-plan.md, step 1 and the first part of step 2): open a .pxml file,
// render it with the layer painter, restack and toggle tiers, switch themes, add tiers and
// sets, mark selected text into the selected set, undo and redo, save.
import { load, save, spanText, Editor, PxmlError } from '../src/core/index.js';
import { paint, offsetAt } from '../src/render/paint.js';
import { providerFor } from '../src/providers/index.js';
import sample from './sample.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let ed, view, fileName = 'twinkle.pxml';
let selTier = null, selSet = null;

function status(msg, error = false) { const s = $('status'); s.textContent = msg; s.className = error ? 'error' : ''; }

// Open a document served next to the app, fetching the files its <text src> and <style src> name.
async function openUrl(url) {
  const res = await fetch(url);
  if (!res.ok) return status(`Could not fetch ${url}.`, true);
  const source = await res.text();
  const files = new Map();
  for (const [, ref] of source.matchAll(/\bsrc="([^"]+)"/g)) {
    const r = await fetch(new URL(ref, new URL(url, location.href)));
    if (r.ok) files.set(ref, await r.text());
  }
  open(source, url.split('/').pop(), (p) => files.get(p) ?? null);
}

function open(source, name, readFile = null) {
  try {
    const { doc, warnings } = load(source, { readFile });
    ed = new Editor(doc, { providers: providerFor });
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
  catch (e) { if (!(e instanceof PxmlError)) throw e; render(); status(`Not done: ${e.message}`, true); }   // re-render so fields show the real values
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
  if (!tier) { box.innerHTML = '<p class="hint">Select a tier to see its details and sets.</p>'; return; }
  box.append(tierDetails(tier));
  if (selSet && !tier.sets.some((s) => s.id === selSet)) selSet = null;
  tier.sets.forEach((s, k) => box.append(setCard(tier, s, k)));
  const form = document.createElement('form');
  form.className = 'inline';
  form.innerHTML = '<input name="name" placeholder="New set name"><button>Add set</button>';
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const name = form.elements.name.value.trim();
    const id = act(() => ed.addSet(tier.id, { name: name || undefined }));
    if (id) { selSet = id; render(); }
  };
  box.append(form);
  const mark = document.createElement('button');
  mark.textContent = 'Mark selection';
  mark.disabled = !selSet;
  mark.onclick = markSelection;
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = selSet ? 'Select text in the poem and press M (or Mark) to add it to the selected set.' : 'Select a set, then select text and press M to mark it.';
  box.append(mark, hint);
}

// Tier details (ui-plan step 3): name, role, kind, direction, delete. Changes apply on change.
function tierDetails(tier) {
  const f = document.createElement('form');
  f.className = 'details';
  const a = tier.attrs;
  f.innerHTML = `<h3>Tier</h3>
    <label>Name <input name="name" value="${esc(a.name ?? '')}"></label>
    <label>Role <input name="role" value="${esc(a.role ?? '')}" size="10" title="What the tier is about; themes find tiers by role"></label>
    <label>Kind <select name="kind"><option value="label">label</option><option value="relation" ${a.kind === 'relation' ? 'selected' : ''}>relation</option></select></label>
    <label><input type="checkbox" name="directed" ${a.directed === 'true' ? 'checked' : ''} ${a.kind === 'relation' ? '' : 'disabled'}> directed</label>
    ${a.provider ? `<span class="hint">filled by ${esc(a.provider)}</span>
    <button type="button" name="reset" ${providerFor(a.provider) ? '' : 'disabled title="This provider is not available here"'}>Reset</button>
    <button type="button" name="unlink" title="Make it an ordinary tier">Unlink</button>` : ''}
    <button type="button" name="delete" class="danger">Delete tier</button>`;
  const el = f.elements;
  el.name.onchange = () => act(() => ed.setTier(tier.id, { name: el.name.value.trim() }));
  el.role.onchange = () => act(() => ed.setTier(tier.id, { role: el.role.value.trim() }));
  el.kind.onchange = () => act(() => ed.setTier(tier.id, { kind: el.kind.value, directed: el.kind.value === 'relation' ? a.directed : undefined }));
  el.directed.onchange = () => act(() => ed.setTier(tier.id, { directed: el.directed.checked ? 'true' : undefined }));
  el.delete.onclick = () => act(() => ed.removeTier(tier.id), `Deleted tier ${a.name ?? tier.id}. Undo brings it back.`);
  if (el.reset) el.reset.onclick = () => act(() => ed.reset(tier.id), `Reset ${a.name ?? tier.id} from ${a.provider}.`);
  if (el.unlink) el.unlink.onclick = () => act(() => ed.unlink(tier.id), `${a.name ?? tier.id} is now an ordinary tier.`);
  f.onsubmit = (ev) => ev.preventDefault();
  return f;
}

// One set: select, rename, tags, reorder, delete; its members, with confirm for inferred ones.
function setCard(tier, s, k) {
  const doc = ed.doc;
  const div = document.createElement('div');
  div.className = 'set' + (s.id === selSet ? ' selected' : '');
  const head = document.createElement('header');
  head.innerHTML = `<strong>${esc(s.attrs.name ?? s.id)}</strong>${s.attrs.key ? ` <span class="hint">key ${esc(s.attrs.key)}</span>` : ''}${s.attrs.tags ? ` <span class="hint">${esc(s.attrs.tags)}</span>` : ''}<span class="count">${s.members.length}</span>`;
  head.onclick = () => { selSet = s.id; render(); };
  div.append(head);
  if (s.id === selSet) {
    const f = document.createElement('form');
    f.className = 'details';
    f.innerHTML = `<label>Name <input name="name" value="${esc(s.attrs.name ?? '')}"></label>
      <label>Tags <input name="tags" value="${esc(s.attrs.tags ?? '')}" placeholder="place:labial voiced:true"></label>
      <span class="moves"><button type="button" name="up" title="Earlier in the tier" ${k === 0 ? 'disabled' : ''}>↑</button><button type="button" name="down" title="Later in the tier" ${k === tier.sets.length - 1 ? 'disabled' : ''}>↓</button></span>
      <button type="button" name="delete" class="danger">Delete set</button>`;
    const el = f.elements;
    el.name.onchange = () => act(() => ed.setSet(s.id, { name: el.name.value.trim() }));
    el.tags.onchange = () => act(() => ed.setSet(s.id, { tags: el.tags.value.trim() }));
    el.up.onclick = () => act(() => ed.moveSet(s.id, k - 1));
    el.down.onclick = () => act(() => ed.moveSet(s.id, k + 1));
    el.delete.onclick = () => act(() => ed.removeSet(s.id), `Deleted set ${s.attrs.name ?? s.id}. Undo brings it back.`);
    f.onsubmit = (ev) => ev.preventDefault();
    div.append(f);
  }
  const ul = document.createElement('ul');
  for (const m of s.members) {
    const li = document.createElement('li');
    const inferred = tier.attrs.provider && !s.confirmed.includes(m);
    if (inferred) li.className = 'inferred';
    li.innerHTML = `<span>${esc(spanText(doc, m))}</span>${inferred ? '<button name="ok" title="Confirm (a person accepted it)">✓</button>' : ''}<button name="rm" title="Remove from set">×</button>`;
    li.querySelector('[name=rm]').onclick = () => act(() => ed.removeMember(s.id, m));
    const ok = li.querySelector('[name=ok]');
    if (ok) ok.onclick = () => act(() => ed.confirm(s.id, m), `Confirmed “${spanText(doc, m)}”.`);
    ul.append(li);
  }
  div.append(ul);
  return div;
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
$('samples').onchange = (ev) => (ev.target.value ? openUrl(ev.target.value) : open(sample, 'twinkle.pxml'));
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
$('new-standard').onsubmit = (ev) => {
  ev.preventDefault();
  const ref = ev.target.elements.ref.value;
  const id = act(() => ed.addStandardTier(ref), `Added a standard tier from ${ref}.`);
  if (id) { selTier = id; selSet = null; render(); }
};
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
