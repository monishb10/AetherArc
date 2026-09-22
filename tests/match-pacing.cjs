const path=require('node:path');
const assert=require('node:assert/strict');
const source=path.resolve(process.argv[2]);const {BattleEngine}=require(source+'/engine.js');const {ARENAS,STARTERS,stats}=require(source+'/data.js');const {createPlayer}=require(source+'/progression.js');
global.Image=class {set src(v){} complete=false; naturalWidth=0;};global.window={addEventListener(){},removeEventListener(){}};global.document={addEventListener(){},removeEventListener(){},hidden:false};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const audio={play(){},startMusic(){}};const runs=[];
for(let seed=21;seed<=28;seed++){
 let random=seed;Math.random=()=>((random=(Math.imul(random,1664525)+1013904223)>>>0)/4294967296);
 const p=createPlayer(),match={id:'sim',team:STARTERS,opponent:'sasuke-uchiha',opponentLevel:1,opponentTeam:['sasuke-uchiha','goku','byakuya-kuchiki'],opponentLevels:[1,1,1],arena:ARENAS[0].id,mode:'arcade'};
 const e=new BattleEngine({getContext:()=>({})},match,ARENAS[0],p.owned,audio,()=>{},()=>{},{difficulty:1,reduced:false,effects:false});e.intro=0;e.phase='fight';let cooldown=0;
 e.controlPlayer=function(dt){
  const f=this.p,dist=Math.abs(f.x-this.e.x),dir=this.e.x>f.x?1:-1;
  this.keys.clear();if(dist>110)this.keys.add(dir>0?'d':'a');
  BattleEngine.prototype.controlPlayer.call(this,dt);cooldown-=dt;
  if(cooldown>0||!this.canAct(f))return;cooldown=.14;
  if(f.energy>=100){this.input('ultimate');return;}
  if(dist<370&&f.cooldowns.skill2<=0){this.input('skill2');return;}
  if(dist<280&&f.cooldowns.skill1<=0){this.input('skill1');return;}
  if(dist<180&&f.cooldowns.special<=0){this.input('special');return;}
  if(dist<140)this.input(Math.random()<.27?'heavy':'light');
 };
 let real=0;for(;real<420&&!e.done;real+=1/120){if(e.phase==='choose_replacement')e.chooseReplacement(e.playerTeam.findIndex(f=>f.hp>0&&!f.defeated));e.update(1/120);}
 runs.push({seed,seconds:Math.round(real),finished:e.done,playerWins:e.playerTeam.some(f=>f.hp>0&&!f.defeated),damage:Math.round(e.damage)});
}
assert.ok(runs.every(r=>r.finished),'All eight full team matches must reach a result');
const mean=Math.round(runs.reduce((n,r)=>n+r.seconds,0)/runs.length);
assert.ok(mean>60&&mean<240,'Scripted fights should leave room for tactics without stalling');
console.log('PASS Eight seeded 3v3 matches completed; mean '+mean+' simulated seconds (not a human playtime guarantee)');
