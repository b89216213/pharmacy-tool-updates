const assert=require('node:assert/strict');
module.exports=async function({ui,n,portal,core,settle,context,windowEvents},test){
  const originalData=portal.data,originalCleared=portal.clearedData,originalSettle=ui.engine.settlePatient.bind(ui.engine);
  const today=core.todayKey(),[year,month,day]=today.split('-'),roc=String(Number(year)-1911)+'/'+month+'/'+day;
  const relative=delta=>core.todayKey(new Date(Date.parse(today+'T04:00:00Z')+delta*86400000));
  const base=originalData[0],dates=[today,roc,relative(-1),relative(1),'','2026/02/30',today,today,month+'/'+day];
  const make=(i,discharge,ward='12PE')=>({...base,account:'26A'+String(500+i).padStart(8,'0'),mrn:String(8500500+i),personId:'A1'+String(500+i).padStart(8,'0'),name:'合成今日出院'+i,ward,room:String(i+1).padStart(2,'0'),bed:'01',admit:relative(-7),discharge,status:'住院中',note:'',careItems:[]});
  const residents=dates.map((date,i)=>make(i,date));residents[6].selectable=false;residents[7].status='藥帳已結清';residents.push(make(9,today,'12PW'));
  const cleared=[make(20,today),make(21,roc),make(22,relative(-1))].map(p=>({...p,status:'已出院'}));
  const accounts=rows=>Array.from(rows,p=>p.account);
  const selected=()=>Array.from(ui.checked.keys());
  const badge=p=>{
    const entry=n('results').innerHTML.match(new RegExp('data-patient="'+p.account+'"[\\s\\S]*?</button>'))?.[0]||'';
    return entry.includes('class="pc-today pc-today-discharge"');
  };
  const button=()=>n('select-today-discharge');
  const select=async expected=>{const clicks=portal.clicks.length;assert(!button().hidden);assert.equal(button().textContent,'全選今日出院（'+expected.length+'）');assert.equal(button().disabled,!expected.length);await button().emit('click');assert.deepEqual(selected(),accounts(expected));assert.equal(portal.clicks.length,clicks,'shortcut selection must not query, open or settle a patient');};
  portal.data=residents;portal.clearedData=cleared;
  try{
    await test('Today discharge selection uses the displayed date on in-bed rows, including confirmed billing, and skips unselectable or undated rows',async()=>{
      await ui.chooseWard('12PE');const expected=[residents[0],residents[1],residents[7]];
      for(const p of residents.slice(0,9))assert.equal(badge(p),[0,1,6,7].includes(residents.indexOf(p)),p.account);
      const row=ui.view().rows.find(p=>p.account===residents[7].account);ui.settlements.set(row.account,{status:'success',checkedAt:row.checkedAt});ui.renderResults();
      ui.togglePatient(residents[2].account,true);await select(expected);assert(n('select-all').indeterminate);assert.equal(n('selection-count').textContent,'已選 3 位');
      ui.queryChanged(residents[1].account);await select([residents[1]]);assert.equal(ui.checked.size,1);
      ui.queryChanged(residents[2].account);await select([]);assert(!badge(residents[2]));
      await ui.chooseWard('12PW');await ui.chooseWard('12PE');ui.queryChanged('26A000005');assert.equal(ui.view().scope,'all');await select([...expected,residents[9]]);
      await ui.chooseWard('14C');assert.equal(ui.view().rows.length,0);assert(button().disabled);assert(n('batch-toolbar').hidden);assert.equal(ui.checked.size,0);
    });
    await test('Note-only discharge dates drive badges and quick selection across in-bed, cleared, Smart Care and all native search results',async()=>{
      const short=today.slice(5).replace('-','/');
      for(const i of [0,1,6,7]){residents[i].discharge='';residents[i].note=short+(i===1?' 可出院':'可出院');}
      residents[2].discharge='';residents[2].note=short+'抽血';residents[3].discharge='';residents[3].note=relative(1).slice(5).replace('-','/')+'可出院';
      residents[4].note=short+'出院藥';residents[5].note=short+'可出院；取消出院';
      cleared[0].discharge='';cleared[0].note=short+'可出院';
      await ui.chooseWard('12PE');assert(badge(residents[0]));assert(n('results').innerHTML.includes('title="備註：'+short+'可出院"'));assert(n('results').innerHTML.includes(short+'可出院'));await select([residents[0],residents[1],residents[7]]);
      await ui.chooseWard('12PE');await ui.switchSource('cleared');for(const p of cleared)assert.equal(badge(p),p!==cleared[2]);await select([cleared[1],cleared[0]]);
      n('smart').checked=true;await n('smart').emit('change');await settle();assert(n('results').className.includes('pc-smart-list'));await select([cleared[1],cleared[0]]);
      await ui.switchSource('inbed');for(const p of residents.slice(0,9))assert.equal(badge(p),[0,1,6,7].includes(residents.indexOf(p)));await select([residents[0],residents[1],residents[7]]);
      n('smart').checked=false;await n('smart').emit('change');await settle();
      for(const query of ['12PE-01-01',residents[0].mrn,residents[0].account,residents[0].personId]){
        ui.queryChanged(query);await ui.lookup();assert.equal(ui.view().scope,'remote');assert(badge(residents[0]),query);await select([residents[0]]);assert(n('select-unsettled').hidden);
      }
      ui.queryChanged('12PE-21-01');await ui.lookup();await ui.switchSource('cleared');assert.equal(ui.view().rows[0].account,cleared[0].account);assert(badge(cleared[0]));await select([cleared[0]]);
      ui.queryChanged('0000999');await ui.lookup();assert.equal(ui.view().rows.length,0);assert(button().disabled);assert.equal(ui.checked.size,0);
    });
    await test('Today discharge selection starts no operation until batch action, freezes during processing and limits settlement to selected accounts',async()=>{
      await ui.chooseWard('12PE');await select([residents[0],residents[1],residents[7]]);
      const expected=selected(),attempts=[],sent=portal.clicks.filter(x=>x[0]==='settlement-submitted').length;
      portal.medStatuses.set(residents[7].account,'已結清');let release;const gate=new Promise(resolve=>{release=resolve;});
      ui.engine.settlePatient=async p=>{attempts.push(p.account);await gate;return originalSettle(p);};
      const pending=ui.settleBatch();assert(button().disabled);await button().emit('click');assert.deepEqual(selected(),expected);release();await pending;ui.engine.settlePatient=originalSettle;
      assert.deepEqual(attempts,expected);assert.deepEqual(portal.clicks.filter(x=>x[0]==='settlement-submitted').slice(sent).map(x=>x[1]),accounts([residents[0],residents[1]]));assert.equal(ui.state.batch.counts.already,1);assert(!button().disabled);
      await select([residents[0],residents[1],residents[7]]);
    });
    await test('Taiwan midnight updates every discharge badge and shortcut count together without querying or settling',async()=>{
      const RealDate=context.Date,originalTodayKey=context.todayKey;let instant='2026-10-22T15:59:59Z';
      context.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return RealDate.parse(instant);}};
      context.todayKey=(now=new context.Date())=>core.todayKey(now);
      try{
        const rows=[make(30,''),make(31,'115/10/22'),make(32,'')];rows[0].note='10/22可出院';rows[2].note='10/23可出院';portal.data=rows;
        await ui.chooseWard('12PE');windowEvents.dayTick();assert(badge(rows[0])&&badge(rows[1])&&!badge(rows[2]));await select(rows.slice(0,2));
        const before=portal.clicks.length;instant='2026-10-22T16:00:00Z';windowEvents.dayTick();assert(!badge(rows[0])&&!badge(rows[1])&&badge(rows[2]));assert.equal(button().textContent,'全選今日出院（1）');assert.equal(portal.clicks.length,before);
        await select([rows[2]]);
      }finally{context.Date=RealDate;context.todayKey=originalTodayKey;windowEvents.dayTick();}
    });
  }finally{
    ui.engine.settlePatient=originalSettle;portal.data=originalData;portal.clearedData=originalCleared;
    for(const p of [...residents,...cleared])portal.medStatuses.delete(p.account);
    await ui.chooseWard('12PE');
  }
};
