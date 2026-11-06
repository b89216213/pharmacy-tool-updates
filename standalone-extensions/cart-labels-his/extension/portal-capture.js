// The shared Patch Recovery Portal engine owns navigation and ward queries.
// This adapter only obtains MRNs from the existing Portal label-print payload.
const clean=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toUpperCase();
const part=v=>norm(v).replace(/^0+(?=\d)/,'');
const bedKey=p=>[norm(p.ward),part(p.room),part(p.bed)].join('|');
function verifyList(list,ward){
 if(list?.superseded||!list?.ready||list.loading||list.queryError||!Array.isArray(list.rows))throw Error('原系統名單尚未完整更新，請重新讀取。');
 if(list.pagination)throw Error('原系統名單有分頁，尚未確認完整資料；未擷取這個病房。');
 if(norm(list.control?.selectedWard)!==norm(ward)||list.control?.filtered||list.control?.smartCare?.checked||list.rows.some(p=>norm(p.ward)!==norm(ward)))throw Error('返回的名單與指定病房不一致，請重新讀取。');
 if(!list.rows.length&&!list.empty)throw Error('尚未確認這個病房為空床，請重新讀取。');
 if(new Set(list.rows.map(bedKey)).size!==list.rows.length||list.rows.some(p=>!p.account||!p.name||!p.room||!p.bed))throw Error('病房名單包含重複床位或不完整資料，未使用這份名單。');
}
function verifyPatients(patients,list,ward){
 if(!Array.isArray(patients)||patients.length!==list.rows.length)throw Error('院內標籤資料未完整取得，請重新讀取。');
 const expected=new Map(list.rows.map(p=>[bedKey(p),p])),seen=new Set(),charts=new Set();
 for(const p of patients){
  const key=bedKey(p),row=expected.get(key),chart=clean(p.chart);
  if(!row||norm(p.ward)!==norm(ward)||norm(p.name)!==norm(row.name)||!/^\d{6,8}$/.test(chart)||row.mrn&&clean(row.mrn)!==chart||seen.has(key)||charts.has(chart))throw Error('院內標籤與目前病人名單不一致，未使用這份資料。');
  seen.add(key);charts.add(chart);
 }
}
export async function captureWards({engine,portal,api=globalThis.chrome,parse,allowed=()=>{}},wards,report=()=>{},stopped=()=>false){
 allowed();
 if(!Array.isArray(wards)||new Set(wards.map(norm)).size!==wards.length||wards.some(w=>!clean(w)))throw Error('病房選擇無效，請重新選擇。');
 return portal.run('query',async()=>{
  const results=[];
  for(let i=0;i<wards.length;i++){
   if(stopped())break;
   const ward=wards[i];
   try{
    allowed();await portal.assert();
    report(ward+'：查詢在床病人（'+(i+1)+'／'+wards.length+'）',i,wards.length);
    const list=await engine.loadWard(ward,'inbed',false);verifyList(list,ward);
    if(stopped())break;
    await portal.assert();
    if(!list.rows.length){results.push({ward,total:0,patients:[],missing:0,capturedAt:Date.now()});continue;}
    await api.scripting.executeScript({target:{tabId:engine.sourceId,frameIds:[engine.frame]},files:['arm.js','content.js','capture.js']});
    allowed();await portal.assert();if(stopped())break;
    report(ward+'：透過 Portal「列印病人標籤」擷取病歷號',i,wards.length);
    const response=await api.tabs.sendMessage(engine.sourceId,{type:'capture-current-ward',ward,origin:engine.frameOrigin,owner:portal.owner,deadline:Date.now()+180000,expected:list.rows.map(({ward,room,bed,account,name,mrn})=>({ward,room,bed,account,name,mrn}))},{frameId:engine.frame});
    allowed();await portal.assert();if(stopped())break;
    if(!response?.ok)throw Error(response?.error||'院內列印資料未回應');
    if(response.missing)throw Error('院內標籤資料未完整取得（缺少 '+response.missing+' 位），請重新讀取。');
    const patients=parse(response.text||'');verifyPatients(patients,list,ward);
    results.push({ward,total:list.rows.length,patients,missing:0,capturedAt:Date.now()});
   }catch(e){results.push({ward,error:e.message||'病房資料讀取失敗，請重試。'});break;}
  }
  return results;
 });
}
