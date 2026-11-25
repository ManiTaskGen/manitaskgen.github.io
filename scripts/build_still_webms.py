"""Build the single-frame WebMs used by the homepage (Pillow + ffmpeg/libvpx)."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'images'
OUT = ROOT / 'assets/stills'


def content_columns(im):
    """Only trim contiguous pale outer columns. Keep a 2px guard around ink."""
    r, g, b = im.convert('RGB').split()
    ink = ImageChops.darker(ImageChops.darker(r, g), b).point(lambda v: 255 if v < 232 else 0)
    box = ink.getbbox()
    if not box:
        return 0, im.width
    left, _, right, _ = box
    return (left - 2 if left >= 5 else 0, right + 2 if im.width - right >= 5 else im.width)


def build_episode_frame(src):
    """Extract the recorded camera view, then remove margins inside that view."""
    model = src.parent.name.split('_')[0]
    step = int(src.stem.split('step')[-1])
    region_view = step in ({11, 12} if model == 'claude' else {4})
    with Image.open(src) as im:
        panel = im.width / max(1, round(im.width / (im.height * 1.31)))
        x = round(im.width - panel) if region_view else 0
        view = im.crop((x, 0, x + round(panel * .98), round(im.height * .72))).convert('RGB')
    left, right = content_columns(view)
    view = view.crop((left, 0, right, view.height))
    view.thumbnail((1080, 670), Image.Resampling.LANCZOS)
    view.save(ROOT / 'assets/stories/frames' / f'{model}-{step}.webp', quality=85)


def encode(src):
    dest = OUT / src.relative_to(IMAGES).with_suffix('.webm')
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        left, right = content_columns(im)
        width, height, original_width = right - left, im.height, im.width
    limit = 960 if 'outcome-tasks' in src.parts else 2400
    # Keep the original encode density; do not spend the saved blank pixels enlarging the strip.
    w = max(2, round(width * min(1, limit / original_width) / 2) * 2)
    h = round(height * w / width / 2) * 2
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(src),
                    '-vf', f'crop={width}:{height}:{left}:0:exact=1,scale={w}:{h}:flags=lanczos,setsar=1', '-frames:v', '1', '-an',
                    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-threads', '2',
                    '-row-mt', '1', '-cpu-used', '4', '-b:v', '0', '-crf', '31', str(dest)], check=True)
    return dest.stat().st_size


if __name__ == '__main__':
    files = sorted((IMAGES / 'outcome-tasks').glob('*-initial.png')) + sorted((IMAGES / 'outcome-tasks').glob('*-outcome.png'))
    files += sorted((IMAGES / 'episodes').glob('*/*step*.png'))
    files += [IMAGES / 'paper' / (name + '.png') for name in ['heatmap', 'sankey_diagram', 'real_robot_fig']]
    with ThreadPoolExecutor(max_workers=4) as pool:
        total = sum(pool.map(encode, files))
    for src in files:
        if 'episodes' in src.parts:
            build_episode_frame(src)
    before = sum((src.with_suffix('.webp') if 'outcome-tasks' in src.parts else src).stat().st_size for src in files)
    print(f'{len(files)} stills: {before:,} -> {total:,} bytes')
