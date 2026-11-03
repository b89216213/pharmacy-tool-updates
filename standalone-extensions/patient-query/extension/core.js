export const CAMPUS_ORDER = ['兒醫', '西址', '健大', '東址', '其他'];
export const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
export const norm = value => clean(value).toUpperCase().replace(/[\s\-－_]/g, '');
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function campusOf(code) {
  const n = norm(code);
  if (n.includes('P')) return '兒醫';
  if (/[EW]/.test(n)) return '西址';
  if (n.includes('H')) return '健大';
  if (/[ABCD]/.test(n)) return '東址';
  return '其他';
}
export function normalizeWards(options = []) {
  const seen = new Map();
  for (const option of options) for (const part of String(option.code || '').split('+')) {
    const code = clean(part).toUpperCase();
    if (!/^[0-9][A-Z0-9 ]{1,7}$/.test(code) || !/[A-Z]/.test(code)) continue;
    if (!seen.has(norm(code))) seen.set(norm(code), {code, value: option.value, campus: campusOf(code)});
  }
  return [...seen.values()].sort((a,b) => CAMPUS_ORDER.indexOf(a.campus)-CAMPUS_ORDER.indexOf(b.campus) || a.code.localeCompare(b.code,'en',{numeric:true}));
}
export function bedLabel(p) { return [p.ward,p.room,p.bed].filter(Boolean).join('-'); }
export function parseSearch(query,currentWard,wards=[]) {
  const text=clean(query).toUpperCase(),n=norm(text);
  if(!text)return {kind:'empty'};
  const ward=wards.find(w=>text===clean(w.code).toUpperCase()||text===norm(w.code));
  if(ward)return {kind:'ward',ward:ward.code};
  if(/^\d{2}[A-Z]\d{8}$/.test(n))return {kind:'account',value:n};
  if(/^[A-Z](?:\d{9}|[A-Z]\d{8})$/.test(n))return {kind:'personId',value:n};
  const parts=value=>/^(\d{1,3})(?:[-_\s]+([A-Z0-9]{1,2})|([A-Z]))?$/.exec(value);
  const token=s=>clean(s).toUpperCase().replace(/[-_\s]+/g,'-');
  const compact=token(text);
  for(const w of [...wards].sort((a,b)=>b.code.length-a.code.length))for(const prefix of new Set([token(w.code),norm(w.code)])){
    if(!compact.startsWith(prefix+'-'))continue;
    const m=parts(compact.slice(prefix.length+1));
    if(m)return {kind:'bed',ward:w.code,room:m[1],bed:m[2]||m[3]||''};
  }
  const m=parts(text);
  if(m&&currentWard)return {kind:'bed',ward:currentWard,room:m[1],bed:m[2]||m[3]||''};
  if(/^\d{4,12}$/.test(text))return {kind:'mrn',value:text};
  return {kind:'invalid',message:'請輸入病房／床號、完整病歷號、住院帳號或身分證號；此搜尋框不使用姓名查詢。'};
}
const taipeiDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'});
export function todayKey(now = new Date()) {
  const parts=Object.fromEntries(taipeiDate.formatToParts(now).map(p=>[p.type,p.value]));
  return parts.year+'-'+parts.month+'-'+parts.day;
}
export function admissionDay(value) {
  const s=clean(value),roc=/^民國/.test(s),date=s.replace(/^民國\s*/, '');
  const m=/^(\d{3,4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?=$|[ T])/.exec(date)
    || /^(\d{3,4})年\s*(\d{1,2})月\s*(\d{1,2})日(?=$|[ T])/.exec(date)
    || /^(\d{3,4})(\d{2})(\d{2})(?=$|[ T])/.exec(date);
  if(!m)return '';
  let year=Number(m[1]);if(m[1].length===3)year+=1911;else if(roc)return '';
  const month=Number(m[2]),day=Number(m[3]),d=new Date(Date.UTC(year,month-1,day));
  if(year<1912||year>2200||d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)return '';
  return year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
export function isTodayAdmission(value,now = new Date()) { return admissionDay(value)===todayKey(now); }
export function dischargeInfo(patient,now = new Date()) {
  const empty={day:'',raw:'',source:''};
  const record=patient&&typeof patient==='object',raw=clean(record?patient.discharge:patient),day=admissionDay(raw);
  if(day)return {day,raw,source:'field'};
  if(!record)return empty;
  const note=clean(patient.note);if(!note)return empty;
  // The native in-bed remark uses MM/DD可出院. Only dates attached to a
  // discharge label qualify; dates for medication, tests or teaching do not.
  if(/(?:取消|撤銷|暫緩|延期|延後)\s*出院|出院\s*(?:已|暫)?\s*(?:取消|撤銷|暫緩|延期|延後)/.test(note))return empty;
  const date='(?:民國\\s*)?(?:\\d{3,4}\\s*[/.-]\\s*\\d{1,2}\\s*[/.-]\\s*\\d{1,2}|\\d{3,4}年\\s*\\d{1,2}月\\s*\\d{1,2}日|\\d{7,8}|\\d{1,2}\\s*[/.-]\\s*\\d{1,2}|\\d{1,2}月\\s*\\d{1,2}日)';
  const label='(?:可|預計|預定)?出院(?:日期|日)?';
  const matches=new RegExp('(?<before>'+date+')\\s*(?:\\d{1,2}:\\d{2}(?::\\d{2})?\\s*)?'+label+'|'+label+'\\s*[:=]?\\s*(?<after>'+date+')','g');
  const found=[];
  for(const match of note.matchAll(matches)){
    const prefix=note.slice(0,match.index),suffix=note.slice(match.index+match[0].length);
    if(/[\dA-Z年月日/.-]$/i.test(prefix)||/\d/.test(suffix[0]||'')||match.groups.after&&/^[年月日/.-]/.test(suffix))continue;
    if(/(?:取消|撤銷|暫緩|延期|延後|暫不|尚未|無法|不可|不能|不會|未定|不)\s*$/.test(prefix))continue;
    if(match.groups.before&&/^\s*(?:藥|衛教|帶藥|處方|醫囑|報告|準備|評估|流程|計畫)/.test(suffix))continue;
    if(/^\s*[(（]?\s*(?:已|暫)?\s*(?:取消|撤銷|暫緩|延期|延後)/.test(suffix))continue;
    const value=clean(match.groups.before||match.groups.after).replace(/\s+/g,'');
    const short=/^(\d{1,2})[/.-](\d{1,2})$/.exec(value)||/^(\d{1,2})月(\d{1,2})日$/.exec(value);
    // A yearless remark is evaluated against the current Taiwan calendar only;
    // never write the inferred year back into the source discharge-date field.
    const parsed=short?admissionDay(todayKey(now).slice(0,4)+'/'+short[1]+'/'+short[2]):admissionDay(value);
    if(!parsed)return empty;
    found.push({day:parsed,raw:match[0],source:'note'});
  }
  return found.length&&new Set(found.map(x=>x.day)).size===1?found[0]:empty;
}
export function isTodayDischarge(value,now = new Date()) { return dischargeInfo(value,now).day===todayKey(now); }
export function billingUnsettledText(value) {
  return /藥\s*帳\s*:?\s*未\s*結\s*清/.exec(clean(value))?.[0]||'';
}
export function settlementHint(patient,result) {
  // A confirmed operation supersedes the older list, but never a newer query.
  if(['success','already'].includes(result?.status)&&Number.isFinite(result.checkedAt)&&Number.isFinite(patient.checkedAt)&&result.checkedAt>=patient.checkedAt)return 'confirmed';
  const status=clean(patient.status).replace(/\s+/g,'');
  // Check both fields: the native note column may contain a billing warning.
  if(billingUnsettledText(patient.status)||billingUnsettledText(patient.note))return 'pending';
  if(/藥帳已結清|完成出院結帳/.test(status))return '';
  return /已出院寫卡/.test(status)?'pending':'';
}
export function cacheKey(ward,source='inbed',smartCare=false){return source+':'+(smartCare?'smart:':'all:')+norm(ward);}
export function samePatient(a, b, includeBed = true) {
  return !!a && !!b && !!a.account && norm(a.account) === norm(b.account) && clean(a.name) === clean(b.name) &&
    (!includeBed || (norm(a.ward) === norm(b.ward) && norm(a.room) === norm(b.room) && norm(a.bed) === norm(b.bed))) &&
    (!a.mrn || !b.mrn || norm(a.mrn) === norm(b.mrn));
}
export function mergePatients(cache, known = new Map()) {
  const unique = new Map();
  for (const item of cache.values()) for (const p of item.rows) {
    const previous = unique.get(p.account);
    if (previous && previous.checkedAt > item.checkedAt) continue;
    const info = known.get(p.account);
    unique.set(p.account, {...p, mrn: p.mrn || (info && clean(info.name) === clean(p.name) ? info.mrn : ''), checkedAt:item.checkedAt});
  }
  return [...unique.values()];
}
export function searchModel(query, currentWard, requestedScope, patients, wards, currentAccounts = null) {
  const inCurrent=p=>currentAccounts?currentAccounts.has(p.account):norm(p.ward)===norm(currentWard);
  const tokens = clean(query).toUpperCase().split(/\s+/).map(norm).filter(Boolean);
  if (!tokens.length) return {searching:false, scope:'current', wardHits:[], rows:patients.filter(inCurrent).sort(bedSort), patientFirst:true};
  const plan=parseSearch(query,currentWard,wards);
  const exactWard = plan.kind==='ward'?wards.find(w=>w.code===plan.ward):undefined;
  const bedOnly=/^\d{1,3}[A-Z]?[-－_](?:\d{1,2}[A-Z]?|[A-Z])$/.test(clean(query).toUpperCase());
  const short = !bedOnly&&tokens.length===1 && /^\d{1,3}[A-Z]?$/.test(norm(query));
  const bedFields = p => [p.room,[p.room,p.bed].join('')].map(norm);
  const currentBed = patients.some(p=>inCurrent(p)&&bedFields(p).some(f=>f.includes(norm(query))));
  const asBed = short && (!exactWard || currentBed);
  const scope = requestedScope==='auto' ? (asBed||bedOnly?'current':'all') : requestedScope;
  const digits=s=>norm(s).replace(/^0+(?=\d)/,'');
  const pool=patients.filter(p=>scope==='all'||inCurrent(p));
  const exactRoom=asBed&&pool.some(p=>digits(p.room)===digits(query));
  const bedParts=bedOnly?clean(query).toUpperCase().split(/[-－_]/).map(digits):null;
  const terms = exactWard && !asBed ? [norm(exactWard.code)] : tokens;
  const scored = pool.map(p=>{
    if(bedParts)return {p,score:digits(p.room)===bedParts[0]&&digits(p.bed)===bedParts[1]?50:-1};
    if(exactRoom)return {p,score:digits(p.room)===digits(query)?50:-1};
    const ward=norm(p.ward), hasWard=terms.includes(ward), personal=[p.account,p.mrn,...bedFields(p)].map(norm);
    const fields=token=>asBed||(/^\d{1,3}[A-Z]?$/.test(token)&&(!wards.some(w=>norm(w.code)===token)||hasWard&&token!==ward))?bedFields(p):hasWard&&token!==ward?personal:[...personal,ward,norm(bedLabel(p))];
    if (!terms.every(t=>fields(t).some(f=>f.includes(t)))) return {p,score:-1};
    const score=terms.reduce((n,t)=>n+(fields(t).some(f=>f===t)?30:fields(t).some(f=>f.startsWith(t))?15:5),ward===norm(currentWard)?1:0);
    return {p,score};
  }).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||bedSort(a.p,b.p));
  const wardHits=(tokens.length===1||exactWard)&&/[A-Z]/.test(norm(query))?wards.filter(w=>norm(w.code).includes(norm(query))).sort((a,b)=>Number(norm(b.code)===norm(query))-Number(norm(a.code)===norm(query))):[];
  return {searching:true,scope,wardHits,rows:scored.map(x=>x.p),patientFirst:asBed||bedOnly,exactWard};
}
export function bedSort(a,b) { return bedLabel(a).localeCompare(bedLabel(b),'en',{numeric:true}); }
export function dischargeSort(a,b) {
  return admissionDay(b.discharge).localeCompare(admissionDay(a.discharge))||bedSort(a,b);
}
export function highlight(value, query) {
  const text=String(value??''), upper=text.toUpperCase(), ranges=[];
  for (const term of clean(query).toUpperCase().split(/\s+/).map(norm).filter(Boolean)) {
    let i=upper.indexOf(term); while(i>=0){ranges.push([i,i+term.length]);i=upper.indexOf(term,i+1);}
  }
  ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
  for(const r of ranges){const prev=merged.at(-1);if(prev&&r[0]<=prev[1])prev[1]=Math.max(prev[1],r[1]);else merged.push(r.slice());}
  let out='',at=0;for(const [start,end]of merged){out+=escapeHTML(text.slice(at,start))+'<mark>'+escapeHTML(text.slice(start,end))+'</mark>';at=end;}
  return out+escapeHTML(text.slice(at));
}
