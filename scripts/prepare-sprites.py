"""Crop supplied transparent animation atlases into runtime frames; no redraws.
Run with Pillow, NumPy and SciPy installed. Original files stay in scratch.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/art/fighters'; OUT.mkdir(parents=True,exist_ok=True)
rows={
'a':['naruto-uzumaki','sasuke-uchiha','sakura-haruno','monkey-d-luffy','roronoa-zoro'],
'b':['ichigo-kurosaki','rukia-kuchiki','tanjiro-kamado','zenitsu-agatsuma','satoru-gojo'],
'c':['yuji-itadori','sung-jin-woo','asta','itachi-uchiha','goku'],
'd':['vegeta','gohan','broly','frieza','kenpachi-zaraki']}
feet={'a':[237,477,706,934,1133],'b':[235,456,679,896,1125],'c':[231,458,679,902,1123],'d':[247,484,749,960,1140]}
heights={'naruto-uzumaki':245,'sasuke-uchiha':258,'sakura-haruno':235,'monkey-d-luffy':238,'roronoa-zoro':260,'ichigo-kurosaki':274,'rukia-kuchiki':233,'tanjiro-kamado':242,'zenitsu-agatsuma':239,'satoru-gojo':277,'yuji-itadori':247,'sung-jin-woo':275,'asta':236,'itachi-uchiha':263,'goku':268,'vegeta':258,'gohan':272,'broly':320,'frieza':248,'kenpachi-zaraki':302}
manifest={}
for sheet,names in rows.items():
 im=Image.open('/workspace/scratch/aether-art/combat-'+sheet+'.png').convert('RGBA'); arr=np.asarray(im)
 # Connected silhouettes permit crops past nominal grid lines without a neighbour's blade appearing.
 mask=arr[:,:,3]>40
 if sheet=='d': mask[960:965,700:919]=False # separate the two touching overhead poses at the row boundary
 labels,n=ndi.label(mask); sizes=np.bincount(labels.ravel()); comps=[]
 for lab,sl in enumerate(ndi.find_objects(labels),1):
  if sizes[lab]>1000:
   yy,xx=sl; comps.append((lab,xx.start,yy.start,xx.stop,yy.stop))
 for row,name in enumerate(names):
  frames=[]
  for col in range(6):
   targetx=col*229+114; targety=feet[sheet][row]-95
   comp=min(comps,key=lambda a: abs((a[1]+a[3])/2-targetx)+abs((a[2]+a[4])/2-targety)*2.7)
   lab,x0,y0,x1,y1=comp
   # Keep original antialiasing around the silhouette, excluding disconnected neighbouring fighters.
   own=ndi.binary_dilation(labels==lab,iterations=4)
   ys,xs=np.nonzero(own & (arr[:,:,3]>0)); x0,x1=max(0,int(xs.min())-2),min(im.width,int(xs.max())+3);y0,y1=max(0,int(ys.min())-2),min(im.height,int(ys.max())+3)
   piece=arr[y0:y1,x0:x1].copy(); piece[:,:,3]=np.where(own[y0:y1,x0:x1],piece[:,:,3],0)
   crop=Image.fromarray(piece); path=OUT/(name+'-'+str(col)+'.webp');crop.save(path,'WEBP',quality=94,method=6)
   # Foot anchor is the median silhouette position in the lower body, independent of weapons.
   anchor_y=min(feet[sheet][row],y1-3); band=(labels[max(y0,anchor_y-28):anchor_y+1]==lab)
   yy,xx=np.nonzero(band); anchor_x=col*229+114
   # Keep lunging attacks centred on the hips, not the farthest hand or blade.
   if col in [2,3]: anchor_x=col*229+114
   frames.append({'src':'/art/fighters/'+path.name,'w':crop.width,'h':crop.height,'ax':round(anchor_x-x0,1),'ay':anchor_y-y0})
  idle=frames[0];manifest[name]={'height':heights[name],'sourceHeight':idle['ay'],'frames':frames}
# Soul Clash reference uses individually anchored crops; retain its original feet and proportions.
im=Image.open('/workspace/scratch/bleach-reference/dist/assets/fighters.png').convert('RGBA')
ref={
'sosuke-aizen':[[448,0,331,397,611,389],[415,402,535,372,609,760]],
'renji-abarai':[[1202,0,369,397,1390,389],[1155,404,445,372,1393,760]],
'byakuya-kuchiki':[[1596,0,387,397,1788,389],[1582,416,401,360,1787,760]]}
for name,rects in ref.items():
 frames=[]
 for i,(x,y,w,h,ax,ay) in enumerate(rects):
  crop=im.crop((x,y,x+w,y+h));path=OUT/(name+'-'+str(i)+'.webp');crop.save(path,'WEBP',quality=94,method=6)
  frames.append({'src':'/art/fighters/'+path.name,'w':w,'h':h,'ax':ax-x,'ay':ay-y})
 manifest[name]={'height':278 if name=='renji-abarai' else 274,'sourceHeight':389,'frames':[frames[0],frames[0],frames[1],frames[1],frames[1],frames[0]]}
(ROOT/'game/sprite-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
print('Prepared',len(manifest),'fighters;',len(list(OUT.glob('*.webp'))),'frames;',round(sum(p.stat().st_size for p in OUT.glob('*.webp'))/1048576,2),'MB')
