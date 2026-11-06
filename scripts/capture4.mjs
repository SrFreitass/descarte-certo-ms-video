// Estados extras para o vídeo de encerramento: pontos (b3 = guia de lâmpadas) e como-descartar (c2 = atalho lâmpadas)
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const BASE = 'http://localhost:4321';
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || '/usr/sbin/brave', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const cap = JSON.parse(fs.readFileSync('src/cap.json', 'utf8'));
const rects = () => page.evaluate(() => { const o = {}; document.querySelectorAll('[data-video]').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width < 1) return; o[e.getAttribute('data-video')] = { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; }); return o; });
const click = (h) => page.evaluate((h) => document.querySelector(`[data-video="${h}"]`).click(), h);
async function go(p) { await page.goto(`${BASE}/${p}`, { waitUntil: 'networkidle0', timeout: 60000 }); await page.evaluate(() => document.fonts.ready); await wait(900); }
async function snap(name) { await page.evaluate(() => window.scrollTo(0, 0)); await wait(450); const pageH = await page.evaluate(() => document.documentElement.scrollHeight); await page.screenshot({ path: `public/tex/${name}.png`, fullPage: true }); cap[name] = { pageH, rects: await rects() }; console.log(name, pageH); }
await go('pontos.html?capture=1');
await click('chip-pilhas'); await wait(400); await click('ponto-6'); await wait(400);
cap.b2extra = { pageH: 0, rects: await rects() };
await click('chip-lampada'); await wait(500); await snap('b3');
await go('como-descartar.html?capture=1');
await click('salto-lampada'); await wait(500); await snap('c2');
fs.writeFileSync('src/cap.json', JSON.stringify(cap, null, 1));
await browser.close();
