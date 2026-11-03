'use strict';
(()=>{
 const C=DischargeIncremental,$=id=>document.getElementById(id);let ledger=C.empty(),baseline=structuredClone(ledger),batchDay='',mode='fresh',pending=null,printed=false,initializing,writing=false;
 const read=async()=>C.current((await chrome.storage.local.get(C.KEY))[C.KEY]);
 const write=async value=>{await chrome.storage.local.set({[C.KEY]:value});ledger=value;};
 const locked=fn=>navigator.locks.request('discharge-daily-record',fn);
 const message=(text,error=false)=>{if($('notice'))notice(text,error);};
 function render(){
  if(!$('dailySummary'))return;
  const same=ledger.day===C.day(),has=same&&ledger.batches>0;
  $('dailySummary').textContent=has?`今天已確認列印 ${ledger.batches} 批 · ${Object.keys(ledger.patients).length} 位病人`:'今日尚無已列印紀錄';
  $('dailyHint').textContent=printed?'這批已記錄，下次只整理新增內容。':pending?'列印成功後請按「已完成列印」；若取消列印，不要確認。':'列印後確認完成，再檢查新增；比對紀錄只保留當天。';
  $('confirmPrinted').hidden=!pending||printed;
  $('confirmPrinted').disabled=writing||window.DischargeBlocked;
  $('checkNew').disabled=!has||writing||!!window.CaptureRunning||!!window.DischargeBlocked||!!window.DischargeUpdating;
  const resume=$('resumeSummary').closest('section');resume.hidden=!has||!!window.CaptureRunning;
  $('resumeSummary').textContent=$('dailySummary').textContent;
  $('resumeNew').disabled=$('checkNew').disabled;
 }
 async function init(){
  if(initializing)return initializing;
  initializing=(async()=>{const raw=(await chrome.storage.local.get(C.KEY))[C.KEY];ledger=C.current(raw);if(raw?.day!==ledger.day)await write(ledger);baseline=structuredClone(ledger);window.DischargePresentation.restoreAssignments(ledger.assignments);
   if(ledger.settings)await window.DischargeCapture.restore(ledger.settings);
   $('checkNew').onclick=checkNew;$('resumeNew').onclick=checkNew;
   $('restartCapture').onclick=restart;$('resumeRestart').onclick=restart;
   $('confirmPrinted').onclick=async()=>{try{await confirmPrinted();}catch(e){message(e.message,true);}};
   window.addEventListener('afterprint',()=>{if(pending)render();});window.addEventListener('captureupdate',render);window.addEventListener('capturerunningchange',render);
   window.addEventListener('focus',()=>void rollover());setInterval(()=>void rollover(),15000);render();
  })();return initializing;
 }
 async function rollover(){
  if(ledger.day===C.day()||window.EducationRunning)return false;
  if(window.CaptureRunning){window.DischargeCapture.stop();return true;}
  await locked(async()=>{await write(C.empty());});baseline=structuredClone(ledger);batchDay='';mode='fresh';pending=null;printed=false;
  window.DischargeCapture.reset();$('baseDate').value=todayISO();window.DischargePresentation.restoreAssignments(null);window.DischargePresentation.switchView('input');refresh();render();message('已換日，今天的名單請重新擷取。');return true;
 }
 async function begin(nextMode){
  await init();if(await rollover())nextMode='fresh';
  if(nextMode==='fresh'&&ledger.batches&&!confirm('重新開始會清除今天的已列印比對紀錄，重新列出全部符合條件的病人。要繼續嗎？'))return false;
  await locked(async()=>{ledger=await read();if(nextMode==='fresh')await write(C.empty());});
  mode=nextMode==='incremental'&&ledger.batches?'incremental':'fresh';baseline=structuredClone(ledger);batchDay=C.day();pending=null;printed=false;render();return true;
 }
 async function checkNew(){
  try{
   if(window.DischargeBlocked||window.CaptureRunning)return;
   if(await rollover())return;
   if(pending&&!printed&&!confirm('這批尚未確認列印完成。繼續檢查會保留未確認內容，仍可能再次列出。要繼續嗎？'))return;
   ledger=await read();if(!ledger.batches)return;
   await window.DischargeCapture.restore(ledger.settings);await window.DischargeCapture.start('incremental');
  }catch(e){message(e.message,true);}
 }
 async function restart(){
  if(window.CaptureRunning||window.DischargeBlocked)return;
  if(ledger.batches&&!confirm('重新開始會清除今天的已列印比對紀錄。確定重新開始嗎？'))return;
  try{await locked(()=>write(C.empty()));baseline=structuredClone(ledger);batchDay='';mode='fresh';pending=null;printed=false;window.DischargeCapture.reset();window.DischargePresentation.restoreAssignments(null);window.DischargePresentation.switchView('input');refresh();render();}catch(e){message(e.message,true);}
 }
 function print(){
  if(!window.DischargePresentation.canPrint()||!isCurrent())return;
  if(printed){window.print();return;}
  batchDay ||= C.day();
  pending={rows:structuredClone(visibleRows),settings:window.DischargeCapture.settings(),assignments:window.DischargePresentation.assignments(),day:batchDay,generation:baseline.generation};printed=false;render();window.print();
 }
 async function confirmPrinted(){
  if(!pending||printed||writing||window.DischargeBlocked)return;
  writing=true;render();try{
   const snapshot=pending;
   await locked(async()=>{const latest=await read();if(snapshot.day!==C.day()||latest.generation!==snapshot.generation)throw Error('日期或比對紀錄已變更，請重新開始擷取。');const next=C.commit(latest,snapshot.rows,snapshot.settings,snapshot.assignments);await window.DischargeEducation.save(snapshot.rows,snapshot.assignments,{printed:true,dailyLedger:next});ledger=next;});
   printed=true;pending=null;message('已記錄列印並保存名單七天，可從「七天名單／衛教」批次登錄。下次檢查新增會排除已列印內容。');
  }finally{writing=false;render();}
 }
 function isCurrent(){return !batchDay||batchDay===C.day();}
 window.DischargeDaily={init,begin,print,confirmPrinted,isCurrent,rollover,render,completed(){render();},get mode(){return mode;},get busy(){return writing;},get pending(){return !!pending;},project:rows=>C.project(rows,baseline,mode==='incremental'),isNew:(account,rx)=>mode!=='incremental'||C.isNew(baseline,account,rx)};
})();
