"""Build the video timeline from an aligned voiceover.

python3 build_timeline.py <vid> <align.json> <layout.json>
layout.json: {"lead": 0.3, "gaps": {"<line k>": seconds_before_line, ...}, "tail": seconds_after_last_line,
              "endcard": seconds (end card length counted from last line end - overlap), "overlap": s}
python3 build_timeline.py <id> <align.json> <layout.json> <project_dir>
Writes <project>/data/v<id>.json and <project>/vo/<id>_placement.json
"""
import json, sys, re

# Display substitutions applied to caption words (sequence of spoken tokens -> display text).
SUBS = [
    (['eight', 'hundred', 'eighty', 'pounds'], '880 lb'), (['five', 'foot', 'three'], '5′3″'), (['six', 'foot', 'two'], '6′2″'),
    (['thirty', 'minutes', 'to', 'six', 'hours'], '30 minutes to 6 hours'), (['four', 'pm'], '4 p.m'), (['two', 'dollars'], '$2'), (['every', 'hundred'], 'every $100'),
    (['three', 'hundred'], '$300'), (['six', 'dollars'], '$6'), (['December', 'sixth'], 'December 6'), (['six-foot'], '6-foot'), (['two', 'feet'], '2 feet'),
    (['two', 'to', 'five'], '2 to 5'), (['two-seater'], '2-seater'), (['five', 'height'], '5 height'), (['eight', 'vibration'], '8 vibration'), (['seven-point'], '7-point'),
    (['over', 'seventy', 'dollars'], 'over $70'), (['over', 'a', 'hundred', 'dollars'], 'over $100'), (['over', 'a', 'hundred'], 'over $100'), (['a', 'hundred', 'dollars'], '$100'),
    (['nine', 'am'], '9 a.m'), (['three', 'pm'], '3 p.m'), (['Seven-point'], '7-point'),
    (['November', 'seventh'], 'November 7'), (['December', 'thirty-first'], 'December 31'), (['three-sixty'], '360°'), (['fifty-four-inch'], '54-inch'), (['November', 'nineteenth'], 'November 19'), (['November', 'twenty-ninth'], 'November 29'),
         (['seven-and-a-half-foot'], '7.5-foot'),
    (['eleven-and-a-half-foot'], '11.5-foot'),
    (['six-hour'], '6-hour'),
    (['eight-foot'], '8-foot'), (['nine-foot'], '9-foot'), (['five-foot'], '5-foot'),
    (['forty-six-inch'], '46-inch'),
    (['seventy-four', 'by', 'forty-eight', 'inch'], '74″ × 48″'),
    (['fifty-four-inch'], '54-inch'),
    (['a', 'hundred', 'and', 'thirty-five', 'degrees'], '135°'),
    (['sixteen', 'pairs'], '16 pairs'),
    (['three', 'hundred', 'and', 'fifty', 'pounds'], '350 lb'),
    (['twelve', 'months', 'to', 'five', 'years'], '12 months to 5 years'),
    (['three', 'and', 'up'], '3 and up'),
    (['three', 'to', 'six'], '3 to 6'),
    (['Fifteen', 'to', 'twenty'], '15–20 mmHg'),
    (['Twenty', 'to', 'thirty'], '20–30 mmHg'),
]

def strip(w):
    return re.sub(r'[^\w\-]', '', w)

ONES = {'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19}
TENS = {'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90}
def numword(w):
    w = w.lower()
    if w in ONES: return ONES[w]
    if w in TENS: return TENS[w]
    if '-' in w:
        a, b2 = w.split('-', 1)
        if a in TENS and b2 in ONES and ONES[b2] < 10: return TENS[a] + ONES[b2]
    return None
def money_pass(words):
    # 'save fifty-one (dollars)' -> 'save $51'; 'one hundred forty-seven' / 'one forty-seven' / 'a hundred' -> 147 / 147 / 100
    out, i = [], 0
    while i < len(words):
        out.append(words[i])
        prev = strip(words[i]['w']).lower()
        if prev in ('save', 'over') and i + 1 < len(words):
            j, val, used = i + 1, None, []
            toks = [strip(w['w']).lower() for w in words[j:j + 5]]
            k = 0
            if toks and toks[0] == 'a' and len(toks) > 1 and toks[1] == 'hundred':
                val, k = 100, 2
            elif toks and numword(toks[0]) is not None:
                v0 = numword(toks[0]); k = 1
                if len(toks) > 1 and toks[1] == 'hundred':
                    val, k = v0 * 100, 2
                    if len(toks) > 2 and numword(toks[2]) is not None: val += numword(toks[2]); k = 3
                elif v0 < 10 and len(toks) > 1 and numword(toks[1]) is not None and numword(toks[1]) >= 20:
                    val, k = v0 * 100 + numword(toks[1]), 2
                else:
                    val = v0
            has_d = j + k < len(words) and strip(words[j + k]['w']).lower() == 'dollars'
            if val is not None and prev == 'over' and not has_d and val < 100:
                val = None
            if val is not None:
                if has_d: k += 1
                last = words[j + k - 1]
                trail = re.sub(r'^.*?([.,!?:;…]*)$', r'\1', last['w'])
                out.append({'w': f'${val}' + trail, 's': words[j]['s'], 'e': last['e']})
                i = j + k
                continue
        i += 1
    return out

def pct_pass(words):
    # '<number words> percent' -> 'N%'
    out, i = [], 0
    while i < len(words):
        toks = [strip(w['w']).lower() for w in words[i:i + 4]]
        val, k = None, 0
        if toks and numword(toks[0]) is not None:
            val, k = numword(toks[0]), 1
            if len(toks) > 1 and numword(toks[1]) is not None and val >= 20 and numword(toks[1]) < 10:
                val, k = val + numword(toks[1]), 2
        if val is not None and i + k < len(words) and strip(words[i + k]['w']).lower() == 'percent':
            last = words[i + k]
            trail = re.sub(r'^.*?([.,!?:;…]*)$', r'\1', last['w'])
            out.append({'w': f'{val}%' + trail, 's': words[i]['s'], 'e': last['e']}); i += k + 1; continue
        out.append(words[i]); i += 1
    return out

def apply_subs(words, extra=None):
    words = pct_pass(money_pass(words))
    out, i = [], 0
    while i < len(words):
        hit = None
        for seq, disp in (extra or []) + SUBS:
            n = len(seq)
            if i + n <= len(words) and [strip(w['w']).lower() for w in words[i:i + n]] == [s.lower() for s in seq]:
                hit = (n, disp)
                break
        if hit:
            n, disp = hit
            trail = re.sub(r'^.*?([.,!?:;…]*)$', r'\1', words[i + n - 1]['w'])
            out.append({'w': disp + trail, 's': words[i]['s'], 'e': words[i + n - 1]['e']})
            i += n
        else:
            out.append(dict(words[i])); i += 1
    return out

def main(vid, align_path, layout_path, proj_dir):
    al = json.load(open(align_path))
    lay = json.load(open(layout_path))
    t = lay.get('lead', 0.3)
    lines, place = [], []
    for li, l in enumerate(al['lines']):
        gap = lay.get('gaps', {}).get(l['k'])
        if li > 0:
            t += gap if gap is not None else lay.get('defaultGap', 0.55)
        # source clip with small padding (never overlapping neighbours in the source)
        prev_end = al['lines'][li - 1]['end'] if li > 0 else 0.0
        next_start = al['lines'][li + 1]['start'] if li + 1 < len(al['lines']) else al['duration']
        src_s = max(prev_end + 0.02, l['start'] - 0.08)
        src_e = min(next_start - 0.02, l['end'] + 0.18)
        shift = t - l['start']
        words = [{'w': w['disp'], 's': round(w['s'] + shift, 3), 'e': round(w['e'] + shift, 3)} for w in l['words']]
        words = apply_subs(words, [(x[0], x[1]) for x in lay.get('subs', [])])
        lines.append({'k': l['k'], 'text': l['text'], 'start': round(t, 3), 'end': round(t + (l['end'] - l['start']), 3), 'words': words})
        place.append({'k': l['k'], 'src_s': round(src_s, 3), 'src_e': round(src_e, 3), 'at': round(src_s + shift, 3)})
        t = t + (l['end'] - l['start'])
    last_end = t
    end_start = last_end - lay.get('overlap', 1.2)
    total = max(last_end + lay.get('tail', 4.0), lay.get('minTotal', 0))
    data = {'id': vid, 'fps': 30, 'duration': round(total, 3), 'endCardStart': round(end_start, 3), 'lines': lines,
            'beats': lay.get('beats', {})}
    json.dump(data, open(f'{proj_dir}/data/v{vid}.json', 'w'), indent=1)
    json.dump({'vo': al['audio'], 'clips': place, 'total': total}, open(f'{proj_dir}/vo/{vid}_placement.json', 'w'), indent=1)
    print(f'v{vid}: total {total:.2f}s, end card from {end_start:.2f}s')
    for l in lines:
        print(f"  {l['k']:10} {l['start']:6.2f}-{l['end']:6.2f}  " + ' '.join(w['w'] for w in l['words'])[:90])

if __name__ == '__main__':
    main(*sys.argv[1:5])
