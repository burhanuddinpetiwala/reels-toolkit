"""Shared paths and helpers. A *project* is one brand campaign folder (see docs/PROJECT.md)."""
import json, os, subprocess, sys

RT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # toolkit root
REMOTION = os.path.join(RT, 'remotion')
SFX_DIR = os.path.join(RT, 'assets', 'sfx')


def proj(path):
    p = os.path.abspath(path)
    if not os.path.exists(os.path.join(p, 'brand.json')):
        sys.exit(f'not a project (no brand.json): {p}')
    for d in ('vo', 'data', 'mix', 'out', 'qa', 'music', 'assets'):
        os.makedirs(os.path.join(p, d), exist_ok=True)
    return p


def jload(p, default=None):
    if default is not None and not os.path.exists(p):
        return default
    return json.load(open(p))


def jsave(obj, p):
    json.dump(obj, open(p, 'w'), indent=1, ensure_ascii=False)


def plan(p):
    return {r['id']: r for r in jload(os.path.join(p, 'plan.json'))['reels']}


def brand(p):
    return jload(os.path.join(p, 'brand.json'))


def spoken_domain(b):
    """How the voiceover says the domain, e.g. ['ValuHub','dot','C','A'] for ValuHub.ca."""
    if b.get('domainSpoken'):
        return b['domainSpoken'].split()
    name, _, tld = b.get('domain', '').partition('.')
    return [name, 'dot'] + ([c.upper() for c in tld] if len(tld) <= 3 else [tld])


def run(c, check=True):
    r = subprocess.run(c, shell=True, capture_output=True, text=True)
    if check and r.returncode:
        print(r.stdout[-800:], r.stderr[-1500:])
        raise SystemExit(f'failed: {c}')
    return r.stdout


def duration(f):
    return float(run(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{f}"').strip())
