import {assetUrl} from './runtime';
import {arenaImage} from './arena-art';
import { Arena, Character, ELEMENT_COLORS, stats, byId, PLAYABLE_CHARACTERS } from './data';
import { FighterProgress, MatchConfig } from './progression';
import { GameAudio } from './audio';
import { drawIllustratedFighter, fighterHeight, knockoutFloorOffset } from './sprites';
import { GROUND, moveFor, ultimateFor, smooth } from './motion';
import { drawCombatEffect, drawCharge, drawUltimate, type CombatEffect } from './effects';
import { COMBAT_BALANCE, challenge } from './balance';

export type Action='light'|'heavy'|'dash'|'dodge'|'jump'|'skill1'|'skill2'|'special'|'ultimate'|'support'|'tag';
export type Fighter={c:Character;level:number;mastery:number;x:number;y:number;vx:number;vy:number;face:number;hp:number;maxHp:number;energy:number;guard:number;state:string;clock:number;duration:number;attack:number;chain:number;chainTimer:number;hit:boolean;stun:number;invincible:number;flash:number;cooldowns:Record<string,number>;combo:number;comboTimer:number;buff:number;trailClock:number;defeated:boolean;stride:number;koAngle:number;koBounces:number;koGrounded:boolean;lastImpact:number;gaitVelocity?:number};
type Particle={x:number;y:number;vx:number;vy:number;life:number;max:number;size:number;color:string;kind:number};
type Effect=CombatEffect;
type Projectile={x:number;y:number;vx:number;owner:Fighter;life:number;size:number;damage:number;color:string;style:string};
type Damage={x:number;y:number;text:string;life:number;color:string};

export type BattleReport={won:boolean;draw?:boolean;combos:number;ultimates:number;used:string[];duration:number;damage:number};
export type TeamFighterSnapshot={id:string;name:string;hp:number;maxHp:number;energy:number;level:number;defeated:boolean;active:boolean;element:Character['element']};
export type BattleSnapshot={
 player:{hp:number;maxHp:number;energy:number;guard:number;id:string;level:number};
 enemy:{hp:number;maxHp:number;energy:number;id:string;level:number};
 playerTeam:TeamFighterSnapshot[];
 enemyTeam:TeamFighterSnapshot[];
 playerAlive:number;
 enemyAlive:number;
 seconds:number;
 combo:number;
 cooldowns:Record<string,number>;
 paused:boolean;
 phase:string;
 tutorial:number;
 cinema:string|null;
 message:string;
 replacementAnnouncement?:string;
 drawMatch?:boolean;
};

const W=1280,H=650;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;

function makeFighter(c:Character,level:number,x:number,mastery=0):Fighter{
 const s=stats(c,level,mastery);
 return {c,level,mastery,x,y:GROUND,vx:0,vy:0,face:x<W/2?1:-1,hp:s.hp,maxHp:s.hp,energy:0,guard:100,state:'idle',clock:0,duration:0,attack:0,chain:0,chainTimer:0,hit:false,stun:0,invincible:0,flash:0,cooldowns:{skill1:0,skill2:0,special:0,dodge:0,dash:0,support:0,tag:0},combo:0,comboTimer:0,buff:0,trailClock:0,defeated:false,stride:0,koAngle:0,koBounces:0,koGrounded:false,lastImpact:1};
}

export class BattleEngine{
 canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;audio:GameAudio;
 playerTeam:Fighter[]=[];enemyTeam:Fighter[]=[];playerIndex=0;enemyIndex=0;
 p:Fighter;e:Fighter;
 arena:Arena;match:MatchConfig;owned:Record<string,FighterProgress>;keys=new Set<string>();
 particles:Particle[]=[];effects:Effect[]=[];projectiles:Projectile[]=[];numbers:Damage[]=[];
 trails:{x:number;y:number;life:number;f:Fighter;state:string;clock:number}[]=[];
 time=0;elapsed=0;seconds=99;intro=3.4;phase='intro';paused=false;pauseReason='';
 shake=0;hitStop=0;flash=0;cinema:{fighter:Fighter;time:number;hit:boolean}|null=null;
 ai=0;aiMove=0;raf=0;last=0;snapshotAt=0;done=false;endTimer=0;knockoutTimer=0;replacementTimer=0;
 replacementAnnouncement='';drawMatch=false;
 comboCount=0;ultCount=0;damage=0;used=new Set<string>();
 tutorial=0;tutorialFlags=new Set<string>();tutorialDelay=0;difficulty=1;reduced=false;effectsLevel=true;
 buffer:{a:Action;life:number}|null=null;onSnapshot:(s:BattleSnapshot)=>void;onEnd:(s:BattleReport)=>void;
 bg:HTMLImageElement|null=null;portrait:HTMLImageElement|null=null;controlsCleanup:()=>void=()=>{};
 message='';messageTime=0;movePulse=0;moveDirection=0;cameraX=W/2;cameraZoom=1;speed=1;

 constructor(canvas:HTMLCanvasElement,match:MatchConfig,arena:Arena,owned:Record<string,FighterProgress>,audio:GameAudio,onSnapshot:(s:BattleSnapshot)=>void,onEnd:(s:BattleReport)=>void,opts:{difficulty:number;reduced:boolean;effects:boolean}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d')!;this.match=match;this.arena=arena;this.owned=owned;this.audio=audio;this.onSnapshot=onSnapshot;this.onEnd=onEnd;
  this.difficulty=challenge(opts.difficulty).difficulty;this.reduced=opts.reduced;this.effectsLevel=opts.effects;

  const pTeamIds=match.team&&match.team.length>=3?match.team.slice(0,3):[match.team[0],'ichigo-kurosaki','tanjiro-kamado'];
  this.playerTeam=pTeamIds.map((id,idx)=>{
   const c=byId(id),prog=owned[id]??{level:1,mastery:0};
   return makeFighter(c,prog.level,idx===0?330:-500,prog.mastery);
  });
  this.playerIndex=0;
  this.p=this.playerTeam[0];

  let oppIds=match.opponentTeam&&match.opponentTeam.length>=3?match.opponentTeam.slice(0,3):[];
  let oppLvs=match.opponentLevels&&match.opponentLevels.length>=3?match.opponentLevels.slice(0,3):[];
  if(oppIds.length<3){
   const starterPool=['sakura-haruno','sasuke-uchiha','kakashi-hatake','ichigo-kurosaki','tanjiro-kamado'];
   const set=new Set<string>([match.opponent]);
   for(const id of starterPool){if(set.size<3&&!set.has(id))set.add(id);}
   for(const c of PLAYABLE_CHARACTERS){if(set.size<3&&!set.has(c.id)&&!pTeamIds.includes(c.id))set.add(c.id);}
   oppIds=Array.from(set).slice(0,3);
   oppLvs=[match.opponentLevel,match.opponentLevel,match.opponentLevel];
  }
  this.enemyTeam=oppIds.map((id,idx)=>{
   const c=byId(id);
   const f=makeFighter(c,oppLvs[idx]??match.opponentLevel??1,idx===0?950:1800);
   if(match.mode==='boss'&&idx===0){
    f.maxHp=Math.round(f.maxHp*1.45);
    f.hp=f.maxHp;
   }
   return f;
  });
  if(match.mode==='tutorial'){
   this.enemyTeam.forEach(ef=>{ef.hp=1500;ef.maxHp=1500;});
   this.seconds=180;
   this.p.energy=35;
  }
  this.enemyIndex=0;
  this.e=this.enemyTeam[0];
  this.used.add(this.p.c.id);

  canvas.width=W;canvas.height=H;
  this.loadImages();
  this.bind();
  this.audio.startMusic('battle');
  this.last=performance.now();
  this.raf=requestAnimationFrame(this.frame);
 }

 loadImages(){
  this.bg=arenaImage(this.arena);
  if(!this.bg){this.bg=new Image();this.bg.src=assetUrl(this.arena.image);}
  this.portrait=new Image();
  this.portrait.src=assetUrl('/art/portraits.webp');
 }

 bind(){
  const keydown=(ev:KeyboardEvent)=>{
   if((ev.target as HTMLElement)?.tagName==='INPUT')return;
   const k=ev.key.toLowerCase();
   if(['1','2','3'].includes(k)&&this.phase==='choose_replacement'){
    ev.preventDefault();
    this.chooseReplacement(Number(k)-1);
    return;
   }
   if([' ','arrowleft','arrowright','arrowup','arrowdown','shift','j','k','q','e','r','f','c','t','x','escape'].includes(k))ev.preventDefault();
   if(k==='escape'){if(!ev.repeat)this.setPaused(!this.paused);return;}
   this.setKey(k,true);
   if(ev.repeat)return;
   const maps:Record<string,Action>={j:'light',k:'heavy',q:'skill1',e:'skill2',r:'special',f:'ultimate',c:'support',t:'tag',x:'dash',' ':'jump',arrowup:'jump',w:'jump',shift:'dodge'};
   if(maps[k])this.input(maps[k]);
  };
  const keyup=(ev:KeyboardEvent)=>this.keys.delete(ev.key.toLowerCase());
  const blur=()=>{this.keys.clear();if(!this.done)this.setPaused(true);};
  window.addEventListener('keydown',keydown);
  window.addEventListener('keyup',keyup);
  window.addEventListener('blur',blur);
  const visibility=()=>{if(document.hidden)blur();};
  document.addEventListener('visibilitychange',visibility);
  this.controlsCleanup=()=>{
   window.removeEventListener('keydown',keydown);
   window.removeEventListener('keyup',keyup);
   window.removeEventListener('blur',blur);
   document.removeEventListener('visibilitychange',visibility);
  };
 }

 destroy(){
  cancelAnimationFrame(this.raf);
  this.controlsCleanup();
  this.keys.clear();
  this.audio.startMusic('menu');
 }

 setPaused(paused:boolean){
  if(this.done)return;
  this.paused=paused;
  this.keys.clear();
  this.emit();
 }

 setKey(k:string,down:boolean){
  if(down){
   this.keys.add(k);
   if(['a','d','arrowleft','arrowright'].includes(k)){
    this.moveDirection=k==='a'||k==='arrowleft'?-1:1;
    this.movePulse=.12;
   }
  }else this.keys.delete(k);
 }

 say(s:string){this.message=s;this.messageTime=2.2;}

 input(a:Action){
  if(this.paused||this.done||this.intro>0||!['intro','fight'].includes(this.phase))return;
  if(this.p.stun>0||['light','heavy','skill1','skill2','special','ultimate'].includes(this.p.state)){
   if(['light','heavy','dodge','skill1','skill2'].includes(a))this.buffer={a,life:.32};
   return;
  }
  this.act(this.p,a);
 }

 act(f:Fighter,a:Action){
  const other=f===this.p?this.e:this.p,s=stats(f.c,f.level,f.mastery);
  if(f.defeated||f.stun>0)return false;
  if(a==='support'||a==='tag'){
   if(f===this.p){
    this.say(a==='support'?'Support assist unavailable in 3v3 elimination':'Replacements occur upon knockout in 3v3 elimination');
   }
   return false;
  }
  if(f.cooldowns[a]>0){
   if(f===this.p)this.say(`${a==='dodge'?'Dodge':'Skill'} is recharging`);
   return false;
  }
  const grounded=f.y>=GROUND-2;
  f.face=other.x>f.x?1:-1;

  if(a==='jump'){
   if(!grounded)return false;
   f.vy=-690;f.state='jump';f.clock=0;
   this.burst(f.x,f.y,12,'#c0b5a1',80);
   return true;
  }
  if(a==='dash'||a==='dodge'){
   f.state=a;f.clock=0;
   f.duration=a==='dodge'?.30:.20;
   f.cooldowns[a]=a==='dodge'?1.1:.65;
   f.invincible=a==='dodge'?.29:0;
   let dir=f.face;
   if(f===this.p){
    if(this.keys.has('a')||this.keys.has('arrowleft'))dir=-1;
    if(this.keys.has('d')||this.keys.has('arrowright'))dir=1;
   }
   f.vx=dir*(a==='dash'?850:650);
   this.audio.play('dash');
   if(f===this.p)this.tutorialFlags.add('dodge');
   return true;
  }
  if(a==='ultimate'){
   if(f.energy<100){
    if(f===this.p)this.say('Build 100% energy by attacking and defending');
    return false;
   }
   f.energy=0;f.state='ultimate';f.clock=0;f.duration=2.55;f.invincible=2.65;
   this.cinema={fighter:f,time:0,hit:false};
   this.audio.play('ultimate');
   if(f===this.p)this.tutorialFlags.add('ultimate');
   return true;
  }

  f.state=a;f.clock=0;f.hit=false;f.vx=0;
  if(a==='light'){
   f.chain=f.chainTimer>0?(f.chain%3)+1:1;
   f.chainTimer=.9;
   f.duration=s.rate+(f.chain===3?.14:0);
   f.attack=s.attack*(f.chain===3?1.55:1)*(grounded?1:1.15);
   this.audio.play('light');
   if(f===this.p)this.tutorialFlags.add('attack');
  }
  if(a==='heavy'){f.duration=.68;f.attack=s.attack*2.0;this.audio.play('light');}
  if(a==='skill1'){f.duration=.67;f.cooldowns.skill1=5.5;f.attack=s.attack*2.3;this.audio.play('skill');if(f===this.p)this.tutorialFlags.add('skill');}
  if(a==='skill2'){f.duration=.72;f.cooldowns.skill2=9;f.attack=s.attack*2.8;this.audio.play('skill');if(f===this.p)this.tutorialFlags.add('skill');}
  if(a==='special'){f.duration=.76;f.cooldowns.special=15;f.attack=s.attack*3.15;f.buff=5;this.audio.play('skill');}
  f.duration=moveFor(f.c,a,s.rate,f.chain).duration;
  if(['skill1','skill2','special'].includes(a)&&f===this.p)this.say(a==='special'?'AWAKENING':f.c.skills[a==='skill1'?0:1]);
  return true;
 }

 frame=(now:number)=>{
  const dt=Math.min((now-this.last)/1000,.045);
  this.last=now;
  if(!this.paused){
   if(this.hitStop<=0)this.time+=dt;
   const focus=clamp((this.p.x+this.e.x)/2,W/2-70,W/2+70),zoom=this.reduced?1:1+Math.max(0,1-Math.abs(this.p.x-this.e.x)/650)*.035;
   this.cameraX=lerp(this.cameraX,this.reduced?W/2:focus,1-Math.exp(-dt*5));
   this.cameraZoom=lerp(this.cameraZoom,zoom,1-Math.exp(-dt*7));
   let remain=dt;
   while(remain>0){
    const step=Math.min(remain,1/120);
    this.update(step*this.speed);
    remain-=step;
   }
  }
  this.draw();
  if(now-this.snapshotAt>80){
   this.emit();
   this.snapshotAt=now;
  }
  this.raf=requestAnimationFrame(this.frame);
 };

 update(dt:number){
  this.shake=Math.max(0,this.shake-dt*30);
  this.flash=Math.max(0,this.flash-dt*4);
  this.messageTime=Math.max(0,this.messageTime-dt);
  this.updateEffects(dt);

  if(this.done){
   this.updateKnockout(this.p,dt);
   this.updateKnockout(this.e,dt);
   this.endTimer+=dt;
   if(this.endTimer>3.4&&this.phase!=='reported'){
    this.phase='reported';
    const won=!this.drawMatch&&this.playerTeam.some(f=>!f.defeated&&f.hp>0);
    this.onEnd({
     won,
     draw:this.drawMatch,
     combos:this.comboCount,
     ultimates:this.ultCount,
     used:[...this.used],
     duration:this.elapsed,
     damage:Math.round(this.damage)
    });
   }
   return;
  }

  if(this.intro>0){
   this.intro-=dt;
   this.p.clock+=dt;
   this.e.clock+=dt;
   return;
  }
  if(this.phase==='intro')this.phase='fight';

  if(this.phase==='knockout'){
   this.updateKnockout(this.p,dt);
   this.updateKnockout(this.e,dt);
   this.knockoutTimer+=dt;
   if(this.knockoutTimer>=1.5){
    const playerAlive=this.playerTeam.filter(f=>!f.defeated&&f.hp>0).length;
    const enemyAlive=this.enemyTeam.filter(f=>!f.defeated&&f.hp>0).length;

    if(playerAlive===0&&enemyAlive===0){
     this.done=true;
     this.drawMatch=true;
     this.phase='finished';
     this.audio.play('defeat');
     this.emit();
     return;
    }
    if(playerAlive===0){
     this.done=true;
     this.phase='finished';
     this.audio.play('defeat');
     this.emit();
     return;
    }
    if(enemyAlive===0){
     this.done=true;
     this.phase='finished';
     this.audio.play('victory');
     this.emit();
     return;
    }

    if(this.p.defeated||this.p.hp<=0){
     if(this.e.defeated||this.e.hp<=0){
      const nextE=this.enemyTeam.findIndex((f,idx)=>idx!==this.enemyIndex&&!f.defeated&&f.hp>0);
      if(nextE>=0){this.enemyIndex=nextE;this.e=this.enemyTeam[nextE];}
     }
     this.phase='choose_replacement';
     this.say('Choose your next fighter');
     this.emit();
    }else{
     const nextE=this.enemyTeam.findIndex((f,idx)=>idx!==this.enemyIndex&&!f.defeated&&f.hp>0);
     if(nextE>=0){
      this.enemyIndex=nextE;
      this.e=this.enemyTeam[nextE];
      this.e.x=950;this.e.y=GROUND;this.e.vx=0;this.e.vy=0;this.e.state='idle';this.e.clock=0;this.e.face=-1;this.e.invincible=1.3;
      this.p.x=330;this.p.y=GROUND;this.p.vx=0;this.p.vy=0;this.p.state='idle';this.p.clock=0;this.p.face=1;this.p.invincible=1.3;
      this.projectiles=[];this.buffer=null;this.keys.clear();this.ai=0.25;this.aiMove=0;
      this.phase='replacement_intro';
      this.replacementTimer=1.3;
      this.replacementAnnouncement=`${this.e.c.name.toUpperCase()} ENTERS THE ARENA!`;
      this.say(`${this.e.c.name} enters the battle!`);
      this.audio.play('dash');
      this.emit();
     }
    }
   }
   return;
  }

  if(this.phase==='choose_replacement'){
   this.updateKnockout(this.p,dt);
   this.updateKnockout(this.e,dt);
   return;
  }

  if(this.phase==='replacement_intro'){
   this.replacementTimer-=dt;
   this.p.clock+=dt;
   this.e.clock+=dt;
   this.p.x=lerp(this.p.x,330,1-Math.exp(-dt*8));
   this.e.x=lerp(this.e.x,950,1-Math.exp(-dt*8));
   if(this.replacementTimer<=0){
    this.phase='fight';
    this.replacementAnnouncement='';
    this.emit();
   }
   return;
  }

  if(this.hitStop>0){this.hitStop-=dt;return;}

  if(this.cinema){
   const cine=this.cinema,f=cine.fighter,target=f===this.p?this.e:this.p;
   cine.time+=dt;f.clock=cine.time;
   if(cine.time>.78&&cine.time<1.12&&['blink','slash','uppercut'].includes(ultimateFor(f.c))){
    const destination=target.x-f.face*130;
    f.x=lerp(f.x,destination,1-Math.exp(-dt*14));
   }
   if(cine.time>1.12&&!cine.hit){
    cine.hit=true;
    this.hit(f,target,stats(f.c,f.level,f.mastery).attack*6.5,'ultimate');
    this.flash=this.reduced?.04:.20;
    this.shake=this.reduced?0:15;
    if(f===this.p){
     this.ultCount++;
     if(this.match.mode==='tutorial'&&this.tutorial>=5){
      target.hp=0;
      for(const ef of this.enemyTeam)ef.hp=0;
     }
    }
   }
   if(cine.hit){
    target.clock+=dt;target.flash=Math.max(0,target.flash-dt);
    target.x=clamp(target.x+target.vx*dt*.3,100,W-100);
    target.vx*=Math.exp(-dt*5);
    if(target.y<GROUND||target.vy<0){
     target.vy+=1800*dt;
     target.y=Math.min(GROUND,target.y+target.vy*dt);
     if(target.y===GROUND)target.vy=0;
    }
   }
   if(cine.time>2.5){
    f.state='idle';f.clock=0;f.invincible=0;this.cinema=null;
    this.checkEnd();
   }
   return;
  }

  this.elapsed+=dt;
  this.seconds=Math.max(0,this.seconds-dt);
  if(this.buffer){
   this.buffer.life-=dt;
   if(this.buffer.life<=0)this.buffer=null;
   else if(this.canAct(this.p)){
    const a=this.buffer.a;
    this.buffer=null;
    this.act(this.p,a);
   }
  }

  this.controlPlayer(dt);
  this.controlEnemy(dt);
  this.updateFighter(this.p,dt);
  this.updateFighter(this.e,dt);

  if(Math.abs(this.p.x-this.e.x)<55&&Math.abs(this.p.y-this.e.y)<90&&!['dash','dodge','skill2'].includes(this.p.state)&&!['dash','dodge','skill2'].includes(this.e.state)){
   const d=this.p.x<this.e.x?-1:1;
   this.p.x+=d*90*dt;
   this.e.x-=d*90*dt;
  }

  for(const pr of this.projectiles){
   pr.x+=pr.vx*dt;pr.life-=dt;
   const target=pr.owner===this.p?this.e:this.p;
   if(Math.abs(pr.x-target.x)<pr.size+25&&Math.abs(pr.y-(target.y-130))<pr.size+70){
    this.hit(pr.owner,target,pr.damage,'skill');
    pr.life=0;
   }
   if(pr.x<-100||pr.x>W+100)pr.life=0;
   if(Math.random()<.3)this.burst(pr.x,pr.y,1,pr.color,40);
  }
  this.projectiles=this.projectiles.filter(pr=>pr.life>0);
  this.updateTutorial(dt);
  this.checkEnd();
 }

 chooseReplacement(slotIndex:number){
  if(this.phase!=='choose_replacement')return;
  if(slotIndex<0||slotIndex>=this.playerTeam.length)return;
  const f=this.playerTeam[slotIndex];
  if(f.defeated||f.hp<=0)return;

  this.playerIndex=slotIndex;
  this.p=f;
  this.used.add(f.c.id);
  this.p.x=330;this.p.y=GROUND;this.p.vx=0;this.p.vy=0;this.p.state='idle';this.p.clock=0;this.p.face=1;this.p.invincible=1.3;
  this.e.x=950;this.e.y=GROUND;this.e.vx=0;this.e.vy=0;this.e.state='idle';this.e.clock=0;this.e.face=-1;this.e.invincible=1.3;

  this.projectiles=[];this.buffer=null;this.keys.clear();this.ai=0.25;this.aiMove=0;
  this.phase='replacement_intro';
  this.replacementTimer=1.3;
  this.replacementAnnouncement=`${this.p.c.name.toUpperCase()} ENTERS THE ARENA!`;
  this.say(`${this.p.c.name} enters the battle!`);
  this.audio.play('dash');
  this.emit();
 }

 canAct(f:Fighter){
  return !f.defeated&&f.stun<=0&&['idle','run','jump','fall','block'].includes(f.state);
 }

 controlPlayer(dt:number){
  this.movePulse=Math.max(0,this.movePulse-dt);
  const f=this.p;
  if(!this.canAct(f))return;
  let move=0;
  if(this.keys.has('a')||this.keys.has('arrowleft'))move--;
  if(this.keys.has('d')||this.keys.has('arrowright'))move++;
  if(!move&&this.movePulse>0)move=this.moveDirection;
  const block=this.keys.has('s')||this.keys.has('arrowdown');
  if(block&&f.guard>1&&f.y>=GROUND){
   f.state='block';f.vx=0;
  }else{
   const speed=stats(f.c,f.level,f.mastery).speed;
   const backwards=move*f.face<0;
   const target=move*speed*(backwards?.76:1);
   f.vx=lerp(f.vx,target,1-Math.exp(-dt*(move?COMBAT_BALANCE.acceleration:COMBAT_BALANCE.braking)));
   if(Math.abs(f.vx)<5)f.vx=0;
   if(f.y>=GROUND)f.state=f.vx?'run':'idle';
   if(move)this.tutorialFlags.add('move');
  }
  f.face=this.e.x>f.x?1:-1;
 }

 controlEnemy(dt:number){
  if(this.match.mode==='tutorial'){
   if(this.canAct(this.e)){
    const dist=this.p.x-this.e.x;
    this.e.vx=Math.abs(dist)>155?Math.sign(dist)*85:0;
    this.e.state=this.e.vx?'run':'idle';
    this.e.face=dist>0?1:-1;
   }
   return;
  }
  const f=this.e,p=this.p,profile=challenge(this.difficulty);
  this.ai-=dt;
  if(!this.canAct(f))return;
  const s=stats(f.c,f.level,f.mastery),distance=Math.abs(f.x-p.x),dir=p.x>f.x?1:-1;
  const ranged=['beam','mage'].includes(f.c.style),reach=s.range+18;
  f.face=dir;
  const steer=(velocity:number)=>{
   this.aiMove=velocity;
   f.vx=lerp(f.vx,velocity,1-Math.exp(-dt*COMBAT_BALANCE.acceleration));
   if(Math.abs(f.vx)<5)f.vx=0;
   if(f.y>=GROUND)f.state=f.vx?'run':'idle';
  };
  const attack=(action:Action)=>{this.aiMove=0;return this.act(f,action);};
  if(this.ai>0){
   if(f.state==='block'){f.vx=0;return;}
   // Stop at striking distance instead of running through the other fighter.
   steer(this.aiMove*dir>0&&distance<reach*.85?0:this.aiMove);
   return;
  }
  this.ai=profile.decision+Math.random()*.12;
  const roll=Math.random();
  const incoming=this.projectiles.some(pr=>pr.owner===p&&(pr.x-f.x)*pr.vx<0&&Math.abs(pr.x-f.x)<220);
  const winding=['light','heavy','skill1','skill2'].includes(p.state)&&!p.hit&&p.clock>=profile.reaction;
  const threatened=incoming||(winding&&distance<(p.state==='light'?170:p.state==='heavy'?205:390));
  if(threatened&&roll<profile.defense){
   if((incoming||p.state==='heavy'||f.guard<30)&&f.cooldowns.dodge<=0){
    attack('dodge');f.vx=-dir*580;this.ai=.28;return;
   }
   if(f.guard>25&&p.state!=='heavy'){this.aiMove=0;f.state='block';f.vx=0;this.ai=.20+Math.random()*.16;return;}
  }
  if(f.energy>=100&&distance<650&&roll<.58){attack('ultimate');return;}
  if(f.hp<f.maxHp*.55&&f.cooldowns.special<=0&&distance<280&&roll<.23){attack('special');return;}
  // A visible missed strike exposes a recovery window, rather than giving the
  // CPU instant knowledge of future inputs.
  if(distance<reach&&p.hit&&['heavy','skill1','skill2'].includes(p.state)){
   attack('light');this.ai=.10;return;
  }
  if(distance<reach){
   if(p.state==='block'&&roll<.78){attack('heavy');return;}
   if(f.combo>=3&&roll<.35){steer(-dir*s.speed*.58);this.ai=.25;return;}
   if(roll<.57){attack('light');this.ai=.08;}
   else if(roll<.78)attack('heavy');
   else if(f.cooldowns.skill2<=0)attack('skill2');
   else if(f.cooldowns.skill1<=0)attack('skill1');
   else attack('light');
   return;
  }
  if(distance<550&&distance>reach&&f.cooldowns.skill1<=0&&roll<(ranged?.65:.28)){
   attack('skill1');return;
  }
  if(distance<360&&f.cooldowns.skill2<=0&&roll<.18){attack('skill2');return;}
  if(distance>440&&f.cooldowns.dash<=0&&roll>.80){attack('dash');return;}
  steer(dir*s.speed*profile.speed);
 }

 updateFighter(f:Fighter,dt:number){
  const other=f===this.p?this.e:this.p;
  f.clock+=dt;f.trailClock+=dt;
  if(f.state==='run')f.stride+=Math.abs(f.gaitVelocity??f.vx)*dt*Math.PI*2/COMBAT_BALANCE.strideDistance;
  f.stun=Math.max(0,f.stun-dt);
  f.invincible=Math.max(0,f.invincible-dt);
  f.flash=Math.max(0,f.flash-dt);
  f.buff=Math.max(0,f.buff-dt);
  f.comboTimer-=dt;
  if(f.comboTimer<=0)f.combo=0;
  f.chainTimer-=dt;
  for(const k of Object.keys(f.cooldowns))f.cooldowns[k]=Math.max(0,f.cooldowns[k]-dt);
  if(f.state==='block')f.guard=Math.max(0,f.guard-dt*10);else f.guard=Math.min(100,f.guard+dt*17);
  f.energy=Math.min(100,f.energy+dt*COMBAT_BALANCE.passiveEnergy);

  if(f.stun>0){f.state='hit';f.vx*=Math.pow(.015,dt);}
  else if(f.state==='hit'){f.state='idle';f.vx=0;}

  const attacking=['light','heavy','skill1','skill2','special'].includes(f.state);
  if(attacking){
   const t=f.clock/f.duration,s=stats(f.c,f.level,f.mastery),move=moveFor(f.c,f.state,s.rate,f.chain),previous=Math.max(0,(f.clock-dt)/f.duration);
   const root=(v:number)=>smooth((v-(move.contact-.20))/.27);
   const travel=move.lunge*(root(t)-root(previous));
   if(Math.abs(other.x-f.x)>85)f.x+=f.face*Math.min(travel,Math.max(0,Math.abs(other.x-f.x)-85));
   if(t>=move.contact&&!f.hit){f.hit=true;this.release(f,other,move.technique);}
   if(t>=1){f.state=f.y<GROUND?'fall':'idle';f.clock=0;f.vx=0;}
  }

  const fast=['dash','dodge'].includes(f.state),strike=attacking&&f.clock/f.duration>.30&&f.clock/f.duration<.58;
  if(!this.reduced&&this.effectsLevel&&(fast||strike)&&f.trailClock>.045){
   f.trailClock=0;
   this.trails.push({x:f.x,y:f.y,life:fast?.22:.14,f:{...f},state:f.state,clock:f.clock});
   if(this.trails.length>24)this.trails.shift();
  }
  if(fast&&f.clock>=f.duration){f.state=f.y<GROUND?'fall':'idle';f.vx=0;}
  if(f.y<GROUND||f.vy<0){
   f.vy+=1800*dt;
   f.y+=f.vy*dt;
   if(f.y>=GROUND){
    f.y=GROUND;f.vy=0;
    if(['jump','fall'].includes(f.state))f.state='idle';
    this.effects.push({x:f.x,y:GROUND,life:.4,max:.4,size:75,color:'#ccbda4',type:'land',face:1});
   }
  }
  f.x=clamp(f.x+f.vx*dt,60,W-60);
  if(f.state==='idle'||f.state==='block')f.vx=0;
 }

 release(f:Fighter,other:Fighter,technique:string){
  const state=f.state,s=stats(f.c,f.level,f.mastery),color=ELEMENT_COLORS[f.c.element];
  const fx=(type:string,size:number,life=.38,x=f.x+f.face*45,y=f.y-135)=>this.effects.push({x,y,life,max:life,size,color,type,face:f.face,seed:f.chain,endX:other.x});
  if(state==='light'||state==='heavy'){
   fx(f.c.style==='sword'?'slash':state==='heavy'?'uppercut':'rush',state==='heavy'?155:s.range,.25);
   if(Math.abs(f.x-other.x)<s.range+(state==='heavy'?35:0)+(f.c.id==='monkey-d-luffy'?40:0)&&Math.abs(f.y-other.y)<(state==='heavy'?180:140))this.hit(f,other,f.attack,state);
   return;
  }
  if(technique==='blink'){
   if(!this.reduced)for(let i=0;i<3;i++)this.trails.push({x:lerp(f.x,other.x-f.face*95,i/3),y:f.y,life:.3+i*.05,f:{...f},state:'dash',clock:.1});
   f.x=clamp(other.x-f.face*95,65,W-65);fx('slash',150,.4);if(Math.abs(f.y-other.y)<180)this.hit(f,other,f.attack,'skill');
  }else if(technique==='beam'){
   const endX=clamp(f.x+f.face*920,0,W);this.effects.push({x:f.x+f.face*48,y:f.y-139,endX,life:.44,max:.44,size:58,color,type:'beam',face:f.face});
   if((other.x-f.x)*f.face>0&&Math.abs(f.x-other.x)<920&&Math.abs(f.y-other.y)<95)this.hit(f,other,f.attack,'skill');
  }else if(technique==='volley'){this.projectile(f,f.attack*.55,color,'orb',3);fx('rush',100);}
  else if(technique==='slash'&&state==='skill1'){this.projectile(f,f.attack,color,'crescent',1);fx('slash',165);}
  else{
   fx(technique,technique==='quake'||technique==='vortex'?260:175,.55,technique==='quake'?other.x:f.x+f.face*50,technique==='quake'?GROUND:f.y-120);
   const range=technique==='rush'?210:technique==='vortex'?310:260;
   if(Math.abs(f.x-other.x)<range&&Math.abs(f.y-other.y)<220)this.hit(f,other,f.attack,technique==='uppercut'||technique==='quake'?'heavy':'skill');
   if(f.c.element==='lightning')fx('lightning',80,.26);
  }
  this.audio.play('release');
 }

 projectile(f:Fighter,damage:number,color:string,style:string,count:number){
  for(let i=0;i<count;i++)this.projectiles.push({x:f.x+f.face*(45-i*40),y:f.y-130+(i-1)*18,vx:f.face*(590+i*60),owner:f,life:2,size:style==='crescent'?42:25,damage,color,style});
 }

 hit(attacker:Fighter,target:Fighter,raw:number,kind:string){
  if(target.invincible>0||target.defeated)return;
  const guarded=target.state==='block'&&target.guard>12&&kind!=='ultimate'&&kind!=='heavy';
  const defense=stats(target.c,target.level,target.mastery).defense;
  const scaling=kind==='ultimate'?1:Math.max(.52,1-Math.max(0,attacker.combo-2)*.10);
  let dmg=Math.max(4,Math.round(raw*COMBAT_BALANCE.damageMultiplier*scaling*(100/(100+defense*.55))*(attacker.buff>0?1.15:1)*(attacker===this.e?challenge(this.difficulty).damage:1)));
  if(guarded){
   dmg=Math.round(dmg*.12);
   target.hp=Math.max(0,target.hp-dmg);
   target.guard=Math.max(0,target.guard-19);
   this.audio.play('block');
   this.numbers.push({x:target.x,y:target.y-230,text:'GUARD',life:.8,color:'#a7daed'});
   this.burst(target.x-target.face*10,target.y-130,12,'#c1e9ff',170);
   target.energy=Math.min(100,target.energy+5);
  }else{
   target.hp=Math.max(0,target.hp-dmg);
   if(this.match.mode==='tutorial'&&this.tutorial<5&&target===this.e)target.hp=Math.max(350,target.hp);
   target.lastImpact=kind==='ultimate'?2:kind==='heavy'?1.5:1;
   target.stun=kind==='ultimate'?.65:kind==='heavy'?.44:.19;
   target.state='hit';
   target.clock=0;
   target.flash=.13;
   target.vx=attacker.face*(kind==='ultimate'?650:kind==='heavy'?420:155);
   if(kind==='heavy'||kind==='ultimate'){target.vy=kind==='ultimate'?-420:-520;target.y-=4;}
   if(kind==='heavy'&&target.guard>0)target.guard=Math.max(0,target.guard-42);
   attacker.combo++;
   attacker.comboTimer=1.1;
   if(attacker===this.p){
    this.damage+=dmg;
    if(attacker.combo%3===0){this.comboCount++;this.tutorialFlags.add('combo');}
   }
   attacker.energy=Math.min(100,attacker.energy+(kind==='light'?COMBAT_BALANCE.lightEnergy:kind==='ultimate'?0:COMBAT_BALANCE.skillEnergy));
   target.energy=Math.min(100,target.energy+COMBAT_BALANCE.receivedEnergy);
   this.hitStop=this.reduced?.018:kind==='ultimate'?.11:kind==='heavy'?.075:.045;
   this.shake=this.reduced?0:kind==='ultimate'?20:kind==='heavy'?10:4;
   this.flash=kind==='heavy'?.12:.035;
   this.audio.play(kind==='heavy'?'heavy':'hit',kind==='ultimate'?1.8:1);
   this.numbers.push({x:target.x+(Math.random()-.5)*40,y:target.y-215,text:String(dmg),life:1,color:attacker===this.p?'#ffffff':'#ffa393'});
   this.burst(target.x,target.y-130,kind==='ultimate'?55:kind==='heavy'?26:17,ELEMENT_COLORS[attacker.c.element],kind==='ultimate'?600:350);
   this.effects.push({x:target.x,y:target.y-130,life:.2,max:.2,size:kind==='ultimate'?190:65,color:'#fff5d8',type:'hit',face:attacker.face});
  }
 }

 updateTutorial(dt:number){
  if(this.match.mode!=='tutorial')return;
  const stages=['move','attack','combo','dodge','skill','ultimate'];
  if(this.tutorialFlags.has(stages[this.tutorial])){
   this.tutorialDelay+=dt;
   if(this.tutorialDelay>.7){
    this.tutorial++;
    this.tutorialDelay=0;
    if(this.tutorial===5)this.p.energy=100;
   }
  }
  if(this.tutorial<5)this.seconds=180;
  if(this.tutorial===5)this.p.energy=Math.max(100,this.p.energy);
 }

 checkEnd(){
  if(this.cinema||this.done)return;
  if(this.phase!=='fight'&&this.phase!=='intro')return;
  if(this.p.hp<=0||this.e.hp<=0){
   this.projectiles=[];
   this.buffer=null;
   this.keys.clear();

   if(this.p.hp<=0){
    this.p.hp=0;
    this.p.defeated=true;
    this.p.state='defeat';
    this.p.clock=0;
    this.p.y-=fighterHeight(this.p.c.id)*.48;
    this.p.vx=-this.p.face*(220+this.p.lastImpact*70);
    this.p.vy=-180-this.p.lastImpact*65;
    this.p.koAngle=-.15;
    this.p.koBounces=0;
    this.p.koGrounded=false;
   }
   if(this.e.hp<=0){
    this.e.hp=0;
    this.e.defeated=true;
    this.e.state='defeat';
    this.e.clock=0;
    this.e.y-=fighterHeight(this.e.c.id)*.48;
    this.e.vx=-this.e.face*(220+this.e.lastImpact*70);
    this.e.vy=-180-this.e.lastImpact*65;
    this.e.koAngle=-.15;
    this.e.koBounces=0;
    this.e.koGrounded=false;
   }
   if(this.p.hp>0){
    this.p.state='victory';this.p.clock=0;this.p.vx=0;this.p.vy=0;this.p.y=GROUND;
   }
   if(this.e.hp>0){
    this.e.state='victory';this.e.clock=0;this.e.vx=0;this.e.vy=0;this.e.y=GROUND;
   }

   const pAlive=this.playerTeam.some(f=>!f.defeated&&f.hp>0);
   const eAlive=this.enemyTeam.some(f=>!f.defeated&&f.hp>0);
   if(!pAlive||!eAlive){
    this.done=true;
    this.drawMatch=!pAlive&&!eAlive;
    this.phase='finished';
    this.audio.play(this.drawMatch||!pAlive?'defeat':'victory');
    this.emit();
    return;
   }

   this.phase='knockout';
   this.knockoutTimer=0;
   this.audio.play('defeat');
   this.say('K.O.!');
   this.emit();
  }
 }

 updateKnockout(f:Fighter,dt:number){
  f.clock+=dt;f.flash=Math.max(0,f.flash-dt);
  if(!f.defeated)return;
  if(!f.koGrounded){
   f.vy+=1550*dt;f.y+=f.vy*dt;f.x=clamp(f.x+f.vx*dt,145,W-145);
   f.koAngle=lerp(f.koAngle,-1.51,1-Math.exp(-dt*6));
   const floor=GROUND-knockoutFloorOffset(f.c.id);
   if(f.y>=floor&&f.vy>0){
    f.y=floor;f.koBounces++;this.audio.play('land');
    this.effects.push({x:f.x,y:GROUND,life:.65,max:.65,size:f.koBounces===1?160:85,color:'#cfbf9a',type:'dust',face:1});
    if(f.koBounces===1){f.vy=-Math.min(135,f.vy*.2);f.vx*=.43;this.shake=this.reduced?0:7;}
    else{f.vy=0;f.koGrounded=true;f.koAngle=-Math.PI/2;}
   }
  }else{f.x=clamp(f.x+f.vx*dt,145,W-145);f.vx*=Math.exp(-dt*9);}
 }

 burst(x:number,y:number,n:number,color:string,speed:number){
  const cap=this.effectsLevel?210:65;
  n=this.effectsLevel?n:Math.ceil(n*.35);
  for(let i=0;i<n&&this.particles.length<cap;i++){
   const a=Math.random()*Math.PI*2,v=speed*(.25+Math.random()*.75),life=.25+Math.random()*.45;
   this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,max:life,size:2+Math.random()*5,color,kind:Math.random()>.5?1:0});
  }
 }

 updateEffects(dt:number){
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;p.vx*=Math.pow(.14,dt);}
  this.particles=this.particles.filter(p=>p.life>0);
  if(this.effects.length>64)this.effects.splice(0,this.effects.length-64);
  for(const e of this.effects)e.life-=dt;
  this.effects=this.effects.filter(e=>e.life>0);
  for(const n of this.numbers){n.life-=dt;n.y-=42*dt;}
  this.numbers=this.numbers.filter(n=>n.life>0);
  for(const t of this.trails)t.life-=dt;
  this.trails=this.trails.filter(t=>t.life>0);
 }

 emit(){
  const playerRoster:TeamFighterSnapshot[]=this.playerTeam.map((f,idx)=>({
   id:f.c.id,
   name:f.c.name,
   hp:Math.max(0,Math.round(f.hp)),
   maxHp:f.maxHp,
   energy:Math.round(f.energy),
   level:f.level,
   defeated:f.defeated||f.hp<=0,
   active:idx===this.playerIndex,
   element:f.c.element
  }));
  const enemyRoster:TeamFighterSnapshot[]=this.enemyTeam.map((f,idx)=>({
   id:f.c.id,
   name:f.c.name,
   hp:Math.max(0,Math.round(f.hp)),
   maxHp:f.maxHp,
   energy:Math.round(f.energy),
   level:f.level,
   defeated:f.defeated||f.hp<=0,
   active:idx===this.enemyIndex,
   element:f.c.element
  }));
  this.onSnapshot({
   player:{hp:Math.round(this.p.hp),maxHp:this.p.maxHp,energy:Math.round(this.p.energy),guard:Math.round(this.p.guard),id:this.p.c.id,level:this.p.level},
   enemy:{hp:Math.round(this.e.hp),maxHp:this.e.maxHp,energy:Math.round(this.e.energy),id:this.e.c.id,level:this.e.level},
   playerTeam:playerRoster,
   enemyTeam:enemyRoster,
   playerAlive:playerRoster.filter(f=>!f.defeated).length,
   enemyAlive:enemyRoster.filter(f=>!f.defeated).length,
   seconds:Math.floor(this.elapsed),
   combo:this.p.combo,
   cooldowns:{...this.p.cooldowns},
   paused:this.paused,
   phase:this.phase,
   tutorial:this.tutorial,
   cinema:this.cinema?.fighter.c.ultimate??null,
   message:this.messageTime>0?this.message:'',
   replacementAnnouncement:this.replacementAnnouncement,
   drawMatch:this.drawMatch
  });
 }

 draw(){
  const ctx=this.ctx;
  ctx.clearRect(0,0,W,H);
  this.drawBackground();
  ctx.save();
  const shake=this.shake*(this.effectsLevel?1:.5);
  if(shake)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  if(!this.reduced){
   ctx.translate(W/2,390);
   ctx.scale(this.cameraZoom,this.cameraZoom);
   ctx.translate(-this.cameraX,-390);
  }
  if(this.cinema&&!this.reduced){
   const z=1+Math.sin(Math.min(1,this.cinema.time/2.1)*Math.PI)*.05;
   ctx.translate(W/2,H/2);
   ctx.scale(z,z);
   ctx.translate(-W/2,-H/2);
  }
  for(const f of [this.p,this.e]){
   ctx.fillStyle='#00000066';
   ctx.beginPath();
   ctx.ellipse(f.x,GROUND+8,Math.max(22,f.defeated?90:55-(GROUND-f.y)*.035),12,0,0,Math.PI*2);
   ctx.fill();
  }
  for(const t of this.trails){
   ctx.save();
   ctx.globalAlpha=t.life*.85;
   drawFighter(ctx,{...t.f,x:t.x,y:t.y,state:t.state,clock:t.clock},this.time,1,this.reduced?0:1);
   ctx.restore();
  }
  drawCharge(ctx,this.e,this.time,this.effectsLevel);
  drawCharge(ctx,this.p,this.time,this.effectsLevel);
  drawFighter(ctx,this.e,this.time,1,this.reduced?0:1);
  drawFighter(ctx,this.p,this.time,1,this.reduced?0:1);
  this.drawFX();
  if(this.cinema)drawUltimate(ctx,this.cinema.fighter,this.cinema.fighter===this.p?this.e:this.p,this.cinema.time,this.effectsLevel);
  ctx.restore();

  if(this.cinema)this.drawCinema();
  if(this.flash>0){ctx.fillStyle=`rgba(243,242,255,${this.flash})`;ctx.fillRect(0,0,W,H);}
  if(this.intro>0)this.drawIntro();

  if(this.phase==='replacement_intro'&&this.replacementAnnouncement){
   ctx.save();
   ctx.fillStyle='#060e22cc';
   ctx.fillRect(0,240,W,90);
   ctx.fillStyle='#ffcd67';
   ctx.fillRect(0,240,W,2);
   ctx.fillRect(0,330,W,2);
   ctx.textAlign='center';
   ctx.font='italic 900 36px Manrope';
   ctx.lineWidth=6;
   ctx.strokeStyle='#0a101c';
   ctx.strokeText(this.replacementAnnouncement,W/2,298);
   ctx.fillStyle='#ffffff';
   ctx.fillText(this.replacementAnnouncement,W/2,298);
   ctx.restore();
  }

  if(this.phase==='knockout'&&this.knockoutTimer>.15){
   ctx.save();
   ctx.textAlign='center';
   ctx.font='italic 900 94px Manrope';
   ctx.lineWidth=7;
   ctx.strokeStyle='#0a101c';
   ctx.strokeText('K.O.',W/2,275);
   ctx.fillStyle='#ffe2a0';
   ctx.fillText('K.O.',W/2,275);
   ctx.restore();
  }

  if(this.done&&this.phase!=='reported'&&this.endTimer>.8){
   ctx.save();
   const late=this.endTimer>2.05;
   ctx.globalAlpha=Math.min(1,(this.endTimer-.8)*4);
   ctx.textAlign='center';
   ctx.font=late?'italic 900 50px Manrope':'italic 900 94px Manrope';
   ctx.lineWidth=7;
   ctx.strokeStyle='#0a101c';
   const pWon=this.playerTeam.some(f=>!f.defeated&&f.hp>0);
   const word=late?(this.drawMatch?'DRAW':pWon?'VICTORY':'DEFEAT'):(this.drawMatch?'DRAW':'K.O.');
   ctx.strokeText(word,W/2,late?235:275);
   ctx.fillStyle=word==='VICTORY'?'#ffe2a0':'#f1f4fa';
   ctx.fillText(word,W/2,late?235:275);
   ctx.restore();
  }

  if(this.paused){
   ctx.fillStyle='#060d18aa';
   ctx.fillRect(0,0,W,H);
  }
 }

 drawBackground(){
  const ctx=this.ctx,bg=this.bg,weather=this.arena.weather;
  ctx.fillStyle='#17263a';ctx.fillRect(0,0,W,H);
  if(bg?.complete&&bg.naturalWidth)ctx.drawImage(bg,0,0,bg.naturalWidth,bg.naturalHeight,0,0,W,H);
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#050b1855');g.addColorStop(.25,'#06101c00');g.addColorStop(.8,'#050a150c');g.addColorStop(1,'#050a1560');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(weather==='none')return;
  const drift=this.reduced?0:this.time,count=this.effectsLevel?28:9;
  for(let i=0;i<count;i++){
   const speed=weather==='wind'?240:weather==='rain'?90:10+(i%4)*5;
   const x=(i*137+drift*speed)%W,y=weather==='rain'?(i*77+drift*430)%H:weather==='ember'||weather==='bubble'?(H+i*77-drift*(18+i%5*3)%H)%H:(i*77+Math.sin(drift+i)*26)%H;
   ctx.globalAlpha=weather==='rain'?.19:weather==='mist'?.1:.18+(Math.sin(drift+i)+1)*.1;
   if(weather==='rain'||weather==='wind'){ctx.strokeStyle='#c4e1f6';ctx.lineWidth=weather==='rain'?1:2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-(weather==='wind'?70:9),y+(weather==='wind'?0:23));ctx.stroke();}
   else if(weather==='bubble'){ctx.strokeStyle='#bceff3';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y,6+i%5*4,0,Math.PI*2);ctx.stroke();}
   else{ctx.fillStyle=weather==='ember'?'#ffb363':weather==='petal'?'#f6afd3':weather==='leaf'?'#d3d098':weather==='ash'?'#bfb7c0':weather==='star'?'#c1afff':'#cbe7eb';ctx.beginPath();ctx.ellipse(x,y,weather==='leaf'||weather==='petal'?4.5:weather==='mist'?12:2,weather==='mist'?2:1.6,drift*.3+i,0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
 }

 drawFX(){
  const c=this.ctx;
  c.save();
  c.globalCompositeOperation='lighter';
  for(const pr of this.projectiles){
   c.save();
   c.translate(pr.x,pr.y);
   c.scale(pr.vx>0?1:-1,1);
   c.shadowBlur=25;c.shadowColor=pr.color;c.strokeStyle=pr.color;c.fillStyle=pr.color;
   if(pr.style==='crescent'){
    c.lineWidth=10;c.beginPath();c.arc(-25,0,58,-1.3,1.3);c.stroke();c.lineWidth=3;c.strokeStyle='#fff';c.stroke();
   }else{
    const g=c.createRadialGradient(0,0,2,0,0,pr.size);g.addColorStop(0,'#fff');g.addColorStop(.35,pr.color);g.addColorStop(1,pr.color+'00');c.fillStyle=g;c.beginPath();c.ellipse(0,0,pr.size*1.4,pr.size,0,0,Math.PI*2);c.fill();c.strokeStyle=pr.color;c.lineWidth=4;c.beginPath();c.moveTo(-50,0);c.lineTo(0,0);c.stroke();
   }
   c.restore();
  }
  for(const e of this.effects)drawCombatEffect(c,e,this.effectsLevel);
  for(const p of this.particles){
   c.globalAlpha=p.life/p.max;c.fillStyle=p.color;c.strokeStyle=p.color;
   if(p.kind){c.lineWidth=p.size*.6;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.03,p.y-p.vy*.03);c.stroke();}
   else c.fillRect(p.x,p.y,p.size,p.size);
  }
  c.restore();
  for(const n of this.numbers){
   c.globalAlpha=Math.min(1,n.life*2);c.textAlign='center';
   c.font=n.text==='GUARD'?'bold 16px Inter':'italic 900 27px Manrope';
   c.lineWidth=4;c.strokeStyle='#080d1a';
   c.strokeText(n.text,n.x,n.y);
   c.fillStyle=n.color;
   c.fillText(n.text,n.x,n.y);
  }
  c.globalAlpha=1;
 }

 drawIntro(){
  const c=this.ctx;
  c.fillStyle='#060e2255';c.fillRect(0,0,W,H);
  c.textAlign='center';
  c.fillStyle='#f4f7ee';
  c.font='italic 900 106px Manrope';
  const word=this.intro>2.6?'READY':this.intro>1.85?'3':this.intro>1.1?'2':this.intro>.45?'1':'FIGHT';
  c.shadowColor='#6cecf2';c.shadowBlur=24;
  c.fillText(word,W/2,310);
  c.shadowBlur=0;
  c.fillStyle='#ffffffc0';
  c.font='16px Inter';
  c.fillText(this.arena.name.toUpperCase(),W/2,352);
 }

 drawCinema(){
  const cine=this.cinema!,c=this.ctx,t=cine.time,f=cine.fighter,col=ELEMENT_COLORS[f.c.element];
  if(t<.78){
   c.fillStyle='#050816bb';c.fillRect(0,0,W,H);
   c.save();
   const sweep=clamp(t*5,0,1);
   c.translate((1-sweep)*W,0);
   c.fillStyle=col+'28';
   c.fillRect(0,190,W,220);
   if(f.c.portrait>=0&&this.portrait?.complete&&this.portrait.naturalWidth){
    const img=this.portrait,sw=img.naturalWidth/5,sh=img.naturalHeight/3;
    c.save();c.beginPath();c.rect(20,190,290,220);c.clip();
    c.drawImage(img,(f.c.portrait%5)*sw,Math.floor(f.c.portrait/5)*sh,sw,sh,10,140,300,300);
    c.restore();
   }else{
    c.save();c.beginPath();c.rect(20,190,290,220);c.clip();
    drawIllustratedFighter(c,{...f,x:166,y:480,state:'idle',face:1,flash:0,defeated:false},this.time,1.12,0);
    c.restore();
   }
   c.fillStyle=col;
   c.fillRect(0,190,W,3);
   c.fillRect(0,410,W,3);
   c.textAlign='left';
   c.font='bold 16px Inter';
   c.fillText(f.c.name.toUpperCase(),340,254);
   c.font='italic 900 36px Manrope';
   c.fillStyle='#fff';
   const words=f.c.ultimate.split(':');
   c.fillText(words[0].toUpperCase(),340,307,880);
   if(words[1]){c.font='italic bold 28px Manrope';c.fillText(words[1].trim().toUpperCase(),340,352,860);}
   c.restore();
  }
  c.fillStyle='#03060e';
  const h=Math.min(45,t*130);
  c.fillRect(0,0,W,h);
  c.fillRect(0,H-h,W,h);
  if(t>.82&&t<1.6&&!this.reduced){
   c.strokeStyle=col+'99';
   c.lineWidth=2;
   for(let i=0;i<24;i++){
    const y=i*29;
    c.beginPath();
    c.moveTo(f.face>0?0:W,y);
    c.lineTo(f.face>0?380:W-380,y+(H/2-y)*.4);
    c.stroke();
   }
  }
 }
}

export function drawFighter(c:CanvasRenderingContext2D,f:Fighter,time:number,scale=1,motion=1){
 drawIllustratedFighter(c,f,time,scale,motion);
}
