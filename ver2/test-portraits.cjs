// Deterministic renderer/loader tests, not a real browser or Cloudflare test.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
class Node {
 constructor(){this.style={};this.dataset={};this.children=[];this.isConnected=true;this.attrs={};this.classList={toggle:(name,on)=>{this.attrs[name]=on}}}
 setAttribute(key,value){this.attrs[key]=value}
 appendChild(child){if(child.parentNode){child.parentNode.children=child.parentNode.children.filter(n=>n!==child)}child.parentNode=this;this.children.push(child)}
}
function setup(){
 const requests=[],timers=new Map(),warnings=[];let timerId=0;
 class Image extends Node {
  constructor(){super();this.decoded=false;this.decodePromise=new Promise((resolve,reject)=>{this.resolveDecode=()=>{this.decoded=true;resolve()};this.rejectDecode=reject})}
  set src(url){this.url=url;requests.push(this)}get src(){return this.url}
  decode(){this.decodeCalls=(this.decodeCalls||0)+1;return this.decodePromise}
  load(){this.naturalWidth=347;this.naturalHeight=444;return this.onload?.()}
  fail(){this.onerror?.(new Error('simulated 404'))}
 }
 const context={window:null,console:{warn:(...v)=>warnings.push(v)},Image,Date,Set,setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)};context.window=context;
 vm.createContext(context);
 for(const file of ['case02','ui'])vm.runInContext(fs.readFileSync(`ver2/js/${file}.js`,'utf8'),context);
 const ui=context.UI;
 const ready=async(index,url=ui.image(index))=>{const img=requests.find(r=>r.src===url);assert(img,'request missing '+url);img.load();img.resolveDecode();await tick();return img};
 return {ui,requests,timers,warnings,ready};
}
function mainNode(){
 const main=new Node();main.writes=0;
 Object.defineProperty(main,'innerHTML',{set(html){main.html=html;main.writes++;main.nodes=Object.fromEntries(['.scene','.portrait','.speech','.dialog-controls'].map(s=>[s,new Node()]))},get(){return main.html}});
 main.querySelector=s=>main.nodes?.[s]||null;return main;
}
(async()=>{
 const h=setup(),p=h.ui.portraits;
 const promise=p.preload();assert.equal(h.requests.length,1);assert.equal(h.requests[0].fetchPriority,'high');
 h.requests[0].load();await tick();assert.equal(h.requests.length,1,'must decode first portrait before continuing');assert.equal(p.status().ready,0);
 h.requests[0].resolveDecode();await tick();assert.equal(h.requests.length,8);
 for(let i=1;i<8;i++)await h.ready(i);
 await promise;assert.equal(p.status().ready,8);assert(p.settled);assert(h.requests.every(r=>r.decoded&&r.decodeCalls===1));assert.equal(h.timers.size,0);
 await p.preload();assert.equal(h.requests.length,8,'preload must deduplicate');
 const main=mainNode();h.ui.renderScene(main,['박지민','첫 대사',0],'1','다음');
 const host=main.querySelector('.portrait'),frames=[...host.children],scene=main.querySelector('.scene');
 assert.equal(frames.length,8);assert.equal(p.current,0);
 for(let turn=0;turn<120;turn++){const i=turn%8;h.ui.renderScene(main,['박지민','대사 '+i,i],String(turn),'다음');assert.equal(p.current,i);assert(main.querySelector('.speech').innerHTML.includes('대사 '+i));assert.equal(host.children[i].style.opacity,'1');assert.equal(host.dataset.expression,String(i))}
 for(let i=7;i>=0;i--){h.ui.renderScene(main,['감사관','이전 '+i,i],String(i),'이전');assert.equal(p.current,i)}
 assert.equal(main.writes,1,'dialogue must not replace main DOM');assert.strictEqual(main.querySelector('.scene'),scene);assert.deepEqual(host.children,frames);assert.equal(h.requests.length,8,'turns must not request images');
 const host2=new Node();p.mount(host2,5);assert.equal(host.children.length,0);assert.deepEqual(host2.children,frames);assert.equal(h.requests.length,8,'tab return must reuse decoded objects');

 // Pending and failed expressions cannot replace a newer selected expression.
 const slow=setup();slow.ui.portraits.preload();await slow.ready(0);
 const shost=new Node();slow.ui.portraits.mount(shost,0);slow.ui.portraits.show(1);slow.ui.portraits.show(2);
 await slow.ready(2);assert.equal(slow.ui.portraits.current,2);assert(shost.children.includes(slow.ui.portraits.entries[2].image));
 await slow.ready(1);assert.equal(slow.ui.portraits.current,2,'stale completion must not win');
 slow.requests.find(r=>r.src===slow.ui.image(3)).fail();await tick();assert(slow.requests.some(r=>r.src===slow.ui.originalImage(3)));
 const fallback=await slow.ready(3,slow.ui.originalImage(3));slow.ui.portraits.show(3);assert.equal(slow.ui.portraits.current,3);
 slow.requests.find(r=>r.src===slow.ui.image(4)).fail();await tick();slow.requests.find(r=>r.src===slow.ui.originalImage(4)).fail();await tick();slow.ui.portraits.show(4);
 assert.equal(slow.ui.portraits.current,3);assert.equal(fallback.style.opacity,'1');assert(slow.warnings.length>=3);
 // Retry only failed entries; successful assets are never requested again.
 const before=slow.requests.length;slow.ui.portraits.retry();await tick();assert.equal(slow.requests.length,before+1);assert.equal(slow.requests.at(-1).src,slow.ui.image(4));

 const timeout=setup();const pending=timeout.ui.portraits.load(0);[...timeout.timers.values()][0]();await tick();
 assert(timeout.requests.some(r=>r.src===timeout.ui.originalImage(0)));await timeout.ready(0,timeout.ui.originalImage(0));await pending;assert.equal(timeout.ui.portraits.entries[0].state,'ready');
 console.log('PASS: priority/decode gate, 8-image cache, 128 forward/back/rapid turns without requests or DOM replacement, tab remount, stale completion, WebP→PNG fallback, failure retention/logging, retry, timeout. Browser timing/Cloudflare not covered.');
})().catch(error=>{console.error(error);process.exitCode=1});
