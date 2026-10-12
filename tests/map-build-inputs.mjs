// Integration regression. MAP_HOST must be a full pinned checkout with deps.
import {mkdtempSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {execFileSync,spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const host=process.env.MAP_HOST;if(!host)throw Error('Set MAP_HOST for build-input regression');
const root=mkdtempSync(join(tmpdir(),'map-input-regression-'));
execFileSync('git',['clone','--shared',resolve(host),root],{stdio:'ignore'});
symlinkSync(join(resolve(host),'node_modules'),join(root,'node_modules'),'dir');
const builder=resolve('scripts/build-map.mjs');
for(const path of ['manifest.webmanifest','assets/favicon.png','src/js/text-services.js','scripts/build.mjs','package.json','package-lock.json']){
 const original=readFileSync(join(root,path));writeFileSync(join(root,path),Buffer.concat([original,Buffer.from('\n')]));
 const r=spawnSync(process.execPath,[builder,root],{encoding:'utf8'});
 assert.notEqual(r.status,0,'F-04 builder must reject modified '+path);assert.match(r.stderr,/Upstream|foundation/i);
 writeFileSync(join(root,path),original);
}
// A removed index entry must not remove the corresponding verification obligation.
execFileSync('git',['update-index','--force-remove','src/js/text-services.js'],{cwd:root});
let r=spawnSync(process.execPath,[builder,root],{encoding:'utf8'});assert.notEqual(r.status,0,'F-04 staged removal must be rejected');
console.log('PASS all host input classes and staged-removal regression; disposable checkout '+root);
