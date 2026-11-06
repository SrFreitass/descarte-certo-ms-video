import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadDisplay } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadBody } from '@remotion/google-fonts/PlusJakartaSans';
import { PageCam } from './PageCam';
import { Cursor } from './Cursor';
import { pageH, Scene } from './scenes';
import { FPS, FINAL_SECONDS, FINAL_DURATION, OVERLAP, STARTS, PAGE_SCENES, PAGE_STARTS } from './finalScenes';
import participants from './participants.json';

const display = loadDisplay('normal', { weights: ['600', '700'], subsets: ['latin', 'latin-ext'] }).fontFamily;
const body = loadBody('normal', { weights: ['500', '600', '700'], subsets: ['latin', 'latin-ext'] }).fontFamily;
const C = { paper: '#f6f4ee', ink: '#14261b', ink2: '#4a5d51', brand: '#1d6b3c', brand900: '#0f3b24', brand50: '#e8f3ea', lime: '#b8e07a', amber: '#e0a13a', line: '#dde3d9' };
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const EASE = Easing.bezier(0.25, 0.46, 0.45, 0.94);
const fr = (abs: number, start: number) => Math.round((abs - start) * FPS);

const Caption: React.FC<{ from: number; to: number; text: string }> = ({ from, to, text }) => {
  const f = useCurrentFrame();
  const inT = interpolate(f, [from, from + 14], [0, 1], { ...clamp, easing: EASE });
  const outT = interpolate(f, [to - 10, to], [1, 0], clamp);
  const o = Math.min(inT, outT);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 60, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - inT) * 18}px)` }}>
      <div style={{ background: '#fff', border: `1.5px solid ${C.line}`, borderLeft: `10px solid ${C.brand}`, borderRadius: 18, padding: '20px 38px', boxShadow: '0 18px 44px -12px rgba(20,38,27,0.35)', fontFamily: display, fontWeight: 600, fontSize: 44, color: C.ink, letterSpacing: -0.4 }}>{text}</div>
    </div>
  );
};

const PageScene: React.FC<{ scene: Scene; first: boolean }> = ({ scene, first }) => {
  const f = useCurrentFrame();
  const tex = scene.states.filter(([from]) => f >= from).pop()![1];
  const fade = first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade, background: C.paper }}>
      <PageCam src={`tex/${tex}.png`} pageH={pageH(tex)} keys={scene.keys}>
        {(scene.overlays ?? []).map((o) => {
          const a = interpolate(f, [o.from, o.from + 8], [0, 1], clamp);
          const b = interpolate(f, [o.to - 8, o.to], [1, 0], clamp);
          const op = Math.min(a, b);
          if (op <= 0) return null;
          return (
            <div key={o.tex} style={{ position: 'absolute', left: 0, top: o.top, width: 1920, height: 1080, opacity: op, transform: `scale(${0.985 + 0.015 * op})` }}>
              <Img src={staticFile(`tex/${o.tex}.png`)} style={{ width: 1920, height: 1080 }} />
            </div>
          );
        })}
        <Cursor way={scene.way} clicks={scene.clicks} appearAt={scene.appearAt ?? -100} />
      </PageCam>
      {scene.caps.map((c) => <Caption key={c.from} {...c} />)}
    </AbsoluteFill>
  );
};

// ── Recap: "panfletos, criação do site, divulgação em grupos de WhatsApp, conversa com especialistas" ──
const Recap: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (abs: number) => fr(abs, STARTS.recap);
  const head = (at: number) => interpolate(f, [at, at + 18], [0, 1], { ...clamp, easing: EASE });
  const items = [
    { at: 106.7, label: 'Panfletos', img: <Img src={staticFile('intro/pilar.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 38%' }} /> },
    { at: 107.4, label: 'Criação do site', img: <Img src={staticFile('tex/a0.png')} style={{ position: 'absolute', left: -60, top: -10, width: 900, height: 900 * (5026 / 3840) }} /> },
    { at: 108.6, label: 'Divulgação em grupos de WhatsApp', img: <Img src={staticFile('intro/post1.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%' }} /> },
    { at: 110.6, label: 'Conversa com pessoas especializadas', img: (
      <div style={{ width: '100%', height: '100%', background: C.brand50, display: 'grid', placeItems: 'center' }}>
        <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke={C.brand} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h8A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3 2.5V13h-.5A2.5 2.5 0 0 1 3 10.5Z" />
          <path d="M18 9.5h.5A2.5 2.5 0 0 1 21 12v3.5a2.5 2.5 0 0 1-2.5 2.5H18v2.5L15 18h-3.5A2.5 2.5 0 0 1 9 16" />
        </svg>
      </div>) },
  ];
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: 'absolute', left: 120, top: 150, opacity: head(t(101.7)), transform: `translateY(${(1 - head(t(101.7))) * 24}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: body, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.brand }}>
          <span style={{ width: 38, height: 3, background: C.brand, borderRadius: 2 }} />Finalizamos
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 92, lineHeight: 1.04, letterSpacing: -1.8, color: C.ink, marginTop: 20 }}>
          Tudo o que fizemos <span style={{ color: C.brand }}>até agora</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 400, display: 'flex', gap: 40 }}>
        {items.map((it) => {
          const s = spring({ frame: f - t(it.at), fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
          const o = interpolate(f, [t(it.at), t(it.at) + 10], [0, 1], clamp);
          return (
            <div key={it.label} style={{ flex: 1, opacity: o, transform: `translateY(${(1 - s) * 90}px) rotate(${(1 - s) * 3}deg)` }}>
              <div style={{ height: 330, borderRadius: 24, overflow: 'hidden', position: 'relative', background: '#fff', boxShadow: '0 2px 4px rgba(20,38,27,.08), 0 40px 70px -26px rgba(20,38,27,.45)' }}>{it.img}</div>
              <div style={{ fontFamily: display, fontWeight: 600, fontSize: 38, lineHeight: 1.15, color: C.ink, marginTop: 24 }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Créditos: "obrigado… segue aqui a lista dos participantes" ──
const Credits: React.FC = () => {
  const f = useCurrentFrame();
  const t = (abs: number) => fr(abs, STARTS.credits);
  const show = (at: number, d = 22) => interpolate(f, [at, at + d], [0, 1], { ...clamp, easing: EASE });
  const bg = interpolate(f, [0, OVERLAP * 2], [0, 1], clamp);
  const list = participants as (string | { name: string; role?: string })[];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 70% 20%, #1d6b3c 0%, ${C.brand900} 70%)`, opacity: bg, color: '#fff' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: list.length ? 120 : 330, textAlign: 'center' }}>
        <div style={{ fontFamily: body, fontWeight: 600, fontSize: 28, opacity: show(t(113.3)), background: 'rgba(255,255,255,0.12)', color: C.lime, padding: '10px 24px', borderRadius: 999, display: 'inline-block' }}>Projeto de Extensão · UCDB</div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: list.length ? 130 : 170, lineHeight: 1.05, marginTop: 28, opacity: show(t(113.6)), transform: `translateY(${(1 - show(t(113.6))) * 24}px)`, letterSpacing: -3 }}>
          Obrigado<span style={{ color: C.lime }}>!</span>
        </div>
        <div style={{ fontFamily: body, fontWeight: 500, fontSize: 40, marginTop: 14, opacity: show(t(114.4)) * 0.95 }}>Descarte Certo MS</div>
      </div>
      {list.length > 0 && (
        <div style={{ position: 'absolute', left: 260, right: 260, top: 520, opacity: show(t(115.6)) }}>
          <div style={{ fontFamily: body, fontWeight: 700, fontSize: 24, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.lime, textAlign: 'center', marginBottom: 28 }}>Participantes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 60px' }}>
            {list.map((p, i) => {
              const name = typeof p === 'string' ? p : p.name;
              const role = typeof p === 'string' ? '' : p.role ?? '';
              return (
                <div key={i} style={{ opacity: show(t(116.6 + i * 0.18), 14), transform: `translateY(${(1 - show(t(116.6 + i * 0.18), 14)) * 14}px)`, fontFamily: display, fontWeight: 600, fontSize: 40 }}>
                  {name}{role && <span style={{ fontFamily: body, fontWeight: 500, fontSize: 24, color: C.lime, marginLeft: 14 }}>{role}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Final: React.FC = () => {
  const items: { from: number; dur: number; node: React.ReactNode }[] = [];
  PAGE_SCENES.forEach((s, i) => items.push({ from: Math.round(PAGE_STARTS[i] * FPS), dur: s.dur, node: <PageScene scene={s} first={i === 0} /> }));
  items.push({ from: Math.round(STARTS.recap * FPS), dur: Math.round((STARTS.credits - STARTS.recap) * FPS) + OVERLAP, node: <Fade><Recap /></Fade> });
  items.push({ from: Math.round(STARTS.credits * FPS), dur: FINAL_DURATION - Math.round(STARTS.credits * FPS), node: <Credits /> });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {items.map((it, i) => <Sequence key={i} from={it.from} durationInFrames={it.dur}>{it.node}</Sequence>)}
      <Audio src={staticFile('final/mix.wav')} />
    </AbsoluteFill>
  );
};

const Fade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, OVERLAP], [0, 1], clamp) }}>{children}</AbsoluteFill>;
};
export const FINAL_AUDIO_SECONDS = FINAL_SECONDS;
