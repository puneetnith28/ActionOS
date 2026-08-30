#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
evidence="$repo_root/docs/submission/evidence/2026-08-22/v12-final"
product="$evidence/actionos-product-master-30fps-v3.mp4"
cloud="$evidence/actionos-google-cloud-evidence-30fps.mp4"
result="$evidence/frame-60s.png"
architecture="$repo_root/docs/submission/assets/actionos-architecture-video-preview.png"
audio="$evidence/actionos-narration-v12-final.wav"
captions="$evidence/actionos-subtitles-v12.srt"
output="${1:-$evidence/actionos-demo-v12-final-candidate.mp4}"
font_dir="$(mktemp -d "${TMPDIR:-/tmp}/actionos-video-fonts.XXXXXX")"
trap 'rm -f "$font_dir/seguisb.ttf"; rmdir "$font_dir"' EXIT

for required in "$product" "$cloud" "$result" "$architecture" "$audio" "$captions"; do
  if [[ ! -f "$required" ]]; then
    printf 'Missing required source: %s\n' "$required" >&2
    exit 1
  fi
done

cp /mnt/c/Windows/Fonts/seguisb.ttf "$font_dir/seguisb.ttf"

# Editorial contract:
# - 00:00–01:12 establishes the case and approval boundary.
# - 01:12–01:48 is one uninterrupted product take through ACK rejection and proof.
# - 01:48–02:31 holds the verified result, then exposes the correlated trace.
# - 02:31–02:56 shows authentic Cloud Run, Tasks, Firestore, trace and service-identity evidence.
# - 02:56–03:20 explains the implemented architecture.
# - 03:20–03:30.531 returns to the verified product result and holds the closing line.
ffmpeg -y \
  -i "$product" \
  -i "$cloud" \
  -loop 1 -framerate 30 -i "$result" \
  -loop 1 -framerate 30 -i "$architecture" \
  -i "$audio" \
  -filter_complex "
    [0:v]trim=start=0:end=12,setpts=PTS-STARTPTS,fps=30[p0];
    [0:v]trim=start=10:end=30,setpts=1.4*(PTS-STARTPTS),crop=1600:900:160:90,scale=1920:1080,fps=30[p1];
    [0:v]trim=start=30:end=42,setpts=2.6666667*(PTS-STARTPTS),crop=1600:900:160:180,
      scale=1652:930,pad=1920:1080:134:0:color=0x07110E,fps=30[p2];
    [0:v]trim=start=42:end=59.2,setpts=2.0930233*(PTS-STARTPTS),crop=1600:900:160:90,scale=1920:1080,fps=30,
      drawbox=x=60:y=44:w=490:h=56:color=0x0B241D@0.92:t=fill:enable='between(t,0,4)',
      drawtext=fontfile='$font_dir/seguisb.ttf':text='HUMAN APPROVAL - VERSIONED PLAN':fontcolor=white:fontsize=24:x=82:y=60:enable='between(t,0,4)',
      drawbox=x=60:y=44:w=590:h=56:color=0x0B241D@0.92:t=fill:enable='between(t,4,36)',
      drawtext=fontfile='$font_dir/seguisb.ttf':text='DURABLE WORKFLOW - BROWSER IS NOT THE RUNNER':fontcolor=white:fontsize=22:x=82:y=60:enable='between(t,4,36)'[p3];
    [2:v]trim=duration=21,setpts=PTS-STARTPTS,crop=1600:900:160:90,scale=1920:1080,fps=30[p4];
    [0:v]trim=start=60:end=82,setpts=PTS-STARTPTS,crop=1600:900:160:90,scale=1920:1080,fps=30[p5];
    [1:v]trim=start=0:end=5,setpts=1.2*(PTS-STARTPTS),crop=1440:810:0:0,scale=1920:1080,fps=30[c0];
    [1:v]trim=start=5:end=9,setpts=PTS-STARTPTS,crop=1440:810:0:0,scale=1920:1080,fps=30[c1];
    [1:v]trim=start=10:end=13,setpts=PTS-STARTPTS,crop=1440:810:0:0,scale=1920:1080,fps=30[c2];
    [0:v]trim=start=62:end=66,setpts=PTS-STARTPTS,crop=1440:810:240:90,scale=1920:1080,fps=30[c3];
    [1:v]trim=start=15:end=23,setpts=PTS-STARTPTS,crop=1440:810:0:0,scale=1920:1080,fps=30[c4];
    [3:v]trim=duration=24,setpts=PTS-STARTPTS,scale=1652:930,
      zoompan=z='min(zoom+0.0000834,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1652x930:fps=30,
      pad=1920:1080:134:0:color=0x07110E[a0];
    [2:v]trim=duration=10.531083,setpts=PTS-STARTPTS,crop=1600:900:160:90,scale=1920:1080,fps=30[p6];
    [p0][p1][p2][p3][p4][p5][c0][c1][c2][c3][c4][a0][p6]
      concat=n=13:v=1:a=0[assembled];
    [assembled]subtitles='$captions':fontsdir='$font_dir':force_style='FontName=Segoe UI Semibold,FontSize=14,PrimaryColour=&H00FFFFFF,BackColour=&H200B241D,OutlineColour=&H200B241D,BorderStyle=3,Outline=1,Shadow=0,Alignment=2,MarginL=72,MarginR=72,MarginV=10'[video];
    [4:a]apad=whole_dur=210.531083[audio]
  " \
  -map '[video]' -map '[audio]' \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -r 30 -fps_mode cfr -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart -shortest "$output"

printf 'Built %s\n' "$output"
