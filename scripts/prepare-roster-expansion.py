"""Cut the 54 added fighters from generated transparent atlases.
Run with the six original PNGs in the directory passed as the first argument.
The connected contours retain weapons which extend outside nominal grid cells.
"""
import json
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.optimize import linear_sum_assignment

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
GROUPS = [
 ['kakashi-hatake','hinata-hyuga','rock-lee','gaara','shikamaru-nara','neji-hyuga','minato-namikaze','might-guy','hashirama-senju'],
 ['madara-uchiha','obito-uchiha','nami','sanji','usopp','nico-robin','portgas-d-ace','trafalgar-law','boa-hancock'],
 ['whitebeard','silvers-rayleigh','shanks','dracule-mihawk','monkey-d-garp','gol-d-roger','orihime-inoue','uryu-ishida','toshiro-hitsugaya'],
 ['kisuke-urahara','yoruichi-shihoin','ulquiorra-cifer','yuno','yami-sukehiro','julius-novachrono','nezuko-kamado','inosuke-hashibira','giyu-tomioka'],
 ['shinobu-kocho','tengen-uzui','mitsuri-kanroji','kyojuro-rengoku','yoriichi-tsugikuni','kokushibo','doma','megumi-fushiguro','nobara-kugisaki'],
 ['ryomen-sukuna','kento-nanami','toji-fushiguro','yuta-okkotsu','cha-hae-in','igris','beru','baek-yoonho','choi-jong-in'],
]
HEIGHTS = {'whitebeard':310,'monkey-d-garp':295,'beru':302,'baek-yoonho':296,'igris':294,'tengen-uzui':286,'madara-uchiha':278,'hashirama-senju':278,'toshiro-hitsugaya':232,'shinobu-kocho':245,'nezuko-kamado':245,'gaara':255,'yami-sukehiro':284}
manifest = json.loads((ROOT/'game/sprite-manifest.json').read_text())
output = ROOT/'public/art/fighters'
output.mkdir(parents=True, exist_ok=True)
jobs = []
for n, ids in enumerate(GROUPS, 1):
 image = Image.open(SOURCE/f'roster-{n}.png').convert('RGBA')
 pixels = np.array(image)
 alpha = pixels[:, :, 3]
 assert np.mean(alpha == 0) > .25, f'Atlas {n} has no usable alpha'
 mask = alpha > 80
 # Crop seams at the few places where neighbouring weapon contours touch.
 if n == 3:
  mask[0:362,575:579] = False
  mask[362:680,537:541] = False
 if n == 4:
  mask[602:652,776:780] = False
  mask[875:940,775:780] = False
 labels, count = ndi.label(mask)
 sizes = np.bincount(labels.ravel())
 components = [i for i in range(1,count+1) if sizes[i] > 1500]
 assert len(components) == 18, f'Atlas {n}: {len(components)} contours'
 bounds = ndi.find_objects(labels)
 centers = [ndi.center_of_mass(mask,labels,i) for i in components]
 targets = [(image.height*(r+.5)/3,image.width*(c+.5)/6) for r in range(3) for c in range(6)]
 costs = [[abs(y-ty)*2.7+abs(x-tx) for y,x in centers] for ty,tx in targets]
 rows, cols = linear_sum_assignment(costs)
 assignments = dict(zip(rows,cols))
 for j, id in enumerate(ids):
  frames = []
  source_height = 0
  for pose in range(2):
   index = (j//3)*6+(j%3)*2+pose
   component = components[assignments[index]]
   ys, xs = bounds[component-1]
   x0,y0 = max(0,xs.start-5),max(0,ys.start-5)
   x1,y1 = min(image.width,xs.stop+5),min(image.height,ys.stop+5)
   crop = pixels[y0:y1,x0:x1].copy()
   contour = labels[y0:y1,x0:x1] == component
   crop[:,:,3] = np.where(ndi.binary_dilation(contour,iterations=3),crop[:,:,3],0)
   # The support foot/feet are the root of each pose, including one-foot kicks.
   foot_band = labels[max(ys.start,ys.stop-15):ys.stop,xs.start:xs.stop] == component
   foot_x = np.nonzero(foot_band)[1]+xs.start
   ax = float((np.percentile(foot_x,2)+np.percentile(foot_x,98))/2-x0)
   ay = ys.stop-1-y0
   if pose == 0:
    source_height = ys.stop-ys.start
    if id == 'whitebeard': source_height = ys.stop-80  # raised polearm above the head
   name = f'{id}-expansion-{pose}.webp'
   jobs.append((Image.fromarray(crop),output/name))
   frames.append({'src':'/art/fighters/'+name,'w':x1-x0,'h':y1-y0,'ax':round(ax,1),'ay':ay})
  manifest[id] = {'height':HEIGHTS.get(id,268),'sourceHeight':source_height,'frames':[frames[i] for i in [0,0,1,1,1,0]]}

def save(job):
 im,p = job
 im.save(p,'WEBP',quality=94,method=4)
with ThreadPoolExecutor(max_workers=4) as pool:
 list(pool.map(save,jobs))
assert len(manifest) == 77
(ROOT/'game/sprite-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
# Review artifact: every newly cut stance and strike, composited over the arena ink.
contact = Image.new('RGB',(1200,9*300),'#152236')
draw = ImageDraw.Draw(contact)
for index,(im,p) in enumerate(jobs):
 tile = im.copy();tile.thumbnail((96,264))
 x=(index%12)*100+(100-tile.width)//2;y=(index//12)*300+270-tile.height
 contact.paste(tile,(x,y),tile)
 draw.text(((index%12)*100+3,(index//12)*300+274),p.name.split('-expansion')[0][:16],fill='#d9e9f0')
contact.save(SOURCE/'integrated-roster-review.jpg')
print(f'Prepared {len(jobs)} poses; {len(manifest)} complete fighters')
