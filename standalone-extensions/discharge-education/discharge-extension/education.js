'use strict';
(()=>{
 const C=EducationCore;let running=false,stop=false,frameId,initializing;const progress=new Map();
 const pause=ms=>new Promise(r=>setTimeout(r,ms)),query=new URLSearchParams(location.search),tabId=Number(query.get('tab'));
 const emit=()=>window.dispatchEvent(new Event('educationchange'));
 async function read(){return C.prune((await chrome.storage.local.get(C.KEY))[C.KEY]);}
 async function mutate(fn,notify=true){return navigator.locks.request('discharge-education-records',async()=>{const s=await read(),result=await fn(s);await chrome.storage.local.set({[C.KEY]:s});if(notify)emit();return result;});}
 async function init(){if(initializing)return initializing;initializing=mutate(()=>{});await initializing;setInterval(()=>{if(!running)void mutate(()=>{}).catch(()=>{});},60000);}
 async function save(rows,assignments,options={}){
  return navigator.locks.request('discharge-education-records',async()=>{const r=C.addBatch(await read(),rows,assignments,options),values={[C.KEY]:r.state};if(options.dailyLedger)values[DischargeIncremental.KEY]=options.dailyLedger;await chrome.storage.local.set(values);emit();return r.batch.id;});
 }
 async function draft(account,form){await mutate(s=>{s.drafts[account]=structuredClone(form);},false);}
 function status(p,text,error=false){progress.set(p.account,{text,error});emit();}
 function gate(){if(stop)throw Error('已停止後續登錄。');if(window.DischargeBlocked||window.DischargeUpdating)throw Error('工具目前受管理限制或正在更新，已停止登錄。');}
 async function call(action,p={},all=false){
  if(!Number.isInteger(tabId)||tabId<=0||!chrome.scripting)throw Error('請從已登入的 Portal 開啟工具。');
  let timer;const result=await Promise.race([chrome.scripting.executeScript({target:all?{tabId,allFrames:true}:{tabId,frameIds:[frameId]},world:'MAIN',func:window.educationPageBridge,args:[action,p]}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('讀取 Portal 操作回應逾時。')),8000);})]).finally(()=>clearTimeout(timer));
  if(all)return result.filter(r=>r.result);
  const r=result[0]?.result;if(!r)throw Error('來源頁面已離開衛教紀錄，請回 Portal 核對。');if(r.error)throw Error(r.error);return r;
 }
 async function wait(test,{sent=false}={}){
  const until=Date.now()+30000;let same='',since=0,last;
  while(Date.now()<until){
   if(!sent)gate();
   try{last=await call('eduRead');if(last.ready&&test(last)){const sig=JSON.stringify([last.phase,last.identity,last.fields,last.created,last.sent,last.chosen]);if(sig===same&&Date.now()-since>350)return last;if(sig!==same){same=sig;since=Date.now();}}else same='';}catch(e){if(!/frame|document|removed|離開|No tab|context/i.test(e.message))throw e;}
   await pause(250);
  }
  throw Error(sent?'送出後尚未確認結果，請先回 Portal 核對，勿重複送出。':'等候衛教頁面更新逾時，請回 Portal 確認。');
 }
 async function action(name,p,test){gate();try{await call(name,p);}catch(e){if(!/frame|document|removed|context/i.test(e.message))throw e;}await pause(200);return wait(test);}
 async function connect(){
  const hits=await call('eduDiscover',{},true),education=hits.filter(r=>r.result.path?.endsWith('/CareEducationRecord.aspx')),capture=hits.filter(r=>r.result.path?.endsWith('/InMedicationProcess.aspx'));
  const candidates=education.length?education:capture;if(candidates.length!==1)throw Error('請在來源 Portal 視窗開啟「查詢處理」或「衛教紀錄」，並關閉重複的內嵌頁面。');frameId=candidates[0].frameId;
  if(!education.length){await call('eduNavigate');await pause(300);}
  return wait(s=>s.path.endsWith('/CareEducationRecord.aspx'));
 }
 const samePatient=(s,p)=>s.identity.account===p.account&&s.identity.mrn===p.mrn&&s.identity.name===p.name;
 function selectedPickups(rows){const m=new Map();for(const r of rows){const k=C.rxKey(r);if(!m.has(k))m.set(k,{orderDate:r.orderDate,number:r.number,sequences:[]});m.get(k).sequences.push(r.sequence);}return [...m.values()];}
 async function one(p){
  const fields=C.fields(p.form);status(p,'查詢病人…');
  await action('eduBegin',{},s=>s.phase==='query');
  await action('eduPatientMode',{},s=>s.phase==='query');
  await action('eduQuery',{patient:p},s=>s.phase==='patients'&&s.queryMrn===p.mrn);
  await action('eduSelectPatient',{patient:p},s=>s.phase==='orders'&&samePatient(s,p));
  const range=C.dateRange(p.pending);await action('eduDateQuery',{patient:p,range},s=>s.phase==='orders'&&samePatient(s,p)&&s.baseDate===range.baseDate&&s.days===range.days);
  status(p,'合併出院藥處方…');const planned=await call('eduPlanOrders',{patient:p});const selected=planned.selected;
  await action('eduSelectOrders',{patient:p,selected},s=>s.phase==='editor'&&samePatient(s,p));
  status(p,'填寫衛教紀錄…');
  for(const [field,value]of Object.entries(fields)){
   gate();const current=await call('eduRead');if(current.fields[field]?.value===value&&!current.fields[field].disabled)continue;
   await action('eduField',{patient:p,selected,field,value},s=>s.phase==='editor'&&samePatient(s,p)&&s.fields[field]?.value===value&&!s.fields[field].disabled);
  }
  await call('eduVerify',{patient:p,selected,fields});gate();
  const attempt={id:crypto.randomUUID(),account:p.account,mrn:p.mrn,name:p.name,bedNumber:p.bedNumber,pickups:selectedPickups(selected),complete:p.form.complete,form:structuredClone(p.form),status:'sending',expiresAt:p.expiresAt,createdAt:Date.now()};
  await mutate(s=>{s.attempts.push(attempt);});
  status(p,'正在送組長…');
  try{
   // Exactly one send attempt. Lost acknowledgements must be reconciled by a person.
   gate();let sendError;try{await call('eduSend',{patient:p,selected,fields});}catch(e){sendError=e;}
   if(sendError&&!/frame|document|removed|context/i.test(sendError.message))throw sendError;
   const result=await wait(s=>s.phase==='editor'&&samePatient(s,p)&&!!s.created&&!!s.sent&&!!s.status,{sent:true});
   const actual=result.chosen.map(x=>x.orderDate+'|'+x.number+'|'+x.sequence).sort(),wanted=selected.map(x=>x.orderDate+'|'+x.number+'|'+x.sequence).sort();if(JSON.stringify(actual)!==JSON.stringify(wanted))throw Error('送出後的處方清單不一致，請人工核對。');
   await mutate(s=>{s.receipts.push({id:attempt.id,account:p.account,mrn:p.mrn,pickups:attempt.pickups,complete:p.form.complete,createdAt:Date.now(),expiresAt:Date.now()+C.TTL,portalCreated:result.created,portalSent:result.sent,portalStatus:result.status});s.attempts=s.attempts.filter(a=>a.id!==attempt.id);});
   status(p,p.form.complete==='Y'?'已登錄':'已登錄（未完成衛教）');return true;
  }catch(e){await mutate(s=>{const a=s.attempts.find(x=>x.id===attempt.id);if(a){a.status='uncertain';a.message=e.message;}});status(p,'結果待核對，已停止批次',true);throw e;}
 }
 async function run(accounts,filter){
  if(running||window.CaptureRunning||window.DischargeDaily.busy)throw Error('目前有其他作業進行中。');stop=false;
  await navigator.locks.request('discharge-portal-capture',{ifAvailable:true},async lock=>{
   if(!lock)throw Error('另一個視窗正在操作 Portal，請稍後再試。');gate();
   const ps=C.patients(await read(),filter).filter(p=>accounts.includes(p.account));
   if(ps.length!==accounts.length)throw Error('名單已到期或範圍已改變，請重新選取。');
   for(const p of ps){if(p.error||p.uncertain||!p.pending.length)throw Error(p.error||'選取的名單含已登錄或待核對項目。');C.validate(p.form);}
   running=true;stop=false;window.EducationRunning=true;emit();window.dispatchEvent(new Event('capturerunningchange'));
   let active;
   try{await connect();for(const p of ps){gate();if(Date.now()>=p.expiresAt)throw Error('名單已超過七天，未繼續登錄。');active=p;await one(p);}}
   catch(e){if(active&&!progress.get(active.account)?.error)status(active,e.message,true);throw e;}
   finally{running=false;window.EducationRunning=false;emit();window.dispatchEvent(new Event('capturerunningchange'));}
  });
 }
 async function resolve(id,registered){
  if(running)throw Error('請等目前作業結束。');await mutate(s=>{const a=s.attempts.find(x=>x.id===id);if(!a)throw Error('此待核對紀錄已到期。');if(registered)s.receipts.push({id:a.id,account:a.account,mrn:a.mrn,pickups:a.pickups,complete:a.complete,createdAt:Date.now(),expiresAt:Date.now()+C.TTL,manualVerified:true});s.attempts=s.attempts.filter(x=>x.id!==id);});
 }
 async function focus(){await chrome.tabs.update(tabId,{active:true});const t=await chrome.tabs.get(tabId);if(t.windowId)await chrome.windows.update(t.windowId,{focused:true});}
 window.addEventListener('beforeunload',e=>{if(running){e.preventDefault();e.returnValue='';}});
 async function returnCapture(){if(running)throw Error('請先完成或停止衛教登錄。');stop=false;await connect();await call('eduReturnCapture');await pause(700);await window.DischargeCapture.init();}
 window.DischargeEducation={init,read,save,draft,run,resolve,focus,returnCapture,progress,stop(){stop=true;},get busy(){return running;}};
})();
