'use strict';
const assert=require('node:assert/strict'),P=require('../extension/print-policy.js'),R=require('../extension/saved-receipt.js');
let tests=0;const test=(name,run)=>{run();tests++;console.log('PASS '+name)};
const day='2026-11-04',today='2026-11-06',ward='10HN';
const p=(bed,chart,name='測試姓名')=>({bed,chart,text:`10HN  ${bed}\n${name}\n${chart} 080/01/01`,vacant:false});
const old=(bed,account,extra={})=>({day,ward,bed,account,...extra});
const legacy=rows=>P.legacySnapshots(rows)[0];
const decisions=(rows,snapshot,extra={})=>P.compare(rows,snapshot,{day,ward,mode:'update',...extra});
const save=(rows,snapshot,actions)=>P.record(snapshot,rows,{day:today,ward,capturedAt:today+'T01:00:00Z',savedAt:today+'T01:10:00Z',captureComplete:true,actions});
test('2.10 rows retain exact-date same-bed same-MRN reuse without claiming a complete census',()=>{
 const s=legacy([old('01-01',' 99000001 080/01/01 ')]);assert.equal(s.captureComplete,false);assert.equal(s.status,'legacy');assert.equal(P.referenceUsable(s,{day,ward}),true);
 assert.equal(decisions([p('01-01','99000001','新的顯示姓名')],s).actions[0].reason,'legacy-identity');
 assert.equal(decisions([p('01-01','99000001')],s).actions[0].action,'reuse');
 assert.equal(P.referenceUsable(s,{day:today,ward}),false);assert.equal(P.referenceUsable(s,{day,ward:'11HN'}),false);
});
test('unlisted patients, replacements and transfers print while complete current census proves old vacancies',()=>{
 const s=legacy([old('01-01','99000001')]),current=[p('02-01','99000001'),p('01-02','99000002')];
 const derived=P.deriveBeds(current,s,{day,ward,captureComplete:true});
 assert.deepEqual(derived.beds.map(b=>b.bed),['02-01','01-02','01-01']);
 assert.deepEqual(decisions(derived.beds,s).actions.map(a=>a.reason),['transferred','new-bed','became-vacant']);
 assert.equal(decisions([p('01-01','99000009')],s).actions[0].action,'print');
 assert.equal(P.deriveBeds(current,s,{day,ward,captureComplete:false}).inferredVacancies,0);
});
test('legacy printed blank beds can be reused without inferring any unlisted beds',()=>{
 const s=legacy([old('01-01',undefined,{vacant:true})]);
 const d=P.deriveBeds([],s,{day,ward,captureComplete:true});assert.equal(d.beds.length,1);assert.equal(decisions(d.beds,s).actions[0].reason,'vacant-unchanged');
});
test('same-bed conflicting legacy rows are retained only as unknown and never skipped',()=>{
 for(const rows of [[old('01-01','99000001'),old('1-1','99000002')],[old('01-01','99000001'),old('01-01',undefined,{vacant:true})],
  [old('01-01','99000001'),old('01-01','12345')],[old('01-01','99000001',{vacant:true})]]){
  const s=legacy(rows);assert.equal(s.beds.length,1);assert.equal(s.beds[0].known,false);assert.equal(decisions([p('01-01','99000001')],s).actions[0].action,'print');
 }
 const duplicate=legacy([old('01-01','99000001'),old('01-01','99000001')]);assert.equal(duplicate.beds[0].known,true);
});
test('reuse and manual exclusion preserve identity-only history while real printing upgrades it',()=>{
 const s=legacy([old('01-01','99000001')]),rows=[p('01-01','99000001')],reuse=decisions(rows,s);
 const retained=save(rows,s,reuse.actions);assert.equal(retained.version,4);assert.equal(retained.beds[0].identityOnly,true);assert.equal(retained.beds[0].text,'');
 const next=P.compare([p('01-01','99000001','改名')],retained,{day:today,ward});assert.equal(next.actions[0].reason,'legacy-identity');
 const excluded=save([p('01-01','99999999')],s,[{index:0,action:'exclude'}]);assert.equal(excluded.beds[0].chart,'99000001');assert.equal(excluded.beds[0].identityOnly,true);
 const printed=save(rows,s,decisions(rows,s,{skipSame:false}).actions);assert.equal(printed.beds[0].identityOnly,undefined);assert.equal(printed.beds[0].text,rows[0].text);
 assert.equal(P.compare([p('01-01','99000001','改名')],printed,{day:today,ward}).actions[0].reason,'label-changed');
});
test('new census receipts can accompany retained legacy physical state without granting old records a receipt',()=>{
 const s=legacy([old('01-01','99000001')]),rows=[p('01-01','99000001')],options={day:today,ward,captureComplete:true,count:1};
 assert.equal(R.matches(s,rows,{...options,day}),false);
 const retained=save(rows,s,decisions(rows,s).actions);retained.censusProof=R.create(retained,rows,options);assert.equal(R.matches(retained,rows,options),true);
 assert.equal(retained.beds[0].text,'');assert.equal(retained.censusProof.count,1);
});
test('malformed legacy dates/identities cannot create trusted skips and formats are not mutated',()=>{
 const rows=[old('01-01','99000001'),old('02-01','12345'),old('bad bed','99000002'),old('03-01','99000003',{day:'2026-02-30'})],before=JSON.stringify(rows);
 const result=P.legacySnapshots(rows);assert.equal(result.length,1);assert.equal(result[0].beds.length,2);assert.equal(result[0].beds[1].known,false);assert.equal(JSON.stringify(rows),before);
 assert.deepEqual(P.legacySnapshots({}),[]);
});
console.log(tests+' legacy-history tests passed.');
