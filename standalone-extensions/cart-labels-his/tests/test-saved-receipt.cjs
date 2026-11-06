'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),P=require('../extension/print-policy.js'),R=require('../extension/saved-receipt.js');
let tests=0;const test=(name,run)=>{run();tests++;console.log('PASS '+name)};
const day='2026-11-06',ward='10HN',stamp=day+'T01:00:00Z';
const patient=(bed,chart,name='測試姓名',birthday='080/01/01',note='')=>({bed,chart,text:`10HN  ${bed}\n${name}\n${chart} ${birthday}`,vacant:false,note});
const beds=[patient('01-01','99000001'),patient('01-02','99000002')];
const opts=rows=>({day,ward,captureComplete:true,count:rows.length});
function saved(rows=beds,actions=rows.map((_,index)=>({index,action:'print'}))){const s=P.record(null,rows,{day,ward,capturedAt:stamp,savedAt:stamp,captureComplete:true,actions});s.censusProof=R.create(s,rows,opts(rows));return s;}
test('SHA-256 matches standard, Unicode and multi-block vectors',()=>{
 for(const text of ['', 'abc','abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq','測試姓名🙂'.repeat(80),'a'.repeat(10000)])assert.equal(R.sha256(text),crypto.createHash('sha256').update(text).digest('hex'));
});
test('complete unchanged census matches independent of row order and capture timing',()=>{
 const s=saved();assert.equal(R.matches(s,beds,opts(beds)),true);assert.equal(R.matches(s,[...beds].reverse(),opts(beds)),true);
 const normalized=beds.map(b=>({...b,text:'  '+b.text.replaceAll('\n',' \r\n ')+'  '}));assert.equal(R.matches(s,normalized,opts(normalized)),true);
 assert.equal(R.matches({...s,beds:[...s.beds].reverse()},beds,opts(beds)),true);
});
test('new patients, departures, transfers and changed label fields invalidate the census proof',()=>{
 for(const rows of [[...beds,patient('01-03','99000003')],[beds[0]],
  [patient('01-01','99000009'),beds[1]],[patient('01-01','99000001','新姓名'),beds[1]],
  [patient('01-01','99000001','測試姓名','080/01/02'),beds[1]],
  [patient('02-01','99000001'),beds[1]],[patient('01-01','99000001','測試姓名','080/01/01','11/06 可出院'),beds[1]]])assert.equal(R.matches(saved(),rows,opts(rows)),false);
});
test('a complete empty ward is provable while partial or mismatched counts are not',()=>{
 const s=saved([]);assert.equal(R.matches(s,[],opts([])),true);
 for(const extra of [{captureComplete:false},{count:1},{count:undefined},{day:'2026-11-07'},{ward:'11HN'}])assert.equal(R.matches(s,[],{...opts([]),...extra}),false);
 assert.throws(()=>R.create(s,[],{...opts([]),captureComplete:false}),/complete census/);
});
test('invalid, duplicate or vacant raw rows cannot claim an unchanged occupied census',()=>{
 const s=saved();for(const rows of [[beds[0],beds[0]],[beds[0],patient('02-02','99000001')],
  [{...beds[0],chart:'OTHER1'},beds[1]],[{bed:'01-01',chart:'',text:'10HN  01-01',vacant:true}]])assert.equal(R.matches(s,rows,opts(rows)),false);
});
test('physical state may differ from the saved raw census without losing its receipt',()=>{
 const rows=[patient('01-01','99999999'),beds[1]],s=saved(rows,[{index:0,action:'exclude'},{index:1,action:'print'}]);
 assert.equal(s.beds[0].known,false);assert.equal(R.matches(s,rows,opts(rows)),true);
 const older=P.record(null,beds,{day,ward,capturedAt:stamp,savedAt:stamp,actions:beds.map((_,index)=>({index,action:'print'}))});
 const retained=P.record(older,rows,{day,ward,capturedAt:stamp,savedAt:stamp,actions:[{index:0,action:'exclude'},{index:1,action:'print'}]});
 retained.censusProof=R.create(retained,rows,opts(rows));assert.equal(retained.beds[0].chart,'99000001');assert.equal(R.matches(retained,rows,opts(rows)),true);
});
test('changed physical content, timestamps, status and receipt hashes invalidate existing evidence',()=>{
 const s=saved();for(const extra of [{savedAt:day+'T02:00:00Z'},{capturedAt:day+'T00:00:00Z'},{status:'unsaved'},
  {beds:s.beds.map((b,i)=>i?b:{...b,known:false})},{beds:[...s.beds, {...patient('03-01','99000003'),known:true}]},
  {censusProof:{...s.censusProof,censusHash:'0'.repeat(64)}},{censusProof:{...s.censusProof,snapshotHash:'0'.repeat(64)}}])assert.equal(R.matches({...s,...extra},beds,opts(beds)),false);
});
test('old records without proof and invalid proof schemas cannot display a saved receipt',()=>{
 const s=saved();for(const proof of [undefined,null,{}, {...s.censusProof,version:2},{...s.censusProof,count:3}])assert.equal(R.matches({...s,censusProof:proof},beds,opts(beds)),false);
 assert.equal(R.matches({...s,version:3},beds,opts(beds)),false);
 assert.equal(JSON.stringify(s.censusProof).includes('測試姓名'),false);assert.equal(JSON.stringify(s.censusProof).includes('99000001'),false);
});
test('receipt creation and verification do not mutate caller inputs',()=>{
 const s=saved(),raw=structuredClone(beds),before=JSON.stringify({s,raw});R.create(s,raw,opts(raw));R.matches(s,raw,opts(raw));assert.equal(JSON.stringify({s,raw}),before);
});
console.log(tests+' saved-receipt tests passed.');
