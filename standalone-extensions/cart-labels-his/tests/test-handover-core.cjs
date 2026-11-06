'use strict';
const assert = require('node:assert/strict');
const C = require('../extension/handover-core.js');
let tests = 0;
function test(name, run) { run(); tests++; console.log('PASS ' + name); }
const ward = '10HN', day = '2026-11-04';
const occupied = (bed, chart, name = '測試林小安', birthday = '080/03/01') => ({ bed, chart, vacant: false, text: `${ward}  ${bed}\n${name}\n${chart} ${birthday}` });
const vacant = bed => ({ bed, chart: '', vacant: true, text: `${ward}  ${bed}\n\n` });
const beds = [occupied('01-01', '99000001'), occupied('01-02', '99000002'), vacant('01-03')];
const snapshot = (rows = beds, extra = {}) => ({ version: 2, day, ward, status: 'complete', beds: rows,
  capturedAt: '2026-11-04T01:00:00Z', confirmedAt: '2026-11-04T01:10:00Z', hasBedMap: true, ...extra });
const compare = (rows = beds, saved = snapshot(), extra = {}) => C.compare(rows, saved, { day, ward, ...extra });

test('calendar validates actual dates and shifts without local timezone assumptions', () => {
  assert.equal(C.validDay('2026-02-29'), false);
  assert.equal(C.validDay('2024-02-29'), true);
  assert.equal(C.validDay('2026-13-01'), false);
  assert.equal(C.validDay('2026-11-4'), false);
  assert.equal(C.shiftDay('2026-01-01', -1), '2025-12-31');
  assert.equal(C.shiftDay('2024-02-28', 1), '2024-02-29');
  assert.equal(C.shiftDay('bad', 1), '');
});

test('weekdays, weekends and holidays use handover calendar rather than saved-record dates', () => {
  assert.deepEqual(C.previousDates('2026-11-06'), ['2026-11-05', '2026-11-04']);
  assert.deepEqual(C.previousDates('2026-11-09'), ['2026-11-06', '2026-11-05']);
  assert.deepEqual(C.previousDates('2026-11-06', { '2026-11-05': false }), ['2026-11-04', '2026-11-03']);
  assert.deepEqual(C.previousDates('2026-11-09', { '2026-11-07': true }), ['2026-11-07', '2026-11-06']);
  assert.equal(C.isHandover('2026-11-08', { '2026-11-08': true }), true);
  assert.equal(C.isHandover('2026-11-06', { '2026-11-06': false }), false);
  assert.deepEqual(C.previousDates('bad'), []);
  assert.deepEqual(C.previousDates('2026-11-06', {}, 0), []);
});

test('same date and repeated prints never become an extra previous handover', () => {
  const expected = ['2026-11-05', '2026-11-04'];
  assert.deepEqual(C.previousDates('2026-11-06'), expected);
  assert.deepEqual(C.previousDates('2026-11-06'), expected);
  assert.equal(C.snapshotUsable(snapshot(beds, { day: '2026-11-06' }), { day, ward }), false);
});

test('complete target snapshot compares even when the immediately previous handover has no record', () => {
  const dates = C.previousDates('2026-11-06');
  const records = new Map([[day, snapshot()]]);
  assert.equal(records.has(dates[0]), false);
  const result = C.compare(beds, records.get(dates[1]), { day: dates[1], ward });
  assert.equal(result.usable, true);
  assert.deepEqual([...result.omittedIndexes], [0, 1, 2]);
});

test('missing exact target never falls back to an older otherwise valid snapshot', () => {
  const older = snapshot(beds, { day: '2026-11-03' });
  const result = compare(beds, older);
  assert.equal(result.reason, 'date-mismatch');
  assert.equal(result.omittedIndexes.size, 0);
  assert.equal(compare(beds, null).reason, 'missing-snapshot');
  assert.equal(compare(beds, snapshot(beds, { ward: '11HN' })).reason, 'ward-mismatch');
});

test('new patient, moved patient, label correction and newly vacant bed all print', () => {
  const result = compare([
    occupied('01-01', '99000003'),
    vacant('01-02'),
    occupied('01-03', '99000001'),
    occupied('02-01', '99000002'),
  ]);
  assert.deepEqual(result.changes.map(row => row.reason), ['new-patient', 'became-vacant', 'transferred', 'transferred']);
  assert.equal(result.omittedIndexes.size, 0);
  assert.equal(compare([occupied('01-01', '99000001', '更正姓名'), ...beds.slice(1)]).changes[0].reason, 'label-changed');
  assert.equal(compare([occupied('01-01', '99000001', '測試林小安', '080/03/02'), ...beds.slice(1)]).changes[0].reason, 'label-changed');
});

test('identical labels and unchanged vacancies skip, normalizing only whitespace at line edges and line endings', () => {
  const same = structuredClone(beds);
  same[0].text = ' 10HN  01-01 \r\n 測試林小安 \r\n 99000001 080/03/01 \r\n';
  const result = compare(same);
  assert.deepEqual([...result.omittedIndexes], [0, 1, 2]);
  assert.equal(result.changes[2].reason, 'vacant-unchanged');
  const internalSpace = structuredClone(beds);
  internalSpace[0].text = internalSpace[0].text.replace('測試林小安', '測試 林小安');
  assert.equal(compare(internalSpace).changes[0].action, 'print');
});

test('unconfirmed, partial, legacy and missing bed-map snapshots cannot authorize skipping', () => {
  for (const extra of [{ confirmedAt: null }, { confirmedAt: 'not-a-time' }, { status: 'partial' },
    { version: 1 }, { hasBedMap: false }, { hasBedMap: undefined }]) {
    assert.equal(compare(beds, snapshot(beds, extra)).omittedIndexes.size, 0, JSON.stringify(extra));
  }
  assert.equal(C.snapshotUsable(snapshot(beds, { confirmedAt: 1793754600000 }), { day, ward }), true);
});

test('corrupt snapshots with duplicate beds, duplicate charts or mismatched label metadata cannot skip', () => {
  const duplicates = [...beds, occupied('1-1', '99000004')];
  assert.equal(compare(beds, snapshot(duplicates)).reason, 'invalid-snapshot');
  assert.equal(compare(beds, snapshot([...beds, occupied('02-01', '99000001')])).reason, 'invalid-snapshot');
  const wrongChart = structuredClone(beds); wrongChart[0].chart = '99009999';
  assert.equal(compare(beds, snapshot(wrongChart)).reason, 'invalid-snapshot');
  const wrongHeading = structuredClone(beds); wrongHeading[0].text = wrongHeading[0].text.replace('10HN', '11HN');
  assert.equal(compare(beds, snapshot(wrongHeading)).reason, 'invalid-snapshot');
  const wrongVacancy = structuredClone(beds); wrongVacancy[0].vacant = true;
  assert.equal(compare(beds, snapshot(wrongVacancy)).reason, 'invalid-snapshot');
  assert.equal(compare(beds, snapshot([])).reason, 'invalid-snapshot');
});

test('invalid or ambiguous current beds flag currentValid false and never skip', () => {
  for (const current of [[...beds, occupied('1-1', '99000005')],
    [...beds, occupied('02-01', '99000001')], [{ bed: '01-01', vacant: false, chart: '99000001', text: 'incomplete' }], []]) {
    const result = compare(current);
    assert.equal(result.currentValid, false);
    assert.equal(result.reason, 'invalid-current');
    assert.equal(result.omittedIndexes.size, 0);
  }
});

test('explicit full output ignores valid history without mutating inputs', () => {
  const current = structuredClone(beds), saved = snapshot(structuredClone(beds));
  const before = JSON.stringify({ current, saved });
  const result = compare(current, saved, { forceFull: true });
  assert.equal(result.reason, 'forced-full');
  assert.equal(result.currentValid, true);
  assert.equal(result.omittedIndexes.size, 0);
  assert.equal(JSON.stringify({ current, saved }), before);
});

console.log(`${tests} handover-core tests passed.`);
