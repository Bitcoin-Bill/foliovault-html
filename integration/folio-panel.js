// Folio is isolated from EntropyLab's wallet state. The only cross-frame
// message is a fixed clear command. No wallet, journal or guide data is shared.
export function mountFolioPanel({doc=document,win=window,html}) {
  const host=doc.getElementById('workspace');
  if(!host)return null;
  const openButton=doc.createElement('button');openButton.type='button';openButton.className='btn secondary';openButton.textContent='Folio guide';openButton.setAttribute('aria-controls','folio-companion');
  const panel=doc.createElement('section');panel.id='folio-companion';panel.className='card no-print';panel.hidden=true;
  const closeButton=doc.createElement('button');closeButton.type='button';closeButton.className='btn secondary';closeButton.textContent='Close Folio and clear its session';
  panel.append(closeButton);host.append(openButton);
  (doc.getElementById('workspace-panel')||doc.body).append(panel);
  let iframe=null,url=null;
  const close=()=>{
    if(iframe){iframe.contentWindow?.postMessage({type:'folio:clear'},'*');iframe.remove();iframe=null;}
    if(url){win.URL.revokeObjectURL(url);url=null;}
    panel.hidden=true;openButton.setAttribute('aria-expanded','false');
  };
  const open=()=>{
    if(iframe){iframe.focus();return;}
    url=win.URL.createObjectURL(new win.Blob([html],{type:'text/html'}));
    iframe=doc.createElement('iframe');iframe.title='FolioVault offline inheritance guide';
    iframe.setAttribute('sandbox','allow-scripts allow-downloads');
    iframe.setAttribute('referrerpolicy','no-referrer');
    iframe.setAttribute('allow',"camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'");
    iframe.style.width='100%';iframe.style.height='80vh';iframe.style.border='0';
    iframe.src=url;panel.append(iframe);panel.hidden=false;openButton.setAttribute('aria-expanded','true');
  };
  openButton.addEventListener('click',open);
  closeButton.addEventListener('click',()=>{if(win.confirm('Close Folio? Work not downloaded in an encrypted copy will be lost.'))close();});
  win.addEventListener('pagehide',close);
  win.addEventListener('pageshow',e=>{if(e.persisted)close();});
  return {open,close,frame:()=>iframe};
}
