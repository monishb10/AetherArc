import {createPlayer,applyAction,type Player} from './progression';
import {isStaticGame} from './runtime';
export const LOCAL_SAVE_KEY='aether-arc-pages-save-v1';
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const visible=(p:Player)=>{const {receipts,...rest}=p;return rest;};
/** The Pages edition deliberately keeps progression on this browser/device. */
export function localGameRequest(storage:Pick<Storage,'getItem'|'setItem'>,options?:RequestInit):Response {
 try{
  const raw=storage.getItem(LOCAL_SAVE_KEY),p:Player=raw?JSON.parse(raw):createPlayer();
  if(!p.owned||!Array.isArray(p.team)||typeof p.version!=='number')throw new Error('Your browser save could not be read. It has not been overwritten.');
  if(options?.method!=='POST'){if(!raw)storage.setItem(LOCAL_SAVE_KEY,JSON.stringify(p));return reply({player:visible(p)});}
  const data=JSON.parse(String(options.body));
  if(typeof data.requestId!=='string'||typeof data.action!=='string')return reply({error:'Invalid game action.'},400);
  if(p.receipts[data.requestId])return reply({player:visible(p),result:p.receipts[data.requestId]});
  let result;try{result=applyAction(p,data.action,data,()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296);}
  catch(e){return reply({error:e instanceof Error?e.message:'Action failed.'},400);}
  p.version++;p.receipts[data.requestId]=result;
  Object.keys(p.receipts).slice(0,-30).forEach(id=>delete p.receipts[id]);
  storage.setItem(LOCAL_SAVE_KEY,JSON.stringify(p));return reply({player:visible(p),result});
 }catch(e){return reply({error:e instanceof Error?e.message:'Browser storage is unavailable. Enable site storage to save your progress.'},503);}
}
export async function gameRequest(options?:RequestInit):Promise<Response>{
 if(!isStaticGame())return fetch('/api/game',options);
 try{
  const action=()=>localGameRequest(localStorage,options);
  if(navigator.locks)return await navigator.locks.request('aether-arc-save',action);
  return action();
 }catch{return reply({error:'Browser storage is unavailable. Allow storage for this site and retry.'},503);}
}
