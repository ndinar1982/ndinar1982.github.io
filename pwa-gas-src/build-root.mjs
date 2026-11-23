/* Build the installed Apps Script PWA at / and /pwa-gas/ from local assets. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const out=path.resolve(process.argv[2]||'_site');
const outputPrefix=out.endsWith(path.sep)?out:out+path.sep;
assert.ok(out!==source&&!source.startsWith(outputPrefix),'Output must not contain source files');
const files=[
  'index.html','app.js','sw.js','manifest.webmanifest','favicon-32.png',
  'icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon-180.png'
];
for(const file of files)assert.ok(fs.existsSync(path.join(source,file)),'Missing PWA asset: '+file);
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,'pwa-gas'),{recursive:true});
for(const file of files){
  fs.copyFileSync(path.join(source,file),path.join(out,file));
  fs.copyFileSync(path.join(source,file),path.join(out,'pwa-gas',file));
}
const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.webmanifest'),'utf8'));
fs.writeFileSync(path.join(out,'manifest.webmanifest'),
  JSON.stringify({...manifest,id:'/',start_url:'/',scope:'/'},null,2)+'\n');
let sw=fs.readFileSync(path.join(source,'sw.js'),'utf8');
function single(oldText,newText){
  assert.equal(sw.split(oldText).length,2,'Unexpected service worker source: '+oldText);
  sw=sw.replace(oldText,newText);
}
single("const CACHE='lfp-gas-iframe-shell-v971'","const CACHE='lfp-gas-iframe-root-v971'");
single("x.startsWith('lfp-gas-iframe-shell-')&&x!==CACHE",
       "(x.startsWith('lfp-shell-')||x.startsWith('lfp-gas-iframe-root-'))&&x!==CACHE");
fs.writeFileSync(path.join(out,'sw.js'),sw);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('PASS: installed PWA built at / and /pwa-gas/ from local assets');
