// Grava o site novo (servido em :4321) em estados. Cada clique do vídeo = uma textura nova.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const BASE = 'http://localhost:4321';
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || '/usr/sbin/brave', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const rects = () => page.evaluate(() => {
  const o = {};
  document.querySelectorAll('[data-video]').forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    o[e.getAttribute('data-video')] = { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  });
  return o;
});
async function go(path) {
  await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await wait(900);
}
async function snap(name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(450);
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `public/tex/${name}.png`, fullPage: true });
  out[name] = { pageH, rects: await rects() };
  console.log(name, pageH);
}
async function viewport(name, scrollY) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  await wait(500);
  await page.screenshot({ path: `public/tex/${name}.png`, fullPage: false });
  out[name] = { scrollY, rects: await rects(), pageH: 1080 };
  console.log(name, 'scrollY', await page.evaluate(() => scrollY));
}
const click = (hook) => page.evaluate((h) => document.querySelector(`[data-video="${h}"]`).click(), hook);

await go('index.html?capture=1');
await snap('a0');

await go('pontos.html?capture=1');
await snap('b0');
await click('chip-pilhas'); await wait(500); await snap('b1');
await click('ponto-6'); await wait(500); await snap('b2');
const S = 300;
await viewport('bm0', S);
await click('abrir-mapa'); await wait(6000);
await viewport('bm1', S);
await page.keyboard.press('Escape'); await wait(500);

await go('como-descartar.html?capture=1');
await snap('c0');
await click('salto-pilhas'); await wait(500); await snap('c1');

await go('gaveta.html?capture=1&reset=1');
await snap('d0');
await click('tile-tv'); await wait(500); await snap('d1');
await click('tile-lampada'); await wait(500); await snap('d2');
const btn = out.d2.rects['abrir-mapa-parada-1'];
const S2 = Math.max(0, btn.y - 420);
await viewport('dm0', S2);
await click('abrir-mapa-parada-1'); await wait(6000);
await viewport('dm1', S2);
await page.keyboard.press('Escape');

await go('por-que-importa.html?capture=1');
await snap('e0');
await go('estudos.html?capture=1');
await snap('f0');
fs.writeFileSync('src/cap.json', JSON.stringify(out, null, 1));
await browser.close();
