#!/bin/bash
# Render every Story frame in stories.json as PNG.   rt/stories.sh <project>
RT="$(cd "$(dirname "$0")/.." && pwd)"
P="$(cd "$1" && pwd)"
bash "$RT/rt/use_project.sh" "$P" > /dev/null
mkdir -p "$P/out/stories"
cd "$RT/remotion"
for id in $(python3 -c "import json;print(' '.join(s['id'] for s in json.load(open('$P/stories.json'))))"); do
  npx remotion still src/index.ts "$id" "$P/out/stories/$id.png" --log=error > /dev/null 2>&1 && echo "$id ok" || echo "$id FAIL"
done
