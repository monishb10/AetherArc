import manifest from './clip-manifest.json';
import type {Fighter} from './engine';
import {clamp01, moveFor} from './motion';
export type ArtFrame={src:string;w:number;h:number;ax:number;ay:number};
export type ArtClip={height:number;sourceHeight:number;frames:ArtFrame[]};
export const fighterClips:Record<string,ArtClip>=manifest;

/** Drawn contact frames use the same contact time as the combat simulation. */
export function clipFrame(f:Fighter):number {
 if(f.defeated)return f.koBounces>0?11:f.clock<.13?9:10;
 if(f.state==='run')return Math.floor(((f.stride/(Math.PI*2))%1+1)%1*4);
 if(f.state==='jump'||f.state==='fall')return f.vy<0?1:3;
 if(f.state==='dash')return 2;
 if(f.state==='dodge')return 3;
 if(f.state==='hit')return 9;
 if(f.state==='block')return 8;
 if(f.state==='ultimate')return f.clock<.80?4:f.clock<1.65?5:f.clock<2.05?6:7;
 if(['light','heavy','skill1','skill2','special'].includes(f.state)){
  const t=clamp01(f.clock/f.duration),contact=moveFor(f.c,f.state,f.duration,f.chain).contact;
  return t<contact-.035?4:t<contact+.13?5:t<.83?6:7;
 }
 return 7;
}
