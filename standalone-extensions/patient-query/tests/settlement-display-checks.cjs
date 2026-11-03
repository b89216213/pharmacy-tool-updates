const assert=require('node:assert/strict');
module.exports=async function({ui,n,portal,core,settle},test){
  const originalData=portal.data,originalCleared=portal.clearedData,originalSettle=ui.engine.settlePatient.bind(ui.engine);
  const make=(i,props={})=>({...originalCleared[0],account:'26A'+String(3000+i).padStart(8,'0'),mrn:String(8803000+i),name:'合成結清顯示'+i,ward:'12PE',room:String(i+1).padStart(2,'0'),bed:'01',status:'已出院寫卡／藥帳未結清',discharge:core.todayKey(),note:'請核對 <文字> & 註記／藥 帳：未 結 清／藥帳未結清',...props});
  const entry=account=>{const match=n('results').innerHTML.match(new RegExp('data-patient="'+account+'"[\\s\\S]*?</button>'));assert(match,account);return match[0];};
  const note=account=>{const match=entry(account).match(/<span class="pc-visible-note[^\"]*">([\s\S]*?)<\/span>/);assert(match);return match[1];};
  const visible=html=>html.replace(/<[^>]*>/g,'');
  const live=account=>ui.view().rows.find(p=>p.account===account);
  const confirmed=account=>{
    const content=entry(account),text=visible(content);
    assert(!core.billingUnsettledText(text),'confirmed rows must not visibly retain an unsettled label');
    assert.equal((note(account).match(/class="pc-billing-settled"/g)||[]).length,2);
    assert(note(account).includes('請核對 &lt;文字&gt; &amp; 註記/'));
    assert(content.includes('本次已確認結清；查詢時原文：'));
    assert(content.includes('藥帳已結清'));assert(!content.includes('pc-billing-unsettled'));
  };
  const pending=account=>{assert(core.billingUnsettledText(visible(note(account))));assert(entry(account).includes('pc-billing-unsettled'));assert(!entry(account).includes('pc-billing-settled'));};
  try{
    await test('Successful and already-settled rows replace only stale billing labels, preserve raw notes and regain unsettled text after a newer query',async()=>{
      const p=make(0);portal.data=[];portal.clearedData=[p];portal.nativeWarning='';portal.medStatuses.clear();
      await ui.chooseWard('12PE');await ui.switchSource('cleared');pending(p.account);
      const raw={note:live(p.account).note,status:live(p.account).status};
      await ui.settlePatient(live(p.account));assert.equal(ui.settlements.get(p.account).status,'success');confirmed(p.account);
      assert.equal(live(p.account).note,raw.note);assert.equal(live(p.account).status,raw.status);
      assert.equal(ui.cache.get(core.cacheKey('12PE','cleared',false)).rows[0].note,raw.note);
      ui.showDetails(live(p.account),n('pin'));assert(n('detail-fields').innerHTML.includes('備註（查詢時原文）'));assert(n('detail-fields').innerHTML.includes(core.escapeHTML(raw.note)));assert(n('detail-fields').innerHTML.includes('本次已確認結清'));
      ui.dismissSettlement(p.account);confirmed(p.account);
      portal.medStatuses.set(p.account,'未結清');await n('refresh').emit('click');pending(p.account);assert.equal(n('select-unsettled').textContent,'全選藥帳未結清（1）');
      portal.medStatuses.set(p.account,'已結清');const sent=portal.clicks.filter(x=>x[0]==='settlement-submitted').length;
      await ui.settlePatient(live(p.account));assert.equal(ui.settlements.get(p.account).status,'already');confirmed(p.account);assert.equal(portal.clicks.filter(x=>x[0]==='settlement-submitted').length,sent);
      n('smart').checked=true;await n('smart').emit('change');await settle();pending(p.account);await ui.settlePatient(live(p.account));confirmed(p.account);
      n('smart').checked=false;await n('smart').emit('change');await settle();
      ui.queryChanged(p.account);await ui.lookup();assert.equal(ui.view().scope,'remote');pending(p.account);await ui.settlePatient(live(p.account));confirmed(p.account);
    });
    await test('Mixed batch results update only verified patients while running, warning and uncertain notes remain unsettled',async()=>{
      const rows=[make(1),make(2),make(3)];portal.data=[];portal.clearedData=rows;portal.nativeWarning='';portal.medStatuses.clear();
      await ui.chooseWard('12PE');await ui.switchSource('cleared');const rawNotes=new Map(ui.view().rows.map(p=>[p.account,p.note]));
      ui.engine.settlePatient=async p=>{pending(p.account);portal.nativeWarning=p.account===rows[1].account?'合成警示：請先退藥':'';portal.deferSettlement=p.account===rows[2].account;try{return await originalSettle(p);}finally{portal.nativeWarning='';portal.deferSettlement=false;}};
      ui.selectAll(true);await ui.settleBatch();
      assert.equal(ui.state.batch.counts.success,1);assert.equal(ui.state.batch.counts.warning,1);assert.equal(ui.state.batch.counts.unknown,1);
      confirmed(rows[0].account);pending(rows[1].account);pending(rows[2].account);assert.equal(n('select-unsettled').textContent,'全選藥帳未結清（2）');
      for(const p of ui.view().rows)assert.equal(p.note,rawNotes.get(p.account));
      await n('refresh').emit('click');for(const p of rows)pending(p.account);
    });
  }finally{
    ui.engine.settlePatient=originalSettle;portal.data=originalData;portal.clearedData=originalCleared;portal.nativeWarning='';portal.deferSettlement=false;portal.medStatuses.clear();
    if(ui.state.smartCare){n('smart').checked=false;await n('smart').emit('change');await settle();}
    await ui.chooseWard('12PE');
  }
};
