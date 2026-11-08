#!/bin/bash
# Point the Remotion templates at a project folder (brand.json, specs.json, data/, assets/ ...).
set -e
RT="$(cd "$(dirname "$0")/.." && pwd)"
P="$(cd "$1" && pwd)"
[ -f "$P/brand.json" ] || { echo "no brand.json in $P"; exit 1; }
ln -sfn "$P" "$RT/remotion/src/project"
ln -sfn "$P" "$RT/remotion/public/project"
echo "active project: $P"
