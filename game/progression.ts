import { ARENAS, BOXES, BoxType, CHARACTERS, MAX_LEVEL, MISSIONS, PLAYABLE_CHARACTERS, COLLECTION_MILESTONES, MILESTONE_REWARDS, isPlayable, RARITIES, STARTERS, byId, xpRequired } from './data';
export type FighterProgress={level:number;xp:number;mastery:number;shards:number;fights:number};
export type Reveal={characterId:string;duplicate:boolean;shards:number;box:BoxType|'Dragon';id:string};
export type MatchConfig={id:string;team:string[];opponent:string;opponentLevel:number;opponentTeam?:string[];opponentLevels?:number[];arena:string;mode:'arcade'|'boss'|'tutorial';startedAt:number};
export type Player={version:number;name:string;coins:number;points:number;xp:number;owned:Record<string,FighterProgress>;team:string[];favorites:string[];boxes:Record<BoxType,number>;pity:Record<string,number>;metrics:Record<string,number>;claims:string[];seals:number;tutorial:boolean;pending:Reveal|null;active:MatchConfig|null;history:{fighter:string;opponent:string;won:boolean;draw?:boolean;date:number;mode:string}[];receipts:Record<string,unknown>};
export const playerLevel=(p:Player)=>Math.min(99,1+Math.floor(p.xp/800));
export const metric=(p:Player,key:string)=>key==='owned'?Object.keys(p.owned).length:p.metrics[key]??0;
export const freshFighter=():FighterProgress=>({level:1,xp:0,mastery:0,shards:0,fights:0});
export function createPlayer():Player{return {version:0,name:'Aether Wanderer',coins:800,points:0,xp:0,owned:Object.fromEntries(STARTERS.map(id=>[id,freshFighter()])),team:[...STARTERS],favorites:['naruto-uzumaki'],boxes:{Normal:1,Rare:0,Epic:0,Gold:0,Mythic:0,Legendary:0,Aether:0},pity:{},metrics:{},claims:[],seals:0,tutorial:false,pending:null,active:null,history:[],receipts:{}};}
function inc(p:Player,key:string,n=1){p.metrics[key]=(p.metrics[key]??0)+n;}
function xp(p:Player,id:string,amount:number){const f=p.owned[id];f.xp+=amount;let ups=0;while(f.level<MAX_LEVEL&&f.xp>=xpRequired(f.level)){f.xp-=xpRequired(f.level);f.level++;ups++;}if(f.level===MAX_LEVEL)f.xp=0;inc(p,'levelUps',ups);return ups;}
function requireIt(yes:unknown,message:string):asserts yes{if(!yes)throw new Error(message);}
function bounded(v:unknown,max:number){return Number.isFinite(Number(v))?Math.min(max,Math.max(0,Math.floor(Number(v)))):0;}
export function applyAction(p:Player,action:string,data:Record<string,unknown>,random:()=>number=Math.random,now=Date.now()):Record<string,unknown>{
 switch(action){
 case 'team':{const team=data.team as string[];requireIt(Array.isArray(team)&&team.length===3&&new Set(team).size===3&&team.every(id=>p.owned[id]&&isPlayable(byId(id))),'Choose three different owned fighters.');requireIt(!p.active,'Finish or leave your current fight first.');p.team=team;return {};}
 case 'favorite':{const id=String(data.id);requireIt(byId(id),'Fighter not found.');p.favorites=p.favorites.includes(id)?p.favorites.filter(x=>x!==id):[...p.favorites,id];return {};}
 case 'name':{const name=String(data.name??'').trim().slice(0,24);requireIt(name.length>=2,'Use a name with at least two characters.');p.name=name;return {};}
 case 'upgrade':{const id=String(data.id),f=p.owned[id];requireIt(f,'Unlock this fighter first.');requireIt(f.level>=5,'Reach fighter level 5 through combat first.');requireIt(f.mastery<5,'Mastery is already at its maximum.');const cost=10+f.mastery*5;requireIt(f.shards>=cost,`You need ${cost} character shards.`);f.shards-=cost;f.mastery++;return {mastery:f.mastery};}
 case 'buy-box':{const b=BOXES.find(b=>b.type===data.box);requireIt(b,'Box not found.');requireIt(p.coins>=b.cost,'Earn more coins in battle to get this box.');p.coins-=b.cost;p.boxes[b.type]++;return {};}
 case 'open-box':{requireIt(!p.pending,'Reveal your previous reward first.');const b=BOXES.find(b=>b.type===data.box);requireIt(b,'Box not found.');requireIt(p.boxes[b.type]>0,'You do not own this box yet.');let r=random()*100,idx=0;for(let i=0;i<b.rates.length;i++){r-=b.rates[i];if(r<0){idx=i;break;}}let pool=PLAYABLE_CHARACTERS.filter(c=>!c.prestige&&c.rarity===RARITIES[idx]);p.pity[b.type]=(p.pity[b.type]??0)+1;if(p.pity[b.type]%10===0){const newPool=PLAYABLE_CHARACTERS.filter(c=>!c.prestige&&!p.owned[c.id]&&b.rates[RARITIES.indexOf(c.rarity)]>0);if(newPool.length)pool=newPool;}const c=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];requireIt(c,'No rewards available for this box.');const duplicate=!!p.owned[c.id],shards=duplicate?5+RARITIES.indexOf(c.rarity)*2:0;if(duplicate)p.owned[c.id].shards+=shards;else p.owned[c.id]=freshFighter();p.boxes[b.type]--;inc(p,'opened');p.pending={characterId:c.id,duplicate,shards,box:b.type,id:String(data.requestId)};return {reveal:p.pending};}
 case 'ack-reveal':requireIt(!p.pending||p.pending.id===data.id,'This reward has changed. Reopen Boxes.');p.pending=null;return {};
 case 'start-match':{
  if(p.active)return {match:p.active};
  const arena=ARENAS.find(a=>a.id===data.arena);
  requireIt(arena&&metric(p,'wins')>=arena.wins,'This arena is still locked.');
  const mode=data.mode as MatchConfig['mode'];
  requireIt(['arcade','boss','tutorial'].includes(mode),'Choose a valid battle mode.');
  if(mode==='boss')requireIt(metric(p,'wins')>=3,'Win 3 arcade battles to challenge a boss.');
  const level=p.owned[p.team[0]].level;
  let opponentTeam:string[]=[];
  let opponentLevels:number[]=[];
  if(mode==='tutorial'){
   opponentTeam=['sakura-haruno','sasuke-uchiha','kakashi-hatake'];
   opponentLevels=[1,1,2];
  }else if(mode==='boss'){
   const specialBosses=PLAYABLE_CHARACTERS.filter(c=>!c.prestige&&c.special&&!p.team.includes(c.id));
   const bossPool=specialBosses.length>0?specialBosses:PLAYABLE_CHARACTERS.filter(c=>!c.prestige&&!p.team.includes(c.id));
   const boss=bossPool[Math.floor(random()*bossPool.length)];
   const otherEligible=PLAYABLE_CHARACTERS.filter(c=>!c.prestige&&c.id!==boss.id&&!p.team.includes(c.id));
   const shuffled=[...otherEligible].sort(()=>random()-.5);
   opponentTeam=[boss.id,shuffled[0].id,shuffled[1].id];
   const bossLevel=Math.min(30,Math.max(1,level+3));
   opponentLevels=[bossLevel,Math.max(1,bossLevel-1),Math.max(1,bossLevel-2)];
  }else{
   const eligible=PLAYABLE_CHARACTERS.filter(c=>!c.prestige&&!p.team.includes(c.id));
   const shuffled=[...eligible].sort(()=>random()-.5);
   opponentTeam=[shuffled[0].id,shuffled[1].id,shuffled[2].id];
   const baseLvl=Math.min(30,Math.max(1,level+Math.floor(random()*3)-1));
   opponentLevels=[baseLvl,Math.min(30,Math.max(1,baseLvl+Math.floor(random()*3)-1)),Math.min(30,Math.max(1,baseLvl+Math.floor(random()*3)-1))];
  }
  const opponent=opponentTeam[0];
  const opponentLevel=opponentLevels[0];
  p.active={id:String(data.requestId),team:[...p.team],opponent,opponentLevel,opponentTeam,opponentLevels,arena:arena!.id,mode,startedAt:now};
  return {match:p.active};
 }
 case 'abandon-match':p.active=null;return {};
 case 'finish-match':{
  const m=p.active;
  requireIt(m&&m.id===data.matchId,'This fight was already settled. Your saved rewards are safe.');
  requireIt(now-m.startedAt>=4000,'Fight result arrived too soon. Try again in a moment.');
  const won=data.won===true,draw=data.draw===true,isTutorial=m.mode==='tutorial',firstTutorial=isTutorial&&!p.tutorial;
  const used=Array.isArray(data.used)?(data.used as string[]).filter(id=>m.team.includes(id)):[];
  if(!used.includes(m.team[0]))used.push(m.team[0]);
  const fights=used.length;
  let charXP=isTutorial?(firstTutorial?350:0):won?240:draw?140:100;
  const coins=isTutorial?(firstTutorial?200:0):won?(m.mode==='boss'?420:200):draw?120:80,points=isTutorial?(firstTutorial?300:0):won?450:draw?220:140;
  const boxReward:BoxType|null=firstTutorial?'Rare':!isTutorial&&(metric(p,'matches')+1)%3===0?(won&&m.mode==='boss'?'Gold':'Normal'):null;
  const before=p.owned[m.team[0]].level,levelUps:Record<string,number>={};
  used.forEach(id=>{levelUps[id]=xp(p,id,Math.round(charXP/(fights>1?1.35:1)));p.owned[id].fights++;});
  p.xp+=charXP;p.coins+=coins;p.points+=points;
  if(boxReward)p.boxes[boxReward]++;
  if(!isTutorial){
   inc(p,'matches');
   if(won)inc(p,'wins');
   else if(!draw)inc(p,'losses');
   inc(p,'combos',bounded(data.combos,40));
   inc(p,'ultimates',bounded(data.ultimates,10));
   if(byId(m.team[0]).anime==='Naruto')inc(p,'naruto');
   if(won&&m.mode==='boss'){inc(p,'bosses');p.seals++;}
  }
  if(firstTutorial){p.tutorial=true;p.owned['monkey-d-luffy']??=freshFighter();}
  p.history=[{fighter:m.team[0],opponent:m.opponent,won,draw,date:now,mode:m.mode},...p.history].slice(0,15);
  p.active=null;
  return {won,draw,coins,points,xp:charXP,box:boxReward,levelUps,previousLevel:before,fighter:m.team[0],newFighter:firstTutorial?'monkey-d-luffy':null,seal:won&&m.mode==='boss'};
 }
 case 'claim-mission':{const m=MISSIONS.find(m=>m.id===data.id);requireIt(m,'Mission not found.');requireIt(!p.claims.includes(m.id),'Already claimed.');requireIt(metric(p,m.metric)>=m.target,'Complete the mission first.');p.claims.push(m.id);p.coins+=m.coins;if(m.box)p.boxes[m.box]++;return {coins:m.coins,box:m.box};}
 case 'claim-milestone':{const key=String(data.id);requireIt(!p.claims.includes(key),'Already claimed.');let reward=0;let box:BoxType='Epic';if(key.startsWith('collect-')){const target=Number(key.slice(8));requireIt((COLLECTION_MILESTONES.includes(target)||target===23)&&Object.keys(p.owned).length>=target,'This collection milestone is not complete.');reward=target*100;box=MILESTONE_REWARDS[target];}else if(key.startsWith('universe-')){const universe=key.slice(9);const cs=PLAYABLE_CHARACTERS.filter(c=>c.anime===universe);requireIt(cs.length>0&&cs.every(c=>p.owned[c.id]),'Complete this universe collection first.');reward=2000;box='Legendary';}else throw new Error('Milestone not found.');p.claims.push(key);p.coins+=reward;p.boxes[box]++;return {coins:reward,box};}
 case 'dragon':{requireIt(!p.pending,'Reveal your previous reward first.');requireIt(metric(p,'wins')>=30&&playerLevel(p)>=8&&p.seals>=7,'Requires 30 wins, player level 8 and 7 Dragon Seals.');const pool=CHARACTERS.filter(c=>c.prestige&&!p.owned[c.id]);requireIt(pool.length,'You have collected all five Dragon Ball legends.');const c=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];p.seals-=7;p.owned[c.id]=freshFighter();p.pending={characterId:c.id,duplicate:false,shards:0,box:'Dragon',id:String(data.requestId)};return {reveal:p.pending};}
 default:throw new Error('Unknown action.');
 }
}
