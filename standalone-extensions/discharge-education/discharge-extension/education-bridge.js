'use strict';
// Runs only in the user's already-open hospital tab. No direct requests or stored credentials.
window.educationPageBridge=function(action,p={},expiresAt){
 try{
  const path='/WebApplication/PharManagement/CareEducationRecord.aspx',capture='/WebApplication/PharManagement/InMedicationProcess.aspx';
  if(!['https://ihisaw.ntuh.gov.tw','https://portal.ntuh.gov.tw'].includes(location.origin))return null;
  const readOnly=['eduDiscover','eduRead','eduPlanOrders','eduVerify'].includes(action);
  // Promise.race does not cancel an injection already queued by Chrome.
  // A late mutation must expire in the hospital page before touching controls.
  const fresh=()=>{if(!readOnly&&(!Number.isFinite(expiresAt)||Date.now()>=expiresAt))throw Error('這次 Portal 操作已逾時取消，未執行後續操作。');};
  fresh();
  const $=id=>document.getElementById(id),E='NTUHWeb1_EditorBox_',C=E+'ContentBox_',N='NTUHWeb1_InPatInsertNavigatorBox_',Q=N+'InPatQueryBox_',O=N+'InPatOrderListBox_',D=O+'InPatOrderQueryBox_';
  const clean=s=>String(s??'').normalize('NFKC').replace(/\s+/g,' ').trim(),visible=e=>!!e&&!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)&&getComputedStyle(e).visibility!=='hidden';
  const text=e=>clean(e?.textContent),date=s=>clean(s).replace(/\D/g,''),key=r=>r.orderDate+'|'+r.number+'|'+r.sequence;
  const kind=location.origin==='https://ihisaw.ntuh.gov.tw'?(location.pathname===path?'education':location.pathname===capture?'capture':'other'):'other';
  function links(to){const wanted=to==='education'?path:capture,label=to==='education'?'衛教紀錄':'查詢處理';return [...document.querySelectorAll('a[href]')].filter(a=>{if(text(a)!==label)return false;try{const u=new URL(a.href,location.href);return u.origin==='https://ihisaw.ntuh.gov.tw'&&u.pathname===wanted;}catch{return false;}});}
  function follow(to){
   if(kind==='education'&&editor()&&!text($(C+'lblCreateDateTime')))throw Error('Portal 仍有未儲存的衛教表單，請先到原頁返回。');
   const all=links(to),shown=all.filter(visible),a=shown.length===1?shown[0]:all.length===1?all[0]:null;
   if(!a)throw Error('找不到唯一的「'+(to==='education'?'衛教紀錄':'查詢處理')+'」選單連結，請在 Portal 手動開啟。');
   if(!visible(a)){
    const parents=[];for(let e=a.parentElement;e;e=e.parentElement)if(e.classList.contains('webfx-tree-container')&&!visible(e))parents.unshift(e);
    const container=parents.find(e=>visible($(e.id.replace(/-cont$/,'-plus'))));const toggle=container&&$(container.id.replace(/-cont$/,'-plus'));
    if(!toggle)throw Error('選單尚未展開，請先在 Portal 展開藥事服務或住院作業。');fresh();toggle.click();return {acted:true,expanded:true};
   }
   // Click the existing authenticated menu link unchanged. Never reconstruct
   // a URL or copy the SESSION value outside this page.
   fresh();a.click();return {acted:true};
  }
  const busy=()=>document.readyState==='loading'||!!window.Sys?.WebForms?.PageRequestManager?.getInstance()?.get_isInAsyncPostBack();
  const need=id=>{const e=$(id);if(!visible(e)||e.disabled)throw Error('院內欄位尚未就緒：'+id.split('_').slice(-1));return e;};
  const click=id=>{if(busy())throw Error('院內頁面正在更新，未送出操作。');const e=need(id);fresh();e.click();return {acted:true};};
  const set=(id,value)=>{const e=need(id);fresh();if(['checkbox','radio'].includes(e.type)){if(e.checked!==value)e.click();}else{if(e.maxLength>0&&String(value).length>e.maxLength)throw Error('欄位內容超過院內長度限制。');e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}return {acted:true};};
  function rows(id){const t=$(id);if(!visible(t))return [];
   const rs=[...t.rows].filter(r=>r.closest('table')===t),head=rs.find(r=>[...r.cells].some(c=>text(c)==='序號'));
   if(!head)throw Error('處方表格欄位無法辨識。');const labels=[...head.cells].map(text),cols={};for(const label of ['序號','狀態','階段','開方日','處方號']){cols[label]=labels.indexOf(label);if(cols[label]<0)throw Error('處方表格缺少 '+label+'。');}
   if([...t.querySelectorAll('a[href]')].some(a=>/Page\$/.test(a.getAttribute('href'))))throw Error('處方表格有分頁，請先在院內頁面核對完整處方。');
   return rs.filter(r=>r!==head&&r.cells.length===labels.length&&/^\d+$/.test(text(r.cells[cols['序號']]))).map(r=>({sequence:text(r.cells[cols['序號']]),status:text(r.cells[cols['狀態']]),phase:text(r.cells[cols['階段']]),orderDate:date(text(r.cells[cols['開方日']])),number:text(r.cells[cols['處方號']]).toUpperCase(),checkbox:r.querySelector('input[id$="_ckbSelect"]')?.id,button:r.querySelector('input[id$="_btnSelect"]')?.id}));
  }
  const editor=()=>visible($(C+'rdbEducationType_1'));
  function identity(){const pre=editor()?E+'PatientInfoBox_':O+'InPatientInfoBox_';return {account:text($(pre+'lblAccountIdse')),mrn:text($(pre+'lblChartNo')),name:text($(pre+'lblPatientName'))};}
  function guard(){const i=identity();if(i.account!==p.patient?.account||i.mrn!==p.patient?.mrn||i.name!==p.patient?.name)throw Error('病人帳號、病歷號或姓名不一致，已停止。');}
  function chosen(){return rows(E+'InPatRxChosenBox_dgrPhrOrder');}
  function checkChosen(){guard();const actual=chosen().map(key).sort(),expected=(p.selected||[]).map(key).sort();if(!expected.length||JSON.stringify(actual)!==JSON.stringify(expected)||chosen().some(r=>r.phase!=='出院'))throw Error('衛教頁帶入的處方與所選清單不一致，已停止。');}
  function state(){
   const isEditor=editor(),fields={};if(isEditor)for(const el of document.querySelectorAll('input[id],select[id],textarea[id]'))if(el.id.startsWith(C)&&visible(el))fields[el.id.slice(C.length)]={value:['checkbox','radio'].includes(el.type)?el.checked:el.value,disabled:el.disabled};
   const phase=isEditor?'editor':visible($(O+'dgrPhrOrder'))?'orders':visible($(N+'InPatListBox_dgrPatientList'))?'patients':visible($(Q+'btnQuery'))?'query':'home';
   const errors=[...document.querySelectorAll('[id*="Validator"],[id*="ValidationSummary"]')].filter(visible).map(text).filter(Boolean);
   return {path:location.pathname,ready:!busy(),phase,identity:identity(),fields,chosen:isEditor?chosen():[],created:text($(C+'lblCreateDateTime')),sent:text($(C+'lblSendVerifyDateTime')),status:text($(C+'lblStatusName')),errors,queryMrn:$(Q+'txbChartNo')?.value,baseDate:$(D+'txbBaseDate')?.value,days:$(D+'txbDayRange')?.value};
  }
  if(action==='eduDiscover')return {path:location.pathname,kind,ready:!busy(),links:{education:links('education').length>0,capture:links('capture').length>0},unsaved:kind==='education'&&editor()&&!text($(C+'lblCreateDateTime'))};
  if(action==='eduNavigate')return kind==='education'?{acted:false}:follow('education');
  if(action==='eduReturnCapture')return kind==='capture'?{acted:false}:follow('capture');
  if(kind!=='education')throw Error('請先開啟衛教紀錄頁面。');
  if(action==='eduRead')return state();
  if(busy())throw Error('院內頁面正在更新，未送出操作。');
  if(action==='eduBegin'){if(editor()&&!text($(C+'lblCreateDateTime')))throw Error('Portal 有尚未關閉的衛教表單，請先返回後再開始批次登錄。');return click('NTUHWeb1_ChooseFunctionBox_InPatEducationRecord');}
  if(action==='eduPatientMode')return set(Q+'rdbQueryByPatientId',true);
  if(action==='eduQuery'){set(Q+'txbChartNo',p.patient.mrn);return click(Q+'btnQuery');}
  if(action==='eduSelectPatient'){
   const t=need(N+'InPatListBox_dgrPatientList'),head=[...t.rows].find(r=>[...r.cells].some(c=>text(c)==='帳號'));
   if(!head)throw Error('找不到住院帳號欄位。');const labels=[...head.cells].map(text),accountIndex=labels.indexOf('帳號'),nameIndex=labels.indexOf('姓名');
   const hits=[...t.rows].filter(r=>text(r.cells[accountIndex])===p.patient.account);
   if(hits.length!==1||text(hits[0].cells[nameIndex])!==p.patient.name)throw Error('查詢結果無法唯一對應此病人的住院帳號。');
   const button=hits[0].querySelector('input[id$="_btnSelect"]');if(!button)throw Error('找不到病人選取按鈕。');return click(button.id);
  }
  if(action==='eduDateQuery'){guard();set(D+'txbBaseDate',p.range.baseDate);set(D+'txbDayRange',p.range.days);return click(D+'btnQueryByDate');}
  if(action==='eduSelectOrders'||action==='eduPlanOrders'){
   guard();const all=rows(O+'dgrPhrOrder'),wanted=new Set(p.patient.pending.map(r=>date(r.orderDate)+'|'+r.number)),selected=all.filter(r=>r.phase==='出院'&&wanted.has(r.orderDate+'|'+r.number));
   for(const rx of p.patient.pending){const group=selected.filter(r=>r.orderDate===date(rx.orderDate)&&r.number===rx.number);if(!group.length||(rx.sequences||[]).some(s=>!group.some(r=>r.sequence===s)))throw Error('原名單的出院藥處方未完整找到，請回 Portal 核對。');}
   if(new Set(selected.map(key)).size!==selected.length||!selected.length)throw Error('處方對應不唯一，已停止。');
   if(action==='eduPlanOrders')return {selected:selected.map(({checkbox,button,...r})=>r)};
   if(JSON.stringify(selected.map(key).sort())!==JSON.stringify((p.selected||[]).map(key).sort()))throw Error('處方在核對後發生變更，請重新核對。');
   for(const r of selected)need(r.checkbox);
   // All current prescriptions in each pickup group, including discontinued orders.
   fresh();
   for(const r of all)if(r.checkbox){const el=$(r.checkbox),value=selected.includes(r);if(el.disabled&&value)throw Error('有處方無法勾選，未送出。');el.checked=value;}
   for(const r of all)if(r.checkbox&&$(r.checkbox).checked!==selected.includes(r))throw Error('處方勾選驗證失敗。');
   const cleanRows=selected.map(({checkbox,button,...r})=>r);const result=click(selected.at(-1).button);return {...result,selected:cleanRows};
  }
  if(action==='eduField'){checkChosen();if(text($(C+'lblCreateDateTime')))throw Error('此衛教紀錄已儲存，停止修改。');if(!/^[A-Za-z0-9_]+$/.test(p.field))throw Error('欄位代碼不正確。');return set(C+p.field,p.value);}
  if(action==='eduSummaryAll'){checkChosen();if(text($(C+'lblCreateDateTime')))throw Error('此衛教紀錄已儲存，停止修改。');return click(C+'btnCareOpinionItemSelectAll');}
  if(action==='eduFillFields'){
   checkChosen();if(text($(C+'lblCreateDateTime')))throw Error('此衛教紀錄已儲存，停止修改。');const changed={};
   for(const [field,value]of Object.entries(p.fields||{})){
    if(!/^[A-Za-z0-9_]+$/.test(field))throw Error('欄位代碼不正確。');const el=need(C+field),actual=['checkbox','radio'].includes(el.type)?el.checked:el.value;
    if(actual===value)continue;
    const postback=/__doPostBack|WebForm_DoPostBack/.test((el.getAttribute('onclick')||'')+(el.getAttribute('onchange')||''))||/^(rdbEducationType_|rdbIsComplete_|chkCareGiverType_|chkLanguageType_|rdbLearningObstacle|chkPatientSpeciality_|rdbLearningAffect)/.test(field);
    set(C+field,value);changed[field]=value;
    // Conditional controls can rebuild the form. Stop this chunk immediately
    // and let the controller wait for that postback before continuing.
    if(postback)return {done:false,changed};
   }
   return {done:true,changed};
  }
  if(action==='eduVerify'||action==='eduSend'){
   checkChosen();const s=state();if(s.created||s.sent)throw Error('此紀錄已儲存，未重複送出。');
   for(const [k,v]of Object.entries(p.fields||{}))if(!s.fields[k]||s.fields[k].disabled||s.fields[k].value!==v)throw Error('衛教欄位核對不符：'+k+'。');
   if(action==='eduVerify')return {verified:true};
   return click(E+'btnTeamLeader');
  }
  throw Error('未知衛教操作。');
 }catch(e){return {error:e.message};}
};
