const assert=require('node:assert/strict');
const {localGameRequest,LOCAL_SAVE_KEY}=require(process.argv[2]+'/request.js');
const {buildRig,weightsAt,skinPoint}=require(process.argv[2]+'/rig.js');
const {PLAYABLE_CHARACTERS}=require(process.argv[2]+'/data.js');
const {BattleEngine}=require(process.argv[2]+'/engine.js');
const {fighterClips,clipFrame}=require(process.argv[2]+'/clips.js');
const {moveFor}=require(process.argv[2]+'/motion.js');
const {knockoutFloorOffset}=require(process.argv[2]+'/sprites.js');
let raw=null;const storage={getItem:()=>raw,setItem:(_k,v)=>{raw=v;}};
(async()=>{
 let response=localGameRequest(storage);assert.equal(response.status,200);let p=(await response.json()).player;assert.equal(Object.keys(p.owned).length,3);
 const action={action:'name',name:'Pages Fighter',requestId:'pages-name-check'};
 response=localGameRequest(storage,{method:'POST',body:JSON.stringify(action)});assert.equal(response.status,200);
 const saved=JSON.parse(raw);assert.equal(saved.name,'Pages Fighter');
 localGameRequest(storage,{method:'POST',body:JSON.stringify(action)});assert.equal(JSON.parse(raw).version,saved.version);
 const reload=await localGameRequest(storage).json();assert.equal(reload.player.name,'Pages Fighter');
 const before=raw;assert.equal(localGameRequest(storage,{method:'POST',body:JSON.stringify({action:'buy-box',box:'Aether',requestId:'bad-buy'})}).status,400);assert.equal(raw,before);
 raw='{broken';assert.equal(localGameRequest(storage).status,503);assert.equal(raw,'{broken');
 console.log('PASS Pages saves survive reload, retry safely, and preserve failed/corrupt saves');
 for(const c of PLAYABLE_CHARACTERS){
  const base={c,state:'run',clock:.2,duration:.4,stride:1.4,face:1,vx:200,y:526,vy:0,chain:1,defeated:false};
  for(const state of ['idle','run','block','jump','light','heavy','hit','defeat']){
   const f={...base,state,defeated:state==='defeat'},rig=buildRig(f,0,.2);
   rig.rest.forEach((bone,i)=>{const a=Math.hypot(bone.b[0]-bone.a[0],bone.b[1]-bone.a[1]),b=rig.posed[i];assert.ok(Math.abs(a-Math.hypot(b.b[0]-b.a[0],b.b[1]-b.a[1]))<1e-8);});
   for(let y=-1;y<=0;y+=.1)for(let x=-.5;x<=.5;x+=.1){const weights=weightsAt(x,y,rig.rest);assert.ok(Math.abs(weights.weights.reduce((a,b)=>a+b,0)-1)<1e-8);assert.ok(skinPoint(x,y,rig,weights).every(Number.isFinite));}
  }
 }
 console.log('PASS All 77 rigs retain bone lengths and finite weighted vertices across eight states');
 for(const [id,clip] of Object.entries(fighterClips)){
  assert.equal(clip.frames.length,12);
  const c=PLAYABLE_CHARACTERS.find(c=>c.id===id),f={c,state:'run',stride:0,defeated:false};
  assert.deepEqual([0,1,2,3].map(i=>clipFrame({...f,stride:(i+.1)*Math.PI/2})),[0,1,2,3]);
  for(const state of ['light','heavy','skill1','skill2','special']){
   const m=moveFor(c,state),attack={...f,state,duration:m.duration,chain:1};
   assert.equal(clipFrame({...attack,clock:0}),4);
   assert.equal(clipFrame({...attack,clock:m.duration*m.contact}),5);
   assert.equal(clipFrame({...attack,clock:m.duration*.9}),7);
  }
  assert.equal(clipFrame({...f,defeated:true,koBounces:1,clock:1}),11);
  const prone=clip.frames[11];assert.ok(Math.abs(knockoutFloorOffset(id)-(prone.h-prone.ay-2)*clip.height/clip.sourceHeight)<1e-8);
 }
 assert.equal(Object.keys(fighterClips).length,3);
 console.log('PASS Three 12-frame starter clips align contact poses with damage and prone art with the floor');
})().catch(e=>{console.error(e);process.exitCode=1;});
