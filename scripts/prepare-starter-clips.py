"""Mechanically isolate the supplied transparent atlases; never redraw artwork.

Requires Pillow, NumPy and SciPy. Source images and anchor settings are included.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/animation-source'
OUT = ROOT / 'public/art/animation'
OUT.mkdir(parents=True, exist_ok=True)
settings = json.loads((SOURCE / 'anchors.json').read_text())
manifest = {}
for name, spec in settings.items():
    image = Image.open(SOURCE / (name + '.png')).convert('RGBA')
    arr = np.asarray(image)
    mask = arr[:, :, 3] > 40
    # This atlas has a blade touching the neighbouring pose's boot at the gutter.
    if name == 'tanjiro-kamado':
        mask[760:820, 993:1003] = False
    labels, _ = ndi.label(mask)
    sizes = np.bincount(labels.ravel())
    components = []
    for label, sl in enumerate(ndi.find_objects(labels), 1):
        if sizes[label] > 2500:
            y, x = sl
            components.append((label, x.start, y.start, x.stop, y.stop))
    if len(components) != 12:
        raise ValueError(f'{name}: expected 12 silhouettes, got {len(components)}')
    # Art may extend past a nominal cell. Sort silhouettes by row, then left edge.
    components.sort(key=lambda c: ((c[2] + c[4]) / 2 // (image.height / 3), c[1]))
    frames = []
    for index, (label, *_box) in enumerate(components):
        own = ndi.binary_dilation(labels == label, iterations=3)
        yy, xx = np.nonzero(own & (arr[:, :, 3] > 0))
        x0, x1 = max(0, int(xx.min())-2), min(image.width, int(xx.max())+3)
        y0, y1 = max(0, int(yy.min())-2), min(image.height, int(yy.max())+3)
        piece = arr[y0:y1, x0:x1].copy()
        piece[:, :, 3] = np.where(own[y0:y1, x0:x1], piece[:, :, 3], 0)
        path = OUT / f'{name}-{index}.webp'
        Image.fromarray(piece).save(path, 'WEBP', quality=96, method=6)
        ax, ay = spec['anchors'][index]
        frames.append(dict(src='/art/animation/'+path.name, w=x1-x0, h=y1-y0, ax=ax-x0, ay=ay-y0))
    manifest[name] = dict(height=spec['height'], sourceHeight=spec['sourceHeight'], frames=frames)
(ROOT / 'game/clip-manifest.json').write_text(json.dumps(manifest, separators=(',', ':'))+'\n')
print(f'Prepared {len(manifest)} fighters with 12 illustrated frames each.')
