'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Swords,Crown,BookOpen,Sparkles,Map,Search,Users,Box,Zap,ChevronRight,Check,Lock,Info,Shield,RefreshCw,Layers} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {CHARACTERS,PLAYABLE_CHARACTERS,ARENAS,UNIVERSES,byId,stats,Character,Arena,ELEMENT_COLORS,Element,RARITY_COLORS} from './data';
import {Player,MatchConfig,metric} from './progression';
import {Portrait,RarityLabel,ArenaArt} from './ui';
import {drawIllustratedFighter,prepareFighterSprites} from './sprites';
import {prepareArenaArt,arenaImage} from './arena-art';
import {assetUrl} from './runtime';
import {sound} from './audio';
import type {Fighter} from './engine';

export interface LobbyProps {
 player: Player;
 team: string[];
 arena: Arena;
 mode: MatchConfig['mode'];
 busy?: boolean;
 motion?: boolean;
 particles?: boolean;
 onStartMatch: (mode?: MatchConfig['mode']) => void;
 onUpdateTeam: (team: string[]) => Promise<void> | void;
 onOpenStageSelect: () => void;
 onOpenRoster: () => void;
 onOpenBoxes: () => void;
 onOpenMissions: () => void;
 onOpenRewards: () => void;
 onOpenSettings: () => void;
 onModeChange: (m: MatchConfig['mode']) => void;
}

interface Particle {
 x: number;
 y: number;
 vx: number;
 vy: number;
 size: number;
 alpha: number;
 maxAlpha: number;
 life: number;
 maxLife: number;
 color: string;
 kind: 'spark' | 'smoke' | 'ember' | 'ring' | 'leaf';
}

function makeLobbyFighter(c: Character, level: number, mastery: number, x: number, y: number, face: number): Fighter {
 const s = stats(c, level, mastery);
 return {
  c,
  level,
  mastery,
  x,
  y,
  vx: 0,
  vy: 0,
  face,
  hp: s.hp,
  maxHp: s.hp,
  energy: 0,
  guard: 100,
  state: 'idle',
  clock: 0,
  duration: 0,
  attack: 0,
  chain: 0,
  chainTimer: 0,
  hit: false,
  stun: 0,
  invincible: 0,
  flash: 0,
  cooldowns: {skill1: 0, skill2: 0, special: 0, dodge: 0, dash: 0, support: 0, tag: 0},
  combo: 0,
  comboTimer: 0,
  buff: 0,
  trailClock: 0,
  defeated: false,
  stride: 0,
  koAngle: 0,
  koBounces: 0,
  koGrounded: false,
  lastImpact: 1
 };
}

const ROLE_NAMES = ['MAIN FIGHTER', 'SUPPORT · HEAL', 'TAG PARTNER'] as const;
const ROLE_TAGS = ['MAIN', 'SUPPORT', 'TAG'] as const;

export function Lobby({
 player,
 team,
 arena,
 mode,
 busy = false,
 motion = true,
 particles: particlesEnabled = true,
 onStartMatch,
 onUpdateTeam,
 onOpenStageSelect,
 onOpenRoster,
 onOpenBoxes,
 onOpenMissions,
 onOpenRewards,
 onOpenSettings,
 onModeChange
}: LobbyProps) {
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const [activeSlot, setActiveSlot] = useState<number | null>(null);
 const [editSlot, setEditSlot] = useState<number | null>(null);
 const [editWorld, setEditWorld] = useState<string>('All worlds');
 const [editSearch, setEditSearch] = useState<string>('');
 const [entranceSlot, setEntranceSlot] = useState<number | null>(null);

 const rafRef = useRef<number>(0);
 const timeRef = useRef<number>(0);
 const lastFrameRef = useRef<number>(0);
 const particlesRef = useRef<Particle[]>([]);
 const entranceTimerRef = useRef<number>(0);
 const fighterPosRef = useRef<{x: number; y: number; width: number; height: number; slot: number}[]>([]);

 // Preload current team sprites and arena background
 useEffect(() => {
  void prepareFighterSprites(team).catch(() => {});
  void prepareArenaArt(arena).catch(() => {});
 }, [team, arena]);

 // Canvas animation loop
 useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let running = true;

  const handleVisibility = () => {
   if (document.hidden) {
    cancelAnimationFrame(rafRef.current);
   } else {
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(render);
   }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  const spawnElementAura = (x: number, y: number, element: Element, slot: number) => {
   if (!particlesEnabled || particlesRef.current.length > 90) return;
   const col = ELEMENT_COLORS[element] || '#6cecf2';
   const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
   const speed = 18 + Math.random() * 32;
   const life = 0.8 + Math.random() * 0.9;
   const isEmbers = element === 'fire' || element === 'sand';
   particlesRef.current.push({
    x: x + (Math.random() - 0.5) * 80,
    y: y - 20 - Math.random() * 140,
    vx: Math.cos(angle) * speed * 0.5,
    vy: Math.sin(angle) * speed * (isEmbers ? 1.2 : 0.8),
    size: 2 + Math.random() * 3.5,
    alpha: 0,
    maxAlpha: 0.35 + Math.random() * 0.35,
    life,
    maxLife: life,
    color: col,
    kind: isEmbers ? 'ember' : element === 'ice' ? 'spark' : element === 'forest' ? 'leaf' : 'smoke'
   });
  };

  const render = (now: number) => {
   if (!running) return;
   const dt = Math.min((now - (lastFrameRef.current || now)) / 1000, 0.05);
   lastFrameRef.current = now;
   timeRef.current += dt;
   const time = timeRef.current;

   if (entranceTimerRef.current > 0) {
    entranceTimerRef.current = Math.max(0, entranceTimerRef.current - dt);
   }

   const width = canvas.width;
   const height = canvas.height;
   ctx.clearRect(0, 0, width, height);

   // 1. Draw Arena Background with Depth
   const bg = arenaImage(arena);
   if (bg && bg.complete && bg.naturalWidth) {
    // Subtle parallax float
    const sway = motion ? Math.sin(time * 0.35) * 8 : 0;
    ctx.drawImage(bg, -20 + sway, -15, width + 40, height + 30);
   } else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a1424');
    bgGrad.addColorStop(1, '#050912');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
   }

   // Atmospheric overlays
   const skyShade = ctx.createLinearGradient(0, 0, 0, height);
   skyShade.addColorStop(0, '#060d1b99');
   skyShade.addColorStop(0.3, '#060e1d22');
   skyShade.addColorStop(0.7, '#070e1b66');
   skyShade.addColorStop(1, '#050912ee');
   ctx.fillStyle = skyShade;
   ctx.fillRect(0, 0, width, height);

   // Ambient vignette
   const vignette = ctx.createRadialGradient(width / 2, height * 0.55, width * 0.25, width / 2, height * 0.55, width * 0.75);
   vignette.addColorStop(0, 'transparent');
   vignette.addColorStop(1, '#04070eed');
   ctx.fillStyle = vignette;
   ctx.fillRect(0, 0, width, height);

   // 2. Weather particles from arena
   if (particlesEnabled && arena.weather !== 'none') {
    const weather = arena.weather;
    const wCount = weather === 'rain' ? 35 : 18;
    ctx.save();
    for (let i = 0; i < wCount; i++) {
     const pSeed = i * 137.5;
     const speed = weather === 'rain' ? 520 : weather === 'wind' ? 260 : 35 + (i % 4) * 15;
     const px = (pSeed + time * speed * (weather === 'wind' ? 1.5 : 0.3)) % width;
     const py = (pSeed * 1.7 + time * (weather === 'rain' ? 680 : 38)) % height;
     ctx.globalAlpha = weather === 'rain' ? 0.28 : 0.22;
     if (weather === 'rain') {
      ctx.strokeStyle = '#c4e2ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 6, py + 18);
      ctx.stroke();
     } else if (weather === 'ember') {
      ctx.fillStyle = '#ff9f43';
      ctx.beginPath();
      ctx.arc(px, height - (py % height), 2.2, 0, Math.PI * 2);
      ctx.fill();
     } else if (weather === 'petal') {
      ctx.fillStyle = '#f8b4d9';
      ctx.beginPath();
      ctx.ellipse(px, py, 3.8, 1.8, time * 0.6 + i, 0, Math.PI * 2);
      ctx.fill();
     } else if (weather === 'star') {
      ctx.fillStyle = '#c5b4ff';
      ctx.beginPath();
      ctx.arc(px, py, 1.8 + Math.sin(time * 3 + i) * 0.8, 0, Math.PI * 2);
      ctx.fill();
     } else {
      ctx.fillStyle = '#d6e9f8';
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
     }
    }
    ctx.restore();
   }

   // 3. Ground Plane & Stage Platform
   const floorY = height * 0.77;
   const floorGrad = ctx.createLinearGradient(0, floorY - 30, 0, height);
   floorGrad.addColorStop(0, '#0e182800');
   floorGrad.addColorStop(0.15, '#0b142499');
   floorGrad.addColorStop(0.6, '#060b14eb');
   floorGrad.addColorStop(1, '#04070ef8');
   ctx.fillStyle = floorGrad;
   ctx.fillRect(0, floorY - 30, width, height - floorY + 30);

   // Ground perspective depth ring
   ctx.save();
   ctx.strokeStyle = '#6cecf218';
   ctx.lineWidth = 1.5;
   ctx.beginPath();
   ctx.ellipse(width * 0.5, floorY + 18, width * 0.44, 48, 0, 0, Math.PI * 2);
   ctx.stroke();
   ctx.restore();

   // 4. Staging Layout for the 3 Fighters
   // Responsive spacing based on canvas width
   const isMobile = width < 768;
   const spreadX = isMobile ? Math.min(130, width * 0.28) : Math.min(270, width * 0.22);
   const centerX = width * 0.5;

   // Main: slot 0 (center, foreground)
   // Support: slot 1 (left, midground)
   // Tag: slot 2 (right, midground)
   const staging = [
    {
     slot: 1, // Support (rendered first / background-left)
     x: centerX - spreadX,
     y: floorY - 14,
     scale: isMobile ? 0.84 : 0.92,
     face: 1,
     timingOffset: 2.1,
     freqRate: 0.92,
     depthAlpha: 0.94
    },
    {
     slot: 2, // Tag (rendered second / background-right)
     x: centerX + spreadX,
     y: floorY - 14,
     scale: isMobile ? 0.84 : 0.92,
     face: -1, // Mirrored to face inward
     timingOffset: 4.3,
     freqRate: 1.08,
     depthAlpha: 0.94
    },
    {
     slot: 0, // Main (rendered last / center foreground)
     x: centerX,
     y: floorY + 12,
     scale: isMobile ? 0.98 : 1.10,
     face: 1,
     timingOffset: 0,
     freqRate: 1.0,
     depthAlpha: 1.0
    }
   ];

   fighterPosRef.current = [];

   // Draw each fighter with shadow, elemental particles, and stance
   for (const pos of staging) {
    const charId = team[pos.slot] || CHARACTERS[pos.slot]?.id || 'naruto-uzumaki';
    const c = byId(charId);
    if (!c) continue;

    const prog = player.owned[c.id];
    const level = prog?.level ?? 1;
    const mastery = prog?.mastery ?? 0;
    const f = makeLobbyFighter(c, level, mastery, pos.x, pos.y, pos.face);
    const fighterH = 260; // approximate nominal height

    // Record position for click detection
    fighterPosRef.current.push({
     x: pos.x - 70 * pos.scale,
     y: pos.y - fighterH * pos.scale,
     width: 140 * pos.scale,
     height: fighterH * pos.scale,
     slot: pos.slot
    });

    const isHovered = activeSlot === pos.slot;
    const isSelected = editSlot === pos.slot;
    const isEntering = entranceSlot === pos.slot && entranceTimerRef.current > 0;
    const elementColor = ELEMENT_COLORS[c.element] || '#6cecf2';

    // A. Ground Contact Shadows
    ctx.save();
    // Ambient occlusion contact shadow (dark, tight at feet)
    ctx.fillStyle = '#000000dd';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 55 * pos.scale, 8 * pos.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Diffuse cast shadow (softer, wider)
    const shadowGrad = ctx.createRadialGradient(pos.x, pos.y, 10, pos.x, pos.y, 110 * pos.scale);
    shadowGrad.addColorStop(0, '#00000088');
    shadowGrad.addColorStop(0.5, '#00000044');
    shadowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + 2, 105 * pos.scale, 18 * pos.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft elemental floor underglow
    const elemGlow = ctx.createRadialGradient(pos.x, pos.y, 5, pos.x, pos.y, 90 * pos.scale);
    elemGlow.addColorStop(0, isSelected ? '#ffcd6755' : isHovered ? elementColor + '55' : elementColor + '20');
    elemGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = elemGlow;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + 1, 85 * pos.scale, 16 * pos.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floor spotlight ring if hovered or selected
    if (isSelected || isHovered) {
     ctx.strokeStyle = isSelected ? '#ffcd67' : elementColor;
     ctx.lineWidth = isSelected ? 2.5 : 1.8;
     ctx.shadowColor = isSelected ? '#ffcd67' : elementColor;
     ctx.shadowBlur = 14;
     ctx.beginPath();
     ctx.ellipse(pos.x, pos.y, 75 * pos.scale, 14 * pos.scale, 0, 0, Math.PI * 2);
     ctx.stroke();
     ctx.shadowBlur = 0;
    }
    ctx.restore();

    // Spawn character-specific aura particles intermittently
    if (Math.random() < (isHovered ? 0.35 : 0.16)) {
     spawnElementAura(pos.x, pos.y, c.element, pos.slot);
    }

    // B. Draw Illustrated Fighter with Independent Timing & Grounded Battle Stance
    ctx.save();
    const fighterTime = time * pos.freqRate + pos.timingOffset;
    ctx.globalAlpha = pos.depthAlpha;

    if (isEntering) {
     const tProgress = 1 - entranceTimerRef.current / 0.45;
     f.flash = Math.max(0, 0.4 - tProgress * 0.4);
     ctx.globalAlpha = Math.min(1, tProgress * 1.5);
    }

    // Draw the fighter using the mesh/clip skeletal system
    drawIllustratedFighter(ctx, f, fighterTime, pos.scale, motion ? 1 : 0);
    ctx.restore();
   }

   // 5. Update & Draw Elemental Aura Particles
   if (particlesEnabled && particlesRef.current.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const remaining: Particle[] = [];
    for (const p of particlesRef.current) {
     p.life -= dt;
     if (p.life <= 0) continue;
     p.x += p.vx * dt;
     p.y += p.vy * dt;
     p.vy += 8 * dt; // gentle lift / gravity
     const progress = 1 - p.life / p.maxLife;
     p.alpha = Math.sin(progress * Math.PI) * p.maxAlpha;

     ctx.globalAlpha = p.alpha;
     ctx.fillStyle = p.color;
     ctx.beginPath();
     if (p.kind === 'leaf') {
      ctx.ellipse(p.x, p.y, p.size * 1.4, p.size * 0.7, p.life * 4, 0, Math.PI * 2);
     } else {
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.3), 0, Math.PI * 2);
     }
     ctx.fill();
     remaining.push(p);
    }
    particlesRef.current = remaining;
    ctx.restore();
   }

   rafRef.current = requestAnimationFrame(render);
  };

  // Canvas resize observer to keep crisp resolution
  const ro = new ResizeObserver(entries => {
   for (const entry of entries) {
    const {width, height} = entry.contentRect;
    if (width && height) {
     const dpr = Math.min(window.devicePixelRatio || 1, 2);
     canvas.width = Math.floor(width * dpr);
     canvas.height = Math.floor(height * dpr);
     ctx.scale(dpr, dpr);
    }
   }
  });

  const parent = canvas.parentElement;
  if (parent) ro.observe(parent);

  rafRef.current = requestAnimationFrame(render);

  return () => {
   running = false;
   cancelAnimationFrame(rafRef.current);
   document.removeEventListener('visibilitychange', handleVisibility);
   ro.disconnect();
  };
 }, [team, arena, motion, particlesEnabled, activeSlot, editSlot, entranceSlot, player.owned]);

 // Handle click on the canvas to select a fighter
 const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width / (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1);
  const scaleY = canvas.height / rect.height / (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1);
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  for (const f of fighterPosRef.current) {
   if (
    clickX >= f.x - 20 &&
    clickX <= f.x + f.width + 20 &&
    clickY >= f.y - 20 &&
    clickY <= f.y + f.height + 30
   ) {
    sound.unlock();
    sound.play('click');
    setEditSlot(f.slot);
    return;
   }
  }
 };

 const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width / (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1);
  const scaleY = canvas.height / rect.height / (window.devicePixelRatio > 1 ? window.devicePixelRatio : 1);
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  let found: number | null = null;
  for (const f of fighterPosRef.current) {
   if (
    mouseX >= f.x - 20 &&
    mouseX <= f.x + f.width + 20 &&
    mouseY >= f.y - 20 &&
    mouseY <= f.y + f.height + 30
   ) {
    found = f.slot;
    break;
   }
  }
  if (found !== activeSlot) {
   setActiveSlot(found);
  }
 };

 // Team member replacement logic
 const handleSelectFighterForSlot = async (newCharId: string) => {
  if (editSlot === null) return;
  const nextTeam = [...team];
  const existingSlot = nextTeam.indexOf(newCharId);

  if (existingSlot >= 0) {
   // Swap slots cleanly without duplicates
   const temp = nextTeam[editSlot];
   nextTeam[editSlot] = newCharId;
   nextTeam[existingSlot] = temp;
  } else {
   nextTeam[editSlot] = newCharId;
  }

  sound.unlock();
  sound.play('reveal');
  setEntranceSlot(editSlot);
  entranceTimerRef.current = 0.45;
  setEditSlot(null);

  await onUpdateTeam(nextTeam);
 };

 const wins = metric(player, 'wins');
 const editingChar = editSlot !== null ? byId(team[editSlot]) : null;
 const editingProg = editingChar ? player.owned[editingChar.id] : null;
 const editingStats = editingChar ? stats(editingChar, editingProg?.level ?? 1, editingProg?.mastery ?? 0) : null;

 const filteredOwnedFighters = PLAYABLE_CHARACTERS.filter(c => {
  const isOwned = !!player.owned[c.id];
  const matchesWorld = editWorld === 'All worlds' || c.anime === editWorld;
  const matchesSearch = !editSearch || c.name.toLowerCase().includes(editSearch.toLowerCase());
  return isOwned && matchesWorld && matchesSearch;
 });

 return (
  <section className="cinematic-lobby" aria-label="Aether Arc Battle Lobby">
   {/* Interactive 3-Fighter Canvas */}
   <div className="lobby-stage-container">
    <canvas
     ref={canvasRef}
     className="lobby-stage-canvas"
     onClick={handleCanvasClick}
     onMouseMove={handleCanvasMouseMove}
     onMouseLeave={() => setActiveSlot(null)}
     style={{cursor: activeSlot !== null ? 'pointer' : 'default'}}
    />

    {/* Grounded Floating Role Badges (Below Character Feet) */}
    <div className="lobby-role-badges" aria-label="Team member roles">
     {team.map((id, index) => {
      const c = byId(id);
      if (!c) return null;
      const prog = player.owned[c.id];
      const isSelected = editSlot === index;
      const isHovered = activeSlot === index;
      const roleName = ROLE_NAMES[index];
      const roleTag = ROLE_TAGS[index];
      const elemColor = ELEMENT_COLORS[c.element];

      return (
       <button
        key={index}
        className={`lobby-role-badge slot-${index} ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
        style={{'--element-color': elemColor} as React.CSSProperties}
        onClick={() => {
         sound.unlock();
         sound.play('click');
         setEditSlot(index);
        }}
        aria-label={`Edit ${roleName}: ${c.name}, Level ${prog?.level ?? 1}`}
       >
        <div className="badge-tag">
         <span className="badge-slot-num">0{index + 1}</span>
         <strong>{roleTag}</strong>
        </div>
        <div className="badge-info">
         <span className="badge-name">{c.name}</span>
         <span className="badge-meta">
          <small>LV. {prog?.level ?? 1}</small>
          <RarityLabel c={c} />
         </span>
        </div>
        <span className="badge-swap-icon" title="Change fighter">
         <RefreshCw size={13} />
        </span>
       </button>
      );
     })}
    </div>
   </div>

   {/* Lobby HUD & Control Deck */}
   <div className="lobby-hud">
    {/* Top Brand & Status Strip */}
    <div className="lobby-top-strip">
     <div className="lobby-brand-mark">
      <div className="brand-title">
       AETHER <span className="gold-text">ARC</span>
      </div>
      <span className="brand-subtitle">THE CONVERGENCE</span>
     </div>

     {/* Compact Quick Access Bar */}
     <div className="lobby-quick-bar">
      <button className="quick-btn" onClick={onOpenRoster} aria-label="Open fighter roster">
       <Users size={16} />
       <span>ROSTER</span>
       <small>{Object.keys(player.owned).length}/77</small>
      </button>
      <button className="quick-btn" onClick={onOpenBoxes} aria-label="Open box summoning">
       <Box size={16} />
       <span>SUMMON</span>
       {Object.values(player.boxes).reduce((a, b) => a + b, 0) > 0 && (
        <b className="notification-pill">{Object.values(player.boxes).reduce((a, b) => a + b, 0)}</b>
       )}
      </button>
      <button className="quick-btn" onClick={onOpenMissions} aria-label="Open missions">
       <Shield size={16} />
       <span>MISSIONS</span>
      </button>
      <button className="quick-btn" onClick={onOpenRewards} aria-label="Open rewards">
       <Sparkles size={16} />
       <span>REWARDS</span>
      </button>
     </div>
    </div>

    {/* Bottom Action Core: Mode Selector, Stage Card, and Prominent Fight Button */}
    <div className="lobby-action-deck">
     {/* Left: Selected Battlefield Card */}
     <div className="lobby-stage-card" onClick={onOpenStageSelect} role="button" tabIndex={0}>
      <div className="stage-thumbnail">
       <ArenaArt arena={arena} />
      </div>
      <div className="stage-details">
       <span className="stage-eyebrow">
        <Map size={12} /> BATTLEFIELD
       </span>
       <strong className="stage-title">{arena.name}</strong>
       <span className="stage-anime">{arena.anime}</span>
      </div>
      <button className="change-stage-btn" onClick={onOpenStageSelect} aria-label="Change battlefield stage">
       CHANGE <ChevronRight size={14} />
      </button>
     </div>

     {/* Center: Mode Selector + Prominent START FIGHT Button */}
     <div className="lobby-start-action">
      <div className="lobby-mode-pills">
       <button
        className={`mode-pill ${mode === 'arcade' ? 'active' : ''}`}
        onClick={() => onModeChange('arcade')}
        aria-pressed={mode === 'arcade'}
       >
        <Swords size={14} /> Arcade
       </button>
       <button
        className={`mode-pill ${mode === 'boss' ? 'active' : ''} ${wins < 3 ? 'is-locked' : ''}`}
        onClick={() => onModeChange('boss')}
        disabled={wins < 3}
        aria-pressed={mode === 'boss'}
       >
        <Crown size={14} /> Elite Boss {wins < 3 && <small>(3 Wins)</small>}
       </button>
       <button
        className={`mode-pill ${mode === 'tutorial' ? 'active' : ''}`}
        onClick={() => onModeChange('tutorial')}
        aria-pressed={mode === 'tutorial'}
       >
        <BookOpen size={14} /> Training
       </button>
      </div>

      <button
       className="lobby-fight-button"
       disabled={busy}
       onClick={() => onStartMatch(mode)}
       aria-label={player.active ? 'Resume ongoing battle' : 'Start anime battle'}
      >
       <span className="fight-btn-glow" />
       <Swords size={26} className="fight-icon" />
       <div className="fight-text">
        <strong>{player.active ? 'RESUME FIGHT' : 'START FIGHT'}</strong>
        <small>{mode === 'boss' ? 'ELITE DRAGON BATTLE' : mode === 'tutorial' ? 'PRACTICE ARENA' : 'ARCADE CONVERGENCE'}</small>
       </div>
       <ChevronRight size={22} className="fight-arrow" />
      </button>
     </div>
    </div>
   </div>

   {/* Focused Team-Edit Panel Modal */}
   <Dialog open={editSlot !== null} onOpenChange={open => !open && setEditSlot(null)}>
    <DialogContent className="team-edit-dialog">
     <DialogTitle className="team-edit-title">
      <div className="dialog-header-slot">
       <span className="slot-badge-gold">SLOT 0{editSlot !== null ? editSlot + 1 : 1}</span>
       <strong>{editSlot !== null ? ROLE_NAMES[editSlot] : 'TEAM MEMBER'}</strong>
      </div>
      <span className="dialog-subtitle">Select an owned legend to take into battle</span>
     </DialogTitle>
     <DialogDescription className="sr-only">
      Choose an owned fighter to assign to this team position.
     </DialogDescription>

     {editingChar && editingStats && (
      <div className="current-assigned-hero">
       <div className="hero-portrait-frame">
        <Portrait c={editingChar} />
       </div>
       <div className="hero-details">
        <div className="hero-heading">
         <RarityLabel c={editingChar} />
         <h3>{editingChar.name}</h3>
         <span className="hero-universe">{editingChar.anime} · LV. {editingProg?.level ?? 1}</span>
        </div>
        <div className="hero-stats-row">
         <span>HP <b>{editingStats.hp}</b></span>
         <span>ATK <b>{editingStats.attack}</b></span>
         <span>DEF <b>{editingStats.defense}</b></span>
         <span>POWER <b>{editingStats.power}</b></span>
        </div>
        <div className="hero-skills-row">
         <span className="skill-chip"><kbd>Q</kbd> {editingChar.skills[0]}</span>
         <span className="skill-chip"><kbd>E</kbd> {editingChar.skills[1]}</span>
         <span className="skill-chip ult"><kbd>F</kbd> {editingChar.ultimate}</span>
        </div>
       </div>
      </div>
     )}

     {/* Filter Controls */}
     <div className="team-picker-toolbar">
      <div className="search-field">
       <Search size={16} />
       <input
        placeholder="Filter owned legends…"
        value={editSearch}
        onChange={e => setEditSearch(e.target.value)}
        aria-label="Search owned fighters"
       />
      </div>
      <Tabs value={editWorld} onValueChange={setEditWorld} className="team-world-tabs">
       <TabsList variant="line">
        {['All worlds', ...UNIVERSES].map(u => (
         <TabsTrigger value={u} key={u}>{u}</TabsTrigger>
        ))}
       </TabsList>
      </Tabs>
     </div>

     {/* Owned Fighters Grid */}
     <div className="team-picker-grid">
      {filteredOwnedFighters.length === 0 ? (
       <div className="team-picker-empty">
        <Search size={24} />
        <p>No owned fighters found matching your filters.</p>
       </div>
      ) : (
       filteredOwnedFighters.map(c => {
        const prog = player.owned[c.id];
        const assignedIdx = team.indexOf(c.id);
        const isCurrentSlot = editSlot !== null && team[editSlot] === c.id;

        return (
         <button
          key={c.id}
          className={`team-fighter-tile ${isCurrentSlot ? 'is-current' : ''} ${assignedIdx >= 0 ? 'is-assigned' : ''}`}
          onClick={() => handleSelectFighterForSlot(c.id)}
          aria-label={`Select ${c.name}`}
         >
          <div className="tile-portrait">
           <Portrait c={c} />
           {assignedIdx >= 0 && (
            <span className={`assigned-role-tag slot-${assignedIdx}`}>
             {ROLE_TAGS[assignedIdx]}
            </span>
           )}
           <span className="tile-level">LV. {prog?.level ?? 1}</span>
          </div>
          <div className="tile-caption">
           <span className="tile-name">{c.name}</span>
           <span className="tile-rarity" style={{color: RARITY_COLORS[c.rarity]}}>
            {c.rarity}
           </span>
          </div>
          {isCurrentSlot && <Check className="tile-check-icon" size={16} />}
         </button>
        );
       })
      )}
     </div>
    </DialogContent>
   </Dialog>
  </section>
 );
}
