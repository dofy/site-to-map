#!/usr/bin/env node
// Serve a built map, screenshot it the way a visitor sees it, and report problems.
// usage: node check.mjs <dist-dir> [--hours 10,21] [--query 'seed=abc&world=island']
//                       [--finish blueprint] [--finishes] [--quick] [--links]
//
// Every shot uses ?still (ambient life held at one second, no entrance, no camera flights),
// so two runs of the same build give the same pictures. Output in <dist-dir>/_check/:
// overview and every town per hour, a phone view, every finish with --finishes, sheet.png
// (all of them on one page) and report.json.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const args = process.argv.slice(2), dir = resolve(args[0] || 'dist');
const opt = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const hours = (opt('--hours') || opt('--hour') || '10,21').split(',').map(Number).filter(Number.isFinite);
const quick = args.includes('--quick'); // overview + phone only: for comparing seeds
const checkLinks = args.includes('--links');
const allFinishes = args.includes('--finishes');
const finish = opt('--finish');
const extra = (opt('--query') ? '&' + opt('--query') : '') + (finish ? `&finish=${finish}` : '');
const FINISHES = ['paper', 'blueprint', 'halftone', 'pixel'];
const shots = join(dir, '_check'); mkdirSync(shots, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const p = join(dir, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(dir) || !existsSync(p)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }).end(readFileSync(p));
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const { chromium } = await import('playwright');
const launch = (extraArgs = []) => chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', args: extraArgs }).catch(() => chromium.launch({ args: extraArgs }));
const browser = await launch();
const problems = [], notes = [], sheet = [], report = { hours, finish: finish || null, towns: [], shots: [] };
const shot = async (page, name, caption) => {
  const file = join(shots, name + '.png');
  const buf = await page.screenshot({ path: file });
  sheet.push({ file, caption }); report.shots.push(name + '.png');
  return buf;
};
const settle = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))));

// open the map and wait until it is ready; `label` prefixes any problem found on this page
async function open(context, query, label) {
  const page = await context.newPage();
  page.on('pageerror', e => problems.push(`${label}: page error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) problems.push(`${label}: console: ${m.text()}`); });
  page.on('requestfailed', r => problems.push(`${label}: request failed: ${r.url()}`));
  const t0 = Date.now();
  await page.goto(`${base}?${query}`);
  await page.waitForFunction(() => document.getElementById('loader')?.classList.contains('done'), null, { timeout: 90000 }).catch(() => problems.push(`${label}: loader never finished`));
  const loadMs = Date.now() - t0;
  await page.waitForFunction(() => !document.getElementById('map').classList.contains('intro'), null, { timeout: 30000 }).catch(() => problems.push(`${label}: entrance animation never finished`));
  await page.mouse.move(2, 2); await settle(page);
  return { page, loadMs };
}
const goTown = async (page, id) => { await page.evaluate(h => { location.hash = h; }, id); await settle(page); await page.mouse.move(2, 2); await settle(page); };
const hiddenLabels = page => page.evaluate(() => [...document.querySelectorAll('.d-tag')].filter(e => e.style.display !== 'none' && e.style.opacity === '0').map(e => e.textContent));

// 1. desktop, every hour: overview and every town
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
let towns = [];
for (const [hi, h] of hours.entries()) {
  const { page, loadMs } = await open(desk, `t=${h}&still&inspect${extra}`, `desktop ${h}h`);
  if (hi === 0) {
    report.loadMs = loadMs;
    const a = await shot(page, `overview-${h}h`, `overview · ${h}:00`);
    // a held frame must not change by itself
    await page.waitForTimeout(700);
    const b = await page.screenshot();
    if (!a.equals(b)) problems.push('still frame changes over time (?still is not deterministic)');
    // render cost, CPU side, measured over two seconds of the held overview
    await page.evaluate(() => window.__siteMap?.reset());
    await page.waitForTimeout(2000);
    report.frameMs = await page.evaluate(() => window.__siteMap ? +window.__siteMap.frameMs.toFixed(2) : null);
    if (report.frameMs > 30) notes.push(`frame cost ${report.frameMs} ms on the CPU in headless Chromium; a slow phone may stutter`);
    const startFinish = await page.evaluate(() => window.__siteMap?.finish());
    if (allFinishes) for (const f of FINISHES) {
      await page.evaluate(x => window.__siteMap.setFinish(x), f); await settle(page);
      await shot(page, `finish-${f}`, `finish · ${f}`);
    }
    if (allFinishes) await page.evaluate(x => window.__siteMap.setFinish(x), startFinish);
    towns = await page.evaluate(() => [...document.querySelectorAll('#panel button[data-city]')].map(b => b.dataset.city));
    report.towns = towns;
  } else await shot(page, `overview-${h}h`, `overview · ${h}:00`);
  if (!quick) for (const id of towns) {
    await goTown(page, id);
    await shot(page, `town-${id}-${h}h`, `${id} · ${h}:00`);
    if (hi === 0) { const hidden = await hiddenLabels(page); if (hidden.length) notes.push(`town ${id}: ${hidden.length} label(s) hidden by overlap at this angle: ${hidden.join(', ')}`); }
  }
  await page.close();
}

// 2. phone: overview and the first town, no sideways scrolling
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
{
  const { page } = await open(phone, `t=${hours[0]}&still${extra}`, 'phone');
  await shot(page, 'phone-overview', 'phone · overview');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 1) problems.push(`phone: page scrolls sideways by ${over}px`);
  if (towns[0] && !quick) { await goTown(page, towns[0]); await shot(page, `phone-${towns[0]}`, `phone · ${towns[0]}`); }
  await page.close();
}

// 3. reduced motion, without ?still: the page must load and hold still
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const { page } = await open(ctx, `t=${hours[0]}${extra}`, 'reduced motion');
  await page.waitForTimeout(3200); // the interface fades in over 2.8 s even without motion
  const a = await page.screenshot(); await page.waitForTimeout(700); const b = await page.screenshot();
  if (!a.equals(b)) problems.push('reduced motion: the map keeps moving');
  await ctx.close();
}
await browser.close();

// 4. no WebGL: the fallback message shows and the town list still works
{
  const noGL = await launch(['--disable-3d-apis', '--disable-webgl']);
  const ctx = await noGL.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`${base}?t=${hours[0]}${extra}`);
  await page.waitForFunction(() => document.getElementById('loader')?.classList.contains('done'), null, { timeout: 30000 }).catch(() => errs.push('loader never finished'));
  const fb = await page.evaluate(() => !!document.querySelector('.fallback'));
  if (!fb) problems.push('no WebGL: the fallback message is missing');
  if (errs.length) problems.push(`no WebGL: ${errs.join('; ')}`);
  await noGL.close();
}

if (checkLinks) {
  const site = JSON.parse(readFileSync(join(dir, 'index.html'), 'utf8').match(/mountMap\((\{[\s\S]*\})\);/)[1]);
  const urls = [...new Set(site.cities.flatMap(c => c.items.map(i => i.url)).filter(u => /^https?:/.test(u)))];
  for (const u of urls) {
    try { const r = await fetch(u, { method: 'HEAD', redirect: 'follow' }); if (r.status >= 400 && r.status !== 405 && r.status !== 403) problems.push(`link ${r.status}: ${u}`); }
    catch { problems.push(`link unreachable: ${u}`); }
  }
}

// contact sheet: every shot on one page, so one look covers the whole run
{
  const sb = await launch();
  const page = await sb.newPage({ viewport: { width: 1500, height: 800 } });
  const tiles = sheet.map(s => `<figure><img src="data:image/png;base64,${readFileSync(s.file).toString('base64')}"><figcaption>${s.caption}</figcaption></figure>`).join('');
  await page.setContent(`<style>body{margin:0;padding:16px;background:#eee;font:13px/1.4 system-ui;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    figure{margin:0}img{width:100%;max-height:320px;object-fit:contain;background:#fff;display:block;border:1px solid #ccc}figcaption{padding:4px 2px;color:#333}</style>${tiles}`);
  await page.screenshot({ path: join(shots, 'sheet.png'), fullPage: true });
  await sb.close();
}
server.close();

Object.assign(report, { problems, notes });
writeFileSync(join(shots, 'report.json'), JSON.stringify(report, null, 2));
console.log(`loaded in ${report.loadMs} ms; ${towns.length} towns; frame ${report.frameMs ?? '?'} ms; ${sheet.length} screenshots in ${shots} (sheet.png has all of them)`);
if (notes.length) console.log('notes:\n- ' + notes.join('\n- '));
console.log(problems.length ? 'problems:\n- ' + problems.join('\n- ') : 'no problems found');
process.exit(problems.length ? 1 : 0);
