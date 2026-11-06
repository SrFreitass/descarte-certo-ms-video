#!/usr/bin/env python3
"""Início real de cada palavra (após micro-pausas) medido na energia do áudio. Uso: onsets.py voz.wav saida.json"""
import json, sys, wave
import numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
if w.getnchannels() > 1: x = x.reshape(-1, w.getnchannels()).mean(axis=1)
hop, win = int(sr * 0.01), int(sr * 0.02)
n = (len(x) - win) // hop
db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2)) + 1e-9) for i in range(n)])
lvl = np.percentile(db, 90)
dip, rise = lvl - 13, lvl - 9
c, i = [], 0
while i < n:
    if db[i] < dip:
        j = i
        while j < n and db[j] < dip: j += 1
        if j - i >= 3 and j < n:
            k = j
            while k < n and db[k] < rise and k - j < 12: k += 1
            c.append(round(k * 0.01, 2))
        i = j
    else: i += 1
json.dump({'onsets': sorted(set(c))}, open(sys.argv[2], 'w'))
print('nível', round(float(lvl), 1), 'dB; onsets', len(set(c)))
