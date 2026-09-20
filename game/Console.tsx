'use client';
import {useState} from 'react';
import {Swords,BookOpen,Crown,Users,Map,Box,ChevronRight,Check,Lock,Info,ArrowLeft} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {ARENAS,PLAYABLE_CHARACTERS,UNIVERSES,byId,stats,Element,ELEMENT_COLORS,Arena} from './data';
import {Player,MatchConfig} from './progression';
import {Portrait,RarityLabel,ArenaArt} from './ui';
import {fighterArt} from './sprites';

function FullFighter({id,className=''}:{id:string;className?:string}){
 const c=byId(id),art=fighterArt(id);
 return <div className={`full-fighter ${className}`} style={{'--fighter-color':ELEMENT_COLORS[c.element as Element]} as React.CSSProperties}>{art&&<img src={art.src} alt={c.name} decoding="async"/>}</div>;
}

export function GameMenu({player,arena,onPlay,onTraining,onBoss,onRoster,onArenas,onBoxes,onAbandon}:{player:Player;arena:Arena;onPlay:()=>void;onTraining:()=>void;onBoss:()=>void;onRoster:()=>void;onArenas:()=>void;onBoxes:()=>void;onAbandon:()=>void}){
 const c=byId(player.team[0]),boxCount=Object.values(player.boxes).reduce((a,b)=>a+b,0);
 return <section className="command-menu" aria-label="Game main menu">
  <ArenaArt arena={arena} className="menu-environment"/>
  <div className="menu-vignette"/>
  <div className="menu-mark">AETHER<br/><span>ARC</span><i>THE CONVERGENCE</i></div>
  <div className="menu-choices">
   <button className="menu-choice main-choice" onClick={onPlay}><span className="choice-number">01</span><Swords/><strong>{player.active?'RESUME FIGHT':'FIGHT'}</strong><ChevronRight/></button>
   <button className="menu-choice" disabled={!!player.active} onClick={onTraining}><span className="choice-number">02</span><BookOpen/><strong>TRAINING</strong><small>Learn the controls</small></button>
   <button className="menu-choice" disabled={!!player.active} onClick={onBoss}><span className="choice-number">03</span><Crown/><strong>ELITE BOSS</strong><small>Dragon Seals</small></button>
   <button className="menu-choice" onClick={onRoster}><span className="choice-number">04</span><Users/><strong>ROSTER</strong><small>{Object.keys(player.owned).length} / 77</small></button>
   <button className="menu-choice" onClick={onArenas}><span className="choice-number">05</span><Map/><strong>BATTLEFIELDS</strong><small>25 stages</small></button>
   <button className="menu-choice" onClick={onBoxes}><span className="choice-number">06</span><Box/><strong>SUMMON</strong><small>{boxCount} {boxCount===1?'box':'boxes'}</small></button>
   {player.active&&<button className="abandon-link" onClick={onAbandon}>Leave the unfinished fight</button>}
  </div>
  <div className="menu-character"><span className="character-watermark" aria-hidden="true">{c.anime}</span><FullFighter id={c.id}/><div className="main-fighter-label"><span>PLAYER 01 / LV. {player.owned[c.id].level}</span><h2>{c.name}</h2><RarityLabel c={c}/></div></div>
  <button className="menu-stage-label" onClick={onArenas}><Map size={15}/><span>STAGE SELECTED<strong>{arena.name}</strong></span><ChevronRight size={18}/></button>
  <div className="menu-team"><span className="team-caption">YOUR TEAM</span>{player.team.map((id,i)=><button key={id} onClick={onPlay} aria-label={`Change ${['main fighter','support','tag partner'][i]}: ${byId(id).name}`}><Portrait c={byId(id)}/><span><small>{['01 · MAIN','02 · SUPPORT','03 · TAG'][i]}</small><strong>{byId(id).name}</strong></span></button>)}</div>
 </section>;
}

export function FighterSelect({player,team,slot,onSlot,onChoose,onInspect,onNext}:{player:Player;team:string[];slot:number;onSlot:(slot:number)=>void;onChoose:(id:string)=>void;onInspect:(id:string)=>void;onNext:()=>void}){
 const [world,setWorld]=useState('All worlds');
 const current=byId(team[slot]),f=player.owned[current.id],s=stats(current,f.level,f.mastery);
 const fighters=PLAYABLE_CHARACTERS.filter(c=>world==='All worlds'||c.anime===world);
 return <section className="fighter-select-console">
  <div className="fighter-showcase"><span className="console-eyebrow">{['MAIN FIGHTER','SUPPORT · HEAL','TAG PARTNER'][slot]} / PLAYER 01</span><FullFighter id={current.id}/><div className="showcase-details"><RarityLabel c={current}/><h2>{current.name}</h2><p>{current.anime} <span>· LEVEL {f.level}</span></p><div className="showcase-stats"><span>HP <b>{s.hp}</b></span><span>ATK <b>{s.attack}</b></span><span>POWER <b>{s.power}</b></span></div><div className="showcase-move"><kbd>F</kbd><span>{current.ultimate}</span><button aria-label={`Inspect ${current.name}`} onClick={()=>onInspect(current.id)}><Info size={18}/></button></div></div></div>
  <div className="character-picker"><div className="picker-heading"><h2>SELECT FIGHTER</h2><span>{Object.keys(player.owned).length} / 77 OWNED</span></div><Tabs value={world} onValueChange={setWorld} className="console-world-tabs"><TabsList variant="line">{['All worlds',...UNIVERSES].map(u=><TabsTrigger value={u} key={u}>{u}</TabsTrigger>)}</TabsList></Tabs><div className="character-matrix">{fighters.map(c=>{const isOwned=!!player.owned[c.id],assigned=team.indexOf(c.id);return <button key={c.id} className={`character-tile ${isOwned?'':'unowned'} ${team[slot]===c.id?'selected':''}`} aria-pressed={team[slot]===c.id} aria-label={`${isOwned?'Select':'Inspect'} ${c.name}${isOwned?'':', locked'}`} onClick={()=>isOwned?onChoose(c.id):onInspect(c.id)}><Portrait c={c}/><span className="tile-name">{c.name}</span>{!isOwned?<Lock className="tile-lock" size={14}/>:assigned>=0?<span className="assignment-tag">{['P1','SUP','TAG'][assigned]}</span>:null}</button>;})}</div><div className="picker-hint"><Lock size={13}/> Unlock fighters through Summon. Select an owned fighter to assign it.</div></div>
  <div className="console-team-bar"><div className="console-team-slots">{team.map((id,i)=><button key={i} className={slot===i?'active':''} aria-label={`Edit ${['main fighter','support','tag partner'][i]} slot`} aria-pressed={slot===i} onClick={()=>onSlot(i)}><Portrait c={byId(id)}/><div><small>{['01 · MAIN','02 · SUPPORT','03 · TAG'][i]}</small><strong>{byId(id).name}</strong></div>{slot===i&&<Check size={17}/>}</button>)}</div><button className="primary" onClick={onNext}>CONFIRM TEAM <ChevronRight size={20}/></button></div>
 </section>;
}

export function StageSelect({selected,onSelect,onConfirm,confirmLabel='START FIGHT',busy=false,mode,onMode,wins=0}:{selected:string;onSelect:(a:Arena)=>void;onConfirm:()=>void;confirmLabel?:string;busy?:boolean;mode?:MatchConfig['mode'];onMode?:(m:MatchConfig['mode'])=>void;wins?:number}){
 const [world,setWorld]=useState('All stages'),a=ARENAS.find(a=>a.id===selected)??ARENAS[0];
 const worlds=Array.from(new Set(ARENAS.map(a=>a.anime))),visible=ARENAS.filter(a=>world==='All stages'||a.anime===world);
 return <section className="stage-select-console">
  <div className="stage-showcase"><ArenaArt arena={a}/><div className="stage-showcase-shade"/><span className="stage-index">{String(ARENAS.indexOf(a)+1).padStart(2,'0')}<small> / 25</small></span><div className="stage-showcase-copy"><span className="console-eyebrow">{a.anime.toUpperCase()}</span><h2>{a.name}</h2><p>{a.description}</p><span className="stage-ready"><Check size={14}/> READY TO FIGHT</span></div></div>
  <div className="stage-picker"><div className="picker-heading"><h2>SELECT STAGE</h2><span>25 / 25 OPEN</span></div><Tabs value={world} onValueChange={setWorld} className="console-world-tabs"><TabsList variant="line">{['All stages',...worlds].map(w=><TabsTrigger value={w} key={w}>{w}</TabsTrigger>)}</TabsList></Tabs><div className="stage-matrix">{visible.map(ar=><button key={ar.id} aria-label={ar.name} aria-pressed={ar.id===selected} className={`stage-tile ${ar.id===selected?'selected':''}`} onClick={()=>onSelect(ar)}><ArenaArt arena={ar}/><span className="stage-tile-number">{String(ARENAS.indexOf(ar)+1).padStart(2,'0')}</span><strong>{ar.name}</strong>{ar.id===selected&&<Check size={16}/>}</button>)}</div></div>
  <div className="stage-confirm-bar">{mode&&onMode?<Tabs value={mode} onValueChange={v=>onMode(v as MatchConfig['mode'])}><TabsList className="game-mode-tabs"><TabsTrigger value="arcade"><Swords size={16}/> Arcade</TabsTrigger><TabsTrigger value="boss" disabled={wins<3}><Crown size={16}/> Elite {wins<3?'· 3 wins':''}</TabsTrigger><TabsTrigger value="tutorial"><BookOpen size={16}/> Training</TabsTrigger></TabsList></Tabs>:<span className="console-eyebrow">FIVE WORLDS · 25 BATTLEFIELDS</span>}<button className="primary" onClick={onConfirm} disabled={busy}><Swords size={20}/>{busy?'PREPARING…':confirmLabel}<ChevronRight size={18}/></button></div>
 </section>;
}
