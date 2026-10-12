// QA ONLY: never imported by the shipping entry. Invented data only.
// Bounded, in-memory event metadata. No key characters, field values, clipboard,
// browser storage, downloads or network requests.
(() => {
  const lines=[];
  const start=performance.now();
  let output,lastField=null;
  const describe=node=>{
    if(!node)return 'none';
    if(node===window)return 'window';
    if(node===document)return 'document';
    // App-owned control identifiers only; never textContent, value, or key data.
    return node.tagName?.toLowerCase()+(node.id?'#'+node.id:'');
  };
  const snapshot=()=>lastField ? 'field connected='+lastField.isConnected+' disabled='+lastField.disabled+' readonly='+lastField.readOnly+' active='+(document.activeElement===lastField) : 'no field';
  const record=(kind,target,related)=>{
    lines.push(((performance.now()-start)/1000).toFixed(2)+'s '+kind+' '+describe(target)+(related?' → '+describe(related):'')+' | document focus='+document.hasFocus()+' | '+snapshot());
    if(lines.length>12)lines.shift();
    if(output){output.value=lines.join('\n');output.scrollTop=output.scrollHeight;}
  };
  function install(){
    const outer=document.getElementById('map-addon-panel');if(!outer||output)return;
    const box=document.createElement('details');box.open=true;
    const title=document.createElement('summary');title.textContent='QA ONLY — typing diagnostic (invented data only)';
    output=document.createElement('textarea');output.rows=8;output.readOnly=true;output.setAttribute('aria-label','Focus diagnostic log');
    const hint=document.createElement('p');hint.textContent='After typing stops, take a screenshot of this log. It records focus and event types, never what you type.';
    box.append(title,hint,output);outer.prepend(box);observer.disconnect();
    record('ready',document);
  }
  const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true});install();
  for(const type of ['focusin','focusout','pointerdown','keydown','beforeinput','input'])document.addEventListener(type,e=>{
    if(!e.target.closest?.('#folio-card'))return;
    if(e.target.matches('input,textarea'))lastField=e.target;
    record(type,e.target,e.relatedTarget);
    if(type==='pointerdown')for(const delay of [250,1000])setTimeout(()=>record('after '+delay+'ms',document.activeElement),delay);
  },true);
  for(const type of ['focus','blur'])window.addEventListener(type,()=>record(type,window));
  document.addEventListener('visibilitychange',()=>record('visibility '+document.visibilityState,document));
  window.addEventListener('pagehide',()=>{lines.length=0;lastField=null;if(output)output.value='Session ended';});
})();
