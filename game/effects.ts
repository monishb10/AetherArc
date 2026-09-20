import type { Fighter } from './engine';
import { ELEMENT_COLORS } from './data';
import { GROUND, clamp01, smooth, moveFor, ultimateFor, type Technique } from './motion';

export type CombatEffect={x:number;y:number;life:number;max:number;size:number;color:string;type:string;face:number;endX?:number;endY?:number;seed?:number};
const TAU=Math.PI*2;
function glow(c:CanvasRenderingContext2D,color:string,x:number,y:number,r:number,alpha=1){
 const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${alpha})`);g.addColorStop(.18,color);g.addColorStop(1,color+'00');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
}
function ribbon(c:CanvasRenderingContext2D,r:number,start:number,end:number,width:number,color:string){
 c.fillStyle=color;c.beginPath();c.arc(0,0,r,start,end);c.arc(0,0,Math.max(1,r-width),end,start,true);c.closePath();c.fill();
}
export function drawCombatEffect(c:CanvasRenderingContext2D,e:CombatEffect,detail:boolean){
 const t=clamp01(1-e.life/e.max),fade=Math.pow(1-t,.7),growth=smooth(t*4);
 c.save();c.translate(e.x,e.y);c.scale(e.face,1);c.globalAlpha=fade;c.globalCompositeOperation='lighter';c.strokeStyle=e.color;c.fillStyle=e.color;
 const r=e.size;
 if(e.type==='slash'||e.type==='uppercut'){
  c.rotate(e.type==='uppercut'?-1.5:-.55+(e.seed??0)*.22);c.scale(1,.75);
  const sweep=-1.45+t*2.5;
  ribbon(c,r*(.65+growth*.35),sweep-1.25,sweep+.4,22*fade,e.color);
  ribbon(c,r*(.65+growth*.35)-3,sweep-.95,sweep+.3,5*fade,'#fff9ed');
  if(detail){c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.arc(0,0,r*(.72+i*.09),sweep-1.7,sweep-.5);c.stroke();}}
 }else if(e.type==='beam'){
  const length=Math.abs((e.endX??(e.x+e.face*500))-e.x),width=r*Math.sin(Math.min(1,t*2)*Math.PI/2)*fade;
  const g=c.createLinearGradient(0,0,length,0);g.addColorStop(0,e.color+'00');g.addColorStop(.08,e.color);g.addColorStop(.9,'#eaffff');g.addColorStop(1,e.color+'00');
  c.fillStyle=g;c.beginPath();c.moveTo(0,-width*.25);c.lineTo(length,-width*.65);c.lineTo(length,width*.65);c.lineTo(0,width*.25);c.closePath();c.fill();
  c.strokeStyle='#ffffff';c.lineWidth=Math.max(1,width*.2);c.beginPath();c.moveTo(5,0);c.lineTo(length,0);c.stroke();
  for(let i=0;i<3;i++){c.strokeStyle=e.color;c.lineWidth=2;c.beginPath();c.ellipse(length*(.15+i*.3),0,8,width*.85,0,0,TAU);c.stroke();}
  glow(c,e.color,length,0,Math.max(1,width*1.3));
 }else if(e.type==='lightning'){
  const length=Math.abs((e.endX??(e.x+e.face*300))-e.x);
  for(let j=0;j<3;j++){c.beginPath();c.moveTo(0,0);for(let i=1;i<=16;i++)c.lineTo(length*i/16,Math.sin(i*13+j*7+Math.floor(t*15))*r*.35*(i===16?0:1));c.strokeStyle=j===2?'#fff':e.color;c.lineWidth=j===2?2:7-j*2;c.stroke();}
 }else if(e.type==='quake'){
  c.translate(0,GROUND-e.y);c.globalCompositeOperation='source-over';
  for(let i=0;i<11;i++){const px=(i-5)*r*.16,delay=Math.abs(i-5)*.025,q=clamp01((t-delay)*4),height=r*(.32+Math.sin(i*17)*.16)*Math.sin(q*Math.PI*.65);
   c.fillStyle=i%2?e.color:'#eff8f3';c.beginPath();c.moveTo(px-13,0);c.lineTo(px+4,-height);c.lineTo(px+19,-height*.7);c.lineTo(px+29,0);c.closePath();c.fill();}
  c.strokeStyle=e.color;c.lineWidth=5*fade;c.beginPath();c.ellipse(0,0,r*(.2+t),12+t*30,0,0,TAU);c.stroke();
 }else if(e.type==='vortex'||e.type==='ring'||e.type==='ultimate'){
  c.scale(1,e.type==='ring'?.3:1);
  for(let i=0;i<(detail?4:2);i++){c.save();c.rotate(t*3+i*1.5);c.scale(1,.58);ribbon(c,r*(.2+growth*.6+i*.05),i*.7+t*4,i*.7+t*4+Math.PI*1.35,10*fade+i,e.color);c.restore();}
 }else if(e.type==='dust'||e.type==='land'){
  c.globalCompositeOperation='source-over';
  for(let i=0;i<8;i++){const px=(i-3.5)*r*t*.35,py=-Math.sin((i+.5)/8*Math.PI)*t*20;c.fillStyle='#c9bd9b';c.globalAlpha=fade*.23;c.beginPath();c.ellipse(px,py,6+t*18,3+t*6,0,0,TAU);c.fill();}
 }else if(e.type==='hit'){
  // Asymmetric impact shards, a short white core, then a falling debris tail.
  const seed=e.seed??0;
  for(let i=0;i<(detail?11:5);i++){const a=i*2.399+seed,length=r*(.4+(i%3)*.23)*(1+t),inner=r*t*.5;c.save();c.rotate(a);c.fillStyle=i%3?'#fff9e7':e.color;c.beginPath();c.moveTo(inner,-2*fade);c.lineTo(length,-1);c.lineTo(inner,4*fade);c.closePath();c.fill();c.restore();}
  if(t<.45)glow(c,e.color,0,0,Math.max(1,r*.45*(1-t*2)));
 }else if(e.type==='rush'){
  for(let i=0;i<5;i++){c.globalAlpha=fade*(.6-i*.08);c.lineWidth=4-i*.5;c.beginPath();c.moveTo(-r*(.9+t*.6),-30+i*15);c.quadraticCurveTo(-r*.3,-45+i*18,r*.25,-25+i*13);c.stroke();}
  glow(c,e.color,r*.25,0,28*fade+1);
 }
 c.restore();
}

export function drawCharge(c:CanvasRenderingContext2D,f:Fighter,time:number,detail:boolean){
 const skill=['skill1','skill2','special','ultimate'].includes(f.state),powered=f.buff>0;
 if(!skill&&!powered&&f.energy<100)return;
 const move=moveFor(f.c,f.state),t=f.state==='ultimate'?clamp01(f.clock/.9):clamp01(f.clock/f.duration);
 if(skill&&t>move.contact&&f.state!=='ultimate'&&!powered)return;
 const color=ELEMENT_COLORS[f.c.element],charge=skill?smooth(t/(f.state==='ultimate'?1:move.contact)):.25;
 c.save();c.globalCompositeOperation='lighter';c.translate(f.x,f.y);c.scale(f.face,1);
 if(f.state==='special'||f.state==='ultimate'||powered||f.energy>=100){
  c.strokeStyle=color;c.lineWidth=1.5;c.globalAlpha=.35+charge*.25;
  for(let i=0;i<(detail?7:3);i++){const x=Math.sin(i*5.4)*65,y=-((time*110+i*39)%270);c.beginPath();c.moveTo(x,y+28);c.quadraticCurveTo(x+Math.sin(time*4+i)*20,y,x*.65,y-35);c.stroke();}
  c.beginPath();c.ellipse(0,-1,55+charge*30,9+charge*4,0,0,TAU);c.stroke();
 }
 if(skill){
  c.globalAlpha=.7;c.translate(45,-139);glow(c,color,0,0,12+charge*31);
  c.strokeStyle='#fff7e9';c.lineWidth=1.5;
  for(let i=0;i<3;i++){c.save();c.rotate(time*7+i*2.1);c.beginPath();c.ellipse(0,0,10+charge*26,4+charge*11,i*.7,0,TAU);c.stroke();c.restore();}
  if(detail)for(let i=0;i<10;i++){const a=i*2.4+time,r=(1-(time*1.7+i*.13)%1)*(70+charge*45);c.fillStyle=color;c.fillRect(Math.cos(a)*r,Math.sin(a)*r,2,2);}
 }
 c.restore();
}

export function drawUltimate(c:CanvasRenderingContext2D,f:Fighter,target:Fighter,time:number,detail:boolean){
 if(time<.82||time>2.25)return;
 const kind=ultimateFor(f.c),t=(time-.82)/1.43,color=ELEMENT_COLORS[f.c.element];
 const common={life:1-t,max:1,color,face:f.face,seed:f.c.seed};
 if(kind==='beam'||kind==='volley'){
  drawCombatEffect(c,{...common,x:f.x+f.face*50,y:f.y-139,endX:target.x+f.face*160,size:kind==='beam'?125:78,type:'beam'},detail);
  if(f.c.element==='lightning')drawCombatEffect(c,{...common,x:f.x,y:f.y-139,endX:target.x,size:120,type:'lightning'},detail);
 }else if(kind==='slash'||kind==='blink'){
  for(let i=0;i<3;i++){const progress=clamp01((t-i*.10)*1.5);if(progress>0)drawCombatEffect(c,{...common,life:1-progress,x:target.x+(i-1)*35,y:target.y-135,size:190+i*22,type:'slash',seed:i*3},detail);}
 }else if(kind==='uppercut'){
  drawCombatEffect(c,{...common,x:target.x,y:target.y-90,size:240,type:'uppercut'},detail);
  drawCombatEffect(c,{...common,x:target.x,y:GROUND,size:260,type:'ring'},detail);
 }else drawCombatEffect(c,{...common,x:target.x,y:target.y-120,size:260,type:kind},detail);
}
