const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {makePortal,DATA,Q,P,GRID,INFO,Element}=require('./dom-fixture.cjs');
const root=path.resolve(__dirname,'..'),bridgePath=path.join(root,'extension/bridge.js');
const checks=[];
async function test(label,fn){await fn();checks.push(label);}
(async()=>{
  globalThis.crypto ||= crypto.webcrypto;
  const core=await import('../extension/core.js'),{PortalEngine}=await import('../extension/engine.js');
  await test('Dynamic ward classification splits combined pediatric codes and deduplicates aliases',()=>{
    const wards=core.normalizeWards([{code:'11PE+11PW',value:'x'},{code:'11PW',value:'y'},{code:'04E2',value:'a'},{code:'07HS',value:'b'},{code:'05C',value:'c'},{code:'0PI I',value:'d'}]);
    assert.equal(wards.length,6);assert.equal(wards.find(w=>w.code==='11PW').campus,'兒醫');assert.equal(core.campusOf('04E2'),'西址');assert.equal(core.campusOf('07HS'),'健大');assert.equal(core.campusOf('5CVI'),'東址');
  });
  await test('Short beds stay in current ward; same-name patients retain separate account and MRN identities',()=>{
    const wards=core.normalizeWards([{code:'12PE'},{code:'12PW'},{code:'12A'}]);
    const bed=core.searchModel('12','12PE','auto',DATA,wards);assert.equal(bed.scope,'current');assert.equal(bed.rows.length,2);
    assert.equal(core.searchModel('同名測試','12PE','auto',DATA,wards).rows.length,0);assert.notEqual(DATA[2].account,DATA[3].account);
    const combined=core.searchModel('１２ｐｅ－１２','12PE','auto',DATA,wards);assert.equal(combined.rows.length,2);
    const mixed=core.searchModel('12PE 12A','12PE','auto',DATA,wards);assert.equal(mixed.rows.length,1);
    const exact=core.searchModel('00001004','12PE','auto',DATA,wards);assert.equal(exact.rows[0].account,DATA[3].account);
    assert(!core.samePatient(DATA[2],DATA[3]));assert(core.highlight('<img src=x>', '').includes('&lt;img'));assert(!core.highlight('<img src=x>', '').includes('<img'));
  });
  await test('Cleared sorting compares full Gregorian or ROC dates, breaks day ties by bed, and puts missing or invalid dates last',()=>{
    const rows=[
      {id:'old',room:'1',discharge:'2025/12/31'},
      {id:'new-high-bed',room:'20',discharge:'2026/10/9'},
      {id:'new-low-bed',room:'2',discharge:'115/10/09'},
      {id:'yesterday',room:'3',discharge:'20261008'},
      {id:'missing',room:'4',discharge:''},
      {id:'invalid',room:'5',discharge:'2026/02/30'}
    ].map(p=>({...p,ward:'12PE',bed:'01'}));
    assert.deepEqual(rows.sort(core.dischargeSort).map(p=>p.id),['new-low-bed','new-high-bed','yesterday','old','missing','invalid']);
  });
  await test('Bridge reads the known hospital table without exposing unknown MRNs as real values',()=>{
    const f=makePortal(bridgePath),d=f.run('discover'),r=f.run('list');assert(d.ok&&d.control&&d.canQueryMRN);assert.equal(r.rows.length,3);assert.equal(r.rows[0].account,DATA[0].account);assert.equal(r.rows[0].mrn,'');assert.equal(r.rows[0].sex,'男');assert.equal(r.rows[0].room,'12');assert(d.control.options.some(w=>w.code==='11PW'));assert(d.control.options.some(w=>w.code==='0PI I'));
  });
  await test('Query clears room/bed filters and cannot mistake an old grid for completed results',()=>{
    const f=makePortal(bridgePath);f.defer=true;const d=f.run('discover'),q=f.run('queryWard',{ward:'12PW',token:'q1',expectedDoc:d.marker.doc});
    assert(q.ok);assert.equal(f.get(Q+'txbRoomCode').value,'');assert.equal(f.get(Q+'txbBedNo').value,'');let r=f.run('list',{baseline:q.baseline,token:'q1'});assert(r.loading);assert.equal(r.completed,false);f.finish();r=f.run('list',{baseline:q.baseline,token:'q1'});assert(r.completed&&!r.loading);assert.equal(r.rows.length,1);assert.equal(r.rows[0].ward,'12PW');
    const empty=f.run('queryWard',{ward:'14C',token:'q2'});f.finish();r=f.run('list',{baseline:empty.baseline,token:'q2'});assert(r.ready&&r.empty&&r.completed);assert.equal(r.rows.length,0);
  });
  await test('Ward query matches the discharge tool with a CSS-hidden text field and exactly one query click',()=>{
    const f=makePortal(bridgePath),input=f.get(Q+'txbWardCode'),select=f.get(Q+'ddlListWard'),events=[];
    input.hidden=true;
    input.onEvent=e=>{events.push(e.type);assert.equal(e.bubbles,true);assert.equal(input.value,'12PW');assert.equal(select.value,'12PW');assert.equal(f.get(Q+'txbRoomCode').value,'');assert.equal(f.get(Q+'txbBedNo').value,'');assert.equal(f.clicks.length,0);};
    select.onEvent=e=>{if(e.type==='change')f.get(Q+'btnQueryInBed').click();events.push('select:'+e.type);};
    const d=f.run('discover');assert(d.control?.enabled,'hidden text field must not block discovery');
    assert(f.run('queryWard',{ward:'12PW',token:'hidden',expectedDoc:d.marker.doc}).ok);
    assert.deepEqual(events,['input']);assert.deepEqual(f.clicks,[['query','12PW']]);assert.equal(f.run('list').rows[0].ward,'12PW');
  });
  await test('Ward discovery survives an unavailable query button but does not click until it is ready',()=>{
    const f=makePortal(bridgePath),button=f.get(Q+'btnQueryInBed');button.hidden=true;
    const d=f.run('discover');assert(d.recognized&&d.control.options.length>0);assert.equal(d.control.enabled,false);
    assert.equal(f.run('queryWard',{ward:'12PW',token:'blocked'}).ok,false);assert.equal(f.clicks.length,0);
    button.hidden=false;assert(f.run('queryWard',{ward:'12PW',token:'retry'}).ok);assert.equal(f.clicks.length,1);
  });
  await test('Interactive documents and transparent progress indicators do not block usable query controls',()=>{
    const f=makePortal(bridgePath);f.doc.readyState='interactive';const progress=new Element('div',{id:'AsyncUpdateProgress',opacity:'0'});f.doc.body.append(progress);
    f.context.crypto={};assert.equal(f.run('discover').loading,false);assert(f.run('queryWard',{ward:'12PW',token:'http'}).ok);
    progress.attrs.opacity='1';assert.equal(f.run('discover').loading,true);assert.equal(f.run('queryWard',{ward:'12PE',token:'busy'}).ok,false);
    progress.attrs.opacity='0';assert.equal(f.run('queryWard',{ward:'12PE',token:'expired',deadline:1}).ok,false);assert.equal(f.clicks.length,1);
  });
  await test('Stale bed, duplicated account, wrong origin and login screen block patient selection',()=>{
    const f=makePortal(bridgePath);const changed={...DATA[0],bed:'Z'};assert.equal(f.run('select',{patient:changed}).ok,false);assert.equal(f.clicks.length,0);
    assert.equal(f.run('discover',{origin:'https://other.example.test'}).ok,false);
    f.showList([DATA[0],DATA[0]]);assert.equal(f.run('list').ok,false);
    f.doc.body.append(new Element('input',{type:'password'}));assert.equal(f.run('discover').login,true);
  });
  await test('MRN lookup requires a uniquely scoped query form; patient view confirms account, name and MRN',()=>{
    const f=makePortal(bridgePath);const q=f.run('queryMRN',{mrn:'00001004',token:'m1'});assert(q.ok);const list=f.run('list',{baseline:q.baseline,token:'m1'});assert.equal(list.rows.length,1);assert.equal(list.rows[0].account,DATA[3].account);
    assert(f.run('select',{patient:{...list.rows[0],mrn:'00001004'}}).ok);const patient=f.run('patient',{expected:DATA[3]});assert(patient.ready);assert.equal(patient.mrn,'00001004');assert.equal(f.run('patient',{expected:DATA[0]}).ready,false);
  });
  function engineFixture(){
    const f=makePortal(bridgePath),events=[],tab={id:7,windowId:3,url:'https://portal.example.test/query'},clock={now:10000};
    const api={tabs:{async get(id){if(id!==7||clock.closed)throw Error('closed');return tab;},async update(id,x){events.push(['tab',id,x]);}},windows:{async update(id,x){events.push(['window',id,x]);}},scripting:{async executeScript({world,args,target,injectImmediately,files}){if(world==='ISOLATED'){events.push(['return-button']);return [];}if(files){f.installGuard();return [];}assert.equal(injectImmediately,true);events.push(['execute',args[0],target]);if(clock.childFrame&&target.frameIds?.[0]===0)return [{frameId:0,result:{ok:true,recognized:false}}];if(target.allFrames&&!clock.childFrame)throw Error('unrelated child frame is blocked');const [action,payload]=args;const result=f.run(action,payload);if(clock.lostClick===action){clock.lostClick=null;throw Error('frame navigated');}return [{frameId:clock.childFrame||0,result}];}}};
    const engine=new PortalEngine({sourceId:7,origin:'https://portal.example.test',api,now:()=>clock.now,sleep:async ms=>{clock.now+=ms;if(f.pending)f.finish();}});
    return {f,events,tab,clock,engine};
  }
  await test('Main-frame ward controls avoid unrelated iframes; child-frame forms remain supported',async()=>{
    const main=engineFixture();await main.engine.connect();const result=await main.engine.loadWard('12PW');assert.equal(result.rows.length,1);assert(!main.events.some(e=>e[0]==='execute'&&e[2].allFrames));
    const child=engineFixture();child.clock.childFrame=5;await child.engine.connect();assert.equal(child.engine.frame,5);assert(child.events.some(e=>e[0]==='execute'&&e[2].allFrames));const other=await child.engine.loadWard('12PE');assert.equal(other.rows.length,3);assert(child.events.some(e=>e[0]==='execute'&&e[1]==='queryWard'&&e[2].frameIds[0]===5));
  });
  await test('A query click without any response cannot turn the unchanged old list into a fresh result',async()=>{
    const {engine,f}=engineFixture();await engine.connect();f.get(Q+'txbRoomCode').value='';f.get(Q+'txbBedNo').value='';
    f.get(Q+'btnQueryInBed').onClick=()=>f.clicks.push(['query','12PE']);
    await assert.rejects(()=>engine.loadWard('12PE'),/30 秒內未能確認原系統的名單更新/);assert.equal(f.clicks.length,1);assert.equal(engine.lastRead,null);
  });
  await test('Compatibility reports are read-only and omit patient values, text, HTML, and URLs',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const report=await engine.diagnostics();
    assert.equal(report.frames[0].wardSelect.optionCount,8);assert.equal(report.frames[0].queryButton.labelMatches,true);assert.equal(report.frames[0].table.selectLinkCount,3);
    f.showPatient(DATA[0]);const patientReport=await engine.diagnostics();assert(patientReport.frames[0].returnButton.visible);
    const output=JSON.stringify([report,patientReport]);for(const p of DATA){assert(!output.includes(p.name));assert(!output.includes(p.account));assert(!output.includes(p.mrn));}assert(!/https?:|innerHTML|textContent/.test(output));assert.equal(f.clicks.length,0);
  });
  await test('Engine serializes rapid ward switches and only runs the latest queued request',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const a=engine.loadWard('12PE'),b=engine.loadWard('12PW');const [ra,rb]=await Promise.all([a,b]);assert(ra.superseded);assert(!rb.superseded);assert.equal(rb.rows[0].ward,'12PW');assert.equal(f.clicks.filter(x=>x[0]==='query').length,1);
  });
  await test('Fresh list selection verifies live identity and focuses the original patient tab',async()=>{
    const {engine,events,f}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE');const p=r.rows[0];const detail=await engine.openPatient(p);assert.equal(detail.mrn,'00001001');assert(events.some(x=>x[0]==='tab'&&x[1]===7));assert(events.some(x=>x[0]==='return-button'));assert.equal(f.clicks.filter(x=>x[0]==='query').length,1);
  });
  await test('Expired cache is requeried and moved beds cannot be opened by an old row index',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE');clock.now+=16000;f.data[0].bed='Z';await assert.rejects(()=>engine.openPatient(r.rows[0]),/變更/);assert(!f.clicks.some(x=>x[0]==='select'));
  });
  await test('Navigation context loss after a click is observed without repeating the click',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();clock.lostClick='queryWard';const r=await engine.loadWard('12PW');assert.equal(r.rows.length,1);assert.equal(f.clicks.filter(x=>x[0]==='query').length,1);clock.lostClick='select';await engine.openPatient(r.rows[0]);assert.equal(f.clicks.filter(x=>x[0]==='select').length,1);
  });
  await test('Source origin changes and closure stop automation',async()=>{
    const {engine,tab,clock}=engineFixture();await engine.connect();tab.url='https://unrelated.example.test';await assert.rejects(()=>engine.loadWard('12PE'),/切換網站/);tab.url='https://portal.example.test/query';clock.closed=true;await assert.rejects(()=>engine.loadWard('12PE'),/已關閉/);
  });
  await test('Exact room and room-bed searches prefer the current ward without matching every bed numbered 01',()=>{
    const wards=core.normalizeWards([{code:'12PE'},{code:'12PW'}]);
    const room=core.searchModel('01','12PE','auto',DATA,wards);assert.equal(room.rows.length,1);assert.equal(room.rows[0].account,DATA[2].account);
    const full=core.searchModel('01-01','12PE','auto',DATA,wards);assert.equal(full.scope,'current');assert.equal(full.rows.length,1);assert.equal(full.rows[0].account,DATA[2].account);
    const letter=core.searchModel('12-A','12PE','auto',DATA,wards);assert.equal(letter.rows.length,1);assert.equal(letter.rows[0].account,DATA[0].account);
    const ward=core.searchModel('１２ＰＷ','12PE','auto',DATA,wards);assert.equal(ward.exactWard.code,'12PW');
  });
  await test('Cleared query clicks only 已清床 and reads dates, remarks, DRG and every discharge status',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const result=await engine.loadWard('12PE','cleared');
    assert.deepEqual(f.clicks,[['cleared','12PE']]);assert.equal(result.rows.length,2);assert.equal(result.source,'cleared');
    const p=result.rows[0];assert.equal(p.department,'兒科');assert.equal(p.admit,'2026/10/01');assert.equal(p.discharge,'2026/10/06');assert.equal(p.note,'待完成出院作業');assert.equal(p.drg,'24103');assert(p.actions.some(a=>a.key==='drg'));assert(result.rows.some(p=>p.status==='完成出院結帳'));
    const other=await engine.loadWard('12PW','cleared');assert.equal(other.rows[0].status,'已出院');
  });
  await test('Expired cleared rows are requeried with 已清床 and open the verified account, never the current occupant',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE','cleared');clock.now+=16000;const detail=await engine.openPatient(r.rows[0]);assert.equal(detail.mrn,'00001005');assert.equal(f.clicks.filter(x=>x[0]==='cleared').length,2);assert(!f.clicks.some(x=>x[0]==='query'));assert(f.clicks.some(x=>x[0]==='select'&&x[1]==='26A00000005'));
  });
  await test('Cleared rows without a select link remain readable and cannot be opened',async()=>{
    const {engine,f}=engineFixture();f.clearedData[0].selectable=false;await engine.connect();const r=await engine.loadWard('12PE','cleared');assert.equal(r.rows.length,2);assert.equal(r.rows[0].selectable,false);await assert.rejects(()=>engine.openPatient(r.rows[0]),/未提供/);assert(!f.clicks.some(x=>x[0]==='select'));
  });
  await test('Smart Care conditions and sources are distinct cache identities',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE','inbed',true);assert.equal(f.get('PatientSmartCare').checked,true);assert.equal(r.smartCare,true);assert.equal(r.rows[0].smartCare,true);assert.notEqual(core.cacheKey('12PE','inbed',true),core.cacheKey('12PE','inbed',false));assert.notEqual(core.cacheKey('12PE','inbed'),core.cacheKey('12PE','cleared'));
  });
  await test('Original row actions are revalidated against account, name and bed and use a known action only',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE','cleared');clock.now+=16000;await engine.rowAction(r.rows[0],'note');assert(f.clicks.some(x=>x[0]==='action'&&x[1]==='note'&&x[2]===r.rows[0].account));assert.equal(f.clicks.filter(x=>x[0]==='cleared').length,2);await assert.rejects(()=>engine.rowAction(r.rows[0],'unknown'),/功能已變更/);
  });
  await test('Expired MRN results for discharged patients repeat MRN lookup instead of an in-bed ward query',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();const r=await engine.queryMRN('00001005');clock.now+=16000;const d=await engine.openPatient(r.rows[0]);assert.equal(d.mrn,'00001005');assert.equal(f.clicks.filter(x=>x[0]==='mrn').length,2);assert(!f.clicks.some(x=>x[0]==='query'));
  });
  await require('./search-checks.cjs')({core,engineFixture,bridgePath},test);
  await require('./discharge-note-checks.cjs')(core,test);
  await test('Actual UI recovers after its first query fails, preserves selection context, and stores only preferences',async()=>{
    await require('./ui-checks.cjs')(root,core,PortalEngine,test);
  });
  await test('Smart Care captures its native postback result without overwriting it with an ordinary query',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const box=f.get('PatientSmartCare');
    box.setAttribute('onclick',"__doPostBack('PatientSmartCare','')");
    let clicks=0;box.onClick=()=>{clicks++;f.prm.busy=true;f.pending={rows:box.checked?[f.data[0]]:f.data.filter(p=>p.ward==='12PE')};};
    const r=await engine.loadWard('12PE','inbed',true);assert(r.smartCare);assert.equal(r.rows.length,1);assert.equal(r.rows[0].account,DATA[0].account);assert.equal(clicks,1);assert.equal(f.clicks.filter(x=>x[0]==='query').length,1);assert.equal(f.storage.size,0);
    await engine.loadWard('12PE','inbed',false);assert.equal(clicks,2);assert.equal(box.checked,false);
  });
  await test('Smart Care reuses the verified ward list, reads a different grid and opens its cross-ward row',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();await engine.loadWard('12PE');const box=f.get('PatientSmartCare');
    const grid='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_SmartCare_grvPatients';
    box.onClick=()=>{f.showList(box.checked?[f.data[3]]:f.data.filter(p=>p.ward==='12PE'),box.checked?{id:grid}:{});};
    clock.lostClick='setSmartCare';const r=await engine.loadWard('12PE','inbed',true);
    assert.equal(r.rows.length,1);assert.equal(r.rows[0].ward,'12PW');assert.equal(r.rows[0].queryWard,'12PE');assert.equal(f.clicks.filter(x=>x[0]==='query').length,1);
    const diag=await engine.diagnostics();assert(diag.frames[0].listState.candidates.some(t=>t.kind==='smart'));
    await engine.rowAction(r.rows[0],'note');assert(f.clicks.some(x=>x[0]==='action'&&x[2]===DATA[3].account));
    clock.now+=16000;await engine.openPatient(r.rows[0]);assert(f.clicks.some(x=>x[0]==='select'&&x[1]===DATA[3].account));assert(f.clicks.filter(x=>x[0]==='query').every(x=>x[1]==='12PE'));
  });
  await test('Smart Care local filtering, empty results and checkbox-only query conditions remain distinct',async()=>{
    for(const mode of ['local','empty','query-only']){
      const {engine,f}=engineFixture();await engine.connect();const box=f.get('PatientSmartCare');
      if(mode==='query-only')f.get(Q+'btnQueryInBed').onClick=()=>{f.clicks.push(['query','12PE']);f.showList(box.checked?[f.data[0]]:f.data.filter(p=>p.ward==='12PE'));};
      else box.onClick=()=>f.showList(mode==='empty'?[]:[f.data[0]]);
      const r=await engine.loadWard('12PE','inbed',true);assert.equal(r.rows.length,mode==='empty'?0:1,mode);assert.equal(f.clicks.filter(x=>x[0]==='query').length,mode==='query-only'?2:1);assert.equal(f.storage.size,0);
    }
  });
  await test('Smart Care uncompleted postbacks cannot publish the old ordinary patients',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const box=f.get('PatientSmartCare');box.setAttribute('onclick',"__doPostBack('PatientSmartCare','')");
    await assert.rejects(()=>engine.loadWard('12PE','inbed',true),/未能確認勾選後/);assert.equal(engine.lastRead,null);assert.equal(f.clicks.filter(x=>x[0]==='query').length,1);assert.equal(f.storage.size,0);
  });
  await test('Captured MedCare structure reads merged beds and no-ID links while verifying hidden account rows',async()=>{
    const {engine,f}=engineFixture();f.data[0].careItems=[{label:'測試培養提醒',detail:'合成的細節資料'},{label:'測試用藥提醒',detail:'另一項合成資料'}];f.enableMedCare();await engine.connect();
    const r=await engine.loadWard('12PE','inbed',true);assert.equal(r.layout,'medcare');assert.equal(r.rows.length,3);const p=r.rows.find(x=>x.account===DATA[0].account);
    assert.equal(p.selectId,'');assert(p.selectable);assert.equal(p.careItems.length,2);assert.equal(p.careItems[0].detail,'合成的細節資料');assert.equal(p.admit,'2026/10/01');assert(p.note);assert(p.actions.some(x=>x.key==='lab'));
    assert.equal(f.get(GRID).getClientRects().length,0);assert.equal(f.clicks.filter(x=>x[0]==='query').length,1);
    await engine.rowAction(p,'care:0');assert(f.clicks.some(x=>x[0]==='action'&&x[1]==='care:0'&&x[2]===p.account));await engine.openPatient(p);assert(f.clicks.some(x=>x[0]==='select'&&x[1]===p.account));
  });
  await test('MedCare mapping survives reordered rows and rejects missing, duplicate or conflicting identities',()=>{
    for(const mode of ['reorder','wrong-name','duplicate','wrong-care-account']){
      const f=makePortal(bridgePath);if(mode==='wrong-care-account')f.data[0].careItems=[{label:'測試提醒',account:DATA[1].account}];const box=f.enableMedCare();box.click();
      if(mode==='reorder'){const t=f.get('tblMedCareList');const [head,...rows]=t.children;t.children=[head,...rows.reverse()];}
      if(mode==='wrong-name')f.get('tblMedCareList').children[1].children[2].textContent='另一位測試';
      if(mode==='duplicate'){const t=f.get(GRID),original=t.children[1];t.append(original);}
      const r=f.run('list');if(mode==='reorder'){assert(r.ok,r.error);assert.equal(r.rows[0].account,DATA[2].account);assert(f.run('select',{patient:r.rows[0]}).ok);assert.equal(f.clicks.at(-1)[1],DATA[2].account);}else{assert.equal(r.ok,false,mode);assert(!f.clicks.some(x=>x[0]==='select'));}
    }
  });
  await test('MedCare transitions never use the hidden ordinary view and an empty ward completes promptly',async()=>{
    const {engine,f}=engineFixture();const box=f.enableMedCare();box.checked=true;assert.equal(f.run('list').ready,false);box.checked=false;await engine.connect();const r=await engine.loadWard('14C','inbed',true);assert(r.empty);assert.equal(r.rows.length,0);assert.equal(f.storage.size,0);
  });
  await test('Changed MedCare service label cannot redirect a cached service action',async()=>{
    const {engine,f}=engineFixture();f.data[0].careItems=[{label:'原始測試提醒'}];f.enableMedCare();await engine.connect();const r=await engine.loadWard('12PE','inbed',true);f.data[0].careItems=[{label:'新的不同提醒'}];f.showMedList(f.data.filter(p=>p.ward==='12PE'));
    await assert.rejects(()=>engine.rowAction(r.rows[0],'care:0'),/功能已變更/);assert(!f.clicks.some(x=>x[0]==='action'));
  });
  await test('Alternate Smart Care tables require known identity headers and ambiguous tables cannot be selected',()=>{
    const f=makePortal(bridgePath);f.get('PatientSmartCare').checked=true;
    f.showList([DATA[0]],{id:'NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_SmartCare_A'});f.showList([DATA[1]],{id:'NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_SmartCare_B'});
    assert.equal(f.run('list').ok,false);assert.equal(f.run('select',{patient:DATA[0]}).ok,false);assert.equal(f.clicks.length,0);
    assert.equal(f.run('diagnostic').diagnostic.listState.candidates.length,3);
  });
  await test('Today admission uses the Taiwan calendar, Gregorian or ROC full dates, and rejects ambiguous or invalid dates',()=>{
    const before=new Date('2026-10-06T15:59:59Z'),after=new Date('2026-10-06T16:00:00Z');
    assert.equal(core.todayKey(before),'2026-10-06');assert.equal(core.todayKey(after),'2026-10-07');
    for(const date of ['2026/10/07','2026-10-07 08:20','20261007','115/10/07','民國115年10月7日','1151007','２０２６／１０／０７']){assert(core.isTodayAdmission(date,after),date);assert(!core.isTodayAdmission(date,before),date);assert(core.isTodayDischarge(date,after),date);assert(!core.isTodayDischarge(date,before),date);}
    for(const date of ['10/07','2026/02/30','2026/13/07','115/02/29','',null,'2026/10/071']){assert.equal(core.admissionDay(date),'',String(date));assert(!core.isTodayDischarge(date,after),String(date));}
    assert.equal(core.admissionDay('113/02/29'),'2024-02-29');
  });
  await test('Settlement emphasis distinguishes requested status groups and a fresh query overrides an older successful result',()=>{
    for(const status of ['已出院寫卡','藥帳未結清','已出院寫卡／藥帳未結清','已出院寫卡 / 藥帳未結清','藥帳 未結清'])assert.equal(core.settlementHint({status}),'pending',status);
    for(const status of ['已出院','出院準備','準備出院','已出院／出院準備','完成出院結帳','藥帳已結清','已出院寫卡／藥帳已結清','',null])assert.equal(core.settlementHint({status}),'',String(status));
    const p={status:'藥帳未結清',checkedAt:100};
    for(const status of ['success','already']){assert.equal(core.settlementHint(p,{status,checkedAt:101}),'confirmed');assert.equal(core.settlementHint({...p,checkedAt:102},{status,checkedAt:101}),'pending');}
    for(const status of ['warning','skipped','unknown','running'])assert.equal(core.settlementHint(p,{status,checkedAt:101}),'pending');
  });
  await test('Unsettled billing is recognized in status or notes despite label spacing, without inferring from unrelated notes',()=>{
    for(const text of ['藥帳未結清','藥帳：未結清','藥 帳 : 未 結 清','藥\n帳\n未\n結清']){
      assert.equal(core.settlementHint({status:'已出院／出院準備',note:text}),'pending',text);
      assert.equal(core.settlementHint({status:text,note:''}),'pending',text);
    }
    for(const note of ['',null,'一般註記','未結清','無需結清','藥帳已結清'])assert.equal(core.settlementHint({status:'已出院',note}),'',String(note));
    const p={status:'完成出院結帳',note:'藥帳未結清',checkedAt:100};
    assert.equal(core.settlementHint(p),'pending');
    assert.equal(core.settlementHint(p,{status:'success',checkedAt:101}),'confirmed');
    assert.equal(core.settlementHint({...p,checkedAt:102},{status:'success',checkedAt:101}),'pending');
  });
  await test('Header-only, empty-row, empty-container and native no-patient alerts finish without stale patients',async()=>{
    for(const mode of ['header','row','scope','alert']){
      const {engine,f,clock}=engineFixture();await engine.connect();const initial=clock.now;
      f.get(Q+'btnQueryInBed').onClick=()=>{
        if(mode==='alert'){f.context.alert('查無病人資料');return;}
        const table=f.get(GRID);table.children=table.children.slice(0,1);
        if(mode==='row'){const row=new Element('tr'),cell=new Element('td',{},'共 0 筆資料');row.append(cell);table.append(row);}
        if(mode==='scope'){table.hidden=true;f.doc.body.append(new Element('div',{id:'NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_divInPatientListBox'},'沒有資料'));}
      };
      const r=await engine.loadWard('14C');assert.equal(r.rows.length,0,mode);assert(r.empty);assert(clock.now-initial<2000,mode);assert.equal(f.storage.size,0);
    }
  });
  await test('A completed but invalid patient table surfaces its error immediately instead of waiting 30 seconds',async()=>{
    const {engine,f,clock}=engineFixture();await engine.connect();const start=clock.now;
    f.get(Q+'btnQueryInBed').onClick=()=>f.showList([{...DATA[0],account:'INVALID'}]);
    await assert.rejects(()=>engine.loadWard('12PE'),/格式/);assert(clock.now-start<1000);assert.equal(f.storage.size,0);
    assert.equal((await engine.diagnostics()).frames[0].listState.parseError,true);
  });
  await test('Settlement supports both observed button locations and verifies success after exactly one submission',async()=>{
    for(const id of ['NTUHWeb1_MedRelatedInfoBox_btnAllowDischarge','NTUHWeb1_MedProcessBox_MedRelatedInfoBox_btnAllowDischarge']){
      const {engine,f}=engineFixture();f.settleButtonId=id;await engine.connect();const r=await engine.loadWard('12PE','cleared');
      const outcome=await engine.settlePatient(r.rows[0]);assert.equal(outcome.status,'success',outcome.reason);assert.equal(outcome.mrn,'00001005');
      assert.equal(f.clicks.filter(x=>x[0]==='settle').length,1);assert.equal(f.clicks.filter(x=>x[0]==='settlement-submitted').length,1);assert(f.run('discover').control);assert.equal(f.storage.size,0);
    }
  });
  await test('Both inline return-medication warnings stop promptly, including warnings before the patient is ready',async()=>{
    for(const warning of ['以下是大於出院日(或大於今日)仍有餘量 > 0 的藥帳，請先退藥','以下是已停用但餘量 > 0 的出院藥，請先退藥']){
      const {engine,f,clock}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE','cleared');f.settlementWarning=warning;const start=clock.now;
      const outcome=await engine.settlePatient(r.rows[0]);assert.equal(outcome.status,'warning',outcome.reason);assert(outcome.reason.includes('請先退藥'));assert(clock.now-start<2500);assert(!f.clicks.some(x=>x[0]==='settlement-submitted'));assert.equal(f.storage.size,0);
    }
    const {engine,f}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE');f.patientWarning='以下是已停用但餘量 > 0 的出院藥，請先退藥';const out=await engine.settlePatient(r.rows[0]);assert.equal(out.status,'warning');assert(!f.clicks.some(x=>x[0]==='settle'));
  });
  await test('Changed identity and missing selection never send settlement',async()=>{
    for(const mode of ['moved','missing']){
      const {engine,f}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE','cleared');
      if(mode==='moved')f.clearedData[0].name='另一位測試';else f.clearedData[0].selectable=false;
      const out=await engine.settlePatient(r.rows[0]);assert.equal(out.status,'skipped',mode);assert(!f.clicks.some(x=>x[0]==='settle'));
    }
  });
  await test('Completed discharge and discharged statuses use the real settlement button instead of a label-based lock',async()=>{
    for(const status of ['已出院','完成出院結帳']){
      const {engine,f}=engineFixture();await engine.connect();f.clearedData[0].status=status;const r=await engine.loadWard('12PE','cleared');const out=await engine.settlePatient(r.rows[0]);assert.equal(out.status,'success',out.reason);assert.equal(f.clicks.filter(x=>x[0]==='settlement-submitted').length,1);
    }
    const {engine,f}=engineFixture();await engine.connect();f.settleDisabled=true;const r=await engine.loadWard('12PE','cleared');const out=await engine.settlePatient(r.rows[0]);assert.equal(out.status,'skipped');assert(out.reason.includes('沒有可用的結清按鈕'));assert(!f.clicks.some(x=>x[0]==='settle'));
  });
  await test('A refused settlement clears its guard and warning before another patient or retry',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE','cleared');f.nativeWarning='無法結清，請先退藥';
    const refused=await engine.settlePatient(r.rows[0]);assert.equal(refused.status,'warning');assert.equal(f.storage.size,0);assert.equal(f.context.__patientPickerGuardV2.read(),null);
    f.nativeWarning='';const next=await engine.settlePatient(r.rows[1]);assert.equal(next.status,'success',next.reason);const retry=await engine.settlePatient(r.rows[0]);assert.equal(retry.status,'success',retry.reason);assert.equal(f.storage.size,0);
  });
  await test('Native warnings and unexpected confirmation cannot grant settlement submission',async()=>{
    for(const mode of ['alert','confirm']){
      const {engine,f}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE');
      if(mode==='alert')f.nativeWarning='請先退藥';else f.confirmMessage='其他作業，確定？';
      const out=await engine.settlePatient(r.rows[0]);assert.equal(out.status,'warning');assert(!f.clicks.some(x=>x[0]==='settlement-submitted'));assert.equal(f.storage.size,0);
    }
  });
  await test('Already-settled and uncertain outcomes are distinct; lost injection never repeats the settlement click',async()=>{
    const already=engineFixture();await already.engine.connect();const list=await already.engine.loadWard('12PE');already.f.alreadySettled=true;
    const a=await already.engine.settlePatient(list.rows[0]);assert.equal(a.status,'already');assert(!already.f.clicks.some(x=>x[0]==='settle'));
    const lost=engineFixture();await lost.engine.connect();const l=await lost.engine.loadWard('12PE');lost.clock.lostClick='settle';const b=await lost.engine.settlePatient(l.rows[0]);assert.equal(b.status,'success');assert.equal(lost.f.clicks.filter(x=>x[0]==='settle').length,1);
    const timeout=engineFixture();await timeout.engine.connect();const t=await timeout.engine.loadWard('12PE');timeout.f.deferSettlement=true;const c=await timeout.engine.settlePatient(t.rows[0]);assert.equal(c.status,'unknown');assert(!c.retryable);assert.equal(timeout.f.clicks.filter(x=>x[0]==='settle').length,1);assert.equal(timeout.f.storage.size,0);
  });
  await test('A successful settlement can be rechecked and repeated after a later billing change',async()=>{
    const {engine,f}=engineFixture();await engine.connect();const r=await engine.loadWard('12PE','cleared'),p=r.rows[0];
    assert.equal((await engine.settlePatient(p)).status,'success');assert.equal((await engine.settlePatient(p)).status,'already');assert.equal(f.clicks.filter(x=>x[0]==='settlement-submitted').length,1);
    f.medStatuses.set(p.account,'未結清');assert.equal((await engine.settlePatient(p)).status,'success');assert.equal(f.clicks.filter(x=>x[0]==='settlement-submitted').length,2);assert.equal(f.clicks.filter(x=>x[0]==='cleared').length,4);
  });
  await test('Package has no external requests, recording payloads, inline scripts or undeclared UI references',()=>{
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'extension/manifest.json'),'utf8'));assert.equal(manifest.manifest_version,3);assert(!manifest.permissions.includes('debugger'));assert(!manifest.permissions.includes('webRequest'));assert(!manifest.permissions.includes('tabs'));
    const html=fs.readFileSync(path.join(root,'extension/tool.html'),'utf8'),js=fs.readFileSync(path.join(root,'extension/app.js'),'utf8');
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const m of js.matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(m[1]),m[1]);
    for(const name of ['app.js','engine.js','bridge.js','background.js','operation-guard.js'])assert(!/\b(fetch|XMLHttpRequest|WebSocket)\b/.test(fs.readFileSync(path.join(root,'extension',name),'utf8')));
    assert([...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].every(m=>!m[1].trim()));assert(js.includes('pinned:state.pinned,lastWard:state.ward,campus:state.campus'));
  });
  const report={version:JSON.parse(fs.readFileSync(path.join(root,'extension/manifest.json'),'utf8')).version,mode:'synthetic DOM and Chrome API adapters; not browser or hospital end-to-end',passed:checks};
  fs.writeFileSync(path.join(root,'docs/check-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
