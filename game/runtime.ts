declare global {interface Window {__AETHER_STATIC__?:boolean;}}
export function isStaticGame(){return typeof window!=='undefined'&&window.__AETHER_STATIC__===true;}
export function assetUrl(path:string){return isStaticGame()?new URL(path.replace(/^\//,''),document.baseURI).href:path;}
export function gameHome(){return isStaticGame()?new URL('./',document.baseURI).pathname:'/';}
