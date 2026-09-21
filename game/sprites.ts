import {assetUrl} from './runtime';
import manifest from './sprite-manifest.json';
import type { Fighter } from './engine';
import { samplePose } from './motion';
import { buildRig, weightsAt, skinPoint, RIG_FPS, type Influence } from './rig';
import { MeshRenderer } from './mesh-renderer';
import {fighterClips,clipFrame} from './clips';

type Frame={src:string;w:number;h:number;ax:number;ay:number};
type Sprite={height:number;sourceHeight:number;frames:Frame[]};
const sprites:Record<string,Sprite>=manifest;
const images=new Map<string,HTMLImageElement>();
const pending=new Map<string,Promise<void>>();
function load(src:string){
 if(pending.has(src))return pending.get(src)!;
 const img=new Image();images.set(src,img);
 const promise=new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>{images.delete(src);pending.delete(src);reject(new Error('Fighter artwork could not load. Please retry.'));};img.src=assetUrl(src);});
 pending.set(src,promise);return promise;
}
export const LOBBY_ART_IDS = new Set(['naruto-uzumaki', 'ichigo-kurosaki', 'tanjiro-kamado']);
export interface LobbyAnchor {
 anchorX: number;
 anchorY: number;
}
export const LOBBY_ART_ANCHORS: Record<string, LobbyAnchor> = {
 'naruto-uzumaki': { anchorX: 231 / 450, anchorY: 1232 / 1233 },
 'ichigo-kurosaki': { anchorX: 295 / 572, anchorY: 1230 / 1231 },
 'tanjiro-kamado': { anchorX: 305 / 588, anchorY: 1251 / 1255 }
};
export function hasLobbyArt(id: string): boolean {
 return LOBBY_ART_IDS.has(id);
}
export function lobbyArtSrc(id: string): string | undefined {
 return LOBBY_ART_IDS.has(id) ? `/art/lobby/${id}.webp` : undefined;
}
export async function prepareFighterSprites(ids:string[]){
 for(const id of ids)if(!sprites[id])throw new Error('This fighter’s artwork is missing. Please reload the game.');
 const lobbyLoads = ids.filter(id => LOBBY_ART_IDS.has(id)).map(id => load(`/art/lobby/${id}.webp`));
 await Promise.all([
  ...[...new Set(ids)].flatMap(id=>[...sprites[id].frames,...(fighterClips[id]?.frames??[])].map(f=>load(f.src))),
  ...lobbyLoads
 ]);
}
export function fighterArt(id:string){const frame=fighterClips[id]?.frames[7]??sprites[id]?.frames[0];return frame?{...frame,src:assetUrl(frame.src)}:undefined;}
export function fighterHeight(id:string){return sprites[id]?.height??260;}
export function knockoutFloorOffset(id:string){const clip=fighterClips[id];if(clip){const f=clip.frames[11];return (f.h-f.ay-2)*clip.height/clip.sourceHeight;}const s=sprites[id];return s?Math.max(32,(s.frames[5].ax+6)*s.height/s.sourceHeight):70;}

type Point=[number,number];
function triangle(c:CanvasRenderingContext2D,img:HTMLImageElement,s:Point[],d:Point[]){
 const [s0,s1,s2]=s,[d0,d1,d2]=d;
 const a=s1[0]-s0[0],b=s1[1]-s0[1],e=s2[0]-s0[0],f=s2[1]-s0[1],det=a*f-b*e;
 const A=((d1[0]-d0[0])*f-(d2[0]-d0[0])*b)/det;
 const B=((d1[1]-d0[1])*f-(d2[1]-d0[1])*b)/det;
 const C=((d2[0]-d0[0])*a-(d1[0]-d0[0])*e)/det;
 const D=((d2[1]-d0[1])*a-(d1[1]-d0[1])*e)/det;
 c.save();c.beginPath();
 const cx=(d0[0]+d1[0]+d2[0])/3,cy=(d0[1]+d1[1]+d2[1])/3;
 d.forEach(([x,y],i)=>{const len=Math.hypot(x-cx,y-cy)||1,px=x+(x-cx)/len*.35,py=y+(y-cy)/len*.35;i?c.lineTo(px,py):c.moveTo(px,py);});
 c.closePath();c.clip();c.transform(A,B,C,D,d0[0]-A*s0[0]-C*s0[1],d0[1]-B*s0[0]-D*s0[1]);c.drawImage(img,0,0);c.restore();
}
const cache=new Map<string,{canvas:HTMLCanvasElement;pad:number}>();
let gpu:MeshRenderer|null|undefined;
type Mesh={source:Point[];weights:Influence[];uv:Float32Array;indices:Uint16Array};
const meshes=new Map<string,Mesh>();
function skin(frame:Frame,sprite:Sprite,img:HTMLImageElement,f:Fighter,time:number){
 const pose=samplePose(f,time).frame,stamp=Math.floor(f.clock*RIG_FPS),stride=Math.round(f.stride*15);
 const timeStep=f.state==='idle'?Math.floor((((time*2.1+f.c.seed)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI*2))*32):Math.floor(time*RIG_FPS);
 const key=[frame.src,f.state,stamp,f.chain,stride,timeStep,f.defeated?1:0].join(':');
 const found=cache.get(key);if(found)return found;
 const pad=Math.ceil(sprite.sourceHeight*.5),w=frame.w+pad*2,h=frame.h+pad*2;
 const rig=buildRig(f,pose,time),meshKey=frame.src+':'+f.c.style+':'+pose;
 let mesh=meshes.get(meshKey);
 if(!mesh){
  const cols=20,rows=28,source:Point[]=[],weights:Influence[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const x=frame.w*i/cols,y=frame.h*j/rows;source.push([x,y]);uv.push(i/cols,j/rows);weights.push(weightsAt((x-frame.ax)/sprite.sourceHeight,(y-frame.ay)/sprite.sourceHeight,rig.rest));
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,d=a+cols+1,e=d+1;indices.push(a,b,d,b,e,d);}
  mesh={source,weights,uv:new Float32Array(uv),indices:new Uint16Array(indices)};meshes.set(meshKey,mesh);
 }
 const positions=new Float32Array(mesh.source.length*2),dest:Point[]=[];
 mesh.source.forEach(([x,y],i)=>{const p=skinPoint((x-frame.ax)/sprite.sourceHeight,(y-frame.ay)/sprite.sourceHeight,rig,mesh.weights[i]);const point:Point=[p[0]*sprite.sourceHeight+frame.ax+pad,p[1]*sprite.sourceHeight+frame.ay+pad];dest.push(point);positions[i*2]=point[0];positions[i*2+1]=point[1];});
 const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;const c=canvas.getContext('2d')!;
 if(gpu===undefined){try{gpu=new MeshRenderer();}catch{gpu=null;}}
 const rendered=gpu?.render(img,positions,mesh.uv,mesh.indices,w,h);
 if(rendered)c.drawImage(rendered,0,0);
 else{c.scale(2,2);for(let i=0;i<mesh.indices.length;i+=3){const [a,b,d]=Array.from(mesh.indices.slice(i,i+3));triangle(c,img,[mesh.source[a],mesh.source[b],mesh.source[d]],[dest[a],dest[b],dest[d]]);}}
 const out={canvas,pad};cache.set(key,out);if(cache.size>160)cache.delete(cache.keys().next().value!);return out;
}

export function drawIllustratedFighter(ctx:CanvasRenderingContext2D,f:Fighter,time:number,extraScale=1,motion=1){
 // 1. Dedicated Front-Facing Upright Lobby Artwork (Naruto, Ichigo, Tanjiro)
 if(f.state==='lobbyIdle'&&hasLobbyArt(f.c.id)){
  const src=`/art/lobby/${f.c.id}.webp`;
  const img=images.get(src);
  if(!img?.complete||!img.naturalWidth){
   void load(src).catch(()=>{});
  }else{
   const anchor = LOBBY_ART_ANCHORS[f.c.id] || { anchorX: 0.5, anchorY: 0.998 };
   const targetH=fighterHeight(f.c.id)*1.08*extraScale;
   const imgAspect=img.naturalWidth/img.naturalHeight;
   const targetW=targetH*imgAspect;

   ctx.save();
   const breath=Math.sin(time*2.1+f.c.seed)*motion;
   const weightShift=Math.sin(time*1.3+f.c.seed*1.4)*motion;
   ctx.translate(f.x+weightShift*1.2,f.y);
   ctx.scale(1+breath*0.002,1+breath*0.006);

   if(f.flash>0)ctx.filter='brightness(1.8) saturate(.5)';
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality='high';
   ctx.drawImage(img,-targetW*anchor.anchorX,-targetH*anchor.anchorY,targetW,targetH);
   ctx.restore();
   return true;
  }
 }

 const clip=fighterClips[f.c.id];
 if(clip){
  const index=f.state==='lobbyIdle'?0:clipFrame(f),frame=clip.frames[index],img=images.get(frame.src);
  if(!img?.complete||!img.naturalWidth){void load(frame.src).catch(()=>{});return true;}
  const scale=clip.height/clip.sourceHeight*extraScale;
  ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.state==='lobbyIdle'?1:f.face,1);
  if(f.defeated){
   if(index===9){ctx.rotate(f.koAngle*.3);ctx.translate(0,clip.height*.48);}
   else if(index===10)ctx.rotate(Math.max(-.16,f.koAngle*.10));
  }else if(['idle','victory','lobbyIdle'].includes(f.state)){
   // Grounded idle battle stance: gentle chest breath expansion and subtle weight shift
   const breath=Math.sin(time*2.2+f.c.seed)*motion;
   const weightShift=Math.sin(time*1.3+f.c.seed*1.4)*motion;
   ctx.rotate(weightShift*0.007);
   ctx.scale(1+breath*0.0015,1+breath*0.005);
  }else if(f.state==='run')ctx.translate(0,-Math.abs(Math.sin(f.stride*2))*3*motion);
  if(f.flash>0)ctx.filter='brightness(1.8) saturate(.5)';
  if(f.state==='dodge')ctx.globalAlpha*=.72;
  ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,-frame.ax,-frame.ay,frame.w,frame.h);ctx.restore();return true;
 }
 const sprite=sprites[f.c.id];if(!sprite)return false;
 const p=samplePose(f,time);
 // The shared rig is calibrated to the planted ready pose. Bending an already
 // tucked movement painting a second time collapses its legs into a floating pose.
 if(f.state==='run'||f.state==='lobbyIdle')p.frame=0;
 if(f.state==='lobbyIdle'){p.lean=0;p.bob=0;p.crouch=0;}
 const frame=sprite.frames[p.frame],img=images.get(frame.src);
 if(!img?.complete||!img.naturalWidth){void load(frame.src).catch(()=>{});return true;}
 const scale=sprite.height/sprite.sourceHeight*extraScale;
 ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.state==='lobbyIdle'?1:f.face,1);
 if(f.defeated){ctx.rotate(f.koAngle);ctx.translate(0,sprite.height*.48);}
 else{ctx.translate(0,p.bob*sprite.height*motion);ctx.translate(0,-sprite.height*.46);ctx.rotate(p.lean*.3);ctx.translate(0,sprite.height*.46);}
 ctx.scale(scale,scale);
 if(f.flash>0)ctx.filter='brightness(1.8) saturate(.5)';
 if(f.state==='dodge')ctx.globalAlpha*=.72;
 if(f.c.id==='renji-abarai'&&[2,3,4].includes(p.frame)){
  ctx.beginPath();ctx.moveTo(-143,-356);ctx.lineTo(207,-356);ctx.lineTo(207,16);ctx.lineTo(-238,16);ctx.lineTo(-183,-145);ctx.lineTo(-103,-230);ctx.closePath();ctx.clip();
 }
 const rendered=skin(frame,sprite,img,f,time);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(rendered.canvas,-frame.ax-rendered.pad,-frame.ay-rendered.pad,rendered.canvas.width/2,rendered.canvas.height/2);
 ctx.restore();
 if(f.state==='block'){
  ctx.save();ctx.translate(f.x+f.face*38,f.y-135);ctx.scale(f.face,1);ctx.strokeStyle='#b5edff';ctx.fillStyle='#6ed9ff12';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,42,85,0,-1.25,1.25);ctx.stroke();ctx.fill();ctx.restore();
 }
 return true;
}
