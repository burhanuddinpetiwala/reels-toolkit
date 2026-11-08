# Reel scene spec (`specs.json`)

`specs.json` maps each Reel id to a spec. The canvas is 1080×1920 at 30 fps. Every scene starts on a **voiceover word**, so the visuals stay in sync with the audio automatically.

```json
{
  "R03": {
    "phase": "Early Black Friday",
    "ticker": "EARLY BLACK FRIDAY · UP TO 40% OFF · ENDS NOV 19 · BRAND.COM",
    "scenes": [ ... ],
    "end": {"tagline": ["Don't wait.", "Grab yours today."], "line": "Early Black Friday", "bigLines": ["Up to", "40% off"],
            "ends": "Ends Nov 19", "note": "+ free shipping on most items", "products": ["project/assets/p/fireplace.png"]},
    "cover": {"photo": "project/assets/photos/fire_life.jpg", "photoPos": "30% 50%", "kicker": "it's live",
              "title": ["Early", "Black Friday"], "badge": ["UP TO", "40%", "OFF"], "badgeX": 700, "badgeY": 1060, "ends": "Ends Nov 19"},
    "snow": false
  }
}
```

## Fields

- **phase** is the small black tag shown top-left for the whole Reel.
- **ticker** is the scrolling text on the green "floor" strip.
- **end** is the end card. It starts with the last voice line, which is the `close` line.
  - `tagline` is two italic lines.
  - `bigLines` is the big offer, two parts with the second in the accent colour.
  - `ends` is the urgency pill, and `note` is the small extra line.
  - `products` is the shelf of up to 3 cut-outs.
  - `plain: true` gives a no-offer end card, for holiday greetings.
- **cover** is the 1080×1920 still `C-<ID>`. Keep its text between y 300 and y 1640 so it survives the 4:5 grid crop.

## Timing anchors

`"at": ["lineKey", "wordPrefix", n]` is the n-th word in that line starting with the prefix.
- `["hook"]` means the start of the line.
- Prefixes match the caption words after substitution. "save one hundred sixty-three" becomes `$163` and "forty percent" becomes `40%`, so you anchor on `"$"` or `"40"`.
- An anchor that doesn't match falls back to the start of the line. Check the frames.

The first scene always starts at 0. Each later scene runs from its `at` until the next scene's.

## Scene types

| type | Use | Key fields |
|---|---|---|
| `slam` | **Hook (first 3 s)**, punchy stacked lines over a clip, photo or colour | `clip` (mp4) or `photo`, `dim` 0.2–0.4, `y`, `lines:[{t, at, size?, bg?, color?}]`, `heroes:[{src,at,x,y,h,rot}]`, `stamp`/`stampAt`/`stampY`/`stampSize`, `save`/`pct`/`saveAt`/`saveX`/`saveY` |
| `hook` | Torn-paper headline built word by word, with sticker products | `words[]`, `size`, `y`, `stickers[]`, `stamp`, `stampAt` |
| `clip` | Full-bleed video with a label and chips | `clip`, `label`, `lx`/`ly`, `chips:[{text, at, x?, y?, size?, bg?}]`, `hero`, `save` |
| `product` / `chapter` | One product: cut-out plus feature chips. `chapter` adds a big number. | `title`, `num`, `src` (cut-out), `x`, `y`, `h`, `photo` (inset lifestyle), `chips[]`, `labels[]`, `save`, `pct`, `saveAt`, `stamp` |
| `flash` | Rapid product list, one product per spoken word, with colour pops | `kicker`, `items:[{src, w (word prefix), line?, label, h?, y?, save?, pct?, sx?, sy?}]` |
| `photos` | Sequence of big photos, each with a label | `items:[{src, at, label, save?, pct?, chip?, x?, y?, w?, h?}]` |
| `offer` | Hanging swing tag with the big % | `kicker` ("Up to"), `big` ("40%"), `bigSub` ("OFF"), `chips[]` (the small extras line), `stickers[]`, `date:{month, day, dow, at}` |
| `list` | Checklist with ticks | `title[]`, `items:[{n, text, at}]`, `fs`, `y0`, `dy` |
| `cta` | Closing headline plus a tappable button | `words[]`, `button`, `done`, `buttonAt`, `stickers[]`, `date{}` |
| `cover` | Magazine "Issue" masthead | `bg` (photo), `title`, `stamp` |

Common to all scenes: `bg` is one of `cream`, `paper`, `forest`, `deep`, `mustard` or `black`. These are colour roles from brand.json: forest = primary, mustard = accent, cream/paper = light. `floor: false` hides the ticker strip.

Asset paths always start with `project/`, for example `project/assets/p/sofa.png`. Product cut-outs should be transparent PNGs; photos and clips are full-bleed.

## Layout rules that held up in QA
- Safe area: keep text between x 70–930 and y 270–1250. The bottom 670 px is covered by the Instagram UI, and captions sit at y 1236.
- Hook: give the slam lines 2–3 words each, with the % stamp at `stampY` 1000–1100. A real product or lifestyle clip should be visible from frame 1.
- Savings burst: `save: "$163"`, `pct: "40% OFF"`. Use it on product scenes, anchored on `["line", "$"]`.
- One idea per scene. Change scene every 2–4 s. End cards hold for about 2 s after the voice ends.
