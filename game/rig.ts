import type {Fighter} from './engine';
import {GROUND,clamp01,smooth,moveFor} from './motion';

export type V=[number,number];
type Bone={a:V;b:V;group:'body'|'head'|'armL'|'armR'|'legL'|'legR'};
export type Rig={rest:Bone[];posed:Bone[]};
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1]];
const sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1]];
const rot=(v:V,a:number):V=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const RIG_FPS=30;

// Joint locations describe the silhouette in the ready/movement illustrations.
// FK preserves segment lengths: arms and legs rotate, rather than stretching.
export function buildRig(f:Fighter,pose:number,time:number):Rig {
 const sword=f.c.style==='sword',robe=sword||['mage','monk'].includes(f.c.style),attackPose=pose===2||pose===3;
 const hip:V=[0,-.47],chest:V=[.01,-.72],neck:V=[.02,-.84],head:V=[.02,-.96];
 const lHip:V=[-.065,-.47],rHip:V=[.065,-.47];
 const lKnee:V=[-.21,-.25],rKnee:V=[.23,-.25],lFoot:V=[-.34,-.012],rFoot:V=[.34,-.012];
 const lShoulder:V=[-.12,-.73],rShoulder:V=[.13,-.73];
 const lElbow:V=robe?[-.16,-.57]:[-.19,-.64],rElbow:V=robe?[.20,-.58]:[.26,-.64];
 const lHand:V=robe?[-.10,-.45]:[-.08,-.65],rHand:V=robe?[.24,-.47]:[.30,-.77];
 if(attackPose){rElbow[0]=.31;rElbow[1]=-.70;rHand[0]=.53;rHand[1]=-.70;}
 const rest:Bone[]=[
  {a:hip,b:chest,group:'body'},{a:chest,b:neck,group:'body'},{a:neck,b:head,group:'head'},
  {a:lShoulder,b:lElbow,group:'armL'},{a:lElbow,b:lHand,group:'armL'},
  {a:rShoulder,b:rElbow,group:'armR'},{a:rElbow,b:rHand,group:'armR'},
  {a:lHip,b:lKnee,group:'legL'},{a:lKnee,b:lFoot,group:'legL'},
  {a:rHip,b:rKnee,group:'legR'},{a:rKnee,b:rFoot,group:'legR'}
 ];
 let hipX=0,hipY=0,body=0,headAngle=0,lu=0,ll=0,ru=0,rl=0,lt=0,lk=0,rt=0,rk=0;
 const cycle=Math.sin(f.stride),up=Math.cos(f.stride),breath=Math.sin(time*2.1+f.c.seed);
 if(f.defeated){
  const landing=smooth((f.clock-.45)/.55),settle=smooth((f.clock-1)/.45);
  body=-.07*(1-landing);headAngle=.10*(1-settle);
  lu=mix(-.35,.18,settle);ll=.18;ru=mix(.3,-.12,settle);rl=.15;
  lt=mix(.24,-.13,landing);lk=mix(.35,.10,settle);rt=mix(-.22,.13,landing);rk=mix(.5,.08,settle);
 }else if(f.state==='run'){
  // Contact and passing phases have different knee bends; distance drives phase.
  const backwards=f.vx*f.face<0?-1:1;
  lt=cycle*.45*backwards;rt=-cycle*.45*backwards;lk=Math.max(0,-cycle)*.70;rk=Math.max(0,cycle)*.70;
  hipY=-Math.abs(up)*.009;body=.025;
  if(f.c.style==='ninja'||f.c.style==='assassin'){lu=-.38;ru=.22;ll=.17;rl=-.25;}
  else{lu=-cycle*.22;ru=cycle*.22;ll=-.18;rl=.18;}
 }else if(f.state==='jump'||f.state==='fall'||f.y<GROUND-4&&!['hit','ultimate'].includes(f.state)){
  const rising=clamp01(-f.vy/600);lt=-.25;rt=.13;lk=.42+rising*.25;rk=.22;lu=-.25;ru=.18;body=-.025;
 }else if(f.state==='dash'||f.state==='dodge'){
  lt=-.22;rt=.18;lk=.36;rk=.18;lu=-.32;ru=.14;hipY=.015;
 }else if(f.state==='block'){
  body=-.07;hipY=.028;ru=-.35;rl=-.60;lu=.15;ll=.55;lk=.1;rk=.1;headAngle=.035;
 }else if(f.state==='hit'){
  const recoil=Math.exp(-f.clock*7);body=-.15*recoil;headAngle=-.16*recoil;lu=-.35*recoil;ru=.32*recoil;lk=.16;rk=.08;
 }else if(['light','heavy','skill1','skill2','special'].includes(f.state)){
  const t=clamp01(f.clock/f.duration),contact=moveFor(f.c,f.state,f.duration,f.chain).contact;
  const wind=Math.sin(clamp01(t/contact)*Math.PI),strike=smooth((t-contact+.08)/.11)*(1-smooth((t-.70)/.30));
  body=-wind*.055+strike*.055;hipX=-wind*.012+strike*.015;hipY=wind*.018;
  lu=wind*.12-strike*.12;ll=wind*.2;ru=wind*.20-strike*.10;rl=wind*.28-strike*.08;lt=-wind*.035;rt=wind*.055;lk=wind*.09;rk=wind*.09;
  if(f.state==='heavy'){body*=1.4;ru-=wind*.24;rl-=wind*.3;hipY-=strike*.022;}
  if(f.state==='special'){body=0;lu=-.23*wind;ru=.23*wind;ll=-.2*wind;rl=.2*wind;}
 }else if(f.state==='ultimate'){
  const charge=1-smooth((f.clock-.7)/.35);lu=-charge*.18;ru=charge*.14;ll=-charge*.12;rl=charge*.12;body=.02*(1-charge);hipY=.015*charge;
 }else if(f.state==='lobbyIdle'){
  // Upright, camera-facing ready stance: neutral spine, relaxed shoulders, planted feet
  const weightShift=Math.sin(time*1.35+f.c.seed*1.4);
  body=breath*.003+weightShift*.003;
  headAngle=-breath*.002;
  lu=breath*.006-weightShift*.003;ru=-breath*.006-weightShift*.003;
  ll=breath*.002;rl=-breath*.002;
  hipY=breath*.001;hipX=weightShift*.002;
 }else{
   const weightShift=Math.sin(time*1.35+f.c.seed*1.4);
   body=breath*.005+weightShift*.006;headAngle=-breath*.004-weightShift*.005;
   lu=breath*.010-weightShift*.006;ru=-breath*.012-weightShift*.006;
   ll=breath*.004;rl=-breath*.004;
   hipY=breath*.002;hipX=weightShift*.003;
  }
 const root:V=[hipX,hipY];
 const torsoPoint=(p:V)=>add(add(hip,root),rot(sub(p,hip),body));
 const posed:Bone[]=rest.map(b=>({...b,a:[...b.a],b:[...b.b]}));
 posed[0]={...rest[0],a:add(hip,root),b:torsoPoint(chest)};
 posed[1]={...rest[1],a:torsoPoint(chest),b:torsoPoint(neck)};
 posed[2]={...rest[2],a:torsoPoint(neck),b:add(torsoPoint(neck),rot(sub(head,neck),body+headAngle))};
 function chain(index:number,anchor:V,upper:number,lower:number){
  const a=rest[index],b=rest[index+1],end=add(anchor,rot(sub(a.b,a.a),upper));
  posed[index]={...a,a:anchor,b:end};posed[index+1]={...b,a:end,b:add(end,rot(sub(b.b,b.a),upper+lower))};
 }
 chain(3,torsoPoint(lShoulder),body+lu,ll);chain(5,torsoPoint(rShoulder),body+ru,rl);
 chain(7,add(lHip,root),lt,lk);chain(9,add(rHip,root),rt,-rk);
 if(f.state==='run'&&!f.defeated){
  const groundShift=-.012-Math.max(posed[8].b[1],posed[10].b[1]);
  for(const bone of posed){bone.a=add(bone.a,[0,groundShift]);bone.b=add(bone.b,[0,groundShift]);}
 }
 return {rest,posed};
}
function distance(p:V,a:V,b:V){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp01(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
export type Influence={indices:number[];weights:number[]};
export function weightsAt(x:number,y:number,bones:Bone[]):Influence {
 const candidates:number[]=y>-.48?(x<0?[0,7,8]:[0,9,10]):y<-.84?[1,2]:x<-.115?[0,1,3,4]:x>.13?[0,1,5,6]:[0,1,2];
 const ranked=candidates.map(i=>({i,w:1/Math.pow(.045+distance([x,y],bones[i].a,bones[i].b),4)})).sort((a,b)=>b.w-a.w).slice(0,3),sum=ranked.reduce((n,b)=>n+b.w,0);
 return {indices:ranked.map(b=>b.i),weights:ranked.map(b=>b.w/sum)};
}
export function skinPoint(x:number,y:number,rig:Rig,influence:Influence):V {
 let px=0,py=0;
 for(let j=0;j<influence.indices.length;j++){
  const index=influence.indices[j],a=rig.rest[index],b=rig.posed[index],angle=Math.atan2(b.b[1]-b.a[1],b.b[0]-b.a[0])-Math.atan2(a.b[1]-a.a[1],a.b[0]-a.a[0]);
  const p=add(b.a,rot(sub([x,y],a.a),angle)),w=influence.weights[j];px+=p[0]*w;py+=p[1]*w;
 }
 return [px,py];
}
