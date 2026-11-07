"""Encode numbered PNGs through PyAV/FFmpeg. No cloud services. Python >=3.9."""
import argparse
import json
import time
from fractions import Fraction
from pathlib import Path


def main():
    import av
    from PIL import Image

    parser = argparse.ArgumentParser()
    parser.add_argument("frames", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--fps", type=int, default=24)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError("Output exists; choose a new output path")
    if not 1 <= args.fps <= 120:
        raise ValueError("fps must be 1..120")
    files = sorted(args.frames.glob("frame-*.png"))
    if not files or any(f.name != "frame-%06d.png" % i for i, f in enumerate(files)):
        raise ValueError("Contiguous frame-000000.png sequence required")
    started = time.perf_counter()
    with Image.open(files[0]) as image:
        width, height = image.size
    if width % 2 or height % 2:
        raise ValueError("H264 yuv420p requires even dimensions")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with av.open(str(args.output), "w") as container:
        stream = container.add_stream("libx264", rate=args.fps)
        stream.width, stream.height = width, height
        stream.pix_fmt = "yuv420p"
        stream.options = {"crf": "18", "preset": "medium"}
        for i, file in enumerate(files):
            with Image.open(file) as image:
                if image.size != (width, height):
                    raise ValueError("Frame dimensions changed")
                frame = av.VideoFrame.from_image(image.convert("RGB"))
            frame.pts, frame.time_base = i, Fraction(1, args.fps)
            for packet in stream.encode(frame):
                container.mux(packet)
        for packet in stream.encode():
            container.mux(packet)
    with av.open(str(args.output)) as container:
        stream = container.streams.video[0]
        count, previous_time = 0, None
        for frame in container.decode(stream):
            if previous_time is not None and frame.time <= previous_time:
                raise AssertionError("Non-increasing frame timestamps")
            previous_time = frame.time
            count += 1
        if count != len(files) or stream.average_rate != args.fps:
            raise AssertionError("Encoded frame count/rate mismatch")
        report = {"ok": True, "frames": count, "fps": str(stream.average_rate),
                  "width": width, "height": height, "codec": stream.codec_context.name,
                  "duration": count / args.fps, "encodeAndDecodeSeconds": time.perf_counter() - started,
                  "av": av.__version__, "bytes": args.output.stat().st_size,
                  "scope": "silent technical integration sample, not a finished film"}
    args.output.with_suffix(".encoding.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
