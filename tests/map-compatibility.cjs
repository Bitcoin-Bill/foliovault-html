const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto,pbkdf2Sync,createCipheriv}=require('node:crypto');
(async()=>{
 const engine=await import('../map/upstream/journal.js');
 const model=await import('../map/map-document.js');
 const source=fs.readFileSync(require('node:path').join(__dirname,'../map/map-native.js'),'utf8').replace(/^import .*;\s*$/gm,'').replace(/export /g,'');
 const ctx=vm.createContext({...engine,...model,crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,atob,btoa,window:{addEventListener(){}},document:{},t:x=>x,console,setTimeout});vm.runInContext(source,ctx);
 const run=code=>vm.runInContext(code,ctx);
 run("S.plan=blankPlan();S.plan.meta.planName='Map fixture';S.plan.heirNotes='Called invented trustee';S.plan.ownerNotes='◆◆ Fixture [abcdef12]\u2063';S.plan.heirChecklist={'1':true};S.plan.accessRecords=[{kind:'EntropyLab journal',mode:'Hint only',hint:'Ask the helper'}]");
 const backup=await run("encryptPlan(S.plan,'map compatibility password')");
 const keys=await engine.deriveJournalKeys('map compatibility password');
 const opened=await engine.openExport(backup,keys);assert.equal(opened.kind,'notebook');
 const journal=engine.parseNotebook(opened.content);assert.equal(journal.pages[0].name,'Map');
 const payload=JSON.parse(journal.notesText.slice('ENTROPYLAB-MAP/1\n'.length));assert.equal(payload.meta.planName,'Map fixture');assert.equal(payload.heirChecklist['1'],true);
 // Unmodified Journal can re-export the notebook and Map can reopen it.
 ctx.backup=await engine.sealExport('notebook',engine.serializeNotebook(journal),keys);
 const restored=await run("decryptPlan(backup,'map compatibility password')");assert.equal(restored.heirNotes,'Called invented trustee');assert.equal(restored.ownerNotes,'◆◆ Fixture [abcdef12]\u2063');
 await assert.rejects(run("decryptPlan(backup,'wrong')"));await assert.rejects(run("encryptPlan(S.plan,'short')"));
 ctx.backup.ciphertext='00'+ctx.backup.ciphertext.slice(2);await assert.rejects(run("decryptPlan(backup,'map compatibility password')"));
 assert.throws(()=>run("readMapPage('ordinary journal note')"));assert.throws(()=>run("mapPage({...blankPlan(),ownerNotes:'x'.repeat(1000000)})"));
 // Independently produced legacy v1 file, fixed fixture bytes only.
 const salt=Buffer.alloc(16,1),iv=Buffer.alloc(12,2),password='legacy test password';const key=pbkdf2Sync(password,salt,600000,32,'sha256');const cipher=createCipheriv('aes-256-gcm',key,iv);const ct=Buffer.concat([cipher.update(JSON.stringify({meta:{planName:'Legacy fixture'}})),cipher.final(),cipher.getAuthTag()]);
 ctx.legacy={magic:'VAULTFOLIO/1',kdf:{name:'PBKDF2',hash:'SHA-256',iterations:600000,salt:salt.toString('base64')},cipher:{name:'AES-256-GCM',iv:iv.toString('base64')},data:ct.toString('base64')};
 assert.equal((await run("decryptPlan(legacy,'legacy test password')")).meta.planName,'Legacy fixture');
 console.log('PASS: Map backup -> unchanged Journal loader -> Journal encrypted re-export -> Map; notes/checklist; wrong/short password, tamper, ordinary notebook rejection, size limit, legacy v1 import');
})().catch(error=>{console.error(error);process.exitCode=1;});
