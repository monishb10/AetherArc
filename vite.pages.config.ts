import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

function playRouteDevPlugin(): Plugin {
 return {
  name: 'play-route-dev-plugin',
  configureServer(server) {
   server.middlewares.use((req, res, next) => {
    if (!req.url) return next();
    const urlObj = new URL(req.url, 'http://127.0.0.1:5173');
    if (urlObj.pathname === '/play' || urlObj.pathname === '/play/' || urlObj.pathname === '/play/index.html') {
     const target = '/' + urlObj.search;
     res.writeHead(302, { Location: target });
     res.end();
     return;
    }
    if (urlObj.pathname.startsWith('/play/')) {
     req.url = req.url.replace(/^\/play/, '');
    }
    next();
   });
  }
 };
}

export default defineConfig({
 root: fileURLToPath(new URL('./standalone', import.meta.url)),
 base: './',
 publicDir: fileURLToPath(new URL('./public', import.meta.url)),
 plugins: [react(), playRouteDevPlugin()],
 resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
 build: { outDir: fileURLToPath(new URL('./play', import.meta.url)), emptyOutDir: true },
 server: { host: '127.0.0.1', port: 5173 }
});
