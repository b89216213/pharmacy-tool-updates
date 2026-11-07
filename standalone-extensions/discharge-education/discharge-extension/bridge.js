'use strict';
// This function is serialized by chrome.scripting. Keep it self-contained.
function pageBridge(action,payload={}) {
  const ntuhPrefix='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_QueryInPatientByBedBox_';
  const clean=s=>String(s||'').replace(/[\uFF01-\uFF5E]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/\s+/g,' ').trim();
  const visible=el=>!!el&&!!el.getClientRects().length&&el.ownerDocument.defaultView.getComputedStyle(el).visibility!=='hidden'&&el.ownerDocument.defaultView.getComputedStyle(el).display!=='none'&&el.ownerDocument.defaultView.getComputedStyle(el).opacity!=='0';
  function readableDocuments(){
    let root=document;
    try{while(root.defaultView.parent!==root.defaultView){const parent=root.defaultView.parent.document;if(!parent||parent===root)break;root=parent;}}catch(_){}
    const documents=[root];let blockedFrames=0;
    for(let i=0;i<documents.length&&i<30;i++)for(const frame of documents[i].querySelectorAll('iframe,frame')){
      if(!visible(frame))continue;
      try{if(frame.contentDocument&&!documents.includes(frame.contentDocument))documents.push(frame.contentDocument);else if(!frame.contentDocument)blockedFrames++;}catch(_){blockedFrames++;}
    }
    if(!documents.includes(document))documents.push(document);
    return {documents,blockedFrames};
  }
  const cellsOf=tr=>Array.from(tr.children).filter(e=>/^(TD|TH)$/.test(e.tagName));
  const token=el=>el?clean(el.innerText).replace(/[<>〈〉《》【】\[\]\s]/g,''):'';
  const emptyData=el=>/^(?:查無資料|無資料|沒有資料|尚無資料|無資料可供顯示|無出院藥|查無出院藥|無用藥資料|查無用藥資料|查無處方|無處方資料|無紀錄|尚無紀錄|查無紀錄|查無刷出紀錄|無刷出紀錄|共0筆)[。.!！]?$/.test(token(el));
  const busy=doc=>doc.readyState==='loading'||Array.from(doc.querySelectorAll('[aria-busy="true"],[role="progressbar"],#loading,#Loading,.loading,.loading-mask,.loading-overlay')).some(visible);
  const knownOrderTable=table=>table.id==='NTUHWeb1_MedProcessBox_InptOrderBox_grvInptOrder'||table.id.endsWith('_InptOrderBox_grvInptOrder');
  const sameAccount=(doc,account)=>{const field=doc.querySelector('input[id$="_QueryInptActiveOrderBox_hdfAccountIdse"]');return !field||!clean(field.value)||clean(field.value).toUpperCase()===clean(account).toUpperCase();};
  const wardCode=s=>{
    const text=clean(s).toUpperCase();
    const m=/^([0-9][A-Z0-9]{1,5})(?:\s|$|[（(\-：:])/.exec(text);
    return m&&/[A-Z]/.test(m[1])?m[1]:null;
  };
  function choices(select){
    return Array.from(select.options).filter(o=>!o.disabled).map(o=>({code:wardCode(o.textContent)||wardCode(o.value),value:o.value,label:clean(o.textContent)})).filter(o=>o.code);
  }
  function discover(){
    return Array.from(document.querySelectorAll('select')).map((el,index)=>{
      const options=choices(el), unique=new Set(options.map(o=>o.code));
      if(unique.size<2||!visible(el)||el.disabled||el.multiple)return null;
      const ntuh=el.id===ntuhPrefix+'ddlListWard';
      return {id:el.id,name:el.name,index,options,selectedWard:wardCode(el.selectedOptions[0]?.textContent)||wardCode(el.value),signature:options.map(o=>o.code).join('|'),mode:ntuh?'ntuh-query':'change',queryPresent:ntuh?!!document.getElementById(ntuhPrefix+'btnQueryInBed'):false};
    }).filter(Boolean);
  }
  function locate(descriptor){
    if(!descriptor)throw new Error('尚未選擇病房選單');
    const candidates=discover();
    let found=candidates.find(c=>descriptor.id&&c.id===descriptor.id&&c.signature===descriptor.signature);
    if(!found)found=candidates.find(c=>descriptor.name&&c.name===descriptor.name&&c.signature===descriptor.signature);
    if(!found)found=candidates.find(c=>c.index===descriptor.index&&c.signature===descriptor.signature);
    if(!found)throw new Error('病房選單已變更或無法辨識，請重新辨識');
    return document.querySelectorAll('select')[found.index];
  }
  function snapshot(){
    const text=document.body?.innerText||'';
    const flat=clean(text), matches=[...flat.matchAll(/\b\d{2}[A-Z]\d{8}\b/gi)], wards=[];
    for(let i=0;i<matches.length;i++){
      const part=flat.slice(matches[i].index+matches[i][0].length,i+1<matches.length?matches[i+1].index:flat.length);
      const m=/^\s*(.+?)\s+([0-9][A-Z0-9]{1,9})\s+([A-Z0-9]{1,4})\s+([A-Z0-9]{1,4})\s+(.+?)\s+([MF男女])(?=\s|$)/i.exec(part);
      if(m)wards.push(m[2].toUpperCase());
    }
    const loading=Array.from(document.querySelectorAll('[aria-busy="true"],[role="progressbar"],#loading,#Loading,.loading,.loading-mask,.loading-overlay')).some(visible)||/資料讀取中|資料載入中|正在載入/.test(text);
    // A visible pager means a ward might span several pages; never claim completion.
    const activeControls=Array.from(document.querySelectorAll('a,button,input[type=button],input[type=submit]')).filter(e=>visible(e)&&!e.disabled&&e.getAttribute('aria-disabled')!=='true');
    const hasNextPage=activeControls.some(e=>/^(下一頁|下頁|Next\s*(page)?\s*[>»]?)$/i.test(clean(e.innerText||e.value||e.getAttribute('aria-label'))));
    const pager=/(?:共|總共)\s*(\d+)\s*頁/.exec(text);
    const pagination=hasNextPage||!!(pager&&+pager[1]>1)||/第\s*\d+\s*頁\s*[\/／]\s*[2-9]\d*/.test(text);
    const emptyExplicit=matches.length===0&&Array.from(document.querySelectorAll('td,[role="status"],.empty')).some(e=>visible(e)&&/^(查無資料|查無病人|無住院病人|没有住院病人|沒有住院病人|無病人資料|共\s*0\s*筆)[。.!！]?$/.test(clean(e.innerText)));
    return {text,wards:[...new Set(wards)],rowCount:wards.length,accountCount:matches.length,loading,ready:document.readyState!=='loading',pagination,emptyExplicit,origin:location.origin,controls:discover()};
  }
  if(action==='discover')return {origin:location.origin,controls:discover(),readable:!!document.body};
  if(action==='snapshot')return snapshot();
  if(action==='selectPatient'){
    const links=Array.from(document.querySelectorAll('a[id^="NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_InPatientListBox_grvInPatientList_"][id$="_lbtnSelect"]')).filter(visible);
    const hits=links.filter(a=>{const row=a.closest('tr');return row&&clean(row.innerText).split(' ').includes(payload.account);});
    if(hits.length!==1)throw new Error('無法唯一對應病人的「選」按鈕，已停止以免選錯病人。');
    const rowText=clean(hits[0].closest('tr').innerText);
    if(!rowText.includes(payload.name)||!rowText.split(' ').includes(payload.ward))throw new Error('病人列姓名或病房與擷取名單不同，請重新擷取。');
    hits[0].click();return {selected:true};
  }
  if(action==='patientDetails'||action==='patientReturnState'){
    const chart=document.getElementById('NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_InPatientInfoBox_lblChartNo');
    const back=document.getElementById('NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_btnReSelect');
    const returnable=visible(back);
    if(action==='patientReturnState')return {returnable,origin:location.origin};
    if(!visible(chart)||!returnable)return {ready:false,returnable,origin:location.origin};
    const mrn=clean(chart.innerText),expectedAccount=clean(payload.account).toUpperCase();
    const sexLabel=document.getElementById('NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_InPatientInfoBox_lblSex');
    const sexValue=visible(sexLabel)?clean(sexLabel.innerText).toUpperCase():'';
    const sex=/^[FM]$/.test(sexValue)?sexValue:'';
    const accounts=[...(document.body?.innerText||'').matchAll(/\b\d{2}[A-Z]\d{8}\b/gi)].map(m=>m[0].toUpperCase());
    if(accounts.length&&!accounts.includes(expectedAccount))throw new Error('病人頁面的帳號與待擷取病人不符，已停止。');
    // Start at the highest readable parent so navigator and medication sibling
    // frames are both covered. Cross-origin frames remain inaccessible.
    const {documents,blockedFrames}=readableDocuments();
    const ownRows=table=>Array.from(table.querySelectorAll('tr')).filter(tr=>tr.closest('table')===table&&visible(tr));
    const negative=new Set(['停','刪','退','取消']);
    const statuses=new Set(['確',...negative]);
    const allTables=documents.flatMap(doc=>Array.from(doc.querySelectorAll('table')).filter(visible));
    const known=allTables.filter(knownOrderTable);
    // Never scan the ancestor layout table first: its descendant rows belong
    // to the actual medication table and must only be interpreted there.
    const candidates=known.length?known:allTables.filter(table=>{
      const headers=ownRows(table).filter(tr=>tr.classList.contains('tableTitle')||cellsOf(tr).some(c=>c.tagName==='TH'));
      const text=headers.map(tr=>cellsOf(tr).map(c=>clean(c.innerText)).join(' ')).join(' ');
      return /藥品|藥名|品名|用藥|處方/.test(text)&&/劑量|用法|頻次|頻率|途徑|數量|狀態|醫囑/.test(text);
    });
    const diagnostics={documents:documents.length,blockedFrames,exactTables:known.length,candidateTables:candidates.length,accountMismatch:false,scannedRows:0,medicationRows:0,dischargeRows:0,confirmedDischargeRows:0,unknownRows:0,emptyMedicationView:false,pagination:false,loading:false};
    let tableFound=false,tableEmpty=false,missingPickupRows=0;
    const pickupMap=new Map();
    for(const table of candidates){
      const doc=table.ownerDocument;
      const rxAccount=doc.querySelector('input[id$="_QueryInptActiveOrderBox_hdfAccountIdse"]');
      if(rxAccount&&clean(rxAccount.value)&&clean(rxAccount.value).toUpperCase()!==expectedAccount){diagnostics.accountMismatch=true;continue;}
      tableFound=true;diagnostics.loading ||= busy(doc);
      const exact=known.includes(table);
      const rows=ownRows(table);
      let contentRows=0;
      diagnostics.pagination ||= Array.from(table.querySelectorAll('a,button,input')).some(el=>visible(el)&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&(/^(下一頁|下頁|Next\s*(page)?\s*[>»]?)$/i.test(clean(el.innerText||el.value))||/Page\$/.test(el.getAttribute('href')||'')));
      for(const tr of rows){
        const cells=cellsOf(tr);
        if(!cells.length||tr.classList.contains('tableTitle')||cells.every(c=>c.tagName==='TH')||(token(cells[2])==='狀態'&&/類型|類別/.test(token(cells[3]))))continue;
        if(emptyData(tr)){tableEmpty=true;continue;}
        if(!cells.some(c=>token(c)))continue;
        // Expanded detail and layout rows are not medication records.
        if(exact&&cells.length<4&&tr.querySelector('table[id$="grvDeliveryRecord"]'))continue;
        contentRows++;
        // A medication cell may itself contain a small table. Only status and
        // type cells determine the result; never discard the surrounding row.
        const values=cells.map(token);
        if(exact&&cells.length<4)continue;
        diagnostics.scannedRows++;
        let status,category;
        if(exact){status=values[2];category=values[3];}
        else{
          const index=values.indexOf('出院');
          if(index>=0){category='出院';status=values.slice(0,index).find(v=>statuses.has(v));}
          else {status=values.find(v=>statuses.has(v));category=values.includes('住院')?'住院':'';}
        }
        if(statuses.has(status)||category==='住院')diagnostics.medicationRows++;
        else diagnostics.unknownRows++;
        if(category==='出院'){
          diagnostics.dischargeRows++;
          if(status==='確'){
            diagnostics.confirmedDischargeRows++;
            const number=exact?token(cells[6]).toUpperCase():'';
            if(number&&/^[A-Z0-9-]{1,20}$/.test(number)&&/\d/.test(number)){
              const link=Array.from(tr.querySelectorAll('a[id*="_grvInptOrder_"][id$="_btnDetail"]')).find(a=>visible(a)&&clean(a.innerText)==='詳');
              const representative={sequence:token(cells[1]),orderDate:token(cells[5]),hasDetail:!!link};
              const groupKey=representative.orderDate+'|'+number;const group=pickupMap.get(groupKey);
              if(group){group.medicationCount++;group.sequences.push(representative.sequence);if(!group.hasDetail&&link)Object.assign(group,representative);}
              else pickupMap.set(groupKey,{number,medicationCount:1,sequences:[representative.sequence],...representative});
            }else missingPickupRows++;
          }
        }
      }
      // A rendered grid with only its header (or blank/empty-state rows) is
      // an empty result, not a missing/unreadable medication table.
      if(!contentRows)tableEmpty=true;
    }
    // Web Forms may omit the grid altogether for an empty result. Require the
    // current patient's medication context on a completely loaded document;
    // the batch reader additionally waits for this negative result to settle.
    if(!candidates.length&&!blockedFrames)for(const doc of documents){
      const field=doc.querySelector('input[id$="_QueryInptActiveOrderBox_hdfAccountIdse"]');
      if(!field||!expectedAccount||clean(field.value).toUpperCase()!==expectedAccount)continue;
      diagnostics.loading ||= busy(doc);
      if(doc.readyState==='complete'&&!busy(doc)){
        tableFound=true;tableEmpty=true;diagnostics.emptyMedicationView=true;
      }
    }
    diagnostics.loading ||= busy(document);
    // Only a literal confirmed discharge row counts. Other statuses do not
    // block a negative result after the medication view has finished loading.
    const drugStatus=diagnostics.loading?'未確認':diagnostics.confirmedDischargeRows?'有':tableFound&&!diagnostics.accountMismatch&&!diagnostics.pagination?'無':'未確認';
    const reason=drugStatus!=='未確認'?'':diagnostics.loading?'藥品仍在載入':diagnostics.accountMismatch?'藥品區帳號與病人不符':!tableFound?'未找到可讀取的藥品表格':diagnostics.pagination?'藥品表格有分頁':'藥品表格尚無可判讀資料';
    const pickupGroups=[...pickupMap.values()];
    diagnostics.pickupGroups=pickupGroups.length;diagnostics.missingPickupRows=missingPickupRows;
    return {ready:document.readyState!=='loading'&&/^\d{1,12}$/.test(mrn),returnable,mrn,sex,drugStatus,confirmedCount:diagnostics.confirmedDischargeRows,reason,diagnostics,pickupGroups,pickupComplete:!diagnostics.pagination&&!diagnostics.loading&&!diagnostics.accountMismatch&&!missingPickupRows,origin:location.origin};
  }
  if(action==='openOrderDetail'||action==='readOrderDetail'){
    const patient=pageBridge('patientDetails',{account:payload.account});
    if(!patient.ready&&action==='readOrderDetail')return {ready:false,number:payload.number,status:'未確認',times:[],reason:'病人頁面仍在載入',origin:location.origin};
    if(!patient.ready||patient.mrn!==payload.mrn)throw new Error('病人身分尚未就緒或已變更，已停止讀取藥品明細。');
    const hits=[];
    for(const doc of readableDocuments().documents){
      if(!sameAccount(doc,payload.account))continue;
      for(const table of Array.from(doc.querySelectorAll('table')).filter(t=>knownOrderTable(t)&&visible(t))){
        for(const row of table.querySelectorAll('tr')){
          if(row.closest('table')!==table||!visible(row))continue;
          const cells=cellsOf(row);
          if(token(cells[2])==='確'&&token(cells[3])==='出院'&&token(cells[6]).toUpperCase()===payload.number&&token(cells[1])===payload.sequence&&token(cells[5])===payload.orderDate)hits.push(row);
        }
      }
    }
    if(!hits.length&&action==='readOrderDetail')return {ready:false,number:payload.number,status:'未確認',times:[],reason:'藥品列仍在載入或已變更',origin:location.origin};
    if(hits.length!==1)throw new Error('無法唯一對應領藥號的代表藥品列，請重新擷取。');
    const row=hits[0],detailTables=[],detailScopes=[];
    function collectTables(scope){
      for(const table of scope.querySelectorAll('table'))if((table.id==='grvDeliveryRecord'||table.id.endsWith('_grvDeliveryRecord'))&&visible(table))detailTables.push(table);
    }
    collectTables(row);
    // Bind records to this medication row, never a document-wide detail table
    // which could still be showing the preceding pickup number.
    for(let next=row.nextElementSibling;next;next=next.nextElementSibling){
      if(next.querySelector('a[id*="_grvInptOrder_"][id$="_btnDetail"]')||cellsOf(next).length>=7)break;
      detailScopes.push(next);
      collectTables(next);
    }
    const emptyDetail=detailScopes.some(scope=>Array.from(scope.querySelectorAll('td,span,[role="status"]')).some(el=>visible(el)&&emptyData(el)));
    if(action==='openOrderDetail'){
      if(detailTables.length||emptyDetail)return {opened:false,existing:true,origin:location.origin};
      const links=Array.from(row.querySelectorAll('a[id*="_grvInptOrder_"][id$="_btnDetail"]')).filter(a=>visible(a)&&clean(a.innerText)==='詳');
      if(links.length!==1)throw new Error('找不到此筆出院藥的「詳」按鈕。');
      if(busy(row.ownerDocument))throw new Error('藥品頁面仍在載入，尚未開啟明細。');
      links[0].click();return {opened:true,origin:location.origin};
    }
    // Web Forms assigns a different row prefix to every order. Read only the
    // expanded detail belonging to the representative row for this pickup.
    const detailLink=row.querySelector('a[id$="_btnDetail"]');
    const prefix=detailLink?.id.slice(0,-'btnDetail'.length);
    function readOrderDateTime(){
      if(!prefix)return '';
      const confirmed=new Set(),entered=new Set();
      for(const scope of [row,...detailScopes]){
        for(const input of scope.querySelectorAll('input[type="text"]')){
          if(!input.id.startsWith(prefix)||!visible(input))continue;
          const match=/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(clean(input.value));
          if(!match)continue;
          const [,year,month,day,hour,minute,second='00']=match;
          const date=new Date(Date.UTC(+year,+month-1,+day));
          if(date.getUTCFullYear()!==+year||date.getUTCMonth()!==+month-1||date.getUTCDate()!==+day||+hour>23||+minute>59||+second>59)continue;
          const value=year+'/'+month.padStart(2,'0')+'/'+day.padStart(2,'0')+' '+hour.padStart(2,'0')+':'+minute;
          if(input.id.endsWith('_txbCompleteDateTime'))confirmed.add(value);
          else{
            const cell=input.closest('td');
            const label=clean(cell?.textContent).replace(/[:：\s]/g,'');
            const previous=clean(cell?.previousElementSibling?.textContent).replace(/[:：\s]/g,'');
            if(label==='醫令輸入者'||previous==='醫令輸入者')entered.add(value);
          }
        }
      }
      const times=confirmed.size?confirmed:entered;
      return times.size===1?[...times][0]:'';
    }
    const records=[];let excludedRecordCount=0,missingCategoryRows=0,unreadableRecordRows=0;
    const timeValue=el=>{const value=el&&visible(el)?clean(el.innerText):'';return /^(?:[-—–]+|無|無紀錄|尚無紀錄|無資料)?$/.test(value)?'':value;};
    for(const table of detailTables){
      const ownRows=Array.from(table.querySelectorAll('tr')).filter(tr=>tr.closest('table')===table&&visible(tr));
      const columns={};const headers=new Set();
      for(const tr of ownRows){
        const cells=cellsOf(tr),labels=cells.map(token);
        if(tr.classList.contains('tableTitle')||cells.every(c=>c.tagName==='TH')||(labels.includes('狀態')&&(labels.includes('刷出時間')||labels.includes('列印時間')||labels.includes('列印類別')))){
          headers.add(tr);let index=0;
          for(const cell of cells){const label=token(cell);if(['狀態','刷出時間','列印時間','列印類別'].includes(label))columns[label]=index;index+=cell.colSpan||1;}
        }
      }
      for(const tr of ownRows){
        if(headers.has(tr))continue;
        const cells=cellsOf(tr),logicalCells=[];
        if(!cells.some(c=>token(c))||emptyData(tr))continue;
        for(const cell of cells)for(let i=0;i<(cell.colSpan||1);i++)logicalCells.push(cell);
        const headerCell=label=>Object.hasOwn(columns,label)?logicalCells[columns[label]]:null;
        const statusEl=headerCell('狀態')||tr.querySelector('[id$="_DelivyStatusString"],[id$="_DeliveryStatusString"]');
        const categoryEl=headerCell('列印類別');
        if(!statusEl||!visible(statusEl)){unreadableRecordRows++;continue;}
        // Filter complete records before collecting either status or timestamp.
        // Excluded categories must never contribute a time to another record.
        if(!categoryEl||!visible(categoryEl)||!token(categoryEl)){missingCategoryRows++;continue;}
        if(!['批次','急單'].includes(token(categoryEl))){excludedRecordCount++;continue;}
        // The two timestamps have separate meanings. Never substitute printing
        // time for dispensing time, even when the displayed values are equal.
        const deliveryEl=headerCell('刷出時間');
        const printEl=headerCell('列印時間')||tr.querySelector('[id$="_PrintDateTimeString"]');
        records.push({sourceStatus:clean(statusEl.innerText),deliveryTime:timeValue(deliveryEl),printTime:timeValue(printEl)});
      }
    }
    const sourceStatuses=[...new Set(records.map(r=>r.sourceStatus).filter(Boolean))];
    const loading=busy(row.ownerDocument);
    const recordsRead=!loading&&(!!detailTables.length||emptyDetail)&&!missingCategoryRows&&!unreadableRecordRows;
    const status=loading?'未確認':sourceStatuses.join('／')||(recordsRead?'無紀錄':'未確認');
    const deliveryTimes=[...new Set(records.map(r=>r.deliveryTime).filter(Boolean))];
    const printTimes=[...new Set(records.map(r=>r.printTime).filter(Boolean))];
    // Once the scoped detail result is read, an absent timestamp (including
    // an omitted time column or zero eligible records) means no time record.
    // Failed/loading reads and unrecognizable record categories remain unknown.
    const deliveryTimeKnown=recordsRead;
    const printTimeKnown=recordsRead;
    const reason=loading?'明細仍在載入':!detailTables.length&&!emptyDetail?'尚未找到此筆藥品的紀錄':missingCategoryRows?'部分紀錄未能辨識列印類別，僅採用可確認的批次／急單':unreadableRecordRows?'部分明細列無法辨識':!records.length&&excludedRecordCount?'未找到批次或急單紀錄（已排除其他列印類別）':status==='未確認'?'明細狀態未能判讀':'';
    return {ready:!loading&&(!!detailTables.length||emptyDetail),missingRecord:!loading&&!detailTables.length&&!emptyDetail,number:payload.number,orderDateTime:loading?'':readOrderDateTime(),status,deliveryTimes,printTimes,deliveryTimeKnown,printTimeKnown,reason,recordCount:records.length,excludedRecordCount,missingCategoryRows,unreadableRecordRows,tableCount:detailTables.length,origin:location.origin};
  }
  if(action==='returnPatientList'){
    const button=document.getElementById('NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_btnReSelect');
    if(!visible(button)||button.disabled||button.value!=='重選病人')throw new Error('找不到「重選病人」按鈕，請手動返回清單。');
    button.click();return {returned:true};
  }
  if(action==='switch'){
    const select=locate(payload.control), option=choices(select).find(o=>o.code===payload.ward);
    if(!option)throw new Error('找不到指定病房 '+payload.ward);
    if(select.id===ntuhPrefix+'ddlListWard'){
      const input=document.getElementById(ntuhPrefix+'txbWardCode');
      const button=document.getElementById(ntuhPrefix+'btnQueryInBed');
      if(!input||input.type!=='text'||!button||button.type!=='submit'||button.value!=='查詢'||!visible(button)||button.disabled)throw new Error('院內病房輸入框或病床查詢按鈕未就緒，請等頁面完成後再試。');
      const setInput=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setInput.call(input,option.code);
      // These are the exact bed-query fields, never the patient-query fields.
      for(const suffix of ['txbRoomCode','txbBedCode']){const field=document.getElementById(ntuhPrefix+suffix);if(field&&field.type==='text')setInput.call(field,'');}
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,option.value);
      // No select change event: its inline handler would submit an extra postback.
      input.dispatchEvent(new Event('input',{bubbles:true}));
      button.click();
      return {changed:true,queried:true,mode:'ntuh-query'};
    }
    if(select.value===option.value)return {changed:false};
    // Only the positively identified ward selector is changed. No generic buttons.
    const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;
    setter.call(select,option.value);
    select.dispatchEvent(new Event('input',{bubbles:true}));
    select.dispatchEvent(new Event('change',{bubbles:true}));
    return {changed:true};
  }
  if(action==='diagnostic'){
    // Deliberately excludes patient text, names, accounts, URLs and field values.
    return {version:2,readyState:document.readyState,selectCount:document.querySelectorAll('select').length,frameCount:document.querySelectorAll('iframe,frame').length,tableCount:document.querySelectorAll('table').length,ntuhBedQuery:{wardInputPresent:!!document.getElementById(ntuhPrefix+'txbWardCode'),buttonPresent:!!document.getElementById(ntuhPrefix+'btnQueryInBed')},controls:discover().map(c=>({id:c.id,name:c.name,index:c.index,mode:c.mode,wardCodes:c.options.map(o=>o.code),hasInlineChange:!!document.querySelectorAll('select')[c.index].getAttribute('onchange')})),hasAspNetPostback:typeof window.__doPostBack==='function'};
  }
  throw new Error('未知操作');
}
window.pageBridge=pageBridge;
