"""Final audio mix for one video.

python3 mix.py <project> <id>   (spec: <project>/mix/<id>_mixspec.json, written by mixgen.py)
mix_spec: {"music": path, "music_db": -17, "music_offset": 0.0, "fade_out": 2.5,
           "sfx": [{"name": "sparkle", "at": 5.4, "db": -8, "trim": null}],
           "ambience": [{"name": "fire_crackle", "from": 10, "to": 20, "db": -20}]}
Reads <project>/vo/<id>_placement.json. Writes <project>/mix/v<id>_mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP)
and audio/mix/v<vid>_vo.wav (voice-only stem at the same timing) and v<vid>_music_fit.wav.
"""
import json, sys, subprocess, os
import numpy as np, soundfile as sf, librosa

SR = 48000
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import SFX_DIR
P = '.'
OUT = './mix'

def resolve(path):
    return path if os.path.isabs(path) else os.path.join(P, path)

def load(path, sr=SR, mono=False):
    path = resolve(path)
    ch = 1 if mono else 2
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', str(ch), '-ar', str(sr), '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32).reshape(-1, ch).T.copy()
    if not mono and y.shape[0] == 1:
        y = np.concatenate([y, y])
    return y

def db(x):
    return 10 ** (x / 20)

def fit_music(path, total, offset=0.0, fade_out=2.5):
    """Shorten the track to `total` seconds keeping its natural ending: cut a bar-aligned middle chunk and crossfade."""
    y = load(path)
    mono = librosa.to_mono(y)
    tempo, beats = librosa.beat.beat_track(y=librosa.resample(mono, orig_sr=SR, target_sr=22050), sr=22050, units='time')
    beats = np.asarray(beats); tempo = float(np.atleast_1d(tempo)[0])
    L = y.shape[1] / SR
    # find where the music effectively ends (last sample above -50 dB)
    env = np.abs(mono)
    above = np.where(env > db(-50))[0]
    end_t = (above[-1] / SR) if len(above) else L
    y = y[:, :int(min(L, end_t + 0.3) * SR)]
    L = y.shape[1] / SR
    target = total + 0.4
    if offset:
        y = y[:, int(offset * SR):]; L = y.shape[1] / SR
    if L <= target:
        out = np.zeros((2, int(target * SR)), np.float32); out[:, :y.shape[1]] = y
        return out, float(tempo), 0.0
    remove = L - target
    # pick cut point A on a beat between 35% and 60% of the target, B = A + remove snapped to a beat
    bp = np.median(np.diff(beats)) if len(beats) > 4 else 0.5
    best = None
    for a in beats:
        if a < target * 0.35 or a > target * 0.62:
            continue
        b_ideal = a + remove
        bi = beats[np.argmin(np.abs(beats - b_ideal))] if len(beats) else b_ideal
        err = abs(bi - b_ideal)
        # prefer whole-bar jumps (4 beats)
        nb = round((bi - a) / bp) if bp else 0
        score = err + (0 if nb % 4 == 0 else 0.15)
        if best is None or score < best[0]:
            best = (score, a, bi)
    if best is None:
        a = target * 0.5; b = a + remove
    else:
        _, a, b = best
    xf = 0.8
    A = y[:, :int((a + xf / 2) * SR)]
    B = y[:, int((b - xf / 2) * SR):]
    n = int(xf * SR)
    w = np.linspace(0, np.pi / 2, n)
    mid = A[:, -n:] * np.cos(w) + B[:, :n] * np.sin(w)
    out = np.concatenate([A[:, :-n], mid, B[:, n:]], axis=1)
    want = int(target * SR)
    if out.shape[1] < want:
        out = np.pad(out, ((0, 0), (0, want - out.shape[1])))
    out = out[:, :want]
    return out.astype(np.float32), float(tempo), float(a)

def main(proj_dir, vid):
    global P, OUT
    P = os.path.abspath(proj_dir); OUT = os.path.join(P, 'mix'); os.makedirs(OUT, exist_ok=True)
    spec = json.load(open(f'{OUT}/{vid}_mixspec.json'))
    pl = json.load(open(f'{P}/vo/{vid}_placement.json'))
    total = pl['total']
    N = int(total * SR)
    # --- voice stem
    vo_path = resolve(pl['vo'])
    preview = not os.path.exists(vo_path)
    if preview:
        print(f'v{vid}: no voiceover file yet -> PREVIEW mix (music + SFX only)')
    vo_src = np.zeros((1, N), np.float32) if preview else load(pl['vo'], mono=True)
    vo = np.zeros(N, np.float32)
    for c in ([] if preview else pl['clips']):
        s, e = int(c['src_s'] * SR), int(c['src_e'] * SR)
        seg = vo_src[0, s:e].copy()
        fl = int(0.012 * SR)
        seg[:fl] *= np.linspace(0, 1, fl); seg[-fl:] *= np.linspace(1, 0, fl)
        at = int(c['at'] * SR)
        vo[at:at + len(seg)] += seg[:max(0, N - at)]
    sf.write(f'{OUT}/v{vid}_vo_raw.wav', vo, SR)
    # VO processing: high-pass, gentle compression, normalise to -16 LUFS
    if preview:
        sf.write(f'{OUT}/v{vid}_vo.wav', vo, SR)
    else:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{OUT}/v{vid}_vo_raw.wav', '-af',
                        'highpass=f=80,' + ('equalizer=f=3200:t=q:w=1.2:g=2,' if spec.get('vo_presence') else '') + 'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-2:LRA=7',
                        '-ar', str(SR), f'{OUT}/v{vid}_vo.wav'], check=True)
    # --- music
    if spec.get('music_mode') == 'head':
        # timeline-scored cue: keep the music in place from music_offset, no middle cut, fade at the end
        y = load(spec['music'])[:, int(spec.get('music_offset', 0.0) * SR):]
        want = int((total + 0.4) * SR)
        mus = y[:, :want] if y.shape[1] >= want else np.pad(y, ((0, 0), (0, want - y.shape[1])))
        tempo, cut = 0.0, 0.0
    else:
        mus, tempo, cut = fit_music(spec['music'], total, spec.get('music_offset', 0.0))
    fo = spec.get('fade_out', 2.5)
    nfo = int(fo * SR)
    mus = mus[:, :N] if mus.shape[1] >= N else np.pad(mus, ((0, 0), (0, N - mus.shape[1])))
    mus[:, -nfo:] *= np.linspace(1, 0, nfo) ** 1.5
    fi = int(spec.get('fade_in', 0.15) * SR); mus[:, :fi] *= np.linspace(0, 1, fi)
    for g in spec.get('music_gain', []):  # [{"from": s, "to": s, "db": x}] gentle automation with 0.3 s ramps
        a0, a1 = int(g['from'] * SR), int(min(g['to'], total) * SR); r = int(0.3 * SR)
        env = np.ones(N, np.float32); env[a0:a1] = db(g['db'])
        env[max(0, a0 - r):a0] = np.linspace(1, db(g['db']), a0 - max(0, a0 - r))
        env[a1:a1 + r] = np.linspace(db(g['db']), 1, len(env[a1:a1 + r]))
        mus *= env
    sf.write(f'{OUT}/v{vid}_music_fit.wav', mus.T, SR)
    # --- sfx bus
    sfx = np.zeros((2, N), np.float32)
    for ev in spec.get('sfx', []):
        y = load(f"{SFX_DIR}/{ev['name']}.mp3")
        if ev.get('trim'):
            y = y[:, :int(ev['trim'] * SR)]
            n = min(int(0.05 * SR), y.shape[1]); y[:, -n:] *= np.linspace(1, 0, n)
        # normalise peak then apply gain
        y = y / (np.abs(y).max() + 1e-9) * db(ev.get('db', -10))
        at = int(ev['at'] * SR)
        if at >= N: continue
        n = min(y.shape[1], N - at)
        sfx[:, at:at + n] += y[:, :n]
    for amb in spec.get('ambience', []):
        y = load(f"{SFX_DIR}/{amb['name']}.mp3")
        y = y / (np.abs(y).max() + 1e-9) * db(amb.get('db', -22))
        s0, s1 = int(amb['from'] * SR), int(min(amb['to'], total) * SR)
        L = s1 - s0
        # loop with crossfades
        buf = np.zeros((2, L), np.float32); pos = 0; xf = int(0.25 * SR)
        while pos < L:
            n = min(y.shape[1], L - pos)
            seg = y[:, :n].copy()
            if pos > 0 and n > xf: seg[:, :xf] *= np.linspace(0, 1, xf)
            if n > xf: seg[:, -xf:] *= np.linspace(1, 0, xf)
            buf[:, pos:pos + n] += seg
            pos += max(1, n - xf)
        e = int(0.5 * SR); buf[:, :e] *= np.linspace(0, 1, e); buf[:, -e:] *= np.linspace(1, 0, e)
        sfx[:, s0:s1] += buf
    sf.write(f'{OUT}/v{vid}_sfx.wav', sfx.T, SR)
    # --- mix: music ducked by VO sidechain, + sfx + vo, final loudness
    mdb = spec.get('music_db', -17)
    fc = (f"[1:a]volume={mdb}dB,aformat=channel_layouts=stereo[m];"
          f"[0:a]aformat=channel_layouts=stereo,asplit=2[v1][v2];"
          f"[m][v1]sidechaincompress=threshold=0.025:ratio=5:attack=25:release=450:makeup=1[md];"
          f"[2:a]volume=0dB[s];"
          f"[md][v2][s]amix=inputs=3:normalize=0:duration=longest,"
          f"loudnorm=I={-20 if preview else -14}:TP=-1.5:LRA=9,aresample={SR}[out]")
    out_name = f'{OUT}/v{vid}_preview_mix.wav' if preview else f'{OUT}/v{vid}_mix.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{OUT}/v{vid}_vo.wav', '-i', f'{OUT}/v{vid}_music_fit.wav', '-i', f'{OUT}/v{vid}_sfx.wav',
                    '-filter_complex', fc, '-map', '[out]', '-ar', str(SR), '-ac', '2', '-t', f'{total:.3f}', out_name], check=True)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', out_name, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    summ = r[r.rfind('Summary'):]
    import re
    I = re.search(r'I:\s+(-?[\d.]+) LUFS', summ); TP = re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ)
    print(f'v{vid} mix: {total:.2f}s, music tempo {tempo:.0f} bpm, cut at {cut:.1f}s, I={I.group(1) if I else "?"} LUFS, TP={TP.group(1) if TP else "?"} dBTP')

if __name__ == '__main__':
    main(*sys.argv[1:3])
