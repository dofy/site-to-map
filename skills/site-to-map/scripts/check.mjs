#!/usr/bin/env node
// Serve a built map, screenshot the overview and every town, and report problems.
// usage: node check.mjs <dist-dir> [--hour 10] [--links]
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const args = process.argv.slice(2), dir = resolve(args[0] || 'dist');
const hour = args.includes('--hour') ? args[args.indexOf('--hour') + 1] : '10';
const checkLinks = args.includes('--links');
const shots = join(dir, '_check'); mkdirSync(shots, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const p = join(dir, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(dir) || !existsSync(p)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }).end(readFileSync(p));
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const { chromium } = await import('playwright');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' }).catch(() => chromium.launch());
const problems = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => problems.push('page error: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) problems.push('console: ' + m.text()); });
page.on('requestfailed', r => problems.push('request failed: ' + r.url()));
const t0 = Date.now();
await page.goto(`${base}?t=${hour}`);
await page.waitForFunction(() => document.getElementById('loader')?.classList.contains('done'), null, { timeout: 90000 }).catch(() => problems.push('loader never finished'));
const loadMs = Date.now() - t0;
await page.waitForFunction(() => !document.getElementById('map').classList.contains('intro'), null, { timeout: 30000 }).catch(() => problems.push('entrance animation never finished'));
await page.mouse.move(2, 2);
await page.screenshot({ path: join(shots, 'overview.png') });
const towns = await page.evaluate(() => [...document.querySelectorAll('#panel button[data-city]')].map(b => b.dataset.city));
for (const id of towns) {
  await page.evaluate(h => { location.hash = h; }, id);
  await page.waitForTimeout(1900); await page.mouse.move(2, 2);
  await page.screenshot({ path: join(shots, `town-${id}.png`) });
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.d-tag')].filter(e => e.style.display !== 'none' && e.style.opacity === '0').map(e => e.textContent));
  if (hidden.length) problems.push(`town ${id}: ${hidden.length} label(s) hidden by overlap at this angle: ${hidden.join(', ')}`);
}
if (checkLinks) {
  const urls = await page.evaluate(() => [...document.querySelectorAll('.no-js a, noscript')].length);
  const site = await page.evaluate(() => [...new Set([...document.querySelectorAll('script[type=module]')].map(s => s.textContent).join('').match(/https?:\/\/[^"\\]+/g) || [])]);
  for (const u of site.filter(u => !/jsdelivr|googleapis|gstatic/.test(u))) {
    try { const r = await fetch(u, { method: 'HEAD', redirect: 'follow' }); if (r.status >= 400 && r.status !== 405 && r.status !== 403) problems.push(`link ${r.status}: ${u}`); }
    catch (e) { problems.push(`link unreachable: ${u}`); }
  }
  void urls;
}
await browser.close(); server.close();
console.log(`loaded in ${loadMs} ms; ${towns.length} towns; screenshots in ${shots}`);
console.log(problems.length ? 'problems:\n- ' + problems.join('\n- ') : 'no problems found');
process.exit(problems.some(p => /error|never|failed/.test(p)) ? 1 : 0);
