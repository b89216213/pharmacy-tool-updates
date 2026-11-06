// Handover dates are independent from saved history. Only trustworthy saved bed
// states may suppress labels. This module never connects to an external service.
const HC=CartHandoverCore, PP=CartPrintPolicy, SR=CartSavedReceipt, HANDOVER_KEY='cart-handover-snapshots-v2', CALENDAR_KEY='cart-handover-calendar-v2';
const hs={captures:new Map(),selection:[],calendar:{},draft:null,storageError:false,modeDefaultsPending:true,receiptSuppressed:false};
const hDay=()=>CART_TEST_MODE&&HC.validDay($('handoverTestDay')?.value)?$('handoverTestDay').value:taiwanDay();
const hDate=day=>HC.validDay(day)?day.slice(5).replace('-','/')+'（'+'日一二三四五六'[new Date(day+'T00:00:00Z').getUTCDay()]+'）':'無可比對日期';
const hDates=()=>HC.previousDates(hDay(),hs.calendar,2);
const hKey=(day,ward)=>day+'|'+wardKey(ward);
function hLoad(){try{
 const value=JSON.parse(localStorage.getItem(HANDOVER_KEY)||'[]');if(!Array.isArray(value))throw Error();
 const floor=HC.shiftDay(hDay(),-89),saved=value.filter(s=>s&&HC.validDay(s.day)&&s.day>=floor&&typeof s.ward==='string');
 const existing=new Set(saved.map(s=>hKey(s.day,s.ward)));let old=[];
 try{old=PP.legacySnapshots(JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'));}catch{}
 return [...saved,...old.filter(s=>s.day>=floor&&!existing.has(hKey(s.day,s.ward)))];
}catch{hs.storageError=true;return [];}}
function hWrite(rows){
 const floor=HC.shiftDay(hDay(),-89),map=new Map();
 for(const s of rows)if(s&&!(s.version===1&&s.bedSource==='legacy-history')&&HC.validDay(s.day)&&s.day>=floor&&typeof s.ward==='string')map.set(hKey(s.day,s.ward),s);
 localStorage.setItem(HANDOVER_KEY,JSON.stringify([...map.values()]));hs.storageError=false;
}
function hFind(rows,day,ward){return rows.findLast(s=>s?.day===day&&wardKey(s.ward||'')===wardKey(ward));}
function hState(text){const {ward,bed,lines}=labelBed(text),vacant=isVacantLabel(text);return {bed,chart:vacant?'':chartId(lines[2]),text:HC.normalizeText(text),vacant};}
function hReadCalendar(){try{const saved=JSON.parse(localStorage.getItem(CALENDAR_KEY)||'{}');hs.calendar=Object.fromEntries(Object.entries(saved).filter(([d,v])=>HC.validDay(d)&&typeof v==='boolean'));}catch{hs.calendar={};}}
hReadCalendar();

// Records keep the complete acquired census. Print exclusions are decisions,
// never evidence that a bed is vacant. Vacancies are derived on every view.
prepareLabelRecords=function(text){
 const result=text.trim()?extractLabels(text,true):{labels:[],mode:'已取得完整在床名單。'};
 return {...result,vacancies:0,extra:0,excluded:0,usedPresets:false};
};

function hModes(groups){
 const available=groups.some(g=>PP.referenceUsable(g.snapshot,{day:g.referenceDay,ward:g.ward}));
 if(groups.length&&hs.modeDefaultsPending){
  $('modeUpdate').checked=available;$('modePatients').checked=!available;
  $('skipSame').checked=available;$('coverVacant').checked=available;hs.modeDefaultsPending=false;
 }
 if(!available&&$('modeUpdate').checked){$('modeUpdate').checked=false;$('modePatients').checked=true;$('skipSame').checked=false;$('coverVacant').checked=false;}
 const mode=$('modeUpdate').checked?'update':'patients';
 return {mode,available,skipSame:$('skipSame').checked,coverVacant:$('coverVacant').checked};
}
function hView(){
 const rows=hLoad(),dates=hDates(),groups=new Map(),omitted=new Set(),excluded=new Set();
 const referenceDay=HC.validDay(dates[1])&&dates[1]<hDay()?dates[1]:'';
 let nextIndex=records.length;
 records.forEach((text,index)=>{const {ward}=labelBed(text),key=wardKey(ward);if(!groups.has(key))groups.set(key,{ward,census:[]});groups.get(key).census.push({index,text,state:hState(text)});});
 for(const c of hs.captures.values())if(!groups.has(wardKey(c.ward)))groups.set(wardKey(c.ward),{ward:c.ward,census:[]});
 for(const g of groups.values()){g.referenceDay=referenceDay;g.snapshot=referenceDay?hFind(rows,referenceDay,g.ward):undefined;}
 const options=hModes([...groups.values()]);
 const chartLocations=new Map();for(const g of groups.values())for(const e of g.census)if(e.state.chart){if(!chartLocations.has(e.state.chart))chartLocations.set(e.state.chart,new Set());chartLocations.get(e.state.chart).add(wardKey(g.ward)+'|'+bedKey(e.state.bed));}
 const selectedChanged=hs.selection.length!==ws.selected.size||hs.selection.some(w=>!ws.selected.has(w));
 for(const g of groups.values()){
  const capture=hs.captures.get(wardKey(g.ward));
  const complete=!!(capture?.complete&&capture.day===hDay()&&capture.count===g.census.length);
  const derived=PP.deriveBeds(g.census.map(e=>e.state),g.snapshot,{day:referenceDay,ward:g.ward,captureComplete:complete});
  const byBed=new Map(g.census.map(e=>[bedKey(e.state.bed),e]));
  g.entries=derived.beds.map(state=>{
   const source=byBed.get(bedKey(state.bed));
   // A user may explicitly choose to treat a discharge candidate as vacant.
   // Manual exclusions leave the acquired occupancy unchanged.
   if(source&&lastExcluded.includes(source.text)&&!manualRemoved.has(source.text))state={bed:state.bed,chart:'',text:g.ward+'  '+state.bed,vacant:true};
   return {index:source?.index??nextIndex++,sourceText:source?.text||state.text,text:state.text,state};
  }).sort((a,b)=>bedKey(a.state.bed).localeCompare(bedKey(b.state.bed),'en',{numeric:true}));
  g.comparison=PP.compare(g.entries.map(e=>e.state),g.snapshot,{day:g.referenceDay,ward:g.ward,...options});
  g.blocked=!capture?.complete?'擷取不完整，請重新擷取或移除此病房':capture.day!==hDay()?'資料不是本次交車日擷取，請重新擷取':capture.count!==g.census.length?'在床名單筆數不符，請重新擷取':!derived.currentValid||!g.comparison.currentValid?'床位或病人資料重複／不完整，請重新核對':'';
  if(!g.blocked&&g.census.some(e=>e.state.chart&&chartLocations.get(e.state.chart)?.size>1))g.blocked='同一病歷號出現在多個床位，請重新擷取核對';
  g.capture=capture;g.manual=new Set();g.reused=0;g.patients=0;g.vacancies=0;
  g.actions=g.comparison.actions.map(action=>({...action}));
  for(const [i,e] of g.entries.entries()){
   const action=g.actions[i];
   if(manualRemoved.has(e.sourceText)){action.action='exclude';action.reason='manual';g.manual.add(e.index);}
   if(action.action==='reuse'){omitted.add(e.index);g.reused++;}
   else if(action.action==='exclude')excluded.add(e.index);
   else if(e.state.vacant)g.vacancies++;else g.patients++;
  }
 }
 return {groups:[...groups.values()],omitted,excluded,dates,options,selectedChanged,blocked:!referenceDay?'比對日期必須早於本次交車日，請調整交車日期':selectedChanged?'病房選擇已變更，請先擷取這一組病房':ws.unresolved.size?'有病房尚未完整擷取，請重試或移除':([...groups.values()].find(g=>g.blocked)?.blocked||''),need:[...groups.values()].reduce((n,g)=>n+g.patients+g.vacancies,0),reused:[...groups.values()].reduce((n,g)=>n+g.reused,0)};
}
function hItems(view){
 const items=[];let previousWard=null;
 for(const g of view.groups){
  const entries=g.entries.filter(e=>!view.excluded.has(e.index)&&!view.omitted.has(e.index));if(!entries.length)continue;
  if($('wardSeparators').checked&&previousWard!==null&&wardKey(g.ward)!==previousWard)items.push({text:g.ward,separator:true});
  for(const e of entries){const copies=typeof copiesFor==='function'?copiesFor(g.ward):1;
   for(let copy=0;copy<copies;copy++)items.push({text:e.text,separator:false,vacant:e.state.vacant,omitted:false,orig:e.text,record:e.index});
  }
  previousWard=wardKey(g.ward);
 }
 return items;
}
// Concrete items remain frozen across the save operation and native print dialog.
printItems=function(){return printJob?.handover&&printJob.items?printJob.items:hItems(hView());};
filteredView=function(){const v=hView(),list=v.groups.flatMap(g=>g.entries.filter(e=>!v.excluded.has(e.index)&&!v.omitted.has(e.index)).map(e=>e.text));return {list,omitted:new Set(),hidden:{dup:v.reused,vacant:0}};};
previewFilterOn=()=>$('modeUpdate').checked&&$('skipSame').checked;
filterInfoText=()=>'';
collapseOmitted=items=>items.filter(item=>!item.omitted);
omitMarkOn=()=>false;
omitMarkText=()=>'';
vacantCaption=text=>labelBed(text).ward+' '+labelBed(text).bed+' 空床請覆蓋';

function hStatus(snapshot,day,ward){
 if(!snapshot)return '無紀錄';
 if(PP.referenceUsable(snapshot,{day,ward}))return snapshot.version===1?'舊版紀錄，依床號與病歷號比對':snapshot.version>=3?'已儲存，可比對':'舊版完整紀錄，可比對';
 if(snapshot.status==='unsaved')return '僅列印，未儲存';
 if(snapshot.status==='saved')return '已儲存，資料不可比對';
 return '未完成／不可比對';
}
function hStatusDay(day,wards){if(!day)return '無日期';if(!wards.length)return '待擷取';const rows=hLoad(),good=wards.filter(w=>PP.referenceUsable(hFind(rows,day,w),{day,ward:w})).length,any=wards.filter(w=>hFind(rows,day,w)).length;return good===wards.length?'紀錄可比對':good?'部分可比對':any?'無可用紀錄':'無紀錄';}
function hNotice(text,warning=false){const box=$('handoverSummary');box.textContent=text;box.hidden=!text;box.classList.toggle('warning',warning);}
function hWardNames(groups){return groups.slice(0,2).map(g=>g.ward).join('、')+(groups.length>2?' 及其他 '+(groups.length-2)+' 個病房':'');}
function hUpdate(){
 const v=hView(),wards=v.groups.map(g=>g.ward),busy=wsBusy()||ws.locked;
 $('handoverToday').textContent=hDate(hDay());$('handoverToday').title='本次交車日期'+(CART_TEST_MODE?'（模擬日期）':'');
 $('handoverPrevious').textContent=hDate(v.dates[0]);$('handoverTarget').textContent=hDate(v.dates[1]);
 $('handoverPreviousStatus').textContent=hStatusDay(v.dates[0],wards);$('handoverTargetStatus').textContent=hStatusDay(v.dates[1],wards);
 const fallback=v.groups.filter(g=>v.options.mode==='update'&&g.comparison.mode==='patients');
 if(hs.printError&&hs.printError.context!==hContextKey(v))hs.printError=null;
 const summary=ws.locked?'工具暫時無法開始作業。':printBusy?'正在開啟列印…':wards.length&&v.blocked?v.blocked:hs.printError?.text|| (fallback.length?hWardNames(fallback)+' 無可用紀錄，本次只印在床病人。':v.groups.some(g=>g.manual.size)?'部分病人未選取，不會被記為已更新。':'');
 hNotice(summary,!!ws.locked||!!(wards.length&&v.blocked)||!!hs.printError||fallback.length>0);
 $('modeUpdate').disabled=busy||!v.options.available;$('modePatients').disabled=busy;
 $('skipSame').disabled=busy||v.options.mode!=='update';$('coverVacant').disabled=busy||v.options.mode!=='update';
 if($('modeAvailability')){const text=wards.length&&!v.options.available?'尚無可用紀錄，先列印在床病人。':'';$('modeAvailability').textContent=text;$('modeAvailability').hidden=!text;}
 $('handoverCounts').textContent=wards.length?'在床 '+patientCount()+' 位 · 空床 '+v.groups.reduce((n,g)=>n+g.entries.filter(e=>e.state.vacant).length,0)+' 床 · 沿用 '+v.reused+' 床 · 本次列印 '+v.need+' 床':'擷取病房後顯示比對結果。';
 $('handoverWardRows').replaceChildren();
 for(const g of v.groups){const row=wsNode('div','handover-ward-row'),mode=g.comparison.mode==='update'?'更新標籤':'在床病人';row.append(wsNode('b','',g.ward),wsNode('span','',g.blocked||(mode+' · '+hStatus(g.snapshot,g.referenceDay,g.ward)+' · '+hDate(g.referenceDay))),wsNode('small','',g.blocked?'暫停此病房':'沿用 '+g.reused+'／列印 '+(g.patients+g.vacancies)+(g.manual.size?'／未選 '+g.manual.size:'')));$('handoverWardRows').append(row);}
 for(const id of ['handoverCalendarOpen','handoverLogOpen','handoverTestDay'])if($(id))$(id).disabled=busy;
 $('memoryStatus').textContent='依日期與病房保存，保留近 90 天。';
 return v;
}
const hOriginalPrintBar=renderPrintBar;
renderSummary=function(){const box=$('summary');box.replaceChildren();box.hidden=true;};
function hRawCensus(group){return group.census.map(e=>({...e.state,note:labelNotes.get(e.text)||''}));}
function hContextKey(view){return JSON.stringify([hDay(),view.dates,view.options,[...ws.selected],view.groups.map(g=>[g.ward,g.capture?.at,hRawCensus(g),g.entries.map(e=>e.state),g.actions])]);}
function hSuppressReceipt(){hs.savedReceipt=null;hs.receiptSuppressed=true;return false;}
function hSavedFor(view){
 const receipt=hs.savedReceipt,rows=hLoad(),day=hDay();
 const ready=!view.blocked&&!dirty&&view.groups.length>0&&view.groups.length===ws.selected.size&&view.groups.every(g=>g.capture?.complete&&g.capture.day===day&&g.capture.count===g.census.length);
 if(receipt){
  if(!ready||receipt.context!==hContextKey(view)||receipt.rows.some(s=>JSON.stringify(hFind(rows,receipt.day,s.ward)||null)!==s.json))return hSuppressReceipt();
  return true;
 }
 // Restore only after a fresh complete acquisition. Session edits latch the
 // receipt off, even if the user switches back, until acquisition or saving.
 if(!ready||hs.receiptSuppressed||ws.busy||conversionBusy||printBusy)return false;
 const saved=view.groups.map(g=>({group:g,snapshot:hFind(rows,day,g.ward)}));
 if(!saved.every(({group:g,snapshot})=>SR.matches(snapshot,hRawCensus(g),{day,ward:g.ward,captureComplete:true,count:g.capture.count})))return false;
 hs.savedReceipt={context:hContextKey(view),day,rows:saved.map(({group:g,snapshot})=>({ward:g.ward,json:JSON.stringify(snapshot)}))};
 return true;
}
renderPrintBar=function(){
 hOriginalPrintBar();const v=hUpdate();
 const blocked=ws.busy||ws.locked||printBusy||!!v.blocked||dirty||!v.groups.length||!!$('layoutError').textContent;
 $('printMain').disabled=blocked;$('printMain').hidden=true;
 const active=printJob?.handover?printJob:null,hasOutput=active?active.labels>0:v.need>0;
 const items=active?.items||hItems(v),labels=hasOutput?items.length:0,pages=hasOutput?pagePlan(items.length).length:0;
 $('printOnly').disabled=blocked||!hasOutput;$('printAndSave').disabled=blocked;
 $('printAndSave').textContent=printBusy?'處理中…':hasOutput?'列印並儲存紀錄':'儲存本次紀錄';
 $('printPageCount').textContent=v.groups.length?'共 '+pages+' 頁':'';
 $('printSaveStatus').textContent=hSavedFor(v)?'已儲存本次紀錄':'';$('printSaveStatus').hidden=!$('printSaveStatus').textContent;
 const reason=dirty?'資料已變更，請重新讀取。':$('layoutError').textContent;
 $('printReason').textContent=reason;$('printReason').hidden=!reason;
 $('workspaceTotals').textContent=v.groups.length?labels+' 枚標籤':'';$('workspaceTotals').hidden=!v.groups.length;
};
const hOriginalAfterRender=afterRender;
afterRender=function(){hOriginalAfterRender();const v=hView(),states=new Map();for(const g of v.groups)for(const [i,e] of g.entries.entries())states.set(e.sourceText,{action:g.actions[i].action,manual:g.manual.has(e.index),vacant:e.state.vacant});for(const c of $('patientList').querySelectorAll('input[data-label]')){const s=states.get(c.dataset.label);if(!s)continue;const badge=wsNode('span','patient-action '+(s.action==='reuse'?'keep':s.vacant?'blank':''),s.manual?'未選，不貼':s.action==='reuse'?'沿用，不貼':s.action==='exclude'?'不列印':s.vacant?'空白覆蓋':'列印標籤');c.closest('label').querySelector('.patient-top')?.append(badge);}};
$('printMain').onclick=()=>{if(!$('printMain').disabled)void beginRememberedPrint();};
for(const id of ['modeUpdate','modePatients','skipSame','coverVacant'])$(id).addEventListener('change',()=>{if(wsBusy()||ws.locked)return;hSuppressReceipt();if(id==='modeUpdate'||id==='modePatients'){$('skipSame').checked=$('modeUpdate').checked;$('coverVacant').checked=$('modeUpdate').checked;}current=0;pageStarts=[0];render();});
$('patientList').addEventListener('change',event=>{if(event.target.matches('input[data-label]')&&!wsBusy())hSuppressReceipt();},true);
for(const id of ['selectVisible','excludeVisible'])$(id).addEventListener('click',()=>{if(!wsBusy())hSuppressReceipt();},true);
for(const [cardId,radioId] of [['updateModeCard','modeUpdate'],['patientsModeCard','modePatients']]){
 const card=$(cardId);if(card)card.addEventListener('click',event=>{if(event.target.closest('.mode-details,input,label,button,a,summary'))return;const radio=$(radioId);if(radio.disabled||radio.checked)return;radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));});
}
$('handoverForceFull').checked=false;$('handoverForceFull').disabled=true;

function hJob(view){
 const day=hDay(),rows=hLoad(),items=hItems(view).map(item=>Object.freeze({...item}));
 const jobs=view.groups.map(g=>{
  const today=hFind(rows,day,g.ward);
  return {ward:g.ward,beds:g.entries.map(e=>({...e.state})),census:hRawCensus(g),censusCount:g.capture.count,actions:g.actions.map(a=>({...a})),capturedAt:g.capture.at,referenceDay:g.referenceDay,snapshot:g.snapshot,recordSnapshot:today||g.snapshot,referenceJSON:JSON.stringify(g.snapshot||null),todayJSON:JSON.stringify(today||null)};
 });
 const labels=view.need?items.filter(item=>!item.omitted).length:0;
 return {handover:true,prompted:true,phase:'ready',context:hContextKey(view),alreadySaved:hSavedFor(view),day,jobs,items:Object.freeze(items),labels,pages:labels?pagePlan(items.length).length:0,referenceDates:view.dates.join('|'),calendarJSON:localStorage.getItem(CALENDAR_KEY),count:labels?items.filter(item=>!item.omitted&&!item.separator&&!item.vacant).length:0,vacancies:labels?items.filter(item=>!item.omitted&&item.vacant).length:0,saved:false};
}
function hReleasePrint(job,message='',warning=false){
 if(printJob!==job)return;
 printJob=null;printBusy=false;printSelection=null;printOmitted=new Set();
 if(warning)hs.printError={context:hContextKey(hView()),text:message};
 render();wsControls();if(message)$('status').textContent=message;
}
function hCheckJob(job,rows){
 if(job.calendarJSON!==localStorage.getItem(CALENDAR_KEY)){hReadCalendar();hs.modeDefaultsPending=true;throw Error('交車日期已由另一個視窗更新，請重新核對後列印。');}
 if(job.day!==hDay()||job.referenceDates!==hDates().join('|'))throw Error('交車日期已改變，請重新核對後列印。');
 for(const g of job.jobs){
  if(!HC.validDay(g.referenceDay)||g.referenceDay>=job.day||g.referenceDay!==hDates()[1])throw Error('比對日期必須是本次交車前第二次交車日，請重新核對。');
  if(JSON.stringify(hFind(rows,g.referenceDay,g.ward)||null)!==g.referenceJSON||JSON.stringify(hFind(rows,job.day,g.ward)||null)!==g.todayJSON)throw Error('交車紀錄已由另一個視窗更新，請重新核對後列印。');
 }
}
async function hPrintChoice(save){
 const job=printJob;if(!job?.handover||job.phase!=='ready')return;
 job.phase='committing';$('printAndSave').disabled=true;$('printOnly').disabled=true;
 try{
  const rows=hLoad();hCheckJob(job,rows);const now=new Date().toISOString();
  if(save){
   // Comparison always uses the selected prior date. Recording preserves the
   // latest known physical state of any bed that was not printed this time.
   const saved=job.jobs.map(g=>{
    const snapshot=PP.record(g.recordSnapshot,g.beds,{day:job.day,ward:g.ward,capturedAt:g.capturedAt,savedAt:now,actions:g.actions.map(a=>({...a,action:a.action==='print'?'print':'exclude'})),captureComplete:true});
    snapshot.censusProof=SR.create(snapshot,g.census,{day:job.day,ward:g.ward,captureComplete:true,count:g.censusCount});return snapshot;
   });
   hWrite([...rows,...saved]);job.saved=true;hs.receiptSuppressed=false;hs.savedReceipt={context:job.context,day:job.day,rows:saved.map(s=>({ward:s.ward,json:JSON.stringify(s)}))};
   hs.calendar[job.day]=true;localStorage.setItem(CALENDAR_KEY,JSON.stringify(hs.calendar));
  }else if(!job.alreadySaved){
   // Reprinting the same saved job leaves its record and receipt untouched.
   // A different unsaved job may change physical stickers, so it cannot leave
   // an older record looking like the latest saved decision.
   const invalidated=job.jobs.map(g=>{
    const previous=hFind(rows,job.day,g.ward);
    return previous?{...previous,status:'unsaved',invalidatedAt:now}:{version:4,day:job.day,ward:g.ward,status:'unsaved',beds:[],bedSource:'census-history',captureComplete:false,invalidatedAt:now};
   });
   hWrite([...rows,...invalidated]);hSuppressReceipt();
  }
 }catch(error){
  hReleasePrint(job,job.saved?'交車紀錄已儲存，但未能開啟列印：'+error.message:'尚未開啟列印：'+error.message,true);return;
 }
 job.phase='printing';render();
 if(!job.labels){hReleasePrint(job,'已儲存本次交車紀錄。');return;}
 try{
  if(document.fonts)await document.fonts.ready;
  if(printJob!==job)return;
  updatePrintStamps();window.print();
  // Chrome's native dialog blocks until it closes. The afterprint listener also
  // releases on return; both routes are idempotent and never alter saved data.
  if(printJob===job)hReleasePrint(job,save?'已儲存本次交車紀錄。':'本次只列印，未儲存交車紀錄。');
 }catch(error){hReleasePrint(job,save?'交車紀錄已儲存；列印未開啟，紀錄仍保留。':'未能開啟列印；本次病人內容未儲存。',true);}
}
beginRememberedPrint=async function(save=true){
 if(printBusy||ws.busy||ws.locked)return;
 hs.printError=null;
 hReadCalendar();
 const view=hView();if(view.blocked||!view.groups.length||dirty||$('layoutError').textContent){renderPrintBar();return;}
 const job=hJob(view);if(!save&&!job.labels)return;
 printJob=job;printBusy=true;printSelection=[...records];printOmitted=new Set(view.omitted);
 render();wsControls();await hPrintChoice(save);
};
$('printAndSave').onclick=()=>void beginRememberedPrint(true);$('printOnly').onclick=()=>void beginRememberedPrint(false);
window.addEventListener('afterprint',()=>{const job=printJob;if(job?.handover&&job.phase==='printing')hReleasePrint(job,job.saved?'已儲存本次紀錄。':'本次只列印，未儲存交車紀錄。');});
// Compatibility only: no second completion dialog and no save on afterprint.
finishRememberedPrint=async function(){};

// Legacy records do not prove a complete cart state. Keep them isolated and never
// silently upgrade them; expose only new complete records to the bed-list helper.
readHistory=function(){return hLoad().filter(s=>PP.referenceUsable(s,{day:s.day,ward:s.ward})).flatMap(s=>s.beds.filter(b=>s.version===2||b.known).map(b=>({day:s.day,ward:s.ward,bed:b.bed,...(b.vacant?{vacant:true}:{account:b.chart})})));};
updateMemoryStatus=function(){if($('handoverToday'))hUpdate();return readHistory();};
clearPrintHistory=function(){if(printBusy)return;localStorage.removeItem(HANDOVER_KEY);localStorage.removeItem(HISTORY_KEY);$('clearMemoryDialog').close();render();$('status').textContent='已清除交車紀錄，交車日曆與病房組合保留。';};

function hOpenLog(){
 $('handoverLogRows').replaceChildren();const rows=hLoad().sort((a,b)=>b.day.localeCompare(a.day)||a.ward.localeCompare(b.ward));
 for(const s of rows){const row=wsNode('div','handover-log-row');row.append(wsNode('strong','',hDate(s.day)+'　'+s.ward+'　'+hStatus(s,s.day,s.ward)),wsNode('small','',(s.beds?.length||0)+' 個床位 · '+((s.savedAt||s.confirmedAt)?'儲存時間 '+new Date(s.savedAt||s.confirmedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'未儲存可比對資料')));$('handoverLogRows').append(row);}
 if(!rows.length)$('handoverLogRows').textContent='尚無交車紀錄。選擇「列印並儲存」即可保存。';
 $('handoverLog').showModal();
}
$('handoverLogOpen').onclick=hOpenLog;$('handoverLogClose').onclick=()=>$('handoverLog').close();
$('handoverLogDownload').onclick=()=>downloadPresetText(JSON.stringify({format:'cart-handover-v4',calendar:hs.calendar,snapshots:hLoad()},null,2),'藥車交車紀錄_'+hDay()+'.json');

function hCalendarRender(){
 const end=$('handoverCalendarEnd').value;if(!HC.validDay(end))return;
 $('handoverCalendarDays').replaceChildren();
 for(let i=20;i>=0;i--){const day=HC.shiftDay(end,-i),label=wsNode('label','handover-calendar-day'),check=wsNode('input');check.type='checkbox';check.checked=HC.isHandover(day,hs.draft);check.dataset.day=day;check.setAttribute('aria-label',day+' 有交車');check.onchange=()=>{hs.draft[day]=check.checked;hCalendarPreview();};label.append(wsNode('span','',hDate(day)),check,wsNode('small','',hLoad().some(s=>s.day===day)?'有儲存紀錄':'無儲存紀錄'));$('handoverCalendarDays').append(label);}
 hCalendarPreview();
}
function hCalendarPreview(){const d=HC.previousDates(hDay(),hs.draft);$('handoverCalendarPreview').textContent='上次交車：'+hDate(d[0])+'；本次比對：'+hDate(d[1])+'。勾選日期不代表已有可用的列印紀錄。';}
$('handoverCalendarOpen').onclick=()=>{if(wsBusy())return;hs.draft={...hs.calendar};$('handoverCalendarEnd').value=hDay();$('handoverCalendarEnd').max=hDay();hCalendarRender();$('handoverCalendar').showModal();};
$('handoverCalendarEnd').onchange=hCalendarRender;
$('handoverCalendarCancel').onclick=()=>$('handoverCalendar').close();
$('handoverCalendarDefaults').onclick=()=>{const end=$('handoverCalendarEnd').value;for(let i=0;i<21;i++)delete hs.draft[HC.shiftDay(end,-i)];hCalendarRender();};
$('handoverCalendarSave').onclick=()=>{if(wsBusy())return;try{localStorage.setItem(CALENDAR_KEY,JSON.stringify(hs.draft));hs.calendar={...hs.draft};hs.modeDefaultsPending=true;$('handoverCalendar').close();current=0;render();}catch{$('handoverCalendarPreview').textContent='無法儲存交車日期，請再試一次。';}};

globalThis.Handover={
 day:hDay,view:hView,storeKey:HANDOVER_KEY,calendarKey:CALENDAR_KEY,
 acceptCapture(results,scenario){
  hs.selection=[...ws.selected];for(const key of hs.captures.keys())if(!hs.selection.some(w=>wardKey(w)===key))hs.captures.delete(key);
  hs.savedReceipt=null;hs.receiptSuppressed=false;
  for(const r of results)hs.captures.set(wardKey(r.ward),{ward:r.ward,day:hDay(),at:new Date().toISOString(),count:r.total,complete:!r.error&&!r.missing&&Array.isArray(r.patients)&&Number.isInteger(r.total)&&r.total>=0&&r.patients.length===r.total});
  hs.modeDefaultsPending=true;
 },
 removeWard(ward){hs.captures.delete(wardKey(ward));},
 clearCapture(){hs.savedReceipt=null;hs.receiptSuppressed=false;hs.captures.clear();hs.selection=[];hs.modeDefaultsPending=true;},
};

// Remove obsolete manual-input and history controls while retaining hidden DOM
// anchors used by the original label renderer and its print geometry.
$('rawFold').hidden=true;$('source').readOnly=true;
$('selectionTools').append($('clear'));
$('previewFiltered').closest('label').hidden=true;
for(const id of ['appendHis','vacantBedOutside','omitMarks','useBedPresets']){const label=$(id).closest('label');if(label){label.hidden=true;if(label.nextElementSibling?.tagName==='P')label.nextElementSibling.hidden=true;}}
$('useBedPresetsSide').disabled=true;
$('useBedPresetsSide').style.display='none';$('presetWards').hidden=true;
$('presetSideHistory').hidden=true;
$('presetSettings').hidden=true;bedPresets=[];presetSelection=new Set();
$('vacantBedOutside').checked=true;$('omitMarks').checked=false;$('useBedPresets').checked=false;syncPresetSide();
const memorySection=$('clearMemory').closest('section');
for(const child of [...memorySection.children])child.hidden=true;
const note=wsNode('p','handover-settings-note','交車日期與比對結果請看主畫面「比對明細」。');
const memoryClear=$('clearMemory'),memoryStatus=$('memoryStatus'),memoryHeading=wsNode('div','section-title');memoryHeading.append(wsNode('h3','','交車紀錄'),memoryClear);memoryClear.hidden=false;memoryStatus.hidden=false;
const backupButton=wsNode('button','','下載交車紀錄備份');backupButton.type='button';backupButton.onclick=()=>$('handoverLogDownload').click();
memorySection.append(memoryHeading,note,memoryStatus,backupButton);
const settingsHint=$('settingsDialog').querySelector(':scope > p');if(settingsHint)settingsHint.textContent='病房組合、字體與交車紀錄會保存在此瀏覽器；版面微調可依印表機調整。';
for(const heading of $('settingsDialog').querySelectorAll('h3'))if(heading.textContent==='接收與排列')heading.textContent='標籤排列與張數';
$('clearMemory').textContent='清除交車紀錄';$('clearMemoryTitle').textContent='清除交車紀錄？';
const clearDescription=$('clearMemoryDialog').querySelector('p');if(clearDescription)clearDescription.textContent='清除後會先列印在床病人，直到重新儲存可比對的交車紀錄。病房組合、交車日曆與字體設定會保留。';
$('closeSettings').onclick=async()=>{$('settingsDialog').close();if(dirty&&hs.captures.size)await convert();else render();};
if(CART_TEST_MODE){
 const label=wsNode('label','test-date-label','模擬交車日'),input=wsNode('input');input.id='handoverTestDay';input.type='date';input.value=taiwanDay();input.onchange=()=>{if(!HC.validDay(input.value))input.value=taiwanDay();hs.modeDefaultsPending=true;render();};label.append(input);($('testControls')||$('testHelpDialog')).append(label);
}
window.addEventListener('storage',e=>{if([HANDOVER_KEY,HISTORY_KEY,CALENDAR_KEY,null].includes(e.key)){if(e.key!==HANDOVER_KEY){hReadCalendar();hs.modeDefaultsPending=true;}if(!printBusy)render();}});
render();

// The original linked TXT keeps its identity-only format. New detailed records
// remain in their own store; external edits invalidate only affected saved wards.
(() => {
 const key=r=>hKey(r.day,r.ward);
 const group=rows=>{const m=new Map();for(const r of retainedHistory(rows)){const k=key(r);if(!m.has(k))m.set(k,[]);m.get(k).push(JSON.stringify([wardKey(r.ward),bedKey(r.bed),r.vacant?'':r.account,!!r.vacant]));}return new Map([...m].map(([k,v])=>[k,JSON.stringify(v.sort())]));};
 memStoredRows=()=>readHistory();
 // Transfers can leave the same MRN on two physical beds. Preserve both, and
 // retain contradictory same-bed identities for the policy to mark unknown.
 memRowKey=r=>JSON.stringify([r.day,wardKey(r.ward),bedKey(r.bed),r.vacant?'':r.account,!!r.vacant]);
 memSaveRows=rows=>{
  const next=retainedHistory(rows),before=group(readHistory()),after=group(next);
  const originalRaw=localStorage.getItem(HISTORY_KEY);
  const raw=JSON.parse(localStorage.getItem(HANDOVER_KEY)||'[]');
  if(!Array.isArray(raw))throw Error('交車紀錄格式異常，未套用 TXT。');
  const kept=raw.filter(s=>s?.status!=='saved'||before.get(key(s))===after.get(key(s)));
  // A TXT edit is an explicit replacement. Roll back the first write if saving
  // the detailed-store invalidation fails, so the two views cannot disagree.
  localStorage.setItem(HISTORY_KEY,JSON.stringify(next));
  try{localStorage.setItem(HANDOVER_KEY,JSON.stringify(kept));}
  catch(e){originalRaw===null?localStorage.removeItem(HISTORY_KEY):localStorage.setItem(HISTORY_KEY,originalRaw);throw e;}
  hs.savedReceipt=null;hs.receiptSuppressed=true;
 };
 const originalText=memoryText;
 memoryText=(rows=memStoredRows(),today=taiwanDay())=>originalText(rows,today)
  .replace(/# 保留 .*?\r?\n/, '# 保留 90 天。依主畫面指定的前兩次實際交車日比對；TXT 僅保存日期、床號與病歷號。\r\n')
  .replace(/今天（[^）]*）列印比對：[^\r\n]*/, '今天（'+today+'）列印比對：'+hDates()[1])
  .replace(/　← 今天列印比對此日/g,'');
 const section=$('clearMemory').closest('section'),fold=document.createElement('details');
 fold.id='legacyMemorySettings';
 const summary=document.createElement('summary');summary.textContent='舊版列印記憶 TXT';fold.append(summary);
 const note=document.createElement('p');note.textContent='可沿用原本連結的記憶檔；只保存日期、床號與病歷號。完整交車資料請使用上方備份。';fold.append(note);
 for(const id of ['memFileStatus','memLinkBtn','memUnlinkBtn','memDownloadBtn','memImportBtn','memImportFile']){const el=$(id);if(el){el.hidden=id==='memImportFile';fold.append(el);}}
 section.append(fold);memRender();
 const print=beginRememberedPrint;let preparing=false;
 beginRememberedPrint=async(save=true)=>{
  if(preparing||printBusy||ws.busy||ws.locked)return;
  preparing=true;
  try{
   if(globalThis.CartMemoryReady)await globalThis.CartMemoryReady;
   if(memDir){const r=await memorySync({gesture:true});if(r?.error){hs.printError={context:hContextKey(hView()),text:'舊版記憶檔尚未完成同步，請在設定的「舊版列印記憶 TXT」確認。'};renderPrintBar();return;}}
   await print(save);
   if(memDir&&hs.savedReceipt&&save){const r=await memorySync({write:true,pull:false});if(r?.error)$('status').textContent='交車紀錄已儲存在本機；舊版 TXT 尚未同步，請在設定中重試。';}
  }finally{preparing=false;}
 };
 const clear=clearPrintHistory;
 clearPrintHistory=function(){if(printBusy)return;clear();if(memDir)void memorySync({write:true,pull:false,gesture:true});};
 $('clearMemoryConfirm').onclick=clearPrintHistory;
})();
