/* Reproducible promotion: exact original Firebase 9.68 -> /v968-direct/,
   existing tested Apps Script iframe PWA -> canonical /.
   Run ONLY on a clean _site artifact after the 48 public files are fetched.
   No Google files, financial data, or OAuth secrets are accessed. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=process.argv[2]||'_site';
const root=f=>path.join(out,f);
const read=f=>fs.readFileSync(root(f),'utf8');
const original=[
  'index.html','budget-app.js','budget.css','config.js','pwa-bridge.js',
  'session-bridge.js','sw.js','manifest.webmanifest','favicon-32.png',
  'icon-192.png','icon-512.png','icon-maskable-512.png',
  'apple-touch-icon.png','apple-touch-icon-180.png','google-check.html','health.html'
];
assert.match(read('index.html'),/v9\.68 Firebase/);
assert.ok(fs.statSync(root('budget-app.js')).size>250000);
assert.ok(fs.statSync(root('budget.css')).size>70000);
const legacy=root('v968-direct');
fs.mkdirSync(path.join(legacy,'app-parts'),{recursive:true});
for(const file of original){
  assert.ok(fs.existsSync(root(file)),'Missing public source file: '+file);
  fs.copyFileSync(root(file),path.join(legacy,file));
}
for(let i=1;i<=32;i++){
  const name=String(i).padStart(2,'0')+'.txt';
  fs.copyFileSync(root('app-parts/'+name),path.join(legacy,'app-parts',name));
}
assert.equal(original.length+32,48);
assert.match(fs.readFileSync(path.join(legacy,'index.html'),'utf8'),/v9\.68 Firebase/);
fs.copyFileSync('pwa-gas-src/index.html',root('index.html'));
fs.copyFileSync('pwa-gas-src/app.js',root('app.js'));
let manifest=JSON.parse(fs.readFileSync('pwa-gas-src/manifest.webmanifest','utf8'));
manifest={...manifest,id:'/',start_url:'/',scope:'/'};
fs.writeFileSync(root('manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
let sw=fs.readFileSync('pwa-gas-src/sw.js','utf8');
function single(oldText,newText){
  assert.equal(sw.split(oldText).length,2,'SW source changed: '+oldText);
  sw=sw.replace(oldText,newText);
}
single("const CACHE='lfp-gas-iframe-shell-v970'","const CACHE='lfp-gas-iframe-root-v970'");
single("x.startsWith('lfp-gas-iframe-shell-')&&x!==CACHE",
       "(x.startsWith('lfp-shell-')||x.startsWith('lfp-gas-iframe-root-'))&&x!==CACHE");
fs.writeFileSync(root('sw.js'),sw);
assert.equal(read('index.html'),read('pwa-gas/index.html'));
assert.equal(read('app.js'),read('pwa-gas/app.js'));
assert.equal(JSON.parse(read('manifest.webmanifest')).id,'/');
console.log('PASS: root GAS iframe PWA promoted; 48 original v9.68 assets preserved at /v968-direct/; root cache migration enabled');
