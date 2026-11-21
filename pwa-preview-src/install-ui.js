/* LFP PWA installation UX only. No finance, OAuth or data access. */
(function(){
  'use strict';
  if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true) return;
  let promptEvent=null;
  const panel=document.createElement('aside');
  panel.id='lfp-install-panel';
  panel.setAttribute('aria-label','Установка семейного бюджета');
  panel.innerHTML='<span class="lfp-install-head">ЛФП · тест установки</span>'
    +'<button type="button" id="lfp-install-now" hidden>Установить приложение</button>'
    +'<a href="./install-help.html" target="_blank" rel="noopener">Как установить</a>'
    +'<button type="button" id="lfp-install-close" aria-label="Закрыть">×</button>';
  const css=document.createElement('style');
  css.textContent='#lfp-install-panel{position:fixed;right:12px;bottom:12px;z-index:190;max-width:min(360px,calc(100vw - 24px));display:flex;align-items:center;flex-wrap:wrap;gap:8px;border:1px solid #cbd8e8;background:rgba(255,255,255,.97);border-radius:12px;padding:11px 13px;box-shadow:0 6px 20px #17314e25;font:13px/1.35 system-ui;color:#1b3249}'
    +'#lfp-install-panel .lfp-install-head{font-weight:700;margin-right:auto}'
    +'#lfp-install-panel button#lfp-install-now{background:#237ed0;color:#fff;border:0;border-radius:8px;padding:7px 10px;font:600 13px system-ui;cursor:pointer}'
    +'#lfp-install-panel button#lfp-install-now[hidden]{display:none}'
    +'#lfp-install-panel a{color:#1468aa;text-decoration:underline}'
    +'#lfp-install-panel button#lfp-install-close{background:transparent;color:#586775;border:0;font:22px system-ui;padding:0 3px;cursor:pointer}';
  document.head.appendChild(css);
  document.body.appendChild(panel);
  const installBtn=panel.querySelector('#lfp-install-now');
  const closeBtn=panel.querySelector('#lfp-install-close');
  closeBtn.addEventListener('click',()=>panel.remove());
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    promptEvent=e;
    installBtn.hidden=false;
  });
  installBtn.addEventListener('click',async()=>{
    if(!promptEvent)return;
    const e=promptEvent;promptEvent=null;installBtn.hidden=true;
    try{await e.prompt();await e.userChoice;}catch(_){}
  });
  window.addEventListener('appinstalled',()=>panel.remove());
})();
