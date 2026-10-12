import test from 'node:test';
import assert from 'node:assert/strict';
import { mountFolioPanel } from '../integration/folio-panel.js';
// Contract: opening creates an isolated, local-only companion; teardown revokes
// its blob and removes it; no plan/credential enters the parent page.
class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.events={};this.attributes={};this.hidden=false;this.style={};}
  append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parent=this;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.events[k]=fn;}
  remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  focus(){}
}
test('Folio frame is opaque and torn down at the host lifecycle boundary',()=>{
  const host=new Node('div'),body=new Node('body'),events={},revoked=[],messages=[];
  const doc={body,createElement(tag){const n=new Node(tag);if(tag==='iframe')n.contentWindow={postMessage:(...args)=>messages.push(args)};return n;},getElementById:id=>id==='workspace'?host:null};
  const win={addEventListener:(k,fn)=>events[k]=fn,URL:{createObjectURL:()=> 'blob:local-fixture',revokeObjectURL:v=>revoked.push(v)},Blob:class{},confirm:()=>true};
  const api=mountFolioPanel({doc,win,html:'<html>public fixture</html>'});
  api.open();
  const frame=api.frame();
  assert.equal(frame.attributes.sandbox,'allow-scripts allow-downloads');
  assert.equal(frame.src,'blob:local-fixture');
  assert.equal(frame.attributes.referrerpolicy,'no-referrer');
  events.pagehide();
  assert.equal(api.frame(),null);
  assert.deepEqual(revoked,['blob:local-fixture']);
  assert.deepEqual(messages,[[{type:'folio:clear'},'*']]);
  api.open();assert(api.frame());api.close();assert.equal(api.frame(),null);
});
