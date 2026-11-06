import {PortalEngine} from './engine.js';
import {CAMPUS_ORDER,normalizeWards,clean,norm,todayKey,escapeHTML as esc} from './core.js';
import {DOSES,FIELDS,LABELS,Repository,STORE_KEY,patientData,patientKey,shortBed,patientErrors,validateEntry,batchRecords,duplicateRecords,editRecord,monthRecords,totals,filterPatients,importBackup,printMarkup,validDate,storageData,recordsForWard,wardKey,bedCompare,recordCompare} from './model.js';
import {workbook} from './excel.js';
import {mountUpdater} from './updater.js';
import {mountManagement} from './management.js';
let managedBlocked=false,managementLocked=false;
const syncInert=()=>{document.getElementById('app-shell').inert=managementLocked||updating;};

const $=id=>document.getElementById(id);
const uuid=()=>crypto.randomUUID();
let dateConfirmResolve=null,quickPatient=null,quickEntryId=null;
const displayDate=value=>value.replaceAll('-', '/');
const CHECKMARK='<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8 6.5 11 12.5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const repo=new Repository(globalThis.chrome?.storage?.local||{async get(){throw new Error('請以 Chrome 擴充元件開啟貼片回收紀錄。');}});
let draft,engine=null,sourceLink=null,wards=[],patients=[],ward='',campus='兒醫',mode='inbed',loadedAt=0,connected=false,busy=false,saving=false,tab='register',draftTimer=null,draftWrite=Promise.resolve(),draftPending=0,entrySubmitting=false,entryContext=null,validationShown=false,fatal=false,updating=false,confirmResolve=null;
const wardCache=new Map();
let groupSelection=new Set(),groupProgress='',groupSubmitting=false,recordWard='';
const wardCacheKey=(code,source='inbed')=>norm(code)+'|'+source;
let portalPharmacist={name:'',status:'pending'};
const emptyDraft=()=>({id:uuid(),date:todayKey(),pharmacist:portalPharmacist.name,pharmacistMode:'portal',entries:[]});
function showError(message){$('error-text').textContent=message;$('error').hidden=false;}
function clearError(){$('error').hidden=true;}
function notice(message){$('notice').textContent=message;$('notice').hidden=false;}
const run=fn=>async(...args)=>{try{await fn(...args);}catch(e){if(e.code==='PORTAL_WAIT'){$('connection-state').textContent=e.message;clearError();}else showError(e.message||String(e));}};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function ask(title,text,yes='確定'){return new Promise(resolve=>{confirmResolve=resolve;$('confirm-title').textContent=title;$('confirm-text').textContent=text;$('confirm-yes').textContent=yes;$('confirm-dialog').showModal();});}
function resolveConfirm(value){$('confirm-dialog').close();confirmResolve?.(value);confirmResolve=null;}
function queueDraft(){
  clearTimeout(draftTimer);$('draft-state').textContent='正在保留輸入內容…';
  draftTimer=setTimeout(()=>{draftTimer=null;writeDraft().catch(()=>{});},220);
}
function writeDraft(){
  const snapshot=structuredClone(draft);
  draftPending++;
  draftWrite=repo.mutate(s=>{s.draft=snapshot.entries.length?snapshot:null;});
  draftWrite.then(()=>{draftPending--;$('draft-state').textContent=draft.entries.length?'待儲存 · 輸入內容已保留':'尚未選擇病人';$('storage-status').textContent='資料已保存於本機';},e=>{draftPending--;$('draft-state').textContent='輸入內容尚未保留';$('storage-status').textContent='保存失敗';showError('無法保留輸入內容：'+e.message+'。請先不要關閉工具。');});
  return draftWrite;
}
async function flushDraft(){clearTimeout(draftTimer);draftTimer=null;await writeDraft();}
function setTab(next){tab=next;for(const name of ['register','records','settings'])$(name+'-panel').hidden=next!==name;for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute(b.closest('.header-utilities')?'aria-pressed':'aria-selected',String(b.dataset.tab===next));if(next==='register')renderDateWarning();if(next==='records'){recordWard=wardKey(ward)||recordWard;renderRecords();}}
function refreshControls(){
  $('connect').disabled=busy;$('source').disabled=!sourceLink;
  $('connection-state').textContent=busy?'Portal 查詢中…':connected?'已連接 Portal':'尚未連接 Portal';
  for(const id of ['refresh','inbed','cleared','read-page','lookup-account'])$(id).disabled=busy||!connected;
  $('edit-ward-group').disabled=busy||saving||fatal||!connected;
  $('refresh-group').disabled=busy||!connected;
  for(const b of document.querySelectorAll('[data-quick-ward]'))b.disabled=busy||saving||fatal||((!connected||!wards.some(w=>norm(w.code)===norm(b.dataset.quickWard)))&&!draft.entries.some(e=>wardKey(e.patient.ward)===wardKey(b.dataset.quickWard)));
  $('manual').disabled=saving||fatal;$('save-batch').disabled=saving||fatal||!draft?.entries.length;
  $('read-pharmacist').disabled=busy||saving||!connected;
  $('batch-pharmacist').disabled=saving||fatal;
  $('save-batch').textContent=saving?'正在儲存…':'儲存紀錄';
  for(const el of document.querySelectorAll('#quick-editor button,#quick-editor input'))el.disabled=busy||saving||fatal;
  $('quick-clear').disabled=busy||saving||fatal||!quickEntry();
}
function renderWards(){renderWardGroup();refreshControls();}
function renderWardGroup(){
  const configured=repo.state.prefs.wardGroup||[],group=[...new Set([...configured,...draft.entries.map(e=>wardKey(e.patient.ward))])];
  $('edit-ward-group').textContent=configured.length?'更改預設組合':'勾選設定';
  $('ward-shortcuts').innerHTML=group.map(code=>{const found=wards.some(w=>norm(w.code)===norm(code)),cache=wardCache.get(wardCacheKey(code)),pending=draft.entries.filter(e=>wardKey(e.patient.ward)===wardKey(code)).length;return `<button type="button" data-quick-ward="${esc(code)}" aria-pressed="${norm(ward)===norm(code)}" title="${found||pending?'切換至 '+esc(code):'目前 Portal 名單中找不到此病房'}"><strong>${esc(code)}</strong><span>${!configured.includes(code)&&pending?pending+' 位待儲存':cache?cache.rows.length+' 位':found?'待載入':'暫不可用'}</span></button>`;}).join('');
  $('refresh-group').hidden=!configured.length;
  const ready=configured.filter(code=>wardCache.has(wardCacheKey(code))).length;
  $('ward-group-status').textContent=groupProgress||(configured.length?`${configured.length} 個預設病房 · ${ready} 個已載入`:'設定後，每次開啟自動帶入。');
}
function renderGroupOptions(){
  const known=wards.map(w=>({...w})),missing=[...groupSelection].filter(code=>!known.some(w=>norm(w.code)===norm(code)));
  const groups=CAMPUS_ORDER.filter(c=>known.some(w=>w.campus===c));
  const checkbox=(code,unavailable=false)=>`<label class="ward-check${groupSelection.has(code)?' checked':''}"><input type="checkbox" data-group-ward="${esc(code)}"${groupSelection.has(code)?' checked':''}><span>${esc(code)}${unavailable?'<small>暫不可用</small>':''}</span></label>`;
  $('ward-group-options').innerHTML=groups.map(c=>`<fieldset><legend>${esc(c)}</legend><div class="ward-check-grid">${known.filter(w=>w.campus===c).map(w=>checkbox(w.code)).join('')}</div></fieldset>`).join('')+(missing.length?`<fieldset><legend>先前設定，目前 Portal 未提供</legend><div class="ward-check-grid">${missing.map(code=>checkbox(code,true)).join('')}</div></fieldset>`:'');
  $('ward-group-count').textContent=`已選 ${groupSelection.size} 個病房`;
}
function openWardGroup(){
  if(busy||!connected||fatal)return;groupSelection=new Set(repo.state.prefs.wardGroup||[]);renderGroupOptions();
  $('ward-group-error').hidden=true;$('ward-group-cancel').textContent=repo.state.prefs.wardGroupConfigured?'取消':'稍後設定';$('ward-group-dialog').showModal();
}
async function closeWardGroup(){
  if(groupSubmitting)return;$('ward-group-dialog').close();
  if(!loadedAt&&ward&&!busy&&repo.state.prefs.wardGroupConfigured)await loadWard(ward,'inbed');
}
async function saveWardGroup(event){
  event.preventDefault();if(groupSubmitting)return;
  if(!groupSelection.size){$('ward-group-error').textContent='請至少勾選一個病房；可自由選擇數量。';$('ward-group-error').hidden=false;return;}
  groupSubmitting=true;$('ward-group-save').disabled=true;
  try{
    const codes=wards.filter(w=>groupSelection.has(w.code)).map(w=>w.code);for(const code of groupSelection)if(!codes.includes(code))codes.push(code);
    await repo.mutate(s=>{s.prefs={...s.prefs,wardGroup:codes,wardGroupConfigured:true};});
    $('ward-group-dialog').close();renderWards();notice(`已保存 ${codes.length} 個預設病房，下次開啟會自動帶入。`);await loadWardGroup();
  }catch(e){if($('ward-group-dialog').open){$('ward-group-error').textContent=e.message;$('ward-group-error').hidden=false;}else showError(e.message);}
  finally{groupSubmitting=false;$('ward-group-save').disabled=false;}
}
function acceptWard(result,code,source='inbed'){
  quickPatient=null;quickEntryId=null;ward=code;mode=source;patients=[...result.rows].sort(bedCompare);loadedAt=result.checkedAt;campus=wards.find(w=>norm(w.code)===norm(code))?.campus||campus;
  $('partial').hidden=!result.pagination;$('patient-search').value='';
}
async function loadWardGroup(){
  if(busy||!connected)return;quickPatient=null;quickEntryId=null;
  const configured=repo.state.prefs.wardGroup||[],available=configured.map(code=>wards.find(w=>norm(w.code)===norm(code))?.code).filter(Boolean);
  if(!configured.length)return;clearError();busy=true;patients=[];loadedAt=0;mode='inbed';$('partial').hidden=true;
  const preferred=available.includes(ward)?ward:available[0],failures=[];
  for(const code of configured)wardCache.delete(wardCacheKey(code));
  renderPatients();
  try{
    for(let i=0;i<available.length;i++){
      const code=available[i];groupProgress=`正在載入 ${i+1}／${available.length}：${code}`;renderWardGroup();refreshControls();
      try{const result=await engine.loadWard(code,'inbed',false);if(result.superseded)throw new Error('查詢已被其他操作取代');wardCache.set(wardCacheKey(code),result);}
      catch(e){failures.push(code+'：'+e.message);}
    }
    for(const code of configured)if(!wards.some(w=>norm(w.code)===norm(code)))failures.push(code+'：目前 Portal 沒有這個病房');
    const chosen=[preferred,...available].find(code=>wardCache.has(wardCacheKey(code)));
    if(chosen){acceptWard(wardCache.get(wardCacheKey(chosen)),chosen);await repo.mutate(s=>{s.prefs={...s.prefs,ward:chosen,campus};});}
    if(failures.length)showError('以下病房未載入，可稍後按「更新這組」重試：\n'+failures.join('\n'));
  }finally{busy=false;groupProgress='';renderWards();renderPatients();}
}
function renderPatients(){
  $('inbed').setAttribute('aria-pressed',String(mode==='inbed'));$('cleared').setAttribute('aria-pressed',String(mode==='cleared'));
  parkQuick();
  if(!busy&&mode!=='account'){
    for(const entry of draft.entries)if(wardKey(entry.patient.ward)===wardKey(ward)&&!patients.some(p=>patientKey(p)===patientKey(entry.patient)))patients.push({...patientData(entry.patient),pendingSource:entry.source==='manual'?'手動補登':entry.source==='cleared'?'已清床 · 待儲存':'待儲存'});
    patients.sort(bedCompare);
  }
  const visible=filterPatients(patients,$('patient-search').value),selected=new Set(draft.entries.map(e=>patientKey(e.patient)));
  if(quickPatient&&!visible.some(p=>patientKey(p)===patientKey(quickPatient))){quickPatient=null;quickEntryId=null;}
  $('patient-count').textContent=patients.length?`${visible.length}／${patients.length} 位`:'';
  $('patient-list').innerHTML=busy?'<p class="empty-text">正在讀取病人名單…</p>':!visible.length?`<p class="empty-text">${!connected?'等待 Portal 登入；登入後會自動連接。':!(repo.state.prefs.wardGroup||[]).length?'請先按「勾選設定」選擇預設病房。':!ward?'請選擇病房。':patients.length?'找不到符合的病人。':'目前沒有可選擇的病人，可切換名單或使用帳號查詢。'}</p>`:visible.map(p=>`<article class="patient-tile"><button type="button" class="patient-choice" data-patient="${esc(p.account)}" aria-expanded="false" aria-controls="quick-editor" aria-pressed="${selected.has(patientKey(p))}"><span class="checkmark" aria-hidden="true">${CHECKMARK}</span><span class="bed">${esc(shortBed(p))}</span><span class="person"><span>${esc(p.name)}</span><small>${esc(p.account)}</small>${p.pendingSource?`<small>${esc(p.pendingSource)}</small>`:''}${mode==='cleared'&&!p.pendingSource?`<small class="discharge">出院 ${esc(p.discharge||'未顯示')}</small>`:''}</span></button></article>`).join('');
  $('freshness').textContent=busy?'正在讀取 Portal 病人名單…':loadedAt?`${mode==='current'?'原系統目前頁 · ':mode==='account'?'帳號查詢結果 · ':mode==='selected'?'已選病人 · ':''}${ward||''} · ${new Date(loadedAt).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})} 更新`:'';
  syncQuick();refreshControls();
}
function renderDraft(){
  $('batch-date').value=draft.date;$('batch-pharmacist').value=draft.pharmacist;renderPharmacist();
  renderDraftTotal();renderDateWarning();renderWardGroup();syncQuick();refreshControls();
}
function renderDraftTotal(){let total=0;for(const e of draft.entries)for(const d of DOSES)if(/^\d+$/.test(String(e.quantities[d]??'')))total+=Number(e.quantities[d]);$('save-total').textContent=draft.entries.length?`${draft.entries.length} 位病人，共 ${total} 片`:'尚未加入病人';}
function selectedMonthRecords(){return monthRecords(recordsForWard(repo.state.records,recordWard),$('record-month').value||todayKey().slice(0,7));}
function renderRecords(){
  const month=$('record-month').value||todayKey().slice(0,7);
  const options=[...new Set([...(repo.state.prefs.wardGroup||[]).map(wardKey),...repo.state.records.map(r=>wardKey(r.patient.ward))])];
  if(!options.includes(recordWard))recordWard=options.includes(wardKey(ward))?wardKey(ward):options[0]||'';
  $('record-ward-tabs').innerHTML=options.length?options.map(code=>`<button type="button" data-record-ward="${esc(code)}" aria-pressed="${recordWard===code}"><strong>${esc(code)}</strong><span>${monthRecords(recordsForWard(repo.state.records,code),month).length} 筆</span></button>`).join(''):'<span class="muted small">設定預設病房或新增紀錄後，會在這裡依病房顯示。</span>';
  const records=selectedMonthRecords(),sum=totals(records);
  $('month-summary').innerHTML=`<div class="summary-card"><span>${esc(recordWard||'所選病房')} 本月回收紀錄</span><strong>${records.length}<small>筆</small></strong></div>`+DOSES.map(d=>`<div class="summary-card"><span>${d} 回收數量</span><strong>${sum[d]}<small>片</small></strong></div>`).join('');
  const q=norm($('record-search').value),showDeleted=$('show-deleted').checked;
  const rows=recordsForWard(repo.state.records,recordWard).filter(r=>r.date.startsWith(month+'-')&&(!r.deletedAt||showDeleted)&&(!q||norm([...Object.values(r.patient),`${r.patient.room}-${r.patient.bed}`,r.pharmacist,r.date].join(' ')).includes(q))).sort(recordCompare);
  $('record-rows').innerHTML=rows.map(r=>`<tr${r.deletedAt?' class="deleted"':''}><td>${esc(r.date)}</td><td>${esc(r.patient.ward)} ${esc(shortBed(r.patient))}</td><td>${esc(r.patient.name)}</td><td>${esc(r.patient.account)}</td><td>${esc(r.patient.department)}</td>${DOSES.map(d=>`<td>${r.quantities[d]||''}</td>`).join('')}<td>${esc(r.pharmacist)}</td><td>${r.deletedAt?`<button type="button" data-restore="${esc(r.id)}">復原</button>`:`<button type="button" data-edit="${esc(r.id)}">修改</button><button type="button" data-delete="${esc(r.id)}">作廢</button>`}${r.history.length?`<button type="button" data-history="${esc(r.id)}">歷程</button>`:''}</td></tr>`).join('');
  $('records-empty').hidden=!!rows.length;$('preview').disabled=!records.length;$('export-excel').disabled=!records.length;
}
function renderPharmacist(){
  const manual=draft.pharmacistMode==='manual',different=clean(draft.pharmacist)!==portalPharmacist.name;
  $('pharmacist-status').textContent=portalPharmacist.name?'Portal：'+portalPharmacist.name+(different?' · '+(manual?'已手動修改':'保留已填姓名'):' · 可直接修改'):portalPharmacist.status==='pending'?'連接 Portal 後自動帶入':(portalPharmacist.status==='ambiguous'?'無法確認登入姓名':'未讀取到登入姓名')+'，請手動填寫';
}
async function readPharmacist(replace=false){
  if(!engine)return;
  const before={id:draft.id,name:draft.pharmacist,mode:draft.pharmacistMode};
  try{portalPharmacist=await engine.readPharmacist();}catch{portalPharmacist={name:'',status:'missing'};}
  // Preserve a restored or edited batch. Explicit reread can replace its name.
  const unchanged=draft.id===before.id&&draft.pharmacist===before.name&&draft.pharmacistMode===before.mode;
  if(unchanged&&(replace&&portalPharmacist.name||!draft.entries.length&&draft.pharmacistMode!=='manual'||!clean(draft.pharmacist)&&draft.pharmacistMode!=='manual')){
    draft.pharmacist=portalPharmacist.name;draft.pharmacistMode='portal';
  }
  $('batch-pharmacist').value=draft.pharmacist;renderPharmacist();queueDraft();
}
const portal=globalThis.PharmacyPortal?new PharmacyPortal.Connection({label:'貼片回收紀錄',onSource:link=>{sourceLink=link;},onStatus:text=>{$('connection-state').textContent=text;}}):null;
async function connect(link){
  if(busy)return;quickPatient=null;quickEntryId=null;clearError();busy=true;patients=[];renderPatients();
  try{
    if(link)sourceLink=link;
    else sourceLink=(await chrome.storage.session.get('patchSource')).patchSource||sourceLink;
    if(!sourceLink&&!portal){const list=await chrome.tabs.query({});const matches=list.filter(t=>/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw\//.test(t.url||''));if(matches.length===1)sourceLink={sourceId:matches[0].id,origin:new URL(matches[0].url).origin};}
    if(!sourceLink&&!portal)throw new Error('等待 Portal 登入；登入後會自動連接。');
    engine=new PortalEngine({...sourceLink,status:message=>{$('freshness').textContent=message;}});if(portal){portal.sourceId=sourceLink?.sourceId||portal.sourceId;engine.portal=portal;}
    const result=await engine.connect();await readPharmacist();wards=normalizeWards(result.control.options);connected=true;wardCache.clear();loadedAt=0;
    const preferred=[ward,repo.state.prefs.ward,result.control.selectedWard].find(w=>wards.some(x=>x.code===w));ward=preferred||wards[0]?.code||'';campus=wards.find(w=>w.code===ward)?.campus||campus;renderWards();
  }catch(e){connected=false;engine=null;throw e;}finally{busy=false;refreshControls();renderPatients();}
  if(repo.state.prefs.wardGroupConfigured&&(repo.state.prefs.wardGroup||[]).length)await loadWardGroup();
  else if(!repo.state.prefs.wardGroupConfigured)openWardGroup();
  else if(ward)await loadWard(ward,'inbed');
}
async function loadWard(code,source='inbed',force=false){
  if(busy||!code)return;quickPatient=null;quickEntryId=null;clearError();busy=true;ward=code;mode=source;patients=[];loadedAt=0;$('patient-search').value='';$('partial').hidden=true;renderPatients();
  try{
    if(force)wardCache.delete(wardCacheKey(code,source));
    const result=wardCache.get(wardCacheKey(code,source))||(connected&&engine&&wards.some(w=>norm(w.code)===norm(code))?await engine.loadWard(code,source,false):{rows:[],checkedAt:Date.now(),pagination:false});
    if(result.superseded)return;wardCache.set(wardCacheKey(code,source),result);acceptWard(result,code,source);
    await repo.mutate(s=>{s.prefs={...s.prefs,ward:code,campus};});
  }finally{busy=false;renderWards();renderPatients();}
}
async function readPage(){if(busy||!engine)return;quickPatient=null;quickEntryId=null;clearError();busy=true;patients=[];renderPatients();try{await engine.connect();const r=await engine.call('list');if(r.loading||!r.ready)throw new Error('原系統名單尚未完成載入');patients=r.rows;ward=r.control?.selectedWard||'';campus=wards.find(w=>w.code===ward)?.campus||campus;mode='current';loadedAt=Date.now();$('partial').hidden=!r.pagination;$('patient-search').value='';}finally{busy=false;renderWards();renderPatients();}}
async function lookupAccount(){
  if(busy)return;const account=prompt('輸入完整住院帳號（例如 26T12345678，可跨病房查詢）');if(account===null)return;
  const value=clean(account).toUpperCase();if(!/^\d{2}[A-Z]\d{8}$/.test(value))throw new Error('請輸入完整的住院帳號');
  clearError();quickPatient=null;quickEntryId=null;busy=true;patients=[];renderPatients();try{const r=await engine.queryPerson('account',value);patients=r.rows;if(patients.length)ward=patients[0].ward;renderWards();mode='account';loadedAt=Date.now();$('patient-search').value='';$('partial').hidden=!r.pagination;}finally{busy=false;renderPatients();}
}
async function togglePatient(account){
  if(busy||saving||fatal)return;
  const patient=patients.find(p=>p.account===account);if(!patient)return;
  if(quickPatient&&patientKey(quickPatient)===patientKey(patient)&&!$('quick-editor').hidden){closeQuick();return;}
  quickPatient=patientData(patient);
  quickEntryId=draft.entries.find(e=>patientKey(e.patient)===patientKey(patient))?.id||null;
  const button=document.querySelector(`[data-patient="${CSS.escape(account)}"]`),before=button?.getBoundingClientRect().top;
  syncQuick();
  // Keep the chosen card in place as the previous editor closes above it.
  if(button&&Number.isFinite(before))window.scrollBy(0,button.getBoundingClientRect().top-before);
  revealQuick();
}
async function saveBatch(){
  if(saving||fatal)return;clearError();validationShown=true;
  if(!validDate($('batch-date').value))throw new Error('請填寫有效的回收日期');
  let proposed;try{proposed=batchRecords({...draft,entries:[...draft.entries].sort((a,b)=>bedCompare(a.patient,b.patient))});}catch(e){renderDraft();throw e;}
  // Lock the batch before awaiting confirmations so repeated clicks cannot submit twice.
  saving=true;$('register-panel').classList.add('locking');$('register-panel').inert=true;refreshControls();
  try{
    const duplicates=duplicateRecords(repo.state.records,proposed);
    if(duplicates.length&&!await ask('這些病人同日已有紀錄',duplicates.map(r=>`${r.date}　${r.patient.ward} ${shortBed(r.patient)} ${r.patient.name}`).join('\n')+'\n\n若這是另一次收到的貼片，可以繼續新增。','仍要新增'))return;
    // Recheck after any earlier dialog, including if the tool has stayed open past midnight.
    let approvedDay='';
    while(approvedDay!==todayKey()){
      const today=todayKey();renderDateWarning();
      if(proposed.some(row=>row.date!==today)){
        const answer=await confirmBatchDate(proposed,today);
        if(answer==='today'){applyToday();await flushDraft();return;}
        if(answer!=='keep')return;
      }
      approvedDay=today;
    }
    clearTimeout(draftTimer);draftTimer=null;await draftWrite.catch(()=>{});
    // Storage waits can also cross midnight; return to review without writing then.
    if(approvedDay!==todayKey()){renderDateWarning();notice('日期已跨日，請重新確認回收日期後再儲存。');return;}
    await repo.mutate(s=>{if(proposed.some(p=>s.records.some(r=>r.id===p.id)))throw new Error('這批紀錄已存在，未重複儲存。');s.records.push(...proposed);s.draft=null;});
    quickPatient=null;quickEntryId=null;const previous=draft;draft={id:uuid(),date:previous.date,pharmacist:previous.pharmacist,pharmacistMode:previous.pharmacistMode,entries:[]};validationShown=false;
    $('record-month').value=proposed[0].date.slice(0,7);patients=patients.filter(p=>!p.pendingSource);renderDraft();renderPatients();$('draft-state').textContent='這批已儲存';notice(`已儲存 ${proposed.length} 位病人的回收紀錄，共 ${Object.values(totals(proposed)).reduce((a,b)=>a+b,0)} 片。`);
  }finally{saving=false;$('register-panel').inert=false;$('register-panel').classList.remove('locking');refreshControls();}
}
function openEntry(kind,id){
  if(kind!=='record'&&kind!=='manual')return;
  entryContext={kind,id};const entry=kind==='record'?repo.state.records.find(r=>r.id===id):null;
  if(kind!=='manual'&&!entry)return;
  const p=entry?.patient||{ward};$('entry-title').textContent=kind==='record'?'修改回收紀錄':'手動補登病人';
  $('patient-fields').innerHTML=FIELDS.map(k=>`<label>${LABELS[k]}<input name="${k}" value="${esc(p[k]||'')}" maxlength="100" required autocomplete="off"></label>`).join('');
  $('entry-date').value=entry?.date||draft.date;$('entry-pharmacist').value=entry?.pharmacist||draft.pharmacist;$('entry-pharmacist').required=kind==='record';
  $('entry-quantities').innerHTML=DOSES.map(d=>`<label>${d}（片）<input name="qty-${d}" value="${esc(entry?.quantities[d]||'')}" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"></label>`).join('');
  $('entry-error').hidden=true;$('entry-dialog').showModal();
}
async function submitEntry(event){
  event.preventDefault();const context=entryContext;if(!context||entrySubmitting)return;
  const data=new FormData($('entry-form')),patient=Object.fromEntries(FIELDS.map(k=>[k,clean(data.get(k))]));patient.account=patient.account.toUpperCase();
  const quantities=Object.fromEntries(DOSES.map(d=>[d,clean(data.get('qty-'+d))]));
  const date=$('entry-date').value,pharmacist=clean($('entry-pharmacist').value),issues=patientErrors(patient);
  if(!validDate(date))issues.push('請填有效日期');
  entrySubmitting=true;
  try{
    if(issues.length)throw new Error(issues.join('、'));
    if(context.kind==='record'){
      await repo.mutate(s=>{const i=s.records.findIndex(r=>r.id===context.id);if(i<0||s.records[i].deletedAt)throw new Error('紀錄已變更，請重新查看');s.records[i]=editRecord(s.records[i],{patient,quantities,date,pharmacist});});
      renderRecords();notice('已保存修改，原資料保留於修改歷程。');
    }else{
      if(draft.entries.some(e=>patientKey(e.patient)===patientKey(patient)))throw new Error('這位病人已選取，請回到病人卡片填寫片數');
      const entry={id:uuid(),patient,quantities,date:date===draft.date?'':date,pharmacist:pharmacist===draft.pharmacist?'':pharmacist,source:'manual'};
      draft.entries.push(entry);
      validationShown=false;const local=wardCache.get(wardCacheKey(patient.ward))||{rows:[],checkedAt:Date.now(),pagination:false};acceptWard(local,patient.ward,'inbed');renderDraft();renderPatients();await flushDraft();
    }
    $('entry-dialog').close();entryContext=null;if(context.kind==='manual')await togglePatient(patient.account);
  }catch(e){$('entry-error').textContent=e.message;$('entry-error').hidden=false;}finally{entrySubmitting=false;}
}
async function markRecord(id,deleted){
  const r=repo.state.records.find(r=>r.id===id);if(!r)return;
  if(!await ask(deleted?'作廢這筆回收紀錄？':'復原這筆紀錄？',`${r.date}　${r.patient.ward} ${shortBed(r.patient)} ${r.patient.name}\n${deleted?'作廢後不納入列印及合計，仍可在紀錄中復原。':'復原後會重新納入列印與合計。'}`,deleted?'作廢':'復原'))return;
  await repo.mutate(s=>{const row=s.records.find(x=>x.id===id),now=new Date().toISOString();row.deletedAt=deleted?now:null;row.updatedAt=now;row.history.push({at:now,action:deleted?'delete':'restore'});});renderRecords();notice(deleted?'已作廢這筆紀錄，可勾選「顯示已作廢」復原。':'已復原這筆紀錄。');
}
function history(id){const r=repo.state.records.find(r=>r.id===id);if(!r)return;$('history-content').innerHTML=`<p>${esc(r.patient.name)} · ${esc(r.patient.account)}</p><div class="history-item">建立時間：${esc(new Date(r.createdAt).toLocaleString('zh-TW'))}</div>`+r.history.map(h=>`<div class="history-item"><strong>${esc(new Date(h.at).toLocaleString('zh-TW'))}　${({edit:'修改',delete:'作廢',restore:'復原'})[h.action]||'變更'}</strong>${h.before?`<p>修改前：${esc(h.before.date)}　${esc(h.before.patient?.name)}　${esc(h.before.patient?.account)}<br>${esc(h.before.patient?.ward)} ${esc(shortBed(h.before.patient||{}))}　${esc(h.before.patient?.department)}<br>${DOSES.map(d=>`${d}：${esc(h.before.quantities?.[d]||0)} 片`).join('　')}<br>回收藥師：${esc(h.before.pharmacist)}</p>`:''}</div>`).join('');$('history-dialog').showModal();}
async function exportBackup(){await flushDraft();download(new Blob([JSON.stringify({format:'ntuh-patch-recovery',exportedAt:new Date().toISOString(),data:storageData(repo.state)},null,2)],{type:'application/json'}),`貼片回收_完整備份_${todayKey()}.json`);notice('已匯出完整備份。');}
async function restoreBackup(file){
  if(!file)return;if(file.size>50*1024*1024)throw new Error('備份檔超過 50 MB，未匯入');
  const input=JSON.parse(await file.text());await flushDraft();const preview=importBackup(repo.state,input);
  if(!await ask('匯入備份',`新增 ${preview.added} 筆，略過 ${preview.skipped} 筆相同紀錄。\n現有紀錄與待儲存內容會保留。`,'合併匯入'))return;
  await repo.mutate(s=>{const result=importBackup(s,input);Object.assign(s,result.next);});draft=repo.state.draft?structuredClone(repo.state.draft):emptyDraft();renderDraft();renderWards();renderPatients();renderRecords();notice(`已匯入 ${preview.added} 筆紀錄。`);
}
async function previewPrint(){
  const month=$('record-month').value,records=selectedMonthRecords();if(!records.length)return;
  $('app-shell').hidden=true;$('print-view').hidden=false;$('print-now').disabled=true;
  try{
    $('print-pages').innerHTML=printMarkup(records,month,recordWard);await document.fonts.ready;
    // Measure wrapped text at actual A4 content width, keeping every row and
    // stamp cell together. Long departments/names reduce rows per page.
    for(let size=24;size>=1;size--){
      if(size!==24)$('print-pages').innerHTML=printMarkup(records,month,recordWard,size);
      if([...document.querySelectorAll('.paper')].every(p=>p.querySelector('.paper-footer').getBoundingClientRect().bottom-p.getBoundingClientRect().top-parseFloat(getComputedStyle(p).paddingTop)<274*96/25.4))break;
    }
    window.scrollTo(0,0);
  }finally{$('print-now').disabled=false;}
}
function bind(){
  for(const type of ['click','input','change','keydown','submit'])document.addEventListener(type,event=>{if(managedBlocked&&event.target.closest?.('#app-shell')&&!event.target.closest('#open-update,#open-management')){event.preventDefault();event.stopImmediatePropagation();}},true);
  document.addEventListener('click',run(async event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.tab){setTab(b.dataset.tab);return;}
    if(b.dataset.recordWard){recordWard=b.dataset.recordWard;renderRecords();return;}
    if(b.dataset.quickWard)return loadWard(b.dataset.quickWard,'inbed');
    if(b.dataset.patient)return togglePatient(b.dataset.patient);
    if(b.dataset.edit){openEntry('record',b.dataset.edit);return;}
    if(b.dataset.delete)return markRecord(b.dataset.delete,true);
    if(b.dataset.restore)return markRecord(b.dataset.restore,false);
    if(b.dataset.history){history(b.dataset.history);return;}
  }));
  bindQuick();
  $('other-tools').addEventListener('click',event=>{if(event.target.closest('button'))$('other-tools').open=false;});
  document.addEventListener('click',event=>{if(!event.target.closest('#other-tools'))$('other-tools').open=false;});
  $('date-confirm-cancel').addEventListener('click',()=>resolveBatchDate(false));
  $('date-confirm-today').addEventListener('click',()=>resolveBatchDate('today'));
  $('date-confirm-keep').addEventListener('click',()=>resolveBatchDate('keep'));
  $('date-confirm-dialog').addEventListener('cancel',event=>{event.preventDefault();resolveBatchDate(false);});
  window.addEventListener('focus',renderDateWarning);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')renderDateWarning();});
  setInterval(renderDateWarning,30000);
  $('patient-search').addEventListener('input',renderPatients);
  $('patient-search').addEventListener('keydown',run(async event=>{if(event.key!=='Enter')return;event.preventDefault();const results=filterPatients(patients,event.target.value);if(results.length===1)await togglePatient(results[0].account);}));
  $('inbed').addEventListener('click',run(()=>loadWard(ward,'inbed')));$('cleared').addEventListener('click',run(()=>loadWard(ward,'cleared')));
  $('refresh').addEventListener('click',run(()=>loadWard(ward,mode==='cleared'?'cleared':'inbed',true)));
  $('edit-ward-group').addEventListener('click',openWardGroup);$('refresh-group').addEventListener('click',run(loadWardGroup));
  $('ward-group-options').addEventListener('change',event=>{const input=event.target;if(!input.dataset.groupWard)return;if(input.checked)groupSelection.add(input.dataset.groupWard);else groupSelection.delete(input.dataset.groupWard);input.closest('label').classList.toggle('checked',input.checked);$('ward-group-count').textContent=`已選 ${groupSelection.size} 個病房`;});
  $('ward-group-clear').addEventListener('click',()=>{groupSelection.clear();renderGroupOptions();});
  $('ward-group-form').addEventListener('submit',saveWardGroup);
  for(const id of ['ward-group-close','ward-group-cancel'])$(id).addEventListener('click',run(closeWardGroup));
  $('ward-group-dialog').addEventListener('cancel',event=>{event.preventDefault();run(closeWardGroup)();});
  $('read-page').addEventListener('click',run(readPage));$('lookup-account').addEventListener('click',run(lookupAccount));
  $('connect').addEventListener('click',run(async()=>{await portal?.preferActive();if(portal?.sourceId)sourceLink={sourceId:portal.sourceId};await connect(sourceLink);}));$('source').addEventListener('click',run(()=>engine?.focusSource()));
  $('batch-date').addEventListener('change',()=>{if(!validDate($('batch-date').value))return;draft.date=$('batch-date').value;$('notice').hidden=true;renderDraft();queueDraft();});
  $('batch-pharmacist').addEventListener('input',()=>{draft.pharmacist=$('batch-pharmacist').value;draft.pharmacistMode='manual';renderPharmacist();queueDraft();});
  $('read-pharmacist').addEventListener('click',run(async()=>{if(busy||saving)return;busy=true;refreshControls();try{await readPharmacist(true);}finally{busy=false;refreshControls();}}));
  $('save-batch').addEventListener('click',run(saveBatch));
  $('manual').addEventListener('click',()=>openEntry('manual'));$('entry-form').addEventListener('submit',submitEntry);
  for(const id of ['entry-close','entry-cancel'])$(id).addEventListener('click',()=>{$('entry-dialog').close();entryContext=null;});
  $('confirm-yes').addEventListener('click',()=>resolveConfirm(true));$('confirm-no').addEventListener('click',()=>resolveConfirm(false));$('confirm-dialog').addEventListener('cancel',event=>{event.preventDefault();resolveConfirm(false);});
  $('history-close').addEventListener('click',()=>$('history-dialog').close());
  for(const id of ['record-month','record-search','show-deleted'])$(id).addEventListener(id==='record-search'?'input':'change',renderRecords);
  $('backup').addEventListener('click',run(exportBackup));$('import').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',run(async()=>{try{await restoreBackup($('import-file').files[0]);}finally{$('import-file').value='';}}));
  $('preview').addEventListener('click',previewPrint);$('print-now').addEventListener('click',()=>window.print());$('print-back').addEventListener('click',()=>{$('print-view').hidden=true;$('app-shell').hidden=false;});
  $('export-excel').addEventListener('click',()=>{const month=$('record-month').value;download(workbook(selectedMonthRecords(),month,recordWard),`貼片回收紀錄_${recordWard}_${month}.xlsx`);});
  $('dismiss-error').addEventListener('click',clearError);
  $('diagnostic').addEventListener('click',run(async()=>{if(!engine)throw new Error('請先連接 Portal');download(new Blob([JSON.stringify({tool:'貼片回收紀錄',version:chrome.runtime.getManifest().version,...(await engine.diagnostics())},null,2)],{type:'application/json'}),'貼片回收_相容性資訊.json');}));
  if(globalThis.chrome?.runtime?.onMessage)chrome.runtime.onMessage.addListener(message=>{if(message?.kind==='patch-source'&&!busy&&!updating&&!managedBlocked)run(()=>connect({sourceId:message.sourceId,origin:message.origin}))();});
  window.addEventListener('beforeunload',event=>{if(draftTimer||draftPending||saving){event.preventDefault();event.returnValue='';}});
}
async function start(){
  const month=todayKey().slice(0,7);$('record-month').value=month;
  try{await repo.load();draft=repo.state.draft?structuredClone(repo.state.draft):emptyDraft();ward=repo.state.prefs.ward;campus=repo.state.prefs.campus||'兒醫';$('storage-status').textContent='資料已保存於本機';if(draft.entries.length)notice(`已恢復 ${draft.entries.length} 位病人的待儲存內容。`);}
  catch(e){fatal=true;draft=emptyDraft();showError(e.message+'。未覆寫既有資料。');$('storage-status').textContent='資料載入失敗';}
  bind();renderWards();renderDraft();renderPatients();
  if(fatal){for(const id of ['backup','import'])$(id).disabled=true;return;}
  await mountUpdater({
    isBusy:()=>busy||saving||entrySubmitting||groupSubmitting||fatal||updating||[...document.querySelectorAll('dialog[open]')].some(el=>el.id!=='update-dialog'),
    prepare:async()=>{
      updating=true;syncInert();
      try{await flushDraft();await repo.tail;}catch(e){updating=false;syncInert();throw e;}
    },
    finish:()=>{updating=false;syncInert();}
  }).catch(e=>{$('open-update').disabled=true;showError('更新功能暫時無法載入：'+e.message+'。請完成安裝設定後再開始使用。');});
  const management=await mountManagement({
    isBusy:()=>busy||saving||entrySubmitting||groupSubmitting||updating||[...document.querySelectorAll('dialog[open]')].some(el=>!['update-dialog','management-dialog'].includes(el.id)),
    saveDraft:async()=>{await flushDraft();await repo.tail;},
    setBlocked:value=>{managedBlocked=value;},setLocked:value=>{managementLocked=value;syncInert();},
    onReady:()=>{if(!connected&&!busy&&!updating&&!managedBlocked)void run(()=>connect())();},exportBackup
  }).catch(e=>{managedBlocked=true;managementLocked=true;syncInert();$('management-lock').hidden=false;$('management-lock-title').textContent='管理功能載入失敗';$('management-lock-reason').textContent=e.message;return{blocked:true};});
  if(!management.blocked)await run(()=>connect())();
}
function dateCheck(today=todayKey()){
  const counts=new Map();
  for(const entry of draft.entries){const date=entry.date||draft.date;if(validDate(date)&&date!==today)counts.set(date,(counts.get(date)||0)+1);}
  return {today,counts,batchMismatch:validDate(draft.date)&&draft.date!==today,nonTodayCount:[...counts.values()].reduce((a,b)=>a+b,0)};
}

function renderDateWarning(){
  if(!draft)return;
  const check=dateCheck(),hint=$('date-hint');
  hint.hidden=!check.batchMismatch&&!check.nonTodayCount;
  const dates=[...(check.batchMismatch?[draft.date]:[]),...check.counts.keys()];
  const text=dates.some(date=>date>check.today)?'非今日日期':check.batchMismatch?'補登日期':`含 ${check.nonTodayCount} 位補登`;
  if(hint.textContent!==text)hint.textContent=text;
  hint.title=`今天是 ${displayDate(check.today)}`;
}

function applyToday(){
  draft.date=todayKey();for(const entry of draft.entries)entry.date='';
  renderDraft();queueDraft();notice('回收日期已改為今天，片數與藥師保留。請確認後再按「儲存紀錄」。');
}

function confirmBatchDate(proposed,today){
  const dates=new Map();for(const row of proposed)dates.set(row.date,(dates.get(row.date)||0)+1);
  $('date-confirm-text').textContent=`今天是 ${displayDate(today)}。\n`+(proposed.some(row=>row.date>today)?'這批含有未來日期：\n':'這批有非今日的回收日期：\n')+[...dates].sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>`${displayDate(date)}　${count} 位${date===today?'（今天）':'（非今日）'}`).join('\n')+'\n\n是否依這些日期儲存？';
  return new Promise(resolve=>{dateConfirmResolve=resolve;$('date-confirm-dialog').showModal();});
}

function resolveBatchDate(value){$('date-confirm-dialog').close();dateConfirmResolve?.(value);dateConfirmResolve=null;}

function quickEntry(){
  return draft.entries.find(e=>e.id===quickEntryId)||draft.entries.find(e=>quickPatient&&patientKey(e.patient)===patientKey(quickPatient));
}

function parkQuick(){const editor=$('quick-editor');if(editor&&editor.parentElement!==$('quick-parking'))$('quick-parking').append(editor);}

function closeQuick(){
  const button=quickPatient?document.querySelector(`[data-patient="${CSS.escape(quickPatient.account)}"]`):null;
  quickPatient=null;quickEntryId=null;syncQuick();button?.focus({preventScroll:true});
}

function revealQuick(){
  const editor=$('quick-editor');if(editor.hidden)return;
  const tile=editor.closest('.patient-tile').getBoundingClientRect(),panel=editor.getBoundingClientRect(),bottom=Math.min(innerHeight,$('save-strip').getBoundingClientRect().top)-12;
  // Reveal the controls with the smallest document scroll needed.
  if(tile.height>bottom-12){if(tile.top<12||panel.bottom>bottom)window.scrollBy(0,tile.top-12);}
  else if(panel.bottom>bottom)window.scrollBy(0,panel.bottom-bottom);
  else if(tile.top<12)window.scrollBy(0,tile.top-12);
}

async function clearQuick(){
  if(busy||saving||fatal)return;
  const entry=quickEntry();if(!entry)return;
  if(!await ask('清除這位病人的片數？',`${entry.patient.ward} ${shortBed(entry.patient)} ${entry.patient.name}\n只清除這位病人本次待儲存的片數。`,'清除'))return;
  draft.entries=draft.entries.filter(e=>e.id!==entry.id);quickEntryId=null;validationShown=false;
  renderDraft();queueDraft();
}

function syncQuick(){
  if(!draft)return;
  const entry=quickEntry();
  $('quick-clear').disabled=busy||saving||fatal||!entry;
  if(entry){quickPatient=patientData(entry.patient);quickEntryId=entry.id;}
  else quickEntryId=null;
  const target=quickPatient?document.querySelector(`[data-patient="${CSS.escape(quickPatient.account)}"]`):null,editor=$('quick-editor');
  if(target){if(editor.parentElement!==target.parentElement)target.parentElement.append(editor);editor.hidden=false;}
  else{parkQuick();editor.hidden=true;}
  $('quick-empty').hidden=true;$('quick-form').hidden=!quickPatient;
  if(quickPatient)editor.setAttribute('aria-label',quickPatient.ward+' '+shortBed(quickPatient)+' '+quickPatient.name+' 回收片數');
  if(quickPatient){
    $('quick-bed').textContent=quickPatient.ward+' '+shortBed(quickPatient);
    $('quick-name').textContent=quickPatient.name;
    $('quick-account').textContent=quickPatient.account+' · '+quickPatient.department;
    for(const dose of DOSES){
      const value=String(entry?.quantities[dose]??'');
      const input=document.querySelector(`[data-quick-input="${dose}"]`);
      if(document.activeElement!==input)input.value=/^\d+$/.test(value)&&Number(value)<=3?'':value;
      input.classList.toggle('has-custom',/^\d+$/.test(value)&&Number(value)>3);
      for(const b of document.querySelectorAll(`[data-quick-dose="${dose}"]`))b.setAttribute('aria-pressed',String(Number(value)===Number(b.dataset.quickValue)&&/^\d*$/.test(value)));
      input.setAttribute('aria-invalid',String(!/^\d{0,4}$/.test(value)));
    }
    $('quick-state').textContent=entry?'待儲存 · 可直接選下一位':'選片數後加入待儲存名單';
  }
  for(const b of document.querySelectorAll('[data-patient]')){
    const item=draft.entries.find(e=>patientKey(e.patient)===norm(b.dataset.patient));
    b.setAttribute('aria-pressed',String(!!quickPatient&&patientKey(quickPatient)===norm(b.dataset.patient)));
    b.classList.toggle('has-count',!!item);
    const active=!!quickPatient&&patientKey(quickPatient)===norm(b.dataset.patient);
    b.setAttribute('aria-expanded',String(active));b.closest('.patient-tile').classList.toggle('editing',active);
    let summary=b.querySelector('.patient-quantity-summary');
    if(!summary){summary=document.createElement('small');summary.className='patient-quantity-summary';b.querySelector('.person').append(summary);}
    let meta=b.querySelector('.patient-entry-meta');if(!meta){meta=document.createElement('small');meta.className='patient-entry-meta';b.querySelector('.person').append(meta);}
    meta.textContent=item?[item.date&&item.date!==draft.date?'回收 '+displayDate(item.date):'',item.pharmacist?'藥師 '+item.pharmacist:''].filter(Boolean).join(' · '):'';meta.hidden=!meta.textContent;
    summary.textContent=item?DOSES.filter(d=>item.quantities[d]!==''&&item.quantities[d]!=null&&item.quantities[d]!=='0').map(d=>d+' × '+item.quantities[d]).join(' · '):'';
  }
}

function setQuickQuantity(dose,value){
  if(!quickPatient||busy||saving||fatal||!DOSES.includes(dose))return;
  $('notice').hidden=true;
  let entry=quickEntry();
  // Keep invalid input visible so normal batch validation can explain it.
  if(!entry&&value!==''&&value!=='0'){
    entry={id:uuid(),patient:patientData(quickPatient),quantities:{},source:mode,date:'',pharmacist:''};
    draft.entries.push(entry);quickEntryId=entry.id;
  }
  if(entry){
    entry.quantities[dose]=value==='0'?'':value;
    if(DOSES.every(d=>entry.quantities[d]==null||entry.quantities[d]===''||/^0+$/.test(String(entry.quantities[d])))){
      draft.entries=draft.entries.filter(e=>e.id!==entry.id);quickEntryId=null;
    }
  }
  validationShown=false;renderDraft();queueDraft();
}

function bindQuick(){
  $('quick-editor').addEventListener('click',event=>{
    const button=event.target.closest('[data-quick-dose]');
    if(button)setQuickQuantity(button.dataset.quickDose,button.dataset.quickValue);
  });
  $('quick-editor').addEventListener('input',event=>{
    if(event.target.dataset.quickInput)setQuickQuantity(event.target.dataset.quickInput,event.target.value);
  });
  $('quick-editor').addEventListener('focusout',event=>{if(event.target.dataset.quickInput)queueMicrotask(syncQuick);});
  $('quick-close').addEventListener('click',closeQuick);
  $('quick-clear').addEventListener('click',run(clearQuick));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&quickPatient&&event.target.closest?.('#quick-editor,[data-patient]')){event.preventDefault();closeQuick();}});

}

await start();

if(portal)portal.watch({needed:()=>!connected,blocked:()=>busy||saving||updating||managedBlocked,connect:()=>connect()});
