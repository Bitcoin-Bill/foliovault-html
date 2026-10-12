// Optional real-browser regression: MAP_BROWSER=webkit or chromium; MAP_HTML; CHROMIUM_BINARY.
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{const b=await (process.env.MAP_BROWSER==='webkit'?webkit.launch():chromium.launch({executablePath:process.env.CHROMIUM_BINARY||'/tmp/folio-chromium/chromium',args:['--no-sandbox']}));
 const p=await b.newPage();
 const errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await p.goto(require('node:url').pathToFileURL(process.env.MAP_HTML||require('node:path').resolve(__dirname,'../dist/entropylab-map.html')).href);
 await p.click('#beta-disclaimer-accept');
 const label=await p.locator('#beta-disclaimer-proof-label span:not([hidden])').innerText();
 await p.fill('#beta-disclaimer-proof',String(['zero','one','two','three','four','five','six','seven','eight','nine'].indexOf(label.match(/number (\w+)/)[1])));
 await p.click('#beta-disclaimer-confirm');
 await p.click('#map-addon-tab');
 await p.click('#map-create');
 await p.locator('#folio-section').selectOption('2');
 const assert=require('node:assert/strict');
for(const field of await p.locator('#folio-card input[type=text]').all()){
 await field.click();
 await p.keyboard.type('Alex Test',{delay:130});
 await p.waitForTimeout(1200);
 await p.keyboard.type(' continued',{delay:80});assert.equal(await field.inputValue(),'Alex Test continued');assert.equal(await field.evaluate(e=>document.activeElement===e),true);
}
console.log('PASS sustained typing and pause/resume without another click');
await p.click('#map-home');
 await p.click('#map-resume-current');
 await p.getByRole('button',{name:'Beneficiary View — step-by-step guide',exact:true}).click();
const tabs=p.locator('#folio-card [role=tab]');
 const count=await tabs.count();assert.ok(count>5);
await p.fill('#folio-heir-notes','Invented notes remain');
 await p.locator('[data-folio-check="1"]').check();
 await p.evaluate(()=>window.notesNode=document.querySelector('#folio-heir-notes'));
for(let i=0;i<count;i++){await tabs.nth(i).click();assert.equal(await tabs.nth(i).getAttribute('aria-selected'),'true');assert.equal(await p.locator('#folio-heir-notes').inputValue(),'Invented notes remain');assert.equal(await p.evaluate(()=>notesNode===document.querySelector('#folio-heir-notes')),true);}
await tabs.nth(0).click();assert.equal(await p.locator('[data-folio-check="1"]').isChecked(),true);
await tabs.nth(0).focus();
 await p.keyboard.press('End');assert.equal(await tabs.last().getAttribute('aria-selected'),'true');
 await p.keyboard.press('Home');assert.equal(await tabs.first().getAttribute('aria-selected'),'true');
 await p.keyboard.press('ArrowRight');assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
await p.locator('[data-folio-reveal]').check();
 await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await p.getByRole('button',{name:'Resume Map',exact:true}).click();assert.equal(await p.locator('[data-folio-reveal]').isChecked(),false);assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');assert.equal(await p.locator('#folio-heir-notes').inputValue(),'Invented notes remain');
// Switching views preserves the same guide, per-view position and private progress.
await p.locator('[data-map-mode="wizard"]').click();
assert.equal(await p.locator('#folio-section').inputValue(),'2');
assert.equal(await p.locator('#folio-card input[type=text]').first().inputValue(),'Alex Test continued');
await p.locator('[data-map-mode="heir"]').click();
assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
assert.equal(await p.locator('#folio-heir-notes').inputValue(),'Invented notes remain');
await tabs.first().click();assert.equal(await p.locator('[data-folio-check="1"]').isChecked(),true);
await p.locator('[data-folio-reveal]').check();
await p.locator('[data-map-mode="wizard"]').click();
await p.locator('[data-map-mode="heir"]').click();
assert.equal(await p.locator('[data-folio-reveal]').isChecked(),false);
console.log('PASS Editor/Heir switch preserves fields, section, notes and checks, and remasks');
for(const width of [1280,390]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(process.env.MAP_SCREENSHOTS)await p.screenshot({path:process.env.MAP_SCREENSHOTS+'/heir-'+width+'.png',fullPage:true});}
assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);if(process.env.MAP_DIAGNOSTIC){const log=await p.getByRole('textbox',{name:'Focus diagnostic log'}).inputValue();assert.doesNotMatch(log,/Alex Test|Invented notes/);assert.match(log,/document focus=/);}
console.log('PASS visible section navigation, keyboard, stable notes, checklist, conceal/remask and responsive widths; '+b.version());
 await b.close()})().catch(e=>{console.error(e);process.exit(1)});
