const assert=require('node:assert/strict');
const {BattleEngine}=require(process.argv[2]+'/engine.js');
const {PLAYABLE_CHARACTERS:CHARACTERS,ARENAS,STARTERS}=require(process.argv[2]+'/data.js');
const {createPlayer}=require(process.argv[2]+'/progression.js');
global.Image=class{set src(v){}complete=false;naturalWidth=0;};global.window={addEventListener(){},removeEventListener(){}};global.document={addEventListener(){},removeEventListener(){},hidden:false};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const audio={play(){},startMusic(){}};let n=0;function test(name,fn){fn();console.log('PASS',name);n++;}
function engine(id=STARTERS[0],mode='arcade'){const p=createPlayer();p.owned[id]??={level:1,xp:0,mastery:0,shards:0,fights:0};const team=[id,...STARTERS.filter(v=>v!==id)].slice(0,3);let reports=[];const e=new BattleEngine({getContext:()=>({})},{id:'test',team,arena:ARENAS[0].id,mode,opponent:'sakura-haruno',opponentLevel:1,startedAt:0},ARENAS[0],p.owned,audio,()=>{},r=>reports.push(r),{difficulty:1,reduced:false,effects:true});e.intro=0;e.e.x=e.p.x+100;e.controlEnemy=()=>{};e.reports=reports;return e;}
const tick=(e,s)=>{for(let i=0;i<Math.ceil(s*120);i++)e.update(1/120);};
test('Movement starts immediately; a short input has a readable movement pulse',()=>{const e=engine(),x=e.p.x;e.setKey('d',true);e.setKey('d',false);tick(e,.2);assert.ok(e.p.x>x+20);});
test('Light combo damage lands and a 3-hit chain increments combo missions',()=>{const e=engine();for(let i=0;i<3;i++){e.e.x=e.p.x+90;e.input('light');tick(e,.47);}assert.ok(e.e.hp<e.e.maxHp);assert.ok(e.comboCount>=1);assert.ok(e.p.energy>=21&&e.p.energy<30);});
test('Block reduces damage; heavy breaks guard and launches the opponent',()=>{const a=engine();a.e.state='block';const full=a.e.hp;a.hit(a.p,a.e,100,'light');const chip=full-a.e.hp;assert.ok(chip>0&&chip<20);a.e.state='block';a.hit(a.p,a.e,100,'heavy');assert.ok(a.e.vy<0);assert.ok(a.e.hp<full-chip-40);});
test('Dodge rejects damage during invulnerability and enforces its cooldown',()=>{const e=engine();e.input('dodge');const hp=e.p.hp;e.hit(e.e,e.p,400,'heavy');assert.equal(e.p.hp,hp);assert.equal(e.act(e.p,'dodge'),false);tick(e,1.2);assert.equal(e.act(e.p,'dodge'),true);});
test('Air and ground attacks; jump returns to the ground without clipping',()=>{const e=engine();e.input('jump');tick(e,.18);assert.ok(e.p.y<526);e.input('light');tick(e,1.3);assert.equal(e.p.y,526);assert.equal(e.p.vy,0);});
test('All 77 playable characters execute skills, cooldowns, and signature ultimates',()=>{for(const c of CHARACTERS){const e=engine(c.id);e.e.maxHp=10000;e.e.hp=10000;e.input('skill1');tick(e,.95);assert.ok(e.p.cooldowns.skill1>0);e.e.x=e.p.x+110;e.input('skill2');tick(e,1);assert.ok(e.p.cooldowns.skill2>0);e.p.state='idle';e.p.energy=100;e.input('ultimate');tick(e,2.8);assert.ok(e.e.hp<10000,c.name);assert.equal(e.ultCount,1,c.name);assert.equal(e.cinema,null);}});
test('Support and tag are disabled in 3v3; knockout triggers replacement modal and reserve deployment',()=>{
 const e=engine();
 assert.equal(e.act(e.p,'support'),false);
 assert.equal(e.act(e.p,'tag'),false);
 e.p.hp=0;
 e.checkEnd();
 assert.equal(e.phase,'knockout');
 tick(e,1.6);
 assert.equal(e.phase,'choose_replacement');
 e.chooseReplacement(0);
 assert.equal(e.phase,'choose_replacement');
 const reserve1Id=e.playerTeam[1].c.id;
 e.chooseReplacement(1);
 assert.equal(e.p.c.id,reserve1Id);
 assert.ok(e.used.has(reserve1Id));
 assert.equal(e.phase,'replacement_intro');
 tick(e,1.4);
 assert.equal(e.phase,'fight');
 const opp2Id=e.enemyTeam[1].c.id;
 e.e.hp=0;
 e.checkEnd();
 assert.equal(e.phase,'knockout');
 tick(e,1.6);
 assert.equal(e.phase,'replacement_intro');
 assert.equal(e.e.c.id,opp2Id);
 tick(e,1.4);
 assert.equal(e.phase,'fight');
});
test('Victory and defeat settle once only after all 3 team fighters are defeated',()=>{
 for(const winner of ['p','e']){
  const e=engine();
  const loserTeam=winner==='p'?e.enemyTeam:e.playerTeam;
  loserTeam.forEach(f=>{f.hp=0;f.defeated=true;});
  e[winner==='p'?'e':'p'].hp=0;
  e.checkEnd();
  tick(e,5);
  assert.equal(e.reports.length,1);
  assert.equal(e.reports[0].won,winner==='p');
  assert.equal(e.reports[0].draw,false);
 }
});
test('Simultaneous final fighter knockout resolves as Draw',()=>{
 const e=engine();
 e.playerTeam.forEach(f=>{f.hp=0;f.defeated=true;});
 e.enemyTeam.forEach(f=>{f.hp=0;f.defeated=true;});
 e.p.hp=0;e.e.hp=0;
 e.checkEnd();
 tick(e,5);
 assert.equal(e.reports.length,1);
 assert.equal(e.reports[0].won,false);
 assert.equal(e.reports[0].draw,true);
});
test('A complete tutorial reaches ultimate and delivers victory',()=>{const e=engine(STARTERS[0],'tutorial');e.setKey('d',true);tick(e,.3);e.setKey('d',false);tick(e,.5);assert.equal(e.tutorial,1);for(let i=0;i<3;i++){e.e.x=e.p.x+85;e.input('light');tick(e,.47);}tick(e,.9);assert.ok(e.tutorial>=2);tick(e,.8);assert.ok(e.tutorial>=3);e.input('dodge');tick(e,.85);assert.ok(e.tutorial>=4);e.p.state='idle';e.input('skill1');tick(e,1);assert.equal(e.tutorial,5);e.p.state='idle';e.input('ultimate');tick(e,7);assert.equal(e.reports.length,1);assert.equal(e.reports[0].won,true);});
test('Particle counts stay bounded during repeated effects',()=>{const e=engine();for(let i=0;i<100;i++)e.burst(200,200,50,'#fff',300);assert.ok(e.particles.length<=210);tick(e,2);assert.equal(e.particles.length,0);});
test('Heavy damage waits for its contact frame',()=>{const e=engine();e.e.x=e.p.x+85;e.input('heavy');const hp=e.e.hp;tick(e,.2);assert.equal(e.e.hp,hp);tick(e,.17);assert.ok(e.e.hp<hp);});
test('Knockouts launch, hit the floor, bounce once, slide, and settle before reporting',()=>{for(const c of CHARACTERS){const e=engine(c.id);e.enemyTeam.forEach(f=>{f.hp=0;f.defeated=true;});e.e.hp=10;e.e.defeated=false;e.hit(e.p,e.e,100000,'heavy');e.checkEnd();assert.equal(e.e.defeated,true);const y=e.e.y;tick(e,.1);assert.ok(e.e.y<y);assert.equal(e.reports.length,0);tick(e,2.4);assert.equal(e.e.koGrounded,true,c.name);assert.equal(e.e.koBounces,2);assert.equal(e.e.y,526-require(process.argv[2]+'/sprites.js').knockoutFloorOffset(e.e.c.id));assert.ok(Math.abs(e.e.koAngle+Math.PI/2)<.01);assert.equal(e.reports.length,0);tick(e,1.2);assert.equal(e.reports.length,1);}});
test('Beam skills connect across the arena and pause rejects input',()=>{const e=engine('goku');e.e.x=1000;e.input('skill1');tick(e,.7);assert.ok(e.e.hp<e.e.maxHp);e.setPaused(true);const x=e.p.x;assert.equal(e.paused,true);e.input('dash');assert.equal(e.p.x,x);});
test('A full-health fighter survives three skills and an ultimate at equal level',()=>{
 const e=engine();for(const multiplier of [2.3,2.8,3.15,6.5]){e.e.invincible=0;e.hit(e.p,e.e,require(process.argv[2]+'/data.js').stats(e.p.c,1).attack*multiplier,multiplier===6.5?'ultimate':'skill');}
 assert.ok(e.e.hp>e.e.maxHp*.50,'One burst should not remove most of a fresh health bar');
});
test('A long combo scales damage without making hits harmless',()=>{
 const e=engine();const full=e.e.hp;e.hit(e.p,e.e,100,'light');const first=full-e.e.hp;
 e.p.combo=9;const before=e.e.hp;e.hit(e.p,e.e,100,'light');const later=before-e.e.hp;
 assert.ok(later<first*.65&&later>first*.40);
});
test('CPU closes distance, punishes recovery, and dodges a telegraphed heavy',()=>{
 const e=engine(),oldRandom=Math.random;Math.random=()=>.1;
 try{
  e.controlEnemy=BattleEngine.prototype.controlEnemy.bind(e);e.e.x=800;e.p.x=300;e.e.cooldowns.skill1=5;e.ai=0;e.controlEnemy(1/60);assert.equal(e.e.state,'run');assert.ok(e.e.vx<0);
  e.e.x=e.p.x+110;e.e.state='idle';e.p.state='heavy';e.p.clock=.20;e.p.hit=false;e.ai=0;e.controlEnemy(1/60);assert.equal(e.e.state,'dodge');assert.ok(e.e.vx>0);
  e.e.state='idle';e.p.hit=true;e.ai=0;e.controlEnemy(1/60);assert.equal(e.e.state,'light');
 }finally{Math.random=oldRandom;}
});
test('Opponent teams without a per-fighter level array retain finite health',()=>{
 const p=createPlayer();const e=new BattleEngine({getContext:()=>({})},{id:'levels',team:STARTERS,arena:ARENAS[0].id,mode:'arcade',opponent:'sakura-haruno',opponentLevel:2,opponentTeam:['sakura-haruno','sasuke-uchiha','kakashi-hatake'],startedAt:0},ARENAS[0],p.owned,audio,()=>{},()=>{},{difficulty:1,reduced:false,effects:true});
 assert.ok(e.enemyTeam.every(f=>f.level===2&&Number.isFinite(f.hp)&&f.hp>0));
});
test('Replacement pauses reject attacks and corpses finish landing during selection',()=>{
 const e=engine();e.p.hp=0;e.checkEnd();tick(e,1.6);assert.equal(e.phase,'choose_replacement');
 tick(e,1.5);assert.equal(e.p.koGrounded,true);const state=e.p.state;e.input('jump');assert.equal(e.p.state,state);
 e.chooseReplacement(1);e.input('ultimate');assert.equal(e.p.state,'idle');
});
test('Run rig keeps fixed bones, a planted foot, and forward/backward knees above the floor',()=>{
 const {buildRig}=require(process.argv[2]+'/rig.js');const e=engine();e.p.state='run';
 for(const direction of [-1,1])for(let i=0;i<96;i++){
  e.p.vx=direction*260;e.p.stride=i/96*Math.PI*2;const rig=buildRig(e.p,0,i/60);
  const feet=[rig.posed[8].b,rig.posed[10].b];assert.ok(feet.every(p=>p[1]<=-.011));assert.ok(feet.some(p=>Math.abs(p[1]+.012)<.0001));
  for(const k of [7,9])assert.ok(rig.posed[k].b[1]<rig.posed[k+1].b[1]);
 }
});
console.log(`\n${n} combat checks passed.`);
