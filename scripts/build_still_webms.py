"""Build the single-frame WebMs used by the homepage (Pillow + ffmpeg/libvpx)."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'images'
OUT = ROOT / 'assets/stills'


def encode(src):
    dest = OUT / src.relative_to(IMAGES).with_suffix('.webm')
    dest.parent.mkdir(parents=True, exist_ok=True)
    width, height = Image.open(src).size
    limit = 960 if 'outcome-tasks' in src.parts else 2400
    w = min(limit, width) // 2 * 2
    h = round(height * w / width / 2) * 2
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(src),
                    '-vf', f'scale={w}:{h}:flags=lanczos', '-frames:v', '1', '-an',
                    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-threads', '2',
                    '-row-mt', '1', '-cpu-used', '4', '-b:v', '0', '-crf', '31', str(dest)], check=True)
    return dest.stat().st_size


if __name__ == '__main__':
    files = sorted((IMAGES / 'outcome-tasks').glob('*-initial.png')) + sorted((IMAGES / 'outcome-tasks').glob('*-outcome.png'))
    files += sorted((IMAGES / 'episodes').glob('*/*step*.png'))
    files += [IMAGES / 'paper' / (name + '.png') for name in ['heatmap', 'sankey_diagram', 'real_robot_fig']]
    with ThreadPoolExecutor(max_workers=4) as pool:
        total = sum(pool.map(encode, files))
    before = sum((src.with_suffix('.webp') if 'outcome-tasks' in src.parts else src).stat().st_size for src in files)
    print(f'{len(files)} stills: {before:,} -> {total:,} bytes')
