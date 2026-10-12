// Vault Folio document validation (MIT; see Folio license).
export function blankPlan(){
  return {
    meta:{ app:'Map', version:1, created:new Date().toISOString().slice(0,10), planName:'', owner:'', jurisdiction:'', legalNotes:'' },
    people:{ executor:'', trustee:'', helper:'', heirs:[] },        // heir: {name, relation, role, contact, holdsKeyNow}
    vaults:[],                                                       // vault: {name, tier, m, n, script, coordinator, timelock:{enabled,delay,refreshNote}, notes, keys:[] }
    signing:{ medium:'', verifyRitual:[], testSpend:'', coordinatorNotes:'' },
    backups:{ descriptorLocations:[], watchOnly:'', rescanHeight:'', sampleAddresses:'', testedSoftware:'' },
    inheritance:{ mechanism:'', releaseConditions:'', legalDocs:'', letterLocation:'', heartbeat:'', canary:'' },
    rehearsal:{ restoreDrill:'', familyWalkthrough:'', testSpendDate:'', notes:'' },
    ownerNotes:'',
  };
}
export function prepareBrowserPlan(input){
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Invalid guide document');
  function inspect(value,depth=0){
    if(depth>30) throw new Error('Guide nesting limit exceeded');
    if(value && typeof value==='object'){
      if(Array.isArray(value) && value.length>500) throw new Error('Too many records');
      for(const [key,item] of Object.entries(value)){
        if(['__proto__','constructor','prototype'].includes(key)) throw new Error('Invalid guide property');
        inspect(item,depth+1);
      }
    }
  }
  inspect(input);
  const p=JSON.parse(JSON.stringify(input)), defaults=blankPlan();
  const object=v=>v && typeof v==='object' && !Array.isArray(v);
  const rows=v=>Array.isArray(v)&&v.every(object);
  for(const [key,value] of Object.entries(defaults)){
    if(!(key in p)) p[key]=value;
    if(object(value)){
      if(!object(p[key])) throw new Error('Invalid section: '+key);
      for(const [field,initial] of Object.entries(value)){
        if(!(field in p[key])) p[key][field]=initial;
        const actual=p[key][field];
        if(Array.isArray(initial)?!Array.isArray(actual):typeof actual!==typeof initial) throw new Error('Invalid field: '+field);
      }
    }else if(Array.isArray(value)?!rows(p[key]):typeof p[key]!==typeof value) throw new Error('Invalid section: '+key);
  }
  if(!rows(p.people.heirs)||!rows(p.backups.descriptorLocations)||p.signing.verifyRitual.some(x=>typeof x!=='string')) throw new Error('Invalid guide records');
  for(const section of ['lawyers','backupRecords','recoveryPaths','accessRecords','instructions']){
    p[section]??=[];
    if(!rows(p[section])||p[section].some(row=>Object.values(row).some(x=>typeof x!=='string'))) throw new Error('Invalid records: '+section);
  }
  for(const v of p.vaults){
    for(const key of ['m','n']) if(v[key]!=null&&v[key]!==''&&(!Number.isInteger(v[key])||v[key]<1||v[key]>100)) throw new Error('Invalid signing count');
    v.keys??=[];
    if(!rows(v.keys)||Object.values(v).some(x=>x!=null&&typeof x==='object'&&!Array.isArray(x)&&!object(x))) throw new Error('Invalid vault');
    for(const key of ['name','tier','script','coordinator','notes']) if(key in v&&typeof v[key]!=='string') throw new Error('Invalid vault text');
    if(v.timelock!=null&&(!object(v.timelock)||typeof v.timelock.enabled!=='boolean')) throw new Error('Invalid timelock');
    for(const row of v.keys) if(Object.values(row).some(x=>typeof x!=='string')) throw new Error('Invalid key record');
  }
  for(const row of [...p.people.heirs,...p.backups.descriptorLocations]) if(Object.values(row).some(x=>typeof x!=='string'&&typeof x!=='boolean')) throw new Error('Invalid text record');
  p.heirNotes??=''; p.heirChecklist??={};
  if(typeof p.heirNotes!=='string'||!object(p.heirChecklist)||Object.values(p.heirChecklist).some(x=>typeof x!=='boolean')) throw new Error('Invalid heir progress');
  return p;
}

