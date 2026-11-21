/* Standalone device-only financial data controls.
   No login, Google OAuth, cookies, remote RPC or network calls.
   Local backup files are unencrypted: keep them private. */
(function(){
'use strict';
const KEY='bdds-data';
const LIMIT=8*1024*1024;
const panel=document.createElement('section');
panel.id='lfp-local-tools';
panel.setAttribute('aria-label','Локальный бюджет');
panel.innerHTML=
  '<div class="lfp-local-heading"><strong>ЛФП · локально</strong>'+
  '<button type="button" id="lfp-local-toggle" aria-expanded="false" aria-controls="lfp-local-body">Копии и установка</button></div>'+
  '<div id="lfp-local-body" hidden>'+
  '<p>Версия v9.68 работает без входа Google. Данные сохраняются только в этом браузере и <strong>не синхронизируются</strong> с Google Таблицей или Дзен-мани.</p>'+
  '<p>Для переноса существующих данных импортируйте файл JSON. При очистке браузера данные могут пропасть — сохраняйте резервные копии.</p>'+
  '<div class="lfp-local-buttons">'+
  '<button type="button" id="lfp-local-install" hidden>Установить приложение</button>'+
  '<button type="button" id="lfp-local-export">Скачать копию JSON</button>'+
  '<label class="lfp-local-import">Загрузить копию JSON<input id="lfp-local-file" type="file" accept=".json,application/json" hidden></label>'+
  '<button type="button" id="lfp-local-clear">Очистить данные устройства</button></div>'+
  '<p id="lfp-local-status" role="status"></p>'+
  '<p><small>Резервный JSON содержит финансовые данные без шифрования. Не отправляйте его посторонним.</small></p></div>';
const style=document.createElement('style');
style.textContent=
 '#lfp-local-tools{position:fixed;z-index:190;bottom:12px;right:12px;max-width:min(410px,calc(100vw - 24px));background:#fff;color:#253446;border:1px solid #b7cade;border-radius:13px;box-shadow:0 6px 24px #13314f36;padding:9px 12px;font:13px/1.45 system-ui,-apple-system,Arial}'+
 '#lfp-local-tools .lfp-local-heading{display:flex;gap:12px;align-items:center;justify-content:space-between}'+
 '#lfp-local-tools button,#lfp-local-tools .lfp-local-import{cursor:pointer;font:600 13px system-ui;border:1px solid #b7cde3;border-radius:8px;background:#edf5fd;color:#165588;padding:8px 9px}'+
 '#lfp-local-tools .lfp-local-heading button{background:#2d84d2;color:#fff}'+
 '#lfp-local-tools .lfp-local-buttons{display:flex;gap:7px;flex-wrap:wrap}'+
 '#lfp-local-tools .lfp-local-import{display:inline-flex;align-items:center}'+
 '#lfp-local-tools #lfp-local-clear{background:#fff3f3;color:#98332e}'+
 '#lfp-local-tools p{margin:10px 0}'+
 '#lfp-local-tools [hidden]{display:none !important}'+
 '@media(max-width:600px){#lfp-local-tools{left:10px;right:10px;max-width:none}}';
document.head.appendChild(style);
document.body.appendChild(panel);
const el=id=>panel.querySelector('#'+id);
const body=el('lfp-local-body'),toggle=el('lfp-local-toggle'),status=el('lfp-local-status');
function message(t,error){status.textContent=String(t);status.style.color=error?'#a22128':'#28654a'}
function exportPayload(data){
  const o=data?.data&&typeof data.data==='object'?data.data:data;
  if(!o||typeof o!=='object')throw Error('В файле нет объекта бюджета');
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const valid=['settings','decades','months','goalMonths'].every(k=>object(o[k]))&&Array.isArray(o.goals)&&
    (Array.isArray(o.config)||o.config===null);
  if(!valid)throw Error('Неверный формат: нужны settings, config, decades, months, goals, goalMonths');
  const safe={settings:o.settings,config:o.config,decades:o.decades,months:o.months,goals:o.goals,goalMonths:o.goalMonths};
  const json=JSON.stringify(safe);
  if(json.length>LIMIT)throw Error('Слишком большой файл для хранения на устройстве');
  return json;
}
toggle.addEventListener('click',()=>{
  body.hidden=!body.hidden;
  toggle.setAttribute('aria-expanded',String(!body.hidden));
});
el('lfp-local-export').addEventListener('click',()=>{
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw){message('Изменений пока нет. Для переноса загрузите JSON с данными бюджета.',true);return}
    const safe=exportPayload(JSON.parse(raw));
    const payload=JSON.stringify({format:'lfp-v968-local',exportedAt:new Date().toISOString(),data:JSON.parse(safe)},null,2);
    const blob=new Blob([payload],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='lfp-budget-local-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    message('Копия сохранена в загрузки устройства.');
  }catch(e){message('Не удалось сохранить копию: '+String(e.message||e),true)}
});
el('lfp-local-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file)return;
  try{
    if(file.size>LIMIT)throw Error('Файл больше 8 МБ');
    const contents=await file.text();
    const safe=exportPayload(JSON.parse(contents));
    if(localStorage.getItem(KEY)&&!confirm('Заменить все локальные данные бюджета данными из файла?'))return;
    localStorage.setItem(KEY,safe);
    message('Бюджет загружен. Перезапускаю локальное приложение.');
    location.reload();
  }catch(e){message('Не удалось загрузить файл: '+String(e.message||e),true)}
});
el('lfp-local-clear').addEventListener('click',()=>{
  if(!confirm('Удалить все локальные финансовые данные из этого браузера? Сначала скачайте резервную копию.'))return;
  try{localStorage.removeItem(KEY);location.reload()}catch(e){message('Не удалось очистить данные: '+String(e.message||e),true)}
});
let pendingInstall=null;
const btn=el('lfp-local-install');
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();pendingInstall=event;btn.hidden=false;body.hidden=false;
  toggle.setAttribute('aria-expanded','true');
});
btn.addEventListener('click',async()=>{
  if(!pendingInstall)return;
  const e=pendingInstall;pendingInstall=null;btn.hidden=true;
  try{await e.prompt();await e.userChoice}catch(err){message('Откройте меню браузера и выберите «Установить приложение».',true)}
});
window.addEventListener('appinstalled',()=>{btn.hidden=true;message('Приложение установлено.')});
const already=Boolean(localStorage.getItem(KEY));
if(!already){
  body.hidden=false;
  toggle.setAttribute('aria-expanded','true');
  message('Пока на устройстве нет сохранённых данных. Загрузите JSON или начните новый бюджет.');
}
window.LFP_LOCAL={format:'lfp-v968-local',readonly:false,cloudSync:false,canImport:true};
})();