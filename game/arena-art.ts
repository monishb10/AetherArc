import {assetUrl} from './runtime';
import type {Arena} from './data';

const images=new Map<string,HTMLImageElement>();
const pending=new Map<string,Promise<void>>();
export function prepareArenaArt(arena:Arena):Promise<void>{
 const existing=pending.get(arena.image);if(existing)return existing;
 const img=new Image();images.set(arena.image,img);
 const promise=new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>{images.delete(arena.image);pending.delete(arena.image);reject(new Error('The battlefield artwork could not load. Please retry.'));};img.src=assetUrl(arena.image);});
 pending.set(arena.image,promise);return promise;
}
export function arenaImage(arena:Arena){return images.get(arena.image)??null;}
