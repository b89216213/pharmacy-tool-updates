const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/../discharge-extension/education.js','utf8'),base='/WebApplication/PharManagement/';
function controller({kind='education',frameId=7,blocked=false,links=true,unsaved=false,expand=false,loading=false}={}){
 const calls=[];let current=kind,currentFrame=frameId,returned=false,expanded=false,reads=0;
 const scope={EducationCore:{},location:{search:'?tab=123'},URLSearchParams,Event,Date,Map,Number,JSON,Promise,Error,
  setTimeout:(f,ms)=>setTimeout(f,ms===8000?80:ms),clearTimeout,
  addEventListener(){},dispatchEvent(){},DischargeCapture:{async init(){returned=true;}},educationPageBridge(){},
  chrome:{scripting:{executeScript(o){calls.push(o);if(!o.injectImmediately||blocked)return new Promise(()=>{});
   const action=o.args[0];
   if(action==='eduDiscover'){reads++;return Promise.resolve([{frameId:currentFrame,result:{kind:current,path:base+(current==='education'?'CareEducationRecord.aspx':'InMedicationProcess.aspx'),ready:!loading||reads>2,links:{capture:links,education:links},unsaved}}]);}
   assert.deepEqual(Array.from(o.target.frameIds),[currentFrame]);assert(o.args[2]>Date.now());
   if(action==='eduReturnCapture'){assert(!loading||reads>2);if(expand&&!expanded){expanded=true;return Promise.resolve([{frameId:currentFrame,result:{expanded:true}}]);}current='capture';currentFrame++;return Promise.reject(Error('document unloaded'));}
   throw Error('Unexpected action '+action);
  }}}
 };scope.window=scope;vm.createContext(scope);vm.runInContext(source,scope);return {scope,calls,get returned(){return returned;}};
}
(async()=>{
 for(const kind of ['capture','education','other'])for(const frameId of [0,7]){const c=controller({kind,frameId});await c.scope.DischargeEducation.returnCapture();assert(c.returned);assert(c.calls.every(o=>o.injectImmediately));assert.equal(c.calls.filter(o=>o.args[0]==='eduReturnCapture').length,kind==='capture'?0:1);console.log('PASS menu navigation from '+kind+' frame '+frameId+' rediscovers a replacement frame without retrying the link');}
 const collapsed=controller({expand:true});await collapsed.scope.DischargeEducation.returnCapture();assert.equal(collapsed.calls.filter(o=>o.args[0]==='eduReturnCapture').length,2);console.log('PASS collapsed menu expansion precedes exactly one navigation');
 const loading=controller({loading:true});await loading.scope.DischargeEducation.returnCapture();assert(loading.returned);console.log('PASS navigation waits for the source postback to finish');
 const wrong=controller({kind:'other',links:false});await assert.rejects(()=>wrong.scope.DischargeEducation.returnCapture(),/藥局選單/);assert.equal(wrong.calls.length,1);console.log('PASS missing authenticated menu stops without constructing a URL');
 const unsaved=controller({unsaved:true});await assert.rejects(()=>unsaved.scope.DischargeEducation.returnCapture(),/未儲存/);assert.equal(unsaved.calls.length,1);console.log('PASS unsaved education form prevents navigation');
 const blocked=controller({blocked:true});await assert.rejects(()=>blocked.scope.DischargeEducation.returnCapture(),/辨識來源頁面/);assert.equal(blocked.calls.length,1);console.log('PASS unresponsive discovery performs no navigation');
})().catch(e=>{console.error(e);process.exitCode=1;});
