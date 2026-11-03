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
const repo=new Repository(globalThis.chrome?.storage?.local||{async get(){throw new Error('請以 Chrome 擴充元件開啟貼片回收紀錄。');}});
let draft,engine=null,sourceLink=null,wards=[],patients=[],ward='',campus='兒醫',mode='inbed',loadedAt=0,connected=false,busy=false,saving=false,tab='register',draftTimer=null,draftWrite=Promise.resolve(),draftPending=0,entrySubmitting=false,entryContext=null,validationShown=false,fatal=false,updating=false,confirmResolve=null;
const wardCache=new Map();
let groupSelection=new Set(),groupProgress='',groupSubmitting=false,recordWard='';
const wardCacheKey=(code,source='inbed')=>norm(code)+'|'+source;
const emptyDraft=()=>({id:uuid(),date:todayKey(),pharmacist:repo.state.defaults[todayKey().slice(0,7)]||'',entries:[]});
function showError(message){$('error-text').textContent=message;$('error').hidden=false;}
function clearError(){$('error').hidden=true;}
function notice(message){$('notice').textContent=message;$('notice').hidden=false;}
const run=fn=>async(...args)=>{try{await fn(...args);}catch(e){showError(e.message||String(e));}};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function ask(title,text,yes='確定'){return new Promise(resolve=>{confirmResolve=resolve;$('confirm-title').textContent=title;$('confirm-text').textContent=text;$('confirm-yes').textContent=yes;$('confirm-dialog').showModal();});}
function resolveConfirm(value){$('confirm-dialog').close();confirmResolve?.(value);confirmResolve=null;}
function queueDraft(){
  clearTimeout(draftTimer);$('draft-state').textContent='正在保存草稿…';
  draftTimer=setTimeout(()=>{draftTimer=null;writeDraft().catch(()=>{});},220);
}
function writeDraft(){
  const snapshot=structuredClone(draft);
  draftPending++;
  draftWrite=repo.mutate(s=>{s.draft=snapshot.entries.length?snapshot:null;});
  draftWrite.then(()=>{draftPending--;$('draft-state').textContent='草稿已保存';$('storage-status').textContent='資料已保存於本機';},e=>{draftPending--;$('draft-state').textContent='草稿尚未保存';$('storage-status').textContent='保存失敗';showError('無法保存草稿：'+e.message+'。請先不要關閉工具。');});
  return draftWrite;
}
async function flushDraft(){clearTimeout(draftTimer);draftTimer=null;await writeDraft();}
function setTab(next){tab=next;for(const name of ['register','records','settings'])$(name+'-panel').hidden=next!==name;for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b.dataset.tab===next));if(next==='records'){recordWard=wardKey(ward)||recordWard;renderRecords();}if(next==='settings')renderSettings();}
function refreshControls(){
  $('connect').disabled=busy;$('source').disabled=!sourceLink;
  $('connection-state').textContent=busy?'Portal 查詢中…':connected?'已連接 Portal':'尚未連接 Portal';
  for(const id of ['refresh','inbed','cleared','read-page','lookup-account'])$(id).disabled=busy||!connected;
  $('edit-ward-group').disabled=busy||saving||fatal||!connected;
  $('refresh-group').disabled=busy||!connected;
  for(const b of document.querySelectorAll('[data-quick-ward]'))b.disabled=busy||!connected||!wards.some(w=>norm(w.code)===norm(b.dataset.quickWard));
  $('manual').disabled=saving||fatal;$('save-batch').disabled=saving||fatal||!draft?.entries.length;
  $('clear-draft').disabled=saving||fatal||!draft?.entries.length;
  $('save-batch').textContent=saving?'正在儲存…':'儲存這批紀錄';
}
function renderWards(){renderWardGroup();refreshControls();}
function renderWardGroup(){
  const group=repo.state.prefs.wardGroup||[];
  $('edit-ward-group').textContent=group.length?'更改預設組合':'勾選設定';
  $('ward-shortcuts').innerHTML=group.map(code=>{const found=wards.some(w=>norm(w.code)===norm(code)),cache=wardCache.get(wardCacheKey(code));return `<button type="button" data-quick-ward="${esc(code)}" aria-pressed="${norm(ward)===norm(code)}" title="${found?'切換至 '+esc(code):'目前 Portal 名單中找不到此病房'}"><strong>${esc(code)}</strong><span>${cache?cache.rows.length+' 位':found?'待載入':'暫不可用'}</span></button>`;}).join('');
  $('refresh-group').hidden=!group.length;
  const ready=group.filter(code=>wardCache.has(wardCacheKey(code))).length;
  $('ward-group-status').textContent=groupProgress||(group.length?`${group.length} 個預設病房 · ${ready} 個已載入`:'設定後，每次開啟自動帶入。');
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
  ward=code;mode=source;patients=[...result.rows].sort(bedCompare);loadedAt=result.checkedAt;campus=wards.find(w=>norm(w.code)===norm(code))?.campus||campus;
  $('partial').hidden=!result.pagination;$('patient-search').value='';renderRecent();
}
async function loadWardGroup(){
  if(busy||!connected)return;
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
  const visible=filterPatients(patients,$('patient-search').value),selected=new Set(draft.entries.map(e=>patientKey(e.patient)));
  $('patient-count').textContent=patients.length?`${visible.length}／${patients.length} 位`:'';
  $('patient-list').innerHTML=busy?'<p class="empty-text">正在讀取病人名單…</p>':!visible.length?`<p class="empty-text">${!connected?'請在查詢處理頁面開啟工具，或按「連接 Portal」。':!(repo.state.prefs.wardGroup||[]).length?'請先按「勾選設定」選擇預設病房。':!ward?'請選擇病房。':patients.length?'找不到符合的病人。':'目前沒有可選擇的病人，可切換名單或使用帳號查詢。'}</p>`:visible.map(p=>`<button type="button" class="patient-choice" data-patient="${esc(p.account)}" aria-pressed="${selected.has(patientKey(p))}"><span class="checkmark">✓</span><span class="bed">${esc(shortBed(p))}</span><span class="person"><span>${esc(p.name)}</span><small>${esc(p.account)}</small>${mode==='cleared'?`<small class="discharge">出院 ${esc(p.discharge||'未顯示')}</small>`:''}</span></button>`).join('');
  $('freshness').textContent=busy?'查詢期間仍可填寫右側片數':loadedAt?`${mode==='current'?'原系統目前頁 · ':mode==='account'?'帳號查詢結果 · ':''}${ward||''} · ${new Date(loadedAt).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})} 更新`:'';
  refreshControls();
}
function renderDraft(){
  $('batch-date').value=draft.date;$('batch-pharmacist').value=draft.pharmacist;
  $('draft-empty').hidden=!!draft.entries.length;$('draft-table').hidden=!draft.entries.length;
  $('draft-count').textContent=draft.entries.length+' 位病人';
  $('draft-rows').innerHTML=[...draft.entries].sort((a,b)=>bedCompare(a.patient,b.patient)).map(entry=>{
    const p=entry.patient,errors=validationShown?validateEntry(entry,entry.date||draft.date,entry.pharmacist||draft.pharmacist):[];
    const override=[entry.date?entry.date:'',entry.pharmacist?'回收：'+entry.pharmacist:''].filter(Boolean).join(' · ');
    return `<tr data-entry="${esc(entry.id)}"${errors.length?' class="invalid"':''}><td><div class="patient-primary"><strong>${esc(p.ward)} ${esc(shortBed(p))}</strong><span class="name">${esc(p.name)}</span></div><div class="patient-secondary">${esc(p.account)} · ${esc(p.department||'科別待補')}</div>${override?`<span class="override-tag">${esc(override)}</span>`:''}<button class="patient-details" type="button" data-details="${esc(entry.id)}">檢視／修改資料</button>${errors.length?`<p class="row-error">${esc(errors.join('、'))}</p>`:''}</td>${DOSES.map(d=>`<td><div class="quantity"><button type="button" data-step="-1" data-dose="${d}" data-id="${esc(entry.id)}" tabindex="-1" aria-label="${esc(p.name)} ${d} 減一片">−</button><input inputmode="numeric" pattern="[0-9]*" maxlength="4" data-qty="${d}" data-id="${esc(entry.id)}" value="${esc(entry.quantities[d]??'')}" aria-label="${esc(p.name)} ${d} 回收片數" autocomplete="off"><button type="button" data-step="1" data-dose="${d}" data-id="${esc(entry.id)}" tabindex="-1" aria-label="${esc(p.name)} ${d} 加一片">＋</button></div></td>`).join('')}<td><button type="button" class="remove-row" data-remove="${esc(entry.id)}" aria-label="移除 ${esc(p.name)}">×</button></td></tr>`;
  }).join('');renderDraftTotal();refreshControls();
}
function renderDraftTotal(){let total=0;for(const e of draft.entries)for(const d of DOSES)if(/^\d+$/.test(String(e.quantities[d]??'')))total+=Number(e.quantities[d]);$('batch-total').textContent=draft.entries.length?`${draft.entries.length} 位病人，共 ${total} 片`:'尚未加入病人';}
function renderRecent(){const records=recordsForWard(repo.state.records,ward).filter(r=>!r.deletedAt).sort(recordCompare).slice(-4);$('recent-heading').textContent=ward?ward+' 最近登記':'最近登記';$('recent-records').innerHTML=records.length?records.map(r=>`<div class="recent-row"><span class="date">${esc(r.date)}</span><span class="recent-person"><strong>${esc(r.patient.ward)} ${esc(shortBed(r.patient))}</strong>　${esc(r.patient.name)}</span><span class="muted small">${esc(r.pharmacist)}</span><span class="recent-counts">${DOSES.filter(d=>r.quantities[d]).map(d=>`${d} × ${r.quantities[d]}`).join('　')}</span><button type="button" data-edit="${esc(r.id)}">修改</button></div>`).join(''):'<p class="muted small">儲存後，最近幾筆紀錄會顯示在這裡。</p>';}
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
function renderSettings(){const month=$('default-month').value;$('default-name').value=repo.state.defaults[month]||'';$('defaults-list').innerHTML=Object.entries(repo.state.defaults).sort((a,b)=>b[0].localeCompare(a[0])).map(([m,n])=>`<div>${esc(m)}　${esc(n)}</div>`).join('');}
async function connect(link){
  if(busy)return;clearError();busy=true;patients=[];renderPatients();
  try{
    if(link)sourceLink=link;
    else sourceLink=(await chrome.storage.session.get('patchSource')).patchSource||sourceLink;
    if(!sourceLink){const list=await chrome.tabs.query({});const matches=list.filter(t=>/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw\//.test(t.url||''));if(matches.length===1)sourceLink={sourceId:matches[0].id,origin:new URL(matches[0].url).origin};}
    if(!sourceLink)throw new Error('請先登入院內「查詢處理」，在該分頁點擊「貼片回收紀錄」擴充元件。');
    engine=new PortalEngine({...sourceLink,status:message=>{$('freshness').textContent=message;}});
    const result=await engine.connect();wards=normalizeWards(result.control.options);connected=true;wardCache.clear();loadedAt=0;
    const preferred=[ward,repo.state.prefs.ward,result.control.selectedWard].find(w=>wards.some(x=>x.code===w));ward=preferred||wards[0]?.code||'';campus=wards.find(w=>w.code===ward)?.campus||campus;renderWards();
  }catch(e){connected=false;engine=null;throw e;}finally{busy=false;refreshControls();renderPatients();}
  if(repo.state.prefs.wardGroupConfigured&&(repo.state.prefs.wardGroup||[]).length)await loadWardGroup();
  else if(!repo.state.prefs.wardGroupConfigured)openWardGroup();
  else if(ward)await loadWard(ward,'inbed');
}
async function loadWard(code,source='inbed',force=false){
  if(busy||!code)return;clearError();busy=true;ward=code;mode=source;patients=[];loadedAt=0;$('patient-search').value='';$('partial').hidden=true;renderPatients();
  try{
    if(force)wardCache.delete(wardCacheKey(code,source));
    const result=wardCache.get(wardCacheKey(code,source))||await engine.loadWard(code,source,false);
    if(result.superseded)return;wardCache.set(wardCacheKey(code,source),result);acceptWard(result,code,source);
    await repo.mutate(s=>{s.prefs={...s.prefs,ward:code,campus};});
  }finally{busy=false;renderWards();renderPatients();}
}
async function readPage(){if(busy||!engine)return;clearError();busy=true;patients=[];renderPatients();try{await engine.connect();const r=await engine.call('list');if(r.loading||!r.ready)throw new Error('原系統名單尚未完成載入');patients=r.rows;ward=r.control?.selectedWard||'';campus=wards.find(w=>w.code===ward)?.campus||campus;mode='current';loadedAt=Date.now();$('partial').hidden=!r.pagination;$('patient-search').value='';}finally{busy=false;renderWards();renderPatients();}}
async function lookupAccount(){
  if(busy)return;const account=prompt('輸入完整住院帳號（例如 26T12345678）');if(account===null)return;
  const value=clean(account).toUpperCase();if(!/^\d{2}[A-Z]\d{8}$/.test(value))throw new Error('請輸入完整的住院帳號');
  busy=true;patients=[];renderPatients();try{const r=await engine.queryPerson('account',value);patients=r.rows;mode='account';loadedAt=Date.now();$('patient-search').value='';$('partial').hidden=!r.pagination;}finally{busy=false;renderPatients();}
}
async function removeEntry(id){
  const entry=draft.entries.find(e=>e.id===id);if(!entry)return;
  if(DOSES.some(d=>Number(entry.quantities[d])>0)&&!await ask('移除這位病人？',`${entry.patient.name} 已填入片數，移除後會清除這列草稿。`,'移除'))return;
  draft.entries=draft.entries.filter(e=>e.id!==id);renderDraft();renderPatients();queueDraft();
}
async function togglePatient(account){
  if(busy||saving||fatal)return;const p=patients.find(p=>p.account===account);if(!p)return;
  const existing=draft.entries.find(e=>patientKey(e.patient)===patientKey(p));if(existing)return removeEntry(existing.id);
  draft.entries.push({id:uuid(),patient:patientData(p),quantities:{},source:mode,date:'',pharmacist:''});
  validationShown=false;renderDraft();renderPatients();queueDraft();
}
async function saveBatch(){
  if(saving||fatal)return;clearError();validationShown=true;
  if(!validDate($('batch-date').value))throw new Error('請填寫有效的回收日期');
  let proposed;try{proposed=batchRecords({...draft,entries:[...draft.entries].sort((a,b)=>bedCompare(a.patient,b.patient))});}catch(e){renderDraft();throw e;}
  const duplicates=duplicateRecords(repo.state.records,proposed);
  if(duplicates.length&&!await ask('這些病人同日已有紀錄',duplicates.map(r=>`${r.date}　${r.patient.ward} ${shortBed(r.patient)} ${r.patient.name}`).join('\n')+'\n\n若這是另一次收到的貼片，可以繼續新增。','仍要新增'))return;
  saving=true;$('register-panel').classList.add('locking');refreshControls();
  try{
    clearTimeout(draftTimer);draftTimer=null;await draftWrite.catch(()=>{});
    await repo.mutate(s=>{if(proposed.some(p=>s.records.some(r=>r.id===p.id)))throw new Error('這批紀錄已存在，未重複儲存。');s.records.push(...proposed);s.draft=null;});
    const previous=draft;draft={id:uuid(),date:previous.date,pharmacist:previous.pharmacist,entries:[]};validationShown=false;
    $('record-month').value=proposed[0].date.slice(0,7);renderDraft();renderPatients();renderRecent();$('draft-state').textContent='這批已儲存';notice(`已儲存 ${proposed.length} 位病人的回收紀錄，共 ${Object.values(totals(proposed)).reduce((a,b)=>a+b,0)} 片。`);
  }finally{saving=false;$('register-panel').classList.remove('locking');refreshControls();}
}
function openEntry(kind,id){
  entryContext={kind,id};const entry=kind==='record'?repo.state.records.find(r=>r.id===id):kind==='draft'?draft.entries.find(e=>e.id===id):null;
  if(kind!=='manual'&&!entry)return;
  const p=entry?.patient||{ward};$('entry-title').textContent=kind==='record'?'修改回收紀錄':kind==='draft'?'這位病人的資料':'手動補登病人';
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
      renderRecords();renderRecent();notice('已保存修改，原資料保留於修改歷程。');
    }else{
      if(draft.entries.some(e=>e.id!==context.id&&patientKey(e.patient)===patientKey(patient)))throw new Error('這位病人已在這批中，請在原列填寫');
      const entry={id:context.id||uuid(),patient,quantities,date:date===draft.date?'':date,pharmacist:pharmacist===draft.pharmacist?'':pharmacist,source:context.kind==='manual'?'manual':draft.entries.find(e=>e.id===context.id).source};
      if(context.kind==='manual')draft.entries.push(entry);else draft.entries=draft.entries.map(e=>e.id===context.id?entry:e);
      validationShown=false;renderDraft();renderPatients();await flushDraft();
    }
    $('entry-dialog').close();entryContext=null;
  }catch(e){$('entry-error').textContent=e.message;$('entry-error').hidden=false;}finally{entrySubmitting=false;}
}
async function markRecord(id,deleted){
  const r=repo.state.records.find(r=>r.id===id);if(!r)return;
  if(!await ask(deleted?'作廢這筆回收紀錄？':'復原這筆紀錄？',`${r.date}　${r.patient.ward} ${shortBed(r.patient)} ${r.patient.name}\n${deleted?'作廢後不納入列印及合計，仍可在紀錄中復原。':'復原後會重新納入列印與合計。'}`,deleted?'作廢':'復原'))return;
  await repo.mutate(s=>{const row=s.records.find(x=>x.id===id),now=new Date().toISOString();row.deletedAt=deleted?now:null;row.updatedAt=now;row.history.push({at:now,action:deleted?'delete':'restore'});});renderRecords();renderRecent();notice(deleted?'已作廢這筆紀錄，可勾選「顯示已作廢」復原。':'已復原這筆紀錄。');
}
function history(id){const r=repo.state.records.find(r=>r.id===id);if(!r)return;$('history-content').innerHTML=`<p>${esc(r.patient.name)} · ${esc(r.patient.account)}</p><div class="history-item">建立時間：${esc(new Date(r.createdAt).toLocaleString('zh-TW'))}</div>`+r.history.map(h=>`<div class="history-item"><strong>${esc(new Date(h.at).toLocaleString('zh-TW'))}　${({edit:'修改',delete:'作廢',restore:'復原'})[h.action]||'變更'}</strong>${h.before?`<p>修改前：${esc(h.before.date)}　${esc(h.before.patient?.name)}　${esc(h.before.patient?.account)}<br>${esc(h.before.patient?.ward)} ${esc(shortBed(h.before.patient||{}))}　${esc(h.before.patient?.department)}<br>${DOSES.map(d=>`${d}：${esc(h.before.quantities?.[d]||0)} 片`).join('　')}<br>回收藥師：${esc(h.before.pharmacist)}</p>`:''}</div>`).join('');$('history-dialog').showModal();}
async function setDefault(month,name){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!clean(name))throw new Error('請選擇月份並填寫藥師姓名');await repo.mutate(s=>{s.defaults[month]=clean(name);});if(draft.date.slice(0,7)===month){draft.pharmacist=clean(name);renderDraft();await flushDraft();}renderSettings();notice(`${month} 預設回收藥師已設為 ${clean(name)}。`);}
async function exportBackup(){await flushDraft();download(new Blob([JSON.stringify({format:'ntuh-patch-recovery',exportedAt:new Date().toISOString(),data:storageData(repo.state)},null,2)],{type:'application/json'}),`貼片回收_完整備份_${todayKey()}.json`);notice('已匯出完整備份。');}
async function restoreBackup(file){
  if(!file)return;if(file.size>50*1024*1024)throw new Error('備份檔超過 50 MB，未匯入');
  const input=JSON.parse(await file.text());await flushDraft();const preview=importBackup(repo.state,input);
  if(!await ask('匯入備份',`新增 ${preview.added} 筆，略過 ${preview.skipped} 筆相同紀錄。\n現有紀錄與目前草稿會保留。`,'合併匯入'))return;
  await repo.mutate(s=>{const result=importBackup(s,input);Object.assign(s,result.next);});draft=repo.state.draft?structuredClone(repo.state.draft):emptyDraft();renderDraft();renderWards();renderPatients();renderRecent();renderRecords();renderSettings();notice(`已匯入 ${preview.added} 筆紀錄。`);
}
function previewPrint(){const month=$('record-month').value,records=selectedMonthRecords();if(!records.length)return;$('print-pages').innerHTML=printMarkup(records,month,recordWard);$('app-shell').hidden=true;$('print-view').hidden=false;window.scrollTo(0,0);}
function bind(){
  for(const type of ['click','input','change','keydown','submit'])document.addEventListener(type,event=>{if(managedBlocked&&event.target.closest?.('#app-shell')&&!event.target.closest('#open-update,#open-management')){event.preventDefault();event.stopImmediatePropagation();}},true);
  document.addEventListener('click',run(async event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.tab){setTab(b.dataset.tab);return;}
    if(b.dataset.recordWard){recordWard=b.dataset.recordWard;renderRecords();return;}
    if(b.dataset.quickWard)return loadWard(b.dataset.quickWard,'inbed');
    if(b.dataset.patient)return togglePatient(b.dataset.patient);
    if(b.dataset.remove)return removeEntry(b.dataset.remove);
    if(b.dataset.details){openEntry('draft',b.dataset.details);return;}
    if(b.dataset.edit){openEntry('record',b.dataset.edit);return;}
    if(b.dataset.delete)return markRecord(b.dataset.delete,true);
    if(b.dataset.restore)return markRecord(b.dataset.restore,false);
    if(b.dataset.history){history(b.dataset.history);return;}
    if(b.dataset.step){const entry=draft.entries.find(e=>e.id===b.dataset.id),d=b.dataset.dose;if(!entry)return;const n=Math.min(9999,Math.max(0,(Number(entry.quantities[d])||0)+Number(b.dataset.step)));entry.quantities[d]=n===0?'':String(n);const input=document.querySelector(`input[data-id="${CSS.escape(entry.id)}"][data-qty="${d}"]`);input.value=entry.quantities[d];renderDraftTotal();queueDraft();}
  }));
  $('draft-rows').addEventListener('input',event=>{const input=event.target;if(!input.dataset.qty)return;const entry=draft.entries.find(e=>e.id===input.dataset.id);if(!entry)return;entry.quantities[input.dataset.qty]=input.value;renderDraftTotal();queueDraft();});
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
  $('connect').addEventListener('click',run(()=>connect()));$('source').addEventListener('click',run(()=>engine?.focusSource()));
  $('batch-date').addEventListener('change',()=>{if(!validDate($('batch-date').value))return;const previousMonth=draft.date.slice(0,7);draft.date=$('batch-date').value;if(previousMonth!==draft.date.slice(0,7))draft.pharmacist=repo.state.defaults[draft.date.slice(0,7)]||'';renderDraft();queueDraft();});
  $('batch-pharmacist').addEventListener('input',()=>{draft.pharmacist=$('batch-pharmacist').value;queueDraft();});
  $('save-default').addEventListener('click',run(()=>setDefault(draft.date.slice(0,7),draft.pharmacist)));
  $('save-batch').addEventListener('click',run(saveBatch));
  $('clear-draft').addEventListener('click',run(async()=>{if(!await ask('清空這批草稿？',`將移除 ${draft.entries.length} 位病人的未儲存內容。已儲存的紀錄不受影響。`,'清空'))return;draft.entries=[];validationShown=false;renderDraft();renderPatients();await flushDraft();}));
  $('manual').addEventListener('click',()=>openEntry('manual'));$('entry-form').addEventListener('submit',submitEntry);
  for(const id of ['entry-close','entry-cancel'])$(id).addEventListener('click',()=>{$('entry-dialog').close();entryContext=null;});
  $('confirm-yes').addEventListener('click',()=>resolveConfirm(true));$('confirm-no').addEventListener('click',()=>resolveConfirm(false));$('confirm-dialog').addEventListener('cancel',event=>{event.preventDefault();resolveConfirm(false);});
  $('history-close').addEventListener('click',()=>$('history-dialog').close());
  $('all-records').addEventListener('click',()=>setTab('records'));
  for(const id of ['record-month','record-search','show-deleted'])$(id).addEventListener(id==='record-search'?'input':'change',renderRecords);
  $('default-month').addEventListener('change',renderSettings);$('set-default').addEventListener('click',run(()=>setDefault($('default-month').value,$('default-name').value)));
  $('backup').addEventListener('click',run(exportBackup));$('import').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',run(async()=>{try{await restoreBackup($('import-file').files[0]);}finally{$('import-file').value='';}}));
  $('preview').addEventListener('click',previewPrint);$('print-now').addEventListener('click',()=>window.print());$('print-back').addEventListener('click',()=>{$('print-view').hidden=true;$('app-shell').hidden=false;});
  $('export-excel').addEventListener('click',()=>{const month=$('record-month').value;download(workbook(selectedMonthRecords(),month,recordWard),`貼片回收紀錄_${recordWard}_${month}.xlsx`);});
  $('dismiss-error').addEventListener('click',clearError);
  $('diagnostic').addEventListener('click',run(async()=>{if(!engine)throw new Error('請先連接 Portal');download(new Blob([JSON.stringify({tool:'貼片回收紀錄',version:'1.2.0',...(await engine.diagnostics())},null,2)],{type:'application/json'}),'貼片回收_相容性資訊.json');}));
  if(globalThis.chrome?.runtime?.onMessage)chrome.runtime.onMessage.addListener(message=>{if(message?.kind==='patch-source'&&!busy&&!updating&&!managedBlocked)run(()=>connect({sourceId:message.sourceId,origin:message.origin}))();});
  window.addEventListener('beforeunload',event=>{if(draftTimer||draftPending||saving){event.preventDefault();event.returnValue='';}});
}
async function start(){
  const month=todayKey().slice(0,7);$('record-month').value=month;$('default-month').value=month;
  try{await repo.load();draft=repo.state.draft?structuredClone(repo.state.draft):emptyDraft();ward=repo.state.prefs.ward;campus=repo.state.prefs.campus||'兒醫';$('storage-status').textContent='資料已保存於本機';if(draft.entries.length)notice(`已恢復 ${draft.entries.length} 位病人的未儲存草稿。`);}
  catch(e){fatal=true;draft=emptyDraft();showError(e.message+'。未覆寫既有資料。');$('storage-status').textContent='資料載入失敗';}
  bind();renderWards();renderDraft();renderPatients();renderRecent();renderSettings();
  if(fatal){for(const id of ['save-default','set-default','backup','import'])$(id).disabled=true;return;}
  await mountUpdater({
    isBusy:()=>busy||saving||entrySubmitting||groupSubmitting||fatal||updating||[...document.querySelectorAll('dialog[open]')].some(el=>el.id!=='update-dialog'),
    prepare:async()=>{
      updating=true;syncInert();
      try{await flushDraft();await repo.tail;}catch(e){updating=false;syncInert();throw e;}
    },
    finish:()=>{updating=false;syncInert();}
  }).catch(e=>{$('open-update').disabled=true;showError('更新功能暫時無法載入：'+e.message+'。回收登記仍可使用。');});
  const management=await mountManagement({
    isBusy:()=>busy||saving||entrySubmitting||groupSubmitting||updating||[...document.querySelectorAll('dialog[open]')].some(el=>!['update-dialog','management-dialog'].includes(el.id)),
    saveDraft:async()=>{await flushDraft();await repo.tail;},
    setBlocked:value=>{managedBlocked=value;},setLocked:value=>{managementLocked=value;syncInert();},
    onReady:()=>{if(!connected&&!busy&&!updating&&!managedBlocked)void run(()=>connect())();},exportBackup
  }).catch(e=>{managedBlocked=true;managementLocked=true;syncInert();$('management-lock').hidden=false;$('management-lock-title').textContent='管理功能載入失敗';$('management-lock-reason').textContent=e.message;return{blocked:true};});
  if(!management.blocked)await run(()=>connect())();
}
await start();
