#!/usr/bin/env python3
"""Monta a trilha final da introdução: voz do Felipe + música (abaixa sozinha sob a fala) + efeitos nos cues.

Uso: ../venv/bin/python scripts/mix-audio.py [--cues src/cues.json] [--out public/intro/mix.wav]
Lê os cues (qualquer dict com "t" e "sfx", em qualquer nível do JSON) e alinha cada efeito ao início real da palavra
(mesmo `snap` de src/sync.ts, usando src/sync.json).
"""
import argparse, json, os, subprocess, sys
import numpy as np

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--cues', default=os.path.join(ROOT, 'src/cues.json'))
ap.add_argument('--out', default=os.path.join(ROOT, 'public/intro/mix.wav'))
ap.add_argument('--voice', default=os.path.join(ROOT, 'audio-originais/audio_felipe.wav'))
ap.add_argument('--seconds', type=float, default=172.0)
ap.add_argument('--sync', default=os.path.join(ROOT, 'src/sync.json'))
ap.add_argument('--music-offset', type=float, default=0.0, help='começa a música neste ponto (s) da faixa')
args = ap.parse_args()
N = int(args.seconds * SR)

def decode(path, ch, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path] + (['-af', af] if af else []) + ['-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, ch).copy()

def db(x): return 10 ** (x / 20)

# ── voz ────────────────────────────────────────────────────────────────
voice = decode(args.voice, 1)[:, 0]
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]

# ── onsets (mesmo mecanismo do vídeo) ──────────────────────────────────
ONS = np.array(json.load(open(args.sync))['onsets'])
def snap(t, tol=0.15):
    if len(ONS) == 0: return t
    i = int(np.argmin(np.abs(ONS - t)))
    return float(ONS[i]) if abs(ONS[i] - t) <= tol else t

# ── música: compressão leve, loop com crossfade, envelope que cede à voz ──
MUSIC = os.path.join(ROOT, 'public/audio/music/fs-671900.mp3')
music = decode(MUSIC, 2, 'acompressor=threshold=-26dB:ratio=3:attack=40:release=400,loudnorm=I=-18:TP=-2:LRA=7')
if args.music_offset > 0:
    music = music[int(args.music_offset * SR):]
xf = 4 * SR
t_ = np.linspace(0, np.pi / 2, xf)[:, None]
out = music.copy()
while len(out) < N + 8 * SR:
    out[-xf:] = out[-xf:] * np.cos(t_) + music[:xf] * np.sin(t_)
    out = np.concatenate([out, music[xf:]])
music = out[:N]

hop = SR // 100
env_db = np.array([20 * np.log10(np.sqrt(np.mean(voice[i:i + 2 * hop] ** 2)) + 1e-9) for i in range(0, N - 2 * hop, hop)])
speech = (env_db > -38).astype(np.float32)
duck = np.zeros_like(speech); cur = 0.0
a_att, a_rel = 1 - np.exp(-0.01 / 0.12), 1 - np.exp(-0.01 / 0.9)
for i, s_ in enumerate(speech):
    cur += (s_ - cur) * (a_att if s_ > cur else a_rel); duck[i] = cur
SPEECH_DB, PAUSE_DB = -20.5, -12.0
gain_db = PAUSE_DB + (SPEECH_DB - PAUSE_DB) * duck
tgrid = np.arange(len(gain_db)) * 0.01
gain = db(np.interp(np.arange(N) / SR, tgrid, gain_db))
gain *= np.clip(np.arange(N) / SR / 1.5, 0, 1)                       # entrada suave
gain *= np.clip((args.seconds - np.arange(N) / SR) / 2.5, 0, 1)      # saída suave
music = music * gain[:, None]

# ── efeitos ────────────────────────────────────────────────────────────
SFX_DIR = os.path.join(ROOT, 'public/audio/sfx')
# nome → [(arquivo, instante do "golpe" dentro do arquivo em s)]; alterna variações para não soar metralhadora
SFX = {
    'pop':     [('fs-789793.mp3', 0.005), ('fs-850097.mp3', 0.045)],
    'whoosh':  [('fs-802119.mp3', 0.505)],
    'impact':  [('fs-841274.mp3', 0.025)],
    'sparkle': [('fs-545238.mp3', 0.015), ('fs-715067.mp3', 0.295)],
    'riser':   [('fs-685256.mp3', 2.745)],
}
_cache = {}
def sfx_audio(fn):
    if fn not in _cache:
        a = decode(os.path.join(SFX_DIR, fn), 2)
        pk = np.max(np.abs(a)) + 1e-9
        _cache[fn] = a * (db(-3.0) / pk)       # normaliza pico em -3 dBFS; o ganho do cue é relativo a isso
    return _cache[fn]

def walk(o, name=''):
    if isinstance(o, dict):
        if 't' in o and 'sfx' in o and o['sfx']: yield name, o
        for k, v in o.items():
            if isinstance(v, (dict, list)): yield from walk(v, k)
    elif isinstance(o, list):
        for v in o: yield from walk(v, name)

cues = sorted(walk(json.load(open(args.cues))), key=lambda c: c[1]['t'])
sfx_bus = np.zeros((N, 2), dtype=np.float32)
used = {}
log = []
for nme, c in cues:
    kind = c['sfx']
    if kind not in SFX: print('sfx desconhecido', kind, nme, file=sys.stderr); continue
    k = used.get(kind, 0); used[kind] = k + 1
    fn, hit = SFX[kind][k % len(SFX[kind])]
    t = snap(float(c['t']))
    start = int(round((t - hit) * SR))
    a = sfx_audio(fn) * db(float(c.get('db', -16)))
    lo, hi = max(0, start), min(N, start + len(a))
    if hi > lo: sfx_bus[lo:hi] += a[lo - start:hi - start]
    log.append((round(t, 2), kind, fn, c.get('db', -16), nme))

mix = np.stack([voice, voice], axis=1) + music + sfx_bus
raw = args.out + '.raw.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', raw], input=mix.astype(np.float32).tobytes(), check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', args.out], check=True)
os.remove(raw)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', args.out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
tail = r[r.rfind('Summary:'):]
print('efeitos colocados:', len(log))
for l in log: print('  %7.2fs  %-8s %-14s %5s dB  %s' % (l[0], l[1], l[2], l[3], l[4]))
print(tail.strip())
