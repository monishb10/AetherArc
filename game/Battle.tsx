'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUp,Shield,Swords,Zap,Pause,Play,ChevronRight,Flame,Wind} from 'lucide-react';
import {BattleEngine,BattleReport,BattleSnapshot,Action} from './engine';
import {ARENAS,byId,ELEMENT_COLORS} from './data';
import {MatchConfig,Player} from './progression';
import {sound} from './audio';
import {prepareFighterSprites} from './sprites';
import {prepareArenaArt} from './arena-art';
import {Portrait} from './ui';

export type Preferences={volume:number;music:boolean;effects:boolean;motion:boolean;particles:boolean;difficulty:number};

function formatTime(totalSeconds:number){
 const m=Math.floor(totalSeconds/60);
 const s=totalSeconds%60;
 return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

export function Battle({match,player,prefs,onEnd,onLeave}:{match:MatchConfig;player:Player;prefs:Preferences;onEnd:(r:BattleReport)=>void;onLeave:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<BattleEngine|null>(null),endRef=useRef(onEnd);
 endRef.current=onEnd;
 const [snapshot,setSnapshot]=useState<BattleSnapshot|null>(null),[assetError,setAssetError]=useState(''),[retry,setRetry]=useState(0);

 useEffect(()=>{
  let cancelled=false;
  setAssetError('');
  setSnapshot(null);
  const oppTeam=(match.opponentTeam&&match.opponentTeam.length>=3?match.opponentTeam:[match.opponent,'sasuke-uchiha','kakashi-hatake']).filter(Boolean);
  const allFighterIds=Array.from(new Set([...match.team,...oppTeam])).filter(Boolean);
  const arenaDef=ARENAS.find(a=>a.id===match.arena)||ARENAS[0];
  Promise.all([
   prepareFighterSprites(allFighterIds),
   prepareArenaArt(arenaDef)
  ]).then(()=>{
   if(cancelled)return;
   const e=new BattleEngine(
    canvas.current!,
    match,
    arenaDef,
    player.owned,
    sound,
    setSnapshot,
    r=>endRef.current(r),
    {difficulty:prefs.difficulty,reduced:!prefs.motion,effects:prefs.particles}
   );
   engine.current=e;
  }).catch(e=>{
   if(!cancelled)setAssetError(e.message);
  });
  return()=>{
   cancelled=true;
   engine.current?.destroy();
   engine.current=null;
  };
 },[match.id,retry]);

 const p=snapshot?byId(snapshot.player.id):byId(match.team[0]);
 const enemy=snapshot?byId(snapshot.enemy.id):byId(match.opponent);

 const action=(a:Action)=>{sound.unlock();engine.current?.input(a);};
 const held=(key:string)=>({
  onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{
   e.preventDefault();
   e.currentTarget.setPointerCapture(e.pointerId);
   engine.current?.setKey(key,true);
  },
  onPointerUp:()=>engine.current?.setKey(key,false),
  onPointerCancel:()=>engine.current?.setKey(key,false),
  onLostPointerCapture:()=>engine.current?.setKey(key,false)
 });

 const tips=[
  ['MOVE','A / D or ← / →','Close the distance.'],
  ['ATTACK','J · light attack','Strike your opponent.'],
  ['COMBO','J → J → J','Chain three hits before the combo fades.'],
  ['DODGE','Shift','Pass through an attack with a quick dodge.'],
  ['SKILL','Q or E','Unleash a signature technique.'],
  ['ULTIMATE','F','Your energy is full. Finish the fight.'],
  ['WELL FOUGHT','Victory','Your first rewards are waiting.']
 ];
 const tip=tips[Math.min(snapshot?.tutorial??0,6)];

 const playerAliveCount=snapshot?.playerAlive??3;
 const enemyAliveCount=snapshot?.enemyAlive??3;

 return (
  <section className="battle-view">
   <div className="battle-top">
    <div>
     <span className="eyebrow">{match.mode==='tutorial'?'TRAINING':match.mode==='boss'?'ELITE BOSS':'3v3 ELIMINATION'}</span>
     <h2>{ARENAS.find(a=>a.id===match.arena)?.name}</h2>
    </div>
    <button className="icon-button" aria-label="Pause battle" onClick={()=>engine.current?.setPaused(true)}>
     <Pause size={21}/>
    </button>
   </div>

   <div className="battle-stage">
    {!snapshot&&(
     <div className="battle-loading">
      <Swords size={32}/>
      <h3>{assetError?'Art loading interrupted':'Preparing your fighters…'}</h3>
      {assetError&&(
       <>
        <p>{assetError}</p>
        <button className="primary" onClick={()=>setRetry(r=>r+1)}>Retry</button>
        <button className="secondary" onClick={onLeave}>Back to lobby</button>
       </>
      )}
     </div>
    )}

    <canvas
     ref={canvas}
     aria-label={`3v3 Team Elimination: ${p.name} versus ${enemy.name}. Use A and D to move, J to attack, Shift to dodge, Q and E for skills, F for ultimate.`}
    />

    {/* 3v3 TEAM COMBAT HUD */}
    <div className="fight-hud">
     {/* Player 1 Team Block */}
     <div className="health-block">
      <Portrait c={p} className="hud-portrait"/>
      <div className="health-info">
       <div className="health-name">
        <span>{p.name}</span>
        <small>LV. {snapshot?.player.level??1}</small>
       </div>
       <div className="health-track">
        <div style={{width:`${snapshot?snapshot.player.hp/snapshot.player.maxHp*100:100}%`}}/>
       </div>
       <div className="health-meta">
        <span>{snapshot?.player.hp??'—'} HP</span>
        <span className="alive-badge">PLAYER · {playerAliveCount} / 3 ALIVE</span>
       </div>

       {/* Player 3-fighter roster indicators */}
       <div className="roster-pills player-roster">
        {(snapshot?.playerTeam??match.team.slice(0,3).map((id,i)=>({id,name:byId(id).name,hp:100,maxHp:100,energy:0,level:1,defeated:false,active:i===0,element:'fire'}))).map((rf,idx)=>{
         const c=byId(rf.id);
         return (
          <div
           key={rf.id}
           className={`roster-pill ${rf.active?'active':''} ${rf.defeated?'defeated':''}`}
           title={`${c.name} (${rf.defeated?'Defeated':rf.active?'Active':`${rf.hp}/${rf.maxHp} HP`})`}
          >
           <Portrait c={c} className="roster-portrait"/>
           <div className="roster-pill-details">
            <span className="roster-pill-name">{c.name.split(' ')[0]}</span>
            <div className="roster-pill-hp">
             <div style={{width:`${rf.maxHp>0?Math.max(0,(rf.hp/rf.maxHp)*100):0}%`}}/>
            </div>
           </div>
           {rf.defeated&&<span className="roster-pill-ko">KO</span>}
           {rf.active&&<span className="roster-pill-active-dot"/>}
          </div>
         );
        })}
       </div>
      </div>
     </div>

     {/* Center Fight Clock */}
     <div className="fight-clock">
      {formatTime(snapshot?.seconds??0)}
      <small>3V3 ELIMINATION</small>
     </div>

     {/* Opponent Team Block */}
     <div className="health-block opponent">
      <Portrait c={enemy} className="hud-portrait"/>
      <div className="health-info">
       <div className="health-name">
        <span>{enemy.name}</span>
        <small>LV. {snapshot?.enemy.level??match.opponentLevel}</small>
       </div>
       <div className="health-track">
        <div style={{width:`${snapshot?snapshot.enemy.hp/snapshot.enemy.maxHp*100:100}%`}}/>
       </div>
       <div className="health-meta">
        <span className="alive-badge">{enemyAliveCount} / 3 ALIVE · {match.mode==='boss'?'BOSS':'CPU'}</span>
        <span>{snapshot?.enemy.hp??'—'} HP</span>
       </div>

       {/* Opponent 3-fighter roster indicators */}
       <div className="roster-pills enemy-roster">
        {(snapshot?.enemyTeam??(match.opponentTeam??[match.opponent,'sasuke-uchiha','kakashi-hatake']).slice(0,3).map((id,i)=>({id,name:byId(id).name,hp:100,maxHp:100,energy:0,level:1,defeated:false,active:i===0,element:'fire'}))).map((rf,idx)=>{
         const c=byId(rf.id);
         return (
          <div
           key={rf.id}
           className={`roster-pill ${rf.active?'active':''} ${rf.defeated?'defeated':''}`}
           title={`${c.name} (${rf.defeated?'Defeated':rf.active?'Active':`${rf.hp}/${rf.maxHp} HP`})`}
          >
           <Portrait c={c} className="roster-portrait"/>
           <div className="roster-pill-details">
            <span className="roster-pill-name">{c.name.split(' ')[0]}</span>
            <div className="roster-pill-hp">
             <div style={{width:`${rf.maxHp>0?Math.max(0,(rf.hp/rf.maxHp)*100):0}%`}}/>
            </div>
           </div>
           {rf.defeated&&<span className="roster-pill-ko">KO</span>}
           {rf.active&&<span className="roster-pill-active-dot"/>}
          </div>
         );
        })}
       </div>
      </div>
     </div>
    </div>

    {snapshot&&snapshot.combo>1&&(
     <div className="combo-display" key={snapshot.combo}>
      <strong>{snapshot.combo}</strong>
      <span>HIT COMBO</span>
     </div>
    )}

    {match.mode==='tutorial'&&!snapshot?.cinema&&(
     <div className="tutorial-coach">
      <div className="tutorial-count">0{Math.min((snapshot?.tutorial??0)+1,6)} / 06</div>
      <strong>{tip[0]} <kbd>{tip[1]}</kbd></strong>
      <span>{tip[2]}</span>
     </div>
    )}

    {snapshot?.message&&(
     <div className="combat-message">{snapshot.message}</div>
    )}

    {/* REPLACEMENT MODAL: Choose your next fighter */}
    {snapshot?.phase==='choose_replacement'&&(
     <div className="replacement-modal" role="dialog" aria-modal="true" aria-label="Choose your next fighter">
      <div className="replacement-dialog">
       <span className="eyebrow">TACTICAL DEPLOYMENT</span>
       <h2>CHOOSE YOUR NEXT FIGHTER</h2>
       <p className="replacement-instructions">
        Select an active reserve to enter the arena. Press <kbd>1</kbd>, <kbd>2</kbd>, or <kbd>3</kbd> or click below.
       </p>
       <div className="replacement-grid">
        {snapshot.playerTeam.map((fighter,idx)=>{
         const c=byId(fighter.id);
         const isDefeated=fighter.defeated||fighter.hp<=0;
         return (
          <button
           key={fighter.id}
           type="button"
           className={`replacement-card ${isDefeated?'defeated':'available'}`}
           disabled={isDefeated}
           onClick={()=>engine.current?.chooseReplacement(idx)}
           aria-label={isDefeated?`${c.name} - Defeated`:`Deploy ${c.name} (Slot ${idx+1})`}
          >
           <div className="replacement-card-header">
            <span className="replacement-slot-badge">SLOT 0{idx+1}</span>
            <kbd className="replacement-key-badge">{idx+1}</kbd>
           </div>
           <Portrait c={c} className="replacement-portrait"/>
           <div className="replacement-card-info">
            <div className="replacement-name-row">
             <strong>{c.name}</strong>
             <span className="replacement-level">LV. {fighter.level}</span>
            </div>
            <div className="replacement-hp-track">
             <div style={{width:`${fighter.maxHp>0?Math.max(0,(fighter.hp/fighter.maxHp)*100):0}%`}}/>
            </div>
            <div className="replacement-meta-row">
             <span>{fighter.hp} / {fighter.maxHp} HP</span>
             <span className="replacement-element" style={{color:ELEMENT_COLORS[fighter.element]??'#ffcd67'}}>{fighter.element.toUpperCase()}</span>
            </div>
           </div>
           <div className={`replacement-status-footer ${isDefeated?'footer-defeated':'footer-ready'}`}>
            {isDefeated?'DEFEATED':'DEPLOY NOW'}
           </div>
          </button>
         );
        })}
       </div>
      </div>
     </div>
    )}

    {snapshot?.paused&&(
     <div className="pause-menu">
      <span className="eyebrow">TAKE A BREATH</span>
      <h2>BATTLE PAUSED</h2>
      <button className="primary" onClick={()=>engine.current?.setPaused(false)}>
       <Play size={18}/> Resume fight
      </button>
      <button className="secondary" onClick={onLeave}>
       <ArrowLeft size={18}/> Leave without rewards
      </button>
      <small>Your collection and previous rewards are safe.</small>
     </div>
    )}

    <div className="battle-energy">
     <span>ULTIMATE ENERGY <b>{snapshot?.player.energy??0}%</b></span>
     <div><i style={{width:`${snapshot?.player.energy??0}%`}}/></div>
     <small>GUARD {snapshot?.player.guard??100}%</small>
    </div>
   </div>

   {/* 8-BUTTON COMBAT ACTION PAD (Support & Tag replaced by 3v3 team elimination rules) */}
   <div className="battle-controls">
    <div className="move-pad">
     <button aria-label="Move left" {...held('a')}><ArrowLeft/><kbd>A</kbd></button>
     <button aria-label="Jump" onClick={()=>action('jump')}><ArrowUp/><kbd>Space</kbd></button>
     <button aria-label="Move right" {...held('d')}><ArrowRight/><kbd>D</kbd></button>
     <button aria-label="Block" {...held('s')}><Shield size={19}/><kbd>S</kbd></button>
    </div>
    <div className="action-pad">
     {([
      {a:'light',key:'J',name:'Light',icon:Swords},
      {a:'heavy',key:'K',name:'Heavy',icon:Flame},
      {a:'dash',key:'X',name:'Dash',icon:ChevronRight},
      {a:'dodge',key:'Shift',name:'Dodge',icon:Wind},
      {a:'skill1',key:'Q',name:p.skills[0],icon:Zap},
      {a:'skill2',key:'E',name:p.skills[1],icon:Zap},
      {a:'special',key:'R',name:'Awakening',icon:Flame},
      {a:'ultimate',key:'F',name:'Ultimate',icon:Spark},
     ] as const).map(item=>{
      const cd=snapshot?.cooldowns[item.a]??0;
      const isUlt=item.a==='ultimate';
      const charged=isUlt&&(snapshot?.player.energy??0)>=100;
      return (
       <button
        key={item.a}
        className={`${isUlt?'ultimate-control':''} ${charged?'charged':''}`}
        aria-label={`${item.name} (${item.key})`}
        title={item.name}
        onClick={()=>action(item.a)}
        disabled={cd>0||(isUlt&&(snapshot?.player.energy??0)<100)}
       >
        <item.icon size={17}/>
        <span>{['skill1','skill2'].includes(item.a)?(item.key==='Q'?'Skill 1':'Skill 2'):item.a==='special'?'Awaken':item.name}</span>
        <kbd>{cd>0?cd.toFixed(1):item.key}</kbd>
       </button>
      );
     })}
    </div>
   </div>

   <p className="combat-help">
    <span><b>J → J → J</b> combo finisher</span>
    <span><b>K</b> guard break + launcher</span>
    <span><b>Space + J</b> air attack</span>
    <span><b>R</b> attack boost for 5s</span>
    <span><b>1 / 2 / 3</b> select reserve</span>
    <span><b>Esc</b> pause</span>
   </p>
  </section>
 );
}

function Spark({size=17}:{size?:number}){return <Zap size={size}/>;}
