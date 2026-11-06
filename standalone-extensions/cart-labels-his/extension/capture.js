// Retain Portal label-print interception; navigation is owned by the shared engine.
(()=>{
 if(window.__cartWorkspaceCapture)return;window.__cartWorkspaceCapture=true;
 const clean=v=>String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
 const norm=v=>clean(v).toUpperCase();
 const part=v=>norm(v).replace(/^0+(?=\d)/,'');
 const key=p=>[norm(p.ward),part(p.room),part(p.bed)].join('|');
 const same=(p,e)=>key(p)===key(e)&&norm(p.account)===norm(e.account)&&norm(p.name)===norm(e.name);
 const visible=e=>!!e&&!!e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
 let running=false;
 function rows(){
  const found=[];
  for(const table of document.querySelectorAll('table')){
   if(!visible(table))continue;
   const trs=[...table.rows].filter(tr=>tr.closest('table')===table&&visible(tr));
   const names={account:['帳號','住院帳號'],ward:['病房'],room:['病室','房號'],bed:['病床','床號'],name:['姓名','病人姓名']};
   const h=trs.find(tr=>Object.values(names).every(fields=>[...tr.cells].some(c=>fields.includes(clean(c.innerText)))));
   if(!h)continue;const fields=[...h.cells].map(c=>clean(c.innerText));
   const columns=Object.fromEntries(Object.entries(names).map(([k,values])=>[k,fields.findIndex(f=>values.includes(f))]));
   const patients=trs.filter(tr=>tr!==h).flatMap(tr=>{
    const cb=tr.querySelector('input[type=checkbox]');if(!cb)return [];
    const p=Object.fromEntries(Object.entries(columns).map(([k,index])=>[k,clean(tr.cells[index]?.innerText)]));
    return [{...p,cb}];
   });
   found.push(patients);
  }
  if(found.length!==1)throw Error('無法唯一辨識目前病房的病人勾選清單，未按下列印。');
  return found[0];
 }
 function lease(msg){
  if(!Number.isFinite(msg.deadline)||Date.now()>msg.deadline||location.origin!==msg.origin)throw Error('擷取要求已過期或來源頁面已變更，請重新讀取。');
  let current;try{current=JSON.parse(sessionStorage.getItem('pharmacyPortalLeaseV1')||'null');}catch{}
  if(!msg.owner||current?.owner!==msg.owner||!(current.until>Date.now()))throw Error('Portal 操作權已變更，已停止擷取，請重新連接。');
 }
 function unchanged(expected){
  const live=rows();
  if(live.length!==expected.length||new Set(live.map(key)).size!==live.length||live.some(p=>!expected.some(e=>same(p,e))))throw Error('頁面病人名單已變更，請重新讀取。');
  return live;
 }
 async function capture(msg){
  if(running)throw Error('已在擷取，請等待完成。');
  lease(msg);
  if(!Array.isArray(msg.expected)||!msg.expected.length||new Set(msg.expected.map(key)).size!==msg.expected.length||msg.expected.some(p=>norm(p.ward)!==norm(msg.ward)||!p.account||!p.name))throw Error('病房擷取要求不完整，未按下列印。');
  running=true;let checks=[],timer,receiver;
  try{
   const initial=unchanged(msg.expected);checks=initial.map(r=>[key(r),r.cb.checked]);
   if(!await window.__cartLabelArm?.('藥車標籤擷取'))throw Error('尚未確認列印攔截就緒，未按下列印按鈕。');
   lease(msg);unchanged(msg.expected);
   const expected=new Map(msg.expected.map(p=>[key(p),p])),remaining=new Set(expected.keys()),captured=new Map(),charts=new Set();let chunk=initial.length;
   window.__cartLabelAuto={active:true,onCapture:ps=>{if(receiver)receiver(ps);}};
   for(let tries=0;remaining.size&&tries<initial.length+2;tries++){
    lease(msg);const live=unchanged(msg.expected);
    const pick=new Set(live.filter(p=>remaining.has(key(p))).slice(0,chunk).map(key));
    for(const p of live){p.cb.checked=pick.has(key(p));p.cb.dispatchEvent(new Event('change',{bubbles:true}));}
    const buttons=[...document.querySelectorAll('input[type=button],input[type=submit],button,a')].filter(e=>visible(e)&&!e.disabled&&clean(e.value||e.textContent)==='列印病人標籤');
    if(buttons.length!==1)throw Error('找不到唯一可用的「列印病人標籤」按鈕。');
    lease(msg);unchanged(msg.expected);
    const payload=new Promise((resolve,reject)=>{receiver=resolve;timer=setTimeout(()=>reject(Error('等待列印資料逾時，未完成擷取。')),Math.min(30000,Math.max(1,msg.deadline-Date.now())));});
    buttons[0].click();const ps=await payload;clearTimeout(timer);receiver=null;
    lease(msg);unchanged(msg.expected);
    if(!Array.isArray(ps))throw Error('院內列印資料格式不正確。');
    let count=0;
    for(const p of ps){
     const k=key(p),e=expected.get(k),chart=clean(p.chart);
     if(!pick.has(k)||!e||norm(p.name)!==norm(e.name)||!/^\d{6,8}$/.test(chart)||e.mrn&&clean(e.mrn)!==chart)throw Error('院內標籤與目前病人名單不一致，未使用這份資料。');
     if(captured.has(k)){if(clean(captured.get(k).chart)!==chart)throw Error('同一床位收到不同病人的標籤，請重新讀取。');continue;}
     if(charts.has(chart))throw Error('同一病歷號出現在不同床位，請重新讀取。');
     captured.set(k,p);charts.add(chart);if(remaining.delete(k))count++;
    }
    if(!count)break;chunk=Math.max(1,Math.min(chunk,count));
   }
   lease(msg);unchanged(msg.expected);
   const patients=msg.expected.map(p=>captured.get(key(p))).filter(Boolean);
   return {ok:true,text:patients.length?window.__cartLabelBuildText(patients):'',missing:remaining.size,missingBeds:[...remaining].map(k=>k.split('|').slice(1).join('-'))};
  }finally{
   clearTimeout(timer);receiver=null;running=false;window.__cartLabelAuto={active:false};
   // Do not touch a different user's page after the lease or list has changed.
   try{lease(msg);const live=unchanged(msg.expected),before=new Map(checks);for(const row of live){row.cb.checked=before.get(key(row))===true;row.cb.dispatchEvent(new Event('change',{bubbles:true}));}}catch{}
  }
 }
 chrome.runtime.onMessage.addListener((m,s,reply)=>{
  if(m?.type!=='capture-current-ward')return;
  if(s?.id!==chrome.runtime.id||!s.url?.startsWith(chrome.runtime.getURL(''))){reply({ok:false,error:'不允許的擷取來源。'});return;}
  capture(m).then(reply,e=>reply({ok:false,error:e.message}));return true;
 });
})();
