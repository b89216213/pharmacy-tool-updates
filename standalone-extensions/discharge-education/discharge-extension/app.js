
'use strict';
// Patient parsing stays local; explicit saved lists are handled by education.js.
const DischargeParser = (() => {
  const DAY = 86400000;
  const pad = n => String(n).padStart(2, '0');
  function dateUTC(y,m,d) {
    if (y < 1900 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const x = new Date(Date.UTC(y,m-1,d));
    return x.getUTCFullYear() === y && x.getUTCMonth() === m-1 && x.getUTCDate() === d ? x.getTime() : null;
  }
  function fromISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? dateUTC(+m[1],+m[2],+m[3]) : null;
  }
  function iso(t) { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`; }
  function displayDate(t) { return iso(t).replace(/-/g,'/'); }
  function parseDate(s, base) {
    const n = s.replace(/\s+/g,'');
    let m = /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/.exec(n) || /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/.exec(n);
    if (m) return dateUTC(+m[1],+m[2],+m[3]);
    m = /^(\d{1,2})[\/-](\d{1,2})$/.exec(n) || /^(\d{1,2})月(\d{1,2})日?$/.exec(n);
    if (!m) return null;
    const y = new Date(base).getUTCFullYear();
    const candidates = [y-1,y,y+1].map(yr=>dateUTC(yr,+m[1],+m[2])).filter(v=>v !== null);
    candidates.sort((a,b)=>Math.abs(a-base)-Math.abs(b-base) || a-b);
    return candidates.length ? candidates[0] : null;
  }
  function normalize(s) {
    return String(s).replace(/[\uFF01-\uFF5E]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();
  }
  const datePattern = '(?:\\d{4}\\s*[/.\\-]\\s*\\d{1,2}\\s*[/.\\-]\\s*\\d{1,2}|\\d{4}\\s*年\\s*\\d{1,2}\\s*月\\s*\\d{1,2}\\s*日?|\\d{1,2}\\s*[/\\-]\\s*\\d{1,2}|\\d{1,2}\\s*月\\s*\\d{1,2}\\s*日?)';
  const phrasePattern = '(?:可\\s*出\\s*院|預\\s*計\\s*出\\s*院|預\\s*定\\s*出\\s*院)';
  function extractDate(note, base) {
    const phrase = new RegExp(phrasePattern,'g');
    const phrases = [...note.matchAll(phrase)];
    if (!phrases.length) return {kind:'none'};
    const dates=[];
    for (const p of phrases) {
      const before=note.slice(0,p.index), after=note.slice(p.index+p[0].length);
      const left = new RegExp('('+datePattern+')\\s*(?:可於|預計|預定)?\\s*$').exec(before);
      const right = new RegExp('^\\s*[:：]?\\s*(?:於\\s*)?('+datePattern+')(?![\\d/.-])').exec(after);
      // Prefer an immediately preceding date, e.g. 10/02可出院.
      const hit=left || right;
      if (!hit) return {kind:'none'};
      if (left) {
        const prefix = before.slice(0,left.index).trim();
        if (/[\d/.-]$/.test(prefix) || /[~～至到、與及]$/.test(prefix)) return {kind:'review',reason:'日期不完整或包含多日範圍，請確認'};
      } else {
        const tail=after.slice(right[0].length).trim();
        if (/^[~～至到、與及]/.test(tail)) return {kind:'review',reason:'包含多日範圍，請確認'};
      }
      const t=parseDate(hit[1],base);
      if (t===null) return {kind:'review',reason:'出院日期無效，請確認月、日是否正確'};
      dates.push(t);
    }
    // Review ambiguous dated notes; undated rows have already been skipped.
    if (/(?:不|未|暫不|尚不)\s*(?:能|可|宜)\s*出\s*院|(?:無法|不能|暫緩|延後|取消|待定|視情況|若|如果|可能|不一定|待評估|需評估|再評估)|[?？]/.test(note)) {
      return {kind:'review',reason:'出院備註含否定、條件或變更語意，請確認'};
    }
    const unique=[...new Set(dates)];
    if (unique.length!==1) return {kind:'review',reason:'同一筆資料出現不同出院日期，請確認'};
    return {kind:'date',date:unique[0]};
  }
  function parse(text, base) {
    const flat=normalize(text);
    const matches=[...flat.matchAll(/\b\d{2}[A-Z]\d{8}\b/gi)];
    const byAccount=new Map(), issues=[];
    let parsedRows=0;
    for(let i=0;i<matches.length;i++){
      const a=matches[i], account=a[0].toUpperCase();
      const chunk=flat.slice(a.index+a[0].length,i+1<matches.length ? matches[i+1].index : flat.length).trim();
      // Department / ward / room / bed / name / sex / age ...
      const row=/^(.+?)\s+([0-9][A-Z0-9]{1,9})\s+([A-Z0-9]{1,4})\s+([A-Z0-9]{1,4})\s+(.+?)\s+([MF男女])(?=\s|$)(.*)$/i.exec(chunk);
      if (!row) {issues.push({account,reason:'無法辨識病房、病室、病床、姓名等欄位，請確認是否貼上完整列'});continue;}
      parsedRows++;
      const patient={account,ward:row[2],room:row[3],bed:row[4],name:row[5].trim()};
      patient.bedNumber=[patient.ward,patient.room,patient.bed].join('-');
      // Drop the age and admission-date columns, then use the dated discharge note.
      // Ward-list status is neither required nor used to filter patients.
      const note=row[7].replace(/^\s*\d+y\d+m\s+\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2}(?=\s|$)/i,'')
        .split(/\s+(?:查|選|報告查詢|錯誤回報)(?=\s|$)/)[0].trim();
      const result=extractDate(note,base);
      patient.result=result;
      if(!byAccount.has(account)) byAccount.set(account,[]);
      byAccount.get(account).push(patient);
    }
    const patients=[];let duplicates=0;
    for(const group of byAccount.values()){
      duplicates+=group.length-1;
      const first=group[0];
      const signatures=new Set(group.map(p=>JSON.stringify([p.bedNumber,p.name,p.result.kind,p.result.date || null,p.result.reason || null])));
      if(signatures.size>1){issues.push({...first,reason:'相同帳號出現不同床號、姓名或出院標註，請以最新清單核對'});continue;}
      if(first.result.kind==='review'){issues.push({...first,reason:first.result.reason});continue;}
      if(first.result.kind==='date') patients.push({...first,date:first.result.date});
    }
    patients.sort(compareBeds);
    const uniqueIssues=[...new Map(issues.map(x=>[x.account+'|'+x.reason,x])).values()];
    return {patients,issues:uniqueIssues,total:byAccount.size,parsedRows,duplicates,accountMatches:matches.length};
  }
  function filter(patients,base,days,includeToday=false){return patients.filter(p=>p.date>=base+(includeToday?0:1)*DAY && p.date<=base+days*DAY);}
  function compareBeds(a,b){return a.bedNumber.localeCompare(b.bedNumber,'en',{numeric:true,sensitivity:'base'})||a.account.localeCompare(b.account);}
  return {DAY,fromISO,iso,displayDate,parseDate,extractDate,parse,filter,compareBeds};
})();
window.DischargeParser=DischargeParser;
window.PatientDetails=new Map();
const $=id=>document.getElementById(id);
let selectedDays=1, visibleRows=[], debounce;
const P=DischargeParser;
function todayISO(){return window.DischargeIncremental.day();}
function notice(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
function addCell(tr,text,className){const td=document.createElement('td');td.textContent=text;if(className)td.className=className;tr.appendChild(td);return td;}
function pickupTime(pickup,kind,separator='、'){
  const times=pickup[kind+'Times']||[],known=pickup[kind+'TimeKnown'];
  return times.length?times.join(separator)+(known?'':'（部分未確認）'):known?'無紀錄':'未確認';
}
function refresh(){
  clearTimeout(debounce);notice('');
  const base=P.fromISO($('baseDate').value), input=$('source').value;
  visibleRows=[];$('rows').replaceChildren();$('reviewList').replaceChildren();
  $('inputStat').textContent=input.trim()?`${input.length.toLocaleString()} 個字元`:'尚未貼上資料';
  const valid=base!==null;
  $('baseDate').setAttribute('aria-invalid',String(!valid));
  const start=valid?base+($('includeToday').checked?0:1)*P.DAY:null;
  const end=valid?base+selectedDays*P.DAY:null;
  const range=valid?(start===end?P.displayDate(start):`${P.displayDate(start)} ～ ${P.displayDate(end)}`):'請設定有效的基準日期';
  $('rangeLabel').textContent=range;
  const title=selectedDays===1&&!$('includeToday').checked?'明天可出院':`${selectedDays} 天內可出院`;
  $('resultHeading').textContent=title+($('includeToday').checked?'（含當天）':'');
  $('printMeta').textContent=valid?`基準日期：${P.displayDate(base)}　篩選範圍：${range}`:'';
  const data=valid&&input.trim()?P.parse(input,base):null;
  if(data)visibleRows=P.filter(data.patients,base,selectedDays,$('includeToday').checked);
  visibleRows=visibleRows.map(row=>{
    const d=window.PatientDetails.get(row.account),matches=d&&d.name===row.name&&d.bedNumber===row.bedNumber;
    return {...row,mrn:matches?d.mrn:'未擷取',sex:matches&&/^[FM]$/.test(d.sex)?d.sex:'',drugStatus:matches?d.drugStatus:'未確認',pickups:matches?(d.pickups||[]):[],pickupComplete:!!(matches&&d.pickupComplete)};
  });
  visibleRows=window.DischargeDaily?.project(visibleRows)||visibleRows;
  for(const row of visibleRows){
    const tr=document.createElement('tr');
    const detail=window.PatientDetails.get(row.account);
    row.mrn=detail&&detail.name===row.name&&detail.bedNumber===row.bedNumber?detail.mrn:'未擷取';
    row.drugStatus=detail&&detail.name===row.name&&detail.bedNumber===row.bedNumber?detail.drugStatus:'未確認';
    const detailMatches=detail&&detail.name===row.name&&detail.bedNumber===row.bedNumber;
    row.sex=detailMatches&&/^[FM]$/.test(detail.sex)?detail.sex:'';
    // Preserve the incremental pickup selection prepared above.
    row.pickupComplete=!!(detailMatches&&detail.pickupComplete);
    addCell(tr,row.bedNumber,'bed');addCell(tr,displayPatientName(row));addCell(tr,row.mrn,'account');
    const dateCell=addCell(tr,'');const badge=document.createElement('span');badge.className='date-badge';badge.textContent=P.displayDate(row.date);dateCell.appendChild(badge);
    const when=document.createElement('span');when.className='date-note';const d=(row.date-base)/P.DAY;when.textContent=d===0?'基準日當天':d===1?'基準日隔天':`基準日後第 ${d} 天`;dateCell.appendChild(when);
    const pickupCell=addCell(tr,'','pickup-cell');
    if(row.drugStatus==='未確認'&&detailMatches&&detail.reason)pickupCell.title=detail.reason;
    for(const pickup of row.pickups){
      const entry=document.createElement('div');entry.className='pickup-entry';entry.dataset.orderDate=pickup.orderDate||'';
      const number=document.createElement('span');number.className='pickup-number';number.textContent=pickup.number;
      const state=document.createElement('span');state.className='pickup-state';state.textContent=pickup.status;
      const heading=document.createElement('div');heading.append(number,document.createTextNode(' · '),state);
      const delivery=document.createElement('div');delivery.className='pickup-time delivery-time';delivery.textContent='刷出：'+pickupTime(pickup,'delivery');
      const print=document.createElement('div');print.className='pickup-time print-time';print.textContent='列印：'+pickupTime(pickup,'print');
      if(pickup.reason)entry.title=pickup.reason;
      entry.append(heading,delivery,print);pickupCell.appendChild(entry);
    }
    if(!row.pickups.length)pickupCell.textContent=row.drugStatus==='無'?'無':row.drugStatus==='有'?'領藥號未確認':'未確認';
    else if(!row.pickupComplete){const note=document.createElement('div');note.className='pickup-warning';note.textContent='領藥號清單可能未完整';pickupCell.appendChild(note);}
    addCell(tr,'','print-only handwriting');addCell(tr,'','print-only remarks');
    $('rows').appendChild(tr);
  }
  $('count').textContent=`${visibleRows.length} 人`;
  $('stats').textContent=data?`辨識 ${data.total} 位病人 · 明確出院日期 ${data.patients.length} 人 · 符合範圍 ${visibleRows.length} 人${data.duplicates?` · 已合併 ${data.duplicates} 筆重複資料`:''}`:'依備註日期整理，結果按床號排序。';
  $('tableSection').hidden=!visibleRows.length;$('empty').hidden=!!visibleRows.length;
  for(const id of ['copy','csv','print'])$(id).disabled=!visibleRows.length;
  if(!valid){$('emptyTitle').textContent='請選擇基準日期';$('emptyHint').textContent='設定日期後，會立即重新計算 1～7 天內的出院名單。';}
  else if(!input.trim()){$('emptyTitle').textContent='貼上清單，名單就準備好了';$('emptyHint').textContent='在左側貼上住院清單，再選擇需要查看的天數。';}
  else if(!data.total){$('emptyTitle').textContent='尚未辨識到完整病人資料';$('emptyHint').textContent='請貼上包含帳號、病房、病室、病床、姓名及出院日期備註的完整清單。';}
  else{$('emptyTitle').textContent='所選範圍內沒有符合的病人';$('emptyHint').textContent=`篩選範圍：${range}。可調整天數或基準日期${data.issues.length?'，並檢查下方待核對項目':''}。`;}
  $('review').hidden=!data || !data.issues.length;
  if(data&&data.issues.length){$('reviewTitle').textContent=`待核對 ${data.issues.length} 筆（未自動列入名單）`;for(const issue of data.issues){const li=document.createElement('li');li.textContent=[issue.bedNumber,issue.name,issue.account].filter(Boolean).join(' ／ ')+'：'+issue.reason;$('reviewList').appendChild(li);}}
}
const headings=['床號','姓名','病歷號','出院日期','領藥號／狀態','刷出時間','列印時間'];
function displayPatientName(row){return row.sex?`${row.name} ${row.sex}`:row.name;}
function tableData(){return [headings,...visibleRows.flatMap(r=>{
  const patient=[r.bedNumber,displayPatientName(r),r.mrn,P.displayDate(r.date)];
  const entries=r.pickups.map(p=>[...patient,p.number+' · '+p.status,pickupTime(p,'delivery','；'),pickupTime(p,'print','；')]);
  if(!entries.length)entries.push([...patient,r.drugStatus==='無'?'無':r.drugStatus==='有'?'領藥號未確認':'未確認',r.drugStatus==='無'?'無紀錄':'未確認',r.drugStatus==='無'?'無紀錄':'未確認']);
  else if(!r.pickupComplete)entries.push([...patient,'其他領藥號未確認','未確認','未確認']);
  return entries;
})];}
function safeExportCell(s){return /^[=+@\-]/.test(s)?"'"+s:s;}
async function copyTable(){
  if(!visibleRows.length)return;
  const text=tableData().map(r=>r.map(safeExportCell).join('\t')).join('\r\n');
  let success=false;
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);success=true;}}catch(e){}
  if(!success){const helper=document.createElement('textarea');helper.value=text;helper.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(helper);helper.focus();helper.select();try{success=document.execCommand('copy');}catch(e){}helper.remove();$('copy').focus();}
  notice(success?'已複製表格，可直接貼到 Excel。':'瀏覽器未允許複製。請改用「下載 CSV」，或選取表格後按 Ctrl + C。',!success);
}
function downloadCSV(){
  if(!visibleRows.length)return;
  const csv='\uFEFF'+tableData().map(r=>r.map(v=>'"'+safeExportCell(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`出院名單_${$('baseDate').value}_${selectedDays}天內${$('includeToday').checked?'_含當天':''}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  notice('已產生 CSV，可使用 Excel 開啟。');
}
function demoText(){
  const base=P.fromISO($('baseDate').value)||P.fromISO(todayISO());
  const md=days=>P.iso(base+days*P.DAY).slice(5).replace('-','/');
  const admission=P.displayDate(base-5*P.DAY);
  return `以下皆為虛構資料，僅供試用\n病房清單\n帳號 科別 病房 病室 病床 姓名 性別 年齡 入 出 狀態\n選 Note 26X00000001 示範科 05W1 01 01 範例甲 F 50y0m ${admission} 住院中 ${md(1)}可出院 查 ！\n選 Note 26X00000002 示範科 05W1 03 02 範例乙 M 60y0m ${admission} 住院中 ${md(2)}可出院 查 ！\n選 Note 26X00000003 示範科 05W1 05 01 範例丙 F 40y0m ${admission} 住院中 ${md(3)}可出院 查 ！\n選 Note 26X00000004 示範科 05W1 07 01 範例丁 M 30y0m ${admission} 住院中 查 ！\n選 Note 26X00000005 示範科 05W1 09 02 範例戊 F 70y0m ${admission} 住院中 ${md(7)}可出院 查 ！`;
}
$('baseDate').value=todayISO();
$('baseDate').addEventListener('change',refresh);
$('includeToday').addEventListener('change',refresh);
$('today').addEventListener('click',()=>{$('baseDate').value=todayISO();refresh();});
document.querySelectorAll('[data-days]').forEach(button=>button.addEventListener('click',()=>{selectedDays=Number(button.dataset.days);document.querySelectorAll('[data-days]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refresh();}));
$('source').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(refresh,180);});
$('analyze').addEventListener('click',refresh);
$('clear').addEventListener('click',()=>{$('source').value='';refresh();$('source').focus();});
$('demo').addEventListener('click',()=>{if($('source').value.trim()&&!window.confirm('載入虛構範例會取代目前貼上的文字，是否繼續？'))return;$('source').value=demoText();refresh();notice('目前為虛構範例資料，可切換 1～7 天查看效果。');});
$('copy').addEventListener('click',copyTable);
$('csv').addEventListener('click',downloadCSV);
$('print').addEventListener('click',()=>window.DischargeDaily?.print());
// Do not restore patient data from the browser back/forward cache.
window.addEventListener('pagehide',()=>{$('source').value='';visibleRows=[];$('rows').replaceChildren();$('reviewList').replaceChildren();});
window.addEventListener('pageshow',refresh);
refresh();

// Presentation layer only: existing parsing, navigation, storage and exports stay above.
(() => {
  const byId=id=>document.getElementById(id),root=document.querySelector('main.shell');
  if(!root)return;
  const make=(tag,className,html)=>{const el=document.createElement(tag);if(className)el.className=className;if(html)el.innerHTML=html;return el;};
  const controls=document.querySelector('.controls'),browser=document.querySelector('.browser-panel'),progress=byId('progressPanel');
  const input=document.querySelector('.input-panel'),result=document.querySelector('.result-panel'),resultHead=result.querySelector('.result-head');
  const toolbar=resultHead.querySelector('.toolbar'),review=byId('review'),noticeEl=byId('notice'),banner=byId('partialBanner');
  const oldFooter=document.querySelector('.bottom'),version=oldFooter.lastElementChild.textContent;
  let view='input',pending=0,pharmacistCount=2,started=false,manualAdvance=false;const assignments=new Map();
  const session=()=>window.CaptureSession||{status:'idle',wards:[],patients:{}};
  const complete=()=>session().status==='complete'&&!window.CaptureRunning&&window.DischargeDaily?.isCurrent()!==false;
  root.className='app';
  const top=make('header','topbar','<div class="brand-label">出院藥衛教名單擷取工具 <small></small></div><nav class="stepnav" aria-label="操作步驟"><button type="button" class="step-btn" id="inputTab" aria-selected="true"><span class="num">1</span>擷取設定</button><span class="arrow">›</span><button type="button" class="step-btn" id="progressTab" aria-selected="false" disabled><span class="num">2</span>擷取進度</button><span class="arrow">›</span><button type="button" class="step-btn" id="assignmentTab" aria-selected="false" disabled><span class="num">3</span>分配衛教藥師</button><span class="arrow">›</span><button type="button" class="step-btn" id="outputTab" aria-selected="false" disabled><span class="num">4</span>列印</button></nav>');
  top.querySelector('small').textContent=version.replace('瀏覽器擴充版 ','v').replace('離線單檔版 ','v');
  const portal=make('section','panel portal-notice','請開啟 Portal 的「查詢處理」頁面'),brand=make('div','brand');
  const brandLabel=top.querySelector('.brand-label');brandLabel.before(brand);const logo=make('img','brand-logo');logo.src='icons/icon48.png';logo.srcset='icons/icon48.png 1x, icons/icon128.png 2x';logo.width=36;logo.height=36;logo.alt='';logo.setAttribute('aria-hidden','true');brand.append(logo,brandLabel);
  top.append(make('div','top-tools','<span class="local-tag">本機處理</span><button id="open-management" type="button">登記電腦</button><button id="open-update" type="button">工具更新</button>'));
  const capture=make('section','screen');capture.id='screenInput';
  const scroll=make('div','capture-scroll'),wrap=make('div','capture-wrap');scroll.append(wrap);capture.append(scroll);
  controls.prepend(make('div','settings-section-title','<h2>出院日期</h2>'));
  wrap.append(portal,controls);
  const search=browser?.querySelector('.ward-search');if(search){search.classList.add('panel','settings-search');wrap.append(search);}
  if(browser)wrap.append(browser);
  const progressScreen=make('section','screen');progressScreen.id='screenProgress';progressScreen.hidden=true;
  const progressScroll=make('div','capture-scroll progress-scroll'),progressWrap=make('div','capture-wrap');progressScroll.append(progressWrap);progressScreen.append(progressScroll);if(progress)progressWrap.append(progress);
  const live=make('section','panel live-panel','<div class="section-top"><h2>已查到的出院名單</h2><span class="count" id="liveCount">0 人</span></div><p id="liveEmpty" class="muted">尚無資料</p><div class="live-table-wrap"><table class="live-table"><thead><tr><th>進度</th><th>床號</th><th>姓名</th><th>病歷號</th><th>出院日期</th><th>領藥號／狀態／時間</th></tr></thead><tbody id="liveRows"></tbody></table></div>');
  progressWrap.append(live,review);
  const foot=make('div','footbar','<button type="button" class="big-button" id="openManual">手動輸入</button><button type="button" class="big-button" id="toProgress" hidden>查看擷取進度</button><div class="spacer"></div><div class="start-slot"></div>');capture.append(foot);
  const progressFoot=make('div','footbar','<button type="button" class="big-button" id="progressReturn">← 返回設定</button><div class="progress-stop-slot"></div><div class="foot-sum">已查到 <b id="sumCount">0</b> 人</div><div class="spacer"></div><button type="button" class="primary big-button" id="toAssignment" hidden>下一步：分配衛教藥師 →</button>');
  const stop=browser?.querySelector('#stopBatch');if(stop)progressFoot.querySelector('.progress-stop-slot').append(stop);progressScreen.append(progressFoot);
  const start=browser?.querySelector('#startBatch');if(start){start.classList.add('big-button');foot.querySelector('.start-slot').append(start);browser.querySelector('.batch-actions')?.remove();}
  const assignment=make('section','screen');assignment.id='screenAssignment';assignment.hidden=true;
  const assignmentScroll=make('div','capture-scroll'),assignmentWrap=make('div','capture-wrap');assignmentScroll.append(assignmentWrap);
  assignmentWrap.innerHTML='<section class="panel"><div class="assignment-heading"><h2>分配衛教藥師</h2><label for="pharmacistCount">藥師人數 <input type="number" id="pharmacistCount" min="1" max="30" value="2"></label></div><p class="assignment-hint">預設由藥師 1 負責；如果全部由同一位藥師衛教，直接按「下一步」即可。</p><div class="assignment-table-wrap"><table class="assignment-table"><thead><tr><th>病房</th><th>出院人數</th><th>有出院藥</th><th>衛教藥師</th></tr></thead><tbody id="assignmentRows"></tbody></table></div><p id="assignmentEmpty" class="muted" hidden>所選範圍內沒有出院病人</p></section><div id="pharmacistSummary" class="pharmacist-summary"></div>';
  const assignmentFoot=make('div','footbar','<button type="button" class="big-button" id="backToProgress">← 返回擷取進度</button><span id="assignmentStatus"></span><div class="spacer"></div><button type="button" class="primary big-button" id="toOutput" disabled>下一步：列印預覽 →</button>');assignment.append(assignmentScroll,assignmentFoot);
  const output=make('section','screen');output.id='screenOutput';output.hidden=true;
  const bar=make('div','out-bar','<button type="button" id="backToAssignment">← 分配衛教藥師</button><div class="foot-sum">列印 <b id="outCount">0</b> 人 · <span id="outPages">0</span> 頁</div><div class="spacer"></div>');bar.append(toolbar);
  const printOptions=make('div','print-options','<label class="check barcode-toggle"><input type="checkbox" id="includeBarcode">帶入衛教紀錄條碼</label><span class="barcode-date-hint" id="barcodeDateHint">方便登錄衛教紀錄(須備有條碼機)</span><p class="barcode-option-status" id="barcodeOptionStatus" role="status" aria-live="polite" hidden></p>');
  const outputScroll=make('div','output-scroll'),preview=make('div','preview-area');preview.id='previewArea';
  const empty=make('div','empty-output');empty.id='previewEmpty';outputScroll.append(empty,preview);const followup=make('div','followup-bar','<div><strong id="dailySummary">今日尚無已列印紀錄</strong><p id="dailyHint">列印後確認完成，即可檢查新增病人與出院藥。</p></div><div class="followup-actions"><button type="button" id="confirmPrinted" hidden>已完成列印</button><button type="button" class="primary" id="checkNew" disabled>檢查新增病人／出院藥</button><button type="button" id="restartCapture">重新開始</button></div>');
  output.append(bar,printOptions,outputScroll,followup);
  const resume=make('section','panel daily-resume','<div><strong id="resumeSummary"></strong><p>延續今天已完成列印的紀錄，只列新增病人與出院藥；也可重新開始。</p></div><button type="button" class="primary" id="resumeNew">檢查新增</button><button type="button" id="resumeRestart">重新開始</button>');resume.hidden=true;wrap.prepend(resume);
  result.classList.add('source-result');result.setAttribute('aria-hidden','true');
  const dialog=make('dialog','manual-dialog');dialog.id='manualDialog';dialog.setAttribute('aria-labelledby','manualTitle');
  dialog.append(make('header','dialog-header','<h2 id="manualTitle">手動輸入</h2><button type="button" id="closeManual" aria-label="關閉手動輸入">×</button>'),input);
  oldFooter.classList.add('legacy-footer');root.replaceChildren(top);if(banner)root.append(banner);root.append(capture,progressScreen,assignment,output,noticeEl,result,oldFooter,dialog);
  const measure=make('div','measure-area');measure.setAttribute('aria-hidden','true');document.body.append(measure);
  const screens={input:capture,progress:progressScreen,assignment,output};
  function barcodeDateValue(raw){
    const value=String(raw||'').normalize('NFKC').replace(/\s+/g,'');
    const match=/^(\d{3,4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:T?\d{2}:\d{2}(?::\d{2})?)?$/.exec(value)||/^(\d{4})(\d{2})(\d{2})(?:T?\d{2}:?\d{2}(?::?\d{2})?)?$/.exec(value)||/^(\d{3})(\d{2})(\d{2})$/.exec(value);
    if(!match)return '';
    const year=Number(match[1])+(match[1].length===3?1911:0),date=`${year}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
    return P.fromISO(date)!==null?date.replaceAll('-',''):'';
  }
  function barcodeOptionsChanged(){updateGates();renderPreview();}
  byId('includeBarcode').addEventListener('change',barcodeOptionsChanged);
  function switchView(name){
    if(name==='input'&&window.CaptureRunning){requestReturn();return;}
    if(name==='progress'&&!started&&!complete())return;
    if(['assignment','output'].includes(name)&&!complete())return;
    if(name==='output'&&!canPrint()&&!(complete()&&window.DischargeDaily?.mode==='incremental'))return;
    view=name;for(const key of Object.keys(screens)){screens[key].hidden=key!==name;byId(key+'Tab').setAttribute('aria-selected',String(key===name));}
    if(name==='assignment')renderAssignment();if(name==='output')renderPreview();
  }
  function requestReturn(){
    if(!window.CaptureRunning)switchView('input');
  }
  byId('progressReturn').addEventListener('click',requestReturn);
  byId('progressTab').addEventListener('click',()=>switchView('progress'));
  byId('toProgress').addEventListener('click',()=>switchView('progress'));
  window.addEventListener('capturestart',()=>{started=true;switchView('progress');progressScroll.scrollTop=0;updateGates();});
  window.addEventListener('capturerunningchange',()=>{
    updateGates();schedule();
  });
  byId('inputTab').addEventListener('click',()=>switchView('input'));byId('assignmentTab').addEventListener('click',()=>switchView('assignment'));byId('outputTab').addEventListener('click',()=>switchView('output'));
  byId('toAssignment').addEventListener('click',()=>switchView('assignment'));byId('toOutput').addEventListener('click',()=>switchView('output'));
  byId('backToProgress').addEventListener('click',()=>switchView('progress'));byId('backToAssignment').addEventListener('click',()=>switchView('assignment'));
  byId('openManual').addEventListener('click',()=>{dialog.showModal();byId('source').focus();});byId('closeManual').addEventListener('click',()=>dialog.close());
  byId('analyze').addEventListener('click',()=>{dialog.close();manualAdvance=!!byId('source').value.trim();if(!browser&&manualAdvance){window.CaptureSession={status:'complete',manual:true,wards:[],patients:{}};manualAdvance=false;started=true;switchView('progress');updateGates();schedule();}});
  if(!browser){byId('source').addEventListener('input',()=>{window.CaptureSession={status:'idle',wards:[],patients:{}};schedule();});}
  function wardStats(){
    const wards=new Map();for(const w of session().wards)wards.set(w.code,{code:w.code,total:0,rx:0,unknown:0});
    for(const r of visibleRows){if(!wards.has(r.ward))wards.set(r.ward,{code:r.ward,total:0,rx:0,unknown:0});const w=wards.get(r.ward);w.total++;if(r.drugStatus==='有')w.rx++;else if(r.drugStatus!=='無')w.unknown++;}
    return [...wards.values()].sort((a,b)=>a.code.localeCompare(b.code,'en',{numeric:true}));
  }
  function pharmacistFor(ward){const n=assignments.get(ward);return n&&n<=pharmacistCount?n:1;}
  function canPrint(){if(window.DischargeBlocked||window.DischargeUpdating||window.EducationRunning)return false;const wards=wardStats().filter(w=>w.total);return complete()&&wards.length>0&&wards.every(w=>pharmacistFor(w.code)>0&&pharmacistFor(w.code)<=pharmacistCount);}
  function updateGates(){
    const ready=complete()&&!window.DischargeBlocked&&!window.DischargeUpdating;byId('toAssignment').hidden=!ready;byId('assignmentTab').disabled=!ready;byId('outputTab').disabled=!(canPrint()||ready&&window.DischargeDaily?.mode==='incremental');byId('toOutput').disabled=byId('outputTab').disabled;byId('print').disabled=!canPrint();
    byId('inputTab').disabled=!!window.CaptureRunning;byId('progressTab').disabled=!!window.CaptureRunning||!started&&!ready;byId('toProgress').hidden=!started&&!ready;
    byId('progressReturn').disabled=!!window.CaptureRunning;byId('progressReturn').textContent='← 返回設定';
    if(!ready&&['assignment','output'].includes(view))switchView('input');
  }
  function renderLive(){
    const rows=Array.from(byId('rows').children);byId('liveRows').replaceChildren();byId('liveEmpty').hidden=!!rows.length;live.querySelector('.live-table-wrap').hidden=!rows.length;
    byId('liveCount').textContent=`${rows.length} 人`;byId('sumCount').textContent=rows.length;
    rows.forEach((source,i)=>{const row=make('tr'),state=session().patients[visibleRows[i]?.account]||'pending',cell=make('td'),badge=make('span','patient-progress');badge.dataset.state=state;badge.textContent=session().manual?'手動資料':({pending:'待處理',running:'處理中',done:'已完成',stopped:'未完成'})[state];cell.append(badge);row.append(cell);for(let j=0;j<5;j++)row.append(source.cells[j].cloneNode(true));byId('liveRows').append(row);});
  }
  function renderAssignment(){
    const wards=wardStats();byId('assignmentRows').replaceChildren();byId('assignmentEmpty').hidden=wards.some(w=>w.total);
    for(const ward of wards){
      const row=make('tr');row.dataset.ward=ward.code;
      [ward.code,ward.total,ward.rx].forEach((value,i)=>{const cell=make('td');cell.textContent=value;if(i===2&&ward.unknown){const note=make('small','unknown-count');note.textContent=`${ward.unknown} 人未確認`;cell.append(note);}row.append(cell);});
      const cell=make('td');
      if(ward.total){
        const choices=make('div','pharmacist-choices');choices.dataset.ward=ward.code;choices.setAttribute('role','group');choices.setAttribute('aria-label',ward.code+' 衛教藥師');
        for(let n=1;n<=pharmacistCount;n++){
          const button=make('button','pharmacist-choice');button.type='button';button.dataset.pharmacist=n;button.textContent='藥師 '+n;button.setAttribute('aria-pressed',String(pharmacistFor(ward.code)===n));
          button.addEventListener('click',()=>{assignments.set(ward.code,n);for(const b of choices.children)b.setAttribute('aria-pressed',String(b===button));renderSummary();updateGates();});choices.append(button);
        }
        cell.append(choices);
      }else cell.textContent='—';
      row.append(cell);byId('assignmentRows').append(row);
    }
    renderSummary();updateGates();
  }
  function renderSummary(){
    const wards=wardStats(),assignedNumbers=[...new Set(wards.filter(w=>w.total).map(w=>pharmacistFor(w.code)))];byId('assignmentStatus').textContent=!assignedNumbers.length?'無需分配':assignedNumbers.length===1?`全部由藥師 ${assignedNumbers[0]} 負責`:`已分配給 ${assignedNumbers.length} 位藥師`;
    byId('pharmacistSummary').replaceChildren();
    for(let n=1;n<=pharmacistCount;n++){
      const assigned=wards.filter(w=>w.total&&pharmacistFor(w.code)===n),card=make('section','panel pharmacist-card'),heading=make('h3'),numbers=make('p','pharmacist-counts'),codes=make('div','selected-wards');heading.textContent='藥師 '+n;
      numbers.textContent=`出院 ${assigned.reduce((s,w)=>s+w.total,0)} 人 · 有出院藥 ${assigned.reduce((s,w)=>s+w.rx,0)} 人`;
      for(const w of assigned){const chip=make('span','selected-chip');chip.textContent=w.code;codes.append(chip);}if(!assigned.length)codes.textContent='尚未分配病房';card.append(heading,numbers,codes);byId('pharmacistSummary').append(card);
    }
  }
  byId('pharmacistCount').addEventListener('change',()=>{pharmacistCount=Math.min(30,Math.max(1,Math.floor(Number(byId('pharmacistCount').value)||1)));byId('pharmacistCount').value=pharmacistCount;for(const [ward,n] of assignments)if(n>pharmacistCount)assignments.set(ward,1);renderAssignment();});
  function newSheet(total,pharmacist){
    const sheet=make('article','sheet');sheet.dataset.pharmacist=pharmacist;sheet.setAttribute('aria-label','藥師 '+pharmacist+' 出院用藥教育紀錄表');
    const header=make('header','sheet-header','<div><h2 class="sheet-title print-title">出院用藥教育紀錄表</h2><div class="sheet-meta"></div><div class="sheet-group"></div></div><div class="stamp-area"><span>衛教藥師核章</span><div class="stamp-space"></div><div class="sheet-page"></div></div>');
    header.querySelector('.sheet-title').style.display='block';header.querySelector('.sheet-meta').textContent=byId('printMeta').textContent;header.querySelector('.sheet-group').textContent=`藥師 ${pharmacist}　共 ${total} 人${window.DischargeDaily?.mode==='incremental'?' · 新增名單':''}`;sheet.append(header);
    if(byId('includeBarcode').checked)sheet.append(make('p','barcode-instructions','若要刷條碼登記衛教紀錄，藥局請選「<strong>總院西址住院藥局</strong>」、類別請選「<strong>出院</strong>」。'));
    const table=make('table','edu-table');table.append(result.querySelector('thead').cloneNode(true),document.createElement('tbody'));sheet.append(table);return sheet;
  }
  // Code 128 symbol widths; encode T in set B, then the 16 digits in set C.
  const code128Patterns='212222|222122|222221|121223|121322|131222|122213|122312|132212|221213|221312|231212|112232|122132|122231|113222|123122|123221|223211|221132|221231|213212|223112|312131|311222|321122|321221|312212|322112|322211|212123|212321|232121|111323|131123|131321|112313|132113|132311|211313|231113|231311|112133|112331|132131|113123|113321|133121|313121|211331|231131|213113|213311|213131|311123|311321|331121|312113|312311|332111|314111|221411|431111|111224|111422|121124|121421|141122|141221|112214|112412|122114|122411|142112|142211|241211|221114|413111|241112|134111|111242|121142|121241|114212|124112|124211|411212|421112|421211|212141|214121|412121|111143|111341|131141|114113|114311|411113|411311|113141|114131|311141|411131|211412|211214|211232|2331112'.split('|');
  function barcodeSvg(value){
    if(!/^T022\d{13}$/.test(value))throw new Error('Invalid education barcode');
    const symbols=[104,52,99,...value.slice(1).match(/\d{2}/g).map(Number)];
    const checksum=symbols.reduce((sum,code,index)=>sum+code*(index||1),0)%103;symbols.push(checksum,106);
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');let x=10;
    for(const code of symbols){for(const [index,digit] of [...code128Patterns[code]].entries()){const width=Number(digit);if(index%2===0){const bar=document.createElementNS(ns,'rect');bar.setAttribute('x',x);bar.setAttribute('y','0');bar.setAttribute('width',width);bar.setAttribute('height','40');bar.setAttribute('fill','#000');svg.append(bar);}x+=width;}}
    svg.setAttribute('xmlns',ns);svg.setAttribute('viewBox',`0 0 ${x+10} 40`);svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('role','img');svg.setAttribute('aria-label','衛教紀錄條碼 '+value);svg.classList.add('education-barcode');return svg;
  }
  function addBarcode(entry){
    const number=entry.querySelector('.pickup-number')?.textContent.trim().toUpperCase()||'',digits=/^[A-Z]?(\d{1,5})$/.exec(number),date=barcodeDateValue(entry.dataset.orderDate);
    if(!digits||!date){const error=make('div','barcode-entry-error');error.textContent=!date?'未產生條碼：開立日期未確認':'未產生條碼：領藥號格式不符';entry.append(error);return;}
    const value='T022'+date+digits[1].padStart(5,'0'),block=make('div','pickup-barcode');block.append(barcodeSvg(value));entry.append(block);
  }
  function presentationRow(source){
    const row=source.cloneNode(true);row.removeAttribute('id');row.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    if(byId('includeBarcode').checked)row.querySelectorAll('.pickup-entry').forEach(addBarcode);
    const bed=row.cells[0],parts=bed.textContent.split('-');if(parts.length===3){const ward=make('div','bed-ward'),number=make('div','bed-no');ward.textContent=parts[0];number.textContent=parts.slice(1).join('-');bed.replaceChildren(ward,number);}return row;
  }
  function wardHeading(code,count,continued=false){const row=make('tr','ward-heading'),cell=make('td');cell.colSpan=7;cell.textContent=`${code} 病房 · ${count} 人${continued?'（續）':''}`;row.append(cell);return row;}
  function overflows(sheet){const edge=sheet.getBoundingClientRect().bottom-parseFloat(getComputedStyle(sheet).paddingBottom);return sheet.querySelector('table').getBoundingClientRect().bottom>edge+.5;}
  function renderPreview(){
    measure.replaceChildren();preview.replaceChildren();const total=visibleRows.length;byId('outCount').textContent=total;
    const barcodeStatus=byId('barcodeOptionStatus'),barcodeEnabled=byId('includeBarcode').checked;
    const invalidCount=barcodeEnabled?visibleRows.reduce((sum,row)=>sum+row.pickups.filter(p=>!barcodeDateValue(p.orderDate)||!(/^[A-Z]?\d{1,5}$/.test(String(p.number).trim().toUpperCase()))).length,0):0;
    barcodeStatus.hidden=!invalidCount;
    barcodeStatus.textContent=invalidCount?`${invalidCount} 筆開立日期或領藥號未確認，該筆未產生條碼。`:'';
    empty.hidden=canPrint();preview.hidden=!canPrint();empty.textContent=total?'請完成病房分配後列印':window.DischargeDaily?.mode==='incremental'?'本次沒有新增病人或出院藥':'所選範圍內沒有出院病人';
    if(!canPrint()){byId('outPages').textContent='0';return;}
    const sources=Array.from(byId('rows').children,(source,i)=>({source,patient:visibleRows[i]})),allSheets=[];
    for(let pharmacist=1;pharmacist<=pharmacistCount;pharmacist++){
      const wards=wardStats().filter(w=>w.total&&pharmacistFor(w.code)===pharmacist);if(!wards.length)continue;
      const groupTotal=wards.reduce((s,w)=>s+w.total,0),sheets=[];let sheet;
      function next(){sheet=newSheet(groupTotal,pharmacist);measure.append(sheet);sheets.push(sheet);return sheet.querySelector('tbody');}
      let tbody=next();
      for(const ward of wards){
        if(sheet.classList.contains('oversize'))tbody=next();
        let heading=wardHeading(ward.code,ward.total);tbody.append(heading);
        const wardSources=sources.filter(({patient})=>patient.ward===ward.code)
          .sort((a,b)=>P.compareBeds(a.patient,b.patient))
          .map(({source})=>source);
        for(const source of wardSources){
          if(sheet.classList.contains('oversize')){tbody=next();tbody.append(wardHeading(ward.code,ward.total,true));}
          const row=presentationRow(source);tbody.append(row);
          if(overflows(sheet)&&tbody.rows.length>2){
            row.remove();if(heading===tbody.lastElementChild)heading.remove();
            tbody=next();heading=wardHeading(ward.code,ward.total,true);tbody.append(heading,row);
          }
          if(overflows(sheet)){
            const entries=Array.from(row.cells[4].querySelectorAll('.pickup-entry'));
            if(entries.length>1){
              const template=row.cloneNode(true),warning=row.cells[4].querySelector('.pickup-warning');row.cells[4].replaceChildren();let chunk=row;
              for(const entry of entries){
                chunk.cells[4].append(entry);
                if(overflows(sheet)&&chunk.cells[4].children.length>1){
                  entry.remove();tbody=next();tbody.append(wardHeading(ward.code,ward.total,true));chunk=template.cloneNode(true);chunk.cells[4].replaceChildren(entry);chunk.cells[1].append(make('span','continued','（續）'));tbody.append(chunk);
                }
                if(overflows(sheet))sheet.classList.add('oversize');
              }
              if(warning)chunk.cells[4].append(warning);
            }else sheet.classList.add('oversize');
          }
        }
      }
      sheets.forEach((page,i)=>{page.querySelector('.sheet-page').textContent=`藥師 ${pharmacist} · 第 ${i+1} / ${sheets.length} 頁`;allSheets.push(page);preview.append(page);});
    }
    byId('outPages').textContent=allSheets.length;
  }
  function render(){pending=0;renderLive();updateGates();if(view==='assignment')renderAssignment();if(view==='output')renderPreview();}
  function schedule(){if(!pending)pending=requestAnimationFrame(render);}
  const observer=new MutationObserver(schedule);[byId('rows'),byId('count'),byId('printMeta'),banner].filter(Boolean).forEach(el=>observer.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']}));
  window.addEventListener('captureupdate',()=>{if(manualAdvance&&complete()){manualAdvance=false;started=true;switchView('progress');}updateGates();schedule();});
  window.addEventListener('beforeprint',()=>{renderPreview();if(dialog.open)dialog.close();});
  window.addEventListener('pagehide',()=>{preview.replaceChildren();measure.replaceChildren();byId('liveRows').replaceChildren();assignments.clear();});
  window.DischargePresentation={switchView,canPrint,schedule,assignments:()=>({count:pharmacistCount,wards:Object.fromEntries(assignments)}),restoreAssignments(value){assignments.clear();pharmacistCount=value?.count||2;byId('pharmacistCount').value=pharmacistCount;for(const [k,v] of Object.entries(value?.wards||{}))assignments.set(k,v);schedule();}};
  document.fonts?.ready.then(schedule);render();
})();
