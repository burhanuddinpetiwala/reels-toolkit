#!/bin/bash
# Render Reels: silent video -> cover -> mix -> remux -> QA.   rt/render.sh <project> <ID> [<ID> ...]
RT="$(cd "$(dirname "$0")/.." && pwd)"
P="$(cd "$1" && pwd)"; shift
bash "$RT/rt/use_project.sh" "$P" > /dev/null
mkdir -p "$P/out" "$P/qa" "$P/logs"
for id in "$@"; do
  t0=$(date +%s)
  cd "$RT/remotion"
  if ! npx remotion render src/index.ts "$id" "$P/out/${id}_silent.mp4" --codec=h264 --crf=18 --pixel-format=yuv420p --muted --concurrency=${RT_CONCURRENCY:-2} --log=error > "$P/logs/render_$id.log" 2>&1; then
    echo "$id RENDER_FAIL $(tail -3 "$P/logs/render_$id.log" | tr '\n' ' ')"; continue
  fi
  npx remotion still src/index.ts "C-$id" "$P/out/cover_$id.png" --log=error > /dev/null 2>&1 || echo "$id (no cover)"
  cd "$RT"
  python3 rt/mixgen.py "$P" "$id" > /dev/null || { echo "$id MIXGEN_FAIL"; continue; }
  python3 rt/mix.py "$P" "$id" > "$P/logs/mix_$id.log" 2>&1 || { echo "$id MIX_FAIL $(tail -2 "$P/logs/mix_$id.log")"; continue; }
  ffmpeg -v error -y -i "$P/out/${id}_silent.mp4" -i "$P/mix/v${id}_mix.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$P/out/$id.mp4"
  python3 rt/qa.py "$P" "$id" > /dev/null 2>&1
  python3 - "$P" "$id" "$t0" <<'PY'
import json,sys,time
P,id,t0=sys.argv[1],sys.argv[2],int(sys.argv[3])
q=json.load(open(f'{P}/qa/v{id}_qa.json'))
print(id,'dur',q['duration'],'LUFS',q['loudness_LUFS'],'TP',q['true_peak_dBFS'],'speech',q['speech_match_ratio'],'PASS' if q['pass'] else 'FAIL',[k for k,v in q['checks'].items() if not v],f'{int(time.time())-t0}s')
PY
done
echo ALL_DONE
