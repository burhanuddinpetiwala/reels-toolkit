"""Prepare a paid-ad voiceover and time the ad to it.
python3 ad_prep.py <project> <adId> [--tempo 1.05]
ads.json entry needs: "id", "voTake" (project-relative mp3), and "anchors" (first word of each beat, in order):
  {"hook2": "black", "yes": "yes", "up": "up", "items": [["fireplace","save"],["sofa","save"],["snowy","save"]], "ends": "ends", "shop": "shop"}
Writes vo/ad_<id>.wav (pauses trimmed, slightly sped up) and fills "vo" and "T" in ads.json."""
import json, os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import proj, run, jsave, brand as load_brand
from asr import words

P = proj(sys.argv[1]); aid = sys.argv[2]
tempo = float(sys.argv[sys.argv.index('--tempo') + 1]) if '--tempo' in sys.argv else 1.05
ads = json.load(open(f'{P}/ads.json'))
ad = [a for a in ads if a['id'] == aid][0]
src = os.path.join(P, ad['voTake'])
out = f'{P}/vo/ad_{aid}.wav'
run(f'ffmpeg -hide_banner -loglevel error -y -i "{src}" -af "silenceremove=start_periods=1:start_threshold=-35dB:stop_periods=-1:stop_duration=0.2:stop_threshold=-33dB:stop_silence=0.12,atempo={tempo}" -ar 44100 "{out}"')
ws = words(out, load_brand(P).get('name'))
clean = lambda w: re.sub(r'[^a-z0-9$%]', '', w.lower())
pos = 0
def find(prefix):
    global pos
    for i in range(pos, len(ws)):
        if clean(ws[i]['w']).startswith(prefix.lower()):
            pos = i + 1
            return float(round(ws[i]['s'], 2))
    sys.exit(f'anchor "{prefix}" not found after word {pos}: ' + ' '.join(w['w'] for w in ws))
a = ad['anchors']
T = {'black': find(a['hook2']), 'yes': find(a['yes']), 'up': find(a['up'])}
names = [('fire', 'fireSave'), ('sofa', 'sofaSave'), ('tree', 'treeSave')]
for (k, ks), (w1, w2) in zip(names, a['items']):
    T[k] = find(w1); T[ks] = find(w2)
T['ends'] = find(a['ends']); T['shop'] = find(a['shop'])
T['voEnd'] = float(round(ws[-1]['e'] + 0.15, 2))
ad['T'] = T
ad['vo'] = f'project/vo/ad_{aid}.wav'
jsave(ads, f'{P}/ads.json')
print(aid, T, ' '.join(w['w'] for w in ws))
