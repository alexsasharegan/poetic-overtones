// Adding a built-in theme to a document (spec/app.md Y-13).
// Usage: node tests/themes.mjs
import { readFileSync } from 'node:fs';
import { load, save, Editor, PxmlError } from '../src/core/index.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failed++;
};
const throwsCode = (fn, code) => { try { fn(); return false; } catch (e) { return e instanceof PxmlError && e.code === code; } };

const { doc } = load(readFileSync(new URL('../spec/fixtures/01-basic.pxml', import.meta.url), 'utf8'));
const ed = new Editor(doc);
const was = doc.styles.length;

ed.addTheme('Plain', 'tier[role="line"] > set { text-decoration: underline; }');
check('a new theme is a named style block', doc.styles.length === was + 1 && doc.styles.at(-1).attrs.name === 'Plain');
check('it becomes the active theme', ed.themes.filter((t) => t.active).map((t) => t.name).join() === 'Plain');

ed.addTheme('Other', 'tier { color: red; }');
check('adding another makes that one active and disables the rest',
  ed.themes.filter((t) => t.active).map((t) => t.name).join() === 'Other' && doc.styles.find((s) => s.attrs.name === 'Plain').attrs.disabled === 'true');

ed.addTheme('Plain', 'tier[role="line"] > set { color: blue; }');
check('adding a theme by an existing name replaces its CSS', doc.styles.filter((s) => s.attrs.name === 'Plain').length === 1
  && doc.styles.find((s) => s.attrs.name === 'Plain').css.includes('blue') && ed.themes.find((t) => t.active).name === 'Plain');

check('a theme with url() is refused and changes nothing', (() => {
  const before = save(doc);
  return throwsCode(() => ed.addTheme('Bad', 'tier { background: url(x.png); }'), 'style-url') && save(doc) === before;
})());
check('a theme needs a name', throwsCode(() => ed.addTheme('  ', 'tier {}'), 'edit-bad-theme'));

const saved = save(doc);
check('the saved file loads back with the same themes', JSON.stringify(load(saved).doc.styles.map((s) => [s.attrs.name, s.attrs.disabled])) === JSON.stringify(doc.styles.map((s) => [s.attrs.name, s.attrs.disabled])));
check('adding a theme can be undone', (() => { const n = doc.styles.length; ed.addTheme('Temp', 'tier {}'); ed.undo(); return doc.styles.length === n; })());

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
