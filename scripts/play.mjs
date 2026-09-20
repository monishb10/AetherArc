// Run the included prebuilt edition with Node alone; no dependency install.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('../play/',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.json':'application/json'};
try{await stat(resolve(root,'index.html'));}catch{console.error('The play folder is missing. Run pnpm build:pages first.');process.exit(1);}
const server=createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html',path=resolve(root,relative);
  if(!path.startsWith(resolve(root)+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]??'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
 }catch{res.writeHead(404).end('File not found');}
});
// Keep the origin stable so the browser finds the same save after each launch.
const port=Number(process.env.AETHER_PORT||4174);
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is in use. Close the other game launcher and retry.`:error.message);process.exit(1);});
server.listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/`;console.log(`AETHER ARC is ready: ${url}\nKeep this terminal open. Press Ctrl+C to stop.`);
 const opener=process.platform==='win32'?['cmd',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
 const child=spawn(opener[0],opener[1],{stdio:'ignore'});child.on('error',()=>{});
});
