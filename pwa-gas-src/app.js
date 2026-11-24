/* ЛФП PWA v9.74 — shell for existing secured Apps Script.
   No OAuth, tokens, financial data, or Google Sheets RPC here.
   The /exec URL is a device-only preference, not a credential. */
(function(){
'use strict';
const KEY='lfp-pwa-gas-exec-v1';
const $=id=>document.getElementById(id);
const ui={
  setup:$('setup'),frameWrap:$('frame-wrap'),frame:$('budget-frame'),form:$('url-form'),
  field:$('gas-url'),error:$('setup-error'),state:$('state'),
  loading:$('frame-loading'),loadingMessage:$('loading-message'),loadingDirect:$('loading-direct'),
  menuButton:$('menu-button'),menu:$('menu'),direct:$('direct-btn'),
  reload:$('reload-btn'),change:$('change-btn'),install:$('install-btn'),
  installMenu:$('install-menu-btn')
};
let current='',installEvent=null,slowTimer=null,releaseTimer=null;
function normalise(raw){
  let url;
  try{url=new URL(String(raw||'').trim())}catch(_){throw Error('Нужен полный адрес https://script.google.com/macros/s/…/exec')}
  if(url.protocol!=='https:'||url.hostname!=='script.google.com'
     ||!/^\/macros\/s\/[a-zA-Z0-9_-]{20,}\/exec\/?$/.test(url.pathname)
     ||url.username||url.password){
    throw Error('Вставь адрес нового развёртывания «Веб-приложение», который заканчивается на /exec.');
  }
  return 'https://script.google.com'+url.pathname.replace(/\/$/,'');
}
function remember(url){
  try{localStorage.setItem(KEY,url);return true}catch(_){return false}
}
function saved(){
  try{return localStorage.getItem(KEY)||''}catch(_){return ''}
}
function showError(message){ui.error.textContent=message}
function setMenu(open){
  ui.menu.hidden=!open;ui.menuButton.setAttribute('aria-expanded',String(open));
}
function clearLoadTimers(){
  if(slowTimer){clearTimeout(slowTimer);slowTimer=null}
  if(releaseTimer){clearTimeout(releaseTimer);releaseTimer=null}
}
function startLoading(url){
  clearLoadTimers();
  ui.loading.hidden=false;
  ui.loadingMessage.textContent='Подключаем Google Apps Script…';
  ui.loadingDirect.href=url;
  ui.loadingDirect.hidden=true;
  slowTimer=setTimeout(()=>{
    if(ui.frameWrap.hidden||ui.loading.hidden)return;
    ui.loadingMessage.textContent='Google загружается дольше обычного. Можно открыть бюджет напрямую.';
    ui.loadingDirect.hidden=false;
  },11000);
}
ui.frame.addEventListener('load',()=>{
  if(ui.frameWrap.hidden)return;
  clearLoadTimers();
  // Only the outer document's load can be detected across Google origins.
  // Keep the cover briefly so a fast iframe load cannot flash a white page.
  releaseTimer=setTimeout(()=>{
    if(!ui.frameWrap.hidden)ui.loading.hidden=true;
  },160);
});
function openDirect(){
  if(!current)return;
  window.open(current,'_blank','noopener,noreferrer');
}
function showSetup(){
  clearLoadTimers();
  ui.frame.removeAttribute('src');
  ui.frameWrap.hidden=true;ui.menuButton.hidden=true;ui.loading.hidden=true;
  ui.setup.hidden=false;setMenu(false);
  if(current)ui.field.value=current;
}
function openBudget(url){
  current=url;showError('');
  ui.field.value=url;
  ui.setup.hidden=true;ui.frameWrap.hidden=false;ui.menuButton.hidden=false;
  setMenu(false);startLoading(url);
  ui.frame.src=url;
}
ui.form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
    const url=normalise(ui.field.value);
    const stored=remember(url);
    if(!stored)ui.state.textContent='Браузер не разрешил сохранить настройку. После закрытия может потребоваться ввести адрес заново.';
    else ui.state.textContent='';
    openBudget(url);
  }catch(e){showError(String(e.message||e));ui.field.focus()}
});
ui.menuButton.addEventListener('click',()=>setMenu(ui.menu.hidden));
ui.direct.addEventListener('click',openDirect);
ui.reload.addEventListener('click',()=>{
  if(current){
    startLoading(current);
    ui.frame.src=current+(current.includes('?')?'&':'?')+'lfpFrameRefresh='+Date.now();
  }
  setMenu(false);
});
ui.change.addEventListener('click',showSetup);
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installEvent=event;
  ui.install.hidden=false;ui.installMenu.hidden=false;
});
async function install(){
  if(!installEvent)return;
  const event=installEvent;installEvent=null;ui.install.hidden=true;ui.installMenu.hidden=true;
  try{await event.prompt();await event.userChoice}catch(e){console.warn('PWA install dialog unavailable:',e)}
}
ui.install.addEventListener('click',install);
ui.installMenu.addEventListener('click',install);
window.addEventListener('appinstalled',()=>{
  installEvent=null;ui.install.hidden=true;ui.installMenu.hidden=true;
  setMenu(false);
});
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>{
    console.warn('Не удалось зарегистрировать Service Worker PWA:',e);
  }));
}
// The whole shell must not be framed by third-party websites.
if(window.top!==window.self){
  showError('PWA должна быть открыта напрямую в браузере.');
  return;
}
const previous=saved();
if(previous){
  try{openBudget(normalise(previous))}
  catch(_){showSetup()}
}else showSetup();
})();