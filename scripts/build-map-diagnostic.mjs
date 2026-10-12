// Separate QA-only typing diagnostic. No host test hooks or Journal activation.
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const here=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [hostArg,outArg]=process.argv.slice(2);
if(!hostArg||!outArg)throw Error('Usage: node scripts/build-map-diagnostic.mjs HOST QA_OUTPUT_DIRECTORY');
const host=resolve(hostArg),out=resolve(outArg);
if(out===host||out===join(here,'dist'))throw Error('Use a separate QA directory');
execFileSync(process.execPath,[join(here,'scripts/build-map.mjs'),host],{stdio:'inherit'});
const entry=join(host,'src/js/map-entry.js'),original=readFileSync(entry);
copyFileSync(join(here,'tests/safari-focus-diagnostic.js'),join(host,'src/js/map-focus-diagnostic.js'));
try{
 writeFileSync(entry,original.toString()+"\nimport './map-focus-diagnostic.js';\n");
 execFileSync(process.execPath,[join(host,'scripts/build-with-map.mjs'),'--out',out],{cwd:host,stdio:'inherit'});
}finally{writeFileSync(entry,original);}
