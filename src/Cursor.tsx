import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Cursor estilo macOS. Coordenadas em px CSS da página (vive dentro do PageCam,
// então acompanha o scroll/zoom da câmera). A ponta da seta é o hotspot (0,0).
export type Way = { f: number; x: number; y: number; mode?: 'move' | 'follow' };

const MOVE = Easing.bezier(0.4, 0, 0.2, 1); // movimento humano: sai suave, chega suave
const FOLLOW = Easing.bezier(0.33, 0, 0.15, 1); // mesma curva da câmera → fica parado na tela

export const cursorAt = (way: Way[], frame: number) => {
  if (frame <= way[0].f) return { x: way[0].x, y: way[0].y };
  for (let i = 0; i < way.length - 1; i++) {
    const a = way[i], b = way[i + 1];
    if (frame > b.f) continue;
    const raw = b.f === a.f ? 1 : (frame - a.f) / (b.f - a.f);
    const follow = b.mode === 'follow';
    const t = (follow ? FOLLOW : MOVE)(Math.min(1, Math.max(0, raw)));
    let x = a.x + (b.x - a.x) * t;
    let y = a.y + (b.y - a.y) * t;
    if (!follow) {
      // leve arco: a mão nunca vai em linha reta
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0) {
        const k = 0.1 * d * Math.sin(Math.PI * t) * (dx >= 0 ? 1 : -1);
        x += (-dy / d) * k;
        y += (dx / d) * k;
      }
    }
    return { x, y };
  }
  const l = way[way.length - 1];
  return { x: l.x, y: l.y };
};

export const Cursor: React.FC<{ way: Way[]; clicks: number[]; appearAt: number }> = ({ way, clicks, appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y } = cursorAt(way, frame);
  const opacity = interpolate(frame, [appearAt, appearAt + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // pressionar: encolhe no clique e volta com mola
  let scale = 1;
  const press = clicks.filter((c) => frame >= c).pop();
  if (press !== undefined) {
    const down = interpolate(frame, [press, press + 4], [1, 0.86], { extrapolateRight: 'clamp' });
    const up = spring({ frame: frame - press - 4, fps, config: { damping: 11, stiffness: 220 } });
    scale = frame < press + 4 ? down : 0.86 + 0.14 * up;
  }

  return (
    <>
      {clicks.map((c) => {
        const p = (frame - c) / 20;
        if (p < 0 || p > 1) return null;
        const e = Easing.out(Easing.cubic)(p);
        const r = 6 + e * 30;
        const { x: cx, y: cy } = cursorAt(way, c);
        return (
          <div key={c} style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'rgba(20,30,25,0.16)', border: '2px solid rgba(255,255,255,0.7)', opacity: (1 - p) * 0.95 }} />
        );
      })}
      <svg
        width={26}
        height={32}
        viewBox="0 0 26 32"
        style={{ position: 'absolute', left: x, top: y, opacity, transform: `scale(${scale})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))', overflow: 'visible' }}
      >
        <path d="M2 2 L2 24.5 L7.6 19.4 L11.4 28.2 L15.4 26.4 L11.6 17.9 L19.4 17.9 Z" fill="#000" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </>
  );
};
