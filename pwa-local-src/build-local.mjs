// Creates a separate, fully offline PWA from the currently published v9.68.
// Never writes to production root, Google Sheet, Apps Script or ZenMoney.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.argv[2]||'_site';
const source=f=>fs.readFileSync(root+'/'+f,'utf8');
const output=root+'/pwa-local';
fs.mkdirSync(output,{recursive:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('base64');
const knownAppHash='d63v63phIOicv30rasrxqEiMSWXa7Lr89ZmYniPLZ2Y=';
const knownCSSHash='mMujryiW1mtVsMVllJ1STSUQe5G38qR9Iic5PUce59o=';
let js=source('budget-app.js');
const css=source('budget.css');
assert.equal(hash(js),knownAppHash,'v9.68 financial program changed; abort');
assert.equal(hash(css),knownCSSHash,'v9.68 stylesheet changed; abort');
const replaceOnce=(s,a,b)=>{
  assert.equal(s.split(a).length,2,'Missing or duplicate anchor: '+a.slice(0,90));
  return s.replace(a,b);
};
const origBoot="async function boot(){\n  if(window.LFP_PWA){\n    try{await window.LFP_PWA.ensureAuth();useGas();return}\n    catch(e){if(window.LFP_PWA)window.LFP_PWA.showServerError('Не удалось подключиться к Google: '+((e&&e.message)||e));setSync(false,'Вход не выполнен');showNotice('Не удалось подключиться к Google: '+((e&&e.message)||e));return}\n  }\n  showNotice('Не загружен защищённый модуль PWA. Обновите страницу.');\n}";
js=replaceOnce(js,origBoot,"async function boot(){\n  // В этой отдельной версии бюджет хранится только на устройстве.\n  // Google-серверы, облачная синхронизация и OAuth не вызываются.\n  useLocal();\n}");
assert.match(js,/function useLocal\(\)/);
assert.match(js,/localStorage\.getItem\('bdds-data'\)/);
assert.match(js,/store\.write=save;store\.writeSettings=save/);
assert.doesNotMatch(js,/await window\.LFP_PWA\.ensureAuth\(\)/);
let html=source('index.html');
assert.equal(html.split('v9.68 Firebase').length,2);
html=html.replace('v9.68 Firebase','v9.68 · локально');
const gate=/<div id="lfp-login"[\s\S]*?<\/div><\/div>\s*/;
assert.equal((html.match(/id="lfp-login"/g)||[]).length,1);
assert.ok(gate.test(html));
html=html.replace(gate,'');
for(const s of [
 '<script src="./config.js?v=968"></script>',
 '<script src="https://accounts.google.com/gsi/client" async defer></script>',
 '<script src="./pwa-bridge.js?v=968"></script>'
])html=replaceOnce(html,s,'');
const bootstrap=/<script id="lfp-login-bootstrap">[\s\S]*?<\/script>\s*/;
assert.ok(bootstrap.test(html));
html=html.replace(bootstrap,'');
html=replaceOnce(html,
 '<script src="./budget-app.js?v=968" onerror="window.LFP_PWA?.showServerError?.(\'Не удалось загрузить интерфейс бюджета. Обновите страницу.\')"></script>',
 '<script src="./budget-app.js?v=968" onerror="window.__bddsFail?.(\'Не удалось загрузить локальный бюджет v9.68.\')"></script>');
html=replaceOnce(html,'</body>','<script src="./local-controls.js?v=968"></script>\n</body>');
html=html.replace('<!-- PWA v9.53: compact HTML shell, external CSS and app JS for unstable networks -->','<!-- LFP v9.68 local-only installable PWA: no Google account and no cloud sync -->');
html=html.replace('<!-- v9.49: public config runs inline above main styles -->','');
html=html.replace('<!-- Google Identity Services загружается с официального адреса с проверкой onload/onerror -->','');
html=html.replace('<!-- v9.49: login bridge runs inline before main markup -->','');
html=html.replace('<title>Семейный бюджет</title>','<title>ЛФП — локальный семейный бюджет</title>');
html=html.replace('<meta name="theme-color" content="#2f87d0">','<meta name="theme-color" content="#2f87d0">\n<meta name="robots" content="noindex,nofollow">');
assert.doesNotMatch(html,/accounts\.google\.com|gsi\/client|oauthClientId|pwa-bridge\.js|lfp-login|script\.googleapis\.com/);
for(const filename of ['budget.css','favicon-32.png','icon-192.png','icon-512.png',
 'icon-maskable-512.png','apple-touch-icon.png','apple-touch-icon-180.png']){
  fs.copyFileSync(root+'/'+filename,output+'/'+filename);
}
fs.writeFileSync(output+'/budget-app.js',js);
fs.writeFileSync(output+'/index.html',html);
for(const file of ['manifest.webmanifest','sw.js','local-controls.js']){
  fs.copyFileSync('pwa-local-src/'+file,output+'/'+file);
}
const m=JSON.parse(fs.readFileSync(output+'/manifest.webmanifest','utf8'));
assert.equal(m.id,'/pwa-local/');
assert.equal(m.start_url,'/pwa-local/');
assert.equal(m.scope,'/pwa-local/');
assert.equal(m.display,'standalone');
assert.equal((html.match(/<script src="\.\/budget-app\.js/g)||[]).length,1);
console.log('PASS: isolated v9.68 no-Google local PWA, no cloud login, no financial code changes beyond one boot transport, main site unchanged');
