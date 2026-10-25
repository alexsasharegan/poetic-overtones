// The app shell (docs/ui-plan.md, step 1 and the first part of step 2): open a .pxml file,
// render it with the layer painter, restack and toggle tiers, switch themes, add tiers and
// sets, mark selected text into the selected set (one or several pieces, optionally snapped to
// words), click painted text to find its member, undo and redo, save, keep a working copy in the
// browser, print.
import { load, save, Editor, PxmlError } from '../src/core/index.js';
import { paint, offsetAt } from '../src/render/paint.js';
import { snapToWords, overlaps } from '../src/render/select.js';
import { providerFor } from '../src/providers/index.js';
import sample from './sample.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let ed, view, fileName = 'twinkle.pxml';
let selTier = null, selSet = null;
let pieces = [], snap = false, focusMember = null;          // W-06: pieces collected for one span
const KEY = 'poetic-overtones:working-copy';                  // O-05
const THEMES = { Community: 'community.css', Plain: 'plain.css' };

// A span's text for display: its pieces in order, joined with an ellipsis when there are several (M-05).
const label = (doc, id) => doc.spans.get(id).pieces.map((p) => Array.from(doc.text).slice(p.start, p.end).join('')).join(' … ');

function status(msg, error = false) { const s = $('status'); s.textContent = msg; s.className = error ? 'error' : ''; }

// O-05: the working copy lives in local storage; a failure is reported once, and the app carries on.
let warnedStorage = false;
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ name: fileName, source: save(ed.doc) })); warnedStorage = false; }
  catch (e) { if (!warnedStorage) { warnedStorage = true; status('Your work could not be kept in this browser, so save it to a file.', true); } }
}
function restore() {
  try {
    const kept = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (kept?.source) { open(kept.source, kept.name); status(`Reopened your working copy of ${kept.name}.`); return true; }
  } catch { /* unreadable or unavailable: start from the sample */ }
  return false;
}

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
    selSet = null; pieces = []; focusMember = null;
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
  const meta = doc.meta?.attrs ?? {};
  $('doc-title').innerHTML = meta.title ? `${esc(meta.title)}${meta.author ? ` <small>${esc(meta.author)}${meta.year ? ', ' + esc(meta.year) : ''}</small>` : ''}` : '';
  const live = doc.styles.filter((st) => st.attrs.disabled !== 'true' && st.attrs.name !== undefined);
  const credits = live.map((st) => `${st.attrs.name} theme: ${(st.css.match(/^\s*\*?\s*Credit-line:\s*(.+)$/m) || [])[1] ?? ''}`.replace(/: $/, '')).filter((c) => c.includes(':'));
  $('credit').textContent = credits.join(' · ');
  persist();
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
  box.append(markPanel());
}

// Marking (W-06): the selection, or the pieces collected so far plus the selection, becomes one span.
function markPanel() {
  const wrap = document.createElement('div');
  const row = document.createElement('div');
  row.className = 'mark-row';
  row.innerHTML = `<button name="mark" ${selSet ? '' : 'disabled'} title="Mark the selection (M)">Mark selection</button>
    <button name="piece" ${selSet ? '' : 'disabled'} title="Keep this selection as one piece of a span (P)">Add as piece</button>
    <label title="Widen a selection to whole words"><input type="checkbox" name="snap" ${snap ? 'checked' : ''}> snap to words</label>`;
  row.querySelector('[name=mark]').onclick = markSelection;
  row.querySelector('[name=piece]').onclick = addPiece;
  row.querySelector('[name=snap]').onchange = (ev) => { snap = ev.target.checked; };
  wrap.append(row);
  if (pieces.length) {
    const p = document.createElement('div');
    p.className = 'pieces';
    p.innerHTML = `<div>${pieces.length} piece${pieces.length === 1 ? '' : 's'} so far; select more, or press Mark to make one span.</div>
      <ul>${pieces.map(([a, b]) => `<li>${esc(Array.from(ed.doc.text).slice(a, b).join(''))}</li>`).join('')}</ul>
      <button type="button" name="clear">Clear pieces (Esc)</button>`;
    p.querySelector('[name=clear]').onclick = clearPieces;
    wrap.append(p);
  }
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = selSet ? 'Select text in the poem, then press M to mark it, or P to keep it as a piece. Click painted text to find where it is marked.' : 'Select a set, then select text and press M to mark it.';
  wrap.append(hint);
  return wrap;
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
    if (m === focusMember) li.className = (li.className + ' focus').trim();
    li.dataset.member = m;
    const directed = tier.attrs.kind === 'relation' && tier.attrs.directed === 'true';
    const at = s.members.indexOf(m);
    li.innerHTML = `${directed ? `<button name="left" title="Earlier in the relation" ${at === 0 ? 'disabled' : ''}>←</button>` : ''}<span>${esc(label(doc, m))}</span>${directed ? `<button name="right" title="Later in the relation" ${at === s.members.length - 1 ? 'disabled' : ''}>→</button>` : ''}${inferred ? '<button name="ok" title="Confirm (a person accepted it)">✓</button>' : ''}<button name="rm" title="Remove from set">×</button>`;
    li.querySelector('[name=rm]').onclick = () => act(() => ed.removeMember(s.id, m));
    const left = li.querySelector('[name=left]'), right = li.querySelector('[name=right]');
    if (left) left.onclick = () => act(() => ed.moveMember(s.id, m, at - 1));
    if (right) right.onclick = () => act(() => ed.moveMember(s.id, m, at + 1));
    const ok = li.querySelector('[name=ok]');
    if (ok) ok.onclick = () => act(() => ed.confirm(s.id, m), `Confirmed “${label(doc, m)}”.`);
    ul.append(li);
  }
  div.append(ul);
  return div;
}

// The selection in the poem as a [start, end) code point range, snapped to words if asked; or null.
function selectedRange() {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0);
  const a = offsetAt(view, r.startContainer, r.startOffset), b = offsetAt(view, r.endContainer, r.endOffset);
  if (a === null || b === null || b <= a) return null;
  return snap ? snapToWords(ed.doc.text, a, b) : [a, b];
}

function addPiece() {
  if (!selSet) return status('Select a set first.', true);
  const range = selectedRange();
  if (!range) return status('Select some text in the poem first.', true);
  if (overlaps(pieces, range)) return status('That overlaps a piece you already collected.', true);
  pieces.push(range);
  getSelection().removeAllRanges();
  render();
  status(`Kept “${Array.from(ed.doc.text).slice(...range).join('')}” as piece ${pieces.length}. Select the next piece, then press M.`);
}

function clearPieces() { pieces = []; render(); status('Cleared the pieces.'); }

function markSelection() {
  if (!selSet) return status('Select a set first.', true);
  const range = selectedRange();
  if (range && overlaps(pieces, range)) return status('That overlaps a piece you already collected.', true);
  const all = range ? [...pieces, range] : pieces;
  if (!all.length) return status('Select some text in the poem first.', true);
  const id = act(() => ed.mark(selSet, all));
  if (id) { pieces = []; focusMember = id; getSelection().removeAllRanges(); render(); status(`Marked “${label(ed.doc, id)}”.`); }
}

// W-05: a click on painted text finds the topmost member under it and shows it in the panel.
$('poem').addEventListener('click', () => {
  const sel = getSelection();
  if (!sel.isCollapsed || !sel.anchorNode) return;
  const at = offsetAt(view, sel.anchorNode, sel.anchorOffset);
  if (at === null) return;
  const hit = view.at(at)[0];
  if (!hit) { focusMember = null; render(); return status('Nothing is marked there.'); }
  selTier = hit.tier; selSet = hit.set; focusMember = hit.member;
  render();
  $('sets').querySelector('li.focus')?.scrollIntoView({ block: 'nearest' });
  const tier = ed.doc.tiers.find((t) => t.id === hit.tier), set = tier.sets.find((x) => x.id === hit.set);
  status(`“${label(ed.doc, hit.member)}” is in ${set.attrs.name ?? set.id}, in ${tier.attrs.name ?? tier.id}.`);
});

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
$('add-theme').onchange = async (ev) => {
  const name = ev.target.value;
  ev.target.value = '';
  if (!THEMES[name]) return;
  const res = await fetch(new URL(`../themes/${THEMES[name]}`, import.meta.url));
  if (!res.ok) return status(`Could not fetch the ${name} theme.`, true);
  const css = await res.text();
  act(() => ed.addTheme(name, css), `Added the ${name} theme.`);
};
$('print').onclick = () => print();
// Drag a .pxml file onto the page to open it.
addEventListener('dragover', (ev) => { ev.preventDefault(); document.body.classList.add('dragging'); });
addEventListener('dragleave', (ev) => { if (!ev.relatedTarget) document.body.classList.remove('dragging'); });
addEventListener('drop', async (ev) => {
  ev.preventDefault();
  document.body.classList.remove('dragging');
  const f = ev.dataTransfer?.files?.[0];
  if (f) open(await f.text(), f.name);
});
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
  else if (!mod && ev.key.toLowerCase() === 'p') { ev.preventDefault(); addPiece(); }
  else if (ev.key === 'Escape' && pieces.length) clearPieces();
});

if (!restore()) open(sample, 'twinkle.pxml');
