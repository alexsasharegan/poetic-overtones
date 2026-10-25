// Records a walkthrough of the app as a video and a GIF, for sharing.
// Needs Playwright and its browser (npm install; npx playwright install chromium) and ffmpeg.
// Usage: npm run demo:record      Output: .tmp/demo/demo.mp4 and .tmp/demo/demo.gif
//
// VHS records terminals, so it can't drive this app; this script drives the page with Playwright,
// draws a cursor dot (a video of a page has no pointer) and lets ffmpeg make the files.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { load } from '../src/core/index.js';
import { serve } from '../tests/serve.mjs';

const out = fileURLToPath(new URL('../.tmp/demo/', import.meta.url));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const SIZE = { width: 1280, height: 900 };
const text = load(readFileSync(new URL('./sonnet18.pxml', import.meta.url), 'utf8')).doc.text;
const at = (needle, nth = 0) => { let i = -1; for (let k = 0; k <= nth; k++) i = text.indexOf(needle, i + 1); if (i < 0) throw new Error(`no "${needle}"`); return i; };

const site = await serve();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: out, size: SIZE } });
await ctx.addInitScript(() => {
  addEventListener('DOMContentLoaded', () => {
    const dot = Object.assign(document.createElement('div'), { id: 'cursor-dot' });
    dot.style.cssText = 'position:fixed;z-index:99999;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(122,79,179,.55);border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.4);pointer-events:none;left:-50px;top:-50px;transition:left .06s,top .06s';
    document.body.append(dot);
    addEventListener('mousemove', (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
  });
});
const page = await ctx.newPage();
const beat = (ms) => page.waitForTimeout(ms);

// The rectangle of the text between two code point offsets, in the painted poem.
const rect = (a, b) => page.evaluate(([a, b]) => {
  const segs = [...document.querySelectorAll('.pp-text [data-start]')];
  const node = (el) => document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
  const find = (o, end) => segs.find((s) => (end ? +s.dataset.start < o && o <= +s.dataset.end : +s.dataset.start <= o && o < +s.dataset.end));
  const s = find(a, false), e = find(b, true);
  const r = document.createRange();
  r.setStart(node(s), a - s.dataset.start);
  r.setEnd(node(e), b - e.dataset.start);
  const box = r.getBoundingClientRect();
  return { x: box.x, y: box.y, w: box.width, h: box.height };
}, [a, b]);
async function drag(a, b) {                        // select with the mouse, as a person would
  const r = await rect(a, b), y = r.y + r.h / 2;
  await page.mouse.move(r.x + 2, y, { steps: 10 });
  await page.mouse.down();
  await page.mouse.move(r.x + r.w - 2, y, { steps: 14 });
  await page.mouse.up();
}
async function click(a, b) {
  const r = await rect(a, b);
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2, { steps: 12 });
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
}
async function moveTo(selector) {
  const box = await page.locator(selector).first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
}

await page.goto(`${site.url}app/`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await beat(800);

// 1. A marked poem: lines, rhyme scheme, stress and end rhyme, as layers (Sonnet 18, public domain).
await moveTo('#samples');
await page.selectOption('#samples', '../demo/sonnet18.pxml');
await beat(3000);

// 2. Layers switch on and off.
for (const tier of ['Rhyme scheme', 'Stress']) {
  await moveTo(`#tiers li:has-text("${tier}") input`);
  await page.click(`#tiers li:has-text("${tier}") input`);
  await beat(1300);
  await page.click(`#tiers li:has-text("${tier}") input`);
  await beat(900);
}

// 3. Click a word to see where it is marked.
await click(at('May'), at('May') + 3);
await beat(2200);

// 4. Mark alliteration: a new relation tier, snap to words, four selections.
await page.fill('#new-tier input[name=name]', 'Alliteration');
await page.fill('#new-tier input[name=role]', 'alliteration');
await page.check('#new-tier input[name=relation]');
await beat(500);
await page.click('#new-tier button');
await beat(500);
await page.fill('#sets form.inline input[name=name]', 's');
await page.click('#sets form.inline button');
await page.check('input[name=snap]');
await beat(800);
for (const [needle, nth, from, to] of [['summer', 0, 1, 4], ['short', 0, 1, 4], ['Sometime', 0, 1, 4], ['shines', 0, 1, 4]]) {
  const o = at(needle, nth);
  await drag(o + from, o + to);
  await beat(500);
  await page.keyboard.press('m');
  await beat(900);
}
await beat(1500);

// 5. The community scheme on a poem marked for it, and what a theme is: CSS over the same marks.
await moveTo('#samples');
await page.selectOption('#samples', '../themes/community-demo.pxml');
await beat(3500);
await moveTo('#theme');
await page.selectOption('#theme', '');
await beat(2200);
await page.selectOption('#theme', 'Community');
await beat(3500);

const video = await page.video().path();
await ctx.close();
await browser.close();
site.close();

renameSync(video, `${out}raw.webm`);
const ff = (...args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
ff('-i', `${out}raw.webm`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', `${out}demo.mp4`);
const gif = 'fps=10,scale=900:-1:flags=lanczos';
ff('-i', `${out}raw.webm`, '-vf', `${gif},palettegen=max_colors=128:stats_mode=diff`, `${out}palette.png`);
ff('-i', `${out}raw.webm`, '-i', `${out}palette.png`, '-lavfi', `${gif}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, `${out}demo.gif`);
rmSync(`${out}palette.png`);
const mb = (f) => (statSync(f).size / 1e6).toFixed(1);
console.log(`demo.mp4 ${mb(`${out}demo.mp4`)} MB, demo.gif ${mb(`${out}demo.gif`)} MB, in .tmp/demo/`);
