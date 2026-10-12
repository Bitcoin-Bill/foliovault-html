const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync(require('node:path').join(__dirname,'../src/foliovault.html'),'utf8');
const listeners={},fields=[{value:'private fixture'}],app={replaceChildren(){this.cleared=true;}};
const document={querySelectorAll:()=>fields,getElementById:()=>app,createElement:tag=>({attributes:{},setAttribute(k,v){this.attributes[k]=v;}})};
const ctx=vm.createContext({crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,atob,btoa,document,window:{addEventListener:(k,v)=>listeners[k]=v},setTimeout(){},setInterval(){},console});
for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(script.replace(/bootHtmlEdition\(\);\s*$/,''),ctx);
const run=code=>vm.runInContext(code,ctx);
(async()=>{
  assert.throws(()=>run("prepareBrowserPlan({meta:[]})"));
  assert.throws(()=>run("prepareBrowserPlan({vaults:[{m:0,n:3}]})"));
  assert.throws(()=>run("prepareBrowserPlan({heirChecklist:{'1':'yes'}})"));
  assert.throws(()=>run("prepareBrowserPlan(JSON.parse('{\"__proto__\":{\"polluted\":true}}'))"));
  assert.throws(()=>run("b64d('Zh==')"));
  assert.equal(run("typeof networkPresent"),'undefined');
  assert.equal(run("typeof bluetoothAdapterPresent"),'undefined');
  // Large encryption and note round-trip; desktop interoperability is separately tested.
  run("S.plan=blankPlan();S.plan.meta.planName='Invented family';S.plan.heirNotes='n'.repeat(200000);S.plan.heirChecklist={'1':true};S.plan.futureField='preserve me'");
  ctx.envelope=await run("encryptPlan(S.plan,'invented test passphrase')");
  const plan=await run("decryptPlan(envelope,'invented test passphrase')");
  assert.equal(plan.heirNotes.length,200000);assert.equal(plan.heirChecklist['1'],true);assert.equal(plan.futureField,'preserve me');
  await assert.rejects(run("decryptPlan(envelope,'wrong credential')"));
  ctx.envelope.data=ctx.envelope.data.slice(0,-4)+'AAAA';
  await assert.rejects(run("decryptPlan(envelope,'invented test passphrase')"));
  const field=run("el('input',{type:'password'})");assert.equal(field.attributes.autocomplete,'off');assert.equal(field.attributes['data-gramm'],'false');assert.equal(field.attributes.translate,'no');
  run("let prior=sessionEpoch;clearFolioSession();if(sessionCurrent(prior))throw Error('stale operation survived')");
  assert.equal(fields[0].value,'');assert(app.cleared);assert.equal(run("S.plan.heirNotes"),undefined);
  console.log('PASS: HTML crypto/large-file round trip, notes/progress, tamper/wrong password, schema rejection, privacy opt-outs, clear-session epoch, no network/Bluetooth gate');
})().catch(e=>{console.error(e);process.exitCode=1});
