// Deterministic DOM/event harness for session policy and deferred operations.
// No hooks or test-mode switches are added to the distributed application.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element {
 constructor(tag='div'){this.tagName=tag;this.nodeType=1;this.children=[];this.attrs={};this.handlers={};this.value='';this.hidden=false;this.disabled=false;this.textContent='';this.classList={add(){},remove(){},toggle(){}};}
 setAttribute(k,v){this.attrs[k]=v;if(k==='id')this.id=v;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 set innerHTML(v){this.replaceChildren();} get innerHTML(){return '';}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f);}
 async fire(k){for(const f of this.handlers[k]||[])await f({target:this,preventDefault(){}});}
 querySelectorAll(selector){const out=[];for(const c of this.children){if(!c||!c.children)continue;if(selector==='input,textarea'&&['input','textarea'].includes(c.tagName)||selector==='input[type="password"]'&&c.attrs.type==='password')out.push(c);out.push(...c.querySelectorAll(selector));}return out;}
}
(async()=>{
 const model=await import('../map/map-document.js');
 const roots=Object.fromEntries(['folio-card','folio-concealed','folio-status'].map(id=>[id,new Element()]));
 const walk=(n,id)=>n.id===id?n:n.children.map(c=>c?.children?walk(c,id):null).find(Boolean);
 const doc={createElement:t=>new Element(t),createTextNode:t=>({nodeType:3,textContent:t}),getElementById:id=>roots[id]||Object.values(roots).map(n=>walk(n,id)).find(Boolean)};
 const listeners={};const win={addEventListener:(k,f)=>(listeners[k]??=[]).push(f),scrollTo(){}};
 const ctx=vm.createContext({...model,document:doc,window:win,confirm:()=>true,t:x=>x,console,setTimeout});
 const source=fs.readFileSync(require('node:path').join(__dirname,'../map/map-native.js'),'utf8').replace(/^import .*;\s*$/gm,'').replace(/export /g,'');vm.runInContext(source,ctx);
 const run=s=>vm.runInContext(s,ctx);ctx.bridge={available:()=>true,read:()=>ctx.journalText,store:text=>{ctx.journalText=text;}};
 run('initNativeFolio(bridge)');
 const independent=()=>run("clearFolioSession();S.plan.meta.planName='Independent fixture';S.dirty=true;revealNativeFolio()");
 const journal=()=>{ctx.journalText=run("mapPage({...blankPlan(),meta:{planName:'Journal fixture'}})");run('renderHome()');return doc.getElementById('map-from-journal').fire('click');};
 const snapshot=()=>run('JSON.stringify(S.plan)');
 independent();const before=snapshot();run('lockJournalFolio()');assert.equal(snapshot(),before);assert.equal(roots['folio-card'].hidden,true);run('revealNativeFolio()');assert.equal(snapshot(),before);
 console.log('PASS independent lock conceal/resume');
 await journal();assert.equal(run('S.origin'),'journal');run('lockJournalFolio()');assert.equal(run('S.plan.meta.planName'),'');assert.ok(roots['folio-card'].children.length);console.log('PASS Journal read lock wipe and home');
 run("adoptJournalFolio({...blankPlan(),meta:{planName:'Adopted'}});lockJournalFolio()");assert.equal(run('S.plan.meta.planName'),'');
 independent();run("renderExport(document.getElementById('folio-card'))");await doc.getElementById('map-to-journal').fire('click');run('lockJournalFolio()');assert.equal(run('S.origin'),'independent');assert.equal(run('S.plan.meta.planName'),'Independent fixture');
 await journal();run("S.plan.ownerNotes='Edited';markDirty();lockJournalFolio()");assert.equal(run('S.plan.ownerNotes'),'');console.log('PASS adopt, store without reclassification, no demotion');
 ctx.downloads=[];run('download=(...args)=>downloads.push(args)');
 const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});ctx.pending=promise;return{resolve,reject};};
 const exportStart=()=>{run("document.getElementById('folio-card').replaceChildren();renderExport(document.getElementById('folio-card'));encryptPlan=()=>pending");doc.getElementById('map-password').value='invented password';doc.getElementById('map-confirm').value='invented password';const button=doc.getElementById('map-backup');return{button,done:button.fire('click')};};
 independent();let d=deferred(),e=exportStart();run('lockJournalFolio()');d.resolve({encrypted:'fixture'});await e.done;assert.equal(ctx.downloads.length,1);assert.equal(e.button.disabled,false);
 await journal();d=deferred();e=exportStart();run('lockJournalFolio()');d.resolve({encrypted:'obsolete'});await e.done;assert.equal(ctx.downloads.length,1);assert.equal(e.button.disabled,true);
 independent();d=deferred();e=exportStart();d.reject(Error('Fixture export failure'));await e.done;assert.equal(e.button.disabled,false);
 console.log('PASS independent export crosses lock; wiped export has no download or stale UI; failure re-enables');
 await journal();d=deferred();run('decryptPlan=()=>pending;showDecrypt({})');let password=doc.getElementById('folio-unlock-password');password.value='invented password';let done;
 const findText=(n,t)=>n.children?.find(c=>c.textContent===t)?n:n.children?.map(c=>findText(c,t)).find(Boolean);
 const open=findText(roots['folio-card'],'Open');done=open.fire('click');run('lockJournalFolio()');d.resolve(model.blankPlan());await done;assert.equal(run('S.mode'),'landing');assert.equal(run('S.origin'),'independent');
 console.log('PASS late decrypt discarded after Journal wipe');
 await journal();run('lockJournalFolio()');ctx.journalText=run("mapPage({...blankPlan(),meta:{planName:'Fresh page'}})");run('renderHome()');await doc.getElementById('map-from-journal').fire('click');assert.equal(run('S.plan.meta.planName'),'Fresh page');
 for(const origin of ['independent','journal'])for(const event of ['pagehide','pageshow']){independent();ctx.origin=origin;run('S.origin=origin');const epoch=run('sessionEpoch');for(const f of listeners[event])f({persisted:true});assert.equal(run('S.plan.meta.planName'),'');assert.equal(run('sessionCurrent('+epoch+')'),false);assert.ok(roots['folio-card'].children.length);}
 console.log('PASS fresh Journal read; global pagehide and persisted-pageshow wipe both origins');
 // New guide and file replacement must invalidate previous work and reset provenance.
 await journal();run('renderHome()');await doc.getElementById('map-create').fire('click');assert.equal(run('S.origin'),'independent');
 console.log('PASS new guide starts independent session');
 await journal();d=deferred();run('showDecrypt({})');doc.getElementById('folio-unlock-password').value='invented password';done=findText(roots['folio-card'],'Open').fire('click');d.resolve({...model.blankPlan(),meta:{planName:'File fixture'}});await done;assert.equal(run('S.origin'),'independent');assert.equal(run('S.plan.meta.planName'),'File fixture');
 console.log('PASS encrypted-file replacement starts independent session');
})().catch(e=>{console.error(e);process.exitCode=1;});
