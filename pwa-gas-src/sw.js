/* Installable PWA shell only. No Google OAuth, finance responses or third-party
   traffic is cached. Scope is /; iframe requests remain on Google's origin. */
'use strict';
const CACHE='lfp-gas-iframe-root-v974';
const BASE=new URL(self.registration.scope);
const SHELL=[
  './','./index.html','./app.js?v=974','./manifest.webmanifest?v=974',
  './favicon-32.png','./icon-192.png','./icon-512.png',
  './icon-maskable-512.png','./apple-touch-icon-180.png'
];
const KNOWN=new Set(SHELL.map(x=>new URL(x,BASE).pathname));
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const name of SHELL){
      try{
        const request=new Request(new URL(name,BASE),{cache:'reload'});
        const response=await fetch(request);
        if(response.ok&&response.type==='basic')await cache.put(request,response.clone());
      }catch(_){}
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(x=>(x.startsWith('lfp-gas-iframe-shell-')||x.startsWith('lfp-gas-iframe-root-')||x.startsWith('lfp-shell-'))&&x!==CACHE).map(x=>caches.delete(x)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||!KNOWN.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req,{ignoreSearch:true});
    if(cached){
      event.waitUntil(fetch(req,{cache:'no-store'}).then(res=>{
        if(res.ok&&res.type==='basic')return cache.put(req,res.clone());
      }).catch(()=>{}));
      return cached;
    }
    const fresh=await fetch(req);
    if(fresh.ok&&fresh.type==='basic')await cache.put(req,fresh.clone());
    return fresh;
  })());
});