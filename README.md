# reels-toolkit

Brand-agnostic production kit for **voiced short-form Reels**, **paid ads** (9:16, 1:1, 16:9), **Story frames** and **carousels**. It was built for the ValuHub November 2026 campaign and generalised so every brand only changes `brand.json`.

- **Remotion templates** (React) for data-driven scenes keyed to voiceover words, with a savings burst, slam hooks, an end card and word captions.
- **Voiceover pipeline:** take picking, forced alignment (faster-whisper) and caption timing with number/$/% formatting.
- **Audio:** music fit and ducking, an SFX cue sheet and −14 LUFS mastering.
- **QA:** loudness, true peak, black frames, speech-vs-script match and a contact sheet.
- **Carousels** (HTML → PNG) and **packaging** (post copy, SRT, zips under 380 MB).

## Quick start
```bash
git clone https://github.com/burhanuddinpetiwala/reels-toolkit && cd reels-toolkit && bash setup.sh
cp -r examples/sample-project ~/reels-projects/acme/black-friday   # then edit the JSONs, add assets/, vo/, music/
P=~/reels-projects/acme/black-friday
python3 rt/savings.py $P
python3 rt/vo_pick.py $P R01 R02          # needs vo/r01_a.mp3, vo/r01_b.mp3 ...
bash rt/render.sh $P R01 R02              # -> out/R01.mp4 + cover + qa
python3 rt/package.py $P
```
The docs are `docs/PROJECT.md` (folder and JSON), `docs/SPEC.md` (scene types), `docs/EXTRAS.md` (ads, Stories, carousels) and `docs/COPY.md` (creative rules).

Rendering needs about 2 CPU cores; one 25 s Reel takes about 3 minutes. Set `RT_CONCURRENCY` to use more cores.
Fonts are from Fontsource (OFL). The SFX and paper textures are for use in this account's projects.
