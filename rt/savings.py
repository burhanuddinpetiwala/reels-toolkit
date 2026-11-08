"""Dollar savings from real prices.  Rule: saving = price x pct, always rounded DOWN to the whole dollar,
so a post never overstates a saving.
  python3 savings.py <project>                 -> savings.json + SAVINGS_SHEET.md from plan.json reels' "products"
  python3 savings.py <project> <key> <pct>     -> print one saving
products.json: {"<key>": {"name": "...", "url": "https://...", "price": 408.70, "checked": "2026-11-07"}}
plan.json reel: "products": [{"key": "fireplace", "pct": 40}, ...]"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import proj, jsave, brand as load_brand


def save(price, pct):
    return math.floor(round(price * pct / 100, 2))


def main(P, *a):
    P = proj(P)
    prods = json.load(open(f'{P}/products.json'))
    if a:
        x = prods[a[0]]
        print(a[0], x['price'], a[1], '% ->', save(x['price'], float(a[1])))
        return
    plan = json.load(open(f'{P}/plan.json'))
    cur = load_brand(P).get('currency', '$')
    out, rows = {}, []
    for r in plan['reels']:
        for it in r.get('products', []):
            x = prods[it['key']]
            v = save(x['price'], it['pct'])
            out.setdefault(r['id'], []).append({'key': it['key'], 'name': x['name'], 'price': x['price'], 'pct': it['pct'], 'save': v, 'exact': round(x['price'] * it['pct'] / 100, 2), 'url': x.get('url', '')})
            rows.append(f"| {r['id']} ({r.get('date', '')}) | [{x['name']}]({x.get('url', '')}) | {cur}{x['price']} (checked {x.get('checked', '?')}) | {it['pct']}% | Save {cur}{v} |")
    jsave(out, f'{P}/savings.json')
    L = ['# Savings shown in this campaign', '', 'Saving = live price on the check date × the % shown, rounded **down** to the whole dollar. '
         '**Each product must really sell at that % on the posting date.** Re-check prices before posting.', '',
         '| Post | Product | Price | Discount needed | Shown |', '|---|---|---|---|---|'] + rows
    open(f'{P}/SAVINGS_SHEET.md', 'w').write('\n'.join(L) + '\n')
    print(len(rows), 'rows ->', f'{P}/SAVINGS_SHEET.md')


if __name__ == '__main__':
    main(*sys.argv[1:])
