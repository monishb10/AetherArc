import {assetUrl} from './runtime';
import type {Arena} from './data';

const images=new Map<string,HTMLImageElement>();
const pending=new Map<string,Promise<void>>();

export function prepareArenaArt(arena:Arena):Promise<void>{
 const existing=pending.get(arena.image);if(existing)return existing;
 const existingImg=images.get(arena.image);
 if(existingImg&&existingImg.complete&&existingImg.naturalWidth>0&&existingImg.naturalHeight>0){
  return Promise.resolve();
 }
 const img=new Image();images.set(arena.image,img);
 const resolvedUrl=assetUrl(arena.image);
 const promise=new Promise<void>((resolve,reject)=>{
  img.onload=()=>{
   const validDimensions=typeof img.naturalWidth==='number'?img.naturalWidth>0&&img.naturalHeight>0:true;
   if(validDimensions){
    resolve();
   }else{
    images.delete(arena.image);
    pending.delete(arena.image);
    const err=new Error('The battlefield artwork could not load. Please retry.');
    if(typeof console!=='undefined'&&console.error){
     console.error('[AetherArc Asset Error] Battlefield image has invalid dimensions:',{image:arena.image,resolvedUrl,width:img.naturalWidth,height:img.naturalHeight});
    }
    reject(err);
   }
  };
  img.onerror=()=>{
   images.delete(arena.image);
   pending.delete(arena.image);
   const err=new Error('The battlefield artwork could not load. Please retry.');
   if(typeof console!=='undefined'&&console.error){
    console.error('[AetherArc Asset Error] Failed to load battlefield artwork:',{image:arena.image,resolvedUrl});
   }
   reject(err);
  };
  img.src=resolvedUrl;
 });
 pending.set(arena.image,promise);
 return promise;
}

export function arenaImage(arena:Arena){return images.get(arena.image)??null;}
