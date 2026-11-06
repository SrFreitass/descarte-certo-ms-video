# Descarte Certo MS: vídeo do projeto de extensão

Projeto Remotion (React + TypeScript) do vídeo de apresentação do projeto **Descarte Certo MS** (UCDB, Campo Grande/MS).
O vídeo completo tem cerca de 4:50 e é feito de duas partes, cada uma com a sua narração:

| Composição | Duração | Narração | O que mostra |
|---|---|---|---|
| `Intro` | 2:52 | `audio-originais/audio_felipe.wav` (Felipe) | Apresentação do projeto: problema, contaminação, formulário, campanhas, posts, panfletos, pontos de coleta, meta (100 a 200 pessoas). Usa as imagens da pasta `imagens-originais/`. |
| `Final` | 1:59 | `audio-originais/audio_final.wav` | Apresentação do site, em gravação de tela simulada com cliques que mudam o site de verdade. Termina em recap e créditos. |
| `Promo` | 1:49 | sem áudio | Primeira versão do passeio pelo site (sem narração). Pode ser ignorada. |

Cada composição tem trilha própria: **voz + música de fundo + efeitos sonoros**, mixada por script (veja "Áudio").

## Como rodar

Requisitos: Node 20 ou mais novo, `ffmpeg` e, só para os scripts de áudio, Python 3.10+ com `numpy`.

```bash
npm install
npx remotion studio src/index.ts        # abre o Remotion Studio (http://localhost:3000)
```

Renderizar:

```bash
npx remotion render src/index.ts Intro out/intro.mp4
npx remotion render src/index.ts Final out/final.mp4
```

O `remotion.config.ts` usa o Brave se existir em `/usr/sbin/brave` (no computador de desenvolvimento o Chrome que o Remotion baixa
dá segfault). Em outra máquina ele usa o Chrome padrão do Remotion. Para forçar outro navegador: `REMOTION_BROWSER=/caminho npx remotion ...`.

> No Studio o áudio pode atrasar um pouco ao pular pela linha do tempo. Para julgar a sincronia, veja o arquivo renderizado.

## Pendências

- **`src/participants.json`**: lista de participantes dos créditos finais. Está vazia (`[]`). Preencha com nomes (e, se quiser, o papel de cada um):
  ```json
  ["Fulano da Silva", { "name": "Beltrana Souza", "role": "Design" }]
  ```
  Depois renderize a composição `Final` de novo.
- O cartão final não mostra o endereço do site, porque o site novo ainda não foi publicado.

## Estrutura

```
src/
  Intro.tsx          composição da introdução (animações)
  cues.json          TEMPOS da fala da Intro (segundos) + qual efeito sonoro toca em cada um
  sync.ts, sync.json encaixa cada tempo no início real da palavra no áudio (e antecipa o visual em 0,12 s)
  Final.tsx          composição do encerramento (+ recap e créditos)
  finalScenes.ts     roteiro do Final: câmera, cursor, cliques e legendas, tudo em segundos do áudio
  cuesFinal.json     efeitos sonoros do Final
  sync-final.json    inícios de palavra do áudio do Final
  scenes.ts, Promo.tsx   versão sem áudio
  PageCam.tsx, Cursor.tsx   câmera 2.5D sobre capturas de página e cursor estilo macOS (vieram da skill video-shotcraft)
  cap.json           posições (px) dos elementos do site em cada estado capturado
  participants.json  créditos
public/
  tex/               capturas do site novo, em estados (a0 início; b0..b3 pontos; bm1 modal; c0..c2 como descartar; d0..d2 gaveta; e0; f0)
  intro/             imagens (reduzidas) + trilha mixada da Intro (mix.wav)
  final/mix.wav      trilha mixada do Final
  audio/sfx, audio/music   efeitos e música (CC0), com os créditos em FREESOUND-CREDITS.md
audio-originais/     áudios originais da narração
imagens-originais/   imagens originais: post_1..3 (posts da campanha) e fotos de panfletos, pontos de coleta e mapa
transcricoes/        transcrições com o tempo de cada palavra (modelo "medium" é o mais preciso)
scripts/             capturas do site, mixagem de áudio, transcrição
```

## Áudio

A trilha de cada composição é gerada por `scripts/mix-audio.py` (voz + música em loop que abaixa sozinha enquanto a pessoa fala +
efeitos nos instantes de `cues*.json`; fecha em cerca de -16 LUFS). Rode depois de mudar qualquer tempo:

```bash
# Intro (usa src/cues.json e src/sync.json)
python3 scripts/mix-audio.py
# Final
python3 scripts/mix-audio.py --voice audio-originais/audio_final.wav --seconds 119.4 \
  --sync src/sync-final.json --cues src/cuesFinal.json --out public/final/mix.wav --music-offset 38
```

Precisa de `numpy` e `ffmpeg`. Para refazer os inícios de palavra de uma narração nova: `python3 scripts/onsets.py audio.wav saida.json`.
Para transcrever: `scripts/transcribe.py audio.wav saida.json medium` (precisa de `faster-whisper`).

Efeitos disponíveis em `cues`: `pop`, `whoosh`, `impact`, `sparkle`, `riser`; `db` é o ganho relativo (típico: -22 a -10).

## Sincronia (como funciona)

Todos os tempos de fala ficam em `src/cues.json` (Intro) e `src/finalScenes.ts` (Final), em segundos do áudio.
`src/sync.ts` encaixa cada tempo no início real da palavra (medido na energia do próprio áudio) e começa a animação 0,12 s antes.
Se algo parecer adiantado ou atrasado, ajuste o número do cue: não precisa mexer na animação.

## Recapturar o site

As capturas já estão em `public/tex`. Para refazer (por exemplo, se o site mudar), sirva a pasta `site/` na porta 4321 e rode:

```bash
python3 -m http.server 4321 --directory site
node scripts/capture3.mjs        # a0, b0..b2, bm0/bm1, c0/c1, d0..d2, dm0/dm1, e0, f0
node scripts/capture4.mjs        # b3, c2
```

Precisa de um Chrome/Chromium/Brave (`BROWSER=/caminho node scripts/capture3.mjs`). As capturas `capture.mjs`, `capture2.mjs`, `boxes.mjs` e `peek.mjs`
são do primeiro site (antigo) e só ficaram como histórico.

## Juntar as duas partes

O vídeo completo (`video-completo.mp4`, 4:51) sai da junção de `Intro` e `Final`. O áudio vem direto das trilhas mixadas (e não do MP4 de
cada parte), o que evita o atraso de ~43 ms que o AAC acrescenta:

```bash
ffmpeg -i out/intro.mp4 -i out/final.mp4 -i public/intro/mix.wav -i public/final/mix.wav \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v];[2:a][3:a]concat=n=2:v=0:a=1[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/video-completo.mp4
```

A última cena da `Intro` termina com a câmera entrando na página inicial do site e a `Final` começa nessa mesma página, então o corte é imperceptível.

## Vídeos já renderizados

Estão na página de **Releases** do repositório (arquivos grandes demais para ficar no histórico do git): `video-completo.mp4`, `intro.mp4`, `final.mp4`
(esta ainda sem a lista de participantes) e `promo.mp4` (versão sem áudio).

## O site

A pasta `site/` é uma cópia do site novo (multipágina, HTML/CSS/JS puro), igual ao repositório `descarte-certo-ms-web`. Para abrir:
`python3 -m http.server 4321 --directory site` e acesse http://localhost:4321. Os atributos `data-video` estão listados em `site/VIDEO-HOOKS.md`.

## Se quiser continuar de onde parou

- **Mudar um texto/animação**: `src/Intro.tsx` (introdução) ou `src/Final.tsx` e `src/finalScenes.ts` (encerramento).
- **Mudar um tempo**: `src/cues.json` (Intro) ou `src/finalScenes.ts` / `src/cuesFinal.json` (Final); depois refaça a trilha (seção "Áudio") e renderize.
- **Cache que NÃO está no repositório** (é baixado sozinho): `node_modules` (`npm install`), o navegador do Remotion e os modelos de transcrição
  do `faster-whisper` (só precisa se for transcrever outra narração; as transcrições atuais estão em `transcricoes/`).

## Licenças e créditos

- Efeitos sonoros e música: Freesound, licença CC0 (`public/audio/sfx/FREESOUND-CREDITS.md`, `public/audio/music/FREESOUND-CREDITS.md`).
- Remotion tem licença própria: gratuito para uso pessoal e equipes pequenas; empresas podem precisar de licença paga.
- `PageCam` e `Cursor` vieram da skill [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) (Apache-2.0).
- Imagens da campanha e fotos: do projeto de extensão.
