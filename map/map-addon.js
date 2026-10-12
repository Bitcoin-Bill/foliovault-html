// Optional add-on. No EntropyLab function, crypto primitive or data schema is replaced.
import {initNativeFolio,revealNativeFolio,concealNativeFolio,folioNativeApi,currentMap,showMapHome,lockJournalFolio} from './map-native.js';
import {initConcealOnLeave} from './conceal-on-leave.js';
let installed=null;
export function journalMapBridge(doc=document){
 const unlocked=()=>Boolean(doc.getElementById('journal-global-download')&&!doc.getElementById('journal-global-download').disabled);
 return {
  available:()=>Boolean(doc.querySelector('[data-workspace="journal"]')),
  read(){if(!unlocked())throw Error('Open a Journal and select its Map notepad page first.');return doc.getElementById('journal-notes-text')?.value||'';},
  store(text){
   if(!unlocked())throw Error('Create or open a Journal before storing a Map page.');
   let field=doc.getElementById('journal-notes-text');
   if(!field)throw Error('This EntropyLab build has no Journal Notepad.');
   if(!field.value.startsWith('ENTROPYLAB-MAP/1\n')){doc.getElementById('add-journal-page').click();field=doc.getElementById('journal-notes-text');if(field.value)throw Error('A new empty notebook page could not be created.');}
   field.value=text;field.dispatchEvent(new Event('input',{bubbles:true}));
  }
 };
}
export function installMapAddon(doc=document,win=window){
 const tryInstall=()=>{
  const tabs=doc.getElementById('workspace-tabs'),panel=doc.getElementById('workspace-panel');
  // Runtime tabs are created only after the original host boot checks pass.
  if(!tabs?.querySelector('[data-workspace]')||!panel||doc.getElementById('map-addon-tab'))return;
  const button=doc.createElement('button');button.type='button';button.id='map-addon-tab';button.className='workspace-tab';button.setAttribute('role','tab');button.setAttribute('aria-controls','map-addon-panel');button.setAttribute('aria-selected','false');button.textContent='Map';tabs.append(button);
  const outer=doc.createElement('section');outer.id='map-addon-panel';outer.hidden=true;outer.setAttribute('role','tabpanel');outer.setAttribute('aria-labelledby',button.id);outer.setAttribute('translate','no');
  const label=doc.createElement('p');label.className='tool-intro edge-note is-info';label.textContent='Map · optional inheritance add-on. Offline use only. Built separately; EntropyLab’s original source and engine are unchanged.';
  const cover=doc.createElement('div');cover.id='folio-concealed';cover.className='edge-note is-private';cover.hidden=true;
  const resume=doc.createElement('button');resume.type='button';resume.className='btn secondary';resume.textContent='Resume Map';resume.addEventListener('click',revealNativeFolio);cover.append(resume);
  const card=doc.createElement('div');card.id='folio-card';card.className='card tool-card';
  const status=doc.createElement('p');status.id='folio-status';status.className='field-note';status.setAttribute('role','status');
  const home=doc.createElement('button');home.type='button';home.className='btn secondary';home.textContent='Map home';home.id='map-home';home.addEventListener('click',()=>{showMapHome();revealNativeFolio();});
  outer.append(label,home,cover,card,status);panel.append(outer);
  let visible=false,snapshot=new Map(),tabSnapshot=[];
  const close=()=>{if(!visible)return;visible=false;concealNativeFolio();outer.hidden=true;for(const [node,hidden] of snapshot)if(node.isConnected)node.hidden=hidden;snapshot.clear();for(const [tab,active,selected] of tabSnapshot){tab.classList.toggle('active',active);tab.setAttribute('aria-selected',selected);}tabSnapshot=[];button.classList.remove('active');button.setAttribute('aria-selected','false');};
  const open=()=>{
   if(visible){revealNativeFolio();return;}snapshot=new Map([...panel.children].filter(n=>n!==outer).map(n=>[n,n.hidden]));for(const node of snapshot.keys())node.hidden=true;
   tabSnapshot=[...tabs.querySelectorAll('[data-workspace]')].map(tab=>[tab,tab.classList.contains('active'),tab.getAttribute('aria-selected')]);for(const [tab] of tabSnapshot){tab.classList.remove('active');tab.setAttribute('aria-selected','false');}
   visible=true;outer.hidden=false;button.classList.add('active');button.setAttribute('aria-selected','true');revealNativeFolio();
  };
  button.addEventListener('click',open);
  tabs.addEventListener('click',e=>{if(e.target.closest('[data-workspace]'))close();},true);
  tabs.addEventListener('keydown',e=>{
    const originals=[...tabs.querySelectorAll('[data-workspace]')],first=originals[0],last=originals.at(-1);
    let target=null;
    if(e.key==='End')target=button;
    else if(e.target===button&&e.key==='ArrowLeft')target=last;
    else if(e.target===button&&(e.key==='ArrowRight'||e.key==='Home'))target=first;
    else if(e.target===last&&e.key==='ArrowRight')target=button;
    else if(e.target===first&&e.key==='ArrowLeft')target=button;
    if(target){e.preventDefault();e.stopImmediatePropagation();target.click();target.focus();}
  },true);
  initNativeFolio(journalMapBridge(doc));
  initConcealOnLeave({conceal:concealNativeFolio,idleMs:5*60*1000,win,doc});
  let journalWasOpen=!doc.getElementById('journal-global-download')?.disabled;
  new MutationObserver(()=>{
   const now=!doc.getElementById('journal-global-download')?.disabled;
   if(journalWasOpen&&!now)lockJournalFolio();
   journalWasOpen=now;
  }).observe(doc.getElementById('journal-global-download'),{attributes:true,attributeFilter:['disabled']});
  win.addEventListener('pagehide',()=>{close();folioNativeApi.clearFolioSession();});
  installed={open,close};
 };
 new MutationObserver(tryInstall).observe(doc.documentElement,{childList:true,subtree:true});tryInstall();
 return {get installed(){return installed;}};
}
