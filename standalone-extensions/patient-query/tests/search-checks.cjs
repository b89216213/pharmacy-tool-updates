const assert=require('node:assert/strict');
const {makePortal,DATA,Q,P}=require('./dom-fixture.cjs');
module.exports=async function({core,engineFixture,bridgePath},test){
  await test('One input recognizes native ward, bed, MRN, account and ID queries without name search',()=>{
    const wards=core.normalizeWards(['12PE','12PW','12A','0PI I'].map(code=>({code})));
    const cases=[
      ['１２ｐｗ',{kind:'ward',ward:'12PW'}],['12A',{kind:'ward',ward:'12A'}],
      ['01',{kind:'bed',ward:'12PE',room:'01',bed:''}],['01-01',{kind:'bed',ward:'12PE',room:'01',bed:'01'}],
      ['12-A',{kind:'bed',ward:'12PE',room:'12',bed:'A'}],['１２ｐｗ－０１－０１',{kind:'bed',ward:'12PW',room:'01',bed:'01'}],
      ['12PW 12 A',{kind:'bed',ward:'12PW',room:'12',bed:'A'}],['0PI I-08-01',{kind:'bed',ward:'0PI I',room:'08',bed:'01'}],
      ['0PII-08-01',{kind:'bed',ward:'0PI I',room:'08',bed:'01'}],['00001004',{kind:'mrn',value:'00001004'}],
      ['２６ａ０００００００４',{kind:'account',value:'26A00000004'}],['a100000004',{kind:'personId',value:'A100000004'}],
      ['AB00000001',{kind:'personId',value:'AB00000001'}],['A800000001',{kind:'personId',value:'A800000001'}]
    ];
    for(const [input,expected]of cases)assert.deepEqual(core.parseSearch(input,'12PE',wards),expected,input);
    for(const input of ['測試甲','12PE0101','26A000','12PE-01-01-01','bad'])assert.equal(core.parseSearch(input,'12PE',wards).kind,'invalid',input);
    assert.equal(core.parseSearch(' ','12PE',wards).kind,'empty');
  });
  await test('Native person queries clear higher-priority identifiers and old name controls, with one query click',()=>{
    const suffix={mrn:'txbChartNo',account:'txbAccountIdse',personId:'txbPersonId'};
    for(const [kind,value]of [['mrn','00001004'],['account',DATA[3].account],['personId','A100000004']]){
      const f=makePortal(bridgePath);f.get(P+'txbChartNo').value='00001001';f.get(P+'txbAccountIdse').value=DATA[0].account;f.get(P+'txbPersonId').value='A100000001';
      f.nameSelect.onEvent=()=>assert.fail('name selection must not post back');f.nameInput.onEvent=()=>assert.fail('name lookup must not run');
      const q=f.run(kind==='mrn'?'queryMRN':'queryPerson',{kind,value,mrn:value,token:kind});assert(q.ok,q.error);
      assert.deepEqual(f.clicks,[[kind,value]]);assert.equal(f.nameInput.value,'');assert.equal(f.nameSelect.value,'');
      for(const [key,end]of Object.entries(suffix))assert.equal(f.get(P+end).value,key===kind?value:'');
      const list=f.run('list');assert.equal(list.rows.length,1);assert.equal(list.rows[0].ward,'12PW');assert.equal(list.rows[0].account,DATA[3].account);
    }
  });
  await test('Unavailable or blocked person conditions stop before submitting another identifier',()=>{
    for(const mode of ['missing','blocked','ambiguous','invalid']){
      const f=makePortal(bridgePath);
      if(mode==='missing')f.get(P+'txbPersonId').setAttribute('id','missing');
      if(mode==='blocked'){f.get(P+'txbAccountIdse').value=DATA[0].account;f.get(P+'txbAccountIdse').disabled=true;}
      if(mode==='ambiguous'){const extra=new f.Element('input',{id:P+'btnQueryExtra',type:'submit',value:'查詢'});f.doc.body.append(extra);}
      const r=f.run('queryPerson',{kind:'personId',value:mode==='invalid'?'姓名':'A100000004',token:'blocked'});
      assert.equal(r.ok,false,mode);assert.equal(f.clicks.length,0,mode);
    }
  });
  await test('Bed queries use observed txbBedNo and retain the legacy suffix fallback, then full ward clears both filters',async()=>{
    for(const suffix of ['txbBedNo','txbBedCode']){
      const {engine,f}=engineFixture();if(suffix==='txbBedCode')f.get(Q+'txbBedNo').setAttribute('id',Q+suffix);
      await engine.connect();const r=await engine.queryBed({ward:'12PW',room:'01',bed:'01'});
      assert.equal(r.rows.length,1);assert.equal(r.rows[0].account,DATA[3].account);assert.equal(f.get(Q+suffix).value,'01');assert.equal(r.rows[0].queryBed.ward,'12PW');
      const room=await engine.queryBed({ward:'12PE',room:'12'});assert.equal(room.rows.length,2);assert.equal(f.get(Q+suffix).value,'');
      const full=await engine.loadWard('12PE');assert.equal(full.rows.length,3);assert.equal(f.get(Q+'txbRoomCode').value,'');assert.equal(f.get(Q+suffix).value,'');
    }
  });
  await test('Account and ID search cross wards and keep their original query when results expire or settle',async()=>{
    for(const [kind,value]of [['account',DATA[3].account],['personId','A100000004']]){
      const {engine,f,clock}=engineFixture();await engine.connect();const result=await engine.queryPerson(kind,value),p=result.rows[0];
      assert.equal(p.ward,'12PW');assert.equal(p.source,'person');assert.equal(p.queryPerson.kind,kind);assert.equal(p.queryPerson.value,value);
      clock.now+=16000;await engine.openPatient(p);assert.equal(f.clicks.filter(x=>x[0]===kind).length,2);assert(f.clicks.some(x=>x[0]==='select'&&x[1]===p.account));
      const out=await engine.settlePatient(p);assert.equal(out.status,'success',out.reason);assert.equal(f.clicks.filter(x=>x[0]===kind).length,3);assert(!f.clicks.some(x=>x[0]==='query'));
    }
  });
  await test('Cleared bed results requery the same native source and cannot select a replacement occupant',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();const r=await engine.queryBed({ward:'12PE',room:'01',bed:'01'},'cleared');
    assert.equal(r.rows.length,1);assert.equal(r.rows[0].source,'cleared');clock.now+=16000;
    const out=await engine.settlePatient(r.rows[0]);assert.equal(out.status,'success',out.reason);assert.equal(f.clicks.filter(x=>x[0]==='cleared').length,2);assert(!f.clicks.some(x=>x[0]==='query'));assert.equal(f.get(Q+'txbBedNo').value,'01');
    f.clearedData[0].bed='02';const moved=await engine.settlePatient(r.rows[0]);assert.equal(moved.status,'skipped');assert.equal(f.clicks.filter(x=>x[0]==='settle').length,1);
  });
  await test('Native cross-ward queries handle empty results, disable Smart Care and never repeat a lost click',async()=>{
    const {engine,f,clock}=engineFixture();f.enableMedCare();await engine.connect();await engine.loadWard('12PE','inbed',true);
    clock.lostClick='queryPerson';const r=await engine.queryPerson('account',DATA[3].account);assert.equal(r.rows[0].account,DATA[3].account);assert.equal(f.get('ckbMedCare').checked,false);assert.equal(r.smartCare,false);assert.equal(f.clicks.filter(x=>x[0]==='account').length,1);
    const empty=await engine.queryPerson('personId','A100009999');assert(empty.empty);assert.equal(empty.rows.length,0);
    const bed=await engine.queryBed({ward:'12PE',room:'99',bed:'01'});assert(bed.empty);assert.equal(bed.rows.length,0);
  });
  await test('Changed native search conditions or mismatched account and bed results cannot become accepted results',async()=>{
    for(const mode of ['criteria','account','bed']){
      const {engine,f}=engineFixture();await engine.connect();
      if(mode==='bed')f.get(Q+'btnQueryInBed').onClick=()=>f.showList([f.data[0]]);
      else f.get(P+'btnQuery').onClick=()=>{if(mode==='criteria')f.get(P+'txbAccountIdse').value=DATA[0].account;f.showList([f.data[0]]);};
      await assert.rejects(()=>mode==='bed'?engine.queryBed({ward:'12PW',room:'01',bed:'01'}):engine.queryPerson('account',DATA[3].account),/條件已變更|不一致/);assert.equal(engine.lastRead,null);assert(!f.clicks.some(x=>x[0]==='select'));
    }
  });
  await test('An MRN query is verified on the opened patient before settlement even when the result table omits MRNs',async()=>{
    const {engine,f}=engineFixture();await engine.connect();f.get(P+'btnQuery').onClick=()=>f.showList([f.data[0]]);
    const r=await engine.queryMRN('00001004');assert.equal(r.rows[0].mrn,'');
    const out=await engine.settlePatient(r.rows[0]);assert.equal(out.status,'skipped');assert(!f.clicks.some(x=>x[0]==='settle'));
  });
};
