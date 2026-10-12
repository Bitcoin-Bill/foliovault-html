// Install additive source files and invoke an additive entry wrapper. Never edit
// EntropyLab's existing source files, algorithms, notebook format or build script.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';
const target=process.argv[2];if(!target)throw Error('Pass a local EntropyLab checkout path');
const root=resolve(target),here=resolve(fileURLToPath(new URL('..',import.meta.url)));
const pin=JSON.parse(readFileSync(join(here,'integration/FOUNDATION.json'),'utf8'));
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();if(head!==pin.entropyCommit)throw Error('Wrong foundation revision');
const original=execFileSync('git',['ls-files','src','scripts','package.json','package-lock.json'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const path of original){const trusted=execFileSync('git',['show',head+':'+path],{cwd:root,maxBuffer:32*1024*1024});if(!trusted.equals(readFileSync(join(root,path))))throw Error('Upstream source changed: '+path);}
for(const name of ['map-native.js','map-document.js','map-addon.js','map-entry.js'])copyFileSync(join(here,'map',name),join(root,'src/js',name));
const source=readFileSync(join(root,'scripts/build.mjs'),'utf8'),needle='entryPoints: [join(SRC, "js/app.js")]';if(!source.includes(needle))throw Error('Unrecognized upstream build');
const notice='/*! Map — an EntropyLab plugin\n'+readFileSync(join(here,'LICENSE'),'utf8')+'\n*/';
const wrapped=source.replace(needle,'entryPoints: [join(SRC, "js/map-entry.js")]').replace('banner: { js: wasmAezNotice }','banner: { js: wasmAezNotice + '+JSON.stringify(notice)+' }');
writeFileSync(join(root,'scripts/build-with-map.mjs'),wrapped);
execFileSync(process.execPath,[join(root,'scripts/build-with-map.mjs')],{cwd:root,stdio:'inherit'});
mkdirSync(join(here,'dist'),{recursive:true});copyFileSync(join(root,'entropylab.html'),join(here,'dist/entropylab-map.html'));
for(const path of original){const trusted=execFileSync('git',['show',head+':'+path],{cwd:root,maxBuffer:32*1024*1024});if(!trusted.equals(readFileSync(join(root,path))))throw Error('Upstream source was modified: '+path);}
console.log('Built optional Map add-on; all existing upstream source files unchanged.');
