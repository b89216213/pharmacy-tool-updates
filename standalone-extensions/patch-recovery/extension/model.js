import {clean, norm, todayKey, admissionDay, escapeHTML} from './core.js';
export const DOSES=['12.5','25','75'];
export const FIELDS=['account','department','ward','room','bed','name'];
export const LABELS={account:'帳號',department:'科別',ward:'病房',room:'病室',bed:'病床',name:'姓名'};
export const STORE_KEY='patchRecoveryV1';
export const emptyState=()=>({schemaVersion:1,records:[],defaults:{},prefs:{ward:'',campus:'兒醫',wardGroup:[],wardGroupConfigured:false},draft:null});
export function normalizePrefs(p={}){
  if(p.wardGroup!=null&&(!Array.isArray(p.wardGroup)||p.wardGroup.some(code=>typeof code!=='string'||!/^\d[A-Z0-9 ]{1,7}$/i.test(clean(code))||!/[A-Z]/i.test(code))))throw new Error('預設病房組合格式不正確');
  return {ward:clean(p.ward),campus:clean(p.campus),wardGroup:[...new Set((p.wardGroup||[]).map(code=>clean(code).toUpperCase()))],wardGroupConfigured:p.wardGroupConfigured===true};
}
export const patientData=p=>Object.fromEntries(FIELDS.map(k=>[k,clean(p?.[k])]));
export const patientKey=p=>norm(p.account);
export const shortBed=p=>`${p.room}－${p.bed}`;
export const wardKey=value=>clean(value).toUpperCase();
export function bedCompare(a,b){return wardKey(a.ward).localeCompare(wardKey(b.ward),'en',{numeric:true})||norm(a.room).localeCompare(norm(b.room),'en',{numeric:true})||norm(a.bed).localeCompare(norm(b.bed),'en',{numeric:true})||a.account.localeCompare(b.account);}
export function recordCompare(a,b){return a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||bedCompare(a.patient,b.patient)||a.id.localeCompare(b.id);}
export function recordsForWard(records,code){return records.filter(r=>wardKey(r.patient.ward)===wardKey(code));}
export function storageData(state){
  const recordsByWard=Object.create(null);
  for(const record of state.records){const key=wardKey(record.patient.ward);(recordsByWard[key]||=[]).push(record);}
  const {records,...rest}=state;return {...rest,schemaVersion:2,recordsByWard};
}
export function onlyWard(records,requested=''){
  const group=[...new Set(records.map(r=>wardKey(r.patient.ward)))];
  if(group.length>1||requested&&group.some(w=>w!==wardKey(requested)))throw new Error('請選擇單一病房後再列印或匯出');
  return wardKey(requested)||group[0]||'';
}
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&admissionDay(value)===value;}
export function patientErrors(p){
  const errors=FIELDS.filter(k=>!clean(p?.[k])).map(k=>`缺少${LABELS[k]}`);
  if(clean(p?.account)&&!/^\d{2}[A-Z]\d{8}$/.test(clean(p.account).toUpperCase()))errors.push('帳號格式不符，請核對住院帳號');
  for(const k of FIELDS)if(clean(p?.[k]).length>100)errors.push(`${LABELS[k]}過長`);
  return errors;
}
export function quantities(q){
  const out={};
  for(const d of DOSES){const raw=String(q?.[d]??'').trim();if(raw!==''&&!/^\d{1,4}$/.test(raw))throw new Error(`${d} 的片數請填 0–9999 的整數`);out[d]=raw===''?0:Number(raw);}
  if(!DOSES.some(d=>out[d]>0))throw new Error('請至少填寫一種劑量的回收片數');
  return out;
}
export function validateEntry(entry,date,pharmacist){
  const errors=patientErrors(entry.patient);
  if(!validDate(date))errors.push('請填寫有效的回收日期');
  if(!clean(pharmacist))errors.push('請填寫回收藥師');
  if(clean(pharmacist).length>50)errors.push('回收藥師姓名過長');
  try{quantities(entry.quantities);}catch(e){errors.push(e.message);}
  return errors;
}
export function batchRecords(draft,now=new Date().toISOString()){
  if(!draft?.entries?.length)throw new Error('請先選擇病人');
  const errors=[];
  const records=draft.entries.map((entry,i)=>{
    const date=entry.date||draft.date,pharmacist=entry.pharmacist||draft.pharmacist;
    const issues=validateEntry(entry,date,pharmacist);
    if(issues.length)errors.push(`第 ${i+1} 位 ${entry.patient.name||''}：${issues.join('、')}`);
    return {id:entry.id,batchId:draft.id,patient:patientData(entry.patient),date,pharmacist:clean(pharmacist),quantities:issues.length?{}:quantities(entry.quantities),createdAt:now,updatedAt:now,deletedAt:null,history:[],source:entry.source||'manual'};
  });
  if(errors.length)throw new Error(errors.join('\n'));
  if(new Set(records.map(r=>r.id)).size!==records.length)throw new Error('草稿編號重複，請重新加入病人');
  if(new Set(records.map(r=>patientKey(r.patient))).size!==records.length)throw new Error('這批含有重複住院帳號，請合併在同一列');
  return records;
}
export function duplicateRecords(records,proposed){return proposed.filter(p=>records.some(r=>!r.deletedAt&&r.id!==p.id&&r.date===p.date&&patientKey(r.patient)===patientKey(p.patient)));}
export function editRecord(old,changes,now=new Date().toISOString()){
  const next={...old,patient:patientData(changes.patient),quantities:quantities(changes.quantities),date:changes.date,pharmacist:clean(changes.pharmacist),updatedAt:now};
  const errors=validateEntry(next,next.date,next.pharmacist);if(errors.length)throw new Error(errors.join('、'));
  next.history=[...(old.history||[]),{at:now,action:'edit',before:{patient:old.patient,date:old.date,pharmacist:old.pharmacist,quantities:old.quantities}}];return next;
}
export function monthRecords(records,month){return records.filter(r=>!r.deletedAt&&r.date.startsWith(month+'-')).sort(recordCompare);}
export function totals(records){return Object.fromEntries(DOSES.map(d=>[d,records.reduce((sum,r)=>sum+r.quantities[d],0)]));}
export function filterPatients(rows,query){
  const raw=clean(query),q=norm(raw);if(!q)return rows;
  const part=s=>norm(s).replace(/^0+(?=\d)/,'');
  const m=/^(\d{1,3})(?:[\s\-－_]+([A-Za-z0-9]{1,2})|([A-Za-z]))?$/.exec(raw);
  if(m)return rows.filter(p=>part(p.room)===part(m[1])&&(!(m[2]||m[3])||part(p.bed)===part(m[2]||m[3])));
  return rows.filter(p=>[p.name,p.account,`${p.ward}-${p.room}-${p.bed}`].some(v=>norm(v).includes(q)));
}
function checkRecord(r){
  if(!r||typeof r.id!=='string'||!r.id||r.id.length>150||!r.patient||!r.quantities||!Array.isArray(r.history)||typeof r.createdAt!=='string'||!Number.isFinite(Date.parse(r.createdAt))||typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt)))throw new Error('備份的紀錄格式不正確');
  if(r.deletedAt!=null&&(typeof r.deletedAt!=='string'||!Number.isFinite(Date.parse(r.deletedAt))))throw new Error('備份的作廢資料格式不正確');
  const issues=validateEntry(r,r.date,r.pharmacist);if(issues.length)throw new Error('備份含有無效紀錄：'+issues.join('、'));
  return {...r,patient:patientData(r.patient),quantities:quantities(r.quantities),pharmacist:clean(r.pharmacist)};
}
export function validateState(s){
  if(s?.schemaVersion===2){
    if(!s.recordsByWard||typeof s.recordsByWard!=='object'||Array.isArray(s.recordsByWard)||'records' in s)throw new Error('病房分類資料格式不正確');
    const records=[];
    for(const [code,rows]of Object.entries(s.recordsByWard)){if(!Array.isArray(rows)||rows.some(r=>!r?.patient||wardKey(r.patient.ward)!==code))throw new Error('紀錄與儲存病房不一致');records.push(...rows);}
    const {recordsByWard,...rest}=s;s={...rest,schemaVersion:1,records};
  }
  if(!s||s.schemaVersion!==1||!Array.isArray(s.records)||s.records.length>100000||!s.defaults||typeof s.defaults!=='object'||Array.isArray(s.defaults)||!s.prefs||typeof s.prefs!=='object')throw new Error('無法辨識資料格式；請保留原資料並使用有效備份');
  const records=s.records.map(checkRecord);
  if(new Set(records.map(r=>r.id)).size!==records.length)throw new Error('資料含有重複紀錄編號');
  const defaults={};for(const [month,name]of Object.entries(s.defaults)){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||typeof name!=='string'||name.length>50)throw new Error('每月藥師設定格式不正確');defaults[month]=clean(name);}
  const draft=s.draft;
  if(draft!=null){if(typeof draft.id!=='string'||!Array.isArray(draft.entries)||draft.entries.length>1000||!validDate(draft.date)||typeof draft.pharmacist!=='string')throw new Error('草稿格式不正確');for(const e of draft.entries)if(typeof e.id!=='string'||!e.patient||!e.quantities)throw new Error('草稿病人格式不正確');}
  return {...s,records,defaults,prefs:normalizePrefs(s.prefs),draft};
}
export function importBackup(current,input){
  if(input?.format!=='ntuh-patch-recovery'||!input.data)throw new Error('請選擇本工具匯出的 JSON 備份檔');
  const incoming=validateState(input.data),byId=new Map(current.records.map(r=>[r.id,r]));let added=0,skipped=0;
  for(const r of incoming.records){const old=byId.get(r.id);if(old){if(JSON.stringify(old)!==JSON.stringify(r))throw new Error('同一筆紀錄已有不同版本，未匯入。請保留兩份備份，避免覆蓋已修改的資料。');skipped++;}else{byId.set(r.id,r);added++;}}
  const next={...current,records:[...byId.values()],defaults:{...incoming.defaults,...current.defaults},prefs:current.prefs.wardGroupConfigured?current.prefs:incoming.prefs.wardGroupConfigured?{...current.prefs,wardGroup:incoming.prefs.wardGroup,wardGroupConfigured:true}:current.prefs,draft:current.draft?.entries?.length?current.draft:incoming.draft||current.draft};
  return {next,added,skipped};
}
export class Repository {
  constructor(storage){this.storage=storage;this.state=emptyState();this.tail=Promise.resolve();this.ready=false;}
  async load(){const result=await this.storage.get(STORE_KEY);this.state=result[STORE_KEY]?validateState(result[STORE_KEY]):emptyState();this.ready=true;return this.state;}
  mutate(fn){const job=this.tail.catch(()=>{}).then(async()=>{if(!this.ready)throw new Error('資料尚未正確載入，未寫入');const next=structuredClone(this.state);const result=fn(next);await this.storage.set({[STORE_KEY]:storageData(next)});this.state=next;return result;});this.tail=job;return job;}
}
export function printMarkup(records,month,requestedWard=''){
  const ward=onlyWard(records,requestedWard);
  const esc=escapeHTML,perPage=18,pages=[];const count=Math.max(1,Math.ceil(records.length/perPage));
  for(let i=0;i<count;i++){
    const slice=records.slice(i*perPage,(i+1)*perPage);
    const body=slice.map(r=>'<tr>'+FIELDS.map(k=>`<td>${esc(r.patient[k])}</td>`).join('')+`<td>${esc(r.date.replaceAll('-','/'))}</td>`+DOSES.map(d=>`<td>${r.quantities[d]||''}</td>`).join('')+`<td>${esc(r.pharmacist)}</td><td></td></tr>`).join('');
    pages.push(`<section class="paper"><h1>臺大醫院 FENTANYL 貼片發藥紀錄表　藥局回收／銷毀記錄</h1><div class="paper-meta"><span>病房：${esc(ward)}　　回收月份：${esc(month.replace('-',' 年 '))} 月</span><span>第 ${i+1}／${count} 頁</span></div><table class="print-table"><colgroup><col class="col-account"><col class="col-dept"><col class="col-ward"><col class="col-room"><col class="col-bed"><col class="col-name"><col class="col-date"><col class="col-dose"><col class="col-dose"><col class="col-dose"><col class="col-pharm"><col class="col-stamp"></colgroup><thead><tr>${FIELDS.map(k=>`<th rowspan="2">${LABELS[k]}</th>`).join('')}<th rowspan="2">回收日期</th><th colspan="3">回收數量（片）</th><th rowspan="2">回收藥師</th><th rowspan="2">覆核藥師<br>核章</th></tr><tr>${DOSES.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table><div class="paper-footer">本頁 ${slice.length} 筆${i===count-1?'　｜　本病房本月 '+records.length+' 筆　　'+DOSES.map(d=>d+'：'+totals(records)[d]+' 片').join('　／　'):''}</div></section>`);
  }return pages.join('');
}
