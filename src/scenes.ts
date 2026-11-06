import cap from './cap.json';
import type { CamKey } from './PageCam';
import type { Way } from './Cursor';

// ──────────────────────────────────────────────────────────────────────────
// Linha do tempo do vídeo. Cada cena = uma página do site, com sua própria
// duração (`dur`, em frames a 30fps). Para ALONGAR o vídeo, aumente `dur` de uma
// cena (e estique seus `keys`/`way`/`caps`) ou acrescente uma cena nova.
// A duração total é a soma das cenas (menos a sobreposição de transição).
// ──────────────────────────────────────────────────────────────────────────
export const FPS = 30;
export const OVERLAP = 10; // frames de crossfade entre páginas

type Rects = Record<string, { x: number; y: number; w: number; h: number }>;
const CAP = cap as unknown as Record<string, { pageH: number; rects: Rects; scrollY?: number }>;

export const pageH = (tex: string) => CAP[tex].pageH;
/** Centro (px CSS da página) de um elemento `data-video` num estado capturado. */
export const at = (tex: string, hook: string) => {
  const r = CAP[tex].rects[hook];
  if (!r) throw new Error(`sem rect ${tex}/${hook}`);
  return { x: Math.round(r.x + r.w / 2), y: Math.round(r.y + r.h / 2) };
};

export type Cap = { from: number; to: number; text: string };
/** Modal: imagem de viewport (1920x1080) colocada na posição de rolagem `top`, com fade. */
export type Overlay = { from: number; to: number; tex: string; top: number };
export type Scene = {
  id: string;
  dur: number;
  states: [number, string][]; // [frame, textura] — o site muda de verdade a cada clique
  keys: CamKey[];
  way: Way[];
  clicks: number[];
  caps: Cap[];
  overlays?: Overlay[];
  appearAt?: number;
};

const T = (tex: string, hook: string) => at(tex, hook);
const w = (f: number, p: { x: number; y: number }, mode?: 'move' | 'follow'): Way => ({ f, x: p.x, y: p.y, mode });

// ─── A · Início ───────────────────────────────────────────────────────────
const navPontos = T('a0', 'nav-pontos');
const A: Scene = {
  id: 'inicio', dur: 456, appearAt: 26,
  states: [[0, 'a0']],
  keys: [
    { frame: 0, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 60, cx: 780, cy: 380, zoom: 1.3 },
    { frame: 135, cx: 780, cy: 380, zoom: 1.3 },
    { frame: 185, cx: 1240, cy: 440, zoom: 1.45 },
    { frame: 255, cx: 1240, cy: 440, zoom: 1.45 },
    { frame: 305, cx: 960, cy: 960, zoom: 1.25 },
    { frame: 375, cx: 960, cy: 960, zoom: 1.25 },
    { frame: 415, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 456, cx: 960, cy: 540, zoom: 1.0 },
  ],
  way: [
    w(0, { x: 1500, y: 650 }), w(30, { x: 1500, y: 650 }),
    w(95, { x: 560, y: 600 }, 'move'), w(135, { x: 560, y: 600 }),
    w(200, { x: 1320, y: 560 }, 'move'), w(255, { x: 1320, y: 560 }),
    w(320, { x: 960, y: 1160 }, 'move'), w(375, { x: 960, y: 1160 }),
    w(425, navPontos, 'move'), w(456, navPontos),
  ],
  clicks: [432],
  caps: [
    { from: 12, to: 125, text: 'Um guia para descartar lixo eletrônico do jeito certo.' },
    { from: 160, to: 250, text: 'A gaveta calcula o menor número de paradas.' },
    { from: 292, to: 375, text: 'Três passos simples: escolher, entender o risco e levar.' },
  ],
};

// ─── B · Pontos de coleta (filtro → ponto → modal do Google Maps) ─────────
const S_B = 300;
const chip = T('b0', 'chip-pilhas');
const ponto6 = T('b1', 'ponto-6');
const verMapa = T('b2', 'abrir-mapa');
const navComo = T('b2', 'nav-como-descartar');
const closeB = T('bm1', 'modal-fechar');
const B: Scene = {
  id: 'pontos', dur: 700,
  states: [[0, 'b0'], [123, 'b1'], [228, 'b2']],
  keys: [
    { frame: 0, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 40, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 95, cx: 700, cy: 600, zoom: 1.5 },
    { frame: 140, cx: 700, cy: 600, zoom: 1.5 },
    { frame: 200, cx: 960, cy: 860, zoom: 1.4 },
    { frame: 290, cx: 960, cy: 860, zoom: 1.4 },
    { frame: 335, cx: 960, cy: S_B + 540, zoom: 1.0 },
    { frame: 480, cx: 960, cy: S_B + 540, zoom: 1.0 },
    { frame: 540, cx: 960, cy: 1457, zoom: 1.3 },
    { frame: 610, cx: 960, cy: 1457, zoom: 1.3 },
    { frame: 670, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 700, cx: 960, cy: 540, zoom: 1.0 },
  ],
  way: [
    w(0, navPontos), w(40, navPontos),
    w(110, chip, 'move'), w(123, chip),
    w(215, ponto6, 'move'), w(290, ponto6),
    w(338, verMapa, 'move'), w(347, verMapa),
    w(410, { x: 1100, y: 760 }, 'move'), w(432, { x: 1100, y: 760 }),
    w(462, closeB, 'move'), w(480, closeB),
    w(610, closeB),
    w(672, navComo, 'move'), w(700, navComo),
  ],
  clicks: [120, 225, 342, 466, 680],
  overlays: [{ from: 345, to: 477, tex: 'bm1', top: S_B }],
  caps: [
    { from: 10, to: 95, text: 'Pontos de coleta em Campo Grande, com busca por item.' },
    { from: 128, to: 215, text: 'Filtre o item e veja só quem aceita.' },
    { from: 240, to: 330, text: 'Toque num ponto: endereço, horário e itens aceitos.' },
    { from: 350, to: 470, text: 'O Google Maps abre ali mesmo, sem sair do site.' },
    { from: 520, to: 605, text: 'As orientações mudam conforme o item escolhido.' },
  ],
};

// ─── C · Como descartar ──────────────────────────────────────────────────
const salto = T('c0', 'salto-pilhas');
const navGaveta = T('c0', 'nav-gaveta');
const cardPilhas = T('c0', 'guia-pilhas');
const C: Scene = {
  id: 'como-descartar', dur: 560,
  states: [[0, 'c0'], [123, 'c1']],
  keys: [
    { frame: 0, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 35, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 90, cx: 960, cy: 700, zoom: 1.3 },
    { frame: 125, cx: 960, cy: 700, zoom: 1.3 },
    { frame: 185, cx: cardPilhas.x, cy: cardPilhas.y + 60, zoom: 1.35 },
    { frame: 270, cx: cardPilhas.x, cy: cardPilhas.y + 60, zoom: 1.35 },
    { frame: 335, cx: 960, cy: 1440, zoom: 1.15 },
    { frame: 385, cx: 960, cy: 1440, zoom: 1.15 },
    { frame: 440, cx: 960, cy: 2030, zoom: 1.15 },
    { frame: 470, cx: 960, cy: 2030, zoom: 1.15 },
    { frame: 525, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 560, cx: 960, cy: 540, zoom: 1.0 },
  ],
  way: [
    w(0, navComo), w(35, navComo),
    w(108, salto, 'move'), w(121, salto), w(490, salto),
    w(535, navGaveta, 'move'), w(560, navGaveta),
  ],
  clicks: [120, 545],
  caps: [
    { from: 10, to: 90, text: 'Cada item tem seus riscos e cuidados.' },
    { from: 130, to: 262, text: 'Risco, o que fazer e para onde levar, passo a passo.' },
    { from: 340, to: 460, text: 'Seis guias: do celular às lâmpadas.' },
  ],
};

// ─── D · Gaveta (dois cliques mudam o plano + modal do mapa) ──────────────
const S_D = 544;
const tileTv = T('d0', 'tile-tv');
const tileLamp = T('d1', 'tile-lampada');
const verParada = T('d2', 'abrir-mapa-parada-1');
const navImporta = T('d2', 'nav-por-que-importa');
const closeD = T('dm1', 'modal-fechar');
const D: Scene = {
  id: 'gaveta', dur: 600,
  states: [[0, 'd0'], [133, 'd1'], [203, 'd2']],
  keys: [
    { frame: 0, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 40, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 95, cx: 960, cy: 850, zoom: 1.2 },
    { frame: 305, cx: 960, cy: 850, zoom: 1.2 },
    { frame: 335, cx: 960, cy: S_D + 540, zoom: 1.0 },
    { frame: 485, cx: 960, cy: S_D + 540, zoom: 1.0 },
    { frame: 540, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 600, cx: 960, cy: 540, zoom: 1.0 },
  ],
  way: [
    w(0, navGaveta), w(40, navGaveta),
    w(118, tileTv, 'move'), w(130, tileTv),
    w(195, tileLamp, 'move'), w(205, tileLamp),
    w(338, verParada, 'move'), w(350, verParada),
    w(410, { x: 1000, y: 1180 }, 'move'), w(440, { x: 1000, y: 1180 }),
    w(468, closeD, 'move'), w(485, closeD), w(520, closeD),
    w(566, navImporta, 'move'), w(600, navImporta),
  ],
  clicks: [130, 200, 344, 472, 576],
  overlays: [{ from: 347, to: 483, tex: 'dm1', top: S_D }],
  caps: [
    { from: 10, to: 100, text: 'Gaveta de eletrônicos: marque o que você guarda.' },
    { from: 150, to: 300, text: 'O plano indica o ponto com o menor número de paradas.' },
    { from: 350, to: 480, text: 'E o mapa abre direto da gaveta.' },
  ],
};

// ─── E · Por que importa ─────────────────────────────────────────────────
const navEstudos = T('e0', 'nav-estudos');
const reciclado = T('e0', 'fato-reciclado');
const E: Scene = {
  id: 'por-que-importa', dur: 460,
  states: [[0, 'e0']],
  keys: [
    { frame: 0, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 40, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 100, cx: 960, cy: 700, zoom: 1.35 },
    { frame: 190, cx: 960, cy: 700, zoom: 1.35 },
    { frame: 235, cx: reciclado.x + 40, cy: reciclado.y, zoom: 1.8 },
    { frame: 295, cx: reciclado.x + 40, cy: reciclado.y, zoom: 1.8 },
    { frame: 345, cx: 960, cy: 700, zoom: 1.35 },
    { frame: 385, cx: 960, cy: 700, zoom: 1.35 },
    { frame: 430, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 460, cx: 960, cy: 540, zoom: 1.0 },
  ],
  way: [
    w(0, navImporta), w(40, navImporta),
    w(95, { x: 1100, y: 660 }, 'move'), w(200, { x: 1100, y: 660 }),
    w(250, { x: reciclado.x + 60, y: reciclado.y + 80 }, 'move'), w(300, { x: reciclado.x + 60, y: reciclado.y + 80 }),
    w(395, { x: 960, y: 700 }, 'move'), w(400, { x: 960, y: 700 }),
    w(438, navEstudos, 'move'), w(460, navEstudos),
  ],
  clicks: [446],
  caps: [
    { from: 12, to: 95, text: 'Por que isso importa.' },
    { from: 120, to: 225, text: 'Só 22,3% do lixo eletrônico do mundo é reciclado.' },
    { from: 310, to: 400, text: 'A estimativa é passar de 62 para 82 Mt até 2030.' },
  ],
};

// ─── F · Estudos ─────────────────────────────────────────────────────────
const refs = T('f0', 'referencias');
const F: Scene = {
  id: 'estudos', dur: 340,
  states: [[0, 'f0']],
  keys: [
    { frame: 0, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 40, cx: 960, cy: 540, zoom: 1.0 },
    { frame: 95, cx: 960, cy: 720, zoom: 1.35 },
    { frame: 180, cx: 960, cy: 720, zoom: 1.35 },
    { frame: 235, cx: refs.x, cy: refs.y, zoom: 1.3 },
    { frame: 340, cx: refs.x, cy: refs.y, zoom: 1.3 },
  ],
  way: [
    w(0, navEstudos), w(40, navEstudos),
    w(110, { x: 960, y: 760 }, 'move'), w(180, { x: 960, y: 760 }),
    w(250, { x: refs.x - 200, y: refs.y }, 'move'), w(340, { x: refs.x - 200, y: refs.y }),
  ],
  clicks: [],
  caps: [
    { from: 70, to: 175, text: 'Estudos e fontes que embasam o guia.' },
    { from: 225, to: 325, text: 'Todas as referências, em um só lugar.' },
  ],
};

export const SCENES: Scene[] = [A, B, C, D, E, F];
export const END_DUR = 230;

export const sceneStart = (i: number) => SCENES.slice(0, i).reduce((s, sc) => s + sc.dur - OVERLAP, 0);
export const DURATION = sceneStart(SCENES.length) + OVERLAP + END_DUR - OVERLAP;
