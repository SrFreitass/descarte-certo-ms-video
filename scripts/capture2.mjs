import puppeteer from 'puppeteer-core';
import fs from 'fs';
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER || '/usr/sbin/brave', headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.goto('https://gabjsp.github.io/descarte-certo-ms/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
await wait(1200);

// Pré-passada: mede a maior altura de #guia/#list/#plan entre estados para fixar min-height
// (assim o layout da página não "pula" entre estados e as coordenadas se mantêm).
const maxes = await page.evaluate(async () => {
  const w = (ms) => new Promise(r => setTimeout(r, ms));
  const m = { guia: 0, list: 0, plan: 0, busca: 0 };
  const chips = [...document.querySelectorAll('#chips > *')];
  for (const c of chips) { c.click(); await w(250); m.guia = Math.max(m.guia, document.querySelector('#guia').offsetHeight); m.list = Math.max(m.list, document.querySelector('#list').offsetHeight); m.busca = Math.max(m.busca, document.querySelector('#busca').offsetHeight); }
  const tiles = [...document.querySelectorAll('#tiles > *')];
  for (let mask = 0; mask < 64; mask++) { /* só amostra alguns estados */ if (mask % 9) continue; tiles.forEach((t, i) => { const on = t.getAttribute('aria-pressed') === 'true' || t.classList.contains('on') || t.classList.contains('sel'); const want = !!(mask & (1 << i)); if (on !== want) t.click(); }); await w(150); m.plan = Math.max(m.plan, document.querySelector('#plan').offsetHeight); }
  return m;
});
console.log('maxes', JSON.stringify(maxes));
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: `#guia{min-height:${maxes.guia}px} #list{min-height:${maxes.list}px} #plan{min-height:${maxes.plan}px} html{scroll-behavior:auto!important} *{transition:none!important;animation:none!important}` });
// Correção de conteúdo (pedido do cliente): projeto de extensão com cursos variados, sem DAC/TADS
await page.evaluate(() => {
  const b = document.querySelector('.badge'); if (b) b.textContent = 'Projeto de Extensão';
  document.querySelectorAll('footer p').forEach(p => { p.textContent = p.textContent.replace(/ · DAC · UCDB · Tecnologia[^.]*/, '').replace(/ · DAC/g, ''); });
});
await wait(1200);

const states = [];
const rect = (sel, i = 0) => page.evaluate((sel, i) => { const e = document.querySelectorAll(sel)[i]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; }, sel, i);
const clickIdx = (sel, i) => page.evaluate((sel, i) => document.querySelectorAll(sel)[i].click(), sel, i);
async function snap(name, targets = {}) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `public/textures/${name}.png`, fullPage: true });
  states.push({ name, pageH, targets });
  console.log(name, pageH);
}

// S0: estado inicial (nada selecionado além do padrão)
const T = {};
T.heroBtn = await rect('.hero .btn', 0);
T.chipPilhas = await rect('#chips > *', 1);
await snap('s0');
// clique 1: chip "Pilhas e baterias"
await clickIdx('#chips > *', 1); await wait(500);
T.list2 = await rect('#list > *', 1);
await snap('s1');
// clique 2: segundo ponto da lista
await clickIdx('#list > *', 1); await wait(500);
T.mapBtn = await rect('#mapcard a, #mapcard button', 0);
await snap('s2');
// clique 3 e 4: itens da gaveta
const tilesBefore = await page.evaluate(() => [...document.querySelectorAll('#tiles > *')].map(t => t.outerHTML.slice(0, 160)));
console.log(tilesBefore.join('\n'));
T.tile = await Promise.all([0,1,2,3,4,5].map(i => rect('#tiles > *', i)));
await clickIdx('#tiles > *', 3); await wait(500);
await snap('s3');
await clickIdx('#tiles > *', 5); await wait(500);
await snap('s4');
T.plan = await rect('#plan', 0);
T.sec = { hero: await rect('#inicio'), stats: await rect('.stats'), how: await rect('.how'), busca: await rect('#busca'), guia: await rect('#guia'), gaveta: await rect('#gaveta'), importa: await rect('#importa'), estudos: await rect('#estudos') };
fs.writeFileSync('src/states.json', JSON.stringify({ states, T }, null, 1));
await browser.close();
