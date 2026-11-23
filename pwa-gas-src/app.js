/* ЛФП PWA v9.72 — installable frame wrapper for the EXISTING secured Apps Script.
   No OAuth, tokens, financial data or Google Sheets RPC is handled here.
   The protected HtmlService iframe still uses its own google.script.run.
   The /exec URL is a device-only preference, not a credential. */
(function(){
'use strict';
const KEY='lfp-pwa-gas-exec-v1';
const $=id=>document.getElementById(id);
const ui={
  setup:$('setup'),frameWrap:$('frame-wrap'),frame:$('budget-frame'),form:$('url-form'),
  field:$('gas-url'),error:$('setup-error'),state:$('state'),
  menuButton:$('menu-button'),menu:$('menu'),direct:$('direct-btn'),
  directLink:$('direct-link'),reload:$('reload-btn'),change:$('change-btn'),
  note:$('frame-note'),dismiss:$('dismiss-note'),install:$('install-btn'),
  installMenu:$('install-menu-btn')
};
let current='',installEvent=null,noteTimer=null;
function normalise(raw){
  let url;
  try{url=new URL(String(raw||'').trim())}catch(_){throw Error('Нужен полный адрес https://script.google.com/macros/s/…/exec')}
  if(url.protocol!=='https:'||url.hostname!=='script.google.com'
     ||!/^\/macros\/s\/[a-zA-Z0-9_-]{20,}\/exec\/?$/.test(url.pathname)
     ||url.username||url.password){
    throw Error('Вставь адрес нового развёртывания «Веб-приложение», который заканчивается на /exec.');
  }
  // Drop parameters such as ?lfpAuthPreview=1; always load the full working budget.
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
function openDirect(){
  if(!current)return;
  window.open(current,'_blank','noopener,noreferrer');
}
function showSetup(){
  if(noteTimer)clearTimeout(noteTimer);
  ui.frame.removeAttribute('src');ui.frameWrap.hidden=true;ui.menuButton.hidden=true;
  ui.setup.hidden=false;ui.note.hidden=true;setMenu(false);
  if(current)ui.field.value=current;
}
function openBudget(url){
  current=url;showError('');
  ui.field.value=url;
  ui.setup.hidden=true;ui.frameWrap.hidden=false;ui.menuButton.hidden=false;
  ui.directLink.href=url;
  ui.frame.src=url;
  ui.note.hidden=true;setMenu(false);
  if(noteTimer)clearTimeout(noteTimer);
  noteTimer=setTimeout(()=>{if(!ui.frameWrap.hidden)ui.note.hidden=false},11000);
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
  if(current)ui.frame.src=current+(current.includes('?')?'&':'?')+'lfpFrameRefresh='+Date.now();
  setMenu(false);
});
ui.change.addEventListener('click',showSetup);
ui.dismiss.addEventListener('click',()=>ui.note.hidden=true);
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
// Clickjacking defense: do not allow third parties to frame the entire PWA wrapper.
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