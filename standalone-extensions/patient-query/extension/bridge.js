// This function is serialized into the selected portal frame; keep it self-contained.
export function portalBridge(action, payload = {}) {
  try {
    const Q='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_QueryInPatientByBedBox_';
    const GRID='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_InPatientListBox_grvInPatientList';
    const MEDGRID='tblMedCareList',MEDSCOPE='divMedCareList';
    const INFO='NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_InPatientInfoBox';
    const BACK='NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_btnReSelect';
    const SCOPE='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_divInPatientListBox';
    const guard=window.__patientPickerGuardV2;
    const clean=s=>String(s??'').normalize('NFKC').replace(/\s+/g,' ').trim();
    const norm=s=>clean(s).toUpperCase().replace(/[\s\-－_]/g,'');
    const text=e=>clean(e?.innerText??e?.textContent??'');
    const visible=e=>!!e&&!!e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).opacity!=='0';
    const byId=id=>document.getElementById(id);
    if(payload.origin&&location.origin!==payload.origin)throw new Error('院內頁面網站已變更，請重新連接。');
    let prm=null;try{prm=window.Sys?.WebForms?.PageRequestManager?.getInstance();}catch{}
    if(action==='diagnostic'){
      // Allowlisted structure only: no text, values, URL, HTML, or patient data.
      const describe=id=>{const e=byId(id);return {present:!!e,visible:visible(e),disabled:!!e?.disabled,type:e?.type||''};};
      const select=byId(Q+'ddlListWard'),table=byId(GRID),button=byId(Q+'btnQueryInBed'),smart=smartControl();
      let parsed;try{const p=parseList();parsed={ready:p.ready,empty:!!p.empty,parsedCount:p.rows.length,layout:p.layout||'standard',serviceCount:p.rows.reduce((n,p)=>n+(p.careItems?.length||0),0),parseError:false};}catch{parsed={ready:false,parseError:true};}
      parsed.candidates=listTables().map(x=>({kind:x.table.id===GRID?'standard':x.smart?'smart':'alternate',rowCount:x.rows.length,columns:Object.keys(x.columns).filter(k=>x.columns[k]>=0)}));
      return {ok:true,diagnostic:{readyState:document.readyState,loginVisible:[...document.querySelectorAll('input[type="password"]')].some(visible),hasAjaxManager:!!prm,ajaxBusy:!!prm?.get_isInAsyncPostBack(),wardSelect:{...describe(Q+'ddlListWard'),optionCount:select?.options.length||0,hasInlineChange:!!select?.getAttribute('onchange')},wardInput:describe(Q+'txbWardCode'),queryButton:{...describe(Q+'btnQueryInBed'),labelMatches:clean(button?.value)==='查詢'},clearedButton:describe(Q+'btnQueryDischarge'),smartCare:{present:!!smart,checked:!!smart?.checked,disabled:!!smart?.disabled,hasClickHandler:!!smart?.getAttribute('onclick'),hasChangeHandler:!!smart?.getAttribute('onchange')},listState:parsed,emptyMessage:describe(Q+'lblMsg'),listScope:describe(SCOPE),roomInput:describe(Q+'txbRoomCode'),bedInput:describe(bedInput()?.id||Q+'txbBedNo'),table:{present:!!table,visible:visible(table),rowCount:table?.querySelectorAll('tr').length||0,selectLinkCount:table?[...table.querySelectorAll('a')].filter(a=>a.id.startsWith(GRID+'_')&&a.id.endsWith('_lbtnSelect')).length:0},returnButton:describe(BACK),visibleProgressCount:[...document.querySelectorAll('[aria-busy="true"],[role="progressbar"],[id*="UpdateProgress"]')].filter(visible).length}};
    }
    if([...document.querySelectorAll('input[type="password"]')].some(visible))return {ok:true,login:true,origin:location.origin,recognized:false};
    // randomUUID is unavailable on some HTTP intranet pages. This is only a
    // per-document identity marker, not an authentication or security token.
    const tracker=window.__patientPickerTrackerV1 ||= {doc:window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),ends:0,errors:0};
    if(prm&&tracker.prm!==prm){tracker.prm=prm;prm.add_endRequest((_,args)=>{tracker.ends++;if(args.get_error?.())tracker.errors++;});}
    const loading=()=>document.readyState==='loading'||!!prm?.get_isInAsyncPostBack()||[...document.querySelectorAll('[aria-busy="true"],[role="progressbar"],[id*="UpdateProgress"]')].some(visible);
    function codeParts(value){
      const s=clean(value).toUpperCase();
      if(/^0PI\s+I(?:$|[（(\-:：\s])/.test(s))return ['0PI I'];
      const m=/^([0-9][A-Z0-9]{1,5}(?:\s*\+\s*[0-9][A-Z0-9]{1,5})*)(?:$|[（(\-:：\s])/.exec(s);
      return m?m[1].split('+').map(clean).filter(x=>/[A-Z]/.test(x)):[];
    }
    function smartControl(){
      const med=byId('ckbMedCare');if(visible(med)&&med.type==='checkbox')return med;
      const matches=[...document.querySelectorAll('input[type="checkbox"]')].filter(e=>{
        if(!visible(e))return false;
        const label=[...(e.labels||[])].map(text).join(' '),parent=text(e.parentElement);
        return /smart.?care/i.test(e.id+' '+e.name+' '+label)||(parent.length<160&&/Smart\s*Care|智能藥事服務/i.test(parent));
      });
      return matches.length===1?matches[0]:null;
    }
    function bedInput(){return byId(Q+'txbBedNo')||byId(Q+'txbBedCode');}
    function control(){
      const select=byId(Q+'ddlListWard'),input=byId(Q+'txbWardCode'),button=byId(Q+'btnQueryInBed');
      // Discovery only needs the ward menu, as in the existing discharge tool.
      // The accompanying text field can be CSS-hidden and still submit its value.
      if(!visible(select)||select.multiple)return null;
      const options=[...select.options].filter(o=>!o.disabled).flatMap(o=>{
        const codes=codeParts(o.textContent);return (codes.length?codes:codeParts(o.value)).map(code=>({code,value:o.value}));
      });
      const inputWard=options.find(o=>norm(o.code)===norm(input?.value));
      const selected=select.selectedOptions?.[0];
      const cleared=byId(Q+'btnQueryDischarge'),smart=smartControl();
      const base=!select.disabled&&!!input&&input.type==='text'&&!input.disabled;
      const filters={room:clean(byId(Q+'txbRoomCode')?.value),bed:clean(bedInput()?.value)};
      return {options,selectedWard:inputWard?.code||codeParts(selected?.textContent)[0]||codeParts(select.value)[0]||'',filters,filtered:!!filters.room||!!filters.bed,enabled:base&&visible(button)&&button.type==='submit'&&clean(button.value)==='查詢'&&!button.disabled,clearedEnabled:base&&visible(cleared)&&!cleared.disabled&&clean(cleared.value||text(cleared))==='已清床',smartCare:smart?{checked:!!smart.checked,enabled:!smart.disabled}:null};
    }
    function mrnControl(){
      const inputs=[...document.querySelectorAll('input')].filter(e=>visible(e)&&!e.disabled&&e.type==='text'&&e.id.includes('_QueryInPatientBox_')&&/_(?:txb|txt)(?:ChartNo|ChartNumber|MRN)$/i.test(e.id));
      if(inputs.length!==1)return null;
      const input=inputs[0],prefix=input.id.slice(0,input.id.lastIndexOf('_')+1);
      const buttons=[...document.querySelectorAll('input,button')].filter(e=>visible(e)&&!e.disabled&&e.id.startsWith(prefix)&&/btnQuery/i.test(e.id)&&clean(e.value||text(e))==='查詢');
      return buttons.length===1?{input,button:buttons[0],prefix,fields:{mrn:input,account:byId(prefix+'txbAccountIdse'),personId:byId(prefix+'txbPersonId')}}:null;
    }
    function personQuery(){const c=mrnControl();return c?Object.fromEntries(Object.entries(c.fields).map(([key,e])=>[key,clean(e?.value)])):null;}
    function cells(row){return [...row.children].filter(e=>/^(TD|TH)$/.test(e.tagName));}
    function tableShape(table,includeHidden=false){
      const rows=[...table.querySelectorAll('tr')].filter(r=>r.closest('table')===table&&(includeHidden||visible(r)));
      const header=rows.find(r=>r.classList.contains('tableTitle')||cells(r).some(e=>e.tagName==='TH')||cells(r).some(e=>['帳號','住院帳號'].includes(norm(text(e))))&&cells(r).some(e=>['姓名','病人姓名'].includes(norm(text(e)))));
      const labels=header?cells(header).map(e=>norm(text(e))):[];
      const locate=names=>labels.findIndex(s=>names.includes(s));
      const columns={account:locate(['帳號','住院帳號']),department:locate(['科別']),ward:locate(['病房']),room:locate(['病室','房號']),bed:locate(['病床','床號']),name:locate(['姓名','病人姓名']),sex:locate(['性別']),age:locate(['年齡']),mrn:locate(['病歷號','病歷號碼']),admit:locate(['入','入院日','入院日期','住院日期']),discharge:locate(['出','出院日','出院日期']),status:locate(['出院狀態','住院狀態','狀態']),note:locate(['備註','註記']),drg:locate(['DRG']),care:labels.findIndex(s=>/智能藥事服務|SMARTCARE/.test(s))};
      // The supplied system layout has an unlabeled remark column between
      // status and DRG. Only use that fallback when both neighboring headers match.
      if(columns.note<0&&columns.status>=0&&columns.drg===columns.status+2&&labels[columns.status+1]==='')columns.note=columns.status+1;
      let scoped=false,smart=false;for(let e=table;e&&e!==document.body;e=e.parentElement){if(e.id===SCOPE||e.id?.startsWith('NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox'))scoped=true;if(/smart.?care/i.test(e.id||''))smart=true;}
      return {table,rows,header,columns,scoped,smart:smart||table.id===MEDGRID};
    }
    function listTables(){
      return [...document.querySelectorAll('table')].filter(visible).map(t=>tableShape(t)).filter(x=>[GRID,MEDGRID].includes(x.table.id)||(x.scoped||x.smart)&&['account','ward','room','bed','name'].every(k=>x.columns[k]>=0));
    }
    function listTable(){
      const candidates=listTables();
      const smart=smartControl()?.checked?candidates.filter(x=>x.smart):[];
      const available=smart.length?smart:candidates;
      if(available.length>1)throw new Error('同時出現多份病人名單，無法唯一辨識目前結果。請匯出相容性資訊。');
      return available[0]||null;
    }
    function selectLinks(row,includeHidden=false){return [...row.querySelectorAll('a,input,button')].filter(e=>(includeHidden||visible(e))&&e.id&&e.closest('tr')===row&&(/_lbtnSelect$/i.test(e.id)||/^(選|選取|選擇)$/.test(clean(e.value||text(e)))&&/__doPostBack|WebForm_DoPostBack/.test((e.getAttribute('href')||'')+(e.getAttribute('onclick')||''))));}
    function emptyText(s){return /^(?:查無(?:病人)?資料|查無病人|沒有病人資料|無病人資料|沒有資料|無資料|共0筆|共0筆資料)[。!！]?$/.test(clean(s).replace(/\s+/g,''));}
    function parseList(){
      const message=byId(Q+'lblMsg');
      const blank={ready:true,rows:[],pagination:false,empty:true};
      const op=guard?.read();if(payload.token&&op?.token===payload.token&&op.kind==='query'&&op.empty)return blank;
      if(smartControl()?.checked&&byId(MEDGRID))return visible(byId(MEDGRID))?parseMedCare():{ready:false,rows:[],pagination:false};
      const chosen=listTable(),scope=byId(SCOPE);
      // An alternate Smart Care grid can coexist with the old ordinary message.
      if((!chosen||chosen.table.id===GRID)&&visible(message)&&emptyText(text(message)))return blank;
      if(!chosen)return visible(scope)&&(emptyText(text(scope))||!text(scope))?blank:{ready:false,rows:[],pagination:false};
      return parsePatientTable(chosen);
    }
    function parsePatientTable(chosen,includeHidden=false){
      const {table,rows,header,columns}=chosen;
      const parsed=[];
      for(const row of rows){
        if(row===header)continue;
        const links=selectLinks(row,includeHidden);
        const values=cells(row).map(text);let index=columns.account;
        if(index<0)index=values.findIndex(v=>/^\d{2}[A-Z]\d{8}$/i.test(v));
        if(!links.length&&!/^\d{2}[A-Z]\d{8}$/i.test(values[index]||''))continue;
        if(index<0||links.length>1)throw new Error('病人清單欄位無法唯一辨識，請在原系統確認。');
        const at=(key,offset)=>values[columns[key]>=0?columns[key]:index+offset]||'';
        const account=values[index].toUpperCase(),ward=at('ward',2),room=at('room',3),bed=at('bed',4),name=at('name',5);
        if(!/^\d{2}[A-Z]\d{8}$/.test(account)||!codeParts(ward).length||!room||!bed||!name)throw new Error('病人清單格式與已知格式不同，未使用這份名單。');
        const sexRaw=at('sex',6).toUpperCase(),age=at('age',7);
        const field=key=>columns[key]>=0?values[columns[key]]||'':'';
        const actions=rowActions(row,columns.drg).map(x=>({key:x.key,label:x.label}));
        parsed.push({account,ward,room,bed,name,sex:sexRaw==='M'?'男':sexRaw==='F'?'女':sexRaw,age,mrn:field('mrn'),department:field('department'),admit:field('admit'),discharge:field('discharge'),status:field('status'),note:field('note'),drg:field('drg'),actions,selectable:links.length===1&&!links[0].disabled&&links[0].getAttribute('aria-disabled')!=='true',selectId:links[0]?.id||'',rowId:row.id||''});
      }
      if(new Set(parsed.map(p=>p.account)).size!==parsed.length)throw new Error('名單含重複住院帳號，請重新查詢。');
      const pagination=[...table.querySelectorAll('a,button,input')].some(e=>(includeHidden||visible(e))&&!e.disabled&&(/Page\$/i.test((e.getAttribute('href')||'')+(e.getAttribute('onclick')||''))||/^(下一頁|下頁|Next)/i.test(text(e)||e.value||'')));
      const nonHeaders=rows.filter(r=>r!==header);
      const headerOnly=rows.length===0||!!header&&columns.account>=0&&columns.name>=0&&columns.ward>=0&&nonHeaders.length===0;
      const emptyRow=parsed.length===0&&nonHeaders.length>0&&nonHeaders.every(r=>emptyText(text(r)));
      return {ready:parsed.length>0||headerOnly||emptyRow,rows:parsed,pagination,empty:headerOnly||emptyRow};
    }
    function medRow(index){const shape=tableShape(byId(MEDGRID));return shape.rows[index];}
    function medLinks(row,label){return [...row.querySelectorAll('a')].filter(e=>e.closest('tr')===row&&visible(e)&&text(e).toLowerCase()===label&&!e.disabled&&e.getAttribute('aria-disabled')!=='true');}
    function medCareItems(row,careColumn,account){
      const cell=cells(row)[careColumn];if(!cell)return [];
      return [...cell.querySelectorAll('div[onclick]')].filter(e=>visible(e)&&/^\s*CareBriefRead\(/.test(e.getAttribute('onclick')||'')).map((e,i)=>{
        const match=/^\s*CareBriefRead\(\s*(\{[\s\S]*\})\s*,\s*this\s*\)\s*;?\s*$/.exec(e.getAttribute('onclick')||'');
        let data;try{data=match&&JSON.parse(match[1]);}catch{}
        if(!data||norm(data.AccountIdse)!==norm(account))throw new Error('Smart Care 服務內容與住院帳號不一致，未使用這份名單。');
        const next=e.nextElementSibling,detail=next?.classList.contains('hover')?clean(next.textContent):'';
        return {key:'care:'+i,label:text(e),detail,element:e};
      });
    }
    function parseMedCare(){
      const shape=tableShape(byId(MEDGRID)),{rows,header,columns}=shape;
      if(!header||['bed','name','sex','age','care'].some(k=>columns[k]<0))throw new Error('Smart Care 表頭與勘查格式不同，請匯出相容性資訊。');
      const dataRows=rows.filter(r=>r!==header&&!emptyText(text(r)));
      if(!dataRows.length)return {ready:true,rows:[],pagination:false,empty:true,layout:'medcare'};
      const standard=byId(GRID);if(!standard)throw new Error('缺少核對 Smart Care 住院帳號的一般清單，請重新查詢。');
      // The captured MedCare table has no account field or link IDs. Join it
      // to the same page's hidden ordinary grid by full bed and exact name,
      // never by row position. Hidden controls are read only, never clicked.
      const base=parsePatientTable(tableShape(standard,true),true);
      if(!base.ready)throw new Error('一般病人清單尚未就緒，無法核對 Smart Care 身分。');
      const result=dataRows.map(row=>{
        const values=cells(row).map(text),name=values[columns.name],bed=values[columns.bed];
        const matches=base.rows.filter(p=>norm([p.ward,p.room,p.bed].join('-'))===norm(bed)&&clean(p.name)===clean(name));
        if(matches.length!==1)throw new Error('Smart Care 的床號與姓名無法唯一對應住院帳號，請重新查詢。');
        const p=matches[0],sex=values[columns.sex]?.toUpperCase(),sexLabel=sex==='M'?'男':sex==='F'?'女':sex,age=values[columns.age];
        if(sexLabel&&p.sex&&sexLabel!==p.sex||age&&p.age&&norm(age)!==norm(p.age))throw new Error('Smart Care 與一般名單的病人資料不同，請重新查詢。');
        const links=medLinks(row,'選');if(links.length>1)throw new Error('Smart Care 選人入口不唯一，未選取病人。');
        const items=medCareItems(row,columns.care,p.account),lab=medLinks(row,'lab');
        return {...p,selectable:links.length===1,selectId:'',selectRow:rows.indexOf(row),selection:'medcare',careText:values[columns.care]||'',careItems:items.map(({key,label,detail})=>({key,label,detail})),actions:[...items.map(({key,label})=>({key,label})),...(lab.length===1?[{key:'lab',label:'Lab'}]:[])]};
      });
      if(new Set(result.map(p=>p.account)).size!==result.length)throw new Error('Smart Care 名單含重複住院帳號，請重新查詢。');
      return {ready:true,rows:result,pagination:base.pagination,empty:false,layout:'medcare'};
    }
    function rowActions(row,drgColumn=-1){
      const cs=[...row.children].filter(e=>/^(TD|TH)$/.test(e.tagName));
      const found=[...row.querySelectorAll('a,button,input')].filter(e=>visible(e)&&!e.disabled&&e.closest('tr')===row).flatMap(e=>{
        const label=clean(e.value||text(e));let key=label==='Note'?'note':label==='查'?'query':label==='!'?'alert':'';
        if(!key&&drgColumn>=0&&e.closest('td,th')===cs[drgColumn]&&/^\d+$/.test(label))key='drg';
        return key?[{key,label,element:e}]:[];
      });
      return found.filter(x=>found.filter(y=>y.key===x.key).length===1);
    }
    function patient(expected={}){
      const chart=byId(INFO+'_lblChartNo'),back=byId(BACK);
      if(!visible(chart)||!visible(back))return {ready:false};
      const info=[...document.querySelectorAll('[id]')].filter(e=>e.id.startsWith(INFO)&&visible(e)&&!e.children.length);
      const accounts=new Set(info.flatMap(e=>[...text(e).matchAll(/\b\d{2}[A-Z]\d{8}\b/gi)].map(m=>m[0].toUpperCase())));
      const names=info.filter(e=>/name/i.test(e.id)).map(text);
      const name=expected.name?(info.some(e=>text(e)===clean(expected.name))?clean(expected.name):''):names.length===1?names[0]:'';
      const mrn=text(chart),account=accounts.size===1?[...accounts][0]:'';
      return {ready:!!account&&!!name&&/^\d{1,12}$/.test(mrn)&&!loading(),account,name,mrn,returnable:true};
    }
    function settlementDetail(expected={}){
      const detail=patient(expected),warnings=[];
      const contents=[...document.querySelectorAll('td,th,span,label,div,p')].filter(visible).map(text);
      if(contents.some(s=>/以下是大於.{0,45}仍有餘量\s*>\s*0\s*的藥帳.{0,15}請先退藥/.test(s)))warnings.push('大於出院日或今日仍有餘量 > 0 的藥帳，請先退藥。');
      if(contents.some(s=>/以下是已停用但餘量\s*>\s*0\s*的出院藥.{0,15}請先退藥/.test(s)))warnings.push('已停用但餘量 > 0 的出院藥，請先退藥。');
      for(const e of document.querySelectorAll('[role="alert"],.validation-summary-errors'))if(visible(e)&&text(e))warnings.push(text(e));
      let medStatus='';
      for(const e of document.querySelectorAll('td,th,span,label')){
        if(!visible(e)||!['藥帳','藥品結清狀態','藥帳狀態'].includes(text(e)))continue;
        const cell=e.closest('td,th'),next=cell?.nextElementSibling;
        if(next&&!next.querySelector('table')){medStatus=text(next);break;}
      }
      if(!medStatus)medStatus=[...document.querySelectorAll('[id*="MedRelatedInfoBox"]')].filter(e=>visible(e)&&!e.children.length).map(text).find(s=>/^(未結清|已結清|結清)$/.test(s))||'';
      const buttons=['NTUHWeb1_MedProcessBox_MedRelatedInfoBox_btnAllowDischarge','NTUHWeb1_MedRelatedInfoBox_btnAllowDischarge'].map(byId).filter(e=>visible(e)&&!e.disabled&&clean(e.value)==='結清');
      return {...detail,loading:loading(),medStatus,settled:/^(?:已)?結清(?:\s*[(（].*[)）])?$/.test(medStatus),warnings:[...new Set(warnings)],buttonId:buttons.length===1?buttons[0].id:'',operation:guard?.read()||null};
    }
    const tracked=()=>[byId(GRID),byId(Q+'lblMsg'),byId(SCOPE),byId(MEDGRID),byId(MEDSCOPE),...listTables().map(x=>x.table)].filter((e,i,a)=>e&&a.indexOf(e)===i);
    const signature=()=>{const value=tracked().filter(visible).map(e=>e.id+'|'+text(e)).join('|');let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return (h>>>0).toString(16);};
    const marker=()=>({doc:tracker.doc,ends:tracker.ends,errors:tracker.errors,signature:signature()});
    const completed=(baseline,token)=>!!baseline&&(tracker.doc!==baseline.doc||tracker.ends>baseline.ends||signature()!==baseline.signature||tracked().some(e=>visible(e)&&e.dataset.patientPickerToken!==token)||guard?.read()?.token===token&&guard.read().empty);
    function begin(){
      if(payload.deadline&&Date.now()>payload.deadline)throw new Error('頁面操作已逾時，請重新查詢。');
      if(loading())throw new Error('院內系統仍在載入，請稍候。');
      if(payload.expectedDoc&&payload.expectedDoc!==tracker.doc)throw new Error('院內頁面剛已更新，請重試。');
      const baseline=marker();for(const e of tracked())e.dataset.patientPickerToken=payload.token;
      return baseline;
    }
    if(action==='discover'){
      const c=control();return {ok:true,origin:location.origin,recognized:!!c||visible(byId(BACK)),control:c,returnable:visible(byId(BACK)),canQueryMRN:!!mrnControl(),loading:loading(),marker:marker(),patient:patient(payload.expected)};
    }
    if(action==='setSmartCare'){
      const smart=smartControl();if(!smart||smart.disabled)throw new Error('Smart Care 選項目前無法切換。');
      const baseline=begin(),changed=smart.checked!==!!payload.checked;
      if(changed){guard?.arm(payload.token,'query');smart.click();}
      return {ok:true,baseline,changed,expectsPostback:/__doPostBack|WebForm_DoPostBack/.test((smart.getAttribute('onclick')||'')+(smart.getAttribute('onchange')||''))};
    }
    if(action==='queryWard'){
      const c=control(),option=c?.options.find(o=>norm(o.code)===norm(payload.ward));
      if(!option)throw new Error('原系統找不到指定的病房選項，請重新連接。');
      const source=payload.source||'inbed';if(!['inbed','cleared'].includes(source))throw new Error('未知的病人名單來源。');
      if(!(source==='cleared'?c.clearedEnabled:c.enabled))throw new Error('已找到病房選單，但病房輸入框或「'+(source==='cleared'?'已清床':'查詢')+'」按鈕尚未就緒。請在原系統確認後重試。');
      const smart=smartControl();
      const room=clean(payload.room),bed=clean(payload.bed);
      if(room&&!/^\d{1,3}$/.test(room)||bed&&!/^[A-Z0-9]{1,2}$/.test(bed)||bed&&!room)throw new Error('病室或床號格式不正確，未送出查詢。');
      const filterFields=[[byId(Q+'txbRoomCode'),room],[bedInput(),bed]];
      for(const [field,value]of filterFields)if(value&&(!field||field.type!=='text'||field.disabled)||field&&clean(field.value)&&field.disabled)throw new Error('原系統病室或床號欄位無法設定，未送出查詢。');
      const baseline=begin();
      if(typeof payload.smartCare==='boolean'){
        if(payload.smartCare&&!smart)throw new Error('此頁沒有可辨識的 Smart Care 選項。');
        if(smart&&smart.checked!==payload.smartCare)throw new Error('Smart Care 尚未完成切換，未送出查詢。');
      }
      const input=byId(Q+'txbWardCode');
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setter.call(input,option.code);
      for(const [field,value]of filterFields)if(field&&field.type==='text')setter.call(field,value);
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(byId(Q+'ddlListWard'),option.value);
      // Match the working discharge tool. Do not dispatch select.change: the
      // hospital's inline handler can post back before the explicit query click.
      input.dispatchEvent(new Event('input',{bubbles:true}));
      guard?.arm(payload.token,'query');
      byId(Q+(source==='cleared'?'btnQueryDischarge':'btnQueryInBed')).click();return {ok:true,baseline,source};
    }
    if(action==='queryMRN'||action==='queryPerson'){
      const kind=action==='queryMRN'?'mrn':payload.kind,value=clean(action==='queryMRN'?payload.mrn:payload.value).toUpperCase();
      const patterns={mrn:/^\d{4,12}$/,account:/^\d{2}[A-Z]\d{8}$/,personId:/^[A-Z](?:\d{9}|[A-Z]\d{8})$/};
      if(!patterns[kind]?.test(value))throw new Error('請輸入完整且格式正確的病歷號、住院帳號或身分證號。');
      const c=mrnControl(),field=c?.fields[kind];if(!c||!field||!visible(field)||field.disabled||field.type!=='text')throw new Error('原系統目前沒有可使用的對應病人查詢欄位。');
      for(const e of Object.values(c.fields))if(e&&(e.type!=='text'||e.disabled&&clean(e.value)))throw new Error('原系統仍有無法清除的病人查詢條件，未送出。');
      const baseline=begin(),setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      for(const e of Object.values(c.fields))if(e&&!e.disabled)setter.call(e,'');
      const nameBox=byId(c.prefix+'PatientBasicInfoQueryByNameBox');
      if(nameBox){for(const e of nameBox.querySelectorAll('input[type="text"]'))if(!e.disabled)setter.call(e,'');for(const e of nameBox.querySelectorAll('select'))if(!e.disabled)Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'');}
      setter.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));
      if(field.value!==value)throw new Error('查詢條件未正確填入，未送出。');
      guard?.arm(payload.token,'query');c.button.click();return {ok:true,baseline};
    }
    if(action==='list'){
      const c=control(),list=loading()?{ready:false,rows:[],pagination:false}:parseList();
      return {ok:true,...list,origin:location.origin,control:c,personQuery:personQuery(),loading:loading(),marker:marker(),completed:completed(payload.baseline,payload.token),queryError:payload.baseline?.doc===tracker.doc&&tracker.errors>payload.baseline.errors};
    }
    if(action==='return'){
      if(control())return {ok:true,already:true};
      const back=byId(BACK);if(!visible(back)||back.disabled||clean(back.value)!=='重選病人')throw new Error('請在原系統回到「查詢處理／重選病人」。');
      begin();back.click();return {ok:true};
    }
    if(action==='select'||action==='rowAction'){
      if(payload.deadline&&Date.now()>payload.deadline)throw new Error('頁面操作已逾時，請重新選取。');
      if(loading())throw new Error('名單仍在載入，未選取病人。');
      const list=parseList();
      const matches=list.rows.filter(p=>norm(p.account)===norm(payload.patient.account)&&clean(p.name)===clean(payload.patient.name)&&norm(p.ward)===norm(payload.patient.ward)&&norm(p.room)===norm(payload.patient.room)&&norm(p.bed)===norm(payload.patient.bed));
      if(!list.ready||matches.length!==1)throw new Error('病人的床號或住院資料已變更，請重新整理名單後再選擇。');
      const match=matches[0];if(payload.patient.mrn&&match.mrn&&norm(payload.patient.mrn)!==norm(match.mrn))throw new Error('病歷號與清單不同，未選取病人。');
      if(match.selection==='medcare'){
        const row=medRow(match.selectRow);if(!row)throw new Error('Smart Care 病人列已變更，請重新整理。');
        let target;
        if(action==='select')target=match.selectable?medLinks(row,'選')[0]:null;
        else if(payload.key==='lab'&&payload.label==='Lab')target=medLinks(row,'lab').length===1?medLinks(row,'lab')[0]:null;
        else if(/^care:\d+$/.test(payload.key||''))target=medCareItems(row,tableShape(byId(MEDGRID)).columns.care,match.account).find(x=>x.key===payload.key&&x.label===payload.label)?.element;
        if(!target)throw new Error('Smart Care 的選人或服務入口已變更，請重新整理。');
        target.click();return {ok:true};
      }
      if(action==='rowAction'){
        if(!['note','query','alert','drg'].includes(payload.key))throw new Error('未知的原系統功能。');
        const chosen=listTable();if(!chosen)throw new Error('原系統名單已變更。');const {table,rows,columns}=chosen;
        const row=rows.find(r=>[...r.children].some(c=>text(c)===match.account));
        if(!row)throw new Error('原系統病人列已變更。');
        const target=rowActions(row,columns.drg).find(x=>x.key===payload.key);
        if(!target)throw new Error('此病人的原系統功能目前無法使用。');
        target.element.click();return {ok:true};
      }
      if(!match.selectable)throw new Error('原系統目前未提供這位病人的選取功能。');
      const link=byId(match.selectId);if(!visible(link))throw new Error('病人選取按鈕已變更，請重新整理。');
      link.click();return {ok:true};
    }
    if(action==='patient')return {ok:true,origin:location.origin,loading:loading(),...patient(payload.expected)};
    if(action==='armSettlement'){
      if(!guard)throw new Error('結清警示監測尚未載入，請重新整理原系統後重試。');
      begin();guard.arm(payload.token,'settlement');return {ok:true};
    }
    if(action==='settlementState'){guard?.ensure();return {ok:true,...settlementDetail(payload.expected)};}
    if(action==='settle'){
      if(payload.deadline&&Date.now()>payload.deadline)throw new Error('結清操作已逾時，未送出。');
      guard?.ensure();const d=settlementDetail(payload.expected),op=d.operation,e=payload.expected;
      if(!guard||op?.token!==payload.token||op.kind!=='settlement'||op.blocked)throw new Error('結清監測已中止，未送出。');
      if(!d.ready||d.loading||norm(d.account)!==norm(e.account)||d.name!==clean(e.name)||e.mrn&&norm(d.mrn)!==norm(e.mrn))throw new Error('病人身分不一致，未送出結清。');
      if(d.warnings.length)throw new Error(d.warnings.join('；'));
      if(d.settled)return {ok:true,already:true};
      const button=byId(d.buttonId);
      if(!button||!/confirm\(['"]確定執行藥品結清[?？]['"]\)/.test(button.getAttribute('onclick')||''))throw new Error('未找到可辨識的結清按鈕與確認，未執行。');
      guard.sending(payload.token,button.id);button.click();return {ok:true,operation:guard.read()};
    }
    if(action==='clearOperation'){guard?.clear(payload.token);return {ok:true};}
    throw new Error('未知的導航操作。');
  }catch(error){return {ok:false,error:error.message||'無法讀取院內頁面。'};}
}

// Runs in the isolated world so the page never receives extension APIs.
export function installReturnButton(){
  const id='ntuh-patient-picker-return';if(document.getElementById(id))return;
  const host=document.createElement('div');host.id=id;
  const shadow=host.attachShadow({mode:'closed'}),style=document.createElement('style'),button=document.createElement('button');
  style.textContent=':host{position:fixed;right:18px;bottom:18px;z-index:2147483645}button{font:14px/1.5 "Microsoft JhengHei",sans-serif;background:#0b705a;color:white;border:1px solid #fff;border-radius:8px;padding:10px 16px;box-shadow:0 2px 10px #0003;cursor:pointer}button:focus-visible{outline:3px solid #76d9ba;outline-offset:3px}';
  button.type='button';button.textContent='← 選擇其他病人';button.addEventListener('click',()=>chrome.runtime.sendMessage({kind:'patient-picker-focus'}));
  shadow.append(style,button);document.documentElement.append(host);
}
