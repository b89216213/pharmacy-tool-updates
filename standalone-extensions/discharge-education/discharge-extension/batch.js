'use strict';
(() => {
  const $=id=>document.getElementById(id), parser=window.DischargeParser;
  const query=new URLSearchParams(location.search), tabId=Number(query.get('tab'));
  const expectedOrigin=query.get('origin');
  const api=globalThis.chrome;
  const state={controls:[],active:null,running:false,stop:false,snapshots:new Map(),remembered:null,savedWards:null,savingPreset:false,completed:0,category:'child',session:{status:'idle',wards:[],patients:{},signature:''},rxDiagnostics:[],deliveryDiagnostics:[]};
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const cleanError=e=>{
    const message=String(e?.message||e);
    if(/Cannot access|Missing host|cannot be scripted|No tab|tabs cannot be edited|Frame with ID|frame was removed/i.test(message))return '無法讀取來源頁面。請回到院內住院清單，再按一次瀏覽器上的擴充功能圖示；若為 IE 模式則無法自動讀取。';
    return message;
  };
  function status(text,error=false){$('browserStatus').textContent=text;$('browserStatus').classList.toggle('error',error);}
  function runStatus(text,error=false){$('runStatus').textContent=text;$('runStatus').classList.toggle('error',error);}
  const portalMessage='請開啟 Portal 的「查詢處理」頁面';
  function signature(){return JSON.stringify([selectedWards(),$('baseDate').value,selectedDays,$('includeToday').checked]);}
  function publish(){
    window.CaptureSession=state.session;window.dispatchEvent(new Event('captureupdate'));
    const session=state.session,done=session.wards.filter(w=>w.status==='done').length;
    $('progressPanel').dataset.state=session.status;
    $('progressCount').textContent=session.status==='complete'?'擷取完成':session.status==='idle'?'尚未開始':`${done}／${session.wards.length} 個病房`;
    $('runLog').replaceChildren();
    for(const ward of session.wards){
      const card=document.createElement('div');card.className='queue-card';card.dataset.state=ward.status;
      const code=document.createElement('strong');code.textContent=ward.code;
      const label=document.createElement('span');label.textContent=({pending:'待處理',running:'處理中',done:'已完成',stopped:'未完成'})[ward.status];
      const count=document.createElement('small');count.textContent=ward.total===undefined?'':`出院 ${ward.total} 人 · 已讀取 ${ward.read||0} 人`;
      card.append(code,label,count);$('runLog').append(card);
    }
  }
  function invalidate(){if(state.session.status==='complete'&&state.session.signature!==signature()){state.session.status='changed';runStatus('條件已變更，請重新擷取。');publish();}}
  function patientProgress(account,status){state.session.patients[account]=status;publish();}

  function banner(text){$('partialBanner').textContent=text;$('partialBanner').hidden=!text;}
  function ensureConnection(){if(!api?.scripting||!Number.isInteger(tabId)||tabId<=0)throw new Error('請先在瀏覽器安裝此擴充功能，再於院內住院清單點選擴充功能圖示開啟。直接開啟 HTML 只能使用貼上功能。');}
  async function execute(action,payload={},frameId){
    ensureConnection();
    const target={tabId};
    if(frameId===undefined)target.allFrames=true;else target.frameIds=[frameId];
    let timer;
    try{
      return await Promise.race([
        api.scripting.executeScript({target,injectImmediately:true,world:['switch','selectPatient','returnPatientList','openOrderDetail'].includes(action)?'MAIN':'ISOLATED',func:window.pageBridge,args:[action,payload]}),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('讀取來源頁面超過 8 秒。請確認院內清單已開啟，再從該頁面點擴充功能圖示；若仍卡住，請提供工具視窗 Console 的錯誤訊息。')),8000);})
      ]);
    }finally{clearTimeout(timer);}
  }
  function verifyOrigin(origin){if(expectedOrigin&&origin!==expectedOrigin)throw new Error('來源頁面已移至不同網站，已停止擷取。請回到原住院清單後重新開啟工具。');}
  async function readControls(){
    let results=await execute('discover',{},0);
    if(!results.some(r=>r.result?.controls?.length))results=await execute('discover');
    return results.flatMap(r=>(!expectedOrigin||r.result?.origin===expectedOrigin)?(r.result?.controls||[]).map(c=>({...c,frameId:r.frameId})):[])
      .sort((a,b)=>Number(b.mode==='ntuh-query')-Number(a.mode==='ntuh-query')||b.options.length-a.options.length);
  }
  async function discoverControls(recover=true){
    let controls=await readControls(),returned=false;
    if(!controls.length&&recover){
      const states=await execute('patientReturnState');
      const back=states.find(r=>r.result?.returnable&&(!expectedOrigin||r.result.origin===expectedOrigin));
      if(back){
        status('正在返回病房清單…');runStatus('正在按「重選病人」返回病房清單…');
        await navigation('returnPatientList',{},back.frameId);returned=true;
        const deadline=Date.now()+8000;
        while(Date.now()<deadline){
          await pause(300);
          try{controls=await readControls();}catch(e){if(!/removed|No document|context|frame was/i.test(String(e.message)))throw e;}
          if(controls.length)break;
        }
      }
    }
    state.controls=controls;state.active=controls[0]||null;
    $('wardArea').hidden=!state.active;$('retryConnection').hidden=!!state.active;
    if(state.active){renderWards();status('已連接查詢處理頁面');if(returned)runStatus('已返回病房清單。');}
    else {status(portalMessage,true);runStatus(portalMessage,true);}
    return state.active;
  }
  function selectedWards(){return Array.from($('wardGrid').querySelectorAll('input:checked')).map(x=>x.value);}
  function selectionChanged(){
    state.remembered=selectedWards();$('selectionCount').textContent=`已勾選 ${state.remembered.length} 個病房`;$('startBatch').textContent=state.remembered.length?`開始擷取 ${state.remembered.length} 個病房 →`:'開始擷取 →';
    $('selectedWards').replaceChildren();
    for(const code of state.remembered){
      const chip=document.createElement('button');chip.type='button';chip.className='selected-chip removable-chip';chip.dataset.code=code;chip.disabled=state.running;
      chip.setAttribute('aria-label',`取消勾選 ${code}`);chip.title=`取消勾選 ${code}`;
      const label=document.createElement('span');label.textContent=code;
      const close=document.createElement('span');close.className='chip-remove';close.textContent='×';close.setAttribute('aria-hidden','true');chip.append(label,close);
      chip.addEventListener('click',()=>{
        if(state.running)return;
        const index=Array.from($('selectedWards').children).indexOf(chip),focused=document.activeElement===chip;
        const input=Array.from($('wardGrid').querySelectorAll('input')).find(input=>input.value===code);
        if(!input)return;
        input.checked=false;selectionChanged();
        if(focused){const chips=$('selectedWards').querySelectorAll('button');(chips[Math.min(index,chips.length-1)]||$('selectNone')).focus();}
      });
      $('selectedWards').append(chip);
    }
    if(!state.remembered.length)$('selectedWards').textContent='尚未勾選';
    presetStatus();invalidate();
  }
  function presetStatus(message,error=false){
    const saved=state.savedWards;
    const missing=saved?.filter(code=>!state.active?.options.some(o=>o.code===code))||[];
    const text=message??(saved===null?'尚未儲存預帶病房':saved.length?`預帶 ${saved.length} 個病房：${saved.join('、')}${missing.length?`（${missing.length} 個未出現在目前選單）`:''}`:'已儲存空白預帶名單，下次開啟不會自動勾選病房。');
    $('presetStatus').textContent=text;$('presetStatus').classList.toggle('error',error);
    $('saveWardPreset').disabled=state.running||state.savingPreset;
    $('applyWardPreset').disabled=state.running||state.savingPreset||saved===null;
  }
  async function saveWardPreset(){
    if(state.running||state.savingPreset||!state.active)return;
    const selected=selectedWards();state.savingPreset=true;presetStatus('正在儲存預帶病房…');
    try{
      if(!api?.storage?.local)throw new Error('瀏覽器儲存功能無法使用');
      await api.storage.local.set({wardCodes:selected});
      state.savedWards=[...selected];
      presetStatus(selected.length?`已儲存 ${selected.length} 個預帶病房：${selected.join('、')}。下次開啟會自動勾選。`:'已儲存空白預帶名單，下次開啟不會自動勾選病房。');
    }catch(e){presetStatus('預帶病房儲存失敗，原設定仍保留。請再試一次。',true);}
    finally{state.savingPreset=false;$('saveWardPreset').disabled=state.running;$('applyWardPreset').disabled=state.running||state.savedWards===null;}
  }
  function applyWardPreset(){
    if(state.running||state.savingPreset||state.savedWards===null)return;
    state.remembered=[...state.savedWards];$('wardFilter').value='';renderWards();
  }
  function renderWards(){
    $('wardGrid').replaceChildren();if(!state.active)return;
    const codes=[...new Set(state.active.options.map(o=>o.code))];
    for(const code of codes){
      const label=document.createElement('label');label.className='ward-pill';label.dataset.code=code;
      const input=document.createElement('input');input.type='checkbox';input.value=code;input.disabled=state.running;input.checked=state.remembered!==null?state.remembered.includes(code):code===state.active.selectedWard;
      input.addEventListener('change',selectionChanged);label.append(input,document.createTextNode(code));$('wardGrid').appendChild(label);
    }
    applyWardFilter();selectionChanged();
  }
  function categoryOf(code){return code.includes('P')?'child':/[EW]/.test(code)?'west':code.includes('H')?'health':'east';}
  function applyWardFilter(){
    const tokens=$('wardFilter').value.trim().toUpperCase().split(/[\s,，、;；]+/).filter(Boolean);let shown=0;
    for(const label of $('wardGrid').children){label.hidden=tokens.length>0?!tokens.some(t=>label.dataset.code.includes(t)):!state.category||categoryOf(label.dataset.code)!==state.category;if(!label.hidden)shown++;}
    $('categoryPrompt').hidden=shown>0;$('categoryPrompt').textContent=tokens.length?'所有病房中沒有符合的項目':state.category?'此分類沒有符合的病房':'請先選擇病房分類';
    for(const b of document.querySelectorAll('[data-category]'))b.setAttribute('aria-pressed',String(!tokens.length&&b.dataset.category===state.category));
    $('selectShown').disabled=state.running||!shown;
  }
  function updateMerged(){
    $('source').value=[...state.snapshots.values()].map(s=>s.text).join('\n\n');refresh();
    $('savedCount').textContent=`已擷取 ${state.snapshots.size} 個病房／頁面`;
  }
  function validateSnapshot(s,ward){
    verifyOrigin(s.origin);
    if(ward&&s.wards.some(w=>w!==ward))return false;
    if(s.pagination)throw new Error('此病房清單有分頁，無法確認已擷取全部病人；已停止。請改為顯示全部，或提供相容性資訊以調整分頁操作。');
    if(s.rowCount!==s.accountCount)throw new Error('部分帳號無法對應完整病人列，已停止以免漏列。');
    return s.ready&&!s.loading&&(s.rowCount>0||s.emptyExplicit);
  }
  async function snapshot(frameId){
    const results=await execute('snapshot',{},frameId);
    if(!results[0]?.result)throw new Error('無法取得清單內容，請確認來源頁面仍開啟。');
    return results[0].result;
  }
  function setRunning(running){
    state.running=running;window.CaptureRunning=running;
    for(const id of ['retryConnection','wardFilter','selectShown','selectNone','startBatch','saveWardPreset','applyWardPreset','clear','demo','analyze','openManual','baseDate','includeToday','today'])$(id).disabled=running;
    for(const button of document.querySelectorAll('[data-days]'))button.disabled=running;
    for(const x of $('wardGrid').querySelectorAll('input'))x.disabled=running;
    for(const chip of $('selectedWards').querySelectorAll('button'))chip.disabled=running;
    $('source').readOnly=running;$('stopBatch').disabled=!running;
    for(const button of document.querySelectorAll('[data-category]'))button.disabled=running;
    presetStatus();applyWardFilter();window.dispatchEvent(new Event('capturerunningchange'));
  }
  async function waitForWard(ward,control,allowStopped=false){
    const deadline=Date.now()+30000;
    let stableText=null,stableSince=0,lastReason='等待院內清單載入';
    while(Date.now()<deadline){
      if(state.stop&&!allowStopped)throw new Error('已由使用者停止');
      let s;
      try{s=await snapshot(control.frameId);}catch(e){
        // Same-origin full-page postbacks temporarily remove execution contexts.
        if(/removed|No frame|No document|context|frame was|Cannot find|frame with id/i.test(String(e.message))){await pause(500);continue;}
        throw e;
      }
      const selector=s.controls.find(c=>c.signature===control.signature&&(control.id?c.id===control.id:c.index===control.index));
      if(!selector){lastReason='等待病房選單重新載入';await pause(500);continue;}
      if(selector.selectedWard!==ward)throw new Error('來源病房選擇已改變，已停止；擷取期間請勿手動切換。');
      if(!s.rowCount&&!s.emptyExplicit){lastReason='未見病人列，無法分辨空病房與尚未載入';stableText=null;}
      else if(!validateSnapshot(s,ward)){lastReason=s.loading?'頁面仍在載入':'清單病房尚未更新';stableText=null;}
      else if(s.text!==stableText){stableText=s.text;stableSince=Date.now();lastReason='確認清單內容穩定';}
      else if(Date.now()-stableSince>=1500)return s;
      await pause(400);
    }
    throw new Error(`${ward} 等待超過 30 秒（${lastReason}）。若選單切換後還需要按「查詢」，此版本需依院內頁面調整。`);
  }
  function targetsFor(s){
    const base=parser.fromISO($('baseDate').value);
    if(base===null)throw new Error('請先設定基準日期。');
    return parser.filter(parser.parse(s.text,base).patients,base,selectedDays,$('includeToday').checked);
  }
  async function navigation(action,payload,frameId){
    try{return await execute(action,payload,frameId);}catch(e){if(!/removed|No document|context|frame was/i.test(String(e.message)))throw e;}
  }
  async function readPickupDetails(patient,control,detail){
    const saved=window.PatientDetails.get(patient.account),groups=(detail.pickupGroups||[]).filter(g=>window.DischargeDaily?.isNew(patient.account,g)!==false);
    saved.pickups=groups.map(g=>({number:g.number,orderDate:g.orderDate||'',sequence:g.sequence||'',sequences:g.sequences||[],status:'未確認',deliveryTimes:[],printTimes:[],deliveryTimeKnown:false,printTimeKnown:false,reason:'尚未讀取明細'}));
    saved.pickupComplete=detail.pickupComplete;
    refresh();
    for(let i=0;i<groups.length;i++){
      if(window.DischargeDaily&&!window.DischargeDaily.isCurrent())throw new Error('日期已變更，請重新開始擷取。');
      if(state.stop)throw new Error('已由使用者停止');
      const group=groups[i],entry=saved.pickups[i],started=Date.now();
      runStatus(`讀取 ${patient.bedNumber} ${patient.name}：領藥號 ${group.number}（${i+1}／${groups.length}）…`);
      if(!group.hasDetail){entry.reason='找不到此領藥號的「詳」按鈕';refresh();continue;}
      const payload={account:patient.account,mrn:detail.mrn,number:group.number,sequence:group.sequence,orderDate:group.orderDate};
      // Exactly one representative is opened for each unique pickup number.
      await navigation('openOrderDetail',payload,control.frameId);
      const deadline=Date.now()+4000;let last='',since=0,result;
      while(Date.now()<deadline){
        if(window.DischargeDaily&&!window.DischargeDaily.isCurrent())throw new Error('日期已變更，請重新開始擷取。');
      if(state.stop)throw new Error('已由使用者停止');
        let responses;
        try{responses=await execute('readOrderDetail',payload,control.frameId);}catch(e){if(/removed|No document|context|frame was/i.test(String(e.message))){await pause(200);continue;}throw e;}
        const d=responses[0]?.result;
        if(d?.origin)verifyOrigin(d.origin);
        if(d?.number!==group.number){await pause(200);continue;}
        result=d;
        if(d.ready&&['已刷出','已列印'].includes(d.status))break;
        const signature=d.ready?JSON.stringify([d.status,d.deliveryTimes,d.printTimes,d.recordCount]):'';
        if(signature!==last){last=signature;since=Date.now();}
        else if(signature&&Date.now()-since>=400)break;
        await pause(200);
      }
      // After opening this pickup's detail and finishing the polling window,
      // an absent record table is an empty record under the requested rule.
      Object.assign(entry,result?.ready?{status:result.status,deliveryTimes:result.deliveryTimes,printTimes:result.printTimes,deliveryTimeKnown:result.deliveryTimeKnown,printTimeKnown:result.printTimeKnown,reason:result.reason}:result?.missingRecord?{status:'無紀錄',deliveryTimes:[],printTimes:[],deliveryTimeKnown:true,printTimeKnown:true,reason:''}:{status:'未確認',deliveryTimes:[],printTimes:[],deliveryTimeKnown:false,printTimeKnown:false,reason:result?.reason||'明細讀取逾時'});
      state.deliveryDiagnostics.push({elapsedMs:Date.now()-started,status:entry.status,recordCount:result?.recordCount||0,tableCount:result?.tableCount||0});
      if(state.deliveryDiagnostics.length>200)state.deliveryDiagnostics.shift();
      refresh();
    }
  }
  async function enrichSnapshot(s,control){
    const targets=targetsFor(s);
    for(let i=0;i<targets.length;i++){
      if(window.DischargeDaily&&!window.DischargeDaily.isCurrent())throw new Error('日期已變更，請重新開始擷取。');
      if(state.stop)throw new Error('已由使用者停止');
      const patient=targets[i];let opened=false,detail;patientProgress(patient.account,'running');
      runStatus(`讀取 ${patient.ward} 出院病人 ${i+1}／${targets.length}：${patient.bedNumber} ${patient.name}…`);
      try{
        // Resolve the current row by account every time, never by ctl02/ctl03 index.
        opened=true;
        await navigation('selectPatient',{account:patient.account,name:patient.name,ward:patient.ward},control.frameId);
        await pause(350);
        const started=Date.now(),deadline=started+8000;let last='',since=0,fallback;
        while(Date.now()<deadline){
          if(window.DischargeDaily&&!window.DischargeDaily.isCurrent())throw new Error('日期已變更，請重新開始擷取。');
      if(state.stop)throw new Error('已由使用者停止');
          let response;
          try{response=await execute('patientDetails',{account:patient.account},control.frameId);}catch(e){if(/removed|No document|context|frame was/i.test(String(e.message))){await pause(400);continue;}throw e;}
          const d=response[0]?.result;
          if(d?.origin)verifyOrigin(d.origin);
          if(d?.ready)fallback={...d,drugStatus:'未確認'};
          // Confirm the complete pickup-number list is stable before opening details.
          const signature=d?.ready&&d.drugStatus!=='未確認'?JSON.stringify([d.mrn,d.sex,d.drugStatus,d.confirmedCount,d.pickupGroups]):'';
          if(!signature){last='';}
          else if(signature!==last){last=signature;since=Date.now();}
          else if(Date.now()-since>=(d.drugStatus==='有'?400:800)){detail=d;break;}
          await pause(400);
        }
        if(!detail)detail=fallback;
        if(!detail)throw new Error('病人頁面 8 秒內未能確認病歷號，已停止。');
        state.rxDiagnostics.push({elapsedMs:Date.now()-started,status:detail.drugStatus,...detail.diagnostics});
        if(state.rxDiagnostics.length>200)state.rxDiagnostics.shift();
        window.PatientDetails.set(patient.account,{mrn:detail.mrn,sex:detail.sex||'',drugStatus:detail.drugStatus,reason:detail.reason||'讀取逾時，請重新確認',name:patient.name,bedNumber:patient.bedNumber,pickups:[],pickupComplete:detail.pickupComplete});
        refresh();
        if(detail.drugStatus==='有')await readPickupDetails(patient,control,detail);
      }finally{
        if(opened){
          const responses=await execute('patientReturnState',{},control.frameId).catch(()=>[]);
          if(responses[0]?.result?.returnable){
            await navigation('returnPatientList',{},control.frameId);
            await pause(350);await waitForWard(patient.ward,control,true);
          }
        }
      }
      patientProgress(patient.account,'done');
      const ward=state.session.wards.find(w=>w.code===patient.ward);if(ward)ward.read=i+1;
      $('batchProgress').value=state.completed+(i+1)/Math.max(targets.length,1);publish();
    }
    return targets.length;
  }
  let starting=false;
  async function startBatch(mode='fresh'){
    if(starting||state.running)return;starting=true;
    try{await navigator.locks.request('discharge-portal-capture',{ifAvailable:true},async lock=>{if(!lock){runStatus('另一個工具視窗正在擷取，請稍後再試。',true);return;}await runBatch(mode);});}finally{starting=false;}
  }
  async function runBatch(mode='fresh'){
    if(state.running||window.DischargeBlocked||window.DischargeUpdating)return;
    if(typeof mode!=='string')mode='fresh';
    try{if(!await window.DischargeDaily.begin(mode))return;}catch(e){runStatus(e.message,true);return;}
    const wards=selectedWards();state.stop=false;window.dispatchEvent(new Event('capturestart'));setRunning(true);
    let current='';
    try{
      const control=await discoverControls();
      if(!control)throw new Error(portalMessage);
      if(!wards.length){runStatus('請先勾選至少一個病房。',true);return;}
      if(wards.some(code=>!control.options.some(o=>o.code===code)))throw new Error('病房選單已變更，請重新勾選病房。');
      state.completed=0;state.snapshots.clear();window.PatientDetails.clear();
      state.session={status:'running',wards:wards.map(code=>({code,status:'pending',read:0})),patients:{},signature:signature()};
      $('batchProgress').max=wards.length;$('batchProgress').value=0;
      banner('');publish();updateMerged();
      for(let i=0;i<wards.length;i++){
        if(window.DischargeDaily&&!window.DischargeDaily.isCurrent())throw new Error('日期已變更，請重新開始擷取。');
      if(state.stop)throw new Error('已由使用者停止');
        current=wards[i];const item=state.session.wards[i];item.status='running';publish();runStatus(`正在處理 ${i+1}／${wards.length}：${current}…`);
        const before=await snapshot(control.frameId);verifyOrigin(before.origin);
        await navigation('switch',{control,ward:current},control.frameId);
        await pause(500);const s=await waitForWard(current,control);
        if(window.DischargeDaily&&!window.DischargeDaily.isCurrent())throw new Error('日期已變更，請重新開始擷取。');
      if(state.stop)throw new Error('已由使用者停止');
        const targets=targetsFor(s);item.total=targets.length;
        for(const patient of targets)state.session.patients[patient.account]='pending';
        state.snapshots.set(current,s);publish();updateMerged();
        await enrichSnapshot(s,control);
        state.completed++;item.status='done';$('batchProgress').value=state.completed;publish();
      }
      state.session.status='complete';banner('');window.DischargeDaily?.completed();runStatus(`已完成 ${state.completed}／${wards.length} 個病房，本次名單 ${visibleRows.length} 人${window.DischargeDaily.mode==='incremental'?'（只列新增）':''}，可進入下一步。`);publish();
    }catch(e){
      state.session.status='stopped';
      const item=state.session.wards.find(w=>w.code===current);if(item)item.status='stopped';
      for(const account in state.session.patients)if(state.session.patients[account]==='running')state.session.patients[account]='stopped';
      runStatus(cleanError(e),true);publish();
    }finally{setRunning(false);}
  }
  $('retryConnection').addEventListener('click',async()=>{if(state.running)return;setRunning(true);try{await discoverControls();}catch(e){status(cleanError(e),true);}finally{setRunning(false);}});
  for(const button of document.querySelectorAll('[data-category]'))button.addEventListener('click',()=>{state.category=button.dataset.category;$('wardFilter').value='';for(const b of document.querySelectorAll('[data-category]'))b.setAttribute('aria-pressed',String(b===button));applyWardFilter();});
  $('wardFilter').addEventListener('input',applyWardFilter);
  $('selectShown').addEventListener('click',()=>{for(const label of $('wardGrid').children)if(!label.hidden)label.querySelector('input').checked=true;selectionChanged();});
  $('selectNone').addEventListener('click',()=>{for(const input of $('wardGrid').querySelectorAll('input'))input.checked=false;selectionChanged();});
  $('saveWardPreset').addEventListener('click',saveWardPreset);
  $('applyWardPreset').addEventListener('click',applyWardPreset);
  $('startBatch').addEventListener('click',startBatch);
  $('stopBatch').addEventListener('click',()=>{state.stop=true;$('stopBatch').disabled=true;runStatus('正在停止，已擷取的資料會保留…');});
  function resetSession(){state.snapshots.clear();window.PatientDetails.clear();state.completed=0;state.session={status:'idle',wards:[],patients:{},signature:''};banner('');$('savedCount').textContent='尚未擷取';$('batchProgress').value=0;runStatus('勾選病房後開始擷取');publish();}
  $('clear').addEventListener('click',()=>{resetSession();refresh();});
  $('demo').addEventListener('click',()=>{if($('source').value.startsWith('以下皆為虛構資料')){resetSession();refresh();$('savedCount').textContent='虛構範例';}});
  $('source').addEventListener('input',()=>{resetSession();$('savedCount').textContent='手動貼上／編輯';});
  $('analyze').addEventListener('click',()=>{if($('source').value.trim()){state.session={status:'complete',manual:true,wards:[],patients:{},signature:signature()};publish();}});
  ['baseDate','includeToday'].forEach(id=>$(id).addEventListener('change',invalidate));
  $('today').addEventListener('click',invalidate);
  for(const button of document.querySelectorAll('[data-days]'))button.addEventListener('click',invalidate);
  window.addEventListener('pagehide',()=>{state.stop=true;state.snapshots.clear();window.PatientDetails.clear();});
  async function init(){
    try{
      ensureConnection();
      try{const settings=await api.storage.local.get('wardCodes');if(Array.isArray(settings.wardCodes)){state.savedWards=[...new Set(settings.wardCodes.filter(code=>typeof code==='string'&&/^[0-9][A-Z0-9]{1,5}$/.test(code)))];state.remembered=[...state.savedWards];}}catch(e){}
      await discoverControls();publish();
    }catch(e){status(cleanError(e),true);$('retryConnection').hidden=false;}
  }
  window.DischargeCapture={init,start:startBatch,reset(){resetSession();$('source').value='';refresh();},stop(){state.stop=true;},settings:()=>({wards:selectedWards(),baseDate:$('baseDate').value,days:selectedDays,includeToday:$('includeToday').checked}),async restore(settings){
    if(!settings)return;state.remembered=[...settings.wards];if(!state.active)await discoverControls();renderWards();$('baseDate').value=settings.baseDate;selectedDays=settings.days;$('includeToday').checked=settings.includeToday;document.querySelectorAll('[data-days]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.days)===selectedDays)));refresh();
  }};
})();
