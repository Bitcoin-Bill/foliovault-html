// Real public artifact; delayed WebCrypto is test instrumentation, not shipping code.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'./browser/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BINARY||undefined,args:['--no-sandbox']});try{
const page=await browser.newPage({acceptDownloads:true});const errors=[],network=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
await page.addInitScript(()=>{const original=SubtleCrypto.prototype.deriveBits;SubtleCrypto.prototype.deriveBits=async function(...args){if(window.auditHoldKdf)await new Promise(resolve=>{window.auditReleaseKdf=resolve;});return original.apply(this,args);};});
await page.goto(require('node:url').pathToFileURL(path.resolve('dist/entropylab-map.html')).href);
await page.click('#beta-disclaimer-accept');const label=await page.locator('#beta-disclaimer-proof-label span:not([hidden])').innerText();await page.fill('#beta-disclaimer-proof',String(['zero','one','two','three','four','five','six','seven','eight','nine'].indexOf(label.match(/number (\w+)/)[1])));await page.click('#beta-disclaimer-confirm');await page.click('#map-addon-tab');await page.click('#map-create');await page.selectOption('#folio-section','1');
await page.locator('[data-folio-path="meta.planName"]').fill('Export snapshot fixture');await page.selectOption('#folio-section','14');await page.fill('#map-password','invented review password');await page.fill('#map-confirm','invented review password');
await page.evaluate(()=>window.auditHoldKdf=true);const download=page.waitForEvent('download');await page.click('#map-backup');await page.waitForFunction(()=>window.auditReleaseKdf);
await page.selectOption('#folio-section','1');await page.locator('[data-folio-path="meta.planName"]').fill('New unsaved edit fixture');await page.evaluate(()=>{window.auditHoldKdf=false;window.auditReleaseKdf();});
const envelope=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
const engine=await import('../map/upstream/journal.js');const keys=await engine.deriveJournalKeys('invented review password');const opened=await engine.openExport(envelope,keys);assert.ok(opened.content.includes('Export snapshot fixture'));assert.ok(!opened.content.includes('New unsaved edit fixture'));
assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),true,'F-01 new edits remain unsaved');
// Through real encrypted import, custom prototype names must remain harmless text.
async function openFixture(plan){const env=await engine.sealExport('notebook',engine.serializeNotebook({pages:[{number:1,name:'Map',notesText:'ENTROPYLAB-MAP/1\n'+JSON.stringify(plan),style:{}}],activePage:0}),keys);await page.click('#map-home');const chooser=page.waitForEvent('filechooser');await page.click('#map-open');await (await chooser).setFiles({name:'invented-map.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(env))});await page.fill('#folio-unlock-password','invented review password');await page.getByRole('button',{name:'Open',exact:true}).click();}
await openFixture({meta:{planName:'<img src="https://audit.invalid" onerror="window.auditXss=1">'},vaults:[{name:'constructor',m:1,n:1,keys:[{locations:'__proto__'}]}],accessRecords:[{kind:'__proto__'}],backupRecords:[{scheme:'toString'}]});
await page.getByRole('button',{name:'Beneficiary View — step-by-step guide',exact:true}).click();assert.equal(await page.locator('#map-heir-panel img').count(),0);assert.equal(await page.evaluate(()=>window.auditXss),undefined);
await page.locator('#folio-card [role=tab]').last().click();await page.locator('[data-map-mode="wizard"]').click();await page.selectOption('#folio-section','13');assert.ok(await page.locator('#folio-card h2').isVisible());
// Aggregate text overrun is rejected without replacing the accepted guide.
await openFixture({meta:{planName:'Accepted fixture'},extra:Array(9).fill('x'.repeat(10000)),ownerNotes:'x'.repeat(9000)});
await page.getByRole('button',{name:'Plan Editor — update and re-encrypt',exact:true}).click();await page.selectOption('#folio-section','1');await page.locator('[data-folio-path="meta.planName"]').fill('y'.repeat(2000));
await page.waitForFunction(()=>document.querySelector('[data-folio-path="meta.planName"]').value==='Accepted fixture');assert.match(await page.locator('#folio-status').innerText(),/Last change was not kept/);
// Over-budget imported files fail before replacing this current guide.
await openFixture({vaults:[{keys:Array.from({length:500},()=>({}))}]});await page.waitForFunction(()=>document.querySelector('#folio-card').textContent.includes('record limit'));await page.click('#map-home');await page.click('#map-resume-current');assert.match(await page.locator('#folio-card').innerText(),/Accepted fixture/);
assert.deepEqual(errors,[]);assert.deepEqual(network,[]);console.log('PASS F-01 real encrypted snapshot race, F-02 custom names/inert markup, F-03 edit rollback/import rejection; Chromium '+browser.version());
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
