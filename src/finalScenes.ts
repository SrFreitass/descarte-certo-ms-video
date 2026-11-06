import { at, Scene } from './scenes';
import type { CamKey } from './PageCam';
import type { Way } from './Cursor';

// ──────────────────────────────────────────────────────────────────────────
// Vídeo de ENCERRAMENTO (apresentação do site). Tempos em segundos ABSOLUTOS do
// áudio `audio_final.wav` (117,6 s). Cada cena tem `start` (s); ela vai até o
// início da próxima + OVERLAP (crossfade). Para alongar/encurtar, mude os tempos.
// ──────────────────────────────────────────────────────────────────────────
export const FPS = 30;
export const AUDIO_SECONDS = 117.62;
export const FINAL_SECONDS = 119.4; // 1,8 s de respiro após "…lista dos participantes"
export const FINAL_DURATION = Math.round(FINAL_SECONDS * FPS);
export const OVERLAP = 10;

export const STARTS = { home: 0, pontos: 44.3, como: 71.9, gaveta: 79.6, estudos: 90.8, recap: 101.2, credits: 112.0 };

const P = (tex: string, hook: string) => at(tex, hook);
const mk = (start: number) => ({
  f: (t: number) => Math.round((t - start) * FPS),
  key: (t: number, cx: number, cy: number, zoom: number): CamKey => ({ frame: Math.round((t - start) * FPS), cx, cy, zoom }),
  w: (t: number, p: { x: number; y: number }, mode?: 'move' | 'follow'): Way => ({ f: Math.round((t - start) * FPS), x: p.x, y: p.y, mode }),
});

// ─── Início: "nosso site… layout simples… gaveta… três passos" ───────────
const h = mk(STARTS.home);
const navPontos = P('a0', 'nav-pontos');
export const HOME: Scene = {
  id: 'home', dur: Math.round((STARTS.pontos - STARTS.home) * FPS) + OVERLAP, appearAt: h.f(2.0),
  states: [[0, 'a0']],
  keys: [
    h.key(0, 960, 540, 1.0), h.key(4.6, 780, 380, 1.3), h.key(22, 840, 410, 1.36), h.key(27, 900, 440, 1.2),
    h.key(31, 960, 540, 1.0), h.key(34.4, 960, 540, 1.0), h.key(35.5, 1240, 440, 1.45), h.key(40.4, 1240, 440, 1.45),
    h.key(41.4, 960, 960, 1.25), h.key(43.4, 960, 960, 1.25), h.key(44.3, 960, 540, 1.0), h.key(44.8, 960, 540, 1.0),
  ],
  way: [
    h.w(0, { x: 1500, y: 650 }), h.w(2.0, { x: 1500, y: 650 }), h.w(8.0, { x: 560, y: 600 }, 'move'), h.w(27, { x: 560, y: 600 }),
    h.w(35.4, { x: 1320, y: 560 }, 'move'), h.w(40.8, { x: 1320, y: 560 }),
    h.w(41.5, { x: 553, y: 1156 }, 'move'), h.w(42.7, { x: 957, y: 1156 }, 'move'), h.w(43.6, { x: 1362, y: 1156 }, 'move'),
    h.w(44.15, navPontos, 'move'), h.w(44.8, navPontos),
  ],
  clicks: [h.f(44.25)],
  caps: [
    { from: h.f(31.4), to: h.f(34.5), text: 'Layout simples e intuitivo' },
    { from: h.f(34.8), to: h.f(40.6), text: 'Gaveta: o menor número de paradas' },
    { from: h.f(41.1), to: h.f(44.0), text: 'Três passos simples' },
  ],
};

// ─── Pontos de coleta: selecionar → ponto mais próximo → Google Maps → guia ──
const p = mk(STARTS.pontos);
const S_B = 300;
const chipP = P('b0', 'chip-pilhas'), ponto6 = P('b1', 'ponto-6'), verMapa = P('b2', 'abrir-mapa');
const chipL = P('b2extra', 'chip-lampada'), closeB = P('bm1', 'modal-fechar'), googleBtn = P('bm1', 'modal-abrir-google');
const navComo = P('b2', 'nav-como-descartar'), guiaB2 = P('b2', 'guia-item'), guiaB3 = P('b3', 'guia-item');
export const PONTOS: Scene = {
  id: 'pontos', dur: Math.round((STARTS.como - STARTS.pontos) * FPS) + OVERLAP,
  states: [[0, 'b0'], [p.f(48.7), 'b1'], [p.f(50.5), 'b2'], [p.f(64.6), 'b3']],
  keys: [
    p.key(44.3, 960, 540, 1.0), p.key(46.0, 960, 540, 1.0), p.key(46.9, 700, 600, 1.5), p.key(49.6, 700, 600, 1.5),
    p.key(50.6, 960, 860, 1.4), p.key(53.2, 960, 860, 1.4), p.key(54.9, 960, S_B + 540, 1.0), p.key(60.7, 960, S_B + 540, 1.0),
    p.key(61.9, 960, guiaB2.y, 1.3), p.key(62.4, 960, guiaB2.y, 1.3), p.key(63.6, 700, 600, 1.5), p.key(65.0, 700, 600, 1.5),
    p.key(66.2, 960, guiaB3.y, 1.3), p.key(70.2, 960, guiaB3.y + 40, 1.36), p.key(71.7, 960, 540, 1.0), p.key(72.4, 960, 540, 1.0),
  ],
  way: [
    p.w(44.3, navPontos), p.w(46.5, navPontos), p.w(48.3, chipP, 'move'), p.w(48.8, chipP),
    p.w(50.2, ponto6, 'move'), p.w(50.7, ponto6), p.w(55.2, verMapa, 'move'), p.w(55.7, verMapa),
    p.w(57.2, { x: 1100, y: 760 }, 'move'), p.w(58.0, googleBtn, 'move'), p.w(59.5, googleBtn),
    p.w(60.4, closeB, 'move'), p.w(61.0, closeB), p.w(63.2, chipL, 'move'), p.w(64.6, chipL), p.w(66.0, chipL),
    p.w(71.8, navComo, 'move'), p.w(72.4, navComo),
  ],
  clicks: [p.f(48.6), p.f(50.4), p.f(55.4), p.f(60.5), p.f(64.5), p.f(71.95)],
  overlays: [{ from: p.f(55.6), to: p.f(60.9), tex: 'bm1', top: S_B }],
  caps: [
    { from: p.f(46.8), to: p.f(49.8), text: 'Selecione o item que vai descartar' },
    { from: p.f(50.4), to: p.f(53.4), text: 'O ponto de descarte mais próximo' },
    { from: p.f(53.8), to: p.f(60.2), text: 'Link direto para o Google Maps' },
    { from: p.f(61.4), to: p.f(70.4), text: 'Como descartar cada item selecionado' },
  ],
};

// ─── Como descartar: o guia correto, "lâmpadas" ───────────────────────────
const c = mk(STARTS.como);
const salto = P('c0', 'salto-lampada'), navGaveta = P('c0', 'nav-gaveta'), cardL = P('c0', 'guia-lampada');
export const COMO: Scene = {
  id: 'como', dur: Math.round((STARTS.gaveta - STARTS.como) * FPS) + OVERLAP,
  states: [[0, 'c0'], [c.f(77.9), 'c2']],
  keys: [
    c.key(71.9, 960, 540, 1.0), c.key(72.7, 960, 540, 1.0), c.key(73.7, 960, 700, 1.3), c.key(77.2, 960, 700, 1.3),
    c.key(78.6, cardL.x, cardL.y + 60, 1.35), c.key(79.0, cardL.x, cardL.y + 60, 1.35), c.key(79.65, 960, 540, 1.0), c.key(79.95, 960, 540, 1.0),
  ],
  way: [
    c.w(71.9, navComo), c.w(72.7, navComo), c.w(77.5, salto, 'move'), c.w(78.0, salto), c.w(79.0, salto),
    c.w(79.5, navGaveta, 'move'), c.w(79.95, navGaveta),
  ],
  clicks: [c.f(77.8), c.f(79.55)],
  caps: [
    { from: c.f(73.2), to: c.f(77.2), text: 'O guia correto de cada item' },
    { from: c.f(77.5), to: c.f(79.2), text: 'Do celular às lâmpadas' },
  ],
};

// ─── Gaveta: seleciona o que guarda em casa → melhor ponto ───────────────
const g = mk(STARTS.gaveta);
const tileTv = P('d0', 'tile-tv'), tileLamp = P('d1', 'tile-lampada'), navEstudos = P('d2', 'nav-estudos');
export const GAVETA: Scene = {
  id: 'gaveta', dur: Math.round((STARTS.estudos - STARTS.gaveta) * FPS) + OVERLAP,
  states: [[0, 'd0'], [g.f(83.1), 'd1'], [g.f(84.5), 'd2']],
  keys: [
    g.key(79.6, 960, 540, 1.0), g.key(80.4, 960, 540, 1.0), g.key(81.5, 960, 850, 1.2), g.key(85.0, 960, 850, 1.2),
    g.key(85.9, 960, 1000, 1.3), g.key(89.8, 960, 1000, 1.3), g.key(90.5, 960, 540, 1.0), g.key(91.2, 960, 540, 1.0),
  ],
  way: [
    g.w(79.6, navGaveta), g.w(80.6, navGaveta), g.w(82.8, tileTv, 'move'), g.w(83.2, tileTv), g.w(84.2, tileLamp, 'move'), g.w(84.6, tileLamp),
    g.w(86.0, { x: 960, y: 1000 }, 'move'), g.w(89.6, { x: 960, y: 1000 }), g.w(90.6, navEstudos, 'move'), g.w(91.2, navEstudos),
  ],
  clicks: [g.f(83.0), g.f(84.4), g.f(90.7)],
  caps: [
    { from: g.f(81.6), to: g.f(85.0), text: 'Marque o que você guarda em casa' },
    { from: g.f(85.3), to: g.f(90.0), text: 'O melhor ponto para descartar' },
  ],
};

// ─── Estudos: três estudos, referências ──────────────────────────────────
const e = mk(STARTS.estudos);
const estudo1 = P('f0', 'estudo-1'), estudo2 = P('f0', 'estudo-2'), estudo3 = P('f0', 'estudo-3'), refs = P('f0', 'referencias');
export const ESTUDOS: Scene = {
  id: 'estudos', dur: Math.round((STARTS.recap - STARTS.estudos) * FPS) + OVERLAP,
  states: [[0, 'f0']],
  keys: [
    e.key(90.8, 960, 540, 1.0), e.key(91.5, 960, 540, 1.0), e.key(92.2, 960, 720, 1.35), e.key(95.0, 960, 720, 1.35),
    e.key(96.0, refs.x, refs.y, 1.3), e.key(101.6, refs.x, refs.y, 1.3),
  ],
  way: [
    e.w(90.8, navEstudos), e.w(91.6, navEstudos), e.w(92.4, estudo1, 'move'), e.w(93.3, estudo2, 'move'), e.w(94.5, estudo3, 'move'),
    e.w(96.4, { x: refs.x - 160, y: refs.y }, 'move'), e.w(101.6, { x: refs.x - 160, y: refs.y }),
  ],
  clicks: [],
  caps: [
    { from: e.f(91.8), to: e.f(95.3), text: 'Três estudos como base' },
    { from: e.f(96.0), to: e.f(100.8), text: 'As referências estão no site' },
  ],
};

export const PAGE_SCENES: Scene[] = [HOME, PONTOS, COMO, GAVETA, ESTUDOS];
export const PAGE_STARTS = [STARTS.home, STARTS.pontos, STARTS.como, STARTS.gaveta, STARTS.estudos];
