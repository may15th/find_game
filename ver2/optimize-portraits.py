"""Generate independent lossless WebP portraits. Never modify source PNGs.

Requires Pillow with WebP support; run from any working directory.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent / 'assets/case02/characters'
output = root / 'optimized'
output.mkdir(exist_ok=True)
before = after = 0
for source in sorted(root.glob('ParkJimin_0*.png')):
    target = output / (source.stem + '.webp')
    original = Image.open(source).convert('RGBA')
    original.save(target, 'WEBP', lossless=True, method=6)
    optimized = Image.open(target).convert('RGBA')
    assert original.size == optimized.size
    assert original.getchannel('A').tobytes() == optimized.getchannel('A').tobytes()
    # Transparent RGB values have no visual meaning; verify visible pixels on
    # both dark and light backgrounds as well as exact alpha equality.
    for color in ('#0b1a24', '#f7efdd'):
        background = Image.new('RGBA', original.size, color)
        assert Image.alpha_composite(background, original).tobytes() == Image.alpha_composite(background, optimized).tobytes()
    before += source.stat().st_size
    after += target.stat().st_size
    print(f'{source.name}: {source.stat().st_size} -> {target.stat().st_size} bytes')
print(f'Total: {before} -> {after} bytes ({(1 - after / before) * 100:.2f}% smaller)')
