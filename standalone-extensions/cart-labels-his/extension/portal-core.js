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
