const assert=require('node:assert/strict');
module.exports=async function({ui,n,portal,events,stored,core,idleButton,settle},test){
  const originalSettle=ui.engine.settlePatient.bind(ui.engine);
  const submissions=()=>portal.clicks.filter(x=>x[0]==='settlement-submitted');
  const reset=async()=>{ui.engine.settlePatient=originalSettle;portal.nativeWarning='';portal.medStatuses.clear();ui.queryChanged('');await ui.switchSource('inbed');};
  await test('Multi-select checkboxes and select-all affect only eligible visible patients and never open them',async()=>{
    await reset();const rows=ui.view().rows,blocked=portal.data.find(p=>p.account===rows[2].account);blocked.selectable=false;await ui.chooseWard('12PE');
    const before=portal.clicks.length;
    for(const fn of events.change||[])fn({target:{dataset:{checkPatient:rows[0].account},checked:true}});
    assert.equal(ui.checked.size,1);assert.equal(portal.clicks.length,before);assert(n('select-all').indeterminate);assert.equal(n('selection-count').textContent,'已選 1 位');
    ui.togglePatient(rows[2].account,true);assert.equal(ui.checked.size,1);
    n('select-all').checked=true;await n('select-all').emit('change');assert.equal(ui.checked.size,2);assert(n('select-all').checked);assert(!n('select-all').indeterminate);
    await n('selection-clear').emit('click');assert.equal(ui.checked.size,0);assert(n('batch-settle').disabled);
    blocked.selectable=true;await ui.chooseWard('12PE');ui.selectAll(true);assert.equal(ui.checked.size,3);
    ui.queryChanged(rows[0].account);assert.equal(ui.checked.size,0);ui.selectAll(true);assert.equal(ui.checked.size,1);ui.queryChanged('');
    ui.selectAll(true);await ui.chooseWard('12PW');assert.equal(ui.checked.size,0);await ui.chooseWard('12PE');ui.selectAll(true);
    await n('scope-current').emit('click');assert.equal(ui.checked.size,0);ui.selectAll(true);await ui.switchSource('cleared');assert.equal(ui.checked.size,0);await ui.switchSource('inbed');
    ui.selectAll(true);const cached=ui.cache.get(core.cacheKey('12PE')),p=cached.rows[0],previous=p.room;p.room='99';ui.renderResults();assert.equal(ui.checked.size,2,'a changed cached identity must lose its checkbox');p.room=previous;ui.selectAll(false);
  });
  await test('Batch settles sequentially, retains every warning and result, blocks double starts and freezes navigation',async()=>{
    await reset();const rows=ui.view().rows;portal.medStatuses.set(rows[2].account,'已結清');ui.selectAll(true);
    let release,started=0,active=0,maxActive=0;const accounts=[],gate=new Promise(resolve=>{release=resolve;});
    ui.engine.settlePatient=async p=>{started++;active++;maxActive=Math.max(maxActive,active);accounts.push(p.account);if(started===1)await gate;portal.nativeWarning=p.account===rows[0].account?'批次測試：請先退藥':'';try{return await originalSettle(p);}finally{active--;}};
    const before=submissions().length,queries=portal.clicks.filter(x=>x[0]==='query').length;
    const pending=n('batch-settle').emit('click');assert.equal(started,1);assert(n('search').disabled);assert(n('select-all').disabled);assert(!n('batch-stop').hidden);assert.equal(n('batch-meter').max,3);
    await ui.settleBatch();await ui.settlePatient(rows[1]);ui.selectAll(false);ui.queryChanged('不應更動');await ui.chooseWard('12PW');await ui.switchSource('cleared');
    assert.equal(started,1);assert.equal(ui.checked.size,3);assert.equal(ui.state.ward,'12PE');assert.equal(ui.state.query,'');assert.equal(ui.state.source,'inbed');
    release();await pending;assert.deepEqual(accounts,Array.from(rows,p=>p.account));assert.equal(maxActive,1);assert.equal(submissions().length,before+1);assert.equal(portal.clicks.filter(x=>x[0]==='query').length,queries+3);
    assert.deepEqual(JSON.parse(JSON.stringify(ui.state.batch.counts)),{success:1,already:1,warning:1,skipped:0,unknown:0});assert.equal(ui.state.batch.completed,3);assert.equal(n('batch-meter').value,3);
    assert(n('results').innerHTML.includes('批次測試：請先退藥'));assert.equal((n('results').innerHTML.match(/data-dismiss-settlement=/g)||[]).length,3);assert(n('batch-summary').textContent.includes('警示 1 位'));assert.equal(portal.storage.size,0);
    for(const p of rows)idleButton(p);assert(!n('batch-settle').disabled);assert.equal(ui.checked.size,3);assert(!n('search').disabled);
  });
  await test('The same selection can be batch-settled again after billing changes without retrying within one run',async()=>{
    ui.engine.settlePatient=originalSettle;portal.nativeWarning='';const rows=ui.view().rows;portal.medStatuses.set(rows[1].account,'未結清');const before=submissions().length;
    await ui.settleBatch();assert.equal(submissions().length,before+2);assert.equal(ui.state.batch.counts.success,2);assert.equal(ui.state.batch.counts.already,1);for(const p of rows)idleButton(p);
    await n('batch-dismiss').emit('click');assert(n('batch-progress').hidden);assert.equal(ui.checked.size,3);
  });
  await test('Stopping a batch completes only its current patient and reports the untouched remainder',async()=>{
    await reset();ui.selectAll(true);let release,started=0;ui.engine.settlePatient=()=>{started++;return new Promise(resolve=>{release=resolve;});};
    const pending=ui.settleBatch();await n('batch-stop').emit('click');assert(n('batch-stop').disabled);assert(n('batch-current').textContent.includes('目前這位處理完後停止'));
    release({status:'success',reason:'目前這位已完成'});await pending;assert.equal(started,1);assert.equal(ui.state.batch.completed,1);assert(n('batch-summary').textContent.includes('尚未處理 2 位'));assert.equal(ui.checked.size,3);assert(!n('batch-settle').disabled);
    for(const p of ui.view().rows)idleButton(p);
  });
  await test('A patient moved after selection is skipped and the following verified patient still completes',async()=>{
    await reset();const rows=ui.view().rows,moved=portal.data.find(p=>p.account===rows[1].account),room=moved.room;ui.selectAll(true);let started=0;
    ui.engine.settlePatient=async p=>{const result=await originalSettle(p);if(++started===1)moved.room='99';return result;};const before=submissions().length;
    await ui.settleBatch();assert.equal(started,3);assert.equal(ui.state.batch.counts.skipped,1);assert.equal(ui.state.batch.counts.success,2);assert(!submissions().slice(before).some(x=>x[1]===moved.account));moved.room=room;
  });
  await test('Cleared and Smart Care batches preserve the original query source and native visible selection links',async()=>{
    await reset();await ui.switchSource('cleared');ui.selectAll(true);const cleared=Array.from(ui.view().rows,p=>p.account),before=submissions().length;await ui.settleBatch();assert.equal(ui.state.batch.counts.success,2);assert.deepEqual(submissions().slice(before).map(x=>x[1]),cleared);
    await ui.switchSource('inbed');portal.medStatuses.clear();ui.selectAll(true);n('smart').checked=true;await n('smart').emit('change');await settle();assert.equal(ui.checked.size,0);assert(ui.view().rows.every(p=>p.selection==='medcare'));
    ui.selectAll(true);const count=ui.view().rows.length;await ui.settleBatch();assert.equal(ui.state.batch.counts.success,count);assert(n('results').className.includes('pc-smart-list'));assert.equal((n('results').innerHTML.match(/data-check-patient=/g)||[]).length,count);
    n('smart').checked=false;await n('smart').emit('change');await settle();
  });
  await test('Uncertain results are kept without automatic retries and navigation recovery failure stops the remainder',async()=>{
    await reset();ui.selectAll(true);portal.deferSettlement=true;const before=submissions().length;await ui.settleBatch();assert.equal(ui.state.batch.counts.unknown,3);assert.equal(submissions().length,before+3);for(const p of ui.view().rows)idleButton(p);portal.deferSettlement=false;
    await reset();ui.selectAll(true);const ensureList=ui.engine.ensureList.bind(ui.engine);
    ui.engine.ensureList=async()=>{if(ui.engine.phase==='checking-settlement')throw new Error('合成：無法返回名單');return ensureList();};
    const sent=submissions().length;await ui.settleBatch();assert.equal(submissions().length,sent+1);assert.equal(ui.state.batch.completed,1);assert(n('batch-summary').textContent.includes('尚未處理 2 位'));assert(ui.state.batch.stopReason);ui.engine.ensureList=ensureList;
    await reset();const call=ui.engine.call.bind(ui.engine);ui.engine.call=async(action,...args)=>{if(action==='settlementState')throw Object.assign(new Error('合成：登入已失效'),{code:'LOGIN'});return call(action,...args);};ui.selectAll(true);
    const submitted=submissions().length;await ui.settleBatch();assert.equal(ui.state.batch.completed,1);assert.equal(submissions().length,submitted);assert(ui.state.batch.stopReason);ui.engine.call=call;
    await reset();assert.deepEqual(Object.keys(Object.values(stored)[0]).sort(),['campus','lastWard','pinned']);assert(!JSON.stringify(stored).includes('測試'));assert(!JSON.stringify(stored).includes(ui.view().rows[0].account));
  });
};
