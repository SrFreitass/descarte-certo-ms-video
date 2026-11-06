import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { loadFont as loadDisplay } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadBody } from '@remotion/google-fonts/PlusJakartaSans';
import { PageCam } from './PageCam';
import { Cursor } from './Cursor';
import { SCENES, END_DUR, OVERLAP, DURATION as TOTAL, sceneStart, pageH, Scene } from './scenes';

const display = loadDisplay('normal', { weights: ['600', '700'], subsets: ['latin', 'latin-ext'] }).fontFamily;
const body = loadBody('normal', { weights: ['500', '600'], subsets: ['latin', 'latin-ext'] }).fontFamily;

// Tokens do site novo (assets/css/style.css)
const C = { brand: '#1d6b3c', brand900: '#0f3b24', lime: '#b8e07a', paper: '#f6f4ee', ink: '#14261b', line: '#dde3d9' };

export const DURATION = TOTAL;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Caption: React.FC<{ from: number; to: number; text: string }> = ({ from, to, text }) => {
  const f = useCurrentFrame();
  const inT = interpolate(f, [from, from + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) });
  const outT = interpolate(f, [to - 10, to], [1, 0], clamp);
  const o = Math.min(inT, outT);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 60, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - inT) * 18}px)` }}>
      <div style={{ background: '#fff', border: `1.5px solid ${C.line}`, borderLeft: `10px solid ${C.brand}`, borderRadius: 18, padding: '20px 38px', boxShadow: '0 18px 44px -12px rgba(20,38,27,0.35)', fontFamily: display, fontWeight: 600, fontSize: 44, color: C.ink, letterSpacing: -0.4 }}>
        {text}
      </div>
    </div>
  );
};

const SceneView: React.FC<{ scene: Scene; first: boolean }> = ({ scene, first }) => {
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
            <div key={o.tex} style={{ position: 'absolute', left: 0, top: o.top, width: 1920, height: 1080, opacity: op, transform: `scale(${0.985 + 0.015 * op})`, transformOrigin: '50% 50%' }}>
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

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const bg = interpolate(f, [0, OVERLAP * 2], [0, 1], clamp);
  const t = (d: number) => interpolate(f, [d, d + 24], [0, 1], { ...clamp, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 70% 20%, #1d6b3c 0%, ${C.brand900} 70%)`, opacity: bg, alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: body, fontWeight: 600, fontSize: 28, opacity: t(18), transform: `translateY(${(1 - t(18)) * 14}px)`, background: 'rgba(255,255,255,0.12)', padding: '10px 24px', borderRadius: 999, display: 'inline-block', color: C.lime }}>
          Projeto de Extensão · Campo Grande/MS
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 132, lineHeight: 1.05, marginTop: 36, opacity: t(30), transform: `translateY(${(1 - t(30)) * 22}px)`, letterSpacing: -3 }}>
          Descarte Certo <span style={{ color: C.lime }}>MS</span>
        </div>
        <div style={{ fontFamily: body, fontWeight: 500, fontSize: 40, marginTop: 24, opacity: t(48) * 0.95 }}>
          Descarte seu lixo eletrônico do jeito certo.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    {SCENES.map((s, i) => (
      <Sequence key={s.id} from={sceneStart(i)} durationInFrames={s.dur}>
        <SceneView scene={s} first={i === 0} />
      </Sequence>
    ))}
    <Sequence from={sceneStart(SCENES.length)} durationInFrames={END_DUR}>
      <EndCard />
    </Sequence>
  </AbsoluteFill>
);
