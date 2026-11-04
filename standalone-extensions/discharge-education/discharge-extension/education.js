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
 function status(p,text,error=false){progress.set(p.account,{text,error,batchId:p.batchIds[0]});emit();}
 function gate(){if(stop)throw Error('已停止後續登錄。');if(window.DischargeBlocked||window.DischargeUpdating)throw Error('工具目前受管理限制或正在更新，已停止登錄。');}
 async function call(action,p={},all=false){
  if(!Number.isInteger(tabId)||tabId<=0||!chrome.scripting)throw Error('請從已登入的 Portal 開啟工具。');
  const timeout=8000,expiresAt=Date.now()+timeout;
  const stage=action==='eduDiscover'?'辨識來源頁面':action==='eduRead'?'確認頁面狀態':action==='eduSend'?'送組長':action==='eduStore'?'暫存':'操作衛教頁面';
  // Portal frames may keep loading after their controls are available. Match
  // the capture bridge: do not queue this call until document_idle.
  let timer;const result=await Promise.race([chrome.scripting.executeScript({target:all?{tabId,allFrames:true}:{tabId,frameIds:[frameId]},injectImmediately:true,world:'MAIN',func:window.educationPageBridge,args:[action,p,expiresAt]}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('讀取 Portal 操作回應逾時（'+stage+'）。請回來源 Portal 確認頁面狀態。')),timeout);})]).finally(()=>clearTimeout(timer));
  if(all)return result.filter(r=>r.result);
  const r=result[0]?.result;if(!r)throw Error('來源頁面已離開衛教紀錄，請回 Portal 核對。');if(r.error)throw Error(r.error);return r;
 }
 async function wait(test,{sent=false}={}){
  const until=Date.now()+30000;let same='',since=0,last;
  while(Date.now()<until){
   if(!sent)gate();
   try{last=await call('eduRead');if(last.ready&&test(last)){const sig=JSON.stringify([last.phase,last.identity,last.fields,last.created,last.sent,last.status,last.errors,last.chosen]);if(sig===same&&Date.now()-since>=120)return last;if(sig!==same){same=sig;since=Date.now();}}else same='';}catch(e){if(!/frame|document|removed|離開|No tab|context/i.test(e.message))throw e;}
   await pause(60);
  }
  throw Error(sent?'送出後尚未確認結果，請先回 Portal 核對，勿重複送出。':'等候衛教頁面更新逾時，請回 Portal 確認。');
 }
 async function action(name,p,test){gate();try{await call(name,p);}catch(e){if(!/frame|document|removed|context/i.test(e.message))throw e;}await pause(20);return wait(test);}
 async function navigate(to){
  const until=Date.now()+30000;let clicked=false;
  while(Date.now()<until){
   gate();let hits;try{hits=await call('eduDiscover',{},true);}catch(e){if(!clicked||!/frame|document|removed|context/i.test(e.message))throw e;await pause(60);continue;}
   if(to==='capture'&&hits.some(r=>r.result.unsaved))throw Error('Portal 仍有未儲存的衛教表單，請先到原頁返回。');
   const found=hits.filter(r=>r.result.kind===to);if(found.length>1)throw Error('有重複的 Portal 內嵌頁面，請先關閉重複畫面。');
   if(found.length){frameId=found[0].frameId;if(found[0].result.ready)return to==='education'?wait(s=>s.path.endsWith('/CareEducationRecord.aspx')):found[0].result;}
   else if(!clicked){
    const menus=hits.filter(r=>r.result.links?.[to]);if(menus.length!==1)throw Error('請在來源 Portal 開啟含「衛教紀錄」與「查詢處理」連結的藥局選單。');if(!menus[0].result.ready){await pause(60);continue;}frameId=menus[0].frameId;
    try{const r=await call(to==='education'?'eduNavigate':'eduReturnCapture');clicked=!r.expanded;}catch(e){if(!/frame|document|removed|context/i.test(e.message))throw e;clicked=true;}
   }
   await pause(60);
  }
  throw Error('透過 Portal 選單切換頁面逾時，請確認原頁是否已開啟'+(to==='education'?'衛教紀錄':'查詢處理')+'。');
 }
 const connect=()=>navigate('education');
 const samePatient=(s,p)=>s.identity.account===p.account&&s.identity.mrn===p.mrn&&s.identity.name===p.name;
 function selectedPickups(rows){const m=new Map();for(const r of rows){const k=C.rxKey(r);if(!m.has(k))m.set(k,{orderDate:r.orderDate,number:r.number,sequences:[]});m.get(k).sequences.push(r.sequence);}return [...m.values()];}
 async function one(p,actionMode){
  const storing=actionMode==='store';
  const fields=C.fields(p.form);status(p,'查詢病人…');
  await action('eduBegin',{},s=>s.phase==='query');
  await action('eduPatientMode',{},s=>s.phase==='query');
  await action('eduQuery',{patient:p},s=>s.phase==='patients'&&s.queryMrn===p.mrn);
  await action('eduSelectPatient',{patient:p},s=>s.phase==='orders'&&samePatient(s,p));
  const range=C.dateRange(p.pending);await action('eduDateQuery',{patient:p,range},s=>s.phase==='orders'&&samePatient(s,p)&&s.baseDate===range.baseDate&&s.days===range.days);
  status(p,'合併出院藥處方…');const planned=await call('eduPlanOrders',{patient:p});const selected=planned.selected;
  await action('eduSelectOrders',{patient:p,selected},s=>s.phase==='editor'&&samePatient(s,p));
  status(p,'填寫衛教紀錄…');
  const matches=(s,values)=>s.phase==='editor'&&samePatient(s,p)&&Object.entries(values).every(([k,v])=>s.fields[k]?.value===v&&!s.fields[k].disabled);
  async function fill(values){for(let i=0;i<=Object.keys(values).length;i++){
   gate();const r=await call('eduFillFields',{patient:p,selected,fields:values});
   if(Object.keys(r.changed).length)await wait(s=>matches(s,r.changed));
   if(r.done)return;
  }throw Error('衛教欄位持續變動，請回 Portal 確認。');}
  const allTopics=p.form.complete==='Y'&&C.TOPICS.every((_,i)=>p.form.topics.includes(i));
  if(allTopics){
   await fill(Object.fromEntries(Object.entries(fields).filter(([k])=>!k.startsWith('chkCareOpinionItem_')&&k!=='txbCareOpioion')));
   const topics=Object.fromEntries(Object.entries(fields).filter(([k])=>k.startsWith('chkCareOpinionItem_')));
   await action('eduSummaryAll',{patient:p,selected},s=>matches(s,topics));
   await fill({txbCareOpioion:fields.txbCareOpioion});
  }else await fill(fields);
  await call('eduVerify',{patient:p,selected,fields});gate();
  const attempt={id:crypto.randomUUID(),account:p.account,mrn:p.mrn,name:p.name,bedNumber:p.bedNumber,pickups:selectedPickups(selected),complete:p.form.complete,actionMode,form:structuredClone(p.form),status:'sending',expiresAt:p.expiresAt,createdAt:Date.now()};
  await mutate(s=>{s.attempts.push(attempt);});
  status(p,storing?'正在暫存…':'正在送組長…');
  try{
   // Exactly one save/submit attempt. Lost acknowledgements require manual reconciliation.
   gate();let sendError;try{await call(storing?'eduStore':'eduSend',{patient:p,selected,fields});}catch(e){sendError=e;}
   if(sendError&&!/frame|document|removed|context/i.test(sendError.message))throw sendError;
   const result=await wait(s=>s.phase==='editor'&&samePatient(s,p)&&!!s.created&&!!s.status&&!s.errors.length&&(storing?!s.sent:!!s.sent),{sent:true});
   if(storing&&!Object.entries(fields).every(([k,v])=>result.fields[k]?.value===v))throw Error('暫存後的衛教欄位不一致，請人工核對。');
   const actual=result.chosen.map(x=>x.orderDate+'|'+x.number+'|'+x.sequence).sort(),wanted=selected.map(x=>x.orderDate+'|'+x.number+'|'+x.sequence).sort();if(JSON.stringify(actual)!==JSON.stringify(wanted))throw Error('送出後的處方清單不一致，請人工核對。');
   await mutate(s=>{s.receipts.push({id:attempt.id,account:p.account,mrn:p.mrn,pickups:attempt.pickups,complete:p.form.complete,actionMode,createdAt:Date.now(),expiresAt:Date.now()+C.TTL,portalCreated:result.created,portalSent:result.sent,portalStatus:result.status});s.attempts=s.attempts.filter(a=>a.id!==attempt.id);});
   status(p,(p.form.complete==='Y'?'已登錄':'已登錄（未完成衛教）')+(storing?' · 已暫存，尚未送組長':' · 已送組長'));return true;
  }catch(e){await mutate(s=>{const a=s.attempts.find(x=>x.id===attempt.id);if(a){a.status='uncertain';a.message=e.message;}});status(p,'結果待核對，已停止批次',true);throw e;}
 }
 async function run(accounts,filter,actionMode='send'){
  if(!['send','store'].includes(actionMode))throw Error('請選擇全部暫存或全部送組長。');
  if(running||window.CaptureRunning||window.DischargeDaily.busy)throw Error('目前有其他作業進行中。');stop=false;
  if(!filter?.batchId)throw Error('請選擇一份名單後再登錄。');
  await navigator.locks.request('discharge-portal-capture',{ifAvailable:true},async lock=>{
   if(!lock)throw Error('另一個視窗正在操作 Portal，請稍後再試。');gate();
   const ps=C.patients(await read(),filter).filter(p=>accounts.includes(p.account));
   if(ps.length!==accounts.length)throw Error('名單已到期或範圍已改變，請重新選取。');
   for(const p of ps){if(p.error||p.uncertain||!p.pending.length)throw Error(p.error||'選取的名單含已登錄或待核對項目。');C.validate(p.form);progress.delete(p.account);}
   running=true;stop=false;window.EducationRunning=true;emit();window.dispatchEvent(new Event('capturerunningchange'));
   let active;
   try{await connect();for(const p of ps){gate();if(Date.now()>=p.expiresAt)throw Error('名單已超過七天，未繼續登錄。');active=p;await one(p,actionMode);}}
   catch(e){if(active&&!progress.get(active.account)?.error)status(active,e.message,true);throw e;}
   finally{running=false;window.EducationRunning=false;emit();window.dispatchEvent(new Event('capturerunningchange'));}
  });
 }
 async function resolve(id,registered){
  if(running)throw Error('請等目前作業結束。');await mutate(s=>{const a=s.attempts.find(x=>x.id===id);if(!a)throw Error('此待核對紀錄已到期。');if(registered)s.receipts.push({id:a.id,account:a.account,mrn:a.mrn,pickups:a.pickups,complete:a.complete,actionMode:a.actionMode||'send',createdAt:Date.now(),expiresAt:Date.now()+C.TTL,manualVerified:true});s.attempts=s.attempts.filter(x=>x.id!==id);progress.delete(a.account);});
 }
 async function focus(){await chrome.tabs.update(tabId,{active:true});const t=await chrome.tabs.get(tabId);if(t.windowId)await chrome.windows.update(t.windowId,{focused:true});}
 window.addEventListener('beforeunload',e=>{if(running){e.preventDefault();e.returnValue='';}});
 async function returnCapture(){if(running)throw Error('請先完成或停止衛教登錄。');stop=false;await navigate('capture');await window.DischargeCapture.init();}
 window.DischargeEducation={init,read,save,draft,run,resolve,focus,returnCapture,progress,stop(){stop=true;},get busy(){return running;}};
})();
