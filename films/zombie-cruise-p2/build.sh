#!/bin/sh
# Rebuild Part 2: voice → captions → events → frames → mix → master.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
SZ="--size 1080x1920"
[ -f "$HERE/voices/l01.wav" ] || .venv/bin/python core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
.venv/bin/python "$HERE/captions.py"
node core/render/events.mjs "$HERE" $SZ
node core/render/video.mjs "$HERE" --fps 24 --workers 4 $SZ --out "$HERE/out/video.mp4"
.venv/bin/python "$HERE/mix.py"
if ! sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/zombie-cruise-p2.mp4" 24 0; then
  cd "$HERE"   # ffmpeg 6: the same two-pass loudnorm by hand
  M=$(ffmpeg -hide_banner -nostats -i out/mix.wav -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
  g() { echo "$M" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
  ffmpeg -hide_banner -loglevel error -y -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -vf fps=24 \
    -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart \
    -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
    -c:a aac -b:a 192k -t 54 zombie-cruise-p2.mp4
fi
