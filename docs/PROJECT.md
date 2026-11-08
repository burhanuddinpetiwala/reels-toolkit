# Project folder

There is one folder per brand campaign. It lives outside the toolkit, for example `~/reels-projects/<brand>/<campaign>/`. Start from `examples/sample-project/`.

```
brand.json        colours, fonts, logos, domain, voice map (one per brand: copy it between campaigns)
plan.json         every post: id, date, audience, voice, script lines, products, captions, link
products.json     real products: name, url, price, check date      -> rt/savings.py
specs.json        scene spec per Reel (docs/SPEC.md)
ads.json          paid ads (optional)
stories.json      Story frames (optional)
carousels.json    carousels (optional)
assets/           logo files, product cut-outs (PNG), photos, clips (mp4)
vo/               voiceover takes <id>_a.mp3, <id>_b.mp3 ...   (written by you / the skill)
music/            default.mp3 or <id>.mp3
data/ mix/ out/ qa/ deliver/   generated
```

## brand.json
```json
{
  "name": "ValuHub", "domain": "ValuHub.ca", "domainSpoken": "ValuHub dot C A", "cta": "Shop ValuHub.ca",
  "issueKicker": "VALUHUB · NOVEMBER", "currency": "$", "aiLabel": true,
  "colors": {"primary": "#1F4A32", "primaryDeep": "#143523", "accent": "#E0A526", "accentDeep": "#B9821A",
             "light": "#FBF6EC", "paper": "#F3EAD7", "ink": "#1B231D", "highlight": "#006400"},
  "fonts": {"display": "Archivo Black", "body": "Inter", "script": "Caveat", "serif": "Fraunces"},
  "logos": {"mark": "assets/logo_mark.png", "word": "assets/logo_word.png", "full": "assets/logo.png", "white": "assets/logo_white.png"},
  "voices": {"default": {"id": "<elevenlabs voice id>", "name": "Kyle"}, "calm": {"id": "...", "name": "Kathryn"}},
  "rules": ["No medical claims", "Show savings, not prices"],
  "captionSubs": [[["eight", "hundred", "eighty", "pounds"], "880 lb"]]
}
```
- `primaryDeep` must be dark enough for cream text, and `accent` must read on `primary`.
- `logos.mark` is a square icon (used in pills); `word` is the wordmark next to it; `white` is for dark backgrounds.
- Fonts available without extra work: Archivo Black, Inter, Fraunces, Caveat, Fredoka, DM Serif Display, Playfair Display, Bebas Neue, Abril Fatface, Special Elite, Chewy, Bowlby One, Limelight.

## plan.json
```json
{"brand": "ValuHub", "campaign": "black-friday-2026",
 "reels": [{
   "id": "R03", "date": "2026-11-07", "title": "Early deals are live", "audience": "renters & hosts",
   "voice": "default", "tone": "excited", "pace": "normal",
   "lines": [{"k": "hook", "t": "It's live! Up to forty percent off, starting now."},
             {"k": "fire", "t": "Cozy nights in? This electric fireplace: save one hundred sixty-three dollars."},
             {"k": "close", "t": "Ends November nineteenth. Don't wait, grab yours today at ValuHub dot C A."}],
   "products": [{"key": "fireplace", "pct": 40}],
   "music": "music/r03.mp3",
   "link": "https://valuhub.ca/collections/black-friday",
   "caption": {"ig": "...", "fb": "...", "tags": "#...", "story": "Poll sticker: ..."}
 }]}
```
- Write lines **as spoken**: "forty percent", "one hundred sixty-three dollars", "ValuHub dot C A". The captions turn them into 40%, $163 and ValuHub.ca.
- The last line is always `close`; the end card appears with it.
- 2.7 words per second is roughly right: 50–70 words for a 20–28 s Reel.

## Pipeline (what each command writes)
1. `rt/savings.py P` reads products.json and plan → savings.json, SAVINGS_SHEET.md
2. Voiceover takes go in `vo/<id>_a.mp3`, `_b.mp3` (ElevenLabs, 2 takes).
3. `rt/vo_pick.py P ID...` picks the best take → `data/v<ID>.json` (caption and scene timing)
4. Write `specs.json` (docs/SPEC.md).
5. `rt/render.sh P ID...` produces `out/<ID>.mp4`, `out/cover_<ID>.png` and `qa/v<ID>_qa.json` + `qa/v<ID>_sheet.jpg`. A Reel PASSes when it is −16 to −12 LUFS, true peak ≤ −1 dBTP, speech match ≥ 0.85 and has no black frames.
6. Optional extras:
   - `rt/ad_prep.py P adId` then `rt/render_ad.sh P adId` → `out/ads/<adId>_9x16|1x1|16x9.mp4`
   - `rt/stories.sh P` → `out/stories/*.png`
   - `rt/carousel.py P` → `out/carousels/<folder>/*.png`
7. `rt/package.py P [name]` → `deliver/<name>.zip`, split under 380 MB.
