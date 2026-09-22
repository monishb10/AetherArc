import type { Fighter } from './engine';
import type { Character } from './data';

export const GROUND = 526;
export const clamp01 = (v:number) => Math.max(0, Math.min(1, v));
export const smooth = (v:number) => {const t=clamp01(v);return t*t*(3-2*t);};
export type Technique = 'rush'|'slash'|'beam'|'volley'|'blink'|'quake'|'uppercut'|'vortex';
export type Move = {duration:number;contact:number;reach:number;lunge:number;technique:Technique};

// One source of truth for animation contact frames and damage timing.
export function moveFor(c:Character,action:string,rate=.32,chain=1):Move {
 const sword=c.style==='sword',fast=c.style==='ninja'||c.style==='assassin';
 if(action==='light')return {duration:rate+(chain===3?.14:0),contact:.42,reach:0,lunge:chain===3?36:22,technique:sword?'slash':'rush'};
 if(action==='heavy')return {duration:.68,contact:.48,reach:35,lunge:30,technique:sword?'slash':'uppercut'};
 if(action==='special')return {duration:.94,contact:.57,reach:310,lunge:0,technique:'vortex'};
 if(action==='skill1'){
  let technique:Technique=sword?'slash':fast||['brawler','monk','brute'].includes(c.style)?'rush':'beam';
  if(c.id==='gaara')technique='vortex';
  return {duration:.78,contact:.46,reach:technique==='rush'?210:145,lunge:technique==='rush'?145:0,technique};
 }
 const technique:Technique=fast?'blink':sword?'slash':c.style==='brute'?'quake':c.style==='brawler'||c.style==='monk'?'uppercut':c.element==='water'||c.element==='wind'?'vortex':'volley';
 return {duration:.92,contact:.52,reach:260,lunge:sword?110:0,technique};
}
export function ultimateFor(c:Character):Technique {
 if(c.style==='sword')return 'slash';
 if(c.style==='beam'||/bomb|arrow|cannon|flash|kamehameha/i.test(c.ultimate))return 'beam';
 if(['ice','forest','sand'].includes(c.element))return 'quake';
 if(c.style==='ninja'||c.style==='assassin'||c.style==='monk')return 'blink';
 if(c.style==='brawler'||c.style==='brute')return 'uppercut';
 return c.element==='water'||c.element==='wind'?'vortex':'volley';
}

// Values are expressed in body-height units. Root motion remains in the simulation.
export type Pose={frame:number;lean:number;bob:number;twist:number;crouch:number;arms:number;legs:number;head:number;reach:number;cloth:number};
const neutral:Pose={frame:0,lean:0,bob:0,twist:0,crouch:0,arms:0,legs:0,head:0,reach:0,cloth:0};
type Key={at:number;pose:Partial<Pose>};
const strikeKeys:Key[]=[
 {at:0,pose:{}},
 {at:.23,pose:{lean:-.055,twist:-.025,crouch:.028,arms:-.085,head:.012,reach:-.035}},
 {at:.42,pose:{lean:.09,twist:.028,crouch:.016,arms:.06,reach:.075}},
 {at:.60,pose:{lean:.065,twist:.018,crouch:.03,arms:.025,reach:.032}},
 {at:1,pose:{}}
];
function keysAt(keys:Key[],t:number):Pose {
 let i=1;while(i<keys.length-1&&t>keys[i].at)i++;
 const a=keys[i-1],b=keys[i],p=smooth((t-a.at)/(b.at-a.at)),out={...neutral};
 for(const key of Object.keys(neutral) as (keyof Pose)[])out[key]=(a.pose[key]??0)+((b.pose[key]??0)-(a.pose[key]??0))*p;
 return out;
}
export function samplePose(f:Fighter,time:number):Pose {
 const p={...neutral},cycle=Math.sin(f.stride),lift=Math.cos(f.stride);
 if(f.defeated){p.frame=5;p.crouch=.09*smooth(f.clock/.4);p.arms=-.10;p.legs=.04*Math.exp(-f.clock*2);p.head=.035;p.cloth=Math.sin(f.clock*9)*.02*Math.exp(-f.clock*2);return p;}
 if(f.state==='run'){
  p.frame=1;p.lean=(f.vx*f.face<0?-.018:.026);p.bob=0;p.crouch=.012;p.legs=cycle*.035;p.arms=-cycle*.018;p.twist=-cycle*.006;p.cloth=Math.sin(f.stride-1)*.010;return p;
 }
 if(f.state==='dash'||f.state==='dodge'){
  p.frame=4;p.lean=.10;p.crouch=.04;p.arms=-.035;p.legs=-.025;p.cloth=.035;return p;
 }
 if(f.state==='hit'){
  const recoil=Math.exp(-f.clock*8);p.frame=5;p.lean=-.17*recoil;p.head=-.04*recoil;p.crouch=.025;p.arms=-.055*recoil;p.bob=-Math.sin(Math.min(1,f.clock/.22)*Math.PI)*.012;return p;
 }
 if(f.state==='block'){
  p.lean=-.035;p.crouch=.055;p.arms=-.06;p.head=.02;p.twist=-.018;return p;
 }
 if(['light','heavy','skill1','skill2','special'].includes(f.state)){
  const move=moveFor(f.c,f.state,f.duration-(f.chain===3&&f.state==='light'?.14:0),f.chain);
  const t=clamp01(f.clock/f.duration),contact=move.contact;
  const phase=t<contact?t/contact*.42:.42+(t-contact)/(1-contact)*.58;
  const a=keysAt(strikeKeys,phase),sword=f.c.style==='sword';
  a.frame=phase>.31&&phase<.86?(f.state==='heavy'||f.state==='special'||f.chain===3?3:2):0;
  const weight=f.state==='heavy'?1.45:f.state==='light'?1:1.2;
  a.lean*=weight;a.arms*=weight;a.reach*=weight;
  if(f.state==='light'&&f.chain===2){a.twist*=-1;a.arms*=-.5;a.bob+=.012*Math.sin(t*Math.PI);}
  if(f.state==='heavy'){a.bob-=.03*Math.sin(t*Math.PI);a.legs=.018*Math.sin(t*Math.PI);}
  if(sword){a.twist*=1.6;a.cloth=-a.reach*.3;}
  if(move.technique==='beam'||move.technique==='volley'){a.lean*=.4;a.crouch+=.025*Math.sin(t*Math.PI);}
  if(f.state==='special'){a.frame=t<.55?0:3;a.arms=-.055*Math.sin(t*Math.PI);a.bob=-.018*Math.sin(t*Math.PI);a.lean=0;}
  return a;
 }
 if(f.state==='ultimate'){
  const t=f.clock;p.frame=t<.8?0:3;p.crouch=.035*(1-smooth((t-.7)/.35));p.lean=.055*smooth((t-.7)/.4);p.reach=.03*Math.sin(Math.min(1,t/2.5)*Math.PI);p.arms=-.025;p.cloth=Math.sin(t*16)*.012;return p;
 }
 if(f.y<GROUND-2){p.frame=1;p.lean=f.vy<0?.025:-.035;p.legs=-.04;p.crouch=.04;p.arms=.028;p.cloth=f.vy<0?.02:-.015;return p;}
 const breath=Math.sin(time*2.4+f.c.seed*.73);
 p.bob=breath*.0015;p.crouch=.004*(1+breath);p.arms=breath*.006;p.head=-breath*.002;p.cloth=Math.sin(time*2.8+f.c.seed)*.006;
 if(f.state==='victory'){p.frame=f.clock>1.5?3:0;p.arms-=.012*smooth((f.clock-1)/.6);}
 return p;
}

/** Weighted mesh: feet, knees, torso, arms and head move independently, preserving
 * the painted costume. This is procedural 2D animation, not a 3D skeleton. */
export function deformPoint(x:number,y:number,h:number,p:Pose):[number,number] {
 const up=-y/h,side=x<0?-1:1;
 const leg=clamp01((.52-up)/.42),chest=smooth((up-.42)/.3);
 const arm=Math.exp(-Math.pow((up-.66)/.19,2))*smooth((Math.abs(x)/h-.10)/.17);
 const head=smooth((up-.78)/.15);
 const hip=smooth(up/.45)*(1-smooth((up-.64)/.3));
 const dx=h*(p.twist*chest+p.reach*chest+p.legs*side*leg+p.arms*arm+p.head*head+p.cloth*Math.sin(up*8)*Math.min(.7,Math.abs(x)/h));
 const dy=h*(p.crouch*smooth(up/.30)-Math.max(0,p.legs*side)*Math.sin(leg*Math.PI)*.55+p.arms*arm*.22+p.twist*side*hip);
 return [x+dx,y+dy];
}
