#!/bin/bash
# Check the toolchain. Prints OK/MISSING per item.
RT="$(cd "$(dirname "$0")/.." && pwd)"
ok(){ echo "OK       $1"; }; no(){ echo "MISSING  $1"; }
command -v ffmpeg >/dev/null && ok ffmpeg || no "ffmpeg (apt-get install ffmpeg)"
command -v node >/dev/null && ok "node $(node -v)" || no "node 18+"
[ -d "$RT/remotion/node_modules/remotion" ] && ok remotion || no "remotion (cd remotion && npm install)"
for m in faster_whisper librosa soundfile PIL playwright numpy; do python3 -c "import $m" 2>/dev/null && ok "python $m" || no "python $m (pip install)"; done
python3 - <<'PY' 2>/dev/null && ok "chromium for playwright" || no "chromium (python3 -m playwright install chromium)"
from playwright.sync_api import sync_playwright
with sync_playwright() as p: p.chromium.launch().close()
PY
