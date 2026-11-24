import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=process.argv[2]||'_site';
const source=path.dirname(fileURLToPath(import.meta.url));
const read=f=>fs.readFileSync(path.join(dir,f),'utf8');
const root=read('index.html');
const app=read('app.js');
const sw=read('sw.js');
const shellFiles=[
  'index.html','app.js','sw.js','manifest.webmanifest','favicon-32.png',
  'icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon-180.png'
];
function listFiles(folder,prefix=''){
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
    const name=prefix+entry.name;
    return entry.isDirectory()?listFiles(path.join(folder,entry.name),name+'/'):[name];
  });
}
const expected=['.nojekyll',...shellFiles].sort()
assert.deepEqual(listFiles(dir).sort(),expected,'Publish only the PWA shell and icons');
assert.equal(app,fs.readFileSync(path.join(source,'app.js'),'utf8'));
assert.match(root,/<iframe id="budget-frame"/);
assert.match(root,/<link rel="manifest" href="\.\/manifest\.webmanifest\?v=974">/);
assert.match(app,/const KEY='lfp-pwa-gas-exec-v1'/);
assert.match(app,/localStorage\.getItem\(KEY\)/);
assert.match(app,/localStorage\.setItem\(KEY,url\)/);
assert.doesNotMatch(root,/id="lfp-login"|accounts\.google\.com\/gsi|google\.script\.run/);
for(const [prefix,scope] of [['','/']]){
  const manifest=JSON.parse(read(prefix+'manifest.webmanifest'));
  assert.deepEqual([manifest.id,manifest.start_url,manifest.scope],[scope,scope,scope]);
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(x=>x.sizes==='192x192'));
  assert.ok(manifest.icons.some(x=>x.sizes==='512x512'));
  assert.ok(manifest.icons.some(x=>x.purpose==='maskable'));
  for(const icon of manifest.icons){
    assert.ok(icon.src.startsWith('./'));
    assert.ok(fs.existsSync(path.join(dir,prefix,icon.src)));
  }
}
assert.match(sw,/lfp-gas-iframe-root-v974/);
assert.match(sw,/x\.startsWith\('lfp-shell-'\)/);
assert.match(sw,/KNOWN\.has\(url\.pathname\)/);
assert.doesNotMatch(sw,/fetch\(['"]https:\/\/script\.google\.com|access_token|refresh_token/);
for(const [name,code] of [['app.js',app],['sw.js',sw]]){
  new vm.Script(code,{filename:name});
}
for(const file of shellFiles.filter(name=>name.endsWith('.png'))){
  const original=fs.readFileSync(path.join(source,file));
  assert.deepEqual(fs.readFileSync(path.join(dir,file)),original);
}
console.log('PASS: single installed PWA identity, saved Apps Script URL and original icons preserved; only required assets published');
