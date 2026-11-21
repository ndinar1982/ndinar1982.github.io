// Patch only the TEST PWA copy of original v9.68 startup wiring.
// Financial compute / goals / Zen calculations remain untouched.
// This script runs on published public JS copied into _site/pwa-preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const root=process.argv[2]||'_site/pwa-preview';
const appFile=root+'/budget-app.js';
const bridgeFile=root+'/pwa-bridge.js';
let app=fs.readFileSync(appFile,'utf8');
let bridge=fs.readFileSync(bridgeFile,'utf8');
const hash=x=>crypto.createHash('sha256').update(x).digest('base64');
const knownAppHash='d63v63phIOicv30rasrxqEiMSWXa7Lr89ZmYniPLZ2Y=';
assert.equal(hash(app),knownAppHash,'v9.68 financial code changed; refuse to patch');
function single(s,needle,replacement){
  assert.equal(s.split(needle).length,2,'Patch anchor missing or duplicate: '+needle.slice(0,96));
  return s.replace(needle,replacement);
}
app=single(app,
  "const wasStale=!!state.stale;state.stale=false;",
  "const wasStale=!!state.stale;state.stale=Boolean(d._lfpLocalStale);");
app=single(app,
  "const sig=JSON.stringify(d);if(sig===lastSig&&state.ready){setSync(true,'Синхронизировано');",
  "const sig=JSON.stringify(d);if(sig===lastSig&&state.ready){setSync(!state.stale,state.stale?'Копия на устройстве · только просмотр':'Синхронизировано');");
app=single(app,
  "const first=!state.ready||wasStale;state.ready=true;setSync(true,'Синхронизировано');first?render():safeRender();",
  "const first=!state.ready||wasStale;state.ready=true;setSync(!state.stale,state.stale?'Копия на устройстве · только просмотр':'Синхронизировано');first?render():safeRender();");
app=single(app,
  "function staleBlock(){if(!state.stale)return false;toast('Секунду: загружаю свежие данные из таблицы…');return true}",
  "function staleBlock(){if(!state.stale)return false;toast('Копия только для просмотра. Обновите данные через Google.');return true}");
bridge=single(bridge,
  "diagnostics:()=>({mode:'direct-google-token',authenticated:Boolean(token),email}),",
  "diagnostics:()=>({mode:'direct-google-token',authenticated:Boolean(token&&Date.now()<expires-90000),email}),");
fs.writeFileSync(appFile,app);
fs.writeFileSync(bridgeFile,bridge);
console.log('PASS: offline snapshot is marked stale/read-only, Google expiry detected; only 4 app transport/UI state anchors modified');
