import json, sys, subprocess
import numpy as np
from faster_whisper import WhisperModel
audio, out, size = sys.argv[1], sys.argv[2], sys.argv[3]
raw = subprocess.run(['ffmpeg','-v','error','-i',audio,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout
audio = np.frombuffer(raw, dtype=np.float32)
m = WhisperModel(size, device="cpu", compute_type="int8")
segs, info = m.transcribe(audio, language="pt", word_timestamps=True, vad_filter=False, beam_size=5)
res = []
for s in segs:
    res.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                "words": [{"w": w.word, "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]})
    print(f"[{s.start:6.1f}-{s.end:6.1f}] {s.text.strip()}", flush=True)
json.dump({"duration": info.duration, "segments": res}, open(out, "w"), ensure_ascii=False, indent=1)
