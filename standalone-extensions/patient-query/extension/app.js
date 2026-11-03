import {CAMPUS_ORDER,campusOf,normalizeWards,norm,clean,bedLabel,cacheKey,mergePatients,samePatient,searchModel,parseSearch,bedSort,dischargeSort,highlight,isTodayAdmission,isTodayDischarge,dischargeInfo,billingUnsettledText,settlementHint,todayKey,escapeHTML as esc} from './core.js';
import {PortalEngine} from './engine.js';
import {mountUpdater} from './updater.js';
import {mountManagement} from './management.js';
let managedBlocked=true,managementLocked=true,updating=false;
const workBlocked=()=>managedBlocked||updating;
function syncManagedLock(){document.getElementById('app-shell').inert=managementLocked||updating;}
function setManagedBlocked(value){
  managedBlocked=value;
  if(value){
    const reason='管理政策已限制使用，已停止後續病人及病房。';
    if(state.batch?.running){state.batch.stopRequested=true;state.batch.stopReason=reason;}
    if(wardBatch.run?.running){wardBatch.run.stopRequested=true;wardBatch.run.stopReason=reason;}
  }
}

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const sourceId=Number(params.get('source')),origin=params.get('origin')||'';
const cache=new Map(),known=new Map(),settlements=new Map(),checked=new Map();
const state={connected:false,wards:[],ward:'',campus:'兒醫',source:'inbed',smartCare:false,smartAvailable:false,query:'',scope:'auto',pinned:[],selected:'',hot:-1,canQueryMRN:false,canCleared:false,busy:false,opening:false,remote:null,batch:null,request:0};
const wardBatch={open:false,selected:new Set(),inbed:true,cleared:true,run:null};
const settlementLabels={success:'結清',already:'原已結清',warning:'警示',skipped:'未執行',unknown:'待確認'};
const emptyCounts=()=>({success:0,already:0,warning:0,skipped:0,unknown:0});
const countsText=counts=>Object.entries(settlementLabels).filter(([key])=>counts[key]).map(([key,label])=>label+' '+counts[key]+' 位').join(' · ');
let options=[],view=null,prefs={},savedScroll=0,detailPatient=null,detailTrigger=null,renderedColumns=0;
const engine=new PortalEngine({sourceId,origin,status:text=>{if(!engine.closed)$('loading').textContent=text;}});
const prefsKey='patientPickerPreferences:'+origin;
const announce=text=>{$('announcement').textContent=text;};
function say(text){$('notice').textContent=text;$('notice').hidden=false;announce(text);}
function error(message){$('error-text').textContent=message;$('error').hidden=false;announce(message);}
function clearError(){$('error').hidden=true;$('error-text').textContent='';$('notice').hidden=true;$('notice').textContent='';$('announcement').textContent='';if(!state.batch?.running)state.batch=null;for(const result of settlements.values())result.dismissed=true;}
function dismissSettlement(account){const result=settlements.get(account);if(!result)return;result.dismissed=true;$('notice').hidden=true;$('notice').textContent='';renderResults();announce('已收起結清訊息。');document.querySelector('[data-settle="'+CSS.escape(account)+'"]')?.focus();}
function closeDetails(restore=false){$('detail').hidden=true;if(detailTrigger){detailTrigger.setAttribute('aria-expanded','false');if(restore&&detailTrigger.isConnected)detailTrigger.focus();}detailPatient=null;detailTrigger=null;}
function clearPatientData(){cache.clear();known.clear();settlements.clear();checked.clear();if(wardBatch.run)wardBatch.run.stopRequested=true;wardBatch.run=null;state.batch=null;state.opening=false;state.selected='';state.query='';state.remote=null;state.hot=-1;state.scope='auto';engine.lastRead=null;$('search').value='';closeDetails();for(const id of ['detail-title','detail-person','detail-fields','detail-actions','notice','announcement','loading','batch-current','batch-summary','ward-batch-current','ward-batch-summary','ward-batch-report'])$(id).textContent='';$('notice').hidden=true;}
function resetBatchSelection(){checked.clear();if(!state.batch?.running)state.batch=null;}
function selectedPatients(){return (view?.rows||[]).filter(p=>p.selectable!==false&&checked.has(p.account)&&samePatient(p,checked.get(p.account)));}
function clearedView(){return view?.scope==='remote'?state.remote?.source==='cleared':state.source==='cleared';}
function unsettledPatients(){
  if(!state.connected||!clearedView())return [];
  return (view?.rows||[]).filter(p=>p.selectable!==false&&(billingUnsettledText(p.status)||billingUnsettledText(p.note))&&settlementHint(p,settlements.get(p.account))!=='confirmed');
}
function todayDischargePatients(now=new Date()){
  if(!state.connected)return [];
  return (view?.rows||[]).filter(p=>p.selectable!==false&&isTodayDischarge(p,now));
}
function renderBatchControls(now=new Date()){
  const eligible=(view?.rows||[]).filter(p=>p.selectable!==false),selected=selectedPatients(),batch=state.batch,running=!!batch?.running,autoRunning=!!wardBatch.run?.running;
  $('batch-toolbar').hidden=autoRunning||!state.connected||(!view?.rows.length&&!batch);
  $('select-all').checked=!!eligible.length&&selected.length===eligible.length;$('select-all').indeterminate=selected.length>0&&selected.length<eligible.length;$('select-all').disabled=state.busy||!eligible.length;
  const unsettled=unsettledPatients();
  $('select-unsettled').hidden=!state.connected||!clearedView();$('select-unsettled').disabled=state.busy||!unsettled.length;$('select-unsettled').textContent='全選藥帳未結清（'+unsettled.length+'）';
  const dischargeToday=todayDischargePatients(now);
  $('select-today-discharge').hidden=!state.connected;$('select-today-discharge').disabled=state.busy||!dischargeToday.length;$('select-today-discharge').textContent='全選今日出院（'+dischargeToday.length+'）';
  $('selection-count').textContent='已選 '+selected.length+' 位';$('selection-clear').disabled=state.busy||!selected.length;
  $('batch-settle').textContent='批次結清'+(selected.length?'（'+selected.length+'）':'');$('batch-settle').disabled=state.busy||!selected.length;$('batch-settle').hidden=running;
  $('batch-stop').hidden=autoRunning||!running;$('batch-stop').disabled=!!batch?.stopRequested;$('batch-stop').textContent=batch?.stopRequested?'正在停止…':'停止後續處理';
  $('batch-scope').hidden=!selected.length||running;$('batch-progress').hidden=autoRunning||!batch||!!batch.dismissed;$('batch-dismiss').hidden=running;
  if(!batch){$('batch-current').textContent='';$('batch-summary').textContent='';return;}
  $('batch-meter').max=batch.total;$('batch-meter').value=batch.completed;
  $('batch-current').textContent=running?(batch.stopRequested?'目前這位處理完後停止':'正在處理第 '+(batch.completed+1)+'／'+batch.total+' 位')+(batch.current?' · '+bedLabel(batch.current)+' '+batch.current.name:''):(batch.completed===batch.total?'批次處理完成':'批次已停止')+' · 已處理 '+batch.completed+'／'+batch.total+' 位';
  const labels={success:'結清',already:'原已結清',warning:'警示',skipped:'未執行',unknown:'待確認'};
  const counts=Object.entries(labels).filter(([key])=>batch.counts[key]).map(([key,label])=>label+' '+batch.counts[key]+' 位');
  if(!running&&batch.completed<batch.total)counts.push('尚未處理 '+(batch.total-batch.completed)+' 位');
  $('batch-summary').textContent=counts.join(' · ')+(batch.stopReason?'；'+batch.stopReason:'');
}
function togglePatient(account,value){
  if(state.busy)return;const patient=view?.rows.find(p=>p.account===account);if(!patient||patient.selectable===false)return;
  if(value)checked.set(account,{...patient});else checked.delete(account);
  renderResults();document.querySelector('[data-check-patient="'+CSS.escape(account)+'"]')?.focus({preventScroll:true});
}
function selectAll(value){if(state.busy)return;checked.clear();if(value)for(const p of view?.rows||[])if(p.selectable!==false)checked.set(p.account,{...p});renderResults();}
function selectUnsettled(){
  if(state.busy)return;const patients=unsettledPatients();if(!patients.length)return;
  checked.clear();for(const p of patients)checked.set(p.account,{...p});
  renderResults();announce('已勾選目前清單中 '+patients.length+' 位藥帳未結清的病人。');
}
function selectTodayDischarge(){
  if(state.busy)return;const patients=todayDischargePatients();if(!patients.length){renderResults();return;}
  checked.clear();for(const p of patients)checked.set(p.account,{...p});
  renderResults();announce('已勾選目前清單中 '+patients.length+' 位今日出院的病人。');
}
function stopBatch(){if(wardBatch.run?.running){stopWardBatch();return;}if(!state.batch?.running)return;state.batch.stopRequested=true;renderBatchControls();announce('會完成目前這位病人，並停止後續處理。');}
function activeCache(){return new Map([...cache].filter(([,v])=>v.source===state.source&&v.smartCare===state.smartCare));}
function cached(ward=state.ward,source=state.source){return cache.get(cacheKey(ward,source,state.smartCare));}
async function savePreferences(){
  try{await chrome.storage.local.set({[prefsKey]:{pinned:state.pinned,lastWard:state.ward,campus:state.campus}});}catch{error('瀏覽器無法保存常用病房設定；本次仍可繼續使用。');}
}
function buttonWard(code){
  if(wardBatch.open)return '<label class="pc-ward pc-ward-choice'+(wardBatch.selected.has(code)?' pc-ward-chosen':'')+(wardBatch.run?.running&&norm(code)===norm(state.ward)?' pc-ward-current':'')+'"><input type="checkbox" data-batch-ward="'+esc(code)+'"'+(wardBatch.selected.has(code)?' checked':'')+(state.busy?' disabled':'')+' aria-label="勾選病房 '+esc(code)+'"><span>'+esc(code)+'</span></label>';
  return '<button type="button" class="pc-ward" data-ward="'+esc(code)+'" aria-pressed="'+(norm(code)===norm(state.ward))+'"'+(state.opening?' disabled':'')+'>'+esc(code)+'</button>';
}
function renderSidebar(){
  $('favorites').innerHTML=state.pinned.length?state.pinned.map(buttonWard).join(''):'<span class="no-pins">按病房旁的 ☆ 加入常用</span>';
  const groups=CAMPUS_ORDER.filter(c=>state.wards.some(w=>w.campus===c));
  $('campuses').innerHTML=groups.map(c=>'<button type="button" data-campus="'+esc(c)+'" aria-pressed="'+(c===state.campus)+'"'+(state.opening?' disabled':'')+'>'+esc(c)+'</button>').join('');
  const wards=state.wards.filter(w=>w.campus===state.campus);
  $('campus-name').textContent=state.wards.length?state.campus:'';$('ward-count').textContent=wards.length?wards.length+' 個':'';$('wards').innerHTML=wards.map(w=>buttonWard(w.code)).join('');
}
const shortBed=p=>[p.room,p.bed].filter(Boolean).join('-');
function billingMarkup(value,confirmed=false){
  let remaining=clean(value)||'—',markup='',label;
  while((label=billingUnsettledText(remaining))){
    const at=remaining.indexOf(label);markup+=esc(remaining.slice(0,at));
    markup+=confirmed?'<strong class="pc-billing-settled" title="'+esc('本次已確認結清；查詢時原文：'+label)+'">藥帳已結清</strong>':'<strong class="pc-billing-unsettled">'+esc(label)+'</strong>';
    remaining=remaining.slice(at+label.length);
  }
  return markup+esc(remaining);
}
function patientMarkup(p,index,cleared,cross,now){
  const disabled=state.busy||p.selectable===false;
  const result=settlements.get(p.account);
  const current=!!wardBatch.run?.running&&state.batch?.current?.account===p.account&&result?.status==='running';
  const settleLabel=state.busy&&result?.status==='running'?'處理中':'結清';
  const smart=p.smartCare&&view?.scope!=='remote';
  const today=isTodayAdmission(p.admit,now),discharge=dischargeInfo(p,now),dischargeToday=discharge.day===todayKey(now);
  const badge=(today?'<span class="pc-today">今日入院</span>':'')+(dischargeToday?'<span class="pc-today pc-today-discharge" title="'+(discharge.source==='note'?'備註：':'出院日期：')+esc(discharge.raw)+'">今日出院</span>':'');
  const hint=settlementHint(p,result),pending=cleared&&hint==='pending',confirmed=cleared&&hint==='confirmed';
  const billingUnsettled=hint!=='confirmed'&&(billingUnsettledText(p.status)||billingUnsettledText(p.note));
  const status='<span class="pc-status'+(pending?' pc-status-pending':confirmed?' pc-status-confirmed':cleared?' pc-status-ordinary':/準備出院|出院準備/.test(p.status)?' pc-attention':'')+'">'
    +(pending&&!billingUnsettled?'<strong class="pc-settlement-badge">待結清</strong>':confirmed?'<strong class="pc-settlement-badge">已確認結清</strong>':'')
    +'<span class="pc-status-original">'+(confirmed&&!billingUnsettledText(p.status)?'查詢時：':'')+billingMarkup(p.status,hint==='confirmed')+'</span></span>';
  const note='<span class="pc-visible-note'+(p.note?'':' pc-empty-note')+'">'+billingMarkup(p.note,hint==='confirmed')+'</span>';
  const meta=cleared&&!smart?'<span class="pc-cleared-meta"><span class="pc-discharge-date"><span class="pc-field-label">出院</span>'+esc(p.discharge||'—')+'</span>'+status+note+'</span>':'<span class="pc-inbed-meta">'+(smart&&cleared?'<span class="pc-discharge-date">出院 '+esc(p.discharge||'—')+'</span>':'')+status+note+'</span>';
  const care=smart?'<span class="pc-care-summary">'+(p.careItems?.length?p.careItems.map(x=>'<span class="pc-care-item"'+(x.detail?' title="'+esc(x.detail)+'"':'')+'>'+esc(x.label)+'</span>').join(''):esc(p.careText||'—'))+'</span>':'';
  return '<div role="listitem" id="option-'+index+'" data-auto-current="'+current+'" class="pc-row'+(smart?' pc-row-smart':cleared?' pc-row-cleared':'')+(pending?' pc-needs-settlement':'')+(state.selected===p.account?' pc-opened':'')+(checked.has(p.account)?' pc-checked':'')+(current?' pc-processing':'')+(state.hot===index?' pc-hot':'')+'">'
    +'<label class="pc-check" title="'+esc(p.selectable===false?'原系統未提供這位病人的選取入口':'勾選此病人進行批次結清')+'"><input type="checkbox" data-check-patient="'+esc(p.account)+'"'+(checked.has(p.account)?' checked':'')+(disabled?' disabled':'')+' aria-label="'+esc('勾選 '+bedLabel(p)+' '+p.name+' 進行結清')+'"></label>'
    +'<button type="button" class="pc-entry" data-patient="'+esc(p.account)+'"'+(disabled?' disabled':'')+' aria-label="開啟 '+esc(bedLabel(p)+' '+p.name+(today?' 今日入院':'')+(dischargeToday?' 今日出院':'')+(pending?' 待結清':'')+' '+p.sex+' '+p.age+' 住院帳號 '+p.account)+'">'
    +'<span class="pc-bed">'+(cross?'<small>'+esc(p.ward)+'</small>':'')+highlight(shortBed(p),state.query)+'</span>'
    +'<span class="pc-name">'+highlight(p.name,state.query)+'<span class="pc-person-sub">'+esc([p.sex,p.age].filter(Boolean).join(' '))+badge+'</span></span>'+care+meta+'</button>'
    +'<div class="pc-row-tools"><button type="button" class="pc-settle" data-settle="'+esc(p.account)+'"'+(disabled?' disabled':'')+' aria-label="'+esc('結清 '+bedLabel(p)+' '+p.name)+'">'+settleLabel+'</button><button type="button" class="pc-info" data-info="'+esc(p.account)+'"'+(state.busy?' disabled':'')+' aria-label="'+esc(bedLabel(p)+' '+p.name+' 的完整資訊')+'" aria-controls="detail" aria-expanded="false">ⓘ</button></div>'
    +(result?.reason&&!result.dismissed?'<div class="pc-settle-result '+(['success','already'].includes(result.status)?'pc-settle-ok':'pc-settle-warning')+'"><span>'+esc(result.reason)+'</span><button type="button" class="pc-dismiss-result" data-dismiss-settlement="'+esc(p.account)+'" aria-label="收起 '+esc(p.name)+' 的結清訊息">×</button></div>':'')+'</div>';
}
function columnCount(count,cleared){
  if(cleared||state.smartCare||window.matchMedia?.('(pointer:coarse)').matches)return 1;
  const width=$('results').clientWidth||760;
  return Math.min(4,Math.max(1,Math.floor((width+24)/444)),Math.max(1,Math.floor(count/5)));
}
function renderResults(){
  closeDetails();const now=new Date(),currentCache=activeCache(),all=mergePatients(currentCache,known);
  view=searchModel(state.query,state.ward,state.scope,all,state.wards,state.smartCare?new Set(cached()?.rows.map(p=>p.account)||[]):null);
  if(state.remote&&state.remote.query===clean(state.query).toUpperCase())view={searching:true,scope:'remote',wardHits:[],rows:state.remote.rows.map(p=>({...p,mrn:p.mrn||(known.get(p.account)?.name===p.name?known.get(p.account).mrn:''),checkedAt:state.remote.checkedAt})).sort(bedSort),patientFirst:true};
  const byDischarge=clearedView();
  if(byDischarge)view.rows.sort(dischargeSort);
  for(const [account,p]of checked)if(!view.rows.some(live=>live.account===account&&live.selectable!==false&&samePatient(live,p)))checked.delete(account);
  const ps=view.rows.map(p=>({type:'patient',id:p.account,p})),ws=view.wardHits.map(w=>({type:'ward',id:w.code}));
  options=view.patientFirst?[...ps,...ws]:[...ws,...ps];state.hot=Math.min(state.hot,options.length-1);
  $('ward-hits').hidden=!ws.length;
  $('ward-hits').innerHTML=view.wardHits.map(w=>{const i=options.findIndex(o=>o.type==='ward'&&o.id===w.code);return '<button id="option-'+i+'" type="button" class="'+(i===state.hot?'is-hot':'')+'" data-ward="'+esc(w.code)+'"'+(state.opening?' disabled':'')+'>'+highlight(w.code,state.query)+' ↗</button>';}).join('');
  const cleared=clearedView()||view.scope==='remote'&&state.remote.criteria?.kind!=='bed',smart=state.smartCare&&view.scope!=='remote',count=columnCount(ps.length,cleared),split=Math.ceil(ps.length/count);
  const columns=Array.from({length:count},(_,i)=>view.rows.slice(i*split,(i+1)*split)),cross=view.scope==='remote'||view.rows.some(p=>norm(p.ward)!==norm(state.ward));
  renderedColumns=count;$('results').style.gridTemplateColumns='repeat('+count+',minmax(0,1fr))';
  $('results').className='pc-results'+(count===1?' pc-single':'')+(smart?' pc-smart-list':cleared?' pc-cleared-list':'');
  $('results').innerHTML=columns.filter(c=>c.length).map((list,column)=>{
    const selectHead='<span class="pc-select-heading" aria-hidden="true">選</span>';
    const head=smart?'<div class="pc-column-head">'+selectHead+'<span>床號</span><span>病人</span><span>Smart Care</span><span>狀態／備註</span><span class="pc-action-heading">操作</span></div>':cleared?'<div class="pc-column-head pc-cleared-head">'+selectHead+'<div class="pc-cleared-head-grid"><span>床號</span><span>姓名</span><span>出院日期</span><span>狀態</span><span>備註</span></div></div>':'<div class="pc-column-head">'+selectHead+'<span>床號</span><span>病人</span><span>狀態／備註</span><span class="pc-action-heading">操作</span></div>';
    return '<section class="pc-column" aria-label="'+(cleared?'病人清單':'第 '+(column+1)+' 欄')+'">'+head+'<div role="list">'+list.map(p=>patientMarkup(p,options.findIndex(o=>o.type==='patient'&&o.id===p.account),cleared,cross,now)).join('')+'</div></section>';
  }).join('');
  $('results').setAttribute('aria-busy',String(state.busy));
  const remote=view.scope==='remote',bedQuery=remote&&state.remote.criteria?.kind==='bed';
  const mode=remote&&!bedQuery?'mrn':state.source,modeLabel=remote?bedQuery?(state.remote.source==='cleared'?'已清床':'在床病人')+'・床位查詢':({mrn:'病歷號查詢',account:'住院帳號查詢',personId:'身分證號查詢'}[state.remote.criteria?.kind]||'病人查詢'):mode==='cleared'?'已清床':'在床病人';
  $('picker').dataset.source=state.connected?mode:'';$('source-mode').textContent=modeLabel;$('source-mode').hidden=!state.connected;
  $('list-title').textContent=remote?'搜尋結果':state.ward||'病人名單';$('ward-campus').textContent=state.ward&&!remote?campusOf(state.ward):'';
  $('results').setAttribute('aria-label',modeLabel+'名單');
  const pendingCount=cleared?view.rows.filter(p=>settlementHint(p,settlements.get(p.account))==='pending').length:0;
  $('list-meta').textContent=state.connected?(view.searching?'找到 ':'共 ')+ps.length+' 位'+(pendingCount?' · 待結清 '+pendingCount+' 位':''):'';
  $('pin').hidden=!state.ward||remote;$('pin').textContent=state.pinned.includes(state.ward)?'★':'☆';$('pin').setAttribute('aria-label',(state.pinned.includes(state.ward)?'移除':'加入')+'常用病房 '+state.ward);
  $('scope').hidden=!view.searching||view.scope==='remote';$('scope-current').textContent=state.ward+' 本病房';$('scope-current').setAttribute('aria-pressed',String(view.scope==='current'));$('scope-all').setAttribute('aria-pressed',String(view.scope==='all'));
  const sourceLabel=state.source==='cleared'?'已清床':'在床病人';
  const queryPlan=parseSearch(state.query,state.ward,state.wards),queryLabel={mrn:'病歷號',account:'住院帳號',personId:'身分證號',bed:'床位',ward:'病房'}[queryPlan.kind];
  $('search-hint').textContent=!state.connected?'請先連接查詢處理頁面。':remote?(state.remote.failed?'查詢未完成，請重試。':bedQuery?'原系統床位查詢結果':'原系統跨病房查詢結果'):queryLabel?'按 Enter 或「搜尋」送出'+queryLabel+'查詢'+(queryPlan.kind==='bed'?' · '+queryPlan.ward+' '+queryPlan.room+(queryPlan.bed?'-'+queryPlan.bed:''):''):view.searching?'可輸入病房／床號、病歷號、住院帳號或身分證號':'Enter 送出原系統查詢；只輸入病室／床號時查目前病房';
  if(state.smartCare&&view.scope!=='remote')$('search-hint').textContent+=' · Smart Care 名單';
  $('clear').hidden=!state.query;
  $('lookup').disabled=!state.connected||state.busy||!clean(state.query);$('refresh').disabled=!state.connected||state.busy;$('connect').disabled=state.busy;$('source').disabled=!sourceId;
  for(const id of ['search','clear','scope-current','scope-all','pin'])$(id).disabled=state.opening;
  for(const key of ['inbed','cleared']){$(key).setAttribute('aria-pressed',String(mode===key));$(key).disabled=!state.connected||state.busy||(key==='cleared'&&!state.canCleared);$(key+'-count').textContent=cached(state.ward,key)?.rows.length??'—';}
  $('smart-label').hidden=!state.smartAvailable||remote;$('smart').checked=state.smartCare;$('smart').disabled=state.busy||remote||state.smartEnabled===false;
  const current=view.scope==='remote'?state.remote:cached();
  $('freshness').textContent=current?.checkedAt?(view.searching&&view.scope==='all'?currentCache.size+' 個病房已載入':'更新 '+new Date(current.checkedAt).toLocaleTimeString('zh-TW',{hour12:false})):state.busy?'查詢中…':state.connected?'尚未載入':'';
  $('partial').hidden=!(view.scope==='remote'?state.remote?.pagination:view.scope==='all'?[...currentCache.values()].some(x=>x.pagination):current?.pagination);
  $('empty').hidden=!!options.length;$('empty-title').textContent=state.busy?'正在讀取院內名單…':!state.connected?'尚未連接查詢處理':view.searching?'找不到符合的結果':current?'此病房查無'+sourceLabel:'此名單尚未載入';
  $('empty-message').textContent=state.busy?'完成後即可選擇病人。':!state.connected?'在院內查詢處理頁面按下擴充元件，或按「重新連接」。':remote?'請核對查詢條件，或修改輸入後再次搜尋。':view.searching?'目前顯示已載入名單的篩選結果；按 Enter 或「搜尋」向原系統查詢。':'可點選其他病房，或重新整理。';
  $('order-label').textContent=byDischarge?'依出院日期由新到舊':count>1?'依床號由上往下，接續右欄':'依床號排列';
  renderBatchControls(now);
  renderWardBatch();
}
function render(){renderSidebar();renderResults();}
function updateControls(control){if(!control)return;state.wards=normalizeWards(control.options);state.canCleared=!!control.clearedEnabled;state.smartAvailable=!!control.smartCare;state.smartEnabled=control.smartCare?.enabled!==false;}
function acceptWard(result,ward){cache.set(cacheKey(ward,result.source,result.smartCare),{...result,ward});updateControls(result.control);}
async function connect(){
  if(workBlocked())return;
  if(state.busy)return;resetBatchSelection();const request=++state.request;state.busy=true;clearError();render();$('loading').textContent='正在連接院內頁面…';let controlsFound=false;
  try{
    const d=await engine.connect();updateControls(d.control);if(!state.wards.length)throw new Error('原系統沒有可辨識的病房選項。');
    state.canQueryMRN=d.canQueryMRN;state.connected=true;controlsFound=true;state.smartCare=!!d.control.smartCare?.checked;
    const available=code=>state.wards.find(w=>norm(w.code)===norm(code))?.code;
    state.pinned=[...new Set((Array.isArray(prefs.pinned)?prefs.pinned:[]).map(available).filter(Boolean))];
    state.ward=available(state.ward)||available(d.control.selectedWard)||available(prefs.lastWard)||state.pinned[0]||state.wards[0].code;
    state.campus=campusOf(state.ward);state.remote=null;if(!state.canCleared)state.source='inbed';render();
    const r=await engine.loadWard(state.ward,state.source,state.smartCare);if(request===state.request&&!r.superseded)acceptWard(r,state.ward);await savePreferences();
  }catch(e){
    if(request!==state.request)return;
    if(!controlsFound||engine.closed||['SOURCE_CLOSED','SOURCE_CHANGED','LOGIN'].includes(e.code)){state.connected=false;clearPatientData();}else{cache.delete(cacheKey(state.ward,state.source,state.smartCare));engine.lastRead=null;}
    error(e.message);
  }finally{if(request===state.request){state.busy=false;$('loading').textContent='';render();}}
}
async function chooseWard(ward,{preserveQuery=false,preserveSource=false}={}){
  if(workBlocked())return;
  const target=state.wards.find(w=>w.code===ward);if(!target||state.opening||!state.connected)return;
  if(!preserveSource)state.source='inbed';
  resetBatchSelection();
  const request=++state.request,source=state.source,smartCare=state.smartCare;state.ward=ward;state.campus=target.campus;state.remote=null;state.hot=-1;
  if(!preserveQuery){state.query='';state.scope='auto';$('search').value='';}clearError();state.busy=true;render();
  const pending=engine.loadWard(ward,source,smartCare);savePreferences();
  try{const r=await pending;if(!r.superseded){acceptWard(r,ward);if(request===state.request)announce(ward+' 已更新，'+r.rows.length+' 位病人。');}}
  catch(e){if(request===state.request){cache.delete(cacheKey(ward,source,smartCare));if(['SOURCE_CLOSED','SOURCE_CHANGED','LOGIN'].includes(e.code)){clearPatientData();state.connected=false;}else{try{const d=await engine.call('discover');if(request===state.request&&d.control){updateControls(d.control);state.smartCare=!!d.control.smartCare?.checked;}}catch{}}error(e.message);}}
  finally{if(request===state.request){state.busy=false;$('loading').textContent='';render();}}
}
async function switchSource(source){
  if(workBlocked())return;if(state.busy||!state.connected||!['inbed','cleared'].includes(source))return;state.source=source;if(view?.scope==='remote'&&state.remote.criteria?.kind==='bed')return lookup();return chooseWard(state.ward,{preserveQuery:view?.scope!=='remote',preserveSource:true});}
function showDetails(patient,trigger){
  if(state.busy||!patient)return;closeDetails();detailPatient=patient;detailTrigger=trigger;trigger?.setAttribute('aria-expanded','true');
  $('detail-title').textContent=bedLabel(patient);$('detail-person').innerHTML=esc(patient.name)+'<span>'+esc([patient.sex,patient.age].filter(Boolean).join(' · '))+'</span>';
  const confirmed=settlementHint(patient,settlements.get(patient.account))==='confirmed';
  const fields=[['住院帳號',patient.account],['病歷號',patient.mrn||'尚未取得'],['科別',patient.department],['入院日期',patient.admit],['出院日期',patient.discharge],[confirmed?'狀態（查詢時）':'狀態',patient.status],['DRG',patient.drg]];
  if(confirmed)fields.push(['藥帳','本次已確認結清']);
  $('detail-fields').innerHTML=fields.map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+esc(v||'—')+'</dd></div>').join('')+'<div class="pc-wide-field"><dt>'+(confirmed?'備註（查詢時原文）':'備註')+'</dt><dd>'+esc(patient.note||'—')+'</dd></div>';
  if(patient.smartCare)$('detail-fields').innerHTML+='<div class="pc-wide-field"><dt>Smart Care</dt><dd>'+(patient.careItems?.length?patient.careItems.map(x=>'<div class="pc-care-detail"><strong>'+esc(x.label)+'</strong>'+(x.detail?'<p>'+esc(x.detail)+'</p>':'')+'</div>').join(''):esc(patient.careText||'—'))+'</dd></div>';
  $('detail-actions').innerHTML=(patient.actions||[]).map(a=>'<button type="button" data-row-action="'+esc(a.key)+'">'+esc(a.key==='drg'?'DRG '+a.label:a.label)+'</button>').join('')+'<button type="button" class="pc-primary" data-detail-open="true"'+(patient.selectable===false?' disabled':'')+'>開啟病人 ↗</button>';
  const panel=$('detail');panel.hidden=false;const root=$('picker'),r=root.getBoundingClientRect(),b=trigger.getBoundingClientRect();
  panel.style.top=Math.max(window.scrollY+12,Math.min(b.bottom-r.top+6,window.scrollY+window.innerHeight-panel.offsetHeight-12))+'px';panel.style.left=Math.max(12,Math.min(b.right-r.left-panel.offsetWidth,root.clientWidth-panel.offsetWidth-12))+'px';$('detail-close').focus();
}
async function openPatient(patient,action=''){
  if(workBlocked())return;
  if(state.busy||!patient)return;state.busy=true;state.opening=true;clearError();savedScroll=window.scrollY;const expected={...patient};renderResults();
  try{
    if(action){await engine.rowAction(expected,action);announce('已開啟 '+bedLabel(expected)+' 的原系統功能。');}
    else{const detail=await engine.openPatient(expected);known.set(expected.account,{name:expected.name,mrn:detail.mrn});state.selected=expected.account;announce('已開啟 '+bedLabel(expected)+' '+expected.name+'。');}
  }catch(e){for(const [key,item]of cache)if(norm(item.ward)===norm(expected.ward))cache.delete(key);if(['SOURCE_CLOSED','SOURCE_CHANGED','LOGIN'].includes(e.code)){clearPatientData();state.connected=false;}error(e.message);}
  finally{state.busy=false;state.opening=false;$('loading').textContent='';render();window.scrollTo({top:savedScroll,behavior:'instant'});}
}
async function lookup(){
  if(workBlocked())return;
  if(state.busy||!state.connected)return;
  const criteria=parseSearch(state.query,state.ward,state.wards);if(criteria.kind==='empty')return;
  if(criteria.kind==='invalid'){clearError();error(criteria.message);return;}
  if(criteria.kind==='ward')return chooseWard(criteria.ward);
  resetBatchSelection();
  const query=clean(state.query).toUpperCase(),request=++state.request,source=state.source;state.busy=true;clearError();state.hot=-1;
  state.remote={query,criteria,source:criteria.kind==='bed'?source:criteria.kind==='mrn'?'mrn':'person',rows:[],pagination:false};
  if(criteria.kind==='bed'){state.ward=criteria.ward;state.campus=campusOf(criteria.ward);savePreferences();}render();
  try{
    const r=await (criteria.kind==='mrn'?engine.queryMRN(criteria.value):criteria.kind==='bed'?engine.queryBed(criteria,source):engine.queryPerson(criteria.kind,criteria.value));
    if(request===state.request&&clean(state.query).toUpperCase()===query){state.remote={query,criteria,source:r.source,rows:r.rows,pagination:r.pagination,checkedAt:r.checkedAt};state.hot=-1;announce('原系統查詢完成，'+r.rows.length+' 位病人。');}
  }catch(e){if(request===state.request&&clean(state.query).toUpperCase()===query){if(['SOURCE_CLOSED','SOURCE_CHANGED','LOGIN'].includes(e.code)){clearPatientData();state.connected=false;}else if(state.remote)state.remote.failed=true;error(e.message);}}
  finally{if(request===state.request){state.busy=false;$('loading').textContent='';render();}}
}
async function settlePatient(patient){
  if(workBlocked())return;
  if(state.busy||!patient||patient.selectable===false)return;
  const request=++state.request;state.busy=true;state.opening=true;clearError();savedScroll=window.scrollY;
  renderSidebar();
  try{await processSettlement(patient,request);}
  finally{if(request===state.request){state.busy=false;state.opening=false;$('loading').textContent='';render();window.scrollTo({top:savedScroll,behavior:'instant'});}}
}
async function processSettlement(patient,request){
  settlements.set(patient.account,{status:'running'});renderResults();
  let result;
  try{
    result=await engine.settlePatient({...patient});
  }catch(e){result={status:'unknown',reason:e.message+'；請在原系統確認，不會自動重送。',stopBatch:true};}
  if(request!==state.request||!state.connected)return null;
  settlements.set(patient.account,result);if(result.mrn)known.set(patient.account,{name:patient.name,mrn:result.mrn});
  announce(bedLabel(patient)+' '+patient.name+'：'+result.reason);return result;
}
async function settleBatch(){
  if(workBlocked())return;
  if(state.busy||!state.connected)return;
  const patients=selectedPatients().map(p=>({...checked.get(p.account),mrn:p.mrn||checked.get(p.account).mrn}));if(!patients.length)return;
  const request=++state.request;
  clearError();state.busy=true;state.opening=true;savedScroll=window.scrollY;renderSidebar();
  try{await executeSettlementBatch(patients,request);}
  finally{
    if(request===state.request){state.busy=false;state.opening=false;$('loading').textContent='';render();window.scrollTo({top:savedScroll,behavior:'instant'});announce($('batch-current').textContent+'；'+$('batch-summary').textContent);}
  }
}
async function executeSettlementBatch(patients,request,run=null,stage=null){
  const batch={running:true,total:patients.length,completed:0,current:null,counts:emptyCounts(),stopRequested:false,stopReason:''};
  state.batch=batch;
  try{
    for(const patient of patients){
      if(workBlocked()||batch.stopRequested||request!==state.request||!state.connected)break;
      if(run){
        if(todayKey()!==run.day){run.stopRequested=true;run.stopReason='日期已變更，已停止。請重新開始以更新今日出院名單。';}
        if(run.stopRequested)break;
        run.attempted.add(patient.account);
      }
      batch.current=patient;const result=await processSettlement(patient,request);if(!result)break;
      batch.completed++;batch.counts[result.status in batch.counts?result.status:'unknown']++;
      if(stage){stage.completed=batch.completed;stage.counts={...batch.counts,skipped:batch.counts.skipped+stage.blocked};stage.results.push({patient:{...patient},...result});}
      if(result.stopBatch||engine.closed){batch.stopRequested=true;batch.stopReason=result.reason||'原系統連線或返回名單未完成，已停止後續處理。';}
      renderResults();
    }
  }finally{
    if(request===state.request){batch.running=false;batch.current=null;renderResults();}
  }
  return batch;
}
function toggleWardBatch(){if(state.busy)return;wardBatch.open=!wardBatch.open;render();}
function toggleBatchWard(code,value){
  if(state.busy||!state.wards.some(w=>w.code===code))return;
  if(value)wardBatch.selected.add(code);else wardBatch.selected.delete(code);
  renderSidebar();renderWardBatch();
  document.querySelector('[data-batch-ward="'+CSS.escape(code)+'"]')?.focus({preventScroll:true});
}
function stopWardBatch(){
  const run=wardBatch.run;if(!run?.running)return;run.stopRequested=true;
  if(state.batch?.running)state.batch.stopRequested=true;
  renderBatchControls();renderWardBatch();announce('已要求停止；目前這位病人處理完後，不再處理其他病人或病房。');
}
function wardStageText(stage){
  if(!stage)return '未選此項';
  const extra=[stage.duplicates?'本次已處理 '+stage.duplicates+' 位':'',stage.blocked?'無選取入口 '+stage.blocked+' 位':''].filter(Boolean);
  const prefix={pending:'尚未執行',query:'查詢中',select:'已勾選 '+stage.total+' 位',settle:'處理中 '+stage.completed+'／'+stage.total,empty:'無符合病人，已略過',done:'完成',stopped:'已停止',error:'未完成'}[stage.status];
  if(stage.total>stage.completed&&['stopped','error'].includes(stage.status))extra.push('尚未處理 '+(stage.total-stage.completed)+' 位');
  return [prefix,countsText(stage.counts),...extra,stage.error].filter(Boolean).join(' · ');
}
function fitSidebar(){const nav=$('ward-navigation');nav.style.height='calc(100dvh - '+Math.max(0,nav.getBoundingClientRect().top)+'px)';}
function renderWardBatch(){
  const run=wardBatch.run,running=!!run?.running,selected=[...wardBatch.selected],available=new Set(state.wards.map(w=>w.code));
  $('ward-batch-toggle').disabled=state.busy;$('ward-batch-toggle').setAttribute('aria-expanded',String(wardBatch.open));
  $('ward-batch-toggle').textContent=wardBatch.open?'返回單病房選擇':'跨病房批次結清';
  $('ward-batch-panel').hidden=!wardBatch.open;$('ward-batch-side-hint').hidden=!wardBatch.open;
  $('ward-batch-panel').dataset.running=String(running);$('ward-batch-heading').hidden=running;$('ward-batch-setup-actions').hidden=running;
  $('ward-batch-selection-tools').hidden=!wardBatch.open;
  $('ward-batch-close').disabled=state.busy;$('ward-batch-config').hidden=running;
  $('ward-batch-selection-count').textContent='已選 '+selected.length+' 個病房';
  $('ward-batch-selected').innerHTML=selected.map(code=>'<button type="button" data-remove-batch-ward="'+esc(code)+'"'+(state.busy?' disabled':'')+' aria-label="取消勾選病房 '+esc(code)+'">'+esc(code)+' ×</button>').join('');
  $('ward-batch-clear').disabled=state.busy||!selected.length;
  for(const source of ['inbed','cleared']){$('ward-batch-'+source).checked=wardBatch[source];$('ward-batch-'+source).disabled=state.busy;}
  const invalid=!state.connected?'請先連接院內查詢處理頁面。':!selected.length?'從左側勾選病房，再按開始結清。':selected.some(code=>!available.has(code))?'部分勾選病房已不在原系統選單，請取消後重新選擇。':!wardBatch.inbed&&!wardBatch.cleared?'請至少勾選一個處理項目。':wardBatch.cleared&&!state.canCleared?'原系統目前無法查詢已清床名單。':'';
  $('ward-batch-start').hidden=running;$('ward-batch-start').disabled=state.busy||!!invalid;
  $('ward-batch-start').textContent='開始結清'+(selected.length?'（'+selected.length+' 個病房）':'');
  $('ward-batch-hint').textContent=running?'依序顯示查詢、勾選與結清；請保留原系統分頁，執行中避免手動操作。':invalid||'依勾選順序逐房處理；使用完整病房名單，不套用搜尋或 Smart Care 篩選。';
  $('ward-batch-stop').hidden=!running;$('ward-batch-stop').disabled=!!run?.stopRequested;$('ward-batch-stop').textContent=run?.stopRequested?'正在停止…':'停止後續處理';
  $('ward-batch-progress').hidden=!wardBatch.open||!run||(!running&&!!state.batch?.running);
  $('ward-batch-progress').dataset.running=String(running);$('results').dataset.autoRunning=String(running);$('picker').dataset.autoRunning=String(running);
  $('loading').hidden=running;if(running)$('empty').hidden=true;
  fitSidebar();
  if(!run){for(const id of ['ward-batch-current','ward-batch-position','ward-batch-action','ward-batch-patient-position','ward-batch-summary'])$(id).textContent='';$('ward-batch-report').innerHTML='';$('ward-batch-issues').innerHTML='';$('ward-batch-attention').hidden=true;return;}
  const done=run.wards.filter(w=>w.stages.every(s=>['done','empty'].includes(s.status))).length,counts=emptyCounts();
  for(const w of run.wards)for(const s of w.stages)for(const key of Object.keys(counts))counts[key]+=s.counts[key];
  const sourceLabel=run.current?.source==='inbed'?'在床病人':'已清床',batch=state.batch;
  const patient=running&&run.phase==='settle'&&batch?.running&&batch.current&&settlements.get(batch.current.account)?.status==='running'?batch.current:null;
  $('ward-batch-current').textContent=running?run.wards[run.index].code+' · '+sourceLabel:(run.stopRequested?'跨病房結清已停止':'跨病房結清完成');
  $('ward-batch-position').textContent=running?'第 '+(run.index+1)+'／'+run.wards.length+' 個病房':'完成 '+done+'／'+run.wards.length+' 個病房';
  let action='',position='';
  if(!running)action=run.stopReason||'已完成所選病房的處理。';
  else if(patient){action=(run.stopRequested?'正在完成 ':'正在結清 ')+shortBed(patient)+'　'+patient.name+(run.stopRequested?'，完成後停止':'');position='第 '+(batch.completed+1)+'／'+batch.total+' 位';}
  else if(run.stopRequested)action=run.phase==='query'?'正在停止，等待本次查詢結束…':'正在停止，不再開始後續處理。';
  else if(run.phase==='query')action='正在查詢'+sourceLabel+'名單…';
  else if(run.phase==='select')action=run.current.total?'已勾選 '+run.current.total+' 位'+(run.current.source==='inbed'?'今日出院':'藥帳未結清')+'病人':run.current.duplicates||run.current.blocked?'沒有可新增處理的病人，略過此名單。':'沒有符合條件的病人，略過此名單。';
  else if(run.phase==='settle'){action=run.current.completed===run.current.total?'本名單處理完成。':'準備處理下一位病人…';position='已處理 '+run.current.completed+'／'+run.current.total+' 位';}
  $('ward-batch-action').textContent=action;$('ward-batch-patient-position').textContent=position;
  $('ward-batch-summary').textContent=['已確認結清 '+(counts.success+counts.already)+' 位',...['warning','skipped','unknown'].filter(key=>counts[key]).map(key=>settlementLabels[key]+' '+counts[key]+' 位')].join(' · ');
  const rows=run.wards.map(w=>'<tr><th scope="row">'+esc(w.code)+'</th>'+['inbed','cleared'].map(source=>'<td>'+esc(wardStageText(w.stages.find(s=>s.source===source)))+'</td>').join('')+'</tr>').join('');
  const issues=run.wards.flatMap(w=>w.stages.flatMap(s=>s.results.filter(r=>!['success','already'].includes(r.status)).map(r=>'<li><strong>'+esc(w.code+' · '+(s.source==='inbed'?'在床':'已清床')+' · '+shortBed(r.patient)+' '+r.patient.name)+'</strong><span>'+esc(r.reason||settlementLabels[r.status]||'待確認')+'</span></li>'))).join('');
  $('ward-batch-report').innerHTML='<table><thead><tr><th>病房</th><th>在床：今日出院</th><th>已清床：藥帳未結清</th></tr></thead><tbody>'+rows+'</tbody></table>'+(running&&issues?'<h3>需要查看的病人</h3><ul class="pc-ward-batch-issues">'+issues+'</ul>':'');
  $('ward-batch-attention').hidden=running||!issues;$('ward-batch-issues').innerHTML=running?'':issues;
}
async function startWardBatch(){
  if(workBlocked())return;
  if(state.busy||!state.connected||!wardBatch.selected.size||(!wardBatch.inbed&&!wardBatch.cleared)||wardBatch.cleared&&!state.canCleared)return;
  const wards=[...wardBatch.selected];
  if(wards.some(code=>!state.wards.some(w=>w.code===code))){error('勾選的病房已變更，請重新選擇。');return;}
  const sources=['inbed','cleared'].filter(source=>wardBatch[source]);
  const run={running:true,stopRequested:false,stopReason:'',day:todayKey(),index:0,phase:'query',current:null,attempted:new Set(),wards:wards.map(code=>({code,stages:sources.map(source=>({source,status:'pending',total:0,completed:0,duplicates:0,blocked:0,counts:emptyCounts(),results:[]}))}))};
  const request=++state.request;
  clearError();resetBatchSelection();wardBatch.open=true;wardBatch.run=run;state.busy=true;state.opening=true;
  state.query='';state.scope='auto';state.remote=null;state.smartCare=false;state.hot=-1;$('search').value='';$('ward-batch-details').open=false;closeDetails();
  window.scrollTo({top:0,behavior:'instant'});
  const active=()=>request===state.request&&state.connected&&wardBatch.run===run;
  const pause=()=>new Promise(resolve=>setTimeout(resolve,500));
  try{
    for(let i=0;i<run.wards.length;i++){
      run.index=i;const ward=run.wards[i];
      for(const stage of ward.stages){
        if(!active()||run.stopRequested)break;
        run.current=stage;run.phase='query';stage.status='query';checked.clear();state.batch=null;
        if(todayKey()!==run.day)throw new Error('日期已變更，請重新開始以更新今日出院名單。');
        if(!state.wards.some(w=>w.code===ward.code))throw new Error('原系統已無病房 '+ward.code+'，已停止後續處理。');
        if(stage.source==='cleared'&&!state.canCleared)throw new Error('原系統目前無法查詢已清床名單。');
        state.ward=ward.code;state.campus=campusOf(ward.code);state.source=stage.source;
        cache.delete(cacheKey(ward.code,stage.source,false));engine.lastRead=null;render();
        await pause();if(!active()||run.stopRequested)break;
        const result=await engine.loadWard(ward.code,stage.source,false);
        if(!active())return;
        if(result.superseded||result.source!==stage.source||result.smartCare)throw new Error('原系統查詢條件已變更，未取得本次指定名單。');
        acceptWard(result,ward.code);render();
        if(result.pagination)throw new Error('原系統名單有分頁，無法確認已取得所有病人；已停止，請在原系統確認完整名單。');
        if(run.stopRequested)break;
        run.phase='select';stage.status='select';
        const matches=p=>stage.source==='inbed'?isTodayDischarge(p):billingUnsettledText(p.status)||billingUnsettledText(p.note);
        for(const p of view.rows.filter(p=>p.selectable===false&&matches(p))){stage.blocked++;stage.results.push({patient:{...p},status:'skipped',reason:'原系統未提供選取入口，未執行結清。'});stage.counts.skipped++;}
        const targets=stage.source==='inbed'?todayDischargePatients():unsettledPatients();
        const patients=targets.filter(p=>!run.attempted.has(p.account)).map(p=>({...p,settlementCriteria:{kind:stage.source==='inbed'?'today-discharge':'unsettled',day:run.day}}));
        stage.duplicates=targets.length-patients.length;stage.total=patients.length;
        for(const p of patients){const {settlementCriteria,...selection}=p;checked.set(p.account,selection);}
        renderResults();announce(ward.code+' '+(stage.source==='inbed'?'在床今日出院':'已清床藥帳未結清')+'，已勾選 '+patients.length+' 位。');
        await pause();if(!active()||run.stopRequested)break;
        if(!patients.length){stage.status=stage.duplicates||stage.blocked?'done':'empty';renderWardBatch();continue;}
        run.phase='settle';stage.status='settle';renderResults();
        const batch=await executeSettlementBatch(patients,request,run,stage);
        if(!active())return;
        if(batch.stopRequested){run.stopRequested=true;run.stopReason=batch.stopReason||run.stopReason;}
        stage.status=run.stopRequested?'stopped':'done';renderResults();
        await pause();
      }
      if(!active()||run.stopRequested)break;
    }
  }catch(e){
    if(!active())return;
    run.stopRequested=true;run.stopReason=e.message;
    if(run.current){run.current.status='error';run.current.error=e.message;}
    if(['SOURCE_CLOSED','SOURCE_CHANGED','LOGIN','INJECTION'].includes(e.code)){state.connected=false;clearPatientData();error(e.message);}
  }finally{
    if(active()){
      if(run.stopRequested&&run.current&&['query','select','settle'].includes(run.current.status))run.current.status='stopped';
      run.running=false;if(run.stopRequested&&!run.stopReason)run.stopReason='已依要求停止，後續病人及病房尚未執行。';
      state.busy=false;state.opening=false;state.batch=null;$('loading').textContent='';render();announce($('ward-batch-current').textContent+'；'+$('ward-batch-action').textContent+'；'+$('ward-batch-summary').textContent);
    }else if(request===state.request){state.busy=false;state.opening=false;$('loading').textContent='';render();}
  }
}
function queryChanged(value){if(state.opening)return;resetBatchSelection();state.query=value;state.remote=null;state.scope='auto';state.hot=-1;clearError();renderResults();}
function clearQuery(){if(state.opening)return;queryChanged('');$('search').value='';$('search').focus();}
function activate(option){if(option?.type==='ward')return chooseWard(option.id);if(option?.p.selectable===false)return say('原系統目前未提供這位病人的選取功能。');if(option)return openPatient(option.p);}
function chooseHot(){
  if(state.busy)return;if(state.hot>=0)return activate(options[state.hot]);
  return lookup();
}
async function downloadDiagnostic(){
  if(workBlocked())return;
  const button=$('diagnostic');button.disabled=true;
  try{const report={version:chrome.runtime.getManifest().version,collectedAt:new Date().toISOString(),...await engine.diagnostics()};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='病人快速選擇_相容性資訊.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('已匯出相容性資訊，不含病人資料。');}
  catch{error('無法匯出相容性資訊，請提供目前顯示的錯誤訊息。');}finally{button.disabled=false;}
}
for(const type of ['click','input','change','keydown','submit'])document.addEventListener(type,event=>{if(workBlocked()&&event.target.closest?.('#app-shell')&&!event.target.closest?.('#open-update,#open-management,#batch-stop,#ward-batch-stop')){event.preventDefault();event.stopImmediatePropagation();}},true);
$('search').addEventListener('input',e=>queryChanged(e.target.value));
document.addEventListener('change',e=>{if(e.target.dataset.checkPatient)togglePatient(e.target.dataset.checkPatient,e.target.checked);if(e.target.dataset.batchWard)toggleBatchWard(e.target.dataset.batchWard,e.target.checked);});
$('ward-batch-toggle').addEventListener('click',toggleWardBatch);$('ward-batch-close').addEventListener('click',toggleWardBatch);
$('ward-batch-clear').addEventListener('click',()=>{if(state.busy)return;wardBatch.selected.clear();renderSidebar();renderWardBatch();});
for(const source of ['inbed','cleared'])$('ward-batch-'+source).addEventListener('change',e=>{if(state.busy)return;wardBatch[source]=e.target.checked;renderWardBatch();});
$('ward-batch-start').addEventListener('click',startWardBatch);$('ward-batch-stop').addEventListener('click',stopWardBatch);
$('select-all').addEventListener('change',e=>selectAll(e.target.checked));
$('select-unsettled').addEventListener('click',selectUnsettled);
$('select-today-discharge').addEventListener('click',selectTodayDischarge);
$('selection-clear').addEventListener('click',()=>selectAll(false));$('batch-settle').addEventListener('click',settleBatch);$('batch-stop').addEventListener('click',stopBatch);
$('batch-dismiss').addEventListener('click',()=>{if(state.batch&&!state.batch.running){state.batch.dismissed=true;renderBatchControls();}});
$('search').addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();state.hot=Math.max(0,Math.min(options.length-1,state.hot+(e.key==='ArrowDown'?1:-1)));renderResults();const o=options[state.hot];if(o)announce(o.type==='ward'?o.id:bedLabel(o.p)+' '+o.p.name);$('option-'+state.hot)?.scrollIntoView?.({block:'nearest'});}else if(e.key==='Enter'){e.preventDefault();chooseHot();}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();clearQuery();}});
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.removeBatchWard){toggleBatchWard(b.dataset.removeBatchWard,false);return;}
  if(b.dataset.dismissSettlement){dismissSettlement(b.dataset.dismissSettlement);return;}
  if(b.dataset.settle){settlePatient(view.rows.find(p=>p.account===b.dataset.settle));return;}
  if(b.dataset.detailOpen){const p=detailPatient;openPatient(p);return;}
  if(b.dataset.rowAction){const p=detailPatient;openPatient(p,b.dataset.rowAction);return;}
  if(b.dataset.info){showDetails(view.rows.find(p=>p.account===b.dataset.info),b);return;}
  if(!e.target.closest('#detail'))closeDetails();
  if(b.dataset.ward)chooseWard(b.dataset.ward);else if(b.dataset.campus&&!state.opening){state.campus=b.dataset.campus;renderSidebar();savePreferences();}else if(b.dataset.patient)openPatient(view.rows.find(p=>p.account===b.dataset.patient));
});
$('clear').addEventListener('click',clearQuery);$('lookup').addEventListener('click',lookup);$('connect').addEventListener('click',connect);
$('refresh').addEventListener('click',()=>view?.scope==='remote'?lookup():chooseWard(state.ward,{preserveQuery:true,preserveSource:true}));
$('inbed').addEventListener('click',()=>switchSource('inbed'));$('cleared').addEventListener('click',()=>switchSource('cleared'));
$('smart').addEventListener('change',e=>{if(state.busy)return;state.smartCare=e.target.checked;chooseWard(state.ward,{preserveQuery:true,preserveSource:true});});
$('source').addEventListener('click',()=>engine.focusSource().catch(e=>error(e.message)));$('dismiss-error').addEventListener('click',clearError);$('diagnostic').addEventListener('click',downloadDiagnostic);
$('scope-current').addEventListener('click',()=>{if(state.opening)return;resetBatchSelection();state.scope='current';state.hot=-1;renderResults();});$('scope-all').addEventListener('click',()=>{if(state.opening)return;resetBatchSelection();state.scope='all';state.hot=-1;renderResults();});
$('pin').addEventListener('click',()=>{const i=state.pinned.indexOf(state.ward);if(i<0)state.pinned.push(state.ward);else state.pinned.splice(i,1);renderSidebar();renderResults();savePreferences();});
$('detail-close').addEventListener('click',()=>closeDetails(true));
document.addEventListener('keydown',e=>{const editing=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable;if(e.key==='Escape'&&!$('detail').hidden){e.preventDefault();closeDetails(true);}else if(e.key==='/'&&!editing){e.preventDefault();$('search').focus();$('search').select();}});
window.addEventListener('focus',async()=>{if(workBlocked()||state.opening||state.busy||!state.connected)return;window.scrollTo({top:savedScroll,behavior:'instant'});try{const d=await engine.discover();if(d.control){state.canQueryMRN=d.canQueryMRN;updateControls(d.control);}render();}catch(e){clearPatientData();state.connected=false;render();error(e.message);}});
let displayedDay=todayKey();
window.setInterval(()=>{const day=todayKey();if(day!==displayedDay&&!state.busy){displayedDay=day;renderResults();}},60000);
window.addEventListener('blur',()=>{savedScroll=window.scrollY;});
window.addEventListener('resize',fitSidebar);window.addEventListener('scroll',fitSidebar,{passive:true});
if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(fitSidebar);const header=document.querySelector('.pc-header');if(header)observer.observe(header);observer.observe($('error'));}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(view&&columnCount(view.rows.length,clearedView()||view.scope==='remote'&&state.remote.criteria?.kind!=='bed')!==renderedColumns)renderResults();}).observe($('results'));
chrome.tabs.onRemoved.addListener(id=>{if(id===sourceId){engine.closed=true;state.request++;state.busy=false;state.connected=false;clearPatientData();render();error('原院內分頁已關閉。請重新開啟查詢處理後再按擴充元件。');}});
try{prefs=(await chrome.storage.local.get(prefsKey))[prefsKey]||{};}catch{}
function connectWhenReady(){if(!workBlocked()&&!state.busy&&!state.connected&&Number.isInteger(sourceId)&&sourceId>0&&/^https?:\/\//.test(origin))void connect();}
render();syncManagedLock();
await mountUpdater({
  isBusy:()=>state.busy||state.opening||updating||!!document.querySelector('dialog[open]:not(#update-dialog)'),
  prepare:async()=>{if(state.busy||state.opening)throw Error('請等目前病人處理完成再更新。');updating=true;syncManagedLock();await savePreferences();},
  finish:()=>{updating=false;syncManagedLock();}
}).catch(e=>{error('更新功能暫時無法載入：'+e.message);});
const management=await mountManagement({
  isBusy:()=>state.busy||state.opening||updating,
  saveDraft:async()=>{},setBlocked:setManagedBlocked,
  setLocked:value=>{managementLocked=value;syncManagedLock();},onReady:connectWhenReady
}).catch(e=>{setManagedBlocked(true);managementLocked=true;syncManagedLock();$('management-lock').hidden=false;$('management-lock-title').textContent='管理功能載入失敗';$('management-lock-reason').textContent=e.message;return{blocked:true};});
if(!management.blocked)connectWhenReady();
if(!Number.isInteger(sourceId)||sourceId<=0||!/^https?:\/\//.test(origin))error('請先開啟院內「查詢處理」頁面，再按瀏覽器工具列上的擴充元件。');
