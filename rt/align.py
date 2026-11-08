"""Align a known script to a voiceover file.

Usage: python3 align.py <id> <audio_path> <out_json> <plan.json>\nReads the script lines for <id> from the project plan, runs chunked ASR
(faster-whisper small.en) and maps every script word to a start/end time.
Words the recogniser missed are interpolated between their aligned neighbours.
"""
import json, re, subprocess, sys, difflib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asr import load
from faster_whisper import WhisperModel

NUM = {'0':'zero','1':'one','2':'two','3':'three','4':'four','5':'five','6':'six','7':'seven','8':'eight','9':'nine','10':'ten','11':'eleven','12':'twelve','15':'fifteen','18':'eighteen','20':'twenty','30':'thirty','40':'forty','50':'fifty','60':'sixty','70':'seventy','80':'eighty','90':'ninety','100':'hundred'}

def norm(tok):
    t = tok.lower().replace('’', "'")
    t = re.sub(r"[^a-z0-9']", '', t)
    return NUM.get(t, t)

def script_words(text):
    text = re.sub(r'\[[^\]]+\]', ' ', text)
    out = []
    for raw in text.split():
        disp = raw
        parts = [p for p in re.split(r'[-–—…/]', raw) if p]
        ns = [norm(p) for p in parts if norm(p)]
        if not ns:
            continue
        out.append({'disp': disp, 'norm': ns})
    return out

def speech_chunks(path, total):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'silencedetect=n=-38dB:d=0.22', '-f', 'null', '-'], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    # speech = gaps between silences
    sil = list(zip(starts, ends + [total] * (len(starts) - len(ends))))
    chunks, cur = [], 0.0
    for s, e in sil:
        if s - cur > 0.15:
            chunks.append((max(0, cur - 0.08), min(total, s + 0.08)))
        cur = e
    if total - cur > 0.15:
        chunks.append((max(0, cur - 0.08), total))
    # merge very short chunks into neighbours
    merged = []
    for c in chunks:
        if merged and (c[0] - merged[-1][1] < 0.12 or c[1] - c[0] < 0.5):
            merged[-1] = (merged[-1][0], c[1])
        else:
            merged.append(c)
    return merged

def main(vid, audio, outp, plan_path):
    plan = json.load(open(plan_path))
    v = [x for x in plan['reels'] if x['id'] == vid][0]
    lines = []
    flat = []
    for li, l in enumerate(v['lines']):
        ws = script_words(l['t'])
        lines.append({'k': l['k'], 'text': re.sub(r'\s+', ' ', re.sub(r'\[[^\]]+\]', '', l['t'])).strip(), 'words': ws})
        for wi, w in enumerate(ws):
            for ni, n in enumerate(w['norm']):
                flat.append((li, wi, ni, n))
    total = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio], capture_output=True, text=True).stdout)
    audio_arr = load(audio)
    model = WhisperModel('small.en', device='cpu', compute_type='int8')
    prompt = ' '.join(l['text'] for l in lines)[:600]
    asr = []
    for a, b in speech_chunks(audio, total):
        seg = audio_arr[int(a * 16000):int(b * 16000)]
        segs, _ = model.transcribe(seg, word_timestamps=True, initial_prompt=prompt, condition_on_previous_text=False, beam_size=5)
        for s in segs:
            for w in s.words:
                for p in [p for p in re.split(r'[-–—…/]', w.word.strip()) if p]:
                    n = norm(p)
                    if n:
                        asr.append({'n': n, 's': a + w.start, 'e': a + w.end})
    sm = difflib.SequenceMatcher(a=[f[3] for f in flat], b=[x['n'] for x in asr], autojunk=False)
    times = [None] * len(flat)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            x = asr[blk.b + k]
            times[blk.a + k] = (x['s'], x['e'])
    # interpolate gaps
    known = [i for i, t in enumerate(times) if t]
    matched = len(known)
    for i in range(len(times)):
        if times[i] is None:
            prev = max([k for k in known if k < i], default=None)
            nxt = min([k for k in known if k > i], default=None)
            ps = times[prev][1] if prev is not None else 0.0
            ne = times[nxt][0] if nxt is not None else total
            span = (nxt if nxt is not None else len(times)) - (prev if prev is not None else -1)
            pos = i - (prev if prev is not None else -1)
            st = ps + (ne - ps) * (pos - 1) / span
            en = ps + (ne - ps) * pos / span
            times[i] = (st, en)
    # collapse sub-tokens back to display words
    for idx, (li, wi, ni, n) in enumerate(flat):
        w = lines[li]['words'][wi]
        s, e = times[idx]
        w['s'] = round(min(w.get('s', s), s), 3)
        w['e'] = round(max(w.get('e', e), e), 3)
    for l in lines:
        for w in l['words']:
            w.pop('norm', None)
        l['start'] = l['words'][0]['s']
        l['end'] = l['words'][-1]['e']
    # fix the first word: whisper often pins it to chunk start; use loudness onset
    out = {'video': vid, 'audio': audio, 'duration': round(total, 3), 'matchRate': round(matched / len(flat), 3), 'lines': lines}
    json.dump(out, open(outp, 'w'), indent=1)
    print(f'{vid}: {matched}/{len(flat)} tokens matched ({out["matchRate"]*100:.0f}%), duration {total:.2f}s')
    for l in lines:
        print(f"  {l['k']:10} {l['start']:6.2f}-{l['end']:6.2f}  {l['text'][:70]}")

if __name__ == '__main__':
    main(*sys.argv[1:5])
