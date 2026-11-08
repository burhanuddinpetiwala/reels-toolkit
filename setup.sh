#!/bin/bash
# One-time setup in a fresh workspace (about 2-4 minutes). Safe to re-run.
set -e
RT="$(cd "$(dirname "$0")" && pwd)"
command -v ffmpeg >/dev/null || { echo "installing ffmpeg"; (apt-get install -y ffmpeg >/dev/null 2>&1 || sudo apt-get install -y ffmpeg >/dev/null 2>&1); }
command -v node >/dev/null || { echo "Node.js 18+ is required"; exit 1; }
cd "$RT/remotion" && npm install --no-audit --no-fund --loglevel=error
pip install --quiet --break-system-packages faster-whisper librosa soundfile pillow playwright numpy "rembg[cpu]" 2>/dev/null || pip install --quiet faster-whisper librosa soundfile pillow playwright numpy "rembg[cpu]"
python3 -c "import playwright" && (python3 -m playwright install chromium >/dev/null 2>&1 || true)
# warm the speech model (small.en, ~460 MB) so the first alignment doesn't stall
python3 -c "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')" >/dev/null 2>&1 || true
bash "$RT/rt/doctor.sh"
