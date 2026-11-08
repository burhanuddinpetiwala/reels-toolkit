# Ads, Stories, carousels

## ads.json (paid ads, rendered as 9:16 + 1:1 + 16:9, about 15–18 s)
```json
[{"id": "ebf", "voTake": "vo/ad_ebf_a.mp3", "music": "project/music/default.mp3",
  "pct": "40%", "endsText": "Ends Nov 19", "phase": "Early Black Friday",
  "hero": "project/assets/photos/fire_life.jpg", "heroPos": "30% 50%",
  "hook1": "Wait.", "hook2": ["Black Friday deals", "already started?!"], "yes": "Yes!", "kicker": "Up to", "offWord": "Off", "button": "Shop now →",
  "anchors": {"hook2": "black", "yes": "yes", "up": "up", "items": [["fireplace", "save"], ["sofa", "save"], ["snowy", "save"]], "ends": "ends", "shop": "shop"},
  "items": [{"src": "project/assets/p/fireplace.png", "name": "Electric fireplace", "save": "$163", "h": 640}, {"...": "exactly 3 items"}]}]
```
- **Ad voiceover script shape:** "Wait! <hook2>? Yes! Up to forty percent off, right now! <Item 1>: save <x>! <Item 2>: save <y>! <Item 3>: save <z>! Ends <date>. Shop now at <domain spoken>!"
- Use a high-energy announcer voice and the tag `[very excited, high energy, fast-paced announcer]`. The user preferred a radio-DJ energy over the Reel narrator for ads.
- `rt/ad_prep.py` trims pauses, speeds the take up by 5%, finds the anchors and writes `T` and `vo`. Then run `rt/render_ad.sh`.
- Ad copy for Meta (primary text, headline ≤40, description) and Google (5 headlines ≤30, long headline ≤90, 2 descriptions ≤90) goes in `AD_COPY.md`.

## stories.json (1080×1920 PNG frames for Instagram/Facebook Stories)
```json
[{"id": "S-1107-2", "phase": "Early Black Friday", "bg": "forest", "title": ["Deal or", "no deal?"], "kicker": null,
  "products": [{"src": "project/assets/p/fireplace.png", "h": 600, "x": 540, "y": 1150, "rot": 0}],
  "zone": "EMOJI SLIDER 🔥", "zoneY": 1180, "badge": ["UP TO", "40%", "OFF"], "badgeX": 780, "badgeY": 560, "plain": false, "photo": null}]
```
- `zone` is a dashed box that marks where to drop an interactive sticker (poll, quiz, slider, link, countdown).
- Use 3 frames a day: a teaser, an interactive frame and a link frame. Set `plain: true` for greetings with no offer.
- Ids must be letters, numbers and dashes only.

## carousels.json (1080×1350 PNG slides)
```json
{"C1": {"folder": "C1_Tree_Red_Flags", "slides": [
  {"t": "photo", "bg": "assets/photos/tree.jpg", "pos": "top", "kick": "Early Black Friday", "h": "Cozy nights,\n*40% off*", "deal": ["UP TO", "40%"]},
  {"t": "cream", "emoji": "🚩", "kick": "Red flag", "h": "The tree that blocks the hallway", "sub": "Measure first."},
  {"t": "product", "kick": "Pick 1", "h": "Electric fireplace", "img": "assets/p/fireplace.png", "save": 163, "pct": 40, "name": "46\" fireplace with mantel"},
  {"t": "cta", "h": "Ends *Nov 19*.", "sub": "Up to *40%* off.", "btn": "Shop ValuHub.ca", "deal": ["UP TO", "40%"], "dealPos": "br"}]}}
```
- `*text*` is drawn in the accent colour, and `\n` breaks the line.
- Keep each slide to 15 words or fewer; the builder warns when a slide goes over.
- Use 5–7 slides, with the hook first and the CTA last.
- Write the captions in `carousels_captions.md`.
