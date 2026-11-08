# Build carousels: HTML per slide -> PNG 1080x1350 via Playwright.
# python3 carousel.py <project>   (reads carousels.json, images relative to the project; writes out/carousels/<folder>/)
import json, re, sys, html, pathlib, asyncio, os
from playwright.async_api import async_playwright

P = pathlib.Path(sys.argv[1]).resolve()
B = json.load(open(P / 'brand.json'))
F = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'fonts'
LOGO = str(P / B['logos'].get('mark', B['logos'].get('full', '')))
_c = B.get('colors', {})
CREAM, CHAR, MUST, FOREST = _c.get('light', '#F8F6F1'), _c.get('ink', '#24231F'), _c.get('accent', '#D9973A'), _c.get('primary', '#3B6347')
NAME, DOMAIN = B.get('name', ''), B.get('domain', '')

def mark(t):
    t = html.escape(t)
    t = re.sub(r'\*(.+?)\*', rf'<span style="color:{MUST}">\1</span>', t)
    return t.replace('\n', '<br>').replace('-', '\u2011')

CSS = f"""
@font-face{{font-family:P;font-weight:900;src:url(file://{F}/poppins-latin-900-normal.woff2)}}
@font-face{{font-family:P;font-weight:800;src:url(file://{F}/poppins-latin-800-normal.woff2)}}
@font-face{{font-family:P;font-weight:600;src:url(file://{F}/poppins-latin-600-normal.woff2)}}
@font-face{{font-family:P;font-weight:500;src:url(file://{F}/poppins-latin-500-normal.woff2)}}
@font-face{{font-family:P;font-weight:400;src:url(file://{F}/poppins-latin-400-normal.woff2)}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;overflow:hidden;font-family:P,sans-serif;background:{CREAM};color:{CHAR};position:relative}}
.bg{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.top{{position:absolute;left:0;right:0;top:0;padding:56px 64px 0;display:flex;justify-content:space-between;align-items:center;z-index:5}}
.tag{{background:{FOREST};color:#fff;font-weight:700;font-size:30px;padding:12px 26px 12px 16px;border-radius:999px;display:flex;align-items:center;gap:10px;font-weight:600}}
.tag img{{height:40px;width:40px;border-radius:50%;background:#fff;padding:4px}}
.num{{font-weight:600;font-size:30px;letter-spacing:1px}}
.h{{font-weight:900;line-height:1.04;letter-spacing:-1.5px}}
.sub{{font-weight:500;font-size:40px;line-height:1.3;margin-top:26px}}
.foot{{position:absolute;left:64px;right:64px;bottom:52px;display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:30px;z-index:5}}
.swipe{{display:flex;align-items:center;gap:10px}}
.card{{background:#fff;border-radius:40px;box-shadow:0 18px 50px rgba(36,35,31,.12);overflow:hidden;position:relative}}
.card img{{width:100%;height:100%;object-fit:contain}}
.badge{{position:absolute;width:250px;height:250px;border-radius:50%;background:{MUST};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 14px 34px rgba(0,0,0,.18);transform:rotate(-8deg)}}
.badge .a{{font-weight:600;font-size:30px;line-height:1}}
.badge .b{{font-weight:900;font-size:78px;line-height:1.02}}
.badge .c{{font-weight:600;font-size:26px;line-height:1}}
.pname{{font-weight:600;font-size:32px;margin-top:22px;color:#4a4842}}
.pill{{display:inline-block;background:{FOREST};color:#fff;font-weight:800;font-size:44px;padding:26px 54px;border-radius:999px;margin-top:44px}}
.emoji{{font-size:130px;line-height:1;margin-bottom:24px;font-family:'Noto Color Emoji',sans-serif}}
.kick{{font-weight:800;font-size:34px;letter-spacing:3px;text-transform:uppercase;color:{FOREST};margin-bottom:22px}}
"""

def head(i, n, light):
    col = '#fff' if light else CHAR
    return (f'<div class="top"><div class="tag"><img src="file://{LOGO}">{html.escape(NAME)}</div>'
            f'<div class="num" style="color:{col}">{i}/{n}</div></div>')

def foot(i, n, light):
    col = '#fff' if light else CHAR
    sw = '' if i == n else f'<div class="swipe">Swipe <span style="font-size:40px">→</span></div>'
    return f'<div class="foot" style="color:{col}"><div>{html.escape(DOMAIN)}</div>{sw}</div>'

def chip(s):
    if not s.get('chip'): return ''
    return (f'<div style="position:absolute;right:64px;top:{s.get("chipY",150)}px;z-index:6;background:#fff;color:{CHAR};border:5px solid {MUST};'
            f'border-radius:50%;width:190px;height:190px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:58px;'
            f'transform:rotate(8deg);box-shadow:0 10px 26px rgba(0,0,0,.2)">{html.escape(s["chip"])}</div>')

def deal(s):
    d = s.get('deal')
    if not d: return ''
    pos = s.get('dealPos', 'bl')
    place = {'bl': 'left:64px;bottom:150px', 'br': 'right:64px;bottom:150px', 'tr': 'right:64px;top:150px'}[pos]
    up, pct = d
    return (f'<div style="position:absolute;{place};z-index:7;background:{MUST};color:{CHAR};border:5px solid {CHAR};border-radius:26px;'
            f'padding:18px 34px 16px;transform:rotate(-4deg);box-shadow:0 12px 0 rgba(0,0,0,.28);font-family:P;text-align:center;line-height:.95">'
            f'<div style="font-weight:800;font-size:40px;letter-spacing:3px">{html.escape(up)}</div>'
            f'<div style="font-weight:900;font-size:118px;letter-spacing:-2px">{html.escape(pct)}</div>'
            f'<div style="font-weight:900;font-size:50px;letter-spacing:4px">OFF</div></div>')

def slide(s, i, n):
    return slide0(s, i, n) + chip(s) + deal(s)

def slide0(s, i, n):
    t = s['t']
    size = s.get('size', 96)
    if t == 'photo':
        pos = s.get('pos', 'top')
        grad = ('linear-gradient(180deg,rgba(20,18,14,.72) 0%,rgba(20,18,14,.35) 42%,rgba(20,18,14,0) 62%,rgba(20,18,14,0) 84%,rgba(20,18,14,.5) 100%)' if pos == 'top'
                else 'linear-gradient(0deg,rgba(20,18,14,.78) 0%,rgba(20,18,14,.35) 45%,rgba(20,18,14,0) 65%,rgba(20,18,14,0) 82%,rgba(20,18,14,.55) 100%)')
        place = 'top:170px' if pos == 'top' else 'bottom:150px'
        body = (f'<img class="bg" src="file://{P}/{s["bg"]}" style="object-position:{s.get("op","center")}">'
                f'<div style="position:absolute;inset:0;background:{grad}"></div>'
                f'<div style="position:absolute;left:64px;right:64px;{place};color:#fff;text-shadow:0 3px 18px rgba(0,0,0,.35)">'
                + (f'<div class="kick" style="color:#fff;opacity:.9">{mark(s["kick"])}</div>' if s.get('kick') else '')
                + f'<div class="h" style="font-size:{size}px">{mark(s["h"])}</div>'
                + (f'<div class="sub">{mark(s["sub"])}</div>' if s.get('sub') else '') + '</div>')
        return head(i, n, True) + body + foot(i, n, True)
    if t == 'cream':
        body = ('<div style="position:absolute;left:72px;right:72px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">'
                + (f'<div class="emoji">{s["emoji"]}</div>' if s.get('emoji') else '')
                + (f'<div class="kick">{mark(s["kick"])}</div>' if s.get('kick') else '')
                + f'<div class="h" style="font-size:{size}px">{mark(s["h"])}</div>'
                + (f'<div class="sub">{mark(s["sub"])}</div>' if s.get('sub') else '') + '</div>')
        return head(i, n, False) + body + foot(i, n, False)
    if t == 'product':
        sz = s.get('size', 76)
        body = (f'<div style="position:absolute;left:72px;right:72px;top:150px">'
                + (f'<div class="kick">{mark(s["kick"])}</div>' if s.get('kick') else '')
                + f'<div class="h" style="font-size:{sz}px">{mark(s["h"])}</div></div>'
                f'<div class="card" style="position:absolute;left:150px;top:{s.get("ct",470)}px;width:780px;height:{s.get("ch",640)}px">'
                f'<img src="file://{P}/{s["img"]}" style="padding:30px"></div>'
                f'<div class="badge" style="right:70px;top:{s.get("ct",470)-90}px"><div class="a">Save</div><div class="b">${s["save"]}</div><div class="c">{s["pct"]}% off</div></div>'
                f'<div class="pname" style="position:absolute;left:150px;right:150px;top:{s.get("ct",470)+s.get("ch",640)+4}px;text-align:center">{mark(s["name"])}</div>')
        return head(i, n, False) + body + foot(i, n, False)
    if t == 'cta':
        body = ('<div style="position:absolute;left:72px;right:72px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start">'
                + (f'<div class="emoji">{s["emoji"]}</div>' if s.get('emoji') else '')
                + f'<div class="h" style="font-size:{size}px">{mark(s["h"])}</div>'
                + (f'<div class="sub">{mark(s["sub"])}</div>' if s.get('sub') else '')
                + f'<div class="pill">{mark(s.get("btn", B.get("cta", "Shop " + DOMAIN)))}</div>'
                + (f'<div class="sub" style="font-size:30px;color:#6b685f;margin-top:30px">{mark(s["fine"])}</div>' if s.get('fine') else '')
                + '</div>')
        return head(i, n, False) + body + foot(i, n, False)
    raise ValueError(t)

def words(s):
    txt = ' '.join(str(s.get(k, '')) for k in ('kick', 'h', 'sub', 'name', 'btn'))
    return len(re.findall(r"[A-Za-z0-9$%'’]+", txt.replace('*', '')))

async def main(only=None):
    spec = json.load(open(P / 'carousels.json'))
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1080, 'height': 1350})
        for cid, c in spec.items():
            if only and cid not in only: continue
            n = len(c['slides'])
            od = P / 'out' / 'carousels' / c['folder']; od.mkdir(parents=True, exist_ok=True)
            for i, s in enumerate(c['slides'], 1):
                w = words(s)
                if w > 15: print(f'WARN {cid} slide {i}: {w} words')
                doc = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{slide(s, i, n)}</body></html>'
                hd = P / 'out' / 'carousels' / '_html'; hd.mkdir(parents=True, exist_ok=True); hp = hd / f'{cid}_{i}.html'; hp.write_text(doc)
                await pg.goto(f'file://{hp}'); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(150)
                await pg.screenshot(path=str(od / f'{cid}_slide{i:02d}.png'))
            print(cid, n, 'slides')
        await b.close()

asyncio.run(main(sys.argv[2:] or None))
