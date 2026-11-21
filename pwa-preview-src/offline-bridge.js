/* LFP v9.68 installable preview: encrypted local snapshot, never an auth bypass.
   Offline snapshot is READ-ONLY. Google authorization remains mandatory for
   current data, writes, Zen and all server-side operations.
   Storage: WebCrypto AES-GCM encrypted snapshot + nonextractable key in IndexedDB.
   No financial data in localStorage, Cache API, Service Worker or public GitHub. */
(function(){
  'use strict';
  const old=window.LFP_PWA;
  if(!old)return;
  const DB_NAME='lfp-local-preview-v1';
  const MAX_AGE=30*24*60*60*1000;
  const FRESH_FORMAT='lfp-v968-v1';
  let snapshot=null, snapshotAt=0, online=false, invalidated=false;
  let loading=null, panel=null;
  const ready=()=>Boolean(old.diagnostics?.().authenticated);
  const setHidden=(hidden)=>{const gate=document.getElementById('lfp-login');if(gate&&hidden)gate.style.display='none'};
  function dbOpen(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB||!window.crypto?.subtle){reject(Error('Нет защищённого хранилища'));return}
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>{
        const d=request.result;
        if(!d.objectStoreNames.contains('vault'))d.createObjectStore('vault');
      };
      request.onerror=()=>reject(request.error||Error('База недоступна'));
      request.onsuccess=()=>resolve(request.result);
    });
  }
  function op(db,mode,method,key,value){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('vault',mode);
      const req=tx.objectStore('vault')[method](...(method==='put'?[value,key]:[key]));
      let result;
      req.onsuccess=()=>{result=req.result};
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error||Error('Не удалось сохранить копию'));
      tx.onabort=()=>reject(tx.error||Error('Хранилище недоступно'));
    });
  }
  async function getKey(db){
    let key=await op(db,'readonly','get','key');
    if(!key){
      key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
      await op(db,'readwrite','put','key',key);
    }
    return key;
  }
  function valid(d){
    return d && typeof d==='object' && d.decades && typeof d.decades==='object' &&
      d.months && typeof d.months==='object' && Array.isArray(d.config) &&
      d.settings && typeof d.settings==='object';
  }
  async function loadSnapshot(){
    const db=await dbOpen();
    try{
      const packed=await op(db,'readonly','get','snapshot');
      if(!packed||packed.format!==FRESH_FORMAT||!Number.isFinite(packed.time)||
        packed.time>Date.now()+300000||Date.now()-packed.time>MAX_AGE)return null;
      const key=await op(db,'readonly','get','key');
      if(!key)return null;
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(packed.iv)},
        key,packed.payload);
      const data=JSON.parse(new TextDecoder().decode(plain));
      if(!valid(data))return null;
      snapshot=data;snapshotAt=packed.time;
      return data;
    }finally{db.close()}
  }
  async function saveSnapshot(data){
    if(!valid(data))return;
    const db=await dbOpen();
    try{
      const key=await getKey(db),iv=crypto.getRandomValues(new Uint8Array(12));
      const payload=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,
        new TextEncoder().encode(JSON.stringify(data)));
      if(payload.byteLength>8*1024*1024)return;
      const time=Date.now();
      await op(db,'readwrite','put','snapshot',{format:FRESH_FORMAT,time,iv:[...iv],payload});
      snapshot=data;snapshotAt=time;
    }finally{db.close()}
  }
  async function erase(){
    const db=await dbOpen();
    try{
      await op(db,'readwrite','delete','snapshot');
      await op(db,'readwrite','delete','key');
      snapshot=null;snapshotAt=0;invalidated=true;
    }finally{db.close()}
  }
  function makePanel(){
    if(panel)return panel;
    panel=document.createElement('div');
    panel.id='lfp-device-offline';
    panel.style.cssText='position:fixed;z-index:150;right:12px;bottom:12px;max-width:min(440px,calc(100vw - 24px));background:#fffde9;color:#263342;border:1px solid #e0c98b;border-radius:12px;padding:12px 14px;box-shadow:0 6px 24px #1b2b3c2e;font:13px/1.45 system-ui;display:none';
    panel.innerHTML='<b>Сохранённая копия бюджета</b><div id="lfp-device-offline-time" style="margin:5px 0 8px"></div>'+
       '<button id="lfp-device-refresh" style="background:#277cca;color:white;border:0;border-radius:7px;padding:8px 10px;font:600 13px system-ui;cursor:pointer">Обновить из Google</button> '+
       '<button id="lfp-device-clear" style="background:transparent;border:0;color:#566779;padding:8px;font:13px system-ui;text-decoration:underline;cursor:pointer">Удалить копию</button>';
    document.body.appendChild(panel);
    panel.querySelector('#lfp-device-refresh').addEventListener('click',()=>{
      // The actual Google popup is initiated by its ORIGINAL button with a user gesture.
      panel.style.display='none';
      old.ensureAuth().then(()=>{
        online=true;
        window.LFP_PWA?.retryRead?.();
      }).catch(()=>{displayOffline()});
    });
    panel.querySelector('#lfp-device-clear').addEventListener('click',async()=>{
      if(!confirm('Удалить сохранённые данные бюджета с этого устройства?'))return;
      try{await erase();location.reload()}catch(e){alert('Не удалось удалить копию: '+String(e.message||e))}
    });
    return panel;
  }
  function displayOffline(){
    if(!snapshot||invalidated)return;
    online=false;
    setHidden(true);
    const p=makePanel();
    p.style.display='block';
    const d=new Date(snapshotAt);
    p.querySelector('#lfp-device-offline-time').textContent=
      'Только просмотр · данные на '+d.toLocaleString('ru-RU')+'. Для изменений и синхронизации потребуется вход.';
  }
  function displayOnline(){online=true;if(panel)panel.style.display='none'}
  loading=loadSnapshot().catch(()=>null);
  const enhanced={
    ...old,
    async ensureAuth(){
      await loading;
      if(ready()){displayOnline();return}
      if(snapshot && !invalidated){displayOffline();return}
      await old.ensureAuth();
      displayOnline();
    },
    async run(fn,args){
      // Never silently use an expired Google token, even if an old token string exists.
      if(ready() && online){
        try{
          const d=await old.run(fn,args);
          if(fn==='getAll'&&valid(d)){void saveSnapshot(d).catch(()=>{});displayOnline()}
          return d;
        }catch(e){
          if(fn==='getAll'&&snapshot){displayOffline();return {...snapshot,_lfpLocalStale:true}}
          throw e;
        }
      }
      if(fn==='getAll'&&snapshot&&!invalidated){
        displayOffline();
        return {...snapshot,_lfpLocalStale:true};
      }
      throw Error('Копия бюджета доступна только для просмотра. Для синхронизации и изменений войдите через Google.');
    },
    markLoaded(){old.markLoaded();if(!online)displayOffline()},
    showServerError(message){
      if(snapshot&&!online){displayOffline();return}
      old.showServerError(message);
    },
    async logout(){
      await erase().catch(()=>{});
      return old.logout();
    },
    persistentSession(){return online&&Boolean(old.persistentSession?.())},
    localSnapshotStatus(){return {available:Boolean(snapshot),time:snapshotAt,online}}
  };
  window.LFP_PWA=enhanced;
})();