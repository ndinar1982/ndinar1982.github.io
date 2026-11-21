/* Offline LFP v9.68 demo. Public application shell only.
   Financial data resides in the browser's localStorage, not the Service Worker.
   Scope is deliberately restricted to /pwa-local/. */
'use strict';
const CACHE='lfp-local-shell-v968-1';
const BASE=new URL(self.registration.scope);
const PUBLIC_FILES=[
  './','./index.html','./budget-app.js?v=968','./budget.css?v=968',
  './local-controls.js','./manifest.webmanifest?v=968',
  './icon-192.png','./icon-512.png','./icon-maskable-512.png',
  './favicon-32.png?v=968','./apple-touch-icon-180.png'
];
const whitelist=new Set(PUBLIC_FILES.map(f=>new URL(f,BASE).pathname));
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const file of PUBLIC_FILES){
      try{
        const req=new Request(new URL(file,BASE),{cache:'reload'});
        const r=await fetch(req);
        if(r.ok && r.type==='basic')await cache.put(req,r.clone());
      }catch(_){}
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(x=>x.startsWith('lfp-local-shell-')&&x!==CACHE).map(x=>caches.delete(x)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname))return;
  if(!whitelist.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const hit=await cache.match(url.href,{ignoreSearch:true});
    if(hit){
      event.waitUntil(fetch(req,{cache:'no-store'}).then(r=>{
        if(r.ok&&r.type==='basic')return cache.put(url.href,r.clone());
      }).catch(()=>{}));
      return hit;
    }
    const r=await fetch(req);
    if(r.ok&&r.type==='basic')await cache.put(url.href,r.clone());
    return r;
  })());
});