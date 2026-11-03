'use strict';
// Only same-day comparison identifiers and settings are persisted locally.
(function(root){
  const KEY='dischargeDailyV1';
  function day(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
  function empty(date=day()){return {schema:1,day:date,generation:crypto.randomUUID(),patients:{},batches:0,settings:null,assignments:null};}
  function current(value,date=day()){return value?.schema===1&&value.day===date&&value.patients&&typeof value.patients==='object'?value:empty(date);}
  function rxKey(p){return String(p.orderDate||'').normalize('NFKC').replace(/\s/g,'')+'|'+String(p.number||'').trim().toUpperCase();}
  function sequences(p){return [...new Set((p.sequences?.length?p.sequences:[p.sequence||'']).map(String))];}
  function isNew(ledger,account,p){const old=ledger.patients[account]?.rx?.[rxKey(p)];return !old||sequences(p).some(s=>!old.includes(s));}
  function project(rows,ledger,incremental){return rows.flatMap(row=>{
    if(!incremental)return [{...row,pickups:[...(row.pickups||[])]}];
    const old=ledger.patients[row.account],pickups=(row.pickups||[]).filter(p=>isNew(ledger,row.account,p));
    if(old&&!pickups.length)return [];
    return [{...row,pickups,incrementalReason:old?'新增出院藥':'新增出院病人'}];
  });}
  function commit(ledger,rows,settings,assignments,date=day()){
    if(ledger.day!==date)throw Error('日期已變更，請重新開始擷取。');
    const next=structuredClone(ledger);
    for(const row of rows){const p=next.patients[row.account]??={rx:{}};for(const rx of row.pickups||[]){const k=rxKey(rx);p.rx[k]=[...new Set([...(p.rx[k]||[]),...sequences(rx)])];}}
    next.batches++;next.settings=structuredClone(settings);next.assignments=structuredClone(assignments);next.lastPrintedAt=new Date().toISOString();return next;
  }
  root.DischargeIncremental={KEY,day,empty,current,rxKey,sequences,isNew,project,commit};
})(globalThis);
