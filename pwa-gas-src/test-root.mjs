import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const dir=process.argv[2]||'_site';
const read=f=>fs.readFileSync(path.join(dir,f),'utf8');
const root=read('index.html');
const iframe=read('pwa-gas/index.html');
const direct=read('v968-direct/index.html');
const sw=read('sw.js');
const app=read('app.js');
const manifest=JSON.parse(read('manifest.webmanifest'));
const legacy=JSON.parse(read('v968-direct/manifest.webmanifest'));
assert.equal(root,iframe,'Main page must be identical to separately tested iframe launcher');
assert.equal(app,read('pwa-gas/app.js'),'Same safe GAS shell JS must run on both URLs');
assert.match(root,/<iframe id="budget-frame"/);
assert.match(root,/<link rel="manifest" href="\.\/manifest\.webmanifest\?v=969">/);
assert.match(root,/apple-touch-icon/);
assert.match(root,/id="install-btn"/);
assert.doesNotMatch(root,/id="lfp-login"|accounts\.google\.com\/gsi|google\.script\.run/);
assert.deepEqual([manifest.id,manifest.start_url,manifest.scope],['/','/','/']);
assert.equal(manifest.display,'standalone');
assert.ok(manifest.icons.some(x=>x.sizes==='192x192'));
assert.ok(manifest.icons.some(x=>x.sizes==='512x512'));
assert.ok(manifest.icons.some(x=>x.purpose==='maskable'));
assert.match(app,/localStorage\.getItem\(KEY\)/);
assert.match(app,/localStorage\.setItem\(KEY,url\)/);
assert.match(app,/beforeinstallprompt/);
assert.match(app,/https:\/\/script\.google\.com/);
assert.match(app,/window\.open\(current/);
assert.match(sw,/lfp-gas-iframe-root-v969/);
assert.match(sw,/x\.startsWith\('lfp-shell-'\)/);
assert.match(sw,/KNOWN\.has\(url\.pathname\)/);
assert.doesNotMatch(sw,/fetch\(['"]https:\/\/script\.google\.com|caches\.put\(.*financial|access_token|refresh_token/);
for(const [name,code] of [['app.js',app],['sw.js',sw]])new vm.Script(code,{filename:name});
assert.match(direct,/v9\.68 Firebase/);
assert.match(direct,/pwa-bridge\.js\?v=968/);
assert.equal(legacy.display,'standalone');
assert.equal(fs.readdirSync(dir+'/v968-direct/app-parts').filter(s=>s.endsWith('.txt')).length,32);
for(const file of ['budget-app.js','budget.css','config.js','pwa-bridge.js']){
  assert.equal(read(file),read('v968-direct/'+file),'Legacy backup must preserve original '+file);
}
for(const file of ['icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon-180.png']){
  assert.ok(fs.statSync(path.join(dir,file)).size>100);
}
console.log('PASS: main Github / is standalone secure GAS iframe PWA, preserved live original at /v968-direct/, no Google OAuth in shell and no financial caching');
