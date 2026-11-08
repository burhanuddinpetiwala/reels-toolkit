"""Write the mix spec (music + SFX cue sheet) for a Reel from its scene spec and timeline.
python3 mixgen.py <project> <ID>
Music: plan reel "music" (path in project) or music/<id>.mp3 or music/default.mp3. "musicDb" overrides -20 dB."""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import proj, plan as load_plan, jsave


def wt(d, a):
    L = [l for l in d['lines'] if l['k'] == a[0]][0]
    if len(a) < 2 or not a[1]:
        return L['start']
    hits = [w for w in L['words'] if re.sub(r'[^a-z0-9.\-″×°–$%]', '', w['w'].lower()).startswith(str(a[1]).lower())]
    n = a[2] if len(a) > 2 else 0
    return (hits[n] if n < len(hits) else hits[-1])['s'] if hits else L['start']


def main(P, id):
    P = proj(P)
    S = json.load(open(f'{P}/specs.json'))
    r = load_plan(P)[id]
    d = json.load(open(f'{P}/data/v{id}.json'))
    sfx = []
    A = lambda n, t, db: sfx.append({'name': n, 'at': round(max(0, t), 3), 'db': db})
    s = S[id]
    end = d['endCardStart']
    for i, sc in enumerate(s['scenes']):
        t = 0 if i == 0 else wt(d, sc['at'])
        if t >= end:
            continue
        ty = sc['type']
        if i > 0:
            A(['page_turn', 'paper_swish', 'whoosh_soft'][i % 3], t, -15)
        if ty == 'slam':
            for j, l in enumerate(sc['lines']):
                lt = wt(d, l['at']) if l.get('at') else (t if j == 0 else t + j * 0.3)
                A('stamp' if j == 0 else 'soft_thud', lt, -14 if j == 0 else -15)
            for h in sc.get('heroes', []):
                A('hop', (wt(d, h['at']) if isinstance(h.get('at'), list) else 0.05), -19)
        if ty == 'clip':
            A('whoosh_soft', t, -16)
        if ty in ('hook', 'cta', 'offer') and sc.get('stickers'):
            for k, _ in enumerate(sc['stickers']):
                A('hop', t + 0.15 + k * 0.12, -20)
        if sc.get('stamp'):
            A('stamp', wt(d, sc['stampAt']) if sc.get('stampAt') else t + 0.6, -13)
        if ty == 'flash':
            for it in sc['items']:
                ti = wt(d, [it.get('line', sc['at'][0]), it.get('w'), it.get('n', 0)])
                A('stamp', ti, -16)
                if it.get('save'):
                    A('pop', ti + 0.25, -14)
        if ty == 'offer':
            A('pop', t + 0.1, -15)
        if ty in ('product', 'chapter') and sc.get('src'):
            A('soft_thud', t + 0.3, -17)
        if sc.get('save'):
            A('pop', wt(d, sc['saveAt']) if sc.get('saveAt') else t + 0.7, -13)
        for c in sc.get('chips', []):
            A('pop', wt(d, c['at']) if c.get('at') else t + 0.6, -19)
        if 'date' in sc:
            A('soft_thud', (wt(d, sc['date']['at']) if sc['date'].get('at') else t + 0.4) + 0.2, -15)
        if ty == 'list':
            for it in sc['items']:
                A('pencil', wt(d, it['at']) + 0.35, -17)
        if ty == 'photos':
            for it in sc['items']:
                A('camera_shutter', wt(d, it['at']), -20)
                if it.get('save'):
                    A('pop', wt(d, it['at']) + 0.4, -14)
        if sc.get('button'):
            A('cat_bell', wt(d, sc['buttonAt']), -15)
    A('sparkle', end, -14)
    A('stamp', end + 0.9, -16)
    A('knob_click', end + 2.25, -14)
    m = r.get('music') or next((x for x in (f'music/{id.lower()}.mp3', 'music/default.mp3') if os.path.exists(f'{P}/{x}')), None)
    if not m:
        sys.exit(f'{id}: no music. Put music/{id.lower()}.mp3 or music/default.mp3 in the project, or set "music" in plan.json')
    spec = {'music': os.path.join(P, m), 'music_mode': 'head', 'vo_presence': True, 'music_offset': 0.0, 'music_db': r.get('musicDb', -20),
            'fade_out': 1.6, 'fade_in': 0.05, 'music_gain': [], 'sfx': sorted(sfx, key=lambda x: x['at']), 'ambience': []}
    jsave(spec, f'{P}/mix/{id}_mixspec.json')
    print(id, len(sfx), 'sfx')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
