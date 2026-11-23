/* Build only the root PWA at /. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const out=path.resolve(process.argv[2]||'_site');
const outputPrefix=out.endsWith(path.sep)?out:out+path.sep;
assert.ok(out!==source&&!source.startsWith(outputPrefix),'Output must not contain source files');
const files=['index.html','app.js','sw.js','manifest.webmanifest','favicon-32.png','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon-180.png'];
for(const file of files)assert.ok(fs.existsSync(path.join(source,file)),'Missing PWA asset: '+file);
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(source,file),path.join(out,file));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('PASS: only root PWA built');
