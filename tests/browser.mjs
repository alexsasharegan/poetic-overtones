// Browser tests for the painter and the app (board QA-1, ADR-0016). They need Playwright and its
// browser (npm install; npx playwright install chromium), so they are a separate step from
// `npm test`. Usage: npm run test:browser
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.pxml': 'application/xml' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pathname === '/favicon.ico') return void res.writeHead(204).end();
    const path = normalize(join(root, pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!path.startsWith(root)) throw new Error('outside');
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'text/plain' }).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((ok) => server.listen(0, ok));
const url = `http://localhost:${server.address().port}/app/`;

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failed++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

// Select the first occurrence of `needle` in the painted text, optionally only part of it.
const select = (needle, from = 0, to = needle.length) => page.evaluate(([needle, from, to]) => {
  document.activeElement?.blur();       // a mouse selection takes focus off any control
  const walker = document.createTreeWalker(document.querySelector('.pp-text'), NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const i = n.data.indexOf(needle);
    if (i >= 0 && n.parentElement.closest('[data-start]')) {
      const r = document.createRange(); r.setStart(n, i + from); r.setEnd(n, i + to);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      return true;
    }
  }
  return false;
}, [needle, from, to]);
const chips = () => page.$$eval('#sets .set li span', (els) => els.map((e) => e.textContent));
const statusText = () => page.textContent('#status');
const ready = () => page.waitForSelector('#poem .pp-text', { timeout: 8000 }).catch((e) => { console.log('page errors:', errors); throw e; });

await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await ready();

check('the sample opens and paints', (await page.textContent('#poem .pp-text')).includes('Twinkle, twinkle'));

// marking: a new tier and set, then a selection and the M key
await page.fill('#new-tier input[name=name]', 'Mine');
await page.click('#new-tier button');
await page.fill('#sets form.inline input[name=name]', 'picked');
await page.click('#sets form.inline button');
await select('wonder');
await page.keyboard.press('m');
check('M marks the selection into the selected set', (await chips()).join() === 'wonder', (await chips()).join());

// snap to words
await page.check('input[name=snap]');
await select('diamond', 2, 5);
await page.keyboard.press('m');
check('snap to words widens the selection to the whole word', (await chips()).includes('diamond'), (await chips()).join());
await page.uncheck('input[name=snap]');

// pieces: two selections, one span
await select('Up');
await page.keyboard.press('p');
check('P keeps a piece and shows it', (await page.textContent('.pieces')).includes('1 piece'));
await select('world');
await page.keyboard.press('m');
const spanChips = await chips();
check('the pieces and the last selection become one member', spanChips.length === 3 && spanChips.includes('Up … world'), spanChips.join('|'));
check('collected pieces are cleared after marking', (await page.$('.pieces')) === null);

// clicking painted text finds its member
await page.click('#tiers li:has-text("Lines")');
await select('How I wonder', 0, 0);
await page.evaluate(() => { getSelection().collapse(document.querySelector('.pp-text'), 0); });
const box = await page.locator('.pp-text [data-start]', { hasText: 'Up' }).first().boundingBox();
await page.mouse.click(box.x + 3, box.y + box.height / 2);
check('clicking painted text selects its member in the panel', (await statusText()).includes('is in'), await statusText());

// the working copy survives a reload
await page.reload();
await ready();
check('a reload reopens the working copy', (await statusText()).startsWith('Reopened your working copy'), await statusText());
await page.click('#tiers li:has-text("Mine")');
check('the marks are still there', (await chips()).includes('wonder'), (await chips()).join());

// the demo, themes and credit
await page.selectOption('#samples', '../demo/sonnet18.pxml');
await page.waitForFunction(() => document.querySelector('#doc-title')?.textContent.includes('Sonnet 18'));
check('the demo opens with its title', (await page.textContent('#doc-title')).includes('William Shakespeare'));
check('the active theme is Plain', (await page.inputValue('#theme')) === 'Plain');
check('Plain needs no credit line', (await page.textContent('#credit')) === '');
await page.selectOption('#theme', 'Community');
check('the Community theme shows its credit', (await page.textContent('#credit')).includes('Eric Kingsepp (Éadric Scúsmiþ)'), await page.textContent('#credit'));
await page.selectOption('#theme', 'Plain');

// add a built-in theme to a document that lacks it
await page.selectOption('#samples', '');
await page.selectOption('#add-theme', 'Plain');
await page.waitForFunction(() => [...document.querySelectorAll('#theme option')].some((o) => o.textContent === 'Plain'));
check('Add theme puts the built-in theme into the document and activates it', (await page.inputValue('#theme')) === 'Plain');

// print view
await page.emulateMedia({ media: 'print' });
check('print hides the panel and the controls', !(await page.isVisible('aside')) && !(await page.isVisible('header')) && (await page.isVisible('#poem')));
await page.emulateMedia({ media: 'screen' });

check('no errors in the page', errors.length === 0, errors.join('\n'));

await browser.close();
server.close();
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
