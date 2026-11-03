const assert=require('node:assert/strict');
module.exports=async function(core,test){
  const now=new Date('2026-10-22T04:00:00Z');
  await test('Native MM/DD可出院 remarks and explicit labelled discharge dates drive today markers without altering source data',()=>{
    const notes=['10/22可出院','10/22 可出院','１０／２２可出院','10 / 22 可出院','10-22可出院','10.22可出院','10月22日可出院','2026/10/22可出院','115/10/22可出院','20261022可出院','1151022可出院','民國115年10月22日可出院','出院日：10/22','出院日期：2026/10/22','預計出院：10/22','10/22預定出院','10/22 14:30可出院','10/22可出院；藥帳未結清','10/21抽血；10/22可出院','10/22可出院；出院日期：115/10/22'];
    for(const note of notes){const p={discharge:'',note},before=JSON.stringify(p),info=core.dischargeInfo(p,now);assert.equal(info.day,'2026-10-22',note);assert.equal(info.source,'note',note);assert(info.raw.includes('出院'));assert(core.isTodayDischarge(p,now),note);assert.equal(JSON.stringify(p),before);}
    assert(core.isTodayDischarge({discharge:'—',note:'10/22可出院'},now));
  });
  await test('Unrelated, cancelled, invalid, partial or conflicting dates in remarks never qualify for today discharge selection',()=>{
    for(const note of ['10/22抽血','10/22回診','10/22出院藥','出院藥日期：10/22','10/22出院衛教','出院衛教：10/22','10/22出院準備評估','10/22不可出院','不可出院：10/22','取消10/22可出院','10/22可出院（已取消）','10/22可出院；取消出院','暫緩出院10/22','10/22可出院；10/23可出院','10/21可出院；10/22抽血','2/30可出院','2026/02/30可出院','出院日期：10/22/2026','出院日期：10/22-10/23','202610220可出院','26/10/22可出院','今日出院','出院日期未定','10/22','藥帳未結清',''])assert(!core.isTodayDischarge({discharge:'',note},now),note);
  });
  await test('Explicit discharge fields keep priority and yearless remarks follow the Taiwan day across year boundaries',()=>{
    assert(!core.isTodayDischarge({discharge:'2026/10/21',note:'10/22可出院'},now));
    assert(core.isTodayDischarge({discharge:'115/10/22',note:'10/21可出院'},now));
    assert.equal(core.dischargeInfo({discharge:'2026/10/22',note:'10/21可出院'},now).source,'field');
    assert(!core.isTodayDischarge({discharge:'',note:'2025/10/22可出院'},now));
    assert(!core.isTodayDischarge('10/22',now),'a bare unknown-year field is not a labelled native remark');
    const before=new Date('2026-12-31T15:59:59Z'),after=new Date('2026-12-31T16:00:00Z');
    assert(core.isTodayDischarge({note:'12/31可出院'},before));assert(!core.isTodayDischarge({note:'12/31可出院'},after));
    assert(!core.isTodayDischarge({note:'01/01可出院'},before));assert(core.isTodayDischarge({note:'01/01可出院'},after));
    assert.equal(core.dischargeInfo({note:'2/29可出院'},new Date('2027-02-28T04:00:00Z')).day,'');
    assert(core.isTodayDischarge({note:'2/29可出院'},new Date('2028-02-29T04:00:00Z')));
  });
};
