// Additive packaging only: verify the pinned host before and after building.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const target=process.argv[2];if(!target)throw Error('Pass a local EntropyLab checkout path');
const root=resolve(target),here=resolve(fileURLToPath(new URL('..',import.meta.url)));
const pin=JSON.parse(readFileSync(join(here,'integration/FOUNDATION.json'),'utf8'));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const head=git('rev-parse','HEAD').trim();if(head!==pin.entropyCommit)throw Error('Wrong foundation revision');
// Includes every pinned host BUILD_INPUTS class, plus all build scripts. Enumerate
// the commit, never the mutable index, which could omit a staged deletion.
const inputs=['src','scripts','assets/favicon.png','manifest.webmanifest','package.json','package-lock.json'];
const original=git('ls-tree','-r','--name-only','-z',head,'--',...inputs).split('\0').filter(Boolean);
const trusted=new Map(original.map(path=>[path,execFileSync('git',['show',head+':'+path],{cwd:root,maxBuffer:32*1024*1024})]));
function verifyHost(){
 if(git('diff','--cached','--name-only',head,'--',...inputs).trim())throw Error('Upstream index differs from pinned foundation');
 for(const [path,bytes] of trusted){
  if(!lstatSync(join(root,path)).isFile()||!bytes.equals(readFileSync(join(root,path))))throw Error('Upstream source changed: '+path);
 }
}
verifyHost();
for(const name of ['journal.js','coders.js'])if(!readFileSync(join(here,'map/upstream',name)).equals(readFileSync(join(root,'src/js',name))))throw Error('Upstream compatibility fixture mismatch: '+name);
const modules=['map-native.js','map-document.js','map-addon.js','map-entry.js'];
for(const name of modules)copyFileSync(join(here,'map',name),join(root,'src/js',name));
const source=readFileSync(join(root,'scripts/build.mjs'),'utf8');
function replaceOnce(text,needle,replacement){if(text.split(needle).length!==2)throw Error('Unrecognized upstream build substitution: '+needle);return text.replace(needle,replacement);}
const notice='/*! Map — an EntropyLab plugin\n'+readFileSync(join(here,'LICENSE'),'utf8')+'\n*/';
let wrapped=replaceOnce(source,'entryPoints: [join(SRC, "js/app.js")]','entryPoints: [join(SRC, "js/map-entry.js")]');
wrapped=replaceOnce(wrapped,'banner: { js: wasmAezNotice }','banner: { js: wasmAezNotice + '+JSON.stringify(notice)+' }');
writeFileSync(join(root,'scripts/build-with-map.mjs'),wrapped);
execFileSync(process.execPath,[join(root,'scripts/build-with-map.mjs')],{cwd:root,stdio:'inherit'});
verifyHost(); // Do not publish a candidate until the post-build check has passed.
const dist=join(here,'dist');mkdirSync(dist,{recursive:true});copyFileSync(join(root,'entropylab.html'),join(dist,'entropylab-map.html'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceFiles=[...modules.map(n=>'map/'+n),'scripts/build-map.mjs','integration/FOUNDATION.json','LICENSE'];
const sourceSha256=Object.fromEntries(sourceFiles.map(path=>[path,hash(readFileSync(join(here,path)))]));
const mapCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:here,encoding:'utf8'}).trim();
const dirty=Boolean(execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:here,encoding:'utf8'}).trim());
const artifactSha256=hash(readFileSync(join(dist,'entropylab-map.html')));
writeFileSync(join(dist,'MAP-BUILD.json'),JSON.stringify({mapCommit,dirty,entropyCommit:head,node:process.version,sourceSha256,artifactSha256},null,2)+'\n');
writeFileSync(join(dist,'MAP-SHA256SUMS.txt'),artifactSha256+'  entropylab-map.html\n');
console.log('Built optional Map add-on; all pinned upstream build inputs unchanged.');
