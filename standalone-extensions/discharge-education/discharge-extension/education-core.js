'use strict';
(function(root){
 const KEY='dischargeEducationV1',TTL=7*86400000;
 const clone=x=>structuredClone(x),text=x=>String(x??'').trim();
 function date(x){const v=text(x).replace(/[^0-9]/g,'');let y,m,d;if(v.length===8){y=+v.slice(0,4);m=+v.slice(4,6);d=+v.slice(6,8);}else if(v.length===7){y=+v.slice(0,3)+1911;m=+v.slice(3,5);d=+v.slice(5,7);}else return '';const t=new Date(Date.UTC(y,m-1,d));return y>=1900&&t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d?`${y}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}`:'';}
 const rxKey=p=>date(p.orderDate)+'|'+text(p.number).toUpperCase();
 const seqs=p=>[...new Set((p.sequences?.length?p.sequences:[p.sequence]).filter(Boolean).map(text))].sort();
 function empty(){return {schema:1,batches:[],receipts:[],attempts:[],drafts:{}};}
 function prune(raw,now=Date.now()){
  const s=raw?.schema===1?clone(raw):empty();
  s.batches=(s.batches||[]).filter(x=>Number.isFinite(x.expiresAt)&&x.expiresAt>now);
  s.receipts=(s.receipts||[]).filter(x=>x.expiresAt>now);
  s.attempts=(s.attempts||[]).filter(x=>x.expiresAt>now).map(x=>({...x,status:x.status==='sending'?'uncertain':x.status}));
  const accounts=new Set(s.batches.flatMap(b=>b.rows.map(r=>r.account)));s.drafts=Object.fromEntries(Object.entries(s.drafts||{}).filter(([a])=>accounts.has(a)));return s;
 }
 function sanitizeRow(r,assignments={}){return {account:text(r.account),mrn:text(r.mrn),name:text(r.name),bedNumber:text(r.bedNumber),ward:text(r.ward),date:r.date,pharmacist:assignments.wards?.[r.ward]||1,drugStatus:r.drugStatus,pickupComplete:!!r.pickupComplete,pickups:(r.pickups||[]).map(p=>({number:text(p.number).toUpperCase(),orderDate:date(p.orderDate),sequences:seqs(p)}))};}
 function addBatch(raw,rows,assignments,{printed=false,now=Date.now()}={}){
  const s=prune(raw,now),clean=rows.map(r=>sanitizeRow(r,assignments));if(!clean.length)throw Error('目前沒有可儲存的名單。');
  const signature=JSON.stringify(clean);let b=s.batches.find(x=>JSON.stringify(x.rows)===signature);
  if(b){b.printed||=printed;return {state:s,batch:b};}
  b={id:crypto.randomUUID(),createdAt:now,expiresAt:now+TTL,printed,rows:clean};s.batches.push(b);return {state:s,batch:b};
 }
 function defaults(){return {caregivers:[],familyNote:'',otherCaregiver:'',minutes:'',complete:'Y',reason:'',languages:[0],otherLanguage:'',obstacle:false,obstacles:[],otherObstacle:'',understand:[0],evaluate:[0],prohibition:false,prohibitionText:'',will:'LW01',willText:'',affect:false,affects:[],affectText:'',topics:[0,1,2,3,4,5,6],summary:null,pharmacy:'T02'};}
 const TOPICS=['藥品名稱','作用','適應症','用法','藥品食物交互作用','不良反應','藥品其它相關資訊'];
 function summary(f){return f.summary===null?'告知病人'+f.topics.map(i=>TOPICS[i]).join('、')+'。':text(f.summary);}
 function validate(f){
  if(!Array.isArray(f.caregivers)||!f.caregivers.length)throw Error('請填寫衛教對象。');
  if(f.caregivers.includes(3)&&!text(f.otherCaregiver))throw Error('請填寫其它衛教對象。');
  if(!/^\d{1,4}$/.test(String(f.minutes))||+f.minutes<1||+f.minutes>9999)throw Error('花費時間請填寫 1–9999 分鐘。');
  if(!['Y','N'].includes(f.complete))throw Error('請選擇是否完成衛教。');
  if(f.complete==='N'){if(!text(f.reason))throw Error('請填寫未完成衛教原因。');return;}
  if(!f.languages.length||!f.understand.length||!f.evaluate.length)throw Error('請填寫慣用語言、學習成效與評估依據。');
  if(f.languages.includes(6)&&!text(f.otherLanguage))throw Error('請填寫其它語言。');
  if(f.obstacle&&(!f.obstacles.length||f.obstacles.includes(5)&&!text(f.otherObstacle)))throw Error('請填寫學習障礙及其它說明。');
  if(f.affect&&!f.affects.length&&!text(f.affectText))throw Error('請填寫影響學習的因素。');
  if(!summary(f)||summary(f).replace(/[^\x00-\x7f]/g,'xx').length>1500)throw Error('衛教摘要需有內容，且不超過 1500 英文字或 750 中文字。');
  for(const k of ['familyNote','otherCaregiver','otherLanguage','otherObstacle','prohibitionText','willText','affectText','reason'])if(text(f[k]).length>50)throw Error('補充說明請限制在 50 字以內。');
 }
 function covers(p,receipt){return (receipt.pickups||[]).some(x=>rxKey(x)===rxKey(p)&&(!seqs(p).length||seqs(p).every(n=>seqs(x).includes(n))));}
 function patients(raw,{batchId='',pharmacist=''}={},now=Date.now()){
  const s=prune(raw,now),out=new Map();
  for(const b of s.batches.filter(b=>!batchId||b.id===batchId))for(const r of b.rows){
   if(pharmacist&&String(r.pharmacist)!==String(pharmacist))continue;
   let p=out.get(r.account);if(!p){p={...clone(r),pickups:[],batchIds:[],expiresAt:b.expiresAt,pharmacists:[],conflict:false};out.set(r.account,p);}
   if(p.mrn!==r.mrn||p.name!==r.name)p.conflict=true;
   p.expiresAt=Math.min(p.expiresAt,b.expiresAt);p.batchIds.push(b.id);p.pharmacists.push(r.pharmacist);
   for(const rx of r.pickups){let old=p.pickups.find(x=>rxKey(x)===rxKey(rx));if(!old){old=clone(rx);p.pickups.push(old);}else old.sequences=[...new Set([...old.sequences,...rx.sequences])].sort();}
  }
  return [...out.values()].map(p=>{
   const receipts=s.receipts.filter(x=>x.account===p.account&&x.mrn===p.mrn);
   p.pending=p.pickups.filter(rx=>!receipts.some(r=>covers(rx,r)));
   p.uncertain=s.attempts.find(a=>a.account===p.account&&['sending','uncertain'].includes(a.status)&&a.pickups.some(x=>p.pickups.some(y=>rxKey(x)===rxKey(y))));
   p.error=p.conflict?'同一住院帳號的病人資料不一致':!/^\d+$/.test(p.mrn)?'尚未取得病歷號':!p.pickupComplete?'領藥號清單尚未完整':p.pending.some(x=>!date(x.orderDate)||!x.number)?'領藥號或開方日期不完整':'';
   p.pharmacists=[...new Set(p.pharmacists)].sort();p.form={...defaults(),...clone(s.drafts[p.account]||{})};return p;
  }).sort((a,b)=>a.bedNumber.localeCompare(b.bedNumber,'en',{numeric:true}));
 }
 function fields(f){
  const o={rdbEducationType_1:true,['rdbIsComplete_'+(f.complete==='Y'?0:1)]:true,ddlPharmacy:f.pharmacy};
  if(f.complete==='N'){o.txbNotCompleteCause=text(f.reason);return o;}
  const check=(prefix,indices,n)=>{for(let i=0;i<n;i++)o[prefix+i]=indices.includes(i);};
  check('chkCareGiverType_',f.caregivers,4);check('chkLanguageType_',f.languages,7);
  o[f.obstacle?'rdbLearningObstacleYES':'rdbLearningObstacleNO']=true;if(f.obstacle)check('chkPatientSpeciality_',f.obstacles,6);
  check('ckbUnderstandDegree_',f.understand,8);check('ckbNeedEvaluate_',f.evaluate,3);
  o[f.prohibition?'rdbProhibitionYES':'rdbProhibitionNO']=true;o.txbProhibitionText=f.prohibitionText;
  o['rdbLearningWill_'+['LW01','LW02','LW03'].indexOf(f.will)]=true;o.txbLearningWillText=f.willText;
  o[f.affect?'rdbLearningAffectYES':'rdbLearningAffectNO']=true;if(f.affect)check('ckbLearningAffect_',f.affects,3);o.txbLearningAffectText=f.affectText;
  if(f.caregivers.includes(1))o.txbPatientFamilyNote=f.familyNote;
  if(f.caregivers.includes(3))o.txbOtherCareGiver=f.otherCaregiver;
  if(f.languages.includes(6))o.txbOtherLanguage=f.otherLanguage;
  if(f.obstacle&&f.obstacles.includes(5))o.txbOtherPatientSpeciality=f.otherObstacle;
  o.txbCostMinute=String(f.minutes);check('chkCareOpinionItem_',f.topics,7);o.txbCareOpioion=summary(f);return o;
 }
 function dateRange(pickups){const a=pickups.map(p=>date(p.orderDate)).sort();if(!a.length||!a[0])throw Error('沒有可登錄的出院藥。');const stamp=x=>Date.UTC(+x.slice(0,4),+x.slice(4,6)-1,+x.slice(6,8));return {baseDate:a.at(-1),days:String(Math.ceil((stamp(a.at(-1))-stamp(a[0]))/86400000)+1)};}
 root.EducationCore={KEY,TTL,date,rxKey,seqs,empty,prune,addBatch,defaults,validate,summary,TOPICS,covers,patients,fields,dateRange};
})(globalThis);
