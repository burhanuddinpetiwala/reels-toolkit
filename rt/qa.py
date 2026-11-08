"""QA one finished video: streams, duration, loudness, black/frozen frames, speech intelligibility vs script, frame sheet.
python3 qa.py <project> <id>  -> prints a report and writes <project>/qa/v<id>_qa.json + contact sheet v<id>_sheet.jpg"""
import json, subprocess, sys, re, os, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asr import words as asr_words
from common import brand as load_brand, spoken_domain

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def main(P, vid):
    P = os.path.abspath(P)
    Q = f'{P}/qa'
    mp4 = f'{P}/out/{vid}.mp4'
    os.makedirs(Q, exist_ok=True)
    b = load_brand(P)
    dom_t = b.get('domain', '').lower(); dom_s = ' '.join(spoken_domain(b)).lower(); name = b.get('name', '')
    rep = {'video': vid, 'file': mp4}
    pr = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4]).stdout)
    v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
    a = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
    rep['video_stream'] = {k: v.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'pix_fmt', 'nb_frames']}
    rep['audio_stream'] = {k: a.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate']}
    rep['duration'] = round(float(pr['format']['duration']), 2)
    rep['size_mb'] = round(int(pr['format']['size']) / 1e6, 1)
    # loudness
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    summ = r[r.rfind('Summary'):]
    rep['loudness_LUFS'] = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    rep['true_peak_dBFS'] = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
    # black frames / freezes
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-vf', 'blackdetect=d=0.25:pix_th=0.06,freezedetect=n=0.0008:d=2.5', '-an', '-f', 'null', '-']).stderr
    rep['black_segments'] = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', r)
    rep['freeze_segments'] = re.findall(r'freeze_start: ([\d.]+)', r)
    # speech check: transcribe the final mix and compare to the script
    wav = f'{Q}/{vid}_mix16k.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-ac', '1', '-ar', '16000', wav])
    data = json.load(open(f'{P}/data/v{vid}.json'))
    script = ' '.join(l['text'] for l in data['lines'])
    hyp = ' '.join(w['w'] for w in asr_words(wav, prompt=name))
    NUM = {'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
           'eleven': '11', 'twelve': '12', 'sixteen': '16', 'twenty': '20', 'forty': '40', 'sixty': '60'}
    def norm(s):
        s = s.lower().replace(dom_s, 'DOMAIN').replace(dom_t, 'DOMAIN').replace(dom_t.replace('.', ' .'), 'DOMAIN').lower()
        s = re.sub(r'thanks for watching!?\s*$', '', s.strip())  # classic Whisper hallucination on trailing music
        for x, y in [('twenty-ninth', '29'), ('twenty ninth', '29'), ('thirty-first', '31'), ('thirty first', '31'), ('nineteenth', '19'), ('seventh', '7'), ('twentieth', '20'), ('sixth', '6'), ('fifteen', '15'), ('fifty-four', '54'), ('three-sixty', '360'), ('percent', ' '), ('%', ' '), ('$', ' ')]:
            s = s.replace(x, y)
        s = re.sub(r'(\d+)(st|nd|rd|th)\b', r'\1', s)
        toks = re.sub(r"[^a-z0-9' ]", ' ', s.replace('-', ' ')).split()
        ONES = {'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19}
        TENS = {'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90}
        out, i = [], 0
        while i < len(toks):
            t = toks[i]
            if t in ONES or t in TENS or (t == 'a' and i + 1 < len(toks) and toks[i + 1] == 'hundred'):
                val, cur, j = 0, 0, i
                if t == 'a': cur, j = 1, i + 1
                while j < len(toks) and (toks[j] in ONES or toks[j] in TENS or toks[j] == 'hundred' or (toks[j] == 'and' and j + 1 < len(toks) and (toks[j + 1] in ONES or toks[j + 1] in TENS) and cur >= 100)):
                    w = toks[j]
                    if w in ONES: cur += ONES[w]
                    elif w in TENS: cur += TENS[w]
                    elif w == 'hundred': cur = max(cur, 1) * 100
                    j += 1
                out.append(str(cur)); i = j
                continue
            if t not in ('dollars', 'dollar'):
                out.append(t)
            i += 1
        return out
    sm = difflib.SequenceMatcher(a=norm(script), b=norm(hyp), autojunk=False)
    rep['speech_match_ratio'] = round(sm.ratio(), 3)
    rep['asr_transcript'] = hyp
    # frame sheet
    times = [round(x * rep['duration'] / 10 + 0.5, 2) for x in range(10)]
    from PIL import Image
    tiles = []
    for i, tt in enumerate(times):
        fp = f'{Q}/v{vid}_f{i}.jpg'
        run(['ffmpeg', '-v', 'error', '-y', '-ss', str(tt), '-i', mp4, '-frames:v', '1', '-vf', 'scale=270:480', fp])
        tiles.append(Image.open(fp))
    sheet = Image.new('RGB', (5 * 280, 2 * 490), 'white')
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % 5) * 280, (i // 5) * 490))
    sheet.save(f'{Q}/v{vid}_sheet.jpg', quality=85)
    rep['sheet_times'] = times
    checks = {
        'h264_1080x1920': rep['video_stream']['codec_name'] == 'h264' and v['width'] == 1080 and v['height'] == 1920,
        'fps_30': rep['video_stream']['r_frame_rate'] == '30/1',
        'aac_audio': rep['audio_stream']['codec_name'] == 'aac',
        'duration_10_90': 10 <= rep['duration'] <= 90,
        'loudness_ok': -16 <= rep['loudness_LUFS'] <= -12,
        'true_peak_ok': rep['true_peak_dBFS'] <= -1.0,
        'no_black': len(rep['black_segments']) == 0,
        'speech_clear': rep['speech_match_ratio'] >= 0.85,
    }
    rep['checks'] = checks
    rep['pass'] = all(checks.values())
    json.dump(rep, open(f'{Q}/v{vid}_qa.json', 'w'), indent=1)
    print(json.dumps({k: rep[k] for k in ['duration', 'size_mb', 'loudness_LUFS', 'true_peak_dBFS', 'speech_match_ratio', 'black_segments', 'freeze_segments', 'checks', 'pass']}, indent=0))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
