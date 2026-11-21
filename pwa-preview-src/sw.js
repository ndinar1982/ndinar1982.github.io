/* LFP v9.68 - isolated PWA install test, scoped ONLY to /pwa-preview/.
   Cache public UI assets only. Never store Google OAuth tokens, finance RPCs,
   Google Sheets responses or ZenMoney data in the Service Worker Cache API.
*/
'use strict';
const CACHE = 'lfp-pwa-install-test-v968-2';
const BASE = new URL(self.registration.scope);
const PARTS = [
  './','./index.html','./budget-app.js?v=968','./budget.css?v=968',
  './config.js?v=968','./pwa-bridge.js?v=968',
  './manifest.webmanifest?v=968','./icon-192.png','./icon-512.png',
  './icon-maskable-512.png','./favicon-32.png?v=968',
  './apple-touch-icon-180.png','./install-ui.js','./offline-bridge.js','./install-help.html'

];
const PUBLIC_PATHS = new Set(PARTS.filter(p=>p!=='./'&&p!=='./index.html').map(p=>new URL(p, BASE).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const p of PARTS) {
      try {
        const response = await fetch(new URL(p,BASE), {cache:'reload',credentials:'omit'});
        if (response.ok && response.type==='basic') await cache.put(new URL(p,BASE),response.clone());
      } catch (_) {} // offline install does not make the budget accessible
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('lfp-pwa-install-test-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname))return;
  if(req.mode==='navigate'){
    event.respondWith((async ()=>{
      const cache=await caches.open(CACHE);
      const key=url.pathname===BASE.pathname ? BASE.href : url.href;
      const cached=await cache.match(key,{ignoreSearch:true});
      if(cached){
        event.waitUntil(fetch(req,{cache:'no-store'}).then(r=>r.ok?cache.put(key,r.clone()):null).catch(()=>{}));
        return cached;
      }
      return fetch(req);
    })());
    return;
  }
  if(PUBLIC_PATHS.has(url.pathname)){
    event.respondWith((async ()=>{
      const cache=await caches.open(CACHE);
      const saved=await cache.match(req,{ignoreSearch:true});
      if(saved)return saved;
      const fresh=await fetch(req);
      if(fresh.ok && fresh.type==='basic')await cache.put(req,fresh.clone());
      return fresh;
    })());
  }
});
