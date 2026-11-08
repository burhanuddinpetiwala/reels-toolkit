"""Package everything for delivery: one folder per post + README, split into zips under 380 MB.
python3 package.py <project> [name]
Per Reel (plan.json): out/<ID>.mp4, out/cover_<ID>.png, data/v<ID>.json (SRT), "caption": {"ig","fb","tags","story"}, "link", "date", "title".
Also picks up out/ads/, out/stories/, out/carousels/ (+ carousels_captions.md), SAVINGS_SHEET.md, README.md (project root)."""
import json, os, re, shutil, sys, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import proj, brand as load_brand

LIMIT = 380 * 1024 * 1024


def srt(d):
    def ts(t):
        h, m = int(t // 3600), int(t % 3600 // 60); s = t % 60
        return f'{h:02}:{m:02}:{int(s):02},{int(round((s - int(s)) * 1000)):03}'
    out, n = [], 1
    for l in d['lines']:
        ws = l['words']
        for i in range(0, len(ws), 6):
            ch = ws[i:i + 6]
            out.append(f"{n}\n{ts(ch[0]['s'])} --> {ts(ch[-1]['e'])}\n{' '.join(w['w'] for w in ch)}\n"); n += 1
    return '\n'.join(out)


def slug(s):
    return re.sub(r'[^A-Za-z0-9]+', '_', s).strip('_')[:40]


def main(P, name=None):
    P = proj(P)
    b = load_brand(P)
    plan = json.load(open(f'{P}/plan.json'))
    name = name or slug(f"{b.get('name', 'Brand')}_{plan.get('campaign', 'campaign')}")
    D = f'{P}/deliver/{name}'
    shutil.rmtree(D, ignore_errors=True); os.makedirs(f'{D}/Reels')
    for r in plan['reels']:
        mp4 = f"{P}/out/{r['id']}.mp4"
        if not os.path.exists(mp4):
            print('skip (not rendered)', r['id']); continue
        f = slug(f"{r['id']}_{r.get('date', '')}_{r.get('title', '')}")
        od = f'{D}/Reels/{f}'; os.makedirs(od)
        shutil.copy(mp4, f'{od}/{f}.mp4')
        if os.path.exists(f"{P}/out/cover_{r['id']}.png"):
            shutil.copy(f"{P}/out/cover_{r['id']}.png", f'{od}/cover_{f}.png')
        if os.path.exists(f"{P}/data/v{r['id']}.json"):
            open(f'{od}/captions.srt', 'w').write(srt(json.load(open(f"{P}/data/v{r['id']}.json"))))
        c = r.get('caption', {})
        md = [f"# {r['id']} · {r.get('date', '')} · {r.get('title', '')}", '', f"**Link:** {r.get('link', 'https://' + b.get('domain', ''))}", '',
              '**Instagram caption**', c.get('ig', ''), '', c.get('tags', ''), '', '**Facebook caption**', c.get('fb', c.get('ig', '')), '']
        if c.get('story'): md += [f"**Story:** {c['story']}", '']
        if b.get('aiLabel', True): md += ['**Before posting:** turn on the AI label (Instagram/Facebook: *AI info*). The voiceover is AI-generated.']
        open(f'{od}/post_copy.md', 'w').write('\n'.join(md) + '\n')
    for sub, dst in (('out/ads', 'Ads'), ('out/stories', 'Stories'), ('out/carousels', 'Carousels')):
        if os.path.isdir(f'{P}/{sub}'):
            shutil.copytree(f'{P}/{sub}', f'{D}/{dst}', ignore=shutil.ignore_patterns('_html', '*_silent.mp4', '*_raw.mp4'))
    for x in ('README.md', 'SAVINGS_SHEET.md', 'AD_COPY.md', 'carousels_captions.md'):
        if os.path.exists(f'{P}/{x}'):
            shutil.copy(f'{P}/{x}', D)
    # zip, split by top-level folders when large
    files = [os.path.join(dp, fn) for dp, _, fns in os.walk(D) for fn in fns]
    parts, cur, size = [], [], 0
    for fp in sorted(files):
        sz = os.path.getsize(fp)
        if cur and size + sz > LIMIT:
            parts.append(cur); cur, size = [], 0
        cur.append(fp); size += sz
    parts.append(cur)
    for i, part in enumerate(parts, 1):
        zp = f'{P}/deliver/{name}' + (f'_part{i}' if len(parts) > 1 else '') + '.zip'
        with zipfile.ZipFile(zp, 'w', zipfile.ZIP_STORED) as z:
            for fp in part:
                z.write(fp, os.path.relpath(fp, D))
        print(zp, round(os.path.getsize(zp) / 1e6, 1), 'MB')


if __name__ == '__main__':
    main(*sys.argv[1:])
