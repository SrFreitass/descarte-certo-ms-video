import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, interpolateColors, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont as loadDisplay } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadBody } from '@remotion/google-fonts/PlusJakartaSans';
import { cueTime } from './sync';
import cuesJson from './cues.json';

const display = loadDisplay('normal', { weights: ['600', '700'], subsets: ['latin', 'latin-ext'] }).fontFamily;
const body = loadBody('normal', { weights: ['500', '600', '700'], subsets: ['latin', 'latin-ext'] }).fontFamily;

// Tokens do site (assets/css/style.css) — mesma identidade do vídeo do site
const C = { paper: '#f6f4ee', ink: '#14261b', ink2: '#4a5d51', brand: '#1d6b3c', brand900: '#0f3b24', brand50: '#e8f3ea', lime: '#b8e07a', amber: '#e0a13a', amberInk: '#7a4a00', line: '#dde3d9' };
const LIME_BAND = 'rgba(184,224,122,.9)';
const AMBER_BAND = 'rgba(224,161,58,.34)';

export const FPS = 30;
export const INTRO_SECONDS = 172; // áudio tem 170,05 s + 2 s de respiro para a passagem ao site
export const INTRO_DURATION = INTRO_SECONDS * FPS;
const W = 1920, H = 1080;
const s = (t: number) => Math.round(t * FPS);
const PAD = 12; // cada cena começa PAD frames antes do corte; a transição dura 2·PAD frames centrada no corte

// ── cues: TODOS os instantes ligados à fala ficam em src/cues.json ─────────
type Cue = { t: number; sfx?: string; db?: number };
const CUES = cuesJson as Record<string, Cue>;
export const cue = (key: string): number => {
  const c = CUES[key];
  if (!c) throw new Error(`cue inexistente em cues.json: ${key}`);
  return c.t;
};

// ── utilitários de movimento ─────────────────────────────────────────────
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const EASE = Easing.bezier(0.25, 0.46, 0.45, 0.94);
const OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo-out
const INOUT = Easing.bezier(0.76, 0, 0.24, 1); // quart in-out
const CAM = Easing.bezier(0.33, 0, 0.15, 1);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (f: number, at: number, dur: number, ease: (t: number) => number = OUT) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: ease });
type SpCfg = { damping?: number; stiffness?: number; mass?: number };
/** spring que começa em `at` (frames locais); limitado a 150 frames de simulação. */
const sp = (f: number, at: number, cfg: SpCfg = {}) =>
  f <= at ? 0 : spring({ frame: Math.min(f - at, 150), fps: FPS, config: { damping: 14, stiffness: 120, mass: 0.9, ...cfg } });
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hs = (size: number, color: string = C.ink): React.CSSProperties => ({ fontFamily: display, fontWeight: 700, fontSize: size, lineHeight: 1.06, letterSpacing: -size * 0.02, color });

// ── tipografia cinética ──────────────────────────────────────────────────
type Tone = 'brand' | 'amber';
type Seg = string | { t: string; c?: Tone; mark?: boolean };
type Tok = { w: string; c?: Tone; mark?: boolean; br?: boolean };
const toks = (segs: Seg[] | string): Tok[] => {
  const out: Tok[] = [];
  for (const sg of typeof segs === 'string' ? [segs] : segs) {
    const o = typeof sg === 'string' ? { t: sg } : sg;
    if (o.t === '\n') { out.push({ w: '', br: true }); continue; }
    for (const w of o.t.split(' ')) if (w) out.push({ w, c: o.c, mark: o.mark });
  }
  return out;
};

/** Palavras que sobem de dentro de máscaras com mola; marca-texto desenhado nas palavras `mark`; saída para cima em `out`. */
const Words: React.FC<{ segs: Seg[] | string; at: number; out?: number; stagger?: number; markAt?: number; style?: React.CSSProperties }> = ({ segs, at, out, stagger = 3, markAt, style }) => {
  const f = useCurrentFrame();
  const ts = toks(segs);
  const n = ts.filter((t) => !t.br).length;
  const m0 = markAt ?? at + n * stagger + 8;
  let wi = 0, mi = 0;
  return (
    <span style={{ display: 'block', ...style }}>
      {ts.map((tk, i) => {
        if (tk.br) return <br key={i} />;
        const k = wi++;
        const p = sp(f, at + k * stagger, { damping: 15, stiffness: 150, mass: 0.8 });
        const q = out === undefined ? 0 : ramp(f, out + k * 0.7, 10, Easing.in(Easing.cubic));
        const y = (1 - p) * 115 - q * 115;
        let band: React.ReactNode = null;
        if (tk.mark) {
          const m = ramp(f, m0 + mi++ * 5, 14, INOUT);
          band = <span style={{ position: 'absolute', left: '-0.05em', right: '-0.05em', bottom: '0.08em', height: '0.3em', background: tk.c === 'amber' ? AMBER_BAND : LIME_BAND, borderRadius: '0.08em', transform: `scaleX(${m})`, transformOrigin: '0 50%', opacity: 1 - q }} />;
        }
        const color = tk.c === 'brand' ? C.brand : tk.c === 'amber' ? C.amberInk : undefined;
        return (
          <React.Fragment key={i}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              {band}
              <span style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', padding: '0.22em 0.06em 0.2em', margin: '-0.22em -0.06em -0.2em' }}>
                <span style={{ display: 'inline-block', transform: `translateY(${y}%)`, color }}>{tk.w}</span>
              </span>
            </span>{' '}
          </React.Fragment>
        );
      })}
    </span>
  );
};

const Kicker: React.FC<{ at: number; out?: number; color?: string; children: React.ReactNode }> = ({ at, out, color = C.brand, children }) => {
  const f = useCurrentFrame();
  const a = ramp(f, at, 16);
  const b = ramp(f, at + 4, 20, INOUT);
  const o = out === undefined ? 1 : 1 - ramp(f, out, 8, EASE);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: body, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color, opacity: o }}>
      <span style={{ width: 38, height: 3, background: color, borderRadius: 2, transform: `scaleX(${a})`, transformOrigin: '0 50%' }} />
      <span style={{ clipPath: `inset(-10% ${(1 - b) * 100}% -10% 0)`, transform: `translateX(${(1 - b) * -18}px)` }}>{children}</span>
    </div>
  );
};

/** Troca de títulos: cada item vale até o próximo `at`; saída palavra a palavra antes da entrada do seguinte. */
const TitleSwap: React.FC<{ items: { at: number; kicker: string; segs: Seg[]; size?: number }[]; width?: number }> = ({ items, width = 800 }) => {
  const f = useCurrentFrame();
  return (
    <>
      {items.map((it, i) => {
        const next = items[i + 1]?.at;
        if (f < it.at - 2 || (next !== undefined && f >= next)) return null;
        return (
          <div key={i} style={{ position: 'absolute', left: 0, top: 0, width }}>
            <Kicker at={it.at} out={next !== undefined ? next - 12 : undefined}>{it.kicker}</Kicker>
            <Words segs={it.segs} at={it.at + 4} out={next !== undefined ? next - 14 : undefined} style={{ ...hs(it.size ?? 84), marginTop: 22 }} />
          </div>
        );
      })}
    </>
  );
};

// ── imagem com foco guiado (Ken Burns) ───────────────────────────────────
type FK = { f: number; z: number; fx: number; fy: number };
const lerpKeys = (keys: FK[], f: number, k: 'z' | 'fx' | 'fy') => {
  if (f <= keys[0].f) return keys[0][k];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) return a[k] + (b[k] - a[k]) * CAM(interpolate(f, [a.f, b.f], [0, 1], clamp));
  }
  return keys[keys.length - 1][k];
};
const SHADOW = '0 2px 4px rgba(20,38,27,.08), 0 40px 80px -24px rgba(20,38,27,.45)';
/** fx/fy = ponto da imagem (0..1) no centro; `overlay` é posicionado nas coordenadas da imagem (use % ). */
const FocusImg: React.FC<{ src: string; ar: number; w: number; h: number; keys: FK[]; radius?: number; shadow?: string | false; overlay?: React.ReactNode; inner?: string }> = ({ src, ar, w, h, keys, radius = 26, shadow = SHADOW, overlay, inner }) => {
  const f = useCurrentFrame();
  const z = lerpKeys(keys, f, 'z'), fx = lerpKeys(keys, f, 'fx'), fy = lerpKeys(keys, f, 'fy');
  const baseH = w / ar;
  const cover = Math.max(1, h / baseH);
  const iw = w * cover * z, ih = baseH * cover * z;
  const tx = Math.min(0, Math.max(w - iw, w / 2 - fx * iw));
  const ty = Math.min(0, Math.max(h - ih, h / 2 - fy * ih));
  return (
    <div style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden', position: 'relative', background: '#fff', boxShadow: shadow || undefined }}>
      <div style={{ position: 'absolute', left: tx, top: ty, width: iw, height: ih, transform: inner }}>
        <Img src={staticFile(src.includes('/') ? src : `intro/${src}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        {overlay}
      </div>
    </div>
  );
};

// ── ícones e peças ───────────────────────────────────────────────────────
const LEAF_D = ['M20 4C10 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-6 11-16Z', 'M4 20c2-5 6-8 11-10'];
const Leaf: React.FC<{ size?: number; draw?: number }> = ({ size = 56, draw = 1 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: C.brand, display: 'grid', placeItems: 'center' }}>
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {LEAF_D.map((d) => <path key={d} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />)}
    </svg>
  </div>
);

/** Ícone de traço que se desenha (stroke-dashoffset). Cada elemento recebe pathLength=1. */
const DrawIcon: React.FC<{ els: { k: 'p' | 'r'; d?: string; x?: number; y?: number; w?: number; h?: number; rx?: number }[]; size?: number; color?: string; draw: number; sw?: number }> = ({ els, size = 120, color = C.brand, draw, sw = 1.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {els.map((e, i) => {
      const dd = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - ramp(draw, i * 0.18, 0.7, EASE) };
      return e.k === 'p' ? <path key={i} d={e.d} {...dd} /> : <rect key={i} x={e.x} y={e.y} width={e.w} height={e.h} rx={e.rx} {...dd} />;
    })}
  </svg>
);
const I_PHONE = [{ k: 'r' as const, x: 7, y: 2, w: 10, h: 20, rx: 2.2 }, { k: 'p' as const, d: 'M11 18.5h2' }];
const I_LAPTOP = [{ k: 'r' as const, x: 4, y: 5, w: 16, h: 11, rx: 1.5 }, { k: 'p' as const, d: 'M2 19h20' }];
const I_MONITOR = [{ k: 'r' as const, x: 3, y: 4, w: 18, h: 12, rx: 1.5 }, { k: 'p' as const, d: 'M9 20h6M12 16v4' }];
const I_BIN = [{ k: 'p' as const, d: 'M4 7h16' }, { k: 'p' as const, d: 'M9.5 7V4.5h5V7' }, { k: 'p' as const, d: 'M6 7l1 13h10l1-13' }, { k: 'p' as const, d: 'M10 11v5.5M14 11v5.5' }];

const PIN_D = 'M12 2C7.6 2 4 5.6 4 10c0 5.8 8 12 8 12s8-6.2 8-12c0-4.4-3.6-8-8-8Z';
/** Pino de mapa que cai (mola com quique) e pulsa; a ponta fica exatamente no ponto (0,0) do container. */
const DropPin: React.FC<{ at: number; size?: number; color?: string; hide?: number }> = ({ at, size = 44, color = C.brand, hide = 0 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = sp(f, at, { damping: 9, stiffness: 170, mass: 0.7 });
  const land = f - at;
  const pulse = land > 10 ? ((land - 10) % 54) / 54 : 0;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - hide }}>
      {land > 10 && <div style={{ position: 'absolute', left: -size * 0.6, top: -size * 0.22, width: size * 1.2, height: size * 0.44, borderRadius: '50%', border: `3px solid ${C.lime}`, transform: `scale(${0.4 + pulse * 1.6})`, opacity: (1 - pulse) * 0.9 }} />}
      <div style={{ position: 'absolute', left: -size * 0.24, top: -size * 0.07, width: size * 0.48, height: size * 0.14, borderRadius: '50%', background: 'rgba(15,59,36,.35)', transform: `scale(${0.3 + 0.7 * p})`, opacity: Math.min(1, p) }} />
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left: -size / 2, top: -size * (22 / 24), transform: `translateY(${(1 - p) * -160}px)`, opacity: Math.min(1, p * 4), overflow: 'visible' }}>
        <path d={PIN_D} fill={color} stroke="#fff" strokeWidth={1.4} />
        <circle cx={12} cy={10} r={3.2} fill="#fff" />
      </svg>
    </div>
  );
};

const Pill: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame();
  const p = sp(f, at, { damping: 10, stiffness: 180, mass: 0.7 });
  return (
    <div style={{ opacity: Math.min(1, p * 3), transform: `translateY(${(1 - p) * 26}px) scale(${0.6 + 0.4 * p})`, transformOrigin: '0 50%', background: C.brand, color: '#fff', fontFamily: body, fontWeight: 700, fontSize: 34, padding: '14px 30px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 26px -10px rgba(20,38,27,.5)' }}>
      <span style={{ width: 12, height: 12, borderRadius: 6, background: C.lime, transform: `scale(${ramp(f, at + 6, 12)})` }} />
      {children}
    </div>
  );
};

// ── fundo vivo: curvas topográficas que respiram + folhas nas margens ────
const contour = (cx: number, cy: number, rx: number, ry: number, amp: number, ph: number, seed: number) => {
  const N = 40;
  const pts: [number, number][] = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    const off = amp * (0.55 * Math.sin(3 * a + ph + seed) + 0.3 * Math.sin(5 * a - ph * 1.3 + seed * 2) + 0.15 * Math.sin(2 * a + ph * 0.6));
    pts.push([cx + Math.cos(a) * (rx + off), cy + Math.sin(a) * (ry + off * 0.75)]);
  }
  const mid = (i: number) => { const a = pts[i % N], b = pts[(i + 1) % N]; return `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`; };
  let d = `M${mid(0)}`;
  for (let k = 1; k <= N; k++) d += ` Q${pts[k % N][0].toFixed(1)} ${pts[k % N][1].toFixed(1)} ${mid(k)}`;
  return d + 'Z';
};
const LEAVES = (() => {
  const r = mulberry32(20240611);
  return Array.from({ length: 8 }, (_, i) => ({ right: i % 2 === 1, x: 26 + r() * 56, y0: r() * 1200, speed: 0.18 + r() * 0.22, size: 18 + r() * 14, rot: r() * 360, sway: 6 + r() * 10, ph: r() * 6.28, op: 0.12 + r() * 0.1 }));
})();

const Bg: React.FC = () => {
  const f = useCurrentFrame();
  const ph = f / 420;
  const pan = -f * 0.02; // câmera muito lenta ao longo do vídeo
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(${pan + Math.sin(f / 240) * 30} 0)`} fill="none" stroke="#d6e1d3" strokeWidth={2} opacity={0.75}>
          {Array.from({ length: 9 }, (_, i) => <path key={i} d={contour(1540, 130, 200 + i * 96, 120 + i * 72, 18 + i * 3, ph, 0.9 + i * 0.22)} />)}
        </g>
        <g transform={`translate(${-pan * 0.6} ${Math.sin(f / 300) * 12})`} fill="none" stroke="#dde6da" strokeWidth={2} opacity={0.7}>
          {Array.from({ length: 6 }, (_, i) => <path key={i} d={contour(120, 1080, 160 + i * 88, 110 + i * 66, 14 + i * 3, ph * 0.8 + 2, 2.4 + i * 0.25)} />)}
        </g>
      </svg>
      <div style={{ position: 'absolute', left: -240, bottom: -300, width: 760, height: 760, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,224,122,.30), rgba(184,224,122,0) 70%)' }} />
      {LEAVES.map((l, i) => {
        const y = 1140 - ((l.y0 + f * l.speed) % 1260);
        const fade = Math.min(1, Math.max(0, (1140 - y) / 160), Math.max(0, (y + 60) / 200));
        const x = (l.right ? W - l.x - l.size : l.x) + Math.sin(f / 50 + l.ph) * l.sway;
        return (
          <svg key={i} width={l.size} height={l.size} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y, opacity: l.op * fade, transform: `rotate(${l.rot + Math.sin(f / 70 + l.ph) * 25}deg)` }}>
            <path d={LEAF_D[0]} fill={C.brand} /><path d={LEAF_D[1]} stroke={C.paper} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

const BrandChip: React.FC<{ at: number; hide: number }> = ({ at, hide }) => {
  const f = useCurrentFrame();
  const p = sp(f, at, { damping: 13, stiffness: 120 });
  const t = ramp(f, at + 6, 22, INOUT);
  if (f < at) return null;
  return (
    <div style={{ position: 'absolute', left: 56, top: 40, display: 'flex', alignItems: 'center', gap: 14, opacity: 1 - hide }}>
      <div style={{ transform: `scale(${p}) rotate(${(1 - p) * -40}deg)` }}><Leaf size={44} /></div>
      <div style={{ display: 'flex', alignItems: 'center', clipPath: `inset(-20% ${(1 - t) * 100}% -20% 0)`, transform: `translateX(${(1 - t) * -16}px)` }}>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 30, color: C.ink }}>Descarte Certo <span style={{ color: C.brand }}>MS</span></div>
        <div style={{ fontFamily: body, fontWeight: 600, fontSize: 20, color: C.ink2, marginLeft: 22, paddingLeft: 18, borderLeft: `2px solid ${C.line}` }}>Projeto de Extensão · UCDB</div>
      </div>
    </div>
  );
};

/** Indicador discreto de progresso: um segmento por cena. */
const Progress: React.FC<{ bounds: { a: number; b: number }[]; at: number; hide: number }> = ({ bounds, at, hide }) => {
  const f = useCurrentFrame();
  const o = ramp(f, at, 24) * (1 - hide);
  if (o <= 0) return null;
  const x0 = 120, x1 = 1800, gap = 8;
  const segW = (x1 - x0 - gap * (bounds.length - 1)) / bounds.length;
  return (
    <div style={{ position: 'absolute', left: x0, top: 1046, display: 'flex', gap, opacity: o * 0.9 }}>
      {bounds.map((b, i) => {
        const p = interpolate(f, [b.a, b.b], [0, 1], clamp);
        return (
          <div key={i} style={{ width: segW, height: 4, borderRadius: 2, background: C.line, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: p >= 1 ? 'rgba(29,107,60,.55)' : C.brand, transform: `scaleX(${p})`, transformOrigin: '0 50%' }} />
          </div>
        );
      })}
    </div>
  );
};

// Layout padrão: texto à esquerda, mídia à direita
const Split: React.FC<{ left: React.ReactNode; right?: React.ReactNode; leftW?: number; rightW?: number }> = ({ left, right, leftW = 800, rightW }) => (
  <AbsoluteFill>
    <div style={{ position: 'absolute', left: 120, top: 320, width: leftW }}>{left}</div>
    {right && <div style={{ position: 'absolute', right: 120, top: 0, bottom: 0, width: rightW, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{right}</div>}
  </AbsoluteFill>
);

// ── cenas ────────────────────────────────────────────────────────────────
// K('chave') = frame local do cue (T aplica snap + LEAD); endF = frame local do fim da cena.
type Ctx = { K: (key: string) => number; T: (abs: number) => number; dur: number; startF: number; endF: number };
const CARD_W = 760, CARD_H = 900;

// 0 · Abertura — logo desenhado, título palavra a palavra, faixa do tema, lower-third
const Abertura: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const logoAt = c.K('abertura.logo'), titAt = c.K('abertura.titulo'), subAt = c.K('abertura.subtitulo'), temaAt = c.K('abertura.tema'), felAt = c.K('abertura.felipe');
  const lp = sp(f, logoAt, { damping: 11, stiffness: 110 });
  const draw = ramp(f, logoAt + 6, 34, INOUT);
  const tema = sp(f, temaAt, { damping: 20, stiffness: 80 });
  const cam = 1 + 0.035 * interpolate(f, [0, c.endF], [0, 1], clamp);
  const track = ramp(f, subAt, 46);
  const open = ramp(f, temaAt, 22, INOUT);
  const bar = ramp(f, felAt, 14);
  const card = ramp(f, felAt + 6, 22, INOUT);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', transform: `translateY(${mix(66, 0, tema)}px) scale(${cam})` }}>
          <div style={{ display: 'inline-block', opacity: Math.min(1, lp * 2), transform: `scale(${0.3 + 0.7 * lp}) rotate(${(1 - lp) * -30}deg)` }}><Leaf size={104} draw={draw} /></div>
          <Words segs={['Descarte Certo', { t: 'MS', c: 'brand', mark: true }]} at={titAt} stagger={4} markAt={titAt + 26} style={{ ...hs(176), marginTop: 30 }} />
          <div style={{ marginTop: 22, opacity: track, letterSpacing: `${mix(0.4, 0.02, track)}em`, fontFamily: body, fontWeight: 600, fontSize: 46, lineHeight: 1.35, color: C.ink2 }}>Projeto de Extensão · UCDB</div>
          <div style={{ marginTop: 56, display: 'inline-block', position: 'relative', padding: '20px 44px', opacity: f < temaAt ? 0 : 1 }}>
            <div style={{ position: 'absolute', inset: 0, background: C.brand50, border: `2px solid ${C.line}`, borderRadius: 20, transform: `scaleX(${open})` }} />
            <Words segs={['Descarte', { t: 'consciente', c: 'brand' }, 'e', { t: 'correto', c: 'brand' }, 'de resíduos eletrônicos']} at={temaAt + 10} stagger={2} style={{ position: 'relative', fontFamily: display, fontWeight: 600, fontSize: 48, lineHeight: 1.2, color: C.brand900 }} />
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, bottom: 90, display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 10, background: C.brand, borderRadius: 5, transform: `scaleY(${bar})`, transformOrigin: '50% 100%' }} />
        <div style={{ position: 'relative', padding: '16px 34px' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: '0 16px 16px 0', boxShadow: '0 18px 44px -12px rgba(20,38,27,.3)', transform: `scaleX(${card})`, transformOrigin: '0 50%' }} />
          <Words segs="Felipe" at={felAt + 12} style={{ position: 'relative', fontFamily: display, fontWeight: 700, fontSize: 44, lineHeight: 1.2, color: C.ink }} />
          <div style={{ position: 'relative', fontFamily: body, fontWeight: 600, fontSize: 24, color: C.ink2, opacity: ramp(f, felAt + 20, 16), transform: `translateX(${(1 - ramp(f, felAt + 20, 20)) * -12}px)` }}>Apresentação do projeto</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 1 · O problema — disco "descarte" → cartões 3D dos aparelhos → alerta âmbar
const Problema: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const t1 = c.K('problema.titulo.objetivo'), t2 = c.K('problema.titulo.tecnologia'), t3 = c.K('problema.titulo.consequencia');
  const discIn = sp(f, t1 + 8, { damping: 16, stiffness: 70 });
  const discOut = ramp(f, t2 - 4, 16, Easing.in(Easing.cubic));
  const warn = ramp(f, t3 + 4, 24, INOUT);
  const cards = [{ d: I_PHONE, l: 'Celular', k: 'problema.card.celular' }, { d: I_LAPTOP, l: 'Computador', k: 'problema.card.computador' }, { d: I_MONITOR, l: 'Eletrônicos', k: 'problema.card.eletronicos' }];
  const fraseAt = c.K('problema.frase.rapido');
  return (
    <Split
      left={<TitleSwap items={[
        { at: t1, kicker: 'Objetivo', segs: ['Conscientizar e', { t: 'minimizar', c: 'brand', mark: true }, 'o descarte incorreto'], size: 80 },
        { at: t2, kicker: 'O problema', segs: ['A tecnologia avança cada vez mais', { t: 'rápido', c: 'brand', mark: true }], size: 80 },
        { at: t3, kicker: 'A consequência', segs: ['O descarte', { t: 'incorreto', c: 'amber', mark: true }, 'desses equipamentos'], size: 80 },
      ]} />}
      right={
        <div style={{ position: 'relative', width: 760, height: 760 }}>
          {discOut < 1 && (
            <div style={{ position: 'absolute', left: 120, top: 120, width: 520, height: 520, opacity: discIn * (1 - discOut), transform: `scale(${mix(0.7, 1, discIn) * (1 - 0.25 * discOut)})` }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.brand50, border: `2px solid ${C.line}` }} />
              <svg width={520} height={520} viewBox="0 0 520 520" style={{ position: 'absolute', inset: 0, transform: `rotate(${f * 0.25}deg)` }}>
                <circle cx={260} cy={260} r={236} fill="none" stroke={C.brand} strokeWidth={2} strokeDasharray="4 14" opacity={0.5} />
                <circle cx={260} cy={24} r={9} fill={C.lime} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                <DrawIcon els={I_BIN} size={230} draw={ramp(f, t1 + 14, 50, EASE)} sw={1.1} />
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 28, perspective: 1400 }}>
            {cards.map((it) => {
              const at = c.K(it.k);
              const p = sp(f, at, { damping: 13, stiffness: 95 });
              return (
                <div key={it.l} style={{ width: 230, opacity: Math.min(1, p * 3), transform: `translateY(${(1 - p) * 60 + warn * 14}px) rotateY(${(1 - p) * -75}deg) rotateX(${(1 - p) * 12}deg)`, transformOrigin: '0% 50%' }}>
                  <div style={{ background: '#fff', border: `2px solid ${interpolateColors(warn, [0, 1], [C.line, C.amber])}`, borderRadius: 26, padding: '34px 0 26px', textAlign: 'center', boxShadow: `0 ${mix(10, 30, p)}px 60px -30px rgba(20,38,27,${mix(0.15, 0.4, p)})` }}>
                    <div style={{ display: 'grid', placeItems: 'center' }}><DrawIcon els={it.d} size={116} draw={ramp(f, at + 6, 26, EASE)} color={interpolateColors(warn, [0, 1], [C.brand, C.amberInk])} /></div>
                    <div style={{ fontFamily: body, fontWeight: 700, fontSize: 28, color: C.ink, marginTop: 8 }}>{it.l}</div>
                  </div>
                </div>
              );
            })}
            <div style={{ width: '100%', textAlign: 'center', marginTop: 8, transform: `translateY(${warn * 14}px)` }}>
              <Words segs={['trocados cada vez mais', { t: 'rápido', c: 'brand' }]} at={fraseAt} stagger={3} style={{ fontFamily: display, fontWeight: 600, fontSize: 44, lineHeight: 1.3, color: C.ink }} />
            </div>
          </div>
        </div>
      }
    />
  );
};

// 2 · Contaminação — post3 com zoom guiado; o cartão inclina na direção do foco (câmera virtual)
const Contaminacao: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const zk = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => c.K(`contaminacao.zoom.${i}`));
  const keys: FK[] = [
    { f: zk[0], z: 1.0, fx: 0.5, fy: 0.3 },
    { f: zk[1], z: 1.0, fx: 0.5, fy: 0.5 },
    { f: zk[2], z: 1.6, fx: 0.5, fy: 0.46 },
    { f: zk[3], z: 1.6, fx: 0.5, fy: 0.46 },
    { f: zk[4], z: 1.55, fx: 0.3, fy: 0.66 },
    { f: zk[5], z: 1.55, fx: 0.55, fy: 0.66 },
    { f: zk[6], z: 1.8, fx: 0.84, fy: 0.66 },
    { f: zk[7], z: 1.8, fx: 0.84, fy: 0.66 },
  ];
  const z = lerpKeys(keys, f, 'z'), fx = lerpKeys(keys, f, 'fx'), fy = lerpKeys(keys, f, 'fy');
  const enter = sp(f, c.startF - 2, { damping: 18, stiffness: 70 });
  const depth = (z - 1) / 0.8;
  const ry = mix(26, 0, enter) + (fx - 0.5) * -10;
  const rx = (fy - 0.5) * 7;
  return (
    <Split
      left={<TitleSwap items={[
        { at: c.K('contaminacao.titulo.lixo'), kicker: 'Descarte errado', segs: ['Guardados em casa, ou jogados no', { t: 'lixo', c: 'amber', mark: true }, { t: 'comum', c: 'amber', mark: true }], size: 78 },
        { at: c.K('contaminacao.titulo.solo'), kicker: 'No meio ambiente', segs: ['Contaminação do', { t: 'solo', c: 'brand', mark: true }, 'e da', { t: 'água', c: 'brand', mark: true }], size: 80 },
        { at: c.K('contaminacao.titulo.saude'), kicker: 'Saúde e ambiente', segs: ['Substâncias prejudiciais ao meio ambiente e à', { t: 'saúde', c: 'brand', mark: true }, { t: 'humana', c: 'brand', mark: true }], size: 70 },
        { at: c.K('contaminacao.titulo.reciclar'), kicker: 'Desperdício', segs: ['Componentes que poderiam ser', { t: 'reciclados', c: 'brand', mark: true }, { t: 'e', c: 'brand', mark: true }, { t: 'reutilizados', c: 'brand', mark: true }], size: 70 },
      ]} />}
      right={
        <div style={{ perspective: 1800 }}>
          <div style={{ transform: `translateX(${(1 - enter) * 120}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${mix(0.92, 1, enter)})`, opacity: Math.min(1, enter * 2) }}>
            <FocusImg src="post3" ar={1054 / 1492} w={CARD_W} h={CARD_H} keys={keys} shadow={`0 2px 4px rgba(20,38,27,.08), 0 ${40 + depth * 30}px ${80 + depth * 50}px -24px rgba(20,38,27,${0.42 + depth * 0.12})`} />
          </div>
        </div>
      }
    />
  );
};

// 3 · Como conscientizar? — "?" gigante em parallax + três perguntas numa linha do tempo
const Como: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const tAt = c.K('como.titulo');
  const q = [{ k: 'como.q1', n: '1', h: 'O que é o descarte correto' as Seg[] | string }, { k: 'como.q2', n: '2', h: ['Quais os pontos negativos', '\n', 'de não fazê-lo'] as Seg[] }, { k: 'como.q3', n: '3', h: 'Quais as dificuldades da população para descartar corretamente' }].map((x) => ({ ...x, at: c.K(x.k) }));
  const qm = sp(f, tAt, { damping: 20, stiffness: 50 });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 1150, top: 20, fontFamily: display, fontWeight: 700, fontSize: 960, lineHeight: 1, color: 'rgba(29,107,60,.07)', opacity: qm, transform: `translateY(${(1 - qm) * 120 + Math.sin(f / 90) * 10}px) rotate(${mix(-14, 6, qm)}deg)` }}>?</div>
      <Split
        leftW={760}
        left={<>
          <Kicker at={c.K('como.kicker')}>Diante do problema</Kicker>
          <Words segs={['Como', { t: 'conscientizar', c: 'brand', mark: true }, 'a população?']} at={tAt} stagger={4} style={{ ...hs(92), marginTop: 22 }} />
        </>}
        right={
          <div style={{ width: 860, display: 'flex', flexDirection: 'column' }}>
            {q.map((it, i) => {
              const p = sp(f, it.at, { damping: 15, stiffness: 120 });
              const badge = sp(f, it.at + 6, { damping: 8, stiffness: 200, mass: 0.6 });
              const active = ramp(f, it.at, 12) * (i < 2 ? 1 - ramp(f, q[i + 1].at, 14) : 1);
              const line = ramp(f, it.at - 4, 14, INOUT);
              return (
                <div key={it.n} style={{ position: 'relative', marginTop: i ? 26 : 0 }}>
                  {i > 0 && <div style={{ position: 'absolute', left: 74, top: -26, width: 4, height: 26, borderRadius: 2, background: C.brand, transform: `scaleY(${line})`, transformOrigin: '50% 0' }} />}
                  <div style={{ opacity: Math.min(1, p * 2.5), transform: `translateX(${(1 - p) * 90}px) scale(${1 + active * 0.015})`, transformOrigin: '0 50%', display: 'flex', alignItems: 'center', gap: 28, background: '#fff', border: `2px solid ${interpolateColors(active, [0, 1], [C.line, C.brand])}`, borderRadius: 24, padding: '30px 38px', boxShadow: `0 ${mix(30, 40, active)}px 60px -34px rgba(20,38,27,${mix(0.35, 0.55, active)})` }}>
                    <div style={{ flex: '0 0 auto', width: 76, height: 76, borderRadius: 22, background: C.brand, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: display, fontWeight: 700, fontSize: 44, transform: `scale(${badge}) rotate(${(1 - badge) * -60}deg)` }}>{it.n}</div>
                    <Words segs={it.h} at={it.at + 4} stagger={2} style={{ fontFamily: display, fontWeight: 600, fontSize: 44, lineHeight: 1.15, color: C.ink }} />
                  </div>
                </div>
              );
            })}
          </div>
        }
      />
    </AbsoluteFill>
  );
};

// 4 · Formulário — formulário 3D que se preenche → sai → três resultados
const Formulario: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const t1 = c.K('formulario.titulo.formulario'), t2 = c.K('formulario.titulo.resultado');
  const rs = [{ k: 'formulario.r1', h: 'Não sabe da informação' as Seg[] | string }, { k: 'formulario.r2', h: ['Não tem meio de locomoção', '\n', 'até o ponto'] as Seg[] }, { k: 'formulario.r3', h: ['Às vezes nem sabe', '\n', 'onde fica o ponto'] as Seg[] }].map((x) => ({ ...x, at: c.K(x.k) }));
  const fin = sp(f, t1 + 6, { damping: 16, stiffness: 70 });
  const fout = ramp(f, rs[0].at - 24, 20, Easing.in(Easing.cubic));
  const qs = [0.78, 0.62, 0.84, 0.7, 0.56];
  return (
    <Split
      left={<TitleSwap items={[
        { at: t1, kicker: 'Pesquisa', segs: ['Um', { t: 'formulário', c: 'brand', mark: true }, 'para ouvir a população'], size: 84 },
        { at: t2, kicker: 'O que a pesquisa mostrou', segs: ['Por que a maior parte', { t: 'não', c: 'amber', mark: true }, { t: 'descarta', c: 'amber', mark: true }, 'corretamente?'], size: 72 },
      ]} />}
      right={
        <div style={{ position: 'relative', width: 860, height: 820 }}>
          {fout < 1 && (
            <div style={{ position: 'absolute', left: 130, top: 90, perspective: 1600 }}>
              <div style={{ width: 600, borderRadius: 26, background: '#fff', border: `2px solid ${C.line}`, overflow: 'hidden', boxShadow: SHADOW, opacity: Math.min(1, fin * 2) * (1 - fout), transform: `translate(${fout * 140}px, ${(1 - fin) * 90 + Math.sin(f / 45) * 6 - fout * 40}px) rotateY(${mix(-28, -9, fin) - fout * 10}deg) rotateX(${mix(12, 4, fin)}deg) scale(${1 - fout * 0.12})` }}>
                <div style={{ height: 104, background: C.brand, display: 'flex', alignItems: 'center', gap: 18, padding: '0 36px' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: C.lime }} />
                  <div style={{ fontFamily: display, fontWeight: 700, fontSize: 40, color: '#fff' }}>Formulário</div>
                </div>
                <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 30 }}>
                  {qs.map((wq, i) => {
                    const at = t1 + 14 + i * 16;
                    const chk = sp(f, t1 + 60 + i * 26, { damping: 9, stiffness: 220, mass: 0.6 });
                    return (
                      <div key={i}>
                        <div style={{ height: 16, width: `${wq * 100}%`, borderRadius: 8, background: '#dfe6db', transform: `scaleX(${ramp(f, at, 22, INOUT)})`, transformOrigin: '0 50%' }} />
                        <div style={{ display: 'flex', gap: 26, marginTop: 16 }}>
                          {[0, 1, 2].map((o) => (
                            <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: ramp(f, at + 6 + o * 3, 12) }}>
                              <div style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${o === (i % 3) ? C.brand : '#c9d3c5'}`, display: 'grid', placeItems: 'center' }}>
                                {o === (i % 3) && <div style={{ width: 12, height: 12, borderRadius: 6, background: C.brand, transform: `scale(${chk})` }} />}
                              </div>
                              <div style={{ width: 70 + ((i + o) % 3) * 18, height: 10, borderRadius: 5, background: '#e8ede5' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ alignSelf: 'flex-end', width: 150, height: 52, borderRadius: 26, background: C.brand, display: 'grid', placeItems: 'center', transform: `scale(${sp(f, t1 + 60 + qs.length * 26, { damping: 10, stiffness: 180 })})` }}>
                    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ramp(f, t1 + 68 + qs.length * 26, 14, INOUT)} /></svg>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 }}>
            {rs.map((it, i) => {
              const p = sp(f, it.at, { damping: 15, stiffness: 120 });
              const bar = ramp(f, it.at + 2, 18, INOUT);
              return (
                <div key={i} style={{ position: 'relative', opacity: Math.min(1, p * 2.5), transform: `translateX(${(1 - p) * 90}px)`, background: '#fff', borderRadius: 22, padding: '30px 40px 30px 52px', boxShadow: '0 30px 60px -34px rgba(20,38,27,.4)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: C.amber, transform: `scaleY(${bar})`, transformOrigin: '50% 0' }} />
                  <Words segs={it.h} at={it.at + 5} stagger={2} style={{ fontFamily: display, fontWeight: 600, fontSize: 46, lineHeight: 1.15, color: C.ink }} />
                </div>
              );
            })}
          </div>
        </div>
      }
    />
  );
};

// 5 · Campanhas digitais — celular emitindo sinal → vira o mapa (pinos caem) → vira (flip 3D) o post1
const MAP_PINS = [[348, 496], [584, 363], [632, 558], [355, 625], [577, 800]].map(([x, y]) => [x / 990, y / 1400]);
const Campanhas: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const t1 = c.K('campanhas.titulo.midias'), mapAt = c.K('campanhas.mapa'), swap = c.K('campanhas.post1');
  const ph = sp(f, t1 + 10, { damping: 16, stiffness: 80 });
  const morph = ramp(f, mapAt, 28, INOUT);
  const flip = sp(f, swap, { damping: 19, stiffness: 75 });
  const ang = flip * 180;
  const w = mix(340, CARD_W, morph), h = mix(680, CARD_H, morph), r = mix(56, 26, morph), bz = mix(14, 0, morph);
  const iw = w - bz * 2, ih = h - bz * 2;
  const feedOff = (f * 1.4) % 250;
  return (
    <Split
      left={<TitleSwap items={[
        { at: t1, kicker: 'A resposta', segs: ['Campanhas em', { t: 'mídias', c: 'brand', mark: true }, { t: 'digitais', c: 'brand', mark: true }], size: 84 },
        { at: c.K('campanhas.titulo.onde'), kicker: 'Onde', segs: ['Onde ficam os', { t: 'pontos', c: 'brand', mark: true }, { t: 'de', c: 'brand', mark: true }, { t: 'coleta', c: 'brand', mark: true }], size: 84 },
        { at: swap, kicker: 'Por quê', segs: ['Por que levar os resíduos até lá, e os', { t: 'malefícios', c: 'amber', mark: true }, 'para a comunidade'], size: 66 },
      ]} />}
      right={
        <div style={{ position: 'relative', width: CARD_W, height: CARD_H, display: 'grid', placeItems: 'center', perspective: 2200 }}>
          {morph < 1 && [0, 1, 2].map((i) => {
            const k = ((f - t1 + i * 28) % 84) / 84;
            if (f < t1 + 20) return null;
            return <div key={i} style={{ position: 'absolute', left: CARD_W / 2 - 200, top: CARD_H / 2 - 200, width: 400, height: 400, borderRadius: '50%', border: `3px solid ${C.brand}`, opacity: (1 - k) * 0.35 * (1 - morph) * ph, transform: `scale(${0.9 + k * 1.1})` }} />;
          })}
          <div style={{ width: w, height: h, position: 'relative', opacity: Math.min(1, ph * 2), transform: `translateY(${(1 - ph) * 80}px) rotateY(${ang}deg)`, transformStyle: 'preserve-3d' }}>
            {ang <= 90 ? (
              <div style={{ position: 'absolute', inset: 0, borderRadius: r, background: C.brand900, padding: bz, boxShadow: SHADOW }}>
                <div style={{ width: iw, height: ih, borderRadius: Math.max(r - bz, 8), overflow: 'hidden', position: 'relative', background: C.paper }}>
                  {morph < 1 && (
                    <div style={{ position: 'absolute', inset: 0, opacity: 1 - morph }}>
                      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64, background: '#fff', borderBottom: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', zIndex: 1 }}>
                        <Leaf size={30} /><div style={{ height: 10, width: 120, borderRadius: 5, background: '#dfe6db' }} />
                      </div>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} style={{ position: 'absolute', left: 20, right: 20, top: 84 + i * 250 - feedOff, height: 230, borderRadius: 18, background: '#fff', border: `2px solid ${C.line}`, overflow: 'hidden' }}>
                          <div style={{ height: 150, background: i % 2 ? C.brand50 : 'rgba(184,224,122,.45)' }} />
                          <div style={{ margin: '16px 18px 0', height: 12, width: '70%', borderRadius: 6, background: '#dfe6db' }} />
                          <div style={{ margin: '10px 18px 0', height: 12, width: '45%', borderRadius: 6, background: '#e8ede5' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {morph > 0 && (
                    <div style={{ position: 'absolute', inset: 0, opacity: morph }}>
                      <FocusImg src="mapa" ar={990 / 1400} w={iw} h={ih} radius={0} shadow={false} keys={[{ f: mapAt, z: 1.0, fx: 0.5, fy: 0.3 }, { f: swap, z: 1.06, fx: 0.5, fy: 0.4 }]}
                        overlay={MAP_PINS.map(([x, y], i) => (
                          <div key={i} style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, transform: 'translateY(-15px)' }}><DropPin at={mapAt + 22 + i * 5} size={40} /></div>
                        ))} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)' }}>
                <FocusImg src="post1" ar={1055 / 1492} w={CARD_W} h={CARD_H} keys={[{ f: swap, z: 1.0, fx: 0.5, fy: 0.25 }, { f: swap + 120, z: 1.0, fx: 0.5, fy: 0.55 }]} />
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};

// 6 · Slogan — duas linhas cinéticas, marca-texto em "consciência", brilho; post2 gira para a frente
const Star: React.FC<{ x: number; y: number; at: number; size: number }> = ({ x, y, at, size }) => {
  const f = useCurrentFrame();
  const p = ramp(f, at, 26, EASE);
  const sc = Math.sin(p * Math.PI);
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `scale(${sc}) rotate(${p * 90}deg)` }}>
      <path d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10Z" fill={C.lime} stroke={C.brand} strokeWidth={0.8} />
    </svg>
  );
};
const Slogan: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const l2 = c.K('slogan.linha2');
  const enter = sp(f, c.startF - 2, { damping: 17, stiffness: 70 });
  return (
    <Split
      leftW={860}
      left={<>
        <Kicker at={c.K('slogan.kicker')}>Slogan da campanha</Kicker>
        <Words segs="Tecnologia evolui." at={c.K('slogan.linha1')} stagger={5} style={{ ...hs(104), marginTop: 22 }} />
        <div style={{ position: 'relative' }}>
          <Words segs={['Sua', { t: 'consciência', mark: true }, 'também.']} at={l2} stagger={5} markAt={l2 + 18} style={{ ...hs(104, C.brand), marginTop: 6 }} />
          <Star x={846} y={2} at={l2 + 26} size={46} />
          <Star x={890} y={64} at={l2 + 32} size={28} />
          <Star x={-26} y={40} at={l2 + 36} size={24} />
        </div>
      </>}
      right={
        <div style={{ perspective: 1800 }}>
          <div style={{ transform: `translateX(${(1 - enter) * 140}px) rotateY(${mix(30, -5, enter)}deg) rotateX(2deg)`, opacity: Math.min(1, enter * 2) }}>
            <FocusImg src="post2" ar={1216 / 1294} w={820} h={870} keys={[{ f: c.startF, z: 1.15, fx: 0.4, fy: 0.12 }, { f: c.K('slogan.zoom.fim'), z: 1.0, fx: 0.5, fy: 0.5 }]} />
          </div>
        </div>
      }
    />
  );
};

// 7 · Posts nas redes — três posts abrem em leque; pílulas com mola
const Posts: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const cards = [{ s: 'post1', ar: 1055 / 1492, k: 'posts.card.post1' }, { s: 'post2', ar: 1216 / 1294, k: 'posts.card.post2' }, { s: 'post3', ar: 1054 / 1492, k: 'posts.card.post3' }];
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 150 }}>
        <Kicker at={c.K('posts.kicker')}>Posts</Kicker>
        <Words segs={['Criamos', { t: 'posts', c: 'brand', mark: true }, 'para as redes']} at={c.K('posts.titulo')} stagger={3} style={{ ...hs(80), marginTop: 18 }} />
        <div style={{ display: 'flex', gap: 18, marginTop: 34 }}>
          <Pill at={c.K('posts.chip.instagram')}>Instagram</Pill><Pill at={c.K('posts.chip.facebook')}>Facebook</Pill><Pill at={c.K('posts.chip.whatsapp')}>Grupos de WhatsApp</Pill>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 104, display: 'flex', justifyContent: 'center', gap: 40 }}>
        {cards.map((p, i) => {
          const e = sp(f, c.K(p.k), { damping: 14, stiffness: 90 });
          const rot = (i - 1) * mix(16, 3.5, e);
          const float = Math.sin(f / 50 + i * 1.7) * 5 * e;
          return (
            <div key={p.s} style={{ opacity: Math.min(1, e * 3), transform: `translateY(${(1 - e) * 460 + (i === 1 ? 0 : 12) + float}px) rotate(${rot}deg)`, transformOrigin: '50% 120%' }}>
              <FocusImg src={p.s} ar={p.ar} w={440} h={520} keys={[{ f: 0, z: 1, fx: 0.5, fy: 0.3 }, { f: c.endF, z: 1.04, fx: 0.5, fy: 0.5 }]} radius={22} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 8 · Panfletos — fotos "impressas" caem e assentam como num mural, com fita
const Panfletos: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const ph = [{ s: 'pilar', k: 'panfletos.foto.pilar', fy: 0.4, r: -2.5 }, { s: 'parede', k: 'panfletos.foto.parede', fy: 0.3, r: 1.8 }, { s: 'geladeira', k: 'panfletos.foto.geladeira', fy: 0.3, r: 2.2 }, { s: 'mao', k: 'panfletos.foto.mao', fy: 0.55, r: -1.6 }];
  return (
    <Split
      leftW={700}
      left={<>
        <Kicker at={c.K('panfletos.kicker')}>Mundo real</Kicker>
        <Words segs={['Panfletos em lugares', { t: 'estratégicos', c: 'brand', mark: true }]} at={c.K('panfletos.titulo')} stagger={4} style={{ ...hs(92), marginTop: 22 }} />
      </>}
      right={
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 360px)', gap: 30 }}>
          {ph.map((p, i) => {
            const at = c.K(p.k);
            const e = sp(f, at, { damping: 14, stiffness: 140 });
            const tape = ramp(f, at + 8, 10);
            return (
              <div key={p.s} style={{ position: 'relative', opacity: Math.min(1, e * 3), transform: `translateY(${(1 - e) * -50}px) scale(${mix(1.22, 1, e)}) rotate(${p.r + (1 - e) * (i % 2 ? 9 : -9)}deg)` }}>
                <div style={{ background: '#fff', padding: 10, borderRadius: 14, boxShadow: `0 ${mix(60, 26, e)}px ${mix(90, 50, e)}px -26px rgba(20,38,27,.45)` }}>
                  <FocusImg src={p.s} ar={3 / 4} w={340} h={410} radius={8} shadow={false} keys={[{ f: 0, z: 1.0, fx: 0.5, fy: p.fy }, { f: c.endF, z: 1.12, fx: 0.5, fy: p.fy }]} />
                </div>
                <div style={{ position: 'absolute', left: '50%', top: -14, width: 120, height: 32, marginLeft: -60, background: 'rgba(184,224,122,.78)', transform: `rotate(${i % 2 ? 4 : -4}deg) scaleX(${tape})`, borderRadius: 3 }} />
              </div>
            );
          })}
        </div>
      }
    />
  );
};

// 9 · Pontos de coleta — fotos reveladas por máscara vertical com parallax interno; pino cai sobre cada uma
const Coleta: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  return (
    <Split
      leftW={760}
      left={<>
        <Kicker at={c.K('coleta.kicker')}>E também</Kicker>
        <Words segs={['Criamos', { t: 'pontos', c: 'brand', mark: true }, { t: 'de', c: 'brand', mark: true }, { t: 'coleta', c: 'brand', mark: true }, 'em alguns lugares']} at={c.K('coleta.titulo')} stagger={3} style={{ ...hs(96), marginTop: 22 }} />
      </>}
      right={
        <div style={{ display: 'flex', gap: 30 }}>
          {[{ s: 'caixa1', k: 'coleta.foto.caixa1' }, { s: 'caixa2', k: 'coleta.foto.caixa2' }].map((p) => {
            const at = c.K(p.k);
            const rv = ramp(f, at, 26, INOUT);
            return (
              <div key={p.s} style={{ position: 'relative', width: 420, height: 760 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 22, boxShadow: SHADOW, opacity: rv }} />
                <div style={{ position: 'absolute', inset: 0, clipPath: rv < 1 ? `inset(${(1 - rv) * 100}% 0 0 0 round 22px)` : undefined }}>
                  <FocusImg src={p.s} ar={1086 / 1448} w={420} h={760} radius={22} shadow={false} inner={`translateY(${(1 - rv) * 90}px) scale(${1 + (1 - rv) * 0.12})`} keys={[{ f: 0, z: 1.0, fx: 0.5, fy: 0.62 }, { f: c.endF, z: 1.1, fx: 0.5, fy: 0.68 }]} />
                </div>
                <div style={{ position: 'absolute', left: 210, top: -8 }}><DropPin at={at + 20} size={58} /></div>
              </div>
            );
          })}
        </div>
      }
    />
  );
};

// 10 · Meta — odômetro de dígitos 100 / 200, traço desenhado, linhas finais com respiro
const Digit: React.FC<{ d: number; at: number; spins: number; size: number }> = ({ d, at, spins, size }) => {
  const f = useCurrentFrame();
  const target = d + 10 * spins;
  const p = interpolate(f, [at, at + 12 + spins * 4], [0, 1], { ...clamp, easing: Easing.bezier(0.25, 0.8, 0.3, 1) });
  const lh = size * 1.02;
  return (
    <span style={{ position: 'relative', display: 'inline-block', height: lh, overflow: 'hidden', verticalAlign: 'top', WebkitMaskImage: p < 1 ? 'linear-gradient(transparent, #000 16%, #000 84%, transparent)' : undefined }}>
      <span style={{ visibility: 'hidden', lineHeight: `${lh}px` }}>{d}</span>
      <span style={{ position: 'absolute', left: '50%', top: 0, transform: `translate(-50%, ${-p * target * lh}px)` }}>
        {Array.from({ length: target + 1 }, (_, i) => <span key={i} style={{ display: 'block', height: lh, lineHeight: `${lh}px`, textAlign: 'center' }}>{i % 10}</span>)}
      </span>
    </span>
  );
};
const Odometer: React.FC<{ value: string; at: number; size: number }> = ({ value, at, size }) => {
  const f = useCurrentFrame();
  const o = ramp(f, at, 8);
  return (
    <span style={{ ...hs(size, C.brand), display: 'inline-flex', opacity: o, letterSpacing: -size * 0.03 }}>
      {value.split('').map((ch, i) => <Digit key={i} d={Number(ch)} at={at + i * 2} spins={1 + i} size={size} />)}
    </span>
  );
};
const Meta: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const n1 = c.K('meta.num100'), n2 = c.K('meta.num200');
  const land = n2 + 28;
  const glow = sp(f, n1, { damping: 20, stiffness: 40 });
  const swash = ramp(f, land - 4, 26, INOUT);
  const punch = 1 + 0.04 * Math.sin(Math.PI * ramp(f, land - 2, 14, EASE));
  const cam = 1 + 0.03 * interpolate(f, [land, c.endF], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', left: W / 2 - 650, top: H / 2 - 560, width: 1300, height: 1000, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(184,224,122,.42), rgba(184,224,122,0))', opacity: glow, transform: `scale(${mix(0.5, 1, glow)})` }} />
      <div style={{ textAlign: 'center', position: 'relative', transform: `scale(${cam})` }}>
        <div style={{ display: 'inline-block' }}><Kicker at={c.K('meta.kicker')}>Nossa proposta</Kicker></div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 14, transform: `scale(${punch})` }}>
          <Odometer value="100" at={n1} size={290} />
          <div style={{ fontFamily: display, fontWeight: 600, fontSize: 64, color: C.ink2, opacity: ramp(f, c.K('meta.a'), 12), transform: `translateY(${(1 - ramp(f, c.K('meta.a'), 16)) * 20}px)` }}>a</div>
          <Odometer value="200" at={n2} size={290} />
          <svg width={980} height={60} viewBox="0 0 980 60" style={{ position: 'absolute', left: '50%', bottom: -28, marginLeft: -490 }}>
            <path d="M10 40 C 220 12, 520 8, 970 30" fill="none" stroke={C.lime} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - swash} />
          </svg>
        </div>
        <Words segs="pessoas alcançadas" at={c.K('meta.pessoas')} stagger={4} style={{ ...hs(74), marginTop: 34 }} />
        <Words segs={['incentivando hábitos', { t: 'sustentáveis', c: 'brand', mark: true }]} at={c.K('meta.linha.sustentaveis')} stagger={3} style={{ fontFamily: body, fontWeight: 600, fontSize: 46, lineHeight: 1.35, color: C.ink, marginTop: 34 }} />
        <Words segs="e passando a informação para frente" at={c.K('meta.linha.frente')} stagger={3} style={{ fontFamily: body, fontWeight: 600, fontSize: 46, lineHeight: 1.35, color: C.ink, marginTop: 8 }} />
      </div>
    </AbsoluteFill>
  );
};

// 11 · Passagem ao site — navegador 3D, rolagem guiada com destaques, empurrão final até tela cheia
const BR_W = 880, BR_BAR = 52, BR_VH = 495; // área de conteúdo 16:9 → no fim ocupa 1920×1080
const BR_X = W - 120 - BR_W, BR_Y = Math.round((H - BR_BAR - BR_VH) / 2);
const PAGE_H = BR_W * (2513 / 1920);
const RING = (x: number, y: number, w: number, h: number, draw: number) => (
  <svg style={{ position: 'absolute', left: x - 8, top: y - 8, overflow: 'visible' }} width={w + 16} height={h + 16}>
    <rect x={2} y={2} width={w + 12} height={h + 12} rx={12} fill="rgba(184,224,122,.18)" fillOpacity={draw} stroke={C.brand} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
  </svg>
);
const Site: React.FC<{ c: Ctx }> = ({ c }) => {
  const f = useCurrentFrame();
  const bAt = c.K('site.browser'), ch1 = c.K('site.chip.pontos'), ch2 = c.K('site.chip.materiais'), next = c.K('site.aseguir'), push = c.K('site.pushin');
  const e = sp(f, bAt, { damping: 18, stiffness: 60 });
  const scrollDown = ramp(f, ch1 - 16, 34, INOUT), scrollUp = ramp(f, next + 6, 34, INOUT);
  const scroll = 560 * scrollDown * (1 - scrollUp);
  const pp = ramp(f, push, 40, Easing.bezier(0.65, 0, 0.2, 1));
  const sc = mix(1, W / BR_W, pp);
  const tx = mix(0, -BR_X, pp), ty = mix(0, -BR_Y - BR_BAR * (W / BR_W), pp);
  const ry = mix(-24, -9, e) * (1 - pp), rx = mix(20, 3, e) * (1 - pp);
  const r1 = ramp(f, ch1 + 6, 22, INOUT) * (1 - scrollUp), r2 = ramp(f, ch2 + 6, 22, INOUT) * (1 - scrollUp);
  const k = BR_W / 1680; // coordenadas medidas na captura reduzida (1680 px de largura)
  const arrow = ramp(f, next + 8, 18, INOUT);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 320, width: 700, opacity: 1 - ramp(f, push, 16, EASE), transform: `translateX(${-ramp(f, push, 24, Easing.in(Easing.cubic)) * 80}px)` }}>
        <Kicker at={c.K('site.kicker')}>Desenvolvemos também</Kicker>
        <Words segs={['Um', { t: 'site', c: 'brand', mark: true }, 'para a população']} at={c.K('site.titulo')} stagger={4} style={{ ...hs(92), marginTop: 22 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 44, alignItems: 'flex-start' }}>
          <Pill at={ch1}>Cada ponto de descarte</Pill>
          <Pill at={ch2}>Quais materiais descartar</Pill>
        </div>
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 16, fontFamily: body, fontWeight: 700, fontSize: 30, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.brand, opacity: ramp(f, next, 12), transform: `translateY(${(1 - ramp(f, next, 18)) * 16}px)` }}>
          A seguir
          <svg width={64} height={24} viewBox="0 0 64 24"><path d="M2 12H58M48 3l10 9-10 9" fill="none" stroke={C.brand} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arrow} /></svg>
          o site
        </div>
      </div>
      <div style={{ position: 'absolute', left: BR_X, top: BR_Y, width: BR_W, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})` }}>
        <div style={{ opacity: Math.min(1, e * 2.5), transform: `perspective(1800px) translateY(${(1 - e) * 120}px) rotateY(${ry}deg) rotateX(${rx}deg)`, borderRadius: mix(22, 0, pp), overflow: 'hidden', background: '#fff', boxShadow: `0 2px 4px rgba(20,38,27,.1), 0 50px 90px -30px rgba(20,38,27,${0.55 * (1 - pp)})`, outline: `2px solid rgba(221,227,217,${1 - pp})` }}>
          <div style={{ height: BR_BAR, background: '#eef0ea', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', borderBottom: `2px solid ${C.line}` }}>
            {['#e57373', '#e0b04a', '#7cc47f'].map((cl) => <div key={cl} style={{ width: 14, height: 14, borderRadius: 7, background: cl }} />)}
            <div style={{ marginLeft: 18, flex: 1, height: 30, borderRadius: 15, background: '#fff', fontFamily: body, fontWeight: 600, fontSize: 18, color: C.ink2, display: 'flex', alignItems: 'center', padding: '0 16px' }}>Descarte Certo MS</div>
          </div>
          <div style={{ width: BR_W, height: BR_VH, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: BR_W, height: PAGE_H, transform: `translateY(${-scroll}px)` }}>
              <Img src={staticFile('tex/a0.png')} style={{ position: 'absolute', inset: 0, width: BR_W, height: PAGE_H }} />
              {r1 > 0 && RING(315 * k, 1318 * k, 515 * k, 84 * k, r1)}
              {r2 > 0 && RING(848 * k, 1318 * k, 516 * k, 84 * k, r2)}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── roteiro (início de cada cena vem de cues.json: "cena.<id>.start"; o fim é o início da próxima) ──
type Trans = 'slice' | 'iris';
const DEFS: { id: string; tr: Trans; C: React.FC<{ c: Ctx }> }[] = [
  { id: 'abertura', tr: 'slice', C: Abertura },
  { id: 'problema', tr: 'slice', C: Problema },
  { id: 'contaminacao', tr: 'slice', C: Contaminacao },
  { id: 'como', tr: 'slice', C: Como },
  { id: 'formulario', tr: 'slice', C: Formulario },
  { id: 'campanhas', tr: 'slice', C: Campanhas },
  { id: 'slogan', tr: 'slice', C: Slogan },
  { id: 'posts', tr: 'slice', C: Posts },
  { id: 'panfletos', tr: 'slice', C: Panfletos },
  { id: 'coleta', tr: 'slice', C: Coleta },
  { id: 'meta', tr: 'iris', C: Meta },
  { id: 'site', tr: 'slice', C: Site },
];
const SCENES = DEFS.map((d, i) => ({ ...d, start: cue(`cena.${d.id}.start`), end: i + 1 < DEFS.length ? cue(`cena.${DEFS[i + 1].id}.start`) : INTRO_SECONDS }));

// ── transições: corte diagonal com faixa verde/lima (slice) ou íris circular (iris) ──
const SLANT = 260, BAND = 56, IRIS = { x: W / 2, y: H * 0.46, r: 1180 };
const edge = (p: number) => { const top = (W + SLANT + BAND) * (1 - p) - BAND; return { top, bot: top - SLANT }; };

const SceneWrap: React.FC<{ dur: number; inV: Trans | null; outV: Trans | null; children: React.ReactNode }> = ({ dur, inV, outV, children }) => {
  const f = useCurrentFrame();
  const pin = inV ? interpolate(f, [0, 2 * PAD], [0, 1], { ...clamp, easing: INOUT }) : 1;
  const pout = outV ? interpolate(f, [dur - 2 * PAD, dur], [0, 1], { ...clamp, easing: INOUT }) : 0;
  let clip: string | undefined;
  let tx = 0, sc = 1;
  if (pin < 1 && inV) {
    if (inV === 'slice') { const e = edge(pin); clip = `polygon(${e.top}px 0, ${W}px 0, ${W}px ${H}px, ${e.bot}px ${H}px)`; tx = (1 - pin) * 160; }
    else { clip = `circle(${(pin * IRIS.r).toFixed(1)}px at ${IRIS.x}px ${IRIS.y}px)`; sc = 1.08 - 0.08 * pin; }
  } else if (pout > 0 && outV) {
    if (outV === 'slice') { const e = edge(pout); clip = `polygon(0 0, ${e.top}px 0, ${e.bot}px ${H}px, 0 ${H}px)`; tx = -pout * 160; }
    else { const r = (pout * IRIS.r).toFixed(1); clip = `path(evenodd, 'M0 0H${W}V${H}H0Z M${IRIS.x - Number(r)} ${IRIS.y} a${r} ${r} 0 1 0 ${2 * Number(r)} 0 a${r} ${r} 0 1 0 ${-2 * Number(r)} 0Z')`; sc = 1 - 0.06 * pout; }
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: clip }}>
        <AbsoluteFill style={{ transform: tx || sc !== 1 ? `translateX(${tx}px) scale(${sc})` : undefined }}>{children}</AbsoluteFill>
      </AbsoluteFill>
      {inV && pin > 0 && pin < 1 && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {inV === 'slice' ? (() => {
            const e = edge(pin);
            return <>
              <polygon points={`${e.top},0 ${e.top + BAND},0 ${e.bot + BAND},${H} ${e.bot},${H}`} fill={C.brand} />
              <polygon points={`${e.top - 10},0 ${e.top},0 ${e.bot},${H} ${e.bot - 10},${H}`} fill={C.lime} />
            </>;
          })() : <circle cx={IRIS.x} cy={IRIS.y} r={pin * IRIS.r} fill="none" stroke={C.lime} strokeWidth={14} opacity={Math.sin(pin * Math.PI)} />}
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const pushF = s(cueTime(cue('site.pushin')));
  const hide = ramp(frame, pushF, 14, EASE);
  const chipAt = s(SCENES[1].start) - 2;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Bg />
      {SCENES.map((sc, i) => {
        const from = Math.max(0, s(sc.start) - PAD);
        const dur = (i === SCENES.length - 1 ? INTRO_DURATION : s(sc.end) + PAD) - from;
        const T = (abs: number) => s(cueTime(abs)) - from;
        const ctx: Ctx = { T, K: (k: string) => T(cue(k)), dur, startF: s(sc.start) - from, endF: s(sc.end) - from };
        return (
          <Sequence key={sc.id} from={from} durationInFrames={dur}>
            <SceneWrap dur={dur} inV={i === 0 ? null : sc.tr} outV={i === SCENES.length - 1 ? null : SCENES[i + 1].tr}><sc.C c={ctx} /></SceneWrap>
          </Sequence>
        );
      })}
      <BrandChip at={chipAt} hide={hide} />
      <Progress bounds={SCENES.map((sc) => ({ a: s(sc.start), b: s(sc.end) }))} at={chipAt} hide={hide} />
      <Audio src={staticFile('intro/mix.wav')} />
    </AbsoluteFill>
  );
};
