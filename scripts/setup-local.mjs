// A local D1 emulator only. This command never accesses a hosted database.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=spawnSync(process.execPath,[
 '--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js',
 'd1','migrations','apply','DB','--local','--config','wrangler.local.json',
 '--persist-to','.wrangler/state'
],{cwd:root,stdio:'inherit',env:{...process.env,CI:'true'}});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
console.log('Local save database is ready. Run pnpm dev, then open the address shown.');
