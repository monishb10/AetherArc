'use client';
import {useEffect,useRef,useState} from 'react';
import {BattleEngine,type Action,type BattleSnapshot} from '@/game/engine';
import {ARENAS,PLAYABLE_CHARACTERS,STARTERS,byId} from '@/game/data';
import {prepareFighterSprites} from '@/game/sprites';
import {prepareArenaArt} from '@/game/arena-art';
import {GameAudio} from '@/game/audio';
import './lab.css';
import {gameHome} from '@/game/runtime';

export default function AnimationLab(){
 const [fighter,setFighter]=useState('ichigo-kurosaki'),[opponent,setOpponent]=useState('naruto-uzumaki'),[arena,setArena]=useState('soul-society'),[revision,reset]=useState(0),[speed,setSpeed]=useState(1),[snap,setSnap]=useState<BattleSnapshot|null>(null),[error,setError]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<BattleEngine|null>(null),audio=useRef<GameAudio|null>(null),[ready,setReady]=useState(false),[running,setRunning]=useState(false);
 useEffect(()=>{
  let cancel=false;setReady(false);setRunning(false);setError('');setSnap(null);
  const stage=ARENAS.find(a=>a.id===arena)??ARENAS[0],ids=[fighter,opponent,...STARTERS];
  const sound=new GameAudio();audio.current=sound;sound.configure(.25,false,true);
  Promise.all([prepareFighterSprites(ids),prepareArenaArt(stage)]).then(()=>{
   if(cancel)return;
   const owned=Object.fromEntries(ids.map(id=>[id,{level:1,xp:0,mastery:0,shards:0,fights:0}]));
   const team=[fighter,...STARTERS.filter(id=>id!==fighter)].slice(0,3);
   const e=new BattleEngine(canvas.current!,{id:'animation-lab',team,arena:stage.id,mode:'arcade',opponent,opponentLevel:1,startedAt:Date.now()},stage,owned,sound,setSnap,()=>{},{difficulty:1,reduced:false,effects:true});
   e.intro=0;e.p.x=440;e.e.x=700;e.p.energy=100;e.seconds=999;e.speed=speed;
   e.controlEnemy=()=>{};engine.current=e;setReady(true);
  }).catch(e=>{if(!cancel)setError(e.message);});
  return()=>{cancel=true;engine.current?.destroy();engine.current=null;sound.destroy();audio.current=null;};
 },[fighter,opponent,arena,revision]);
 useEffect(()=>{if(engine.current)engine.current.speed=speed;},[speed]);
 function act(action:Action){const e=engine.current;if(!e||e.done)return;audio.current?.unlock();e.p.energy=100;e.p.cooldowns[action]=0;e.input(action);}
 function knockout(){const e=engine.current;if(!e||e.done)return;audio.current?.unlock();e.hit(e.p,e.e,e.e.maxHp*3,'heavy');e.checkEnd();}
 const c=byId(fighter);
 return <main className="lab"><header><div><a href={gameHome()}>← AETHER ARC</a><h1>ANIMATION LAB</h1><p>Preview every fighter, technique, and knockout. Campaign saves are separate.</p></div><button onClick={()=>reset(v=>v+1)}>Reset scene</button></header>
 <div className="lab-options"><label>Fighter<select value={fighter} onChange={e=>setFighter(e.target.value)}>{PLAYABLE_CHARACTERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Opponent<select value={opponent} onChange={e=>setOpponent(e.target.value)}>{PLAYABLE_CHARACTERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Arena<select value={arena} onChange={e=>setArena(e.target.value)}>{ARENAS.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>Playback<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>Full speed</option><option value={.5}>Half speed</option><option value={.25}>Quarter speed</option></select></label></div>
 <div className="lab-stage"><canvas ref={canvas} aria-label="Interactive animation preview"/>{!ready&&<div className="lab-loading">{error||'Loading fighters…'}{error&&<button onClick={()=>reset(v=>v+1)}>Retry</button>}</div>}<div className="lab-hud"><span>{c.name} · {snap?.player.hp??'—'} HP</span><span>{byId(opponent).name} · {snap?.enemy.hp??'—'} HP</span></div></div>
 <div className="lab-actions">{([['light','J · Light'],['heavy','K · Heavy'],['dash','X · Dash'],['jump','Space · Jump'],['skill1',`Q · ${c.skills[0]}`],['skill2',`E · ${c.skills[1]}`],['special','R · Awakening'],['ultimate',`F · ${c.ultimate}`]] as [Action,string][]).map(([a,label])=><button disabled={!ready||snap?.phase==='finished'||snap?.phase==='reported'} key={a} onClick={()=>act(a)}>{label}</button>)}<button disabled={!ready} onClick={knockout}>Preview knockout</button><button disabled={!ready} onClick={()=>{const e=engine.current;if(!e)return;const next=!running;setRunning(next);e.controlPlayer=next?(dt)=>{if(e.canAct(e.p)){e.p.state='run';e.p.vx=0;e.p.stride+=15*dt;}}:BattleEngine.prototype.controlPlayer.bind(e);}}>{running?'Stop running':'Run cycle'}</button><button disabled={!ready} onClick={()=>{const e=engine.current;if(e){e.paused=!e.paused;e.emit();}}}>{snap?.paused?'Resume':'Pause'}</button><button disabled={!ready||!snap?.paused} onClick={()=>{const e=engine.current;if(e){e.time+=1/60;e.update(1/60);e.draw();e.emit();}}}>Step frame</button></div>
 <p className="lab-note">Move with A / D. Block with S. Reset between sequences to restore health. The opponent stays still so you can inspect contact, recovery, and landing.</p>
 </main>;
}
