'use strict';
const assert = require('node:assert/strict');
const P = require('../extension/print-policy.js');
let tests = 0;
function test(name, run) { run(); tests++; console.log('PASS ' + name); }
const ward = '10HN', day = '2026-11-04', next = '2026-11-06';
const occupied = (bed, chart, name = '測試林小安', birthday = '080/03/01') => ({bed, chart, vacant:false, text:`${ward}  ${bed}\n${name}\n${chart} ${birthday}`});
const vacant = bed => ({bed, chart:'', vacant:true, text:`${ward}  ${bed}\n\n`});
const beds = [occupied('01-01', '99000001'), occupied('01-02', '99000002'), vacant('01-03')];
const legacy = (rows = beds, extra = {}) => ({version:2, day, ward, status:'complete', beds:rows,
  capturedAt:day+'T01:00:00Z', confirmedAt:day+'T01:10:00Z', hasBedMap:true, ...extra});
const compare = (rows = beds, saved = legacy(), extra = {}) => P.compare(rows, saved, {day, ward, mode:'update', skipSame:true, coverVacant:true, ...extra});
function record(rows, saved, actions, extra = {}) {
  return P.record(saved, rows, {day:next, ward, capturedAt:next+'T01:00:00Z', savedAt:next+'T01:10:00Z', actions, ...extra});
}

test('legacy complete records retain exact-date, ward and content comparison', () => {
  assert.equal(P.referenceUsable(legacy(), {day, ward}), true);
  assert.deepEqual(compare().actions.map(a => a.action), ['reuse','reuse','reuse']);
  const changed = [occupied('01-01','99000001','測試更正姓名'), occupied('01-02','99000002','測試林小安','080/03/02'), vacant('01-03')];
  assert.deepEqual(compare(changed).actions.map(a => a.reason), ['label-changed','label-changed','vacant-unchanged']);
  assert.equal(compare(beds, legacy(beds,{day:'2026-11-03'})).mode, 'patients');
  assert.equal(compare(beds, legacy(beds,{ward:'11HN'})).mode, 'patients');
});

test('no usable record forces occupied-only output and records unknown empty beds', () => {
  const decisions = compare(beds, null);
  assert.equal(decisions.mode,'patients');
  assert.deepEqual(decisions.actions.map(a=>a.action),['print','print','exclude']);
  const saved = record(beds, null, decisions.actions);
  assert.equal(saved.status,'saved');assert.equal(saved.version,4);assert.equal(saved.bedSource,'census-history');
  assert.deepEqual(saved.beds.map(b=>b.known),[true,true,false]);
  assert.equal(P.referenceUsable(saved,{day:next,ward}),true);
  const following = P.compare(beds,saved,{day:next,ward,mode:'update',skipSame:true,coverVacant:true});
  assert.deepEqual(following.actions.map(a=>a.action),['reuse','reuse','print']);
  assert.equal(following.actions[2].reason,'unknown-vacancy');
});

test('explicit occupied-only mode excludes every empty position even with history', () => {
  const result = compare(beds,legacy(),{mode:'patients'});
  assert.equal(result.usable,true);assert.equal(result.mode,'patients');
  assert.deepEqual([...result.printIndexes],[0,1]);assert.deepEqual([...result.excludedIndexes],[2]);
  assert.equal(result.reusedIndexes.size,0);
});

test('both update toggles are independent and turning off covers excludes vacancies', () => {
  const rows = [beds[0],vacant('01-02'),beds[2]];
  const options = compare(rows,legacy(),{skipSame:false,coverVacant:false});
  assert.deepEqual(options.actions.map(a=>a.action),['print','exclude','exclude']);
  assert.equal(options.actions[0].reason,'same-patient-reprint');
  const saved = record(rows,legacy(),options.actions);
  assert.equal(saved.beds[1].vacant,false);assert.equal(saved.beds[1].chart,'99000002');
  assert.equal(saved.beds[2].vacant,true);assert.equal(saved.beds[2].known,true);
  const later = P.compare(rows,saved,{day:next,ward,mode:'update',skipSame:true,coverVacant:true});
  assert.deepEqual(later.actions.map(a=>a.action),['reuse','print','reuse']);
  assert.equal(later.actions[1].reason,'became-vacant');
});

test('same-day selected reprints retain excluded old label state rather than new census', () => {
  const previous = record(beds,null,compare(beds,null).actions);
  const changed = [occupied('01-01','99999999','測試替換'),occupied('01-02','99000002','測試更正'),beds[2]];
  const actions = P.compare(changed,previous,{day:next,ward,mode:'update'}).actions;
  actions[0].action='exclude';
  const saved = record(changed,previous,actions);
  assert.equal(saved.beds[0].chart,'99000001');assert.equal(saved.beds[1].text,changed[1].text);
  assert.equal(saved.beds[2].known,true);
  const later = P.compare(changed,saved,{day:next,ward,mode:'update'});
  assert.equal(later.actions[0].action,'print');assert.equal(later.actions[1].action,'reuse');
});

test('manual exclusions preserve old known states and leave unknown beds unconfirmed', () => {
  const changed = [occupied('01-01','99999999'),beds[1],beds[2]];
  const actions = compare(changed).actions;
  const saved = record(changed,legacy(),actions,{manualIndexes:new Set([0])});
  assert.equal(saved.beds[0].chart,'99000001');
  const initial = record(beds,null,compare(beds,null).actions,{manualIndexes:[0]});
  assert.deepEqual(initial.beds.map(b=>b.known),[false,true,false]);
  assert.equal(P.compare(beds,initial,{day:next,ward,mode:'update'}).actions[0].action,'print');
});

test('transfer can leave duplicate physical stickers without legitimizing duplicate census patients', () => {
  const before = [occupied('01-01','99000001'),vacant('01-02')];
  const now = [vacant('01-01'),occupied('01-02','99000001')];
  const reference = legacy(before);
  const decisions = compare(now,reference,{coverVacant:false});
  const saved = record(now,reference,decisions.actions);
  assert.equal(saved.beds[0].chart,'99000001');assert.equal(saved.beds[1].chart,'99000001');
  assert.equal(P.referenceUsable(saved,{day:next,ward}),true);
  const later = P.compare(now,saved,{day:next,ward,mode:'update'});
  assert.deepEqual(later.actions.map(a=>a.action),['print','reuse']);
  const duplicate = [occupied('01-01','99000001'),occupied('01-02','99000001')];
  const invalid = compare(duplicate,reference);
  assert.equal(invalid.currentValid,false);assert.ok(invalid.actions.every(a=>a.action==='exclude'));
  assert.throws(()=>record(duplicate,reference,invalid.actions),/invalid or duplicate/);
});

test('unknown-only, empty and no-bed-map complete records remain valid without authorizing unknown reuse', () => {
  const rows=[vacant('01-01')],empty=compare(rows,null);
  const saved=record(rows,null,empty.actions);
  assert.equal(saved.beds[0].known,false);assert.equal(P.referenceUsable(saved,{day:next,ward}),true);
  assert.equal(P.compare(rows,saved,{day:next,ward}).actions[0].action,'print');
  const noMap=record(beds,null,compare(beds,null).actions,{hasBedMap:false});
  assert.equal(P.referenceUsable(noMap,{day:next,ward}),true);assert.equal(Object.hasOwn(noMap,'hasBedMap'),false);
  const noRows=record([],null,[],{hasBedMap:false});
  assert.equal(noRows.beds.length,0);assert.equal(P.referenceUsable(noRows,{day:next,ward}),true);
  assert.equal(P.compare([],noRows,{day:next,ward}).currentValid,true);
});

test('unrecorded, unsaved, corrupt and wrong-date references never suppress labels', () => {
  const saved=record(beds,null,compare(beds,null).actions);
  for(const extra of [{status:'unsaved'},{status:'pending'},{captureComplete:false},{savedAt:null},{capturedAt:'bad'},
    {bedSource:undefined},{bedSource:'preset'},{version:1},{day:'2026-11-05'},{ward:'11HN'}]) {
    const invalid={...saved,...extra};
    assert.equal(P.referenceUsable(invalid,{day:next,ward}),false);
    assert.equal(P.compare(beds,invalid,{day:next,ward}).mode,'patients');
  }
  for(const corrupt of [
    [{...saved.beds[0],known:undefined},...saved.beds.slice(1)],
    [saved.beds[0],saved.beds[0]],
    [{...saved.beds[0],chart:'OTHER1'},...saved.beds.slice(1)],
    [{...saved.beds[0],text:'11HN  01-01\n測試\n99000001'},...saved.beds.slice(1)]
  ]) assert.equal(P.referenceUsable({...saved,beds:corrupt},{day:next,ward}),false);
});

test('unproven reuse and malformed action plans cannot create trusted snapshots', () => {
  const actions=compare(beds,null).actions;
  assert.throws(()=>record(beds,null,[{...actions[0],action:'reuse'},...actions.slice(1)]),/matching known/);
  assert.throws(()=>record(beds,null,actions.slice(1)),/one print decision/);
  assert.throws(()=>record(beds,null,[actions[0],actions[0],actions[2]]),/Invalid print decision/);
  assert.throws(()=>record(beds,null,[{...actions[0],bed:'09-09'},...actions.slice(1)]),/Invalid print decision/);
  assert.throws(()=>record(beds,null,actions,{savedAt:'bad'}),/metadata/);
  assert.throws(()=>record(beds,null,actions,{captureComplete:false}),/incomplete census/);
});

test('policy comparison and record creation do not mutate caller data', () => {
  const rows=structuredClone(beds),old=legacy(),prior=JSON.stringify({rows,old});
  const decisions=compare(rows,old);record(rows,old,decisions.actions);
  assert.equal(JSON.stringify({rows,old}),prior);
});

test('complete occupied census derives only missing exact-reference beds as vacancies', () => {
  const source=[beds[0]],snapshot=legacy();
  const derived=P.deriveBeds(source,snapshot,{day,ward,captureComplete:true});
  assert.equal(derived.currentValid,true);assert.equal(derived.complete,true);assert.equal(derived.usable,true);
  assert.equal(derived.inferredVacancies,2);
  assert.deepEqual(derived.beds.map(b=>[b.bed,b.vacant]),[['01-01',false],['01-02',true],['01-03',true]]);
  assert.deepEqual(compare(derived.beds,snapshot).actions.map(a=>a.action),['reuse','print','reuse']);
  assert.equal(derived.beds[1].text,'10HN  01-02');
  assert.equal(source.length,1);assert.equal(snapshot.beds[1].vacant,false);
});

test('transfers print the new location and cover the previously occupied location without a preset', () => {
  const old=legacy([beds[0]]),now=[occupied('07-02','99000001')];
  const derived=P.deriveBeds(now,old,{day,ward,captureComplete:true});
  assert.deepEqual(derived.beds.map(b=>b.bed),['07-02','01-01']);
  assert.deepEqual(compare(derived.beds,old).actions.map(a=>a.reason),['transferred','became-vacant']);
  assert.deepEqual(compare(derived.beds,old,{coverVacant:false}).actions.map(a=>a.action),['print','exclude']);
});

test('a complete empty census covers previously occupied beds and reuses known blank labels', () => {
  const derived=P.deriveBeds([],legacy(),{day,ward,captureComplete:true});
  assert.equal(derived.complete,true);assert.equal(derived.inferredVacancies,3);
  assert.ok(derived.beds.every(b=>b.vacant));
  assert.deepEqual(compare(derived.beds).actions.map(a=>a.action),['print','print','reuse']);
  const firstEmpty=P.deriveBeds([],null,{day,ward,captureComplete:true});
  assert.equal(firstEmpty.complete,true);assert.deepEqual(firstEmpty.beds,[]);
});

test('partial or unproven acquisition cannot infer empty beds or be saved as complete', () => {
  for(const options of [{},{captureComplete:false},{captureComplete:1}]) {
    const derived=P.deriveBeds([beds[0]],legacy(),{day,ward,...options});
    assert.equal(derived.currentValid,true);assert.equal(derived.complete,false);
    assert.equal(derived.reason,'incomplete-capture');assert.equal(derived.inferredVacancies,0);
    assert.deepEqual(derived.beds,[beds[0]]);
  }
  assert.deepEqual(P.deriveBeds([],legacy(),{day,ward,captureComplete:false}).beds,[]);
  assert.throws(()=>record([],null,[],{captureComplete:false}),/incomplete census/);
});

test('invalid, duplicate, or pre-fabricated vacant census rows cannot produce any bed inference', () => {
  for(const census of [[beds[0],beds[0]],[beds[0],occupied('02-01','99000001')],
    [{...beds[0],chart:'DIFFERENT'}],[beds[0],vacant('09-09')],null]) {
    const derived=P.deriveBeds(census,legacy(),{day,ward,captureComplete:true});
    assert.equal(derived.currentValid,false);assert.equal(derived.complete,false);
    assert.equal(derived.inferredVacancies,0);assert.deepEqual(derived.beds,[]);
  }
});

test('missing, corrupt, wrong-date, wrong-ward and unsaved history never invent vacancies', () => {
  const saved=record(beds,null,compare(beds,null).actions);
  for(const snapshot of [null,legacy(beds,{day:next}),legacy(beds,{ward:'11HN'}),
    legacy(beds,{capturedAt:'bad'}),{...saved,status:'unsaved'},{...saved,captureComplete:false},
    {...saved,beds:[saved.beds[0],saved.beds[0]]}]) {
    const derived=P.deriveBeds([beds[0]],snapshot,{day,ward,captureComplete:true});
    assert.equal(derived.complete,true);assert.equal(derived.usable,false);
    assert.equal(derived.inferredVacancies,0);assert.deepEqual(derived.beds,[beds[0]]);
  }
});

test('complete legacy v3 records migrate without a bed map while v2 keeps its historical proof requirements', () => {
  const saved=record(beds,null,compare(beds,null).actions);
  const v3={...saved,version:3,hasBedMap:false};delete v3.bedSource;
  assert.equal(P.referenceUsable(v3,{day:next,ward}),true);
  const derived=P.deriveBeds([beds[0]],v3,{day:next,ward,captureComplete:true});
  assert.equal(derived.inferredVacancies,2);
  assert.deepEqual(P.compare(derived.beds,v3,{day:next,ward}).actions.map(a=>a.action),['reuse','print','print']);
  assert.equal(P.referenceUsable(legacy(beds,{hasBedMap:false}),{day,ward}),false);
  const migrated=record(derived.beds,v3,P.compare(derived.beds,v3,{day:next,ward}).actions);
  assert.equal(migrated.version,4);assert.equal(migrated.bedSource,'census-history');
  assert.equal(Object.hasOwn(migrated,'hasBedMap'),false);
});

test('unknown-only history establishes bed identities without granting any skip', () => {
  const unknown=record([beds[0]],null,[{index:0,action:'exclude'}]);
  assert.equal(P.referenceUsable(unknown,{day:next,ward}),true);
  const derived=P.deriveBeds([],unknown,{day:next,ward,captureComplete:true});
  assert.equal(derived.inferredVacancies,1);
  const choices=P.compare(derived.beds,unknown,{day:next,ward});
  assert.equal(choices.mode,'update');assert.equal(choices.actions[0].reason,'unknown-vacancy');
  assert.equal(choices.actions[0].action,'print');
  const covered=record(derived.beds,unknown,choices.actions);
  assert.equal(covered.beds[0].vacant,true);assert.equal(covered.beds[0].known,true);
});

test('saving retains additional known and unknown physical beds without using today to infer output', () => {
  const target=legacy([beds[0]]),earlierTodayRows=[beds[0],occupied('07-01','99000007'),occupied('07-02','99000008')];
  const earlierToday=record(earlierTodayRows,target,[{index:0,action:'reuse'},{index:1,action:'print'},{index:2,action:'exclude'}]);
  const derived=P.deriveBeds([beds[0]],target,{day,ward,captureComplete:true});
  assert.equal(derived.inferredVacancies,0);assert.equal(derived.beds.length,1);
  const saved=record(derived.beds,earlierToday,[{index:0,action:'exclude'}]);
  assert.deepEqual(saved.beds,earlierToday.beds);
  const future=P.deriveBeds([beds[0]],saved,{day:next,ward,captureComplete:true});
  assert.deepEqual(future.beds.map(b=>b.bed),['01-01','07-01','07-02']);
  assert.deepEqual(P.compare(future.beds,saved,{day:next,ward}).actions.map(a=>a.reason),['unchanged','became-vacant','unknown-vacancy']);
  const invalidated=record(derived.beds,{...earlierToday,status:'unsaved'},[{index:0,action:'exclude'}]);
  assert.equal(invalidated.beds.length,1);assert.equal(invalidated.beds[0].known,false);
});

test('choosing a different exact target reconstructs vacancies without retaining beds from the former target', () => {
  const census=[beds[0]],first=legacy([beds[0],occupied('01-03','99000003')]);
  const second=legacy([beds[0],occupied('02-01','99000004')],{day:'2026-11-03'});
  const a=P.deriveBeds(census,first,{day,ward,captureComplete:true});
  const b=P.deriveBeds(census,second,{day:'2026-11-03',ward,captureComplete:true});
  assert.deepEqual(a.beds.map(x=>x.bed),['01-01','01-03']);assert.deepEqual(b.beds.map(x=>x.bed),['01-01','02-01']);
});
console.log(tests+' print-policy tests passed.');
