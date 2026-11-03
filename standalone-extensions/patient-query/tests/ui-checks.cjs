const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {makePortal,DATA,Q}=require('./dom-fixture.cjs');
module.exports=async function(root,core,RealEngine,test){
  const nodes=new Map(),events={},windowEvents={},stored={},focusEvents=[],downloads=[],blobs=new Map(),scrollEvents=[];
  let resultWidth=1028;
  class UIElement{
    constructor(id){this.id=id;this.value='';this.hidden=false;this.disabled=false;this.attrs={};this.style={};this.dataset={};this.listeners={};this.textContent='';this._html='';this.tagName=id==='search'?'INPUT':'BUTTON';}
    setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}focus(){doc.activeElement=this;}select(){}getBoundingClientRect(){return {top:0,left:0,bottom:40,right:600};}get clientWidth(){return this.id==='results'?resultWidth:1280;}get offsetWidth(){return 390;}get offsetHeight(){return 300;}
    addEventListener(k,fn){(this.listeners[k]||=[]).push(fn);}closest(s){return s==='button'?this:null;}
    get innerHTML(){return this._html;}set innerHTML(s){this._html=s;for(const m of s.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new UIElement(m[1]));}
    async emit(type,more={}){for(const fn of this.listeners[type]||[])await fn({target:this,isComposing:false,preventDefault(){},stopPropagation(){},...more});}
  }
  const html=fs.readFileSync(path.join(root,'extension/tool.html'),'utf8');for(const m of html.matchAll(/\bid="([^"]+)"/g))nodes.set(m[1],new UIElement(m[1]));
  const doc={activeElement:null,getElementById:id=>nodes.get(id),querySelector(selector){return selector==='[data-auto-current="true"]'?{style:{},scrollIntoView(){scrollEvents.push({kind:'patient'});context.window.scrollY=700;}}:null;},createElement(){return {click(){downloads.push({name:this.download,blob:blobs.get(this.href)});}};},addEventListener(k,fn){(events[k]||=[]).push(fn);}};
  const portal=makePortal(path.join(root,'extension/bridge.js')),clock={time:10000};
  portal.get(Q+'btnQueryInBed').disabled=true;
  const api={storage:{local:{async get(key){return {[key]:stored[key]};},async set(value){Object.assign(stored,value);}}},tabs:{onRemoved:{addListener(fn){events.sourceRemoved=fn;}},async get(){return {id:7,windowId:3,url:'https://portal.example.test/query'};},async update(id,args){focusEvents.push(['tab',id,args]);}},windows:{async update(id,args){focusEvents.push(['window',id,args]);}},scripting:{async executeScript({world,args,files}){if(world==='ISOLATED')return [];if(files){portal.installGuard();return [];}return [{frameId:0,result:portal.run(...args)}];}}};
  class TestEngine extends RealEngine{constructor(config){super({...config,api,now:()=>clock.time,sleep:async ms=>{clock.time+=ms;if(portal.pending)portal.finish();}});}}
  api.runtime={getManifest:()=>JSON.parse(fs.readFileSync(path.join(root,'extension/manifest.json'),'utf8'))};
  let managementCallbacks,updateCallbacks;
  const context={mountUpdater:async opts=>{updateCallbacks=opts;},mountManagement:async opts=>{managementCallbacks=opts;opts.setBlocked(false);opts.setLocked(false);return{blocked:false};},...core,esc:core.escapeHTML,PortalEngine:TestEngine,chrome:api,document:doc,URLSearchParams,URL:{createObjectURL(blob){blobs.set('blob:diagnostic',blob);return 'blob:diagnostic';},revokeObjectURL(url){blobs.delete(url);}},Blob,setTimeout:fn=>fn(),location:{search:'?source=7&origin=https%3A%2F%2Fportal.example.test'},console,Map,Set,Date,Number,scrollEvents};
  context.CSS={escape:s=>s};context.window={scrollY:123,innerHeight:900,setInterval(fn){windowEvents.dayTick=fn;},scrollTo({top}){scrollEvents.push({kind:'window',top});this.scrollY=top;},addEventListener(k,fn){windowEvents[k]=fn;}};vm.createContext(context);
  const source=fs.readFileSync(path.join(root,'extension/app.js'),'utf8').replace(/^import .*$/gm,'');
  await vm.runInContext('(async()=>{'+source+';globalThis.UI={state,cache,known,settlements,checked,engine,chooseWard,openPatient,settlePatient,settleBatch,stopBatch,togglePatient,selectAll,renderResults,dismissSettlement,lookup,queryChanged,switchSource,chooseHot,showDetails,wardBatch,startWardBatch,stopWardBatch,toggleWardBatch,toggleBatchWard,setManagedBlocked,workBlocked,view:()=>view};})();',context);
  const settle=async()=>{for(let i=0;i<100&&context.UI.state.busy;i++)await new Promise(resolve=>setImmediate(resolve));assert(!context.UI.state.busy,'UI operation did not settle');};
  await settle();const ui=context.UI,n=id=>nodes.get(id);
  assert.equal(ui.state.connected,true,'ward controls must remain usable after the first query fails');assert.equal(ui.cache.size,0);assert.equal(n('error').hidden,false);assert.equal(n('refresh').disabled,false);
  await n('diagnostic').emit('click');assert.equal(downloads[0].name,'病人快速選擇_相容性資訊.json');const report=JSON.parse(await downloads[0].blob.text());assert.equal(report.phase,'clicking-query');assert.equal(report.frames[0].queryButton.disabled,true);assert.equal(portal.clicks.length,0);
  portal.get(Q+'btnQueryInBed').disabled=false;await ui.chooseWard('12PE');assert.equal(n('error').hidden,true);
  assert.equal(ui.state.ward,'12PE');assert.equal(ui.cache.get(core.cacheKey('12PE')).rows.length,3);assert(n('results').innerHTML.includes('住院'));assert(!n('results').innerHTML.includes('00001001'));assert(n('results').innerHTML.includes('10/08 可出院'));
  await ui.chooseWard('12PW');ui.queryChanged('同名測試');assert.equal(ui.view().rows.length,0);const beforeInvalid=portal.clicks.length;await ui.chooseHot();assert.equal(portal.clicks.length,beforeInvalid);assert(!n('error').hidden);
  ui.queryChanged(DATA[2].account);n('search').value=DATA[2].account;assert.equal(ui.view().rows.length,1);
  const beforeEnter=portal.clicks.length;await ui.chooseHot();assert.equal(portal.clicks.length,beforeEnter+1);assert.equal(portal.clicks.at(-1)[0],'account');assert.equal(ui.view().scope,'remote');assert.equal(n('list-title').textContent,'搜尋結果');assert(n('results').innerHTML.includes('12PE'));assert.equal(n('source-mode').textContent,'住院帳號查詢');
  const original=ui.view().rows.find(p=>p.account===DATA[2].account);await ui.openPatient(original);assert.equal(ui.state.ward,'12PW');assert.equal(ui.state.query,DATA[2].account);assert.equal(n('search').value,DATA[2].account);assert.equal(ui.known.get(original.account).mrn,'00001003');assert(focusEvents.some(x=>x[0]==='tab'&&x[1]===7));
  await windowEvents.focus();assert.equal(ui.state.query,DATA[2].account);assert.equal(context.window.scrollY,123);
  ui.queryChanged('00001004');n('search').value='00001004';await ui.lookup();assert.equal(ui.view().scope,'remote');assert.equal(ui.view().rows[0].account,DATA[3].account);assert.equal(n('source-mode').textContent,'病歷號查詢');assert.equal(n('picker').dataset.source,'mrn');assert.equal(n('inbed').attrs['aria-pressed'],'false');assert.equal(n('cleared').attrs['aria-pressed'],'false');
  // Opening a cached person while viewing another MRN must not attach that MRN.
  await ui.openPatient(original);assert.equal(n('error').hidden,true);assert.equal(ui.known.get(DATA[2].account).mrn,'00001003');
  await test('Search submits even one cached match, renders native cross-ward identity, refreshes the same query and opens only an explicit selection',async()=>{
    await ui.chooseWard('12PE');ui.queryChanged('A100000004');n('search').value='A100000004';const before=portal.clicks.length;
    await n('lookup').emit('click');assert.equal(ui.view().scope,'remote');assert.equal(ui.view().rows[0].account,DATA[3].account);assert.equal(n('source-mode').textContent,'身分證號查詢');assert(n('results').innerHTML.includes('12PW'));assert(!portal.clicks.slice(before).some(x=>x[0]==='select'));assert(n('select-unsettled').hidden);
    await n('refresh').emit('click');assert.equal(portal.clicks.filter(x=>x[0]==='personId').length,2);
    await n('search').emit('keydown',{key:'ArrowDown'});await ui.chooseHot();assert.equal(ui.state.selected,DATA[3].account);assert.equal(portal.clicks.at(-1)[0],'select');
    await ui.switchSource('inbed');assert.equal(ui.state.query,'');assert.equal(ui.state.ward,'12PE');assert.equal(ui.view().scope,'current');
  });
  await test('Bed search keeps ward and source, supports cleared selection and refresh, and a bare ward still defaults to in-bed',async()=>{
    ui.queryChanged('12PW-01-01');await ui.lookup();assert.equal(ui.state.ward,'12PW');assert.equal(ui.view().rows[0].account,DATA[3].account);assert.equal(n('source-mode').textContent,'在床病人・床位查詢');assert(!n('results').innerHTML.includes('pc-cleared-head-grid'));assert(n('select-unsettled').hidden);
    await ui.switchSource('cleared');assert.equal(ui.view().rows.length,0);assert.equal(n('cleared').attrs['aria-pressed'],'true');assert.equal(ui.state.remote.source,'cleared');assert(!n('select-unsettled').hidden);
    ui.queryChanged('12PE-01-01');await ui.lookup();assert.equal(ui.view().rows[0].account,'26A00000005');assert.equal(n('order-label').textContent,'依出院日期由新到舊');assert(n('results').innerHTML.includes('pc-cleared-head-grid'));
    const clicks=portal.clicks.filter(x=>x[0]==='cleared').length;await n('refresh').emit('click');assert.equal(portal.clicks.filter(x=>x[0]==='cleared').length,clicks+1);assert.equal(ui.view().rows.length,1);
    ui.queryChanged('12PW');await ui.chooseHot();assert.equal(ui.state.source,'inbed');assert.equal(ui.state.query,'');assert.equal(ui.view().rows[0].account,DATA[3].account);
  });
  await test('Failed or late searches cannot show old patients or replace changed input and ward navigation',async()=>{
    await ui.chooseWard('12PE');ui.queryChanged(DATA[3].account);await ui.lookup();assert.equal(ui.view().rows.length,1);
    const queryPerson=ui.engine.queryPerson.bind(ui.engine),queryBed=ui.engine.queryBed.bind(ui.engine);
    ui.engine.queryPerson=async()=>{throw new Error('合成：搜尋未完成');};await ui.lookup();assert.equal(ui.view().rows.length,0);assert(ui.state.remote.failed);assert(!n('error').hidden);assert(!n('lookup').disabled);
    let release;ui.engine.queryBed=()=>new Promise(resolve=>{release=resolve;});ui.queryChanged('12-A');const pending=ui.lookup();assert(n('cleared').disabled);await ui.switchSource('cleared');assert.equal(ui.state.source,'inbed');ui.queryChanged('12A');release({source:'inbed',rows:[],pagination:false,checkedAt:1});await pending;assert.equal(ui.state.query,'12A');assert.equal(ui.state.remote,null,'punctuation changing the query kind must invalidate a pending response');assert.notEqual(ui.view().scope,'remote');
    ui.engine.queryPerson=()=>new Promise(resolve=>{release=resolve;});ui.queryChanged(DATA[3].account);const late=ui.lookup();await ui.chooseWard('12PE');release({source:'person',rows:[],pagination:false,checkedAt:1});await late;assert.equal(ui.state.ward,'12PE');assert.equal(ui.state.query,'');assert.equal(ui.view().rows.length,3);assert.equal(ui.state.remote,null);
    ui.engine.queryPerson=queryPerson;ui.engine.queryBed=queryBed;
  });
  const fastA=ui.chooseWard('12PE'),fastB=ui.chooseWard('12PW');await Promise.all([fastA,fastB]);assert.equal(ui.state.ward,'12PW');assert.equal(n('list-title').textContent,'12PW');assert.equal(ui.view().rows.length,1);
  ui.queryChanged('12PE');await ui.chooseHot();await settle();assert.equal(ui.state.ward,'12PE');assert.equal(ui.state.query,'');
  ui.queryChanged('01-01');assert.equal(ui.view().scope,'current');assert.equal(ui.view().rows.length,1);assert.equal(ui.view().rows[0].account,DATA[2].account);
  ui.queryChanged('');await ui.switchSource('cleared');assert.equal(ui.view().rows.length,2);assert(n('results').innerHTML.includes('完成出院結帳'));assert(n('results').innerHTML.includes('待完成出院作業'));assert(n('results').innerHTML.includes('pc-cleared-head-grid'));assert(ui.cache.has(core.cacheKey('12PE','cleared')));assert(ui.cache.has(core.cacheKey('12PE','inbed')));
  const cleared=ui.view().rows[0];ui.showDetails(cleared,n('pin'));assert(!n('detail').hidden);assert(n('detail-fields').innerHTML.includes('2026/10/06'));assert(n('detail-fields').innerHTML.includes('住院帳號'));assert(n('detail-fields').innerHTML.includes('尚未取得'));assert(n('detail-actions').innerHTML.includes('Note'));
  await ui.openPatient(cleared);assert.equal(n('error').hidden,true);assert.equal(ui.known.get(cleared.account).mrn,'00001005');assert.equal(ui.state.source,'cleared');
  await ui.chooseWard('12PE');assert.equal(ui.state.source,'inbed');assert.equal(ui.view().rows.length,3);assert(!n('results').innerHTML.includes('已清床測試'));
  await ui.switchSource('cleared');ui.queryChanged('12PE');await ui.chooseHot();await settle();assert.equal(ui.state.source,'inbed');assert.equal(ui.view().rows.length,3);
  const settings=Object.values(stored)[0];assert.deepEqual(Object.keys(settings).sort(),['campus','lastWard','pinned']);assert(!JSON.stringify(stored).includes('測試'));assert(!JSON.stringify(stored).includes(DATA[2].account));
  const patient=ui.view().rows[0];assert(n('results').innerHTML.includes('data-settle="'+patient.account+'"'));
  const buttonFor=p=>{const m=new RegExp('<button[^>]*data-settle="'+p.account+'"([^>]*)>([^<]*)</button>').exec(n('results').innerHTML);assert(m);return {disabled:/\bdisabled\b/.test(m[1]),label:m[2]};};
  const idleButton=p=>assert.deepEqual(buttonFor(p),{disabled:false,label:'結清'});
  const first=ui.settlePatient(patient);assert.equal(buttonFor(patient).disabled,true);await ui.settlePatient(patient);await first;idleButton(patient);assert(n('results').innerHTML.includes('原系統藥帳已確認結清'));const attempts=portal.clicks.filter(x=>x[0]==='settle').length;assert.equal(attempts,1,'a second click during an operation must not submit again');
  await ui.settlePatient(patient);assert.equal(ui.settlements.get(patient.account).status,'already');idleButton(patient);assert.equal(portal.clicks.filter(x=>x[0]==='settle').length,attempts);
  portal.medStatuses.set(patient.account,'未結清');await ui.settlePatient(patient);assert.equal(ui.settlements.get(patient.account).status,'success');assert.equal(portal.clicks.filter(x=>x[0]==='settle').length,attempts+1);assert(n('results').innerHTML.includes('data-settle="'+patient.account+'" aria-label='));
  await ui.switchSource('cleared');const discharged=ui.view().rows.find(p=>p.status==='完成出院結帳');assert(discharged);assert(n('results').innerHTML.includes('data-settle="'+discharged.account+'" aria-label='));
  portal.nativeWarning='無法結清，請先退藥';await ui.settlePatient(discharged);idleButton(discharged);assert(n('results').innerHTML.includes('無法結清，請先退藥'));assert(n('results').innerHTML.includes('data-dismiss-settlement="'+discharged.account+'"'));assert(n('notice').hidden,'settlement warning should not be duplicated at the bottom');
  ui.dismissSettlement(discharged.account);assert(!n('results').innerHTML.includes('無法結清，請先退藥'));assert(ui.settlements.get(discharged.account).retryable);
  await ui.settlePatient(discharged);assert(n('results').innerHTML.includes('無法結清，請先退藥'));await ui.chooseWard('12PW');assert.equal(ui.state.source,'inbed');await ui.chooseWard('12PE');assert(!n('results').innerHTML.includes('無法結清，請先退藥'));await ui.switchSource('cleared');
  portal.nativeWarning='';await ui.settlePatient(ui.view().rows.find(p=>p.account===discharged.account));assert.equal(ui.settlements.get(discharged.account).status,'success');
  await ui.switchSource('inbed');const uncertain=ui.view().rows.find(p=>p.account!==patient.account);portal.deferSettlement=true;await ui.settlePatient(uncertain);assert.equal(ui.settlements.get(uncertain.account).status,'unknown');idleButton(uncertain);const sent=portal.clicks.filter(x=>x[0]==='settle').length;
  portal.deferSettlement=false;await ui.settlePatient(uncertain);assert.equal(ui.settlements.get(uncertain.account).status,'success');assert.equal(portal.clicks.filter(x=>x[0]==='settle').length,sent+1,'a new user click must start a fresh check even after an uncertain result');idleButton(uncertain);
  const originalSettle=ui.engine.settlePatient.bind(ui.engine);for(const status of ['warning','skipped','unknown']){ui.engine.settlePatient=async()=>({status,reason:'合成結果',retryable:false});await ui.settlePatient(uncertain);idleButton(uncertain);}ui.engine.settlePatient=originalSettle;
  portal.data[0].admit=core.todayKey();await ui.chooseWard('12PE');assert.equal((n('results').innerHTML.match(/class="pc-today"/g)||[]).length,1);assert(n('results').innerHTML.includes('今日入院'));
  // Smart Care can show a row from another ward; display its actual returned set.
  const smart=portal.get('PatientSmartCare');smart.onClick=()=>{portal.showList(smart.checked?[portal.data[3]]:portal.data.filter(p=>p.ward===portal.get(Q+'txbWardCode').value));};
  n('smart').checked=true;await n('smart').emit('change');await settle();assert.equal(ui.view().rows.length,1);assert.equal(ui.view().rows[0].ward,'12PW');assert(n('results').innerHTML.includes('<small>12PW</small>'));
  n('smart').checked=false;await n('smart').emit('change');await settle();smart.onClick=null;
  portal.data[0].careItems=[{label:'測試服務提醒',detail:'合成的詳細提醒內容'}];portal.enableMedCare();n('smart').checked=true;await n('smart').emit('change');await settle();
  assert.equal(n('error').hidden,true,n('error-text').textContent);assert(n('results').className.includes('pc-smart-list'));assert.equal(n('results').style.gridTemplateColumns,'repeat(1,minmax(0,1fr))');assert(n('results').innerHTML.includes('測試服務提醒'));assert(n('results').innerHTML.includes('title="合成的詳細提醒內容"'));
  const med=ui.view().rows.find(p=>p.account===portal.data[0].account);ui.showDetails(med,n('pin'));assert(n('detail-fields').innerHTML.includes('合成的詳細提醒內容'));assert(n('detail-actions').innerHTML.includes('data-row-action="lab"'));assert(n('detail-actions').innerHTML.includes('data-row-action="care:0"'));
  await ui.openPatient(med,'lab');assert(portal.clicks.some(x=>x[0]==='action'&&x[1]==='lab'&&x[2]===med.account));n('smart').checked=false;await n('smart').emit('change');await settle();
  await require('./batch-checks.cjs')({ui,n,portal,events,stored,core,idleButton,settle},test);
  await test('Today discharge and source labels remain clear in in-bed, cleared and Smart Care lists',async()=>{
    const inbed=portal.data[0],discharged=portal.clearedData[0],inbedDate=inbed.discharge,dischargeDate=discharged.discharge;
    inbed.discharge=core.todayKey();discharged.discharge=core.todayKey();
    await ui.chooseWard('12PE');assert.equal(n('source-mode').textContent,'在床病人');assert.equal(n('picker').dataset.source,'inbed');assert(n('results').innerHTML.includes('pc-today-discharge'));assert(n('results').innerHTML.includes('今日入院'));
    await ui.switchSource('cleared');assert.equal(n('source-mode').textContent,'已清床');assert.equal(n('picker').dataset.source,'cleared');assert.equal(n('cleared').attrs['aria-pressed'],'true');assert.equal(n('inbed').attrs['aria-pressed'],'false');assert(n('results').innerHTML.includes('今日出院'));
    n('smart').checked=true;await n('smart').emit('change');await settle();assert.equal(n('picker').dataset.source,'cleared');assert(n('results').className.includes('pc-smart-list'));assert(n('results').innerHTML.includes('今日出院'));
    n('smart').checked=false;await n('smart').emit('change');await settle();await ui.switchSource('inbed');inbed.discharge=inbedDate;discharged.discharge=dischargeDate;await ui.chooseWard('12PE');
  });
  await test('Cleared pending rows stay actionable, lose emphasis after confirmation, and regain it after a new query',async()=>{
    const p=portal.clearedData[0],other=portal.clearedData[1],status=p.status,otherStatus=other.status;
    p.status='已出院寫卡／藥帳未結清';other.status='已出院／出院準備';await ui.switchSource('cleared');
    const row=ui.view().rows.find(x=>x.account===p.account);assert.equal((n('results').innerHTML.match(/pc-needs-settlement/g)||[]).length,1);assert(n('results').innerHTML.includes(core.clean('已出院／出院準備')));assert(n('list-meta').textContent.includes('待結清 1 位'));idleButton(row);
    portal.medStatuses.set(p.account,'未結清');portal.nativeWarning='合成警示';await ui.settlePatient(row);assert(n('results').innerHTML.includes('pc-needs-settlement'));idleButton(row);
    portal.nativeWarning='';await ui.settlePatient(row);assert(!n('results').innerHTML.includes('pc-needs-settlement'));assert(n('results').innerHTML.includes('已確認結清'));assert(!n('list-meta').textContent.includes('待結清'));idleButton(row);
    await n('refresh').emit('click');assert.equal(ui.state.source,'cleared');assert(n('results').innerHTML.includes('pc-needs-settlement'));idleButton(ui.view().rows.find(x=>x.account===p.account));
    n('smart').checked=true;await n('smart').emit('change');await settle();assert(n('results').className.includes('pc-smart-list'));assert(n('results').innerHTML.includes('pc-needs-settlement'));n('smart').checked=false;await n('smart').emit('change');await settle();
    p.status=status;other.status=otherStatus;await ui.switchSource('inbed');
  });
  await test('Cleared note-only billing warnings are highlighted in their own field, including Smart Care and fresh-query changes',async()=>{
    const p=portal.clearedData[0],other=portal.clearedData[1],before={status:p.status,note:p.note,otherStatus:other.status,otherNote:other.note};
    p.status='已出院／出院準備';p.note='合成說明／藥帳：未結清／請核對 <文字>';other.status='已出院';other.note='一般註記';
    const attempts=portal.clicks.filter(x=>x[0]==='settle').length;
    await ui.switchSource('cleared');
    const emphasized='<strong class="pc-billing-unsettled">藥帳:未結清</strong>';
    const verify=()=>{assert.equal((n('results').innerHTML.match(/pc-needs-settlement/g)||[]).length,1);assert(n('results').innerHTML.includes('合成說明/'+emphasized+'/請核對 &lt;文字&gt;'));assert(n('list-meta').textContent.includes('待結清 1 位'));idleButton(ui.view().rows.find(x=>x.account===p.account));};
    verify();assert.equal(portal.clicks.filter(x=>x[0]==='settle').length,attempts,'visual emphasis must not submit settlement');
    n('smart').checked=true;await n('smart').emit('change');await settle();assert(n('results').className.includes('pc-smart-list'));verify();
    n('smart').checked=false;await n('smart').emit('change');await settle();
    portal.medStatuses.set(p.account,'未結清');await ui.settlePatient(ui.view().rows.find(x=>x.account===p.account));
    assert.equal(ui.settlements.get(p.account).status,'success');assert(!n('results').innerHTML.includes('pc-billing-unsettled'));assert(!n('results').innerHTML.includes('pc-needs-settlement'));idleButton(ui.view().rows.find(x=>x.account===p.account));
    await n('refresh').emit('click');verify();
    p.status=before.status;p.note=before.note;other.status=before.otherStatus;other.note=before.otherNote;await ui.switchSource('inbed');
  });
  await test('Cleared rows keep newest discharges first across search, refresh and Smart Care, with keyboard selection matching the displayed patient',async()=>{
    const older=portal.clearedData[0],newer=portal.clearedData[1],oldDate=older.discharge,newDate=newer.discharge;
    older.discharge='115/10/07';newer.discharge='2026/10/09';
    const expected=[newer.account,older.account];
    const verify=()=>{
      assert.deepEqual(Array.from(ui.view().rows,p=>p.account),expected);
      assert.deepEqual(Array.from(n('results').innerHTML.matchAll(/data-patient="([^"]+)"/g),m=>m[1]),expected);
      assert.equal(n('order-label').textContent,'依出院日期由新到舊');
    };
    await ui.switchSource('cleared');verify();
    ui.queryChanged('26A000');ui.state.scope='current';ui.renderResults();verify();ui.queryChanged('');
    await n('refresh').emit('click');verify();
    n('smart').checked=true;await n('smart').emit('change');await settle();assert(n('results').className.includes('pc-smart-list'));verify();
    n('smart').checked=false;await n('smart').emit('change');await settle();verify();
    ui.state.hot=0;await ui.chooseHot();assert.equal(ui.state.selected,newer.account);assert(n('error').hidden,n('error-text').textContent);
    older.discharge=oldDate;newer.discharge=newDate;await ui.switchSource('inbed');
    assert.deepEqual(Array.from(ui.view().rows,p=>p.account),Array.from(ui.view().rows).sort(core.bedSort).map(p=>p.account));assert(n('order-label').textContent.startsWith('依床號'));
  });
  await test('Select unsettled targets only actionable visible billing warnings and batches only those patients',async()=>{
    const originalRows=portal.clearedData,originalSettle=ui.engine.settlePatient.bind(ui.engine);
    const flags=[{status:'藥帳未結清'},{status:'已出院',note:'藥 帳：未結清'},{status:'已出院寫卡'},{status:'藥帳已結清'},{status:'藥帳未結清',selectable:false},{status:'藥帳未結清'}];
    const rows=flags.map((flags,i)=>({...originalRows[0],account:'26A'+String(900+i).padStart(8,'0'),mrn:String(90000000+i),name:'合成批選'+i,room:String(i+1).padStart(2,'0'),note:'',...flags}));
    portal.clearedData=rows;assert(n('select-unsettled').hidden);await ui.switchSource('cleared');
    const confirmLast=()=>{const p=ui.view().rows.find(p=>p.account===rows[5].account);ui.settlements.set(p.account,{status:'success',checkedAt:p.checkedAt});ui.renderResults();};
    confirmLast();assert.equal(n('select-unsettled').textContent,'全選藥帳未結清（2）');assert(!n('select-unsettled').hidden);assert(!n('select-unsettled').disabled);
    ui.togglePatient(rows[2].account,true);const beforeClicks=portal.clicks.length;await n('select-unsettled').emit('click');
    assert.deepEqual(Array.from(ui.checked.keys()),[rows[0].account,rows[1].account]);assert.equal(portal.clicks.length,beforeClicks,'selection must not open or settle a patient');assert(n('select-all').indeterminate);
    ui.queryChanged(rows[1].account);await n('select-unsettled').emit('click');assert.deepEqual(Array.from(ui.checked.keys()),[rows[1].account]);
    ui.queryChanged(rows[2].account);assert(n('select-unsettled').disabled);await n('select-unsettled').emit('click');assert.equal(ui.checked.size,0,'card-writing alone is not an explicit unsettled bill');ui.queryChanged('');
    n('smart').checked=true;await n('smart').emit('change');await settle();confirmLast();await n('select-unsettled').emit('click');assert.deepEqual(Array.from(ui.checked.keys()),[rows[0].account,rows[1].account]);
    n('smart').checked=false;await n('smart').emit('change');await settle();confirmLast();await n('select-unsettled').emit('click');
    let release;const gate=new Promise(resolve=>{release=resolve;});ui.engine.settlePatient=async p=>{await gate;return originalSettle(p);};
    const before=portal.clicks.filter(x=>x[0]==='settlement-submitted').length,pending=n('batch-settle').emit('click');assert(n('select-unsettled').disabled);await n('select-unsettled').emit('click');assert.equal(ui.checked.size,2);release();await pending;ui.engine.settlePatient=originalSettle;
    assert.deepEqual(portal.clicks.filter(x=>x[0]==='settlement-submitted').slice(before).map(x=>x[1]),[rows[0].account,rows[1].account]);assert(n('select-unsettled').disabled);assert.equal(n('select-unsettled').textContent,'全選藥帳未結清（0）');
    await n('refresh').emit('click');assert.equal(n('select-unsettled').textContent,'全選藥帳未結清（3）','a newer query can show unsettled billing again');
    ui.queryChanged(rows[0].mrn);await ui.lookup();assert.equal(ui.view().scope,'remote');assert(n('select-unsettled').hidden);await n('select-unsettled').emit('click');assert.equal(ui.checked.size,0);
    portal.clearedData=originalRows;await ui.chooseWard('12PE');assert(n('select-unsettled').hidden);
  });
  await require('./settlement-display-checks.cjs')({ui,n,portal,core,settle},test);
  await require('./today-discharge-checks.cjs')({ui,n,portal,core,settle,context,windowEvents},test);
  await require('./ward-batch-checks.cjs')({ui,n,portal,core,settle,context,events,stored},test);
  portal.data=Array.from({length:20},(_,i)=>({...DATA[0],account:'26A'+String(100+i).padStart(8,'0'),name:'寬版測試'+i,room:String(i+1).padStart(2,'0')}));await ui.chooseWard('12PE');
  for(const [width,columns] of [[1028,2],[1668,3],[2308,4]]){resultWidth=width;ui.queryChanged('');assert.equal(n('results').style.gridTemplateColumns,'repeat('+columns+',minmax(0,1fr))');assert.equal((n('results').innerHTML.match(/data-patient=/g)||[]).length,20);}
  await test('Closing the source during a batch clears patient selections, results and progress and starts no next patient',async()=>{
    ui.selectAll(true);let release,started=0;ui.engine.settlePatient=()=>{started++;return new Promise(resolve=>{release=resolve;});};
    const pending=ui.settleBatch();assert.equal(started,1);events.sourceRemoved(7);release({status:'success',reason:'合成結果'});await pending;
    assert.equal(started,1);assert.equal(ui.state.query,'');assert.equal(ui.cache.size,0);assert.equal(ui.known.size,0);assert.equal(ui.checked.size,0);assert.equal(ui.state.batch,null);assert(!n('results').innerHTML.includes('寬版測試'));assert.equal(n('batch-current').textContent,'');assert.equal(n('batch-summary').textContent,'');assert.equal(n('loading').textContent,'');assert.equal(ui.state.busy,false);
  });
};
