import {execFileSync} from 'node:child_process';import {readFileSync,mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
const host=process.env.MAP_HOST;if(!host)throw Error('Set MAP_HOST to a full pinned EntropyLab checkout');
const env={...process.env,PLAYWRIGHT_MODULE:process.env.PLAYWRIGHT_MODULE||resolve('tests/browser/node_modules/playwright')};
const run=(file,args=[],options={})=>execFileSync(process.execPath,[file,...args],{stdio:'inherit',env,...options});
run('tests/map-build-inputs.mjs');
run('scripts/build-map.mjs',[host]);run('scripts/verify-map.mjs');const first=readFileSync('dist/entropylab-map.html');
run('scripts/build-map.mjs',[host]);if(!first.equals(readFileSync('dist/entropylab-map.html')))throw Error('Map build is not reproducible');
run('scripts/verify-map.mjs');
run('tests/map-navigation-browser.cjs');run('tests/map-security-browser.cjs');
const qa=mkdtempSync(join(tmpdir(),'map-journal-qa-'));
run(join(resolve(host),'scripts/build-with-map.mjs'),['--test-hooks','--out',qa],{cwd:resolve(host)});
run('tests/map-session-browser.cjs',[],{env:{...env,MAP_QA_HTML:join(qa,'entropylab.html')}});
// QA build never replaces the public candidate. Verify that exact tested file again.
if(!first.equals(readFileSync('dist/entropylab-map.html')))throw Error('QA altered public candidate');
run('scripts/verify-map.mjs');console.log('PASS integrated public and separate Journal QA build/browser checks');
