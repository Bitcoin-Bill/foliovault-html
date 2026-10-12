import {blankPlan,prepareBrowserPlan} from './map-document.js';
import {deriveJournalKeys,sealExport,openExport,parseFile,wipeBytes,serializeNotebook,parseNotebook} from './journal.js';
import {t} from './i18n.js';

'use strict';
/* =====================================================================
   VAULT FOLIO
   An offline plan-authoring tool. It documents HOW a cold storage setup
   was built and HOW heirs recover it. It never touches keys, seeds,
   xprvs, or xpubs-by-value — it stores the map, not the treasure.
   ===================================================================== */

/* ---------------- state ---------------- */
let sessionEpoch=0;
let journalBridge=null;
function syncGuide(){}
function clearFolioSession(){
  sessionEpoch++;
  (document.getElementById('folio-card')?.querySelectorAll('input,textarea')||[]).forEach(field=>{field.value='';});
  S.plan=blankPlan();S.dirty=false;S.mode='landing';S.origin='independent';
  toast('');
  document.getElementById('folio-card')?.replaceChildren();
  concealHeir=()=>{};
}
function sessionCurrent(epoch){return epoch===sessionEpoch;}

const S = {
  mode: 'landing',          // landing | wizard | review | export | heir
  step: 0,
  plan: blankPlan(),
  dirty: false,
  origin: 'independent', // Session provenance only; never serialized in the guide.
};

// key: {label, device, generation, media, locations, passphrase}

const TIERS = ['Deep vault (no timelock)','Family vault (timelocked decay allowed)','Spending / liquidity wallet','Collaborative custody slice'];
const SCRIPTS = ['P2WSH — wsh(sortedmulti(...))','Taproot / Miniscript (Liana-style leaves)','Single-signature (one key)','Not sure yet'];
const COORDS = ['Bitcoin Core (Yeti-style)','Sparrow Wallet','Nunchuk','Liana','Casa','Unchained','Specter','Electrum','Caravan','Other / undecided'];
const DEVICES = ['SeedSigner (stateless QR)','Krux (stateless QR)','Jade (stateless mode)','BitBox02-class (secure element)','Air-gapped laptop + Bitcoin Core','COLDCARD (see warning)','Trezor / other','Undecided',"COLDCARD Q / Mk4","Trezor","Ledger","BitBox02","Foundation Passport","Keystone","Jade","SeedSigner","Krux","Specter DIY","TAPSIGNER","Air-gapped Bitcoin Core","Other / custom"];
const GENMETHODS = ['Dice / coins / cards + offline calculator (EntropyLab)','Device RNG (device-generated)','Bitcoin Core wallet generation','Imported existing seed','Undecided'];
const MEDIA = ['Steel / metal plate','Paper (NATO-phonetic, checksum)','Paper QR (SeedQR)','Archival optical disc + printed paper','Encrypted digital file','Hardware device only (no separate backup)'];
const PASSPHRASE = ['None — explicit record of that','Stored at a separate site','Sealed copy held by trustee','Memory only (dangerous)','Undecided'];
const MECHANISMS = [
  'Distributed keys — heirs reach a quorum via trustee/executor after death',
  'On-chain timelock decay — recovery path opens after inactivity (Liana/Nunchuk style)',
  'Collaborative custody inheritance program (Casa/Unchained/Nunchuk assisted)',
  'Letter + executor only (simple, single-sig or small amounts)',
  'Combination of the above',
  'Not decided yet'
];
const RITUAL = [
  ['qr','PSBT crosses the air gap by QR code (UR / animated)'],
  ['verify2','PSBT decoded on a second, independent tool before signing'],
  ['three','Three displays agree before signing: coordinator, second watch-only device, signer'],
  ['change','Change outputs confirmed to belong to the wallet'],
  ['small','Small test transaction before any large spend'],
  ['never2','Never two quorum seeds loaded on one signer in one session'],
];

/* ---------------- persistence-free by design ---------------- */
window.addEventListener('beforeunload', e=>{ if(S.dirty){ e.preventDefault(); e.returnValue=''; } });

/* ---------------- tiny dom helpers ---------------- */
const el = (tag, attrs={}, ...kids)=>{
  const n=document.createElement(tag);
  if(['input','textarea','select'].includes(tag)){
    for(const [key,value] of Object.entries({autocomplete:'off',spellcheck:'false',autocorrect:'off',autocapitalize:'off',translate:'no','data-gramm':'false','data-gramm_editor':'false','data-enable-grammarly':'false','data-1p-ignore':'','data-lpignore':'true','data-bwignore':'','data-form-type':'other'})) n.setAttribute(key,value);
  }
  for(const [k,v] of Object.entries(attrs)){
    if(k==='style') continue;
    if(k==='class'){
      const mapping={'btn ghost':'btn secondary','btn':'btn primary','field':'tool-section','hint':'field-note','small muted':'muted','step-intro':'label-description','note warn':'edge-note is-private','note':'edge-note is-info','btn-row':'row tool-actions','wiz-nav':'row tool-actions','wiz-pos':'muted','folio':'label','ledger':'data-table','key-card':'tool-section','repeater-item':'tool-section','heir-banner':'tool-section','check-row':'switch-row','keys-list':'tool-section','pass-meter':'progress','prog':'field-note','rep-item':'tool-section','rep-head':'row tool-actions','rep-body':'tool-section','rep-add':'btn secondary','rm':'btn red','nested':'tool-section','t':'label','mode':'tool-section','modes':'tool-section'};
      n.className=mapping[v]||v;
    }
    else if(k.startsWith('on')) n.addEventListener(k.slice(2),v);
    else n.setAttribute(k,v);
  }
  for(const kid of kids){ if(kid==null) continue; n.append(kid.nodeType?kid:document.createTextNode(kid)); }
  return n;
};
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){const status=document.getElementById('folio-status');if(status)status.textContent=msg;}
function markDirty(){ S.dirty=true;syncGuide(); }

/* ---------------- network honesty ---------------- */



'use strict';
/* =====================================================================
   PART 2 — WIZARD: step schema + rendering engine
   ===================================================================== */

const STEPS = [
  {
    id:'start', folio:'Map · 00 · Before anything', title:'Read this first',
    custom:'start',
  },
  {
    id:'identity', folio:'Map · 01 · The plan', title:'Plan & owner',
    intro:'Name this plan and its owner. This document is the brain of your cold storage setup — it describes the structure so the right people can rebuild or recover it. It must never contain seed words, private keys, or xpubs-by-value.',
    fields:[
      {k:'planName', path:'meta.planName', label:'Plan name', ph:'e.g. “Family Bitcoin Custody Plan — 2026”', hint:'Something your executor would recognize.'},
      {k:'owner', path:'meta.owner', label:'Owner', ph:'Your name', hint:'The person this plan protects the family of.'},
      {k:'created', path:'meta.created', label:'Date prepared', type:'date'},
      {k:'jurisdiction', path:'meta.jurisdiction', label:'Jurisdiction / legal context', ph:'e.g. Oregon, USA — revocable living trust in place', hint:'Country/state, and whether a will or trust references this plan. The will should point to this file — it should never contain seeds or hiding places.'},
      {k:'legalNotes', path:'meta.legalNotes', label:'Legal notes (optional)', type:'textarea', ph:'Trust name, attorney, probate considerations, cross-border issues…'},
    ],
  },
  {
    id:'people', folio:'Map · 02 · The people', title:'Executors, trustees, heirs',
    intro:'Who must be able to act when you cannot? Separate technical assistance from financial control: a helper can guide recovery without holding any key.',
    fields:[
      {k:'executor', path:'people.executor', label:'Executor / next of kin', ph:'Name — who legally settles the estate', hint:'This person finds the plan and starts the process. They do not need to be technical.'},
      {k:'trustee', path:'people.trustee', label:'Trustee / guardian of the map', ph:'Name — who holds sealed instructions', hint:'Ideally holds the location map and (optionally) one delayed/recovery key, sealed — never a live quorum.'},
      {k:'helper', path:'people.helper', label:'Bitcoin-competent helper', ph:'Name — a technical person who holds NO keys', hint:'Someone who can verify software and walk the family through recovery. If they hold no key, their compromise cannot spend. Write in the runbook: nobody legitimate will ever email or call to “validate the wallet.”'},
    ],
    repeater:{
      path:'people.heirs', label:'Heirs / beneficiaries', addLabel:'Add an heir',
      itemTitle:(it,i)=>it.name||('Heir '+(i+1)),
      fields:[
        {k:'name', label:'Name', ph:'Full name'},
        {k:'relation', label:'Relationship', ph:'e.g. spouse, daughter, brother'},
        {k:'role', label:'Role in recovery', ph:'e.g. holds delayed-path key B (sealed, with attorney)'},
        {k:'holdsKeyNow', label:'Do they hold any spending-capable key today?', type:'select', options:['No','Yes — intentional co-signer','Yes — inheritance key, not usable yet'], hint:'The default answer should be No. An heir holding a live key now can be targeted or coerced — decide this on purpose, never by drift.'},
        {k:'contact', label:'How they are reached / found', ph:'e.g. attorney contact in trust binder'},
      ],
    },
  },
  {
    id:'vaults', folio:'Map · 03 · The vaults', title:'Vault architecture & keys',
    intro:'Document each vault (most people have one or two: a deep vault and optionally a smaller family vault). For each vault, record the quorum and every key — its signer, how it was born, and where its backups live. Locations are the access control: no single place should ever hold a full quorum.',
    custom:'vaults',
  },
  {
    id:'signing', folio:'Map · 04 · Signing', title:'How spending works',
    intro:'Record how a transaction is actually signed in your setup, so a helper can reproduce it years from now. The signer is a disposable tool — the procedure is what must survive.',
    fields:[
      {k:'medium', path:'signing.medium', label:'How does the unsigned PSBT cross the air gap?', type:'select', options:['QR codes (UR / animated)','SD card','USB stick (last resort)','Not decided'], hint:'QR is slower than a cable — that is the point. USB is a tunnel.'},
      {k:'verifyRitual', path:'signing.verifyRitual', label:'Verification ritual — which checks are part of every spend?', type:'checkboxes', options:RITUAL.map(r=>r[1]), values:RITUAL.map(r=>r[0])},
      {k:'testSpend', path:'signing.testSpend', label:'Has a full test spend been completed with this setup?', type:'select', options:['Yes — small amount, full cycle, verified','Yes — but not since last software upgrade','Not yet (plan incomplete until done)'], hint:'A test spend is part of the setup, not a demonstration. After any major coordinator upgrade, round-trip a small PSBT again.'},
      {k:'coordinatorNotes', path:'signing.coordinatorNotes', label:'Signing procedure notes', type:'textarea', ph:'Which machine builds the PSBT, which devices sign, in what order, what software versions were tested…'},
    ],
  },
  {
    id:'backups', folio:'Map · 05 · The map', title:'Descriptor & configuration backups',
    intro:'Seeds rebuild keys. They do not rebuild the wallet. The output descriptor — script type, cosigner xpubs, threshold, timelocks — is the map, and multisig seeds without it do not reconstruct anything. Store the map widely; it is privacy-sensitive but not a spending secret.',
    repeater:{
      path:'backups.descriptorLocations', label:'Descriptor / wallet-configuration copies', addLabel:'Add a copy location',
      itemTitle:(it,i)=>it.where||('Copy '+(i+1)),
      fields:[
        {k:'where', label:'Where this copy lives', ph:'e.g. with each steel plate; trust binder; watch-only node; safe deposit box'},
        {k:'format', label:'Format', type:'select', options:['Printed paper','Plaintext digital file','Encrypted digital file','Wallet descriptor export (BSMS / Core / Sparrow)']},
      ],
      hint:'Rule of thumb: one copy with every key backup, one with the trustee, one on the watch-only machine.',
    },
    fields:[
      {k:'watchOnly', path:'backups.watchOnly', label:'Watch-only setup', ph:'e.g. Bitcoin Core node at home; Sparrow on laptop; Nunchuk app', hint:'Where the family can SEE the coins without being able to move them.'},
      {k:'rescanHeight', path:'backups.rescanHeight', label:'Wallet birthday / rescan height', ph:'e.g. block 850,000 or “Sept 2026”', hint:'A wrong birthday that skips the deposit block is how people decide the coins are gone. “Start at genesis” is acceptable and slow.'},
      {k:'sampleAddresses', path:'backups.sampleAddresses', label:'Have 2–3 previously used receiving addresses been recorded somewhere safe?', type:'select', options:['Yes — recorded with the descriptor copies','Not yet'], hint:'They let a recovery be verified before any real spend: restore the wallet and check the addresses match.'},
      {k:'testedSoftware', path:'backups.testedSoftware', label:'Software + versions that successfully signed a test transaction', ph:'e.g. Bitcoin Core 29.x, Sparrow 2.x, SeedSigner 0.8.x…'},
    ],
  },
  {
    id:'inheritance', folio:'Map · 06 · Succession', title:'Inheritance mechanism',
    intro:'Bitcoin cannot read a death certificate. Only two mechanisms release coins you can no longer spend: a human holding a missing key who agrees to use it, or a timelock that matures because the coins stopped moving. Strong plans use both — on the family portion, not necessarily the deep vault.',
    fields:[
      {k:'mechanism', path:'inheritance.mechanism', label:'Primary inheritance mechanism', type:'select', options:MECHANISMS},
      {k:'releaseConditions', path:'inheritance.releaseConditions', label:'Release conditions — when and how heirs gain access', type:'textarea', ph:'e.g. Trustee releases sealed key B on presentation of death certificate; timelocked path opens after 18 months of inactivity on the family vault…'},
      {k:'heartbeat', path:'inheritance.heartbeat', label:'If timelocks are used — the refresh routine', ph:'e.g. annual consolidation of the family vault to itself, calendar reminder set for March', hint:'The timer resets when coins move to yourself under the same policy. Put the reminder further out than one missed year. Missing it degrades toward the family path — it never deletes coins.'},
      {k:'legalDocs', path:'inheritance.legalDocs', label:'Legal documents referencing this plan', ph:'e.g. Will dated …; Trust deed §4; attorney: …', hint:'The will names that instructions exist and who holds them — never the seeds, never the hiding places. Probate filings have a way of becoming readable.'},
      {k:'letterLocation', path:'inheritance.letterLocation', label:'Where the sealed instruction letter lives', ph:'e.g. with trustee; attorney’s office; safe deposit box — described non-specifically'},
      {k:'canary', path:'inheritance.canary', label:'Canary / liveness signal (optional)', ph:'e.g. one small watched UTXO on the family descriptor; if it moves, someone is spending that policy', hint:'An alarm, not a dead-man switch. It also lets heirs see the coins are still sitting still.'},
    ],
  },
  {
    id:'rehearsal', folio:'Map · 07 · Rehearsal', title:'Has it actually been tested?',
    intro:'An untested backup is a story. This log is what turns a document into a plan. Leave answers honest — the risk review on the next page reads them.',
    fields:[
      {k:'restoreDrill', path:'rehearsal.restoreDrill', label:'Restore drill: one key restored from its physical backup onto a blank signer?', type:'select', options:['Yes — done and dated','Partially','Not yet']},
      {k:'familyWalkthrough', path:'rehearsal.familyWalkthrough', label:'Family walkthrough: has the spouse/heir opened these instructions and found the descriptor without your help?', type:'select', options:['Yes — they found everything unaided','They know the plan exists','Not yet']},
      {k:'testSpendDate', path:'rehearsal.testSpendDate', label:'Date of last full test spend (small amount, signed and broadcast)', type:'date'},
      {k:'notes', path:'rehearsal.notes', label:'Rehearsal notes / what went wrong and was fixed', type:'textarea'},
    ],
  },
  { id:'review', folio:'Map · 08 · Examination', title:'Risk review', custom:'review' },
  { id:'export', folio:'Map · 09 · Sealing the file', title:'Encrypt & export', custom:'export' },
];

/* ---------- path helpers ---------- */
function getPath(obj,path){ return path.split('.').reduce((o,k)=>o?.[k],obj); }
function setPath(obj,path,val){ const ks=path.split('.'); let o=obj; for(let i=0;i<ks.length-1;i++){ o=o[ks[i]]??(o[ks[i]]={}); } o[ks[ks.length-1]]=val; }

/* ---------- field renderers ---------- */
function renderField(f, host){
  const wrap=el('div',{class:'field'});
  wrap.append(el('label',{},f.label));
  const cur = getPath(S.plan,f.path);
  let input;
  if(f.type==='textarea'){
    input=el('textarea',{placeholder:f.ph||''}); input.value=cur||'';
    input.addEventListener('input',()=>{setPath(S.plan,f.path,input.value);markDirty();});
  } else if(f.type==='select'){
    input=el('select',{});
    input.append(el('option',{value:''},'— choose —'));
    for(const o of f.options) input.append(el('option',{value:o},o));
    input.value=cur||'';
    input.addEventListener('change',()=>{setPath(S.plan,f.path,input.value);markDirty();});
  } else if(f.type==='date'){
    input=el('input',{type:'date'}); input.value=cur||'';
    input.addEventListener('input',()=>{setPath(S.plan,f.path,input.value);markDirty();});
  } else if(f.type==='checkboxes'){
    const arr=Array.isArray(cur)?cur:[];
    f.options.forEach((label,i)=>{
      const val=f.values[i];
      const cb=el('input',{type:'checkbox'});
      cb.checked=arr.includes(val);
      cb.addEventListener('change',()=>{
        const a=Array.isArray(getPath(S.plan,f.path))?getPath(S.plan,f.path):[];
        const idx=a.indexOf(val);
        if(cb.checked&&idx<0)a.push(val); if(!cb.checked&&idx>=0)a.splice(idx,1);
        setPath(S.plan,f.path,a); markDirty();
      });
      wrap.append(el('div',{class:'check-row'},cb,el('label',{},label)));
    });
    if(input){input.setAttribute('data-folio-path',f.path);}
  if(f.hint) wrap.append(el('div',{class:'hint'},f.hint));
    host.append(wrap); return;
  } else {
    input=el('input',{type:'text',placeholder:f.ph||''}); input.value=cur||'';
    input.addEventListener('input',()=>{setPath(S.plan,f.path,input.value);markDirty();});
  }
  wrap.append(input);
  if(input){input.setAttribute('data-folio-path',f.path);}
  if(f.hint) wrap.append(el('div',{class:'hint'},f.hint));
  host.append(wrap);
}

function renderRepeater(r, host){
  host.append(el('h3',{},r.label));
  if(r.hint) host.append(el('p',{class:'field-note'},r.hint));
  const arr=getPath(S.plan,r.path);
  const list=el('div',{});
  host.append(list);
  const draw=()=>{
    list.innerHTML='';
    arr.forEach((item,i)=>{
      const box=el('div',{class:'rep-item'});
      const head=el('div',{class:'rep-head'},
        el('span',{class:'t'},r.itemTitle(item,i)),
        el('button',{class:'rm',onclick:(e)=>{e.stopPropagation(); arr.splice(i,1); markDirty(); draw();}},'Remove'));
      const body=el('div',{class:'rep-body'});
      r.fields.forEach(f=>{
        const rf={...f,path:r.path+'.'+i+'.'+f.k};
        renderField(rf,body);
      });
      box.append(head,body); list.append(box);
    });
  };
  draw();
  host.append(el('button',{class:'rep-add',onclick:()=>{ arr.push({}); markDirty(); draw(); }},'+ '+r.addLabel));
}


'use strict';
/* =====================================================================
   PART 3 — custom steps: start, vaults, review (risk engine), export
   ===================================================================== */

/* ---------- vaults custom step ---------- */
function renderVaults(host){
  const draw=()=>{
    host.innerHTML='';
    const st=STEPS.find(s=>s.id==='vaults');
    host.append(el('div',{class:'folio'},st.folio));
    host.append(el('h2',{},st.title));
    host.append(el('p',{class:'step-intro'},st.intro));
    host.append(el('div',{class:'note'},el('strong',{},'Rule: '),'never record seed words, xprvs, or full xpub strings here. A key entry describes ',el('em',{},'which'),' key it is, ',el('em',{},'what'),' signs with it, and ',el('em',{},'where its backups live'),' — nothing that can spend.'));

    renderPresetPicker(host);
    S.plan.vaults.forEach((v,vi)=>{
      const box=el('div',{class:'rep-item'});
      const head=el('div',{class:'rep-head'},
        el('span',{class:'t'},(v.name||'Vault '+(vi+1))+(v.m&&v.n?` · ${v.m}-of-${v.n}`:'')),
        el('button',{class:'rm',onclick:()=>{S.plan.vaults.splice(vi,1);markDirty();draw();}},'Remove vault'));
      const body=el('div',{class:'rep-body'});

      const vf=(label,node,hint)=>{const w=el('div',{class:'field'});w.append(el('label',{},label),node);if(hint)w.append(el('div',{class:'hint'},hint));body.append(w);};

      const nm=el('input',{type:'text',placeholder:'e.g. Deep vault — cold reserve'});nm.value=v.name||'';
      nm.addEventListener('input',()=>{v.name=nm.value;markDirty();});
      vf('Vault name',nm);

      const tier=el('select',{});tier.append(el('option',{value:''},'— choose —'));TIERS.forEach(t=>tier.append(el('option',{value:t},t)));
      tier.value=v.tier||'';tier.addEventListener('change',()=>{v.tier=tier.value;markDirty();});
      vf('Purpose / tier',tier,'Theft-resistance and inheritance want opposite shapes. A small timelocked family pile plus a larger no-timelock deep vault beats one script trying to do both.');

      const qrow=el('div',{class:'row msig-threshold-labels'});
      const mi=el('input',{type:'number',min:'1',max:'15',class:'msig-threshold-number'});mi.value=v.m||'';
      const ni=el('input',{type:'number',min:'1',max:'15',class:'msig-threshold-number'});ni.value=v.n||'';
      mi.addEventListener('input',()=>{v.m=+mi.value||'';markDirty();});
      ni.addEventListener('input',()=>{v.n=+ni.value||'';markDirty();});
      qrow.append(mi,el('span',{class:'mono small'},'OF'),ni);
      vf('Quorum',qrow,'2-of-3 if a normal family must operate it. 3-of-5 when losing one site must not matter. 3-of-7 is the loss-extreme — and a poor inheritance experience.');

      const sc=el('select',{});sc.append(el('option',{value:''},'— choose —'));SCRIPTS.forEach(t=>sc.append(el('option',{value:t},t)));
      sc.value=v.script||'';sc.addEventListener('change',()=>{v.script=sc.value;markDirty();});
      vf('Script type',sc);

      const co=el('select',{});co.append(el('option',{value:''},'— choose —'));COORDS.forEach(t=>co.append(el('option',{value:t},t)));
      co.value=v.coordinator||'';co.addEventListener('change',()=>{v.coordinator=co.value;markDirty();});
      vf('Coordinator software',co,'The coordinator builds transactions and holds the watch-only wallet. It must be replaceable — recovery must not depend on one company existing.');

      // timelock
      const tlw=el('div',{class:'field'});
      tlw.append(el('label',{},'Timelocked recovery path?'));
      const seg=el('div',{class:'seg'});
      [['','—'],['no','No timelock'],['yes','Has timelock']].forEach(([val,lab])=>{
        const rb=el('input',{type:'radio',name:'tl'+vi,value:val});
        rb.checked=(v.timelock?.enabled?'yes':(v.timelock&&v.timelock.enabled===false?'no':''))===val;
        rb.addEventListener('change',()=>{v.timelock=v.timelock||{};v.timelock.enabled=(val==='yes');markDirty();draw();});
        seg.append(el('label',{},rb,lab));
      });
      tlw.append(seg); body.append(tlw);
      if(v.timelock?.enabled){
        const dl=el('input',{type:'text',placeholder:'e.g. 18 months relative (CSV), refreshes on consolidation'});dl.value=v.timelock.delay||'';
        dl.addEventListener('input',()=>{v.timelock.delay=dl.value;markDirty();});
        vf('Timelock details',dl,'Prefer relative timelocks (OP_CSV): “if these coins sit still, something is wrong.” Absolute dates open on the date even if you are actively spending elsewhere.');
      }

      const nt=el('textarea',{placeholder:'Legal separation notes, what this vault is for, what it is NOT for…'});nt.value=v.notes||'';
      nt.addEventListener('input',()=>{v.notes=nt.value;markDirty();});
      vf('Notes',nt,'Do not mix personal, trust, and business coins under one descriptor. Legal ownership should match who can sign.');

      /* ---- nested keys ---- */
      const kh=el('div',{class:'nested'});
      kh.append(el('div',{class:'nested-label'},'Keys in this vault ('+(v.keys?.length||0)+(v.n?` of ${v.n} expected`:'')+')'));
      v.keys=v.keys||[];
      v.keys.forEach((k,ki)=>{
        const kb=el('div',{class:'rep-item'});
        const khead=el('div',{class:'rep-head'},
          el('span',{class:'t'},'Key '+(ki+1)+(k.label?' — '+k.label:'')),
          el('button',{class:'rm',onclick:()=>{v.keys.splice(ki,1);markDirty();draw();}},'Remove'));
        const kbody=el('div',{class:'rep-body'});
        const kf=(label,node,hint)=>{const w=el('div',{class:'field'});w.append(el('label',{},label),node);if(hint)w.append(el('div',{class:'hint'},hint));kbody.append(w);};

        const kl=el('input',{type:'text',placeholder:'e.g. Key A — home signer'});kl.value=k.label||'';kl.addEventListener('input',()=>{k.label=kl.value;markDirty();});
        kf('Label',kl);

        const kd=el('select',{});kd.append(el('option',{value:''},'— choose —'));DEVICES.forEach(t=>kd.append(el('option',{value:t},t)));
        kd.value=k.device||'';kd.addEventListener('change',()=>{k.device=kd.value;markDirty();draw();});
        kf('Signing device',kd,k.device==='COLDCARD (see warning)'?'⚠ After the 2026 entropy incident, do not generate NEW seeds on this brand; only import user-supplied (dice) entropy, or prefer another signer.':null);

        const kg=el('select',{});kg.append(el('option',{value:''},'— choose —'));GENMETHODS.forEach(t=>kg.append(el('option',{value:t},t)));
        kg.value=k.generation||'';kg.addEventListener('change',()=>{k.generation=kg.value;markDirty();});
        kf('How this key was generated',kg,'Best practice from the research: each key gets its OWN ceremony — its own boot, its own dice. Seven keys from one RNG in one sitting share one failure.');

        const km=el('select',{});km.append(el('option',{value:''},'— choose —'));MEDIA.forEach(t=>km.append(el('option',{value:t},t)));
        km.value=k.media||'';km.addEventListener('change',()=>{k.media=km.value;markDirty();});
        kf('Backup medium',km,'Steel is the canonical backup for words. Paper alone is not. Discs are a good extra and a bad only.');

        const kloc=el('input',{type:'text',placeholder:'e.g. home safe; bank deposit box downtown; sister’s house (sealed envelope)'});kloc.value=k.locations||'';kloc.addEventListener('input',()=>{k.locations=kloc.value;markDirty();});
        kf('Backup location(s)',kloc,'Separate multiple locations with semicolons. Two copies of key A are still only key A — do not “back up” your way into a spendable set in one building.');

        const kp=el('select',{});kp.append(el('option',{value:''},'— choose —'));PASSPHRASE.forEach(t=>kp.append(el('option',{value:t},t)));
        kp.value=k.passphrase||'';kp.addEventListener('change',()=>{k.passphrase=kp.value;markDirty();});
        kf('Seed-passphrase backup status (never enter the passphrase)',kp,'Choose only where it is stored. Never type seed words or the actual seed passphrase into this tool.');

        kb.append(khead,kbody); kh.append(kb);
      });
      kh.append(el('button',{class:'rep-add',onclick:()=>{v.keys.push({});markDirty();draw();}},'+ Add a key'));
      body.append(kh);

      box.append(head,body); host.append(box);
    });

    host.append(el('button',{class:'rep-add',onclick:()=>{S.plan.vaults.push({timelock:null,keys:[]});markDirty();draw();}},'+ Add a vault'));
  };
  draw();
}

/* ---------- risk engine ---------- */
function analyzePlan(p){
  const out=[];
  const add=(sev,title,detail,fix)=>out.push({sev,title,detail,fix});
  const locs={}; // normalized location -> [{vault,key}]
  let allDevices=new Set(), allGen=new Set(), anyTimelock=false, anyPassphraseMemory=false, totalKeys=0;

  p.vaults.forEach((v,vi)=>{
    const vn=v.name||('Vault '+(vi+1));
    if(v.timelock?.enabled) anyTimelock=true;
    const expected=+v.n||0;
    if(expected && (v.keys?.length||0)!==expected)
      add('warning',`${vn}: key count mismatch`,`Quorum says ${v.m||'?'}-of-${v.n} but ${v.keys?.length||0} keys are documented.`,'Document every key — heirs can only plan around what is written down.');
    (v.keys||[]).forEach((k,ki)=>{
      totalKeys++;
      const kn=(k.label||('Key '+(ki+1)))+' ('+vn+')';
      if(k.device) allDevices.add(k.device);
      if(k.generation) allGen.add(k.generation);
      if(k.media==='Hardware device only (no separate backup)')
        add('critical',`${kn}: no backup beyond the device`,'Hardware wallets fail, screens break, companies disappear. A device is a signer, not a backup.','Stamp the seed words into steel (or your chosen durable medium) and store it apart from the device.');
      if(k.passphrase==='Memory only (dangerous)') anyPassphraseMemory=true;
      (k.locations||'').split(';').map(s=>s.trim()).filter(Boolean).forEach(loc=>{
        const key=loc.toLowerCase();
        locs[key]=locs[key]||[]; locs[key].push({vault:vn,m:+v.m||1,kn});
      });
    });
  });

  // quorum-in-one-location check (per vault)
  for(const [loc,holders] of Object.entries(locs)){
    const byVault={};
    holders.forEach(h=>{byVault[h.vault]=byVault[h.vault]||new Set(); byVault[h.vault].add(h.kn);});
    for(const [vn,keys] of Object.entries(byVault)){
      const m=holders.find(h=>h.vault===vn)?.m||1;
      if(keys.size>=m)
        add('critical',`One location can reach a spending quorum`,`“${loc}” holds backups for ${keys.size} key(s) of ${vn}, which needs ${m}. Fire, burglary, or one dishonest person at that site can spend.`,'Redistribute so no single location holds M or more keys of any vault.');
    }
  }

  if(totalKeys>0 && allDevices.size===1 && p.vaults.some(v=>+v.n>1))
    add('warning','Signer monoculture',`Every documented key uses the same device type (${[...allDevices][0]}). One firmware bug or supply-chain failure reaches the whole quorum.`,'Prefer different manufacturers across the quorum. Diversity helps against device backdoors — though it never replaces user-supplied entropy.');
  if(totalKeys>0 && allGen.size===1 && [...allGen][0]==='Device RNG (device-generated)' && p.vaults.some(v=>+v.n>1))
    add('warning','All keys born from device RNGs','The 2026 Coldcard incident showed device RNGs can silently fail, and fixed firmware does not heal a weak seed. Multisig contains the damage — unless two weak keys sit in one quorum.','For future key ceremonies, supply your own entropy (dice/coins/cards) through a verified offline calculator, and verify the derived address with a second independent program.');
  if(anyPassphraseMemory)
    add('critical','A passphrase exists only in someone’s memory','If that person dies or forgets, the passphrase-protected keys are gone forever — while the backups look perfectly fine.','Write it down, store it apart from the words, and give the trustee a sealed copy.');
  if(p.backups.descriptorLocations.length===0)
    add('critical','No descriptor / wallet-configuration backup recorded','Multisig seeds alone do not reconstruct the wallet. Without the descriptor (script type, cosigner xpubs, threshold, timelocks) heirs may hold the keys and still be unable to recover.','Add descriptor copies: one with every key backup, one with the trustee, one on the watch-only machine.');
  else if(p.backups.descriptorLocations.length<2)
    add('warning','Only one descriptor copy recorded','The map is as load-bearing as the keys. One copy is one failure away from an unrecoverable quorum.','Distribute at least 2–3 copies across the same sites as the key backups.');
  if(!p.backups.rescanHeight)
    add('info','No wallet birthday / rescan height recorded','A restorer who starts from the wrong height may conclude the coins are gone.','Record a block height or month/year of wallet creation with each descriptor copy.');
  if((p.backups.sampleAddresses||'').startsWith('Not'))
    add('info','No sample receiving addresses recorded','2–3 known addresses let heirs verify a restore BEFORE trusting it with a spend.','Note a few previously used addresses alongside the descriptor copies.');

  // inheritance
  const heirs=p.people.heirs||[];
  if(heirs.some(h=>h.holdsKeyNow==='Yes — intentional co-signer'))
    add('warning','An heir holds a live quorum key today','They can be targeted, coerced, or collude with whoever holds another live key — regardless of what any will says. Bitcoin checks signatures, not intentions.','If intentional, document WHY. Otherwise move their key to a sealed/delayed role.');
  if(!p.people.helper)
    add('info','No Bitcoin-competent helper named','A grieving family is a target for “wallet support” scammers. A named, trusted, keyless helper separates technical assistance from financial control.','Name one, and write in the runbook that nobody legitimate will ever call or email to validate the wallet.');
  if(!p.inheritance.mechanism || p.inheritance.mechanism==='Not decided yet')
    add('warning','Inheritance mechanism undecided','The plan documents the vault but not the succession. This is the piece most setups skip — and where most inheritances fail.','Choose: distributed keys via trustee, on-chain timelock decay, an assisted program, or a documented combination.');
  if(anyTimelock && !p.inheritance.heartbeat)
    add('critical','Timelocked path with no refresh routine','The clock applies to each coin individually and only resets via confirmed on-chain transactions. Miss it, and the recovery path opens while you are alive.','Set an annual consolidation habit and a calendar reminder further out than one missed year.');
  if(p.inheritance.mechanism?.includes('Collaborative') )
    add('info','Assisted custody is part of the plan','Providers can make recovery easier, but their disappearance must not make recovery impossible. Confirm heirs can recover sovereignly: enough non-provider keys plus the wallet configuration.','Test the exit: rehearse recovery without the provider at least once.');

  // rehearsal
  if((p.rehearsal.restoreDrill||'').startsWith('Not'))
    add('critical','Restore drill never done','Nobody has proven a physical backup actually restores onto a blank signer. Untested backups are stories.','Restore one key from steel, on a blank device, before calling this plan finished.');
  if((p.rehearsal.familyWalkthrough||'').startsWith('Not'))
    add('warning','Family has never walked the recovery path','The plan exists only in your head until someone else can find the instructions and the map without you.','Once, while everyone is calm: have the heir open the runbook and locate the descriptor unaided.');
  if((p.signing.testSpend||'').startsWith('Not yet'))
    add('critical','No test spend completed','The signing procedure has never been exercised end-to-end. Coordinators and signers drift with upgrades.','Send a small amount through the full cycle: build PSBT, cross the gap, sign, verify, broadcast.');
  if(p.signing.medium==='USB stick (last resort)')
    add('info','USB crosses the air gap','USB is a tunnel: it carries arbitrary data both ways. Prefer QR (UR/animated) or SD where the signer supports it.','If USB is unavoidable, dedicate the stick, and decode the PSBT independently on both sides.');

  for(const row of (p.accessRecords||[])){
    if(row.mode==='Direct access details inside encrypted guide'&&row.directAccess)
      add('warning','Guide contains direct access credentials','Anyone opening the guide can read these details.','Keep a separate recovery route outside the guide.');
  }
  if(out.length===0)
    add('info','No structural weaknesses detected','Based on what is documented. This review checks structure, not execution — physical security and discipline remain yours.','Keep the rehearsal log current.');
  const order={critical:0,warning:1,info:2};
  return out.sort((a,b)=>order[a.sev]-order[b.sev]);
}

/* ---------- review custom step ---------- */
function renderReview(host){
  const findings=analyzePlan(S.plan);
  host.append(el('div',{class:'folio'},'Map · 08 · Examination'));
  host.append(el('h2',{},'Risk review'));
  host.append(el('p',{class:'step-intro'},'This is the failure simulator: it reads what you documented and flags the classic ways cold-storage plans and inheritances actually die. Fix items by going back, or record why you accept them.'));
  const counts={critical:0,warning:0,info:0}; findings.forEach(f=>counts[f.sev]++);
  host.append(el('p',{class:'label'},
    `${counts.critical} critical · ${counts.warning} warnings · ${counts.info} notes`));
  findings.forEach(f=>{
    host.append(el('div',{class:'risk '+f.sev},
      el('div',{class:'sev'},f.sev),
      el('div',{},el('div',{class:'rt'},f.title),el('div',{class:'rd'},f.detail, f.fix?el('span',{class:'fix'},'→ '+f.fix):null))));
  });
  host.append(el('h3',{},'Plan summary'));
  host.append(renderSummaryTable(S.plan));
  host.append(el('div',{class:'field'}));
  const notes=el('textarea',{placeholder:'Owner notes — anything the family should know that the fields did not capture (kept in the encrypted file)…'});
  notes.value=S.plan.ownerNotes||''; notes.addEventListener('input',()=>{S.plan.ownerNotes=notes.value;markDirty();});
  const nw=el('div',{class:'field'});nw.append(el('label',{},'Owner notes (encrypted with the plan)'),notes);host.append(nw);
}

function renderSummaryTable(p){
  const t=el('table',{class:'ledger'});
  t.append(el('thead',{},el('tr',{},el('th',{},'Entry'),el('th',{},'Value'))));
  const tb=el('tbody',{});
  const row=(k,v)=>{if(v==null||v===''||(Array.isArray(v)&&!v.length))return; tb.append(el('tr',{},el('td',{},k),el('td',{},Array.isArray(v)?v.join('; '):String(v))));};
  row('Plan',p.meta.planName); row('Owner',p.meta.owner); row('Prepared',p.meta.created);
  row('Executor',p.people.executor); row('Trustee',p.people.trustee); row('Helper',p.people.helper);
  row('Heirs',(p.people.heirs||[]).map(h=>h.name).filter(Boolean));
  p.vaults.forEach((v,i)=>{
    row(`Vault ${i+1}`,[v.name,v.tier,`${v.m||'?'}-of-${v.n||'?'}`,v.script,v.coordinator,v.timelock?.enabled?('timelock: '+v.timelock.delay):null].filter(Boolean).join(' · '));
    (v.keys||[]).forEach((k,ki)=>row(` · Key ${ki+1}`,[k.label,k.device,k.media,k.locations].filter(Boolean).join(' · ')));
  });
  row('Inheritance',p.inheritance.mechanism);
  row('Descriptor copies',(p.backups.descriptorLocations||[]).map(d=>d.where).filter(Boolean));
  t.append(tb); return t;
}


'use strict';
/* =====================================================================
   PART 4 — crypto, export/import, heir runbook, shell
   ===================================================================== */

/* ---------- WebCrypto: PBKDF2-SHA256 + AES-256-GCM ---------- */
const ENC_MAGIC='ENTROPYLAB-MAP/1';
const b64e=buf=>{
  const bytes=new Uint8Array(buf); let text='';
  for(let i=0;i<bytes.length;i+=32768) text+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return btoa(text);
};
const b64d=s=>{
  if(typeof s!=='string' || s.length>14*1024*1024 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)) throw new Error('Invalid Base64');
  const out=Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  if(b64e(out)!==s) throw new Error('Noncanonical Base64');
  return out;
};
// Validate before rendering; preserve unknown fields for forward compatibility.
export const MAP_MARKER='ENTROPYLAB-MAP/1\n';
export function mapPage(plan){
  const encoded=JSON.stringify(prepareBrowserPlan(plan)).replace(/[◆◈\u2063]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
  const text=MAP_MARKER+encoded;
  if(text.length>900000)throw new Error('Map exceeds the encrypted notebook page limit.');
  return text;
}
export function readMapPage(text){
  if(typeof text!=='string'||!text.startsWith(MAP_MARKER))throw new Error('Select the Map page in Journal Notepad first.');
  return prepareBrowserPlan(JSON.parse(text.slice(MAP_MARKER.length)));
}
export function mapNotebook(plan){
  const text=mapPage(plan);
  return serializeNotebook({pages:[{number:1,name:'Map',notesText:text,style:{font:'mono',size:'medium',spacing:'comfortable'}}],activePage:0});
}
async function encryptPlan(plan,passphrase,onProg){
  if(typeof passphrase!=='string'||passphrase.length<12)throw new Error('Use at least 12 characters for the backup password.');
  const content=mapNotebook(prepareExportPlan(plan));onProg?.('Encrypting with the unchanged EntropyLab Journal engine…');
  const keys=await deriveJournalKeys(passphrase);
  try{return await sealExport('notebook',content,keys);}finally{wipeBytes(keys.verify);}
}
async function decryptPlan(env,passphrase,onProg){
  if(env?.magic==='VAULTFOLIO/1')return decryptLegacyPlan(env,passphrase,onProg);
  if(!env||env.entropylabJournalExport!==1||JSON.stringify(env).length>10*1024*1024)throw new Error('Unsupported or oversized Map backup.');
  const params=parseFile(env);try{if(params.iterations!==600000)throw Error('Unsupported encryption cost.');}finally{wipeBytes(params.iv);wipeBytes(params.ciphertext);}
  const keys=await deriveJournalKeys(passphrase);
  try{const opened=await openExport(env,keys);if(opened.kind!=='notebook')throw Error('This is not an encrypted notebook.');const book=parseNotebook(opened.content);const matches=book.pages.filter(page=>page.notesText.startsWith(MAP_MARKER));if(matches.length!==1)throw Error('The backup must contain one Map page.');return readMapPage(matches[0].notesText);}
  finally{wipeBytes(keys.verify);}
}
async function decryptLegacyPlan(env, passphrase, onProg){
  if(!env || typeof env!=='object' || env.magic!=='VAULTFOLIO/1') throw new Error('Not a Map v1 file.');
  if(Object.keys(env).length!==4 || env.kdf?.name!=='PBKDF2' || env.kdf?.hash!=='SHA-256' ||
     env.kdf?.iterations!==600000 || env.cipher?.name!=='AES-256-GCM') throw new Error('Unsupported or malformed encryption parameters.');
  onProg?.('Deriving key (this takes a few seconds by design)…');
  let salt,iv,ct;
  try { salt=b64d(env.kdf.salt); iv=b64d(env.cipher.iv); ct=b64d(env.data); }
  catch(e){ throw new Error('Malformed encrypted plan.'); }
  if(salt.length!==16 || iv.length!==12 || ct.length<16 || ct.length>10*1024*1024+16) throw new Error('Malformed encrypted plan.');
  const passBytes=new TextEncoder().encode(passphrase);
  let km;try{km=await crypto.subtle.importKey('raw',passBytes,'PBKDF2',false,['deriveKey']);}finally{passBytes.fill(0);}
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:env.kdf.iterations},km,{name:'AES-GCM',length:256},false,['decrypt']);
  try{
    const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
    if(pt.byteLength>10*1024*1024) throw new Error('Plan is too large.');
    let plan;try{plan=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(pt));}finally{new Uint8Array(pt).fill(0);}
    if(!plan || typeof plan!=='object' || Array.isArray(plan)) throw new Error('Malformed plan document.');
    return prepareBrowserPlan(plan);
  }catch(e){ throw new Error('Wrong passphrase, or the file is corrupted.'); }
}
function download(filename, text){
  const a=el('a',{href:URL.createObjectURL(new Blob([text],{type:'application/json'})),download:filename});
  document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function readFile(file){ return new Promise((res,rej)=>{ if(file.size>10*1024*1024){rej(new Error('File is too large.'));return;} const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsText(file); }); }

/* ---------- export custom step ---------- */
function renderExport(host){
  host.append(el('h2',{},'Back up Map'),el('p',{class:'step-intro'},'This backup uses EntropyLab’s unchanged encrypted notebook format. It loads in Journal → Notepad → Upload using the same password. Download journal entries alone does not include notepad pages: use Download notepad to preserve those.'));
  const pass=el('input',{type:'password',id:'map-password','aria-label':'Backup password'}),confirmPass=el('input',{type:'password',id:'map-confirm','aria-label':'Confirm backup password'});
  host.append(el('label',{},'Backup password'),pass,el('label',{},'Confirm password'),confirmPass);
  const status=el('p',{class:'hint',id:'map-backup-status'}),save=el('button',{class:'btn',id:'map-backup'},'Download encrypted Map backup');
  save.addEventListener('click',async()=>{
    if(pass.value!==confirmPass.value){status.textContent='Passwords do not match.';return;}
    const epoch=sessionEpoch,password=pass.value;pass.value='';confirmPass.value='';save.disabled=true;
    try{const file=await encryptPlan(S.plan,password);if(!sessionCurrent(epoch))return;download('map-notebook.json',JSON.stringify(file,null,2));S.dirty=false;status.textContent='Encrypted Map backup downloaded. Keep its password separate.';}
    catch(error){if(sessionCurrent(epoch))status.textContent=error.message;}finally{if(sessionCurrent(epoch))save.disabled=false;}
  });
  const row=el('div',{class:'btn-row'},save);
  if(journalBridge?.available())row.append(el('button',{class:'btn ghost',id:'map-to-journal',onclick:()=>{try{journalBridge?.store(mapPage(S.plan));status.textContent='Map page stored in Journal Notepad. Use its encrypted Download notepad control to save it.';}catch(error){status.textContent=error.message;}}},'Store Map page in Journal Notepad'));
  host.append(row,status);
  if(!journalBridge?.available())host.append(el('p',{class:'hint'},'This upstream release keeps Journal hidden. Map does not enable it. The backup format is ready for a Journal-enabled build.'));
}

function recoveryRoutes(v){
  const keys=(v.keys||[]).map((k,i)=>({name:k.label||('Key '+(i+1)),where:k.locations||'location not documented'}));
  const m=Number(v.m),n=keys.length;
  if(!Number.isInteger(m)||m<1||m>n)return [];
  const indices=Array.from({length:m},(_,i)=>i),out=[];
  while(out.length<10){
    out.push(indices.map(i=>keys[i]));
    let i=m-1;
    while(i>=0&&indices[i]===n-m+i)i--;
    if(i<0)break;
    indices[i]++;
    for(let j=i+1;j<m;j++)indices[j]=indices[j-1]+1;
  }
  return out;
}

/* ---------- in-app heir runbook renderer ---------- */
function buildRunbook(p){
  const frag=el('div',{class:'runbook'});
  frag.append(el('div',{class:'folio'},'Inheritance runbook · generated from the plan file'));
  frag.append(el('h2',{},(p.meta.planName||'Cold Storage Plan')));
  frag.append(el('p',{class:'muted'},`Owner: ${p.meta.owner||'—'} · Prepared: ${p.meta.created||'—'}`));

  frag.append(el('div',{class:'note warn'},
    el('strong',{},'Read first. '),
    'Nobody legitimate will ever email or call you to “validate” or “recover” this wallet. Anyone who does is a thief. Move slowly, verify everything, and send a small test transaction before moving any real amount.'));

  if(p.meta.jurisdiction) frag.append(el('p',{},el('strong',{},'Jurisdiction: '),p.meta.jurisdiction));
  if(p.meta.legalNotes) frag.append(el('p',{},el('strong',{},'Legal notes: '),p.meta.legalNotes));
  if(Array.isArray(p.amendments)&&p.amendments.length){
    const box=el('div',{class:'note'});
    box.append(el('strong',{},'Notes added on top of the saved guide'));
    p.amendments.forEach((note,i)=>box.append(el('p',{},`${i+1}. ${note}`)));
    frag.append(box);
  }
  frag.append(el('h3',{},'1 · Who to contact'));
  const kv=el('div',{class:'kv'});
  const kvr=(k,v)=>{if(v)kv.append(el('div',{},k),el('div',{},v));};
  kvr('Executor / next of kin',p.people.executor);
  kvr('Trustee (holds the map)',p.people.trustee);
  kvr('Technical helper (holds NO keys)',p.people.helper);
  (p.people.heirs||[]).forEach((h,i)=>kvr('Heir '+(i+1),[h.name,h.relation,h.role,h.contact].filter(Boolean).join(' · ')));
  frag.append(kv);

  frag.append(el('h3',{},'2 · What exists'));
  if(!p.vaults.length) frag.append(el('p',{class:'muted'},'No vaults documented.'));
  p.vaults.forEach((v,i)=>{
    const box=el('div',{class:'kv'});
    const r=(k,val)=>{if(val)box.append(el('div',{},k),el('div',{},val));};
    r('Vault',v.name||('Vault '+(i+1)));
    r('Purpose',v.tier);
    r('Quorum',(v.m&&v.n)?`${v.m}-of-${v.n} primary rule — verify the actual wallet policy and any delayed path requirements before spending`:null);
    r('Script',v.script);
    r('Coordinator',v.coordinator);
    if(v.timelock?.enabled) r('Timelock',v.timelock.delay||'Yes — details not recorded');
    if(v.notes) r('Notes',v.notes);
    (v.keys||[]).forEach((k,ki)=>{
      r('Key '+(ki+1)+(k.label?' — '+k.label:''),
        [k.device&&('Signer: '+k.device), k.media&&('Backup: '+k.media), k.locations&&('Where: '+k.locations),
         k.passphrase&&('Seed-passphrase backup status: '+k.passphrase)].filter(Boolean).join('  |  '));
    });
    frag.append(box);
    const routes=recoveryRoutes(v);
    if(routes.length){
      const shown=routes.slice(0,10);
      frag.append(el('p',{class:'field-note'},
        el('strong',{},`Primary-key combinations for ${v.name||'this vault'} — actual policy and eligibility must be verified. `),
        'Up to 10 combinations shown:'));
      const rl=el('ul',{class:'checklist'});
      shown.forEach(c=>rl.append(el('li',{},c.map(k=>`${k.name} (${k.where})`).join('  +  '))));
      frag.append(rl);
    }
  });

  frag.append(el('h3',{},'3 · The map (wallet descriptor)'));
  frag.append(el('p',{},'The descriptor reconstructs the wallet: script type, all cosigner public keys, threshold, and any timelock. The seeds alone are NOT enough for a multisig. Copies of the descriptor live at:'));
  const ul=el('ul',{class:'checklist'});
  (p.backups.descriptorLocations||[]).forEach(d=>ul.append(el('li',{},[d.where,d.format&&('('+d.format+')')].filter(Boolean).join(' '))));
  if(!p.backups.descriptorLocations.length) ul.append(el('li',{},'⚠ Not documented — ask the trustee; check with each key backup.'));
  frag.append(ul);
  const det=el('div',{class:'kv'});
  if(p.backups.watchOnly) det.append(el('div',{},'Watch-only wallet'),el('div',{},p.backups.watchOnly));
  if(p.backups.rescanHeight) det.append(el('div',{},'Rescan from'),el('div',{},p.backups.rescanHeight));
  if(p.backups.testedSoftware) det.append(el('div',{},'Software that worked'),el('div',{},p.backups.testedSoftware));
  if(p.backups.sampleAddresses?.startsWith('Yes')) det.append(el('div',{},'Verification addresses'),el('div',{},'Recorded with the descriptor copies — a restored wallet must reproduce them.'));
  if(det.children.length) frag.append(det);

  frag.append(el('h3',{},'4 · How recovery works'));
  frag.append(el('p',{},p.inheritance.mechanism||'Not documented.'));
  if(p.inheritance.releaseConditions) frag.append(el('p',{},p.inheritance.releaseConditions));
  if(p.inheritance.letterLocation) frag.append(el('p',{},el('strong',{},'Sealed instructions: '),p.inheritance.letterLocation));
  if(p.inheritance.legalDocs) frag.append(el('p',{},el('strong',{},'Legal documents: '),p.inheritance.legalDocs));

  frag.append(el('h3',{},'5 · Recovery procedure'));
  frag.append(el('p',{class:'muted'},'Generic PSBT flow — adapt to the coordinator named above. The technical helper must verify the actual spending path, timing requirements, and software compatibility before starting.'));
  frag.append(el('ol',{class:'rec'},
    el('li',{},'Gather the required number of keys for the quorum — each from its own location, ideally with the people named above. Never enter seeds into a website or give them to anyone who contacts you.'),
    el('li',{},'Locate a descriptor copy. Import it into the named coordinator (or Bitcoin Core / Sparrow as a fallback) to build a watch-only wallet. Rescan from the recorded height. Confirm the balance and that a recorded receiving address belongs to the wallet.'),
    el('li',{},'Create a SMALL test transaction to a destination the family fully controls. Cross to the signing device(s) by '+(p.signing.medium||'the recorded method')+'.'),
    el('li',{},'On each signer: verify destination, amount, and fee on the device screen. If anything differs from what the coordinator showed — stop.'),
    el('li',{},'Collect the required signatures (one signer per session; never load a quorum of seeds onto one machine), finalize, and broadcast from the online machine.'),
    el('li',{},'Only after the test confirms on-chain: repeat for the real amounts, preferably into a fresh wallet the heirs control.')));
  const rit=(p.signing.verifyRitual||[]).map(v=>(RITUAL.find(r=>r[0]===v)||[])[1]).filter(Boolean);
  if(rit.length){ frag.append(el('p',{class:'small muted'},'Owner’s standing verification ritual: '+rit.join(' · '))); }

  frag.append(el('h3',{},'6 · Maintenance (while the owner is alive)'));
  if(p.inheritance.heartbeat) frag.append(el('p',{},el('strong',{},'Timelock refresh: '),p.inheritance.heartbeat));
  if(p.inheritance.canary) frag.append(el('p',{},el('strong',{},'Canary: '),p.inheritance.canary));
  const reh=[];
  if(p.rehearsal.restoreDrill) reh.push('Restore drill: '+p.rehearsal.restoreDrill);
  if(p.rehearsal.familyWalkthrough) reh.push('Family walkthrough: '+p.rehearsal.familyWalkthrough);
  if(p.rehearsal.testSpendDate) reh.push('Last test spend: '+p.rehearsal.testSpendDate);
  if(reh.length) frag.append(el('p',{},el('strong',{},'Rehearsal status: '),reh.join(' · ')));
  if(p.rehearsal.notes) frag.append(el('p',{},el('strong',{},'Rehearsal notes: '),p.rehearsal.notes));
  if(p.ownerNotes) { frag.append(el('h3',{},'7 · Owner’s notes')); frag.append(el('p',{},p.ownerNotes)); }
  frag.append(el('p',{class:'tool-section muted'},'Generated by Map — an offline, single-file planning tool. This runbook contains no keys. Untested backups are stories: rehearse before it matters.'));
  appendRecoveryRecords(frag,p);
  return frag;
}

/* ---------- home (post-gate): file-first ---------- */
function renderHome(){
  const m=document.getElementById('folio-card');m.replaceChildren();
  m.append(el('h2',{},'Map'),el('p',{class:'step-intro'},'Write the recovery map for your family. Document the people, arrangements, backups and instructions they will need. No keys are created and no transactions are signed.'));
  m.append(el('div',{class:'note warn'},'Experimental offline guide. Sensitive information belongs only on a fully air-gapped machine. Never enter Bitcoin seeds, private keys, xpubs or wallet seed passphrases. Nothing is saved until you download an encrypted file.'));
  m.append(el('div',{class:'btn-row'},
    el('button',{class:'btn',id:'map-create',onclick:()=>{if(S.dirty&&!confirm('Replace the current guide? Unsaved changes will be lost.'))return;clearFolioSession();S.mode='wizard';S.step=0;markDirty();renderWizard();}},'Create inheritance guide'),
    el('button',{class:'btn ghost',id:'map-open',onclick:openFileFlow},'Open encrypted guide')));
  if(journalBridge?.available())m.append(el('button',{class:'btn ghost',id:'map-from-journal',onclick:()=>{try{const plan=readMapPage(journalBridge.read());clearFolioSession();S.plan=plan;S.origin='journal';showOpenChoice(plan);}catch(error){toast(error.message);}}},'Load selected Journal Map page'));
  if(S.mode!=='landing'||S.plan.meta.planName||S.dirty)m.append(el('button',{class:'btn ghost',id:'map-resume-current',onclick:()=>showOpenChoice(S.plan)},'Continue current Map'));
  m.append(el('p',{class:'hint'},'This native tool uses EntropyLab’s unchanged boot checks, privacy protections, appearance and End session controls. It never reads wallet keys. Journal exchange is explicit through its existing Notepad controls. Backups use the existing encrypted notebook format. Journal can load and save the Map page; this add-on renders it as forms and Heir View.'));
}

/* ---------- open file flow ---------- */
function openFileFlow(){
  const inp=el('input',{type:'file',accept:'.csp,.json,application/json'});
  inp.addEventListener('change',async()=>{
    const f=inp.files[0]; if(!f) return;
    const epoch=sessionEpoch;
    let env; try{ env=JSON.parse(await readFile(f)); if(!sessionCurrent(epoch))return; }catch(e){ if(sessionCurrent(epoch))toast('Not a readable JSON file'); return; }
    if(env && typeof env==='object' && !Array.isArray(env) && (env.entropylabJournalExport===1||env.magic==='VAULTFOLIO/1')){
      showDecrypt(env);
    } else if(env?.magic==='VAULTFOLIO/2') toast('Version 2 files require the desktop app. This native tool opens EntropyLab Folio files and legacy Folio v1 files. It never strips version 2 unlock methods.');
    else toast('Only encrypted Map JSON plans are supported');
  });
  inp.click();
}

function showDecrypt(env){
  const m=document.getElementById('folio-card'); m.innerHTML='';
  m.append(el('div',{class:'folio'},'File · Sealed plan'));
  m.append(el('h2',{},'This plan file is sealed'));
  m.append(el('p',{class:'step-intro'},'Enter the notebook backup’s password. It may be the same password you use in Journal. For a legacy Folio v1 backup, use its original passphrase.'));
  const w=el('div',{class:'field'}); w.append(el('label',{},'Passphrase'));
  const pi=el('input',{id:'folio-unlock-password',type:'password'}); w.append(pi); m.append(w);
  const prog=el('div',{class:'prog'},''); m.append(prog);
  const go=async()=>{
    const epoch=sessionEpoch;
    prog.className='prog';
    try{
      const credential=pi.value;pi.value='';
      const plan=await decryptPlan(env,credential,t=>prog.textContent=t);
      if(!sessionCurrent(epoch)){pi.value='';return;}
      const boundary=checkOpenBoundary(plan);
      if(boundary){ prog.className='prog err'; prog.textContent=boundary; pi.value=''; return; }
      pi.value=''; prog.textContent='';
      clearFolioSession();
      S.plan=plan;syncGuide();showOpenChoice(plan);
    }catch(e){ if(sessionCurrent(epoch)){prog.className='prog err';prog.textContent=e.message;} }
  };
  pi.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  m.append(el('div',{class:'btn-row'},el('button',{class:'btn',onclick:go},'Open')));
  window.scrollTo(0,0);
}
function showOpenChoice(plan){
  const m=document.getElementById('folio-card'); m.innerHTML='';
  m.append(el('div',{class:'folio'},'File · Opened'));
  m.append(el('h2',{},'Plan opened: '+(plan.meta.planName||'untitled')));
  m.append(el('p',{class:'step-intro'},'Choose a read-only beneficiary guide or the editor. Editing saves a new encrypted copy.'));
  m.append(el('div',{class:'btn-row'},
    el('button',{class:'btn',onclick:()=>{S.plan=plan;S.mode='wizard';S.step=0;S.dirty=false;syncGuide();renderWizard();}},'Plan Editor — update and re-encrypt'),
    el('button',{class:'btn ghost',onclick:()=>showHeir(plan)},'Beneficiary View — step-by-step guide')));
  window.scrollTo(0,0);
}
function safeGuidePlan(plan,reveal){
  const p=JSON.parse(JSON.stringify(plan));
  if(!reveal)for(const row of (p.accessRecords||[]))if(row.directAccess)row.directAccess='[Hidden: choose Show direct access details to reveal]';
  return p;
}
function recordText(p,section){
  return (p[section]||[]).map((row,i)=>'Record '+(i+1)+'\n'+recordFields(section,row).filter(([key])=>row[key]).map(([key,label])=>label+': '+row[key]).join('\n')).join('\n\n')||'Not recorded. Ask the executor or named helper.';
}
function beneficiarySteps(plan,reveal=false){
  const p=safeGuidePlan(plan,reveal);
  const steps=[
    ['Start here',`Plan: ${p.meta.planName||'Untitled'}\nOwner: ${p.meta.owner||'Not recorded'}\nPrepared: ${p.meta.created||'Not recorded'}\nJurisdiction: ${p.meta.jurisdiction||'Not recorded'}\nLegal notes: ${p.meta.legalNotes||'Not recorded'}\n\nTake this one step at a time. This guide explains the owner’s plan; it cannot sign or send bitcoin or verify legal authority. Never enter Bitcoin seeds or private keys here. Contact known people through independently verified channels.`],
    ['Contact the right people',`Executor: ${p.people.executor||'Not recorded'}\nTrustee: ${p.people.trustee||'Not recorded'}\nTechnical helper: ${p.people.helper||'Not recorded'}\n\n`+recordText(p,'lawyers')],
    ['Understand what exists',(p.vaults||[]).map(v=>`${v.name||'Unnamed arrangement'}\nPrimary signing rule: ${v.m||'?'} of ${v.n||'?'} independent keys. Copies of one key still count as one.\nSoftware: ${v.coordinator||'Not recorded'}\n${v.timelock?.enabled?'A delayed path is recorded: check its exact policy separately. This app does not check chain eligibility.':''}\n${v.notes||''}`).join('\n\n')||'No arrangement documented. Ask the executor.'],
    ['Find the backups',recordText(p,'backupRecords')+'\n\n'+(p.vaults||[]).flatMap(v=>(v.keys||[]).map(k=>`${v.name||'Vault'} / ${k.label||'Key'}: ${k.locations||'No hint recorded'}`)).join('\n')],
    ['Find the wallet map and journal','A watch-only wallet can view transactions but cannot sign. The configuration is the wallet map. Keep Bitcoin signing secrets out of this app.\n\n'+(p.backups.descriptorLocations||[]).map(d=>'Configuration copy: '+(d.where||'Location missing')+' / '+(d.format||'')).join('\n')+'\nWatch-only: '+(p.backups.watchOnly||'Not recorded')+'\nRescan: '+(p.backups.rescanHeight||'Not recorded')+'\n\n'+recordText(p,'accessRecords')],
    ['Check the recovery route','Legal release and Bitcoin spending conditions are different. Timelocks do not detect death or automatically send funds. Relative delays apply to individual outputs; logging in does not reset them. Ask the helper to verify eligibility.\n\n'+recordText(p,'recoveryPaths')+'\n\nOwner mechanism: '+(p.inheritance.mechanism||'Not recorded')+'\nRelease conditions: '+(p.inheritance.releaseConditions||'Not recorded')],
    ['Rehearse before moving funds','Follow the owner’s tested procedure with authorized people and a trusted helper. Use the actual wallet/signing tools, not this guide. Check configuration and known-address records. Verify destination, amount, fee and change; test with a small amount first.\n\nOwner procedure: '+(p.signing.coordinatorNotes||'Not recorded')+'\nTransfer medium: '+(p.signing.medium||'Not recorded')+'\nTested software: '+(p.backups.testedSoftware||'Not recorded')+'\nLast test: '+(p.rehearsal.testSpendDate||'Not recorded')+'\nRehearsal notes: '+(p.rehearsal.notes||'Not recorded')]
  ];
  for(const [i,row] of (p.instructions||[]).entries())steps.push([row.title||'Owner instruction '+(i+1),recordFields('instructions',row).filter(([k])=>k!=='title'&&row[k]).map(([k,label])=>label+': '+row[k]).join('\n\n')||'No action recorded. Ask the executor.']);
  steps.push(['If something is missing','Stop instead of guessing. Use recorded alternate contacts and routes. Opening this guide does not prove the bitcoin is recoverable.\n\nOwner’s notes: '+(p.ownerNotes||'Not recorded')+'\n\nClose the guide and fully shut down the live session when finished. This HTML edition cannot enforce RAM-only operation or guarantee memory erasure.']);
  return steps;
}
let concealHeir=()=>{};
function showHeir(plan){
  S.plan=plan;S.mode='heir';
  let current=0,reveal=false;
  concealHeir=()=>{if(reveal){reveal=false;paint();}};
  function paint(){
    const m=document.getElementById('folio-card');m.innerHTML='';
    m.append(el('div',{class:'heir-banner'},el('div',{class:'folio'},'Beneficiary view · read only'),el('h2',{},'Map · Heir View'),el('p',{},'One step at a time. This view does not change your saved plan.')));
    const steps=beneficiarySteps(plan,reveal),nav=el('div',{class:'btn-row'});
    plan.heirChecklist??={}; plan.heirNotes??='';
    if(current<steps.length){
      const done=el('input',{type:'checkbox','data-folio-check':String(current+1)}); done.checked=!!plan.heirChecklist[String(current+1)];
      done.addEventListener('change',()=>{plan.heirChecklist[String(current+1)]=done.checked;markDirty();});
      m.append(el('label',{},done,' Mark this step complete'));
    }
    const notes=el('textarea',{id:'folio-heir-notes','aria-label':'Beneficiary notes',placeholder:'What you tried, who you called…'}); notes.value=plan.heirNotes;
    notes.addEventListener('input',()=>{plan.heirNotes=notes.value;markDirty();});
    m.append(el('h3',{},'Your private working notes'),notes);
    m.append(el('p',{class:'small muted'},'Notes and progress stay in this session until you download a new encrypted copy. Keep the package passphrase separate.'));
    m.append(el('button',{class:'btn ghost',onclick:()=>{S.plan=plan;m.innerHTML='';renderExport(m);m.append(el('button',{class:'btn ghost',onclick:()=>showHeir(plan)},'Return to beneficiary guide'));}},'Back up notes and progress'));
    const picker=el('select',{'aria-label':'Recovery step'});
    [...steps,['Full reference (advanced)']].forEach(([title],i)=>picker.append(el('option',{value:i},(i+1)+'. '+title)));
    picker.value=String(current);picker.addEventListener('change',()=>{current=Number(picker.value);paint();});
    m.append(picker);
    if(current===steps.length)m.append(buildRunbook(safeGuidePlan(plan,reveal)));
    else{m.append(el('h3',{},steps[current][0]),el('pre',{class:'journal-log','data-private-value':''},steps[current][1]));}
    const toggle=el('input',{type:'checkbox','data-private-reveal':'','data-folio-reveal':''});toggle.checked=reveal;toggle.addEventListener('change',()=>{reveal=toggle.checked;paint();});
    m.append(el('label',{},toggle,' Show direct journal / watch-only access details on screen'));
    if(current>0)nav.append(el('button',{class:'btn ghost',onclick:()=>{current--;paint();}},'← Previous'));
    if(current<steps.length)nav.append(el('button',{class:'btn',onclick:()=>{current++;paint();}},'Next step →'));
    nav.append(el('button',{class:'btn ghost',onclick:()=>{concealNativeFolio();}},'Hide guide'));
    m.append(nav);window.scrollTo(0,0);
  }
  paint();
}


/* ---------- wizard shell ---------- */
function renderWizard(){
  const m=document.getElementById('folio-card'); m.innerHTML='';
  m.append(el('div',{class:'folio'},'Plan Editor · changes are kept only after encrypted export'));
  const bar=el('div',{class:'field'}),pick=el('select',{id:'folio-section','aria-label':'Guide section'});
  STEPS.forEach((section,i)=>pick.append(el('option',{value:i},String(i+1).padStart(2,'0')+' · '+section.title)));
  pick.value=String(S.step);pick.addEventListener('change',()=>{S.step=Number(pick.value);renderWizard();});
  bar.append(el('label',{},'Guide section'),pick);m.append(bar);
  const body=el('div',{}); m.append(body);
  const st=STEPS[S.step];

  if(st.custom==='start'){
    body.append(el('div',{class:'folio'},st.folio));
    body.append(el('h2',{},'Ground rules'));
    body.append(el('p',{class:'step-intro'},'Guide sections. Answer what you can; skip what is undecided — the risk review will flag gaps. Everything stays on this machine until you export.'));
    body.append(el('ul',{class:'checklist'},
      el('li',{},'I will never type seed words, private keys, or full xpubs into this tool'),
      el('li',{},'I am working on a machine I trust, ideally offline'),
      el('li',{},'I understand nothing is saved until I export the file at the end'),
      el('li',{},'The encrypted file is a map: whoever holds it learns the STRUCTURE, but still cannot spend without the physical keys')));
    body.append(el('div',{class:'note'},'Estimated time: 30–60 minutes if your setup exists; longer if this questionnaire reveals it is still a story. That is the point of the exercise.'));
  } else if(st.custom==='records'){
    renderRecords(body,st);
  } else if(st.custom==='vaults'){
    renderVaults(body);
  } else if(st.custom==='review'){
    renderReview(body);
  } else if(st.custom==='export'){
    renderExport(body);
  } else {
    body.append(el('div',{class:'folio'},st.folio));
    body.append(el('h2',{},st.title));
    body.append(el('p',{class:'step-intro'},st.intro));
    (st.fields||[]).forEach(f=>renderField(f,body));
    if(st.repeater) renderRepeater(st.repeater,body);
  }
  body.append(el('div',{class:'note warn'},el('strong',{},'Offline use only: '),
    'Do not enter sensitive information on a connected machine. Browser signals do not prove a physical air gap. Close the browser completely and shut down after use; cleanup is best effort.'));

  const nav=el('div',{class:'wiz-nav'});
  const prev=el('button',{class:'btn ghost',onclick:()=>{ if(S.step===0){ if(confirm('Leave the wizard? Unexported work will be lost.')) renderHome(); } else {S.step--;renderWizard();} }},S.step===0?'← Exit':'← Back');
  const pos=el('span',{class:'wiz-pos'},`Map ${String(S.step).padStart(2,'0')} / ${String(STEPS.length-1).padStart(2,'0')}`);
  const next=el('button',{class:'btn',onclick:()=>{ if(S.step<STEPS.length-1){S.step++;renderWizard();window.scrollTo(0,0);} }},S.step===STEPS.length-1?'Done':'Continue →');
  nav.append(prev,pos,next);
  m.append(nav);
  window.scrollTo(0,0);
}

// HTML policy: warnings only; no Wi-Fi, Bluetooth or OS environment gate.
function isSyntheticPlan(p){return p?.meta?.syntheticTest===true;}
function checkOpenBoundary(p){return isSyntheticPlan(p)?'Synthetic test file: use the repository test edition.':null;}
function prepareExportPlan(p){if(isSyntheticPlan(p))throw new Error('Use the synthetic test edition');return JSON.parse(JSON.stringify(p));}
/* Offline catalog: generated from folio_catalog.py; reviewed 2026-10-04.
   Presets describe arrangements, not endorsements or compatibility guarantees. */
const PROFILES = [{"name": "Custom / existing arrangement", "m": 2, "n": 3, "coordinator": "Other / undecided", "note": "Document the arrangement you actually tested; edit every suggested value.", "source": ""}, {"name": "Single signature + separate physical backups", "m": 1, "n": 1, "coordinator": "Other / undecided", "note": "Multiple copies of one seed do not make multisig. Record seed format and separate passphrase custody.", "source": "https://trezor.io/guides/backups-recovery/general-standards/how-to-use-a-wallet-backup"}, {"name": "DIY 2-of-3 multisig (Sparrow)", "m": 2, "n": 3, "coordinator": "Sparrow Wallet", "note": "Three independent signing keys. Preserve wallet configuration / descriptor copies and test recovery.", "source": "https://sparrowwallet.com/features/"}, {"name": "DIY 3-of-5 multisig (Sparrow)", "m": 3, "n": 5, "coordinator": "Sparrow Wallet", "note": "Five independent keys; three authorize spending. Document who can reach each key, including backups.", "source": "https://sparrowwallet.com/features/"}, {"name": "Bitcoin Core / Yeti 2.0 style", "m": 3, "n": 7, "coordinator": "Bitcoin Core (Yeti-style)", "note": "Starting values only: confirm the exact guide revision and your actual quorum. Record offline machines, descriptor copies, archival media and rehearsal dates.", "source": "https://github.com/bowlarbear/yeti-2.0"}, {"name": "Specter Desktop multisig", "m": 2, "n": 3, "coordinator": "Specter", "note": "Editable example quorum. Record node, signer interoperability and exported wallet configuration.", "source": "https://docs.specter.solutions/desktop/multisig-guide/"}, {"name": "Electrum multisig", "m": 2, "n": 3, "coordinator": "Electrum", "note": "Editable example quorum. Record exact seed format; an Electrum seed is not automatically BIP39.", "source": "https://electrum.org/"}, {"name": "Nunchuk self-managed multisig", "m": 2, "n": 3, "coordinator": "Nunchuk", "note": "Editable example quorum. Preserve BSMS / wallet configuration and independent recovery instructions.", "source": "https://resources.nunchuk.io/getting-started/multidevicemultisig/"}, {"name": "Liana / Miniscript timed recovery", "m": 1, "n": 1, "coordinator": "Liana", "timelock": true, "note": "M/N describes the primary path ONLY. Separately record each delayed recovery path, key labels, threshold, relative delay and refresh procedure. A timer is not proof of death.", "source": "https://wizardsardine.com/blog/what-is-liana/"}, {"name": "Unchained collaborative custody", "m": 2, "n": 3, "coordinator": "Unchained", "note": "Common example; verify your contracted quorum. Record provider-held keys, legal contact and recovery without the provider.", "source": "https://help.unchained.com/what-multisig-quorum-should-i-choose"}, {"name": "Casa collaborative custody", "m": 2, "n": 3, "coordinator": "Casa", "note": "Editable example, not a claim about your subscription. Confirm key count, recovery and inheritance process in your current contract.", "source": "https://casa.io/inheritance"}, {"name": "Nunchuk assisted / autonomous inheritance", "m": 2, "n": 4, "coordinator": "Nunchuk", "note": "Example only; choose your actual plan. Distinguish provider-enforced off-chain release from on-chain Miniscript recovery. Record beneficiary requirements without secrets.", "source": "https://nunchuk.io/inheritance"}];
const RECORD_FIELDS = {"lawyers": [["name", "Lawyer / firm / trusted contact", null], ["role", "Role", ["Lawyer", "Executor", "Trustee", "Notary", "Technical helper", "Backup custodian", "Other / custom"]], ["contact", "Known contact method / independently verified channel", null], ["jurisdiction", "Jurisdiction / engagement reference (optional)", null], ["access", "What access do they have?", ["No access; advice only", "Location hints only", "Encrypted package only", "Package unlock credential only", "Package AND unlock credential", "One Bitcoin key backup", "Several Bitcoin key backups", "Descriptor / configuration only", "Other / custom"]], ["items", "Vault / key / backup labels they can access (no secrets)", null], ["release", "Release conditions", ["Owner request", "Death documentation + executor authority", "Incapacity documentation", "Trust instructions", "Joint written approval", "Other / custom", "Not yet agreed"]], ["proof", "Required documents and where instructions are held (hints)", null], ["alternate", "Successor if firm closes / contact unavailable", null], ["reviewed", "Last verified date / acknowledgment", null], ["notes", "Custom conditions or limits (no secret values)", null], ["guideFile", "Encrypted guide copy / safety deposit box hint", null], ["appCopy", "Offline program, dependencies and instructions location / hint", null], ["unlockLabel", "Which guide unlock method label does this custodian hold? (no secret)", null], ["releaseDate", "Requested release date / event (advisory; not cryptographically enforced)", null], ["discovery", "Where is the non-secret discovery note for family?", null]], "backupRecords": [["label", "Backup label", null], ["vault", "Related vault / key label", null], ["scheme", "Backup / access method", ["BIP39 seed backup", "BIP39 + separately held passphrase", "SLIP39 single share", "SLIP39 threshold shares (one signing key)", "Seed XOR (all parts required; one signing key)", "Encrypted device backup", "Electrum seed format", "Bitcoin Core wallet backup", "Descriptor / BSMS / wallet configuration", "Package YubiKey", "Other / custom"]], ["medium", "Physical medium", ["Steel / metal", "Paper", "Paper QR (SeedQR)", "MicroSD", "USB drive", "Archival optical disc", "Hardware device", "Sealed legal packet", "Other / custom"]], ["custodian", "Who holds it / can retrieve it?", null], ["site", "Site alias (e.g. Site A; same alias = same failure location)", null], ["hint", "Family location hint (no exact address required)", null], ["locator", "Who knows the full location / next clue?", null], ["conditions", "Access prerequisites / release conditions (no codes)", null], ["fallback", "Alternate contact / backup route if inaccessible", null], ["tested", "Last restore or access rehearsal date", null], ["notes", "Custom details / compatible restore tool version", null]], "recoveryPaths": [["label", "Recovery path name / related vault", null], ["mechanism", "Release mechanism", ["Human / legal release", "Provider-enforced off-chain delay", "Bitcoin on-chain relative timelock", "Bitcoin on-chain absolute timelock", "Threshold seed-share reconstruction", "Other / custom"]], ["keys", "Required key or share labels (never secret values)", null], ["threshold", "Required count / total count for THIS path", null], ["delay", "Delay / units / starting event (if any)", null], ["refresh", "How and when to refresh / responsible person", null], ["dependencies", "Provider, software and configuration-copy dependencies", null], ["fallback", "Recovery if provider / lawyer / owner is unavailable", null], ["tested", "Last test date and result", null], ["scenario", "When is this route needed?", ["Owner death", "Owner incapacity", "Both primary contacts unavailable", "One key or site lost", "Provider unavailable", "Lost guide unlock key", "Other / custom"]], ["stop", "Stop conditions / who resolves disagreement", null]], "accessRecords": [["label", "Access item / recognizable name", null], ["kind", "What does this help heirs access?", ["EntropyLab journal", "Watch-only wallet", "Wallet coordinator / configuration backup", "Bitcoin node / watch-only server", "Encrypted guide copy", "Legal documents / will / trust", "Backup inventory / location map", "Encrypted document archive", "Provider account / support route", "Offline computer / live USB instructions", "Other / custom"]], ["exists", "Status", ["Available and tested", "Available; not tested", "Planned", "Not applicable", "Unknown"]], ["where", "Where to find it (path / device alias / location hint)", null], ["custodian", "Who can help / who controls access?", null], ["mode", "How should access instructions be recorded?", ["Hint only", "Direct access details inside encrypted guide"]], ["hint", "Password / access hint or separate custodian (not a wallet seed)", null], ["requirements", "Required device, software/version, account or second factor (hints allowed)", null], ["fallback", "If unavailable: alternate copy, contact or access route", null], ["tested", "Last successful access test / person who tested it", null], ["offlineCopy", "Offline copy of required software / manuals / verification instructions", null], ["renewal", "Renewal, maintenance or account-continuity responsibility", null], ["notes", "Additional instructions / custom questions", null]], "instructions": [["title", "Step title (records are followed in the order added)", null], ["audience", "Who should do this?", ["Beneficiary", "Executor", "Trustee", "Technical helper", "Joint action", "Other / custom"]], ["appliesTo", "Related vault / backup / access-item labels", null], ["before", "Before starting: prerequisites / approvals / people needed", null], ["action", "What to do, in plain language (instructions, not Bitcoin secrets)", null], ["success", "How to know this step worked", null], ["stop", "When to stop and ask for help", null], ["fallback", "If this fails: alternate contact / route", null], ["reference", "Offline manual / file / tested procedure location or hint", null]]};
const EXTRA_BACKUP_FIELDS = {"SLIP39 threshold shares (one signing key)": [["threshold", "Shares required / total; group thresholds if used", null], ["groups", "Share labels and group/site aliases (no share words)", null]], "Seed XOR (all parts required; one signing key)": [["threshold", "Number of parts required (all parts)", null], ["groups", "Part labels / independent site aliases", null]], "Package YubiKey": [["device", "Key label / model / configured OTP slot (no secret)", null], ["lossPlan", "If this guide key is lost: separately protected guide-copy location hint", null]], "BIP39 + separately held passphrase": [["separate", "Passphrase custodian / location hint (never the passphrase)", null]], "Encrypted device backup": [["separate", "Backup-password custodian / hint (never the password)", null]]};
const ACCESS_EXTRA = {"EntropyLab journal": [["journalFormat", "Journal format / application version / compatible reader", null], ["journalCopy", "Independent journal backup or export location / hint", null], ["journalPurpose", "What the journal documents (description only; no Bitcoin secret material)", null]], "Watch-only wallet": [["walletSoftware", "Watch-only app / version / device alias", null], ["walletNetwork", "Bitcoin network", ["Mainnet", "Testnet", "Signet", "Regtest", "Unknown"]], ["walletConfig", "Descriptor / wallet-configuration copy location or hint", null], ["walletRescan", "Birth height/date or rescan instructions", null], ["walletNode", "Node/server connection instructions or separate hint", null], ["walletCheck", "Where a known address-verification record is kept", null]]};
const ACCESS_DIRECT = [["directAccess", "Optional guide/journal/watch-only access details (encrypted; NOT Bitcoin seeds or private keys)", null]];
const RECORD_TITLES = {lawyers:'Lawyers & backup custodians',backupRecords:'Backup inventory & family hints',recoveryPaths:'Alternate recovery paths',accessRecords:'Journal & watch-only access',instructions:'Family recovery steps'};
for(const section of Object.keys(RECORD_FIELDS)){
  STEPS.splice(STEPS.length-2,0,{id:section,title:RECORD_TITLES[section],custom:'records',section});
}
let recordFieldId=0;
function recordFields(section,row){
  return [...RECORD_FIELDS[section],...(section==='backupRecords'?(EXTRA_BACKUP_FIELDS[row.scheme]||[]):[]),
    ...(section==='accessRecords'?(ACCESS_EXTRA[row.kind]||[]):[]),
    ...(section==='accessRecords'&&row.mode==='Direct access details inside encrypted guide'?ACCESS_DIRECT:[])];
}
function renderRecords(host,step){
  host.append(el('h2',{},step.title),el('p',{class:'step-intro'},'Use aliases and family clues; exact locations are optional. Never enter Bitcoin seeds or private keys. Use hints by default; optional direct access details belong only in the access section. Keep the clues needed to find and open this package outside it too.'));
  const rows=S.plan[step.section]??(S.plan[step.section]=[]);
  if(step.section==='accessRecords')host.append(el('div',{class:'note warn'},'Direct access details appear in the decrypted heir guide. Hints are the default. Switching to hint-only deletes the direct credential from the current plan. Never enter Bitcoin seeds, private keys or wallet seed passphrases.'));
  if(step.section==='backupRecords') host.append(el('div',{class:'note'},'SLIP39 shares and Seed XOR parts reconstruct one signing key. They are not independent multisig signers.'));
  rows.forEach((row,i)=>{
    const box=el('div',{class:'note'});box.append(el('h3',{},'Record '+(i+1)));
    const fields=recordFields(step.section,row);
    fields.forEach(([key,label,options])=>{
      const wrap=el('div',{class:'field'}), id='record-'+(++recordFieldId);
      const input=el('input',{type:key==='directAccess'?'password':'text',id}); input.value=row[key]||'';
      wrap.append(el('label',{for:id},label),input);
      if(options){
        const list=el('datalist',{id:id+'-options'});options.forEach(x=>list.append(el('option',{value:x})));
        input.setAttribute('list',id+'-options');wrap.append(list);
      }
      input.addEventListener('input',()=>{row[key]=input.value;if(key==='mode'&&input.value!=='Direct access details inside encrypted guide')delete row.directAccess;markDirty();});
      if(['scheme','kind','mode'].includes(key)) input.addEventListener('change',()=>renderWizard());
      box.append(wrap);
    });
    box.append(el('button',{class:'btn ghost',onclick:()=>{if(confirm('Remove this record?')){rows.splice(i,1);markDirty();renderWizard();}}},'Remove record'));
    host.append(box);
  });
  host.append(el('button',{class:'btn',onclick:()=>{rows.push(step.section==='accessRecords'?{mode:'Hint only'}:{});markDirty();renderWizard();}},'+ Add another record'));
}
function renderPresetPicker(host){
  host.append(el('div',{class:'note'},'Editable presets, reviewed 2026-10-04. Verify your actual quorum, software, firmware and provider agreement. Custom arrangements are supported.'));
  const picker=el('select',{});PROFILES.forEach((p,i)=>picker.append(el('option',{value:i},p.name)));
  host.append(picker,el('button',{class:'btn ghost',onclick:()=>{
    const p=PROFILES[Number(picker.value)];
    S.plan.vaults.push({name:p.name,m:p.m,n:p.n,coordinator:p.coordinator,notes:p.note,
      profileSource:p.source,profileReviewed:'2026-10-04',
      script:p.timelock?'Taproot / Miniscript (Liana-style leaves)':p.n===1?'Single-signature (one key)':'P2WSH — wsh(sortedmulti(...))',
      timelock:{enabled:!!p.timelock,delay:''},keys:[]});
    markDirty();renderWizard();
  }},'Add vault from preset'));
}
function appendRecoveryRecords(host,p){
  for(const [section,fields] of Object.entries(RECORD_FIELDS)){
    if(!(p[section]||[]).length) continue;
    host.append(el('h3',{},RECORD_TITLES[section]));
    (p[section]||[]).forEach((row,i)=>{
      host.append(el('h4',{},'Record '+(i+1)));
      const all=recordFields(section,row);
      all.forEach(([key,label])=>{if(row[key])host.append(el('p',{},el('strong',{},label+': '),String(row[key])));});
    });
  }
}


let root=null;
export function initNativeFolio(bridge){
  journalBridge=bridge;
  root=document.getElementById('folio-card');
  if(!root)return;
  root.setAttribute('translate','no');
  const clear=()=>{clearFolioSession();renderHome();concealNativeFolio();};
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',e=>{if(e.persisted)clear();});
  renderHome();
}
export function revealNativeFolio(){
  if(!root)return;
  root.hidden=false;
  document.getElementById('folio-concealed').hidden=true;
}
export function concealNativeFolio(){
  if(!root)return;
  concealHeir();
  root.hidden=true;
  document.getElementById('folio-concealed').hidden=false;
}
export const folioNativeApi={encryptPlan,decryptPlan,prepareBrowserPlan,blankPlan,clearFolioSession,sessionCurrent,getPlan:()=>S.plan};

export function adoptJournalFolio(guide){
  clearFolioSession();
  S.plan=guide?prepareBrowserPlan(guide):blankPlan();
  if(guide){S.origin='journal';syncGuide();}
  renderHome();
}
export function lockJournalFolio(){
  // Only explicitly independent sessions survive a Journal lock. Unknown origins
  // fail closed. Global cleanup always clears both origins via initNativeFolio.
  if(S.origin==='independent'){
    concealNativeFolio();
    toast('Journal locked — Map work untouched; download an encrypted copy to keep it.');
    return;
  }
  clearFolioSession();renderHome();concealNativeFolio();
}

export function currentMap(){return S.plan;}
export function showMapEditor(){S.mode='wizard';renderWizard();}

export function showMapHome(){sessionEpoch++;document.getElementById('folio-card')?.querySelectorAll('input[type="password"]').forEach(field=>{field.value='';});renderHome();}
