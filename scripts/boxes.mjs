import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || '/usr/sbin/brave', headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.goto('https://gabjsp.github.io/descarte-certo-ms/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 1500));
await page.evaluate(() => { const el = document.querySelector('#list > *'); if (el) el.click(); });
await new Promise(r => setTimeout(r, 800));
const out = await page.evaluate(() => {
  const q = (s) => [...document.querySelectorAll(s)].map(e => { const r = e.getBoundingClientRect(); return { t: (e.innerText||'').slice(0,28).replace(/\n/g,' '), x: Math.round(r.x+scrollX), y: Math.round(r.y+scrollY), w: Math.round(r.width), h: Math.round(r.height) }; });
  return { heroBtn: q('.hero .btn'), chips: q('#chips > *'), list: q('#list > *').slice(0,3), tiles: q('#tiles > *'), mapBtn: q('#mapcard a, #mapcard button'), planBtn: q('#plan a, #plan button'), steps: q('.step3') };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
