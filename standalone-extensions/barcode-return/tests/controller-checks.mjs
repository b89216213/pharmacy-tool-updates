import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../extension/content.js',import.meta.url),'utf8');
const checks=[];async function test(name,fn){await fn();checks.push(name);console.log('PASS',name);}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
let nativeAmounts=false,deny=false,requests=[],messageListener;
class Element {
 constructor(id=''){this.id=id;this.hidden=false;this.disabled=false;this.value='';this.isConnected=true;this.style={};this.listeners={};this.classList={toggle(){}};}
 addEventListener(type,fn){this.listeners[type]=fn;}
 querySelectorAll(){return [];}
 querySelector(){return null;}
 setAttribute(){} removeAttribute(){}
 focus(){if(this.root)this.root.activeElement=this;else doc.activeElement=this;}
 attachShadow(){return shadow;}
 set innerHTML(html){this.html=html;if(this===shadow){for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);e.root=shadow;e.hidden=/\shidden(?:\s|>)/.test(m[0]);ids.set(e.id,e);}}}
 get innerHTML(){return this.html;}
}
const ids=new Map(),shadow=new Element(),original=new Element('original');shadow.getElementById=id=>ids.get(id);
const doc={body:new Element('body'),activeElement:original,getElementById:()=>null,createElement:()=>new Element(),documentElement:{dataset:{},append(){}}};
const events=new Map(),window={addEventListener:(type,fn)=>{const list=events.get(type)||[];list.push(fn);events.set(type,list);},removeEventListener:(type,fn)=>events.set(type,(events.get(type)||[]).filter(f=>f!==fn)),dispatchEvent(event){for(const fn of events.get(event.type)||[])fn(event);if(event.type==='ntuh-barcode-return-command-v1'){const q=JSON.parse(event.detail);window.dispatchEvent({type:'ntuh-barcode-return-signal-v1',detail:JSON.stringify({type:'ready',token:q.token,hooked:false,busy:false})});}}};
const C={validateBarcode:x=>({valid:true,value:x}),IDS:{},clean:x=>String(x??'').trim(),validateAmount:x=>({valid:true,value:x?Number(x):null}),readReturns:()=>nativeAmounts?[{amount:'1'}]:[],readPatient:()=>({account:'test',chart:'test',bed:'test'})};
const chrome={runtime:{id:'unit',getManifest:()=>({version:'1.5.3'}),getURL:p=>'chrome-extension://unit/'+p,onMessage:{addListener:fn=>messageListener=fn},async sendMessage(q){requests.push(q);if(q.type==='return-helper-ready')return{open:false};if(q.action==='status')return{ok:true,data:{state:'allowed',deviceName:'Test'}};if(q.action==='acquire')return deny?{ok:false,error:'管理員已停用'}:{ok:true,data:{token:'lease'}};return{ok:true,data:{}};}}};
const leaseStore=new Map();const sessionStorage={getItem:k=>leaseStore.get(k)||null,setItem:(k,v)=>leaseStore.set(k,v),removeItem:k=>leaseStore.delete(k)};
const context=vm.createContext({location:{href:'https://ihisaw.ntuh.gov.tw/WebApplication/PharManagement/BarCodeDrugReturn.aspx'},sessionStorage,document:doc,window,chrome,NTUHReturnCore:C,NTUHReturnWorkflow:{},crypto,setTimeout,clearTimeout,clearInterval,performance,setInterval:()=>0,CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},MutationObserver:class{observe(){}}});
vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.api={state,show,prepare,commit,commitIndividually,el,syncControls};})();'),context);
const a=context.api;
const receive=type=>{let answer;messageListener({type},{id:'unit'},r=>answer=r);return answer;};
await tick();
await test('Page load stays closed and preserves original focus',()=>{assert.equal(a.state.shown,false);assert.equal(a.el('app').hidden,true);assert.equal(doc.activeElement,original);assert.equal(requests.filter(q=>q.action==='status').length,0);});
await test('Toolbar opens and closes in place; draft quantities remain',async()=>{assert.equal(receive('toggle-return-helper').shown,true);await tick();assert(doc.body.inert);assert.equal(a.el('barcode').disabled,false);a.state.values.set('same-order-0001','2');assert.equal(receive('toggle-return-helper').shown,false);assert.equal(a.el('app').hidden,true);assert.equal(doc.body.inert,undefined);assert.equal(a.state.values.get('same-order-0001'),'2');assert.equal(doc.activeElement,original);});
await test('Draft, uncertain result, active native input and running operation all block update',()=>{assert.equal(receive('return-update-probe').ready,false);a.state.values.clear();a.state.uncertain=true;assert.equal(receive('return-update-probe').ready,false);a.state.uncertain=false;nativeAmounts=true;assert.equal(receive('return-update-probe').ready,false);nativeAmounts=false;a.state.busy=true;assert.equal(receive('return-update-probe').ready,false);a.state.busy=false;});
await test('Idle update freezes new work and unfreeze restores controls',()=>{assert.equal(receive('return-update-probe').ready,true);assert(a.el('query').disabled);assert(doc.body.inert);receive('return-update-unfreeze');assert.equal(a.el('query').disabled,false);});
await test('Foreign messages cannot toggle or freeze the tool',()=>{messageListener({type:'toggle-return-helper'},{id:'other'},()=>{throw Error('foreign reply');});assert.equal(a.state.shown,false);});
await test('Read, batch write and duplicate-order write require a management lease before native access',async()=>{deny=true;requests=[];await a.prepare('123');a.state.rows=[{key:'one'}];a.state.values.set('one','1');a.state.valid=true;a.syncControls();await a.commit();a.state.valid=true;await a.commitIndividually();assert.equal(requests.filter(q=>q.action==='acquire').length,3);assert.equal(requests.filter(q=>q.action==='release').length,0);assert.equal(a.state.uncertain,false);assert.equal(a.state.values.get('one'),'1');assert.match(a.el('status').textContent,/停用/);});
await test('Native readiness failure releases lease once and keeps hidden page focus',async()=>{deny=false;requests=[];a.state.values.clear();await a.prepare('123');assert.equal(requests.filter(q=>q.action==='acquire').length,1);assert.equal(requests.filter(q=>q.action==='release').length,1);assert.equal(a.state.busy,false);assert.equal(doc.activeElement,original);});
const pageTools=await import('../extension/return-pages.js');let sent=[],blocked=false,missing=false;
globalThis.chrome={tabs:{query:async()=>[{id:1},{id:2}],sendMessage:async(id,q)=>{sent.push([id,q.type]);if(missing&&id===2)throw Error('no receiver');return{ready:!(blocked&&id===2)};}},webNavigation:{getAllFrames:async()=>[{frameId:3,url:pageTools.RETURN_URL},{frameId:4,url:'https://unrelated.test/'}]}};
await test('Updater checks each native frame; partial failure thaws all contacted frames',async()=>{const pages=await pageTools.freezePages();assert.equal(pages.length,2);assert(pages.every(p=>p.frameId===3));blocked=true;sent=[];await assert.rejects(pageTools.freezePages());assert.equal(sent.filter(x=>x[1]==='return-update-unfreeze').length,2);blocked=false;missing=true;await assert.rejects(pageTools.freezePages());});
await test('Portal lease blocks other tools and accepts only current own requests',()=>{
 const request=(owner='unit:return:one',extra={})=>({type:'return-portal-lease',owner,deadline:Date.now()+5000,...extra});
 const call=(q,sender={id:'unit'})=>{let answer;messageListener(q,sender,r=>answer=r);return answer;};
 const get=()=>JSON.parse(sessionStorage.getItem('pharmacyPortalLeaseV1')||'null');
 assert.equal(call(request()).ok,true);assert.equal(get().owner,'unit:return:one');
 assert.equal(call(request()).ok,true);assert.equal(call(request('unit:return:two')).ok,false);
 const other={owner:'picker:run',label:'病人快速選擇',until:Date.now()+90000};sessionStorage.setItem('pharmacyPortalLeaseV1',JSON.stringify(other));
 assert.equal(call(request()).ok,false);assert.deepEqual(get(),other);
 assert.equal(call(request('unit:return:one',{release:true})).ok,true);assert.deepEqual(get(),other);
 sessionStorage.setItem('pharmacyPortalLeaseV1',JSON.stringify({...other,until:Date.now()-1}));assert.equal(call(request()).ok,true);
 assert.equal(call(request('unit:return:one',{release:true})).ok,true);assert.equal(get(),null);
 assert.equal(call(request('unit:return:one',{deadline:Date.now()-1})).ok,false);assert.equal(get(),null);
 assert.equal(call(request('other:run')).ok,false);assert.equal(call(request(),{id:'foreign'}),undefined);assert.equal(get(),null);
});
console.log(checks.length+' controller checks passed');
