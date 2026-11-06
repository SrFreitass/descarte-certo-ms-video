import puppeteer from 'puppeteer-core';
import fs from 'fs';
const URL = 'https://gabjsp.github.io/descarte-certo-ms/';
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || '/usr/sbin/brave', headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 1500));
// selecionar o primeiro ponto da lista (estado "ponto selecionado")
const clicked = await page.evaluate(() => {
  const el = document.querySelector('#list > *'); if (el) { el.click(); return el.tagName + ':' + el.className; } return null;
});
console.log('clicked', clicked);
await new Promise(r => setTimeout(r, 800));
await page.evaluate(() => window.scrollTo(0, 0));
const sels = { topbar: '.topbar', hero: '#inicio', stats: '.stats', how: '.how', busca: '#busca', mapcard: '#mapcard', list: '#list', guia: '#guia', gaveta: '#gaveta', tiles: '#tiles', plan: '#plan', importa: '#importa', estudos: '#estudos' };
const layout = await page.evaluate((sels) => {
  const out = { pageH: document.documentElement.scrollHeight, boxes: {} };
  for (const [k, s] of Object.entries(sels)) {
    const e = document.querySelector(s); if (!e) continue;
    const r = e.getBoundingClientRect();
    out.boxes[k] = { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  }
  return out;
}, sels);
fs.writeFileSync('src/layout.json', JSON.stringify(layout, null, 2));
console.log(JSON.stringify(layout));
await page.screenshot({ path: 'public/textures/page.png', fullPage: true });
await browser.close();
