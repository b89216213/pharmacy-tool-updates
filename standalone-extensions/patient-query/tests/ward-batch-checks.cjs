const assert=require('node:assert/strict');
module.exports=async function({ui,n,portal,core,settle,context,events,stored},test){
  const originalData=portal.data,originalCleared=portal.clearedData,originalSettle=ui.engine.settlePatient.bind(ui.engine),originalLoad=ui.engine.loadWard.bind(ui.engine),originalTimer=context.setTimeout;
  const today=core.todayKey(),short=today.slice(5).replace('-','/');
  const make=(i,ward,props={})=>({...originalData[0],ward,account:'26A'+String(800+i).padStart(8,'0'),mrn:String(8600800+i),personId:'A1'+String(800+i).padStart(8,'0'),name:'跨房合成'+i,room:String(i+1).padStart(2,'0'),bed:'01',admit:'2026/01/01',discharge:'',status:'住院中',note:'',careItems:[],selectable:true,...props});
  const inbed=[make(0,'12PE',{note:short+'可出院'}),make(1,'12PE',{discharge:today}),make(2,'12PE',{note:short+'抽血'}),make(3,'12PW',{discharge:today}),make(4,'12PW',{discharge:today,selectable:false})];
  const cleared=[{...inbed[0],status:'藥帳未結清'},make(5,'12PE',{status:'已出院寫卡',note:'藥帳：未結清',discharge:today}),make(6,'12PE',{status:'已出院寫卡',discharge:today}),make(7,'12PW',{status:'已出院／出院準備',note:'藥帳未結清',discharge:today})];
  const selectWards=(...codes)=>{ui.wardBatch.selected.clear();for(const code of codes)ui.toggleBatchWard(code,true);};
  const submissions=()=>portal.clicks.filter(x=>x[0]==='settlement-submitted').map(x=>x[1]);
  const waitFor=async predicate=>{for(let i=0;i<200&&!predicate();i++)await new Promise(resolve=>setImmediate(resolve));assert(predicate(),'expected asynchronous operation to reach checkpoint');};
  const reset=async()=>{
    ui.engine.settlePatient=originalSettle;ui.engine.loadWard=originalLoad;context.setTimeout=originalTimer;portal.data=inbed.map(p=>({...p}));portal.clearedData=cleared.map(p=>({...p}));portal.nativeWarning='';portal.medStatuses.clear();portal.deferSettlement=false;
    ui.wardBatch.inbed=true;ui.wardBatch.cleared=true;ui.wardBatch.run=null;ui.wardBatch.open=true;ui.settlements.clear();
    await ui.chooseWard('12PE');selectWards('12PE','12PW','14C');
  };
  try{
    await test('Ward batch starts with both options enabled and no selected wards; checkbox selection never queries or settles',async()=>{
      assert(ui.wardBatch.inbed&&ui.wardBatch.cleared);assert.equal(ui.wardBatch.selected.size,0);assert(n('ward-batch-start').disabled);assert(n('ward-batch-panel').hidden);
      const before=portal.clicks.length;await n('ward-batch-toggle').emit('click');assert(!n('ward-batch-panel').hidden);assert(n('wards').innerHTML.includes('data-batch-ward='));
      for(const code of ['12PE','14C'])for(const handler of events.change)handler({target:{dataset:{batchWard:code},checked:true}});
      ui.toggleBatchWard('12PE',true);assert.equal(ui.wardBatch.selected.size,2);assert.equal(portal.clicks.length,before);assert(n('ward-batch-selected').innerHTML.includes('14C'));
      n('ward-batch-inbed').checked=false;await n('ward-batch-inbed').emit('change');n('ward-batch-cleared').checked=false;await n('ward-batch-cleared').emit('change');assert(n('ward-batch-start').disabled);await ui.startWardBatch();assert.equal(portal.clicks.length,before);
      await n('ward-batch-clear').emit('click');assert.equal(ui.wardBatch.selected.size,0);await n('ward-batch-close').emit('click');assert(n('ward-batch-panel').hidden);assert(n('wards').innerHTML.includes('data-ward='));
    });
    await test('Multi-ward execution freshly queries in-bed then cleared per ward, visibly selects exact targets and continues after warnings or empty wards',async()=>{
      await reset();n('smart').checked=true;await n('smart').emit('change');await settle();ui.queryChanged(inbed[2].account);
      const loads=[],attempts=[],frames=[];let active=0,maxActive=0;
      context.setTimeout=fn=>{const run=ui.wardBatch.run;if(run?.running)frames.push({ward:ui.state.ward,source:ui.state.source,phase:run.phase,selected:[...ui.checked.keys()],action:n('ward-batch-action').textContent,position:n('ward-batch-patient-position').textContent});fn();};
      ui.engine.loadWard=async(...args)=>{loads.push(args);return originalLoad(...args);};
      ui.engine.settlePatient=async p=>{active++;maxActive=Math.max(maxActive,active);attempts.push(p.account);assert(ui.checked.has(p.account));assert(n('search').disabled);assert(n('ward-batch-toggle').disabled);assert(n('wards').innerHTML.includes(' disabled'));assert(!n('ward-batch-progress').hidden);assert(!n('ward-batch-panel').hidden);assert(n('ward-batch-config').hidden);assert(n('ward-batch-setup-actions').hidden);assert(n('batch-toolbar').hidden);assert(n('batch-stop').hidden);assert(n('loading').hidden);assert(n('ward-batch-action').textContent.includes(p.name));assert.equal((n('results').innerHTML.match(/data-auto-current="true"/g)||[]).length,1);assert(n('results').innerHTML.includes('pc-processing'));const [i,total]=n('ward-batch-patient-position').textContent.match(/\d+/g).map(Number);assert(i>=1&&i<=total);portal.nativeWarning=p.account===inbed[0].account?'跨房測試：請先退藥':'';try{return await originalSettle(p);}finally{active--;}};
      context.window.scrollY=600;context.scrollEvents.length=0;
      const before=submissions().length;await n('ward-batch-start').emit('click');
      assert.equal(context.window.scrollY,0,'the visible work area must stay at the top throughout the run');
      assert.deepEqual(context.scrollEvents.map(e=>e.kind),['window'],'only the initial return to the top may scroll the page');
      assert.equal(context.scrollEvents[0].top,0);assert.equal(n('picker').dataset.autoRunning,'false');
      assert.deepEqual(loads,[['12PE','inbed',false],['12PE','cleared',false],['12PW','inbed',false],['12PW','cleared',false],['14C','inbed',false],['14C','cleared',false]]);
      assert.deepEqual(attempts,[inbed[0].account,inbed[1].account,cleared[1].account,inbed[3].account,cleared[3].account]);assert.equal(maxActive,1);
      assert.deepEqual(submissions().slice(before),attempts.slice(1));assert.equal(ui.state.query,'');assert.equal(ui.state.smartCare,false);
      assert(frames.some(f=>f.ward==='12PE'&&f.source==='inbed'&&f.phase==='query'&&f.action.includes('正在查詢在床病人名單')&&!f.selected.length&&!f.position));
      assert(frames.some(f=>f.ward==='12PE'&&f.source==='inbed'&&f.phase==='select'&&f.action==='已勾選 2 位今日出院病人'&&f.selected.join(',')===inbed.slice(0,2).map(p=>p.account).join(',')));
      const run=ui.wardBatch.run;assert(!run.running&&!run.stopRequested);assert.equal(run.wards[0].stages[1].duplicates,1);assert.equal(run.wards[1].stages[0].counts.skipped,1);assert(run.wards[2].stages.every(s=>s.status==='empty'));
      assert(n('ward-batch-position').textContent.includes('完成 3／3'));assert(n('ward-batch-summary').textContent.includes('已確認結清 4 位'));assert(n('ward-batch-issues').innerHTML.includes('跨房測試：請先退藥'));assert(n('ward-batch-report').innerHTML.includes('無選取入口 1 位'));assert(n('ward-batch-issues').innerHTML.includes(inbed[0].name));assert(!n('ward-batch-attention').hidden);assert(!n('ward-batch-details').open);assert.equal(ui.state.batch,null);assert(n('batch-progress').hidden);assert(!n('ward-batch-start').disabled);assert(!ui.state.busy);
      assert.deepEqual(Object.keys(Object.values(stored)[0]).sort(),['campus','lastWard','pinned']);assert(!JSON.stringify(stored).includes('跨房合成'));assert.equal(portal.storage.size,0);
    });
    await test('A fresh user-started ward run can settle the same accounts again after billing changes',async()=>{
      ui.engine.settlePatient=originalSettle;portal.nativeWarning='';portal.medStatuses.clear();const before=submissions().length;await ui.startWardBatch();
      const sent=submissions().slice(before);assert.equal(sent.length,5);assert(sent.includes(inbed[0].account));assert(sent.includes(inbed[1].account));assert.equal(new Set(sent).size,5);assert(!ui.wardBatch.run.stopRequested);
    });
    await test('Changed discharge or unsettled criteria are freshly checked before opening patients and manual settlement remains unrestricted',async()=>{
      await reset();selectWards('12PE');const before=submissions().length;
      ui.engine.settlePatient=async p=>{if(p.account===inbed[0].account)portal.data.find(x=>x.account===p.account).note=short+'抽血';if(p.account===cleared[1].account)portal.clearedData.find(x=>x.account===p.account).note='';return originalSettle(p);};
      await ui.startWardBatch();assert.deepEqual(submissions().slice(before),[inbed[1].account]);assert(n('ward-batch-issues').innerHTML.includes('最新名單已不符合今日出院'));assert(n('ward-batch-issues').innerHTML.includes('最新名單已無藥帳未結清'));
      for(const p of ui.checked.values())assert.equal(p.settlementCriteria,undefined);
      ui.engine.settlePatient=originalSettle;await ui.settleBatch();assert.deepEqual(submissions().slice(before),[inbed[1].account,cleared[1].account],'the existing manual batch must not inherit the automatic filter');
    });
    await test('Either ward option can run alone; unavailable or removed ward selections never start a run',async()=>{
      await reset();selectWards('12PW');ui.wardBatch.cleared=false;const loads=[];ui.engine.loadWard=async(...args)=>{loads.push(args);return originalLoad(...args);};await ui.startWardBatch();assert.deepEqual(loads,[['12PW','inbed',false]]);
      loads.length=0;ui.wardBatch.inbed=false;ui.wardBatch.cleared=true;await ui.startWardBatch();assert.deepEqual(loads,[['12PW','cleared',false]]);
      loads.length=0;ui.state.canCleared=false;await ui.startWardBatch();assert.equal(loads.length,0);ui.state.canCleared=true;
      ui.wardBatch.selected.add('NOT-A-WARD');await ui.startWardBatch();assert.equal(loads.length,0);assert(!n('error').hidden);
    });
    await test('The consolidated stop control completes its current patient, blocks double starts and stops all later wards and stages',async()=>{
      await reset();let release,started=0;const loads=[];ui.engine.loadWard=async(...args)=>{loads.push(args);return originalLoad(...args);};ui.engine.settlePatient=()=>{started++;return new Promise(resolve=>{release=resolve;});};
      const pending=ui.startWardBatch();await waitFor(()=>started===1);assert.equal(ui.checked.size,2);const selection=[...ui.wardBatch.selected];
      await ui.startWardBatch();await ui.settleBatch();await ui.chooseWard('14C');await ui.switchSource('cleared');ui.toggleBatchWard('12PE',false);await n('ward-batch-clear').emit('click');await n('ward-batch-close').emit('click');ui.queryChanged('1234567');
      assert.equal(started,1);assert.deepEqual([...ui.wardBatch.selected],selection);assert(ui.wardBatch.open);assert.equal(ui.state.ward,'12PE');assert.equal(ui.state.query,'');
      assert(n('batch-stop').hidden);await n('ward-batch-stop').emit('click');assert(n('ward-batch-stop').disabled);assert(n('ward-batch-action').textContent.includes('完成後停止'));release({status:'success',reason:'合成完成'});await pending;
      assert.equal(started,1);assert.equal(loads.length,1);assert.equal(ui.wardBatch.run.wards[0].stages[0].completed,1);assert.equal(ui.wardBatch.run.wards[0].stages[0].status,'stopped');assert.equal(ui.wardBatch.run.wards[0].stages[1].status,'pending');assert(n('ward-batch-report').innerHTML.includes('尚未處理 1 位'));assert(!ui.state.busy);
    });
    await test('Stopping while a ward query is pending never starts settlement or a following query',async()=>{
      await reset();let release,loads=0,attempts=0;ui.engine.loadWard=async(...args)=>{loads++;await new Promise(resolve=>{release=resolve;});return originalLoad(...args);};ui.engine.settlePatient=async()=>{attempts++;};
      const pending=ui.startWardBatch();await waitFor(()=>!!release);await n('ward-batch-stop').emit('click');release();await pending;
      assert.equal(loads,1);assert.equal(attempts,0);assert.equal(ui.checked.size,0);assert.equal(ui.wardBatch.run.current.status,'stopped');assert(!ui.state.busy);
    });
    await test('Management restrictions finish only the current patient and block every later patient, ward and manual action',async()=>{
      await reset();let release,started=0;const loads=[];ui.engine.loadWard=async(...args)=>{loads.push(args);return originalLoad(...args);};ui.engine.settlePatient=()=>{started++;return new Promise(resolve=>{release=resolve;});};
      const pending=ui.startWardBatch();await waitFor(()=>started===1);ui.setManagedBlocked(true);
      try{
        await ui.settlePatient(ui.view().rows[0]);await ui.openPatient(ui.view().rows[0]);await ui.chooseWard('12PW');await ui.lookup();
        release({status:'success',reason:'合成完成'});await pending;
        assert.equal(started,1);assert.equal(loads.length,1);assert(ui.wardBatch.run.stopRequested);assert.equal(ui.wardBatch.run.current.completed,1);assert(!ui.state.busy);
        await ui.startWardBatch();await ui.settleBatch();assert.equal(started,1);assert.equal(loads.length,1);
      }finally{ui.setManagedBlocked(false);}
    });
    await test('Partial or failed ward queries stop before settling from incomplete or previous lists',async()=>{
      for(const failure of ['pagination','exception','superseded']){
        await reset();let loads=0,attempts=0;ui.engine.loadWard=async(...args)=>{loads++;if(failure==='exception')throw new Error('合成：名單查詢失敗');const r=await originalLoad(...args);return {...r,[failure]:true};};ui.engine.settlePatient=async()=>{attempts++;};
        await ui.startWardBatch();assert.equal(attempts,0,failure);assert.equal(loads,1);assert(ui.wardBatch.run.stopRequested);assert.equal(ui.wardBatch.run.current.status,'error');assert(!ui.state.busy);assert(n('ward-batch-action').textContent.includes(failure==='pagination'?'分頁':failure==='exception'?'查詢失敗':'查詢條件已變更'));
      }
    });
    await test('Losing cleared-list access between stages keeps the finished in-bed result and marks the correct unfinished stage',async()=>{
      await reset();selectWards('12PE');ui.engine.loadWard=async(...args)=>{const r=await originalLoad(...args);return {...r,control:{...r.control,clearedEnabled:false}};};
      await ui.startWardBatch();assert.equal(ui.wardBatch.run.wards[0].stages[0].status,'done');assert.equal(ui.wardBatch.run.wards[0].stages[1].status,'error');assert.equal(ui.wardBatch.run.current.source,'cleared');assert(ui.wardBatch.run.stopRequested);
    });
    await test('Connection or list-recovery failures inside settlement stop every remaining patient and ward',async()=>{
      await reset();let attempts=0;ui.engine.settlePatient=async()=>{attempts++;return {status:'unknown',reason:'合成：無法返回名單',stopBatch:true};};
      await ui.startWardBatch();assert.equal(attempts,1);assert(ui.wardBatch.run.stopRequested);assert.equal(ui.wardBatch.run.wards[0].stages[1].status,'pending');assert(n('ward-batch-issues').innerHTML.includes('無法返回名單'));assert(n('ward-batch-summary').textContent.includes('待確認 1 位'));
    });
    await test('Taiwan date rollover stops a ward run before starting another patient',async()=>{
      await reset();const originalToday=context.todayKey;let attempts=0;
      try{ui.engine.settlePatient=async()=>{attempts++;context.todayKey=()=>core.todayKey(new Date(Date.parse(today+'T04:00:00Z')+86400000));return {status:'success',reason:'合成完成'};};await ui.startWardBatch();assert.equal(attempts,1);assert(ui.wardBatch.run.stopRequested);assert(n('ward-batch-action').textContent.includes('日期已變更'));}
      finally{context.todayKey=originalToday;}
    });
    await test('Login loss during ward query clears patient data and unlocks reconnection without continuing',async()=>{
      await reset();let loads=0;ui.engine.loadWard=async()=>{loads++;throw Object.assign(new Error('合成：登入已失效'),{code:'LOGIN'});};await ui.startWardBatch();
      assert.equal(loads,1);assert(!ui.state.connected);assert(!ui.state.busy);assert.equal(ui.wardBatch.run,null);assert.equal(ui.cache.size,0);assert.equal(n('ward-batch-report').innerHTML,'');assert(!n('connect').disabled);
      ui.engine.loadWard=originalLoad;await n('connect').emit('click');assert(ui.state.connected);
    });
    await test('Closing the source during a ward run ignores late patient replies and clears cross-ward history',async()=>{
      await reset();let release,started=0;ui.engine.settlePatient=()=>{started++;return new Promise(resolve=>{release=resolve;});};
      const pending=ui.startWardBatch();await waitFor(()=>started===1);events.sourceRemoved(7);release({status:'success',reason:'不可顯示的延遲回覆'});await pending;
      assert.equal(started,1);assert.equal(ui.wardBatch.run,null);assert.equal(ui.checked.size,0);assert.equal(ui.cache.size,0);assert.equal(n('ward-batch-report').innerHTML,'');assert.equal(n('ward-batch-current').textContent,'');assert(!n('results').innerHTML.includes('跨房合成'));assert(!ui.state.busy);
      ui.engine.closed=false;ui.engine.settlePatient=originalSettle;await n('connect').emit('click');assert(ui.state.connected);
    });
  }finally{
    ui.engine.settlePatient=originalSettle;ui.engine.loadWard=originalLoad;context.setTimeout=originalTimer;portal.data=originalData;portal.clearedData=originalCleared;portal.nativeWarning='';portal.medStatuses.clear();ui.wardBatch.run=null;ui.wardBatch.selected.clear();ui.wardBatch.open=false;ui.wardBatch.inbed=true;ui.wardBatch.cleared=true;await ui.chooseWard('12PE');
  }
};
