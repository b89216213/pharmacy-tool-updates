// Shared pure functions used by the live and offline acquisition paths.
(function(g){
 const norm=v=>String(v||'').trim().toUpperCase();
 const HEADER='#院內列印資料\t病房\t病室\t病床\t姓名\t病歷號\t生日\t出院';
 const clean=v=>String(v??'').replace(/[\t\r\n]/g,' ');
 const serialize=rows=>rows.length?[HEADER,...rows.map(p=>[p.ward,p.room,p.bed,p.name,p.chart,p.birthday,p.note].map(clean).join('\t'))].join('\n'):'';
 function parse(text){
  if(!text.trim())return [];
  if(!text.startsWith('#院內列印資料'))throw Error('目前包含手動貼上的其他格式，請先清除資料，再重新擷取病房。');
  return text.split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#院內列印資料')).map(l=>{
   const [ward,room,bed,name,chart,birthday,note]=l.split('\t');return {ward,room,bed,name,chart,birthday,note};
  });
 }
 function merge(existing,results){
  const rows=parse(existing),replace=new Set(results.filter(r=>!r.error).map(r=>norm(r.ward)));
  const kept=rows.filter(p=>!replace.has(norm(p.ward)));
  const byId=new Map();
  for(const p of [...kept,...results.filter(r=>!r.error).flatMap(r=>r.patients)]){
   if(!p.ward||!p.name||!p.chart)throw Error('病人標籤資料不完整，未更新名單。');
   byId.set(norm(p.ward)+'|'+p.room+'|'+p.bed+'|'+p.chart,p);
  }
  return serialize([...byId.values()]);
 }
 g.CartWorkspaceCore={norm,HEADER,serialize,parse,merge};
})(globalThis);
