// Minimal browser DOM adapter for the exact selectors used by the bridge.
// This is a synthetic fixture, not a captured patient record or browser E2E test.
const vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
class Element {
  constructor(tag,attrs={},text=''){this.tagName=tag.toUpperCase();this.attrs={...attrs};this.id=attrs.id||'';this.type=attrs.type||'';this.name=attrs.name||'';this._value=attrs.value||'';this._text=text;this.children=[];this.parentElement=null;this.dataset={};this.checked=!!attrs.checked;this.disabled=!!attrs.disabled;this.hidden=!!attrs.hidden;this.classList={contains:v=>(this.attrs.class||'').split(' ').includes(v)};}
  get value(){return this._value;}set value(v){this._value=String(v);}
  get textContent(){return [this._text,...this.children.map(x=>x.textContent)].join(' ');}set textContent(v){this._text=String(v);this.children=[];}
  get innerText(){if(!this.getClientRects().length)return this.textContent;return [this._text,...this.children.filter(x=>x.getClientRects().length).map(x=>x.innerText)].join(' ');}
  get options(){return this.querySelectorAll('option');}get selectedOptions(){return this.options.filter(x=>x.value===this.value);}
  append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}}
  getAttribute(k){return this.attrs[k]??null;}
  setAttribute(k,v){this.attrs[k]=v;if(k==='id')this.id=v;}
  getClientRects(){for(let n=this;n;n=n.parentElement)if(n.hidden||/display\s*:\s*none/i.test(n.attrs.style||''))return [];return [{}];}
  querySelectorAll(selector){const results=[];const walk=n=>{for(const c of n.children){if(matches(c,selector))results.push(c);walk(c);}};walk(this);return results;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  get nextElementSibling(){const a=this.parentElement?.children||[];return a[a.indexOf(this)+1]||null;}
  closest(selector){for(let n=this;n;n=n.parentElement)if(matches(n,selector))return n;return null;}
  click(){if(this.disabled)return;if(this.type==='checkbox'){this.checked=!this.checked;this.onClick?.();this.onEvent?.({type:'input',bubbles:true});this.onEvent?.({type:'change',bubbles:true});}else this.onClick?.();}
  dispatchEvent(event){this.onEvent?.(event);return true;}
}
function matches(node,selector){return selector.split(',').some(raw=>{
  const s=raw.trim(),tag=/^[a-z]+/i.exec(s)?.[0];if(tag&&node.tagName!==tag.toUpperCase())return false;
  for(const m of s.matchAll(/\.([\w-]+)/g))if(!(node.attrs.class||'').split(' ').includes(m[1]))return false;
  for(const m of s.matchAll(/\[([\w-]+)(?:([*^$]?=)"([^"]*)")?\]/g)){
    const value=m[1]==='id'?node.id:m[1]==='type'?node.type:node.getAttribute(m[1]);if(!m[2]){if(!value)return false;continue;}
    if(value==null)return false;const v=String(value),wanted=m[3];
    if(m[2]==='='&&v!==wanted||m[2]==='*='&&!v.includes(wanted)||m[2]==='^='&&!v.startsWith(wanted)||m[2]==='$='&&!v.endsWith(wanted))return false;
  }
  return true;
});}
class Input extends Element {get value(){return this._value;}set value(v){this._value=String(v);}}
class Select extends Element {get value(){return this._value;}set value(v){this._value=String(v);}}
const Q='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_QueryInPatientByBedBox_';
const P='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_QueryInPatientByPersonBox_';
const GRID='NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_InPatientListBox_grvInPatientList';
const INFO='NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_InPatientInfoBox';
const BACK='NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_btnReSelect';
const DATA=[
 {account:'26A00000001',ward:'12PE',room:'12',bed:'A',name:'測試甲',sex:'M',age:'6歲',mrn:'00001001'},
 {account:'26A00000002',ward:'12PE',room:'12',bed:'B',name:'測試乙',sex:'F',age:'4歲',mrn:'00001002'},
 {account:'26A00000003',ward:'12PE',room:'01',bed:'1',name:'同名測試',sex:'M',age:'5歲',mrn:'00001003'},
 {account:'26A00000004',ward:'12PW',room:'01',bed:'1',name:'同名測試',sex:'F',age:'8歲',mrn:'00001004'}
];
const CLEARED=[
 {account:'26A00000005',ward:'12PE',room:'01',bed:'01',name:'歐陽測試欣怡',sex:'F',age:'11y2m',mrn:'00001005',discharge:'2026/10/06',status:'準備出院',note:'待完成出院作業',drg:'24103'},
 {account:'26A00000006',ward:'12PE',room:'12',bed:'B',name:'已清床測試',sex:'M',age:'8y6m',mrn:'00001006',discharge:'2026/10/05',status:'完成出院結帳',note:''},
 {account:'26A00000007',ward:'12PW',room:'02',bed:'01',name:'已出院測試',sex:'F',age:'3y4m',mrn:'00001007',discharge:'2026/10/05',status:'已出院',note:''}
];
function makePortal(bridgePath){
  const root=new Element('html'),body=new Element('body');root.append(body);
  const listeners={};
  const doc={documentElement:root,body,readyState:'complete',querySelectorAll:s=>root.querySelectorAll(s),getElementById:id=>root.querySelectorAll('[id]').find(e=>e.id===id)||null,addEventListener(type,fn){(listeners[type]||=new Set()).add(fn);},removeEventListener(type,fn){listeners[type]?.delete(fn);}};
  const get=id=>doc.getElementById(id),el=(tag,attrs={},text='')=>tag==='input'?new Input(tag,attrs,text):tag==='select'?new Select(tag,attrs,text):new Element(tag,attrs,text);
  const select=el('select',{id:Q+'ddlListWard',value:'12PE'});
  for(const code of ['12PE','12PW','12A','14C','04E2','07HS','11PE+11PW','0PI I'])select.append(el('option',{value:code},code+' 測試病房'));
  body.append(select,el('input',{id:Q+'txbWardCode',type:'text',value:'12PE'}),el('input',{id:Q+'txbRoomCode',type:'text',value:'99'}),el('input',{id:Q+'txbBedNo',type:'text',value:'Z'}),el('input',{id:Q+'btnQueryInBed',type:'submit',value:'查詢'}),el('span',{id:Q+'lblMsg',hidden:true}));
  body.append(el('input',{id:Q+'btnQueryDischarge',type:'submit',value:'已清床'}));
  const smartLabel=el('label',{},'智能藥事服務 Smart Care');smartLabel.append(el('input',{id:'PatientSmartCare',type:'checkbox'}));body.append(smartLabel);
  body.append(el('input',{id:P+'txbChartNo',type:'text'}),el('input',{id:P+'txbAccountIdse',type:'text'}),el('input',{id:P+'txbPersonId',type:'text'}),el('input',{id:P+'btnQuery',type:'submit',value:'查詢'}));
  const nameBox=el('span',{id:P+'PatientBasicInfoQueryByNameBox'}),nameInput=el('input',{type:'text',value:'舊姓名條件'}),nameSelect=el('select',{value:'old'});nameSelect.append(el('option',{value:''}),el('option',{value:'old'},'舊候選'));nameBox.append(nameInput,nameSelect);body.append(nameBox);
  const callbacks=[],prm={busy:false,get_isInAsyncPostBack(){return this.busy;},add_endRequest(fn){callbacks.push(fn);}};
  const fixture={doc,get,clicks:[],defer:false,pending:null,prm,portal:null,currentSource:'inbed',nameInput,nameSelect,medStatuses:new Map(),data:DATA.map((x,i)=>({...x,personId:'A1'+String(i+1).padStart(8,'0'),note:i===0?'10/08 可出院':'',drg:i===0?'24103':'',smart:i===0})),clearedData:CLEARED.map((x,i)=>({...x,personId:'A1'+String(i+5).padStart(8,'0')}))};
  function remove(id){const n=get(id);if(n)n.parentElement.children=n.parentElement.children.filter(c=>c!==n);}
  const listIds=new Set([GRID]);
  function list(rows,options={}){
    const gridId=options.id||GRID;
    if(gridId===GRID)for(const id of listIds)remove(id);else remove(gridId);
    listIds.add(gridId);const table=el('table',{id:gridId}),header=el('tr',{class:'tableTitle'});
    for(const label of ['選','帳號','科別','病房','病室','病床','姓名','性別','年齡','入','出','狀態','','DRG',''])header.append(el('th',{},label));table.append(header);
    rows.forEach((p,i)=>{
      const row=el('tr'),cell=el('td'),link=el('a',{id:gridId+'_ctl'+(i+2)+'_lbtnSelect',href:'javascript:__doPostBack()'},'選');link.onClick=()=>{fixture.clicks.push(['select',p.account]);patient(p);};if(p.selectable!==false)cell.append(link);
      const action=(label,key)=>{const a=el('a',{id:gridId+'_ctl'+(i+2)+'_'+key,href:'javascript:__doPostBack()'},label);a.onClick=()=>fixture.clicks.push(['action',key,p.account]);return a;};
      cell.append(action('Note','note'));row.append(cell);
      for(const value of [p.account,'兒科',p.ward,p.room,p.bed,p.name,p.sex,p.age,p.admit??'2026/10/01',p.discharge||'',p.status||'住院中',p.note||''])row.append(el('td',{},value));
      const drg=el('td');if(p.drg)drg.append(action(p.drg,'drg'));row.append(drg);const extra=el('td');extra.append(action('查','query'),action('!','alert'));row.append(extra);table.append(row);
    });(fixture.medCareMode?get('NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_divInPatientListBox'):body).append(table);
    const msg=get(Q+'lblMsg');if(gridId===GRID){msg.hidden=rows.length>0;msg.textContent=rows.length?'':'查無病人資料';table.hidden=!rows.length;}
    if(fixture.medCareMode&&gridId===GRID)medList(rows);
  }
  function medList(rows){
    remove('divMedCareList');const wrap=el('div',{id:'divMedCareList'}),table=el('table',{id:'tblMedCareList'}),head=el('tr',{class:'title'});
    for(const label of ['','病床','姓名','性別','年齡','智能藥事服務(Smart Care)',''])head.append(el('th',{},label));table.append(head);
    for(const p of rows){
      const row=el('tr'),cell=el('td'),select=el('a',{},'選');select.onClick=()=>{fixture.clicks.push(['select',p.account]);patient(p);};if(p.selectable!==false)cell.append(select);row.append(cell);
      for(const value of [[p.ward,p.room,p.bed].join('-'),p.name,p.sex,p.age])row.append(el('td',{},value));
      const care=el('td');(p.careItems||[]).forEach((item,i)=>{const box=el('div'),action=el('div',{onclick:'CareBriefRead('+JSON.stringify({AccountIdse:item.account||p.account,CareType:'MC10'})+', this);'},item.label);action.onClick=()=>fixture.clicks.push(['action','care:'+i,p.account]);box.append(action,el('div',{class:'hover',style:'display: none;'},item.detail||''));care.append(box);});row.append(care);
      const labCell=el('td'),lab=el('a',{},'lab');lab.onClick=()=>fixture.clicks.push(['action','lab',p.account]);labCell.append(lab);row.append(labCell);table.append(row);
    }
    wrap.append(table);body.append(wrap);syncMed();
  }
  function syncMed(){const checked=!!get('ckbMedCare')?.checked;get('divMedCareList').hidden=!checked;get('NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_divInPatientListBox').hidden=checked;}
  function enableMedCare(){
    const box=get('PatientSmartCare');box.setAttribute('id','ckbMedCare');box.setAttribute('onclick','medcare.CareClicked($(this));');
    const scope=el('div',{id:'NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_divInPatientListBox'});body.append(scope);fixture.medCareMode=true;list(fixture.data.filter(p=>p.ward===get(Q+'txbWardCode').value));box.onClick=syncMed;return box;
  }
  function patient(p){
    for(const n of body.children)n.hidden=true;
    for(const [suffix,value]of [['_lblAccountIdse',p.account],['_lblName',p.name],['_lblChartNo',p.mrn]])body.append(el('span',{id:INFO+suffix},value));
    const status=el('span',{id:'NTUHWeb1_MedRelatedInfoBox_lblMedStatus'},fixture.alreadySettled?'已結清':fixture.medStatuses.get(p.account)||'未結清');body.append(status);
    const settle=el('input',{id:fixture.settleButtonId||'NTUHWeb1_MedRelatedInfoBox_btnAllowDischarge',type:'submit',value:'結清',disabled:!!fixture.settleDisabled,onclick:"return confirm('確定執行藥品結清?');"});
    settle.onClick=()=>{fixture.clicks.push(['settle',p.account]);if(fixture.settlementWarning){body.append(el('div',{id:'warning'},fixture.settlementWarning));return;}if(fixture.nativeWarning){context.alert(fixture.nativeWarning);return;}if(!context.confirm(fixture.confirmMessage||'確定執行藥品結清?'))return;let blocked=false;const ev={submitter:settle,preventDefault(){blocked=true;},stopImmediatePropagation(){}};for(const fn of listeners.submit||[])fn(ev);if(!blocked){fixture.clicks.push(['settlement-submitted',p.account]);if(!fixture.deferSettlement){status.textContent='已結清';fixture.medStatuses.set(p.account,'已結清');}}};body.append(settle);
    if(fixture.patientWarning)body.append(el('div',{id:'warning'},fixture.patientWarning));
    const back=el('input',{id:BACK,type:'submit',value:'重選病人'});back.onClick=()=>{fixture.clicks.push(['return']);for(const id of [INFO+'_lblAccountIdse',INFO+'_lblName',INFO+'_lblChartNo',BACK,status.id,settle.id,'warning'])remove(id);for(const n of body.children)n.hidden=false;list(fixture.data.filter(x=>x.ward===get(Q+'txbWardCode').value));};body.append(back);
  }
  function finish(){const task=fixture.pending;if(!task)return;list(task.rows,task.options);fixture.pending=null;prm.busy=false;callbacks.forEach(fn=>fn(null,{get_error:()=>null}));}
  const part=s=>String(s||'').toUpperCase().replace(/^0+(?=\d)/,'');
  const atBed=p=>{const room=get(Q+'txbRoomCode').value,bed=(get(Q+'txbBedNo')||get(Q+'txbBedCode')).value;return p.ward===get(Q+'txbWardCode').value&&(!room||part(p.room)===part(room))&&(!bed||part(p.bed)===part(bed));};
  get(Q+'btnQueryInBed').onClick=()=>{const ward=get(Q+'txbWardCode').value;fixture.clicks.push(['query',ward]);prm.busy=true;fixture.pending={rows:fixture.data.filter(atBed)};if(!fixture.defer)finish();};
  get(Q+'btnQueryDischarge').onClick=()=>{const ward=get(Q+'txbWardCode').value;fixture.currentSource='cleared';fixture.clicks.push(['cleared',ward]);prm.busy=true;fixture.pending={rows:fixture.clearedData.filter(atBed)};if(!fixture.defer)finish();};
  get(P+'btnQuery').onClick=()=>{const account=get(P+'txbAccountIdse').value,personId=get(P+'txbPersonId').value,mrn=get(P+'txbChartNo').value,kind=account?'account':personId?'personId':'mrn',value=account||personId||mrn;fixture.clicks.push([kind,value]);prm.busy=true;fixture.pending={rows:[...fixture.data,...fixture.clearedData].filter(x=>x[kind]===value)};if(!fixture.defer)finish();};
  list(fixture.data.filter(x=>x.ward==='12PE'));
  const storage=new Map();class Form{submit(){}requestSubmit(){}}
  const context={document:doc,location:{origin:'https://portal.example.test'},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},alert:()=>{},confirm:()=>false,prompt:()=>null,setTimeout:()=>1,clearTimeout:()=>{},crypto:crypto.webcrypto,Event:class Event{constructor(type,options={}){this.type=type;Object.assign(this,options);}},HTMLFormElement:Form,HTMLInputElement:Input,HTMLSelectElement:Select,getComputedStyle:e=>({display:e.hidden?'none':'block',visibility:'visible',opacity:e.attrs.opacity??'1'}),console};context.window=context;context.Sys={WebForms:{PageRequestManager:{getInstance:()=>prm}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(bridgePath,'utf8').replace(/^export /gm,''),context);
  fixture.run=(action,payload={})=>context.portalBridge(action,payload);fixture.installGuard=()=>vm.runInContext(fs.readFileSync(require('node:path').join(require('node:path').dirname(bridgePath),'operation-guard.js'),'utf8'),context);fixture.finish=finish;fixture.showList=list;fixture.showMedList=medList;fixture.enableMedCare=enableMedCare;fixture.showPatient=patient;fixture.context=context;fixture.Element=Element;fixture.storage=storage;return fixture;
}
module.exports={makePortal,DATA,CLEARED,Q,P,GRID,INFO,BACK,Element};
