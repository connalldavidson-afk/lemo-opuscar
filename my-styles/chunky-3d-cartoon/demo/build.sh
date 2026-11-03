#!/bin/sh
# Rebuild the Chunky 3D Cartoon demo (Zombie Apocalypse on a Cruise Ship · Part 1).
# Works on a copy in $OUT/src, so demo/ itself never changes.
LIB=/home/user/lemo-opuscar
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:-$HOME/lemo-builds/chunky-3d-cartoon}
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB at the top of build.sh to the library folder"; exit 1; }
mkdir -p "$OUT/src" && cp -R "$HERE"/. "$OUT/src/" && rm -f "$OUT/src/build.sh"
S="$OUT/src"; SZ="--size 1080x1920"
cd "$LIB"
[ -f "$S/voices/l01.wav" ] || .venv/bin/python core/tts/tts.py "$S/lines.json" "$S/voices"
.venv/bin/python "$S/captions.py"
node core/render/events.mjs "$S" $SZ
node core/render/video.mjs "$S" --fps 24 --workers 4 $SZ --out "$S/out/video.mp4"
.venv/bin/python "$S/mix.py"
if ! sh core/render/mux.sh "$S/out/video.mp4" "$S/out/mix.wav" "$OUT/test.mp4" 24 0; then
  cd "$S"   # ffmpeg 6: the same two-pass loudnorm by hand
  M=$(ffmpeg -hide_banner -nostats -i out/mix.wav -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
  g() { echo "$M" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
  ffmpeg -hide_banner -loglevel error -y -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -vf fps=24 \
    -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart \
    -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
    -c:a aac -b:a 192k -t 54 "$OUT/test.mp4"
fi
echo "done: $OUT/test.mp4"
