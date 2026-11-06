import sync from './sync.json';

// Sincronia fina com a fala do Felipe.
// ONSETS = início real de cada palavra/sílaba tônica medido no próprio áudio (energia de 10 ms, após micro-pausas).
// As marcas de tempo vêm da transcrição (erro típico de ±0,3 s); `snap` encaixa cada uma no início real mais próximo.
export const ONSETS: number[] = sync.onsets;

/** Encaixa um tempo (s) no início de palavra mais próximo, se estiver a até `tol` s. */
export const snap = (t: number, tol = 0.15) => {
  let best = t, d = tol;
  for (const o of ONSETS) {
    const dd = Math.abs(o - t);
    if (dd <= d) { d = dd; best = o; }
    if (o > t + tol) break;
  }
  return best;
};

/** O visual começa um pouco ANTES da palavra para já estar em movimento quando ela soar (e chegar nítido junto com ela). */
export const LEAD = 0.12;
export const cueTime = (t: number) => snap(t) - LEAD;
