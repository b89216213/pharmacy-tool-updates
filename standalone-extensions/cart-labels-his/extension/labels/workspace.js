let autoSummary=null;
const ws={services:null,wards:[],selected:new Set(),favorites:[],campus:'健大',combos:[{name:'早上藥車',wards:['10HN','11HN']},{name:'下午藥車',wards:['07HN','08HN']}],activeSlot:0,busy:false,locked:false,stop:false,connected:false,unresolved:new Set(),search:'',expanded:new Set(),generation:0,lastError:''};
const WS_PREF='cartWorkspacePreferencesV1';
const wsNode=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function wsDefaultSlot(now=new Date()){
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',hour:'2-digit',hourCycle:'h23'}).format(now));
 return hour<12?0:1;
}
function wsSetStatus(text='',error=false){
 const node=$('captureStatus');node.textContent=text;node.hidden=!text;node.classList.toggle('error',error);
 ws.lastError=error?text:'';
 $('captureProgress').hidden=true;
 $('reconnect').hidden=!error;$('sourcePortal').hidden=!error;
}
const wsReport=(text,index,total)=>{
 if(ws.busy){wsSetStatus(ws.connected?'正在讀取'+(ws.combos[ws.activeSlot]?.name||'病房')+'…':'正在連接院內系統…');}
 else if(text)wsSetStatus(text,/無法|失敗|未完成|尚未|請先登入/.test(text));
};
async function wsSave(){
 try{await chrome.storage.local.set({[WS_PREF]:{selected:[...ws.selected],campus:ws.campus,combos:ws.combos}});return true;}
 catch{wsSetStatus('病房設定尚未儲存，請稍後重試。',true);return false;}
}
function wsBusy(){return ws.busy||conversionBusy||printBusy;}
function wsControls(){
 const blocked=wsBusy()||ws.locked;
 $('captureStart').disabled=blocked||!ws.connected||!ws.selected.size;
 $('captureStart').hidden=true;$('captureStop').hidden=true;
 $('captureProgress').hidden=true;
 if($('captureReload'))$('captureReload').disabled=blocked||!ws.selected.size;
 for(const node of document.querySelectorAll('#wardPanel button,#wardPanel input,#selectedWards button,#clearWardSelection,#testScenario,#reconnect,#sourcePortal'))node.disabled=blocked;
 const preview=document.querySelector('.preview-panel');if(preview)preview.inert=blocked;
 $('testScenario').disabled=blocked;
 renderPrintBar();renderPatientList();
}
// Replaced by ward-selection.js before startup; legacy anchors remain available.
function wsWardChip(code){return wsNode('span','',code);}
function wsRenderWards(){wsControls();}
function wsResetCapture(){
 ws.generation++;globalThis.Handover?.clearCapture();ws.unresolved.clear();autoSummary=null;
 $('source').value='';records=[];lastExcluded=[];vacantCaptions=new Map();manualRemoved.clear();dischargeDecisions.clear();
 printSelection=null;printOmitted=new Set();recordsUsePresets=false;current=0;pageStarts=[0];dirty=false;document.body.classList.remove('dirty');
 ws.search='';ws.expanded.clear();$('patientSearch').value='';
 $('captureReportBox').hidden=true;$('captureReport').replaceChildren();
 render();
}
async function chooseMissingWards(wards){
 if(!autoSummary)return new Set(wards.map(w=>w.ward));
 const known=new Map(autoSummary.map(r=>[r.ward,r]));
 return new Set(wards.filter(w=>{const r=known.get(w.ward);return !r||r.error||r.missing||r.patients?.length!==r.total;}).map(w=>w.ward));
}
async function wsReconnect(){
 if(wsBusy()||ws.locked||!ws.services)return;
 ws.busy=true;ws.stop=false;ws.connected=false;wsResetCapture();wsSetStatus('正在連接院內系統…');wsControls();
 let ready=false;
 try{
  ws.wards=await ws.services.connect(wsReport);
  if(ws.stop||ws.locked)throw Error('連接已中止，請重新連接。');
  ws.connected=true;ready=true;
  if(!ws.wards.some(w=>w.campus===ws.campus))ws.campus=ws.wards[0]?.campus||'';
  $('connectionBadge').textContent=CART_TEST_MODE?'測試模式 · 離線':'已連接 Portal';
 }catch(e){$('connectionBadge').textContent='尚未連接';wsSetStatus(e.message||'無法連接，請確認院內系統已登入。',true);}
 finally{ws.busy=false;ws.stop=false;wsRenderWards();}
 if(ready)await wsCapture();
}
function wsResults(results,stopped){
 $('captureReport').replaceChildren();
 const failures=results.filter(r=>r.error||r.missing);
 for(const result of failures){
  const row=wsNode('div','capture-result warning');
  const text=result.error?'未完成 · '+result.error:'資料不完整：已取得 '+(result.patients?.length||0)+'／'+result.total+' 位'+(result.missingBeds?.length?'（缺少 '+result.missingBeds.join('、')+'）':'');
  row.append(wsNode('strong','',result.ward),wsNode('span','',text));
  const retry=wsNode('button','','重試讀取');retry.type='button';retry.onclick=()=>void wsCapture();
  const remove=wsNode('button','','本次先不處理此病房');remove.type='button';
  remove.onclick=async()=>{
   if(wsBusy()||ws.locked)return;
   globalThis.Handover?.removeWard(result.ward);
   $('source').value=CartWorkspaceCore.merge($('source').value,[{ward:result.ward,patients:[]}]);manualRemoved.clear();
   await convert();
   ws.unresolved.delete(result.ward);row.remove();
   $('captureReportBox').hidden=!ws.unresolved.size;
   wsSetStatus(ws.unresolved.size?'部分病房尚未完整讀取，請重試或選擇本次不處理。':'',ws.unresolved.size>0);renderPrintBar();
  };
  row.append(retry,remove);$('captureReport').append(row);
 }
 $('captureReportBox').hidden=!failures.length;$('captureReportBox').open=failures.length>0;
 wsSetStatus(failures.length?(stopped?'讀取已中止，尚有病房未完成。':'部分病房尚未完整讀取，請重試或選擇本次不處理。'):'',failures.length>0);
}
async function wsCapture(){
 if(wsBusy()||ws.locked||!ws.services)return;
 if(!ws.connected)return wsReconnect();
 if(!ws.selected.size){wsResetCapture();wsSetStatus('請在'+(ws.combos[ws.activeSlot]?.name||'目前組別')+'卡片選擇病房。');wsRenderWards();return;}
 ws.busy=true;ws.stop=false;wsResetCapture();
 const generation=ws.generation,selected=[...ws.selected],slot=ws.activeSlot,scenario=$('testScenario').value;
 const stillCurrent=()=>generation===ws.generation&&slot===ws.activeSlot&&selected.length===ws.selected.size&&selected.every(w=>ws.selected.has(w));
 wsSetStatus('正在讀取'+(ws.combos[slot]?.name||'病房')+'…');wsControls();
 try{
  const available=new Set(ws.wards.map(w=>w.code));
  const queried=selected.filter(ward=>available.has(ward));
  const raw=queried.length?await ws.services.capture(queried,scenario,wsReport,()=>ws.stop||ws.locked||!stillCurrent()):[];
  if(!stillCurrent())throw Error('病房選擇已變更，請重新讀取目前組別。');
  const results=selected.map(ward=>{
   if(!available.has(ward))return {ward,error:'原系統未提供這個病房，請調整病房選擇。'};
   const entries=raw.filter(r=>r.ward===ward);
   if(entries.length!==1)return {ward,error:ws.stop?'已停止，這個病房尚未更新。':'尚未取得完整回應，請重新讀取。'};
   const r=entries[0];
   if(!r.error&&(!Array.isArray(r.patients)||!Number.isInteger(r.total)||r.total<0||r.patients.length!==r.total))return {...r,missing:Math.max(1,(r.total||0)-(r.patients?.length||0))};
   return r;
  });
  for(const r of results)if(r.error||r.missing)ws.unresolved.add(r.ward);
  // Do not show stale or partial patients as current patients or empty beds.
  const complete=results.filter(r=>!r.error&&!r.missing);
  const merged=CartWorkspaceCore.merge('',complete);
  autoSummary=results.map(r=>({...r,count:r.patients?.length||0}));
  globalThis.Handover?.acceptCapture(results,scenario);
  $('source').value=merged;
  if(!await convert())throw Error($('status').textContent||'資料尚未完成轉換，請重新讀取。');
  wsResults(results,ws.stop);
 }catch(e){
  globalThis.Handover?.clearCapture();$('source').value='';records=[];lastExcluded=[];autoSummary=null;
  for(const ward of selected)ws.unresolved.add(ward);render();
  wsResults(selected.map(ward=>({ward,error:e.message||'讀取失敗，請重試。'})),ws.stop);
 }finally{ws.busy=false;ws.stop=false;wsRenderWards();renderPrintBar();}
}
async function wsSwitchPreset(slot){
 if(wsBusy()||ws.locked||![0,1].includes(slot))return;
 ws.activeSlot=slot;ws.selected=new Set(ws.combos[slot]?.wards||[]);
 wsRenderWards();void wsSave();
 await (ws.connected?wsCapture():wsReconnect());
}
const originalAfterRender=afterRender,originalPrintBar=renderPrintBar;
renderPatientList=function(){
 const box=$('patientList');box.replaceChildren();
 const all=[...records,...lastExcluded.filter(t=>!records.includes(t))],q=ws.search.trim().toUpperCase(),groups=new Map();
 for(const text of all){
  const b=labelBed(text);
  if(q&&!text.toUpperCase().includes(q))continue;
  if(!groups.has(b.ward))groups.set(b.ward,[]);
  groups.get(b.ward).push({text,...b});
 }
 let shown=0;
 for(const [ward,items] of groups){
  const section=wsNode('details','pl-ward');section.open=!!q||ws.expanded.has(ward);section.dataset.ward=ward;
  section.addEventListener('toggle',()=>{if(!q){if(section.open)ws.expanded.add(ward);else ws.expanded.delete(ward);}});
  const summary=wsNode('summary');summary.append(wsNode('b','',ward),wsNode('span','',items.length+' 筆'));section.append(summary);
  const list=wsNode('div','patient-rows');
  for(const p of items){
   const vacant=isVacantLabel(p.text),selected=records.includes(p.text)&&!manualRemoved.has(p.text);
   const row=wsNode('label','patient-choice'+(!selected?' excluded':'')+(vacant?' vacant':''));
   const check=wsNode('input');check.type='checkbox';check.checked=selected;check.disabled=vacant||ws.busy||ws.locked||printBusy;
   check.setAttribute('aria-label','列印 '+ward+' '+p.bed+' '+(p.lines[1]||'空床'));
   check.dataset.label=p.text;
   check.onchange=async()=>{if(check.checked){manualRemoved.delete(p.text);dischargeDecisions.set(p.text,false);}else manualRemoved.add(p.text);await convert();};
   const detail=wsNode('span','patient-detail');
   const top=wsNode('span','patient-top');top.append(wsNode('strong','patient-bed',p.bed),wsNode('span','patient-name',p.lines[1]||vacantCaption(p.text)));
   detail.append(top,wsNode('span','patient-id',p.lines[2]||'空床'));row.append(check,detail);list.append(row);shown++;
  }
  section.append(list);box.append(section);
 }
 if(!shown)box.append(wsNode('p','list-empty',q?'找不到符合的病人':'擷取病房後，病人名單會出現在這裡。'));
};
renderPrintBar=function(){
 originalPrintBar();
 if(CART_TEST_MODE)$('printMain').textContent=pageCount()?'模擬列印 '+pageCount()+' 頁':'模擬列印';
 const blocked=ws.busy||ws.locked||ws.unresolved.size>0;
 $('printMain').disabled=$('print').disabled||blocked;
 if(blocked)$('printReason').textContent=ws.busy?'正在讀取本組病房，完成後可列印。':ws.locked?'工具目前無法開始新作業。':'部分病房尚未完整讀取，請先重試或移除。';
 $('workspaceTotals').textContent=records.length?patientCount()+' 位病人 · '+printItems().filter(x=>!x.omitted).length+' 張 · '+pageCount()+' 頁':'等待讀取病房';
};
afterRender=function(){originalAfterRender();document.querySelectorAll('.sheet').forEach(s=>{if(CART_TEST_MODE)s.dataset.test='true';});};
$('printMain').onclick=()=>{if(!$('printMain').disabled)$('print').click();};
const originalClear=$('clear').onclick;
$('clear').onclick=()=>{if(wsBusy()||ws.locked)return;globalThis.Handover?.clearCapture();originalClear();ws.unresolved.clear();ws.expanded.clear();autoSummary=null;$('captureReportBox').hidden=true;renderPrintBar();};
$('patientSearch').oninput=e=>{ws.search=e.target.value;renderPatientList();};
for(const [id,select] of [['selectVisible',true],['excludeVisible',false]]){
 $(id).onclick=async()=>{
  if(wsBusy()||ws.locked)return;
  for(const c of $('patientList').querySelectorAll('input[data-label]:not(:disabled)')){
   if(select){manualRemoved.delete(c.dataset.label);dischargeDecisions.set(c.dataset.label,false);}else manualRemoved.add(c.dataset.label);
  }
  await convert();
 };
}
$('captureStart').onclick=()=>void wsCapture();
$('captureReload').onclick=()=>void wsCapture();
$('captureStop').onclick=()=>{ws.stop=true;wsSetStatus('正在停止讀取…');};
$('reconnect').onclick=()=>void wsReconnect();$('sourcePortal').onclick=()=>void ws.services?.source();
if(CART_TEST_MODE){
 document.body.classList.add('test-mode');$('testBanner').hidden=false;$('testScenarioLabel').hidden=false;
 document.title='藥車標籤列印｜院外測試版';
 $('openTestHelp').onclick=()=>$('testHelpDialog').showModal();
 for(const id of ['closeTestHelp','testHelpDone'])$(id).onclick=()=>$('testHelpDialog').close();
 $('resetTest').onclick=async()=>{
  if(wsBusy())return;
  if(!confirm('重設這個測試元件的病房偏好、列印記憶與設定？正式工具不受影響。'))return;
  localStorage.clear();await chrome.storage.local.clear();location.reload();
 };
 for(const id of ['memLinkBtn','memUnlinkBtn','memImportBtn'])$(id).hidden=true;
 $('memFileStatus').textContent='測試版不連結外部列印記憶檔，可下載測試 TXT。';
 // Native print is used directly; handover.js owns the save choice and frozen job.
 const originalFormat=formatPrintTime;
 formatPrintTime=date=>'測試用 · 非臨床標籤　'+originalFormat(date);
}
globalThis.LabelWorkspace={
 report:wsReport,isBusy:wsBusy,stop:()=>{ws.stop=true;},setLocked:v=>{ws.locked=v;if(v&&ws.busy)ws.stop=true;wsControls();},
 reconnect:wsReconnect,connected:()=>ws.connected,capture:wsCapture,selectPreset:wsSwitchPreset,
 async start(services){
  ws.services=services;
  const prefs=(await chrome.storage.local.get(WS_PREF))[WS_PREF];
  if(prefs){ws.campus=prefs.campus||'健大';if(prefs.combos?.length===2)ws.combos=prefs.combos;}
  ws.activeSlot=wsDefaultSlot();
  ws.combos=['早上藥車','下午藥車'].map((name,i)=>({name,wards:[...new Set((ws.combos[i]?.wards||[]).filter(w=>typeof w==='string'))]}));
  ws.selected=new Set(ws.combos[ws.activeSlot].wards);
  wsRenderWards();afterRender();await wsReconnect();
 }
};
afterRender();

