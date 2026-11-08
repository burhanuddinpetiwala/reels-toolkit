"""Pick the better voiceover take, align it to the script, build the caption/scene timeline.

python3 vo_pick.py <project> <ID> [<ID> ...]
Takes: <project>/vo/<id>_a.mp3, <id>_b.mp3 (any number of letters). Writes vo/<id>.mp3, vo/<id>_align.json,
vo/<id>_layout.json, data/v<ID>.json and updates plan.json (vo, voScore, take).
Per-reel options in plan.json: "pace": "calm" (longer gaps), "captionSubs": [[["move","one"],"Move 1"], ...]
"""
import json, sys, re, difflib, shutil, os, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import proj, plan as load_plan, brand as load_brand, spoken_domain, run, jsave, RT
from asr import words

NUM = {'1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'}


def toks(s, dom):
    s = s.lower().replace(dom['typed'].lower(), dom['spoken'].lower())
    return [NUM.get(t, t) for t in re.findall(r"[a-z0-9']+", s.replace('-', ' '))]


def main(P, ids):
    P = proj(P)
    plan = load_plan(P)
    b = load_brand(P)
    sd = spoken_domain(b)
    dom = {'typed': b.get('domain', ''), 'spoken': ' '.join(sd)}
    here = os.path.dirname(os.path.abspath(__file__))
    for rid in ids:
        r = plan[rid]
        ref = toks(' '.join(re.sub(r'\[[^\]]+\]', '', l['t']) for l in r['lines']), dom)
        best = None
        for f in sorted(glob.glob(f'{P}/vo/{rid.lower()}_[a-z].mp3')):
            hyp = toks(' '.join(w['w'] for w in words(f, b.get('name'))), dom)
            sc = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False).ratio()
            if best is None or sc > best[0]:
                best = (sc, f)
        if not best:
            print(rid, 'NO TAKES in vo/'); continue
        vo = f'{P}/vo/{rid.lower()}.mp3'
        shutil.copy(best[1], vo)
        al = f'{P}/vo/{rid.lower()}_align.json'
        run(f'python3 {here}/align.py {rid} "{vo}" "{al}" "{P}/plan.json"')
        a = json.load(open(al))
        lines = a['lines']
        g = 0.42 if r.get('pace') == 'calm' else 0.3
        gaps = {l['k']: g for l in lines}
        if len(lines) > 1:
            gaps[lines[1]['k']] = 0.22
        close = lines[-1]
        subs = [[sd, b.get('domain', '')]] + r.get('captionSubs', []) + b.get('captionSubs', [])
        lay = {'lead': 0.05, 'gaps': gaps, 'tail': r.get('endHold', 1.9), 'overlap': round(close['end'] - close['start'], 3), 'subs': subs}
        lp = f'{P}/vo/{rid.lower()}_layout.json'
        jsave(lay, lp)
        out = run(f'python3 {here}/build_timeline.py {rid} "{al}" "{lp}" "{P}"')
        print(rid, 'take', os.path.basename(best[1]), round(best[0], 3), f"match {a['matchRate']}")
        print(out.strip()[-1500:])
        r['vo'] = os.path.relpath(vo, P)
        r['voScore'] = round(best[0], 3)
    allp = json.load(open(f'{P}/plan.json'))
    for x in allp['reels']:
        if x['id'] in ids and 'vo' in plan[x['id']]:
            x.update({k: plan[x['id']][k] for k in ('vo', 'voScore')})
    jsave(allp, f'{P}/plan.json')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
