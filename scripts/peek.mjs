import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || '/usr/sbin/brave', headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
page.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 120)));
for (const n of ['index','pontos','como-descartar','gaveta','por-que-importa','estudos']) {
  await page.goto(`http://localhost:4321/${n}.html?capture=1`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `out/qa/site-${n}.png`, fullPage: true });
  console.log(n, h);
}
console.log('errors', JSON.stringify(errs));
await browser.close();
