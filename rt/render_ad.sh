#!/bin/bash
# Render one paid ad in 9:16, 1:1 and 16:9 (audio is in the composition), then loudness-normalise.
#   rt/render_ad.sh <project> <adId>      (adId = "id" in ads.json)
RT="$(cd "$(dirname "$0")/.." && pwd)"
P="$(cd "$1" && pwd)"; A="$2"
bash "$RT/rt/use_project.sh" "$P" > /dev/null
mkdir -p "$P/out/ads" "$P/logs"
cd "$RT/remotion"
for k in V S L; do
  npx remotion render src/index.ts "AD-$A-$k" "$P/out/ads/${A}_${k}_raw.mp4" --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=${RT_CONCURRENCY:-2} --log=error > "$P/logs/ad_$A$k.log" 2>&1 || { echo "AD-$A-$k RENDER_FAIL"; continue; }
  n=$([ $k = V ] && echo 9x16 || ([ $k = S ] && echo 1x1 || echo 16x9))
  ffmpeg -hide_banner -loglevel error -y -i "$P/out/ads/${A}_${k}_raw.mp4" -c:v copy -af "loudnorm=I=-14.5:TP=-2:LRA=9,alimiter=limit=0.79:level=false" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$P/out/ads/${A}_$n.mp4"
  rm -f "$P/out/ads/${A}_${k}_raw.mp4"
  echo "$A $n $(ffmpeg -hide_banner -i "$P/out/ads/${A}_$n.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+(I:|Peak:)' | tr -s ' ' | tr '\n' ' ')"
done
