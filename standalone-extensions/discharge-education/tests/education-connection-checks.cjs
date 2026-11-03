const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(process.env.EDUCATION_CONTROLLER_PATH||__dirname+'/../discharge-extension/education.js','utf8');
const base='/WebApplication/PharManagement/';
function controller({path='CareEducationRecord.aspx',frameId=7,blocked=false}={}){
 const calls=[];let current=path,returned=false;
 const scope={EducationCore:{},location:{search:'?tab=123'},URLSearchParams,Event,Date,Map,Number,JSON,Promise,Error,
  setTimeout:(f,ms)=>setTimeout(f,ms===8000?80:ms),clearTimeout,
  addEventListener(){},dispatchEvent(){},DischargeCapture:{async init(){returned=true;}},
  educationPageBridge(){},chrome:{scripting:{executeScript(o){
   calls.push(o);
   // Model Chrome's default document_idle scheduling on an unfinished frame.
   if(!o.injectImmediately||blocked)return new Promise(()=>{});
   const action=o.args[0];
   if(action==='eduDiscover')return Promise.resolve(current?[{frameId:0,result:null},{frameId,result:{path:base+current}}]:[]);
   assert.deepEqual(Array.from(o.target.frameIds),[frameId]);
   assert(Number.isFinite(o.args[2])&&o.args[2]>Date.now(),'mutations carry a finite future deadline');
   if(action==='eduNavigate')current='CareEducationRecord.aspx';
   return Promise.resolve([{frameId,result:action==='eduRead'?{path:base+current,ready:true,phase:'home',identity:{},fields:{}}:{acted:true}}]);
  }}}
 };scope.window=scope;vm.createContext(scope);vm.runInContext(source,scope);
 return {scope,calls,get returned(){return returned;}};
}
(async()=>{
 for(const path of ['CareEducationRecord.aspx','InMedicationProcess.aspx'])for(const frameId of [0,7]){
  const c=controller({path,frameId});await c.scope.DischargeEducation.returnCapture();assert(c.returned);
  assert(c.calls.every(o=>o.injectImmediately),'all reads and actions bypass document_idle');
  assert.equal(c.calls.filter(o=>o.args[0]==='eduNavigate').length,path==='InMedicationProcess.aspx'?1:0);
  console.log('PASS ready '+path+' in frame '+frameId+' remains reachable while another frame is loading');
 }
 const wrong=controller({path:null});await assert.rejects(()=>wrong.scope.DischargeEducation.returnCapture(),/查詢處理.*衛教紀錄/);assert.equal(wrong.calls.length,1);console.log('PASS unsupported page reports the required Portal page without a generic timeout');
 const blocked=controller({blocked:true});await assert.rejects(()=>blocked.scope.DischargeEducation.returnCapture(),/辨識來源頁面/);assert.equal(blocked.calls.length,1);assert(!blocked.returned);console.log('PASS genuinely unresponsive source identifies discovery stage and performs no navigation or submission');
})().catch(e=>{console.error(e);process.exitCode=1;});
