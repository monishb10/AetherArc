const {mkdtempSync,writeFileSync,rmSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {spawnSync}=require('node:child_process');
const output=mkdtempSync(join(tmpdir(),'aether-tests-'));
function run(args){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)throw new Error('Test command failed: '+args[0]);}
try{
 writeFileSync(join(output,'package.json'),'{"type":"commonjs"}');
 run(['node_modules/typescript/bin/tsc','game/data.ts','game/progression.ts','game/engine.ts','game/audio.ts','game/request.ts','--outDir',output,'--target','es2022','--module','commonjs','--skipLibCheck','--resolveJsonModule','--esModuleInterop']);
 run(['tests/game-invariants.cjs',output]);run(['tests/combat-engine.cjs',output]);run(['tests/pages-edition.cjs',output]);
}finally{rmSync(output,{recursive:true,force:true});}
