// Pure print decisions and per-bed label state. Saving means the user chose to
// record the job; it is not a claim that a physical printer reported success.
(function (root) {
  'use strict';
  const HC = root.CartHandoverCore || (typeof require === 'function' ? require('./handover-core.js') : null);
  if (!HC) throw new Error('CartHandoverCore must load before CartPrintPolicy.');
  const validWard = ward => !!HC.norm(ward) && !/\s|[\x00-\x1f]/.test(HC.norm(ward));
  const timestampValid = value => typeof value === 'number' ? Number.isFinite(value) && value > 0
    : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
  const stateOf = row => ({bed:row.bed, chart:row.chart, text:row.text, vacant:row.vacant,...(row.identityOnly?{identityOnly:true}:{})});
  const sameState = (a, b) => !!a && !!b && a.key === b.key && a.vacant === b.vacant
    && a.chart === b.chart && (a.identityOnly||b.identityOnly||a.text === b.text);
  function inspectCurrent(beds, ward) {
    // An explicitly complete, empty ward is a valid census. The adapter passes
    // acquisition completeness separately; no physical bed inventory is needed.
    if (Array.isArray(beds) && !beds.length && validWard(ward)) return {valid:true, reason:'valid', rows:[]};
    return HC.inspectBeds(beds, ward);
  }
  function inspectStoredBeds(snapshot, ward) {
    if (!Array.isArray(snapshot?.beds)) return {valid:false, rows:[], knownCount:0};
    const seen = new Set(), rows = [];
    for (const bed of snapshot.beds) {
      if (snapshot.version !== 2 && typeof bed?.known !== 'boolean') return {valid:false, rows:[], knownCount:0};
      // Two physical stickers can legitimately show the same patient after a
      // transfer if the old bed's covering sticker was deliberately excluded.
      // Validate each row and bed identity, rather than forbidding that state.
      let inspected;
      if(bed?.identityOnly===true){
        const valid=[1,4].includes(snapshot.version)&&validWard(ward)&&typeof bed.bed==='string'&&/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(bed.bed.trim())&&bed.bed.length<=32
          &&bed.vacant===false&&typeof bed.chart==='string'&&/^[A-Z0-9]{6,64}$/.test(HC.norm(bed.chart))&&bed.text==='';
        inspected={valid,rows:valid?[{bed:bed.bed.trim(),key:HC.bedKey(bed.bed),chart:HC.norm(bed.chart),text:'',vacant:false,identityOnly:true}]:[]};
      }else inspected = HC.inspectBeds([bed], ward);
      if (!inspected.valid) return {valid:false, rows:[], knownCount:0};
      const row = inspected.rows[0];
      if(snapshot.version===1&&!row.vacant&&!row.identityOnly)return {valid:false,rows:[],knownCount:0};
      if (seen.has(row.key)) return {valid:false, rows:[], knownCount:0};
      seen.add(row.key);
      rows.push({...row, known:snapshot.version === 2 || bed.known});
    }
    return {valid:true, rows, knownCount:rows.filter(row => row.known).length};
  }
  function referenceReason(snapshot, {day, ward} = {}) {
    if (!HC.validDay(day) || !validWard(ward)) return 'invalid-reference';
    if (!snapshot || typeof snapshot !== 'object') return 'missing-snapshot';
    if(snapshot.version===1){
      if(snapshot.day!==day||!HC.validDay(snapshot.day))return 'date-mismatch';
      if(HC.norm(snapshot.ward)!==HC.norm(ward))return 'ward-mismatch';
      if(snapshot.status!=='legacy'||snapshot.bedSource!=='legacy-history'||snapshot.captureComplete!==false)return 'invalid-legacy';
      const inspected=inspectStoredBeds(snapshot,ward);
      return inspected.valid&&inspected.rows.length?'comparable':'invalid-snapshot';
    }
    if (snapshot.version === 2) {
      const legacyReason = HC.snapshotReason(snapshot, {day, ward});
      return legacyReason === 'comparable' && !timestampValid(snapshot.capturedAt) ? 'unrecorded-snapshot' : legacyReason;
    }
    if (![3, 4].includes(snapshot.version)) return 'invalid-snapshot';
    if (snapshot.day !== day || !HC.validDay(snapshot.day)) return 'date-mismatch';
    if (HC.norm(snapshot.ward) !== HC.norm(ward)) return 'ward-mismatch';
    if (snapshot.status !== 'saved') return 'incomplete-snapshot';
    if (snapshot.captureComplete !== true) return 'incomplete-capture';
    if (snapshot.version === 4 && snapshot.bedSource !== 'census-history') return 'invalid-bed-source';
    if (!timestampValid(snapshot.version === 4 ? snapshot.savedAt : snapshot.savedAt || snapshot.confirmedAt)
      || !timestampValid(snapshot.capturedAt)) return 'unrecorded-snapshot';
    const inspected = inspectStoredBeds(snapshot, ward);
    if (!inspected.valid) return 'invalid-snapshot';
    return 'comparable';
  }
  function referenceUsable(snapshot, reference) { return referenceReason(snapshot, reference) === 'comparable'; }
  function legacySnapshots(rawRows){
    if(!Array.isArray(rawRows))return [];
    const groups=new Map();
    for(const row of rawRows){
      if(!row||!HC.validDay(row.day)||typeof row.ward!=='string'||!validWard(row.ward)||typeof row.bed!=='string'
        ||!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(row.bed.trim())||row.bed.length>32)continue;
      const ward=HC.norm(row.ward),groupKey=row.day+'|'+ward,key=HC.bedKey(row.bed),bed=row.bed.trim();
      if(!groups.has(groupKey))groups.set(groupKey,{day:row.day,ward,beds:new Map()});
      const chart=typeof row.account==='string'?HC.norm(row.account).split(/\s+/)[0]:'';
      const chartValid=/^[A-Z0-9]{6,64}$/.test(chart);
      let state;
      if(row.vacant===true&&!chart)state={bed,chart:'',text:ward+'  '+bed,vacant:true,known:true};
      else if(row.vacant!==true&&chartValid)state={bed,chart,text:'',vacant:false,known:true,identityOnly:true};
      else state={bed,chart:'',text:ward+'  '+bed,vacant:true,known:false};
      const group=groups.get(groupKey),old=group.beds.get(key);
      if(old&&(!old.known||!state.known||old.vacant!==state.vacant||old.chart!==state.chart))state={bed:old.bed,chart:'',text:ward+'  '+old.bed,vacant:true,known:false};
      group.beds.set(key,state);
    }
    return [...groups.values()].map(group=>({version:1,day:group.day,ward:group.ward,status:'legacy',bedSource:'legacy-history',captureComplete:false,beds:[...group.beds.values()]}));
  }
  function deriveBeds(occupiedBeds, snapshot, {day, ward, captureComplete = false} = {}) {
    const current = inspectCurrent(occupiedBeds, ward);
    const occupiedOnly = current.valid && current.rows.every(row => !row.vacant);
    const usable = referenceUsable(snapshot, {day, ward});
    if (!occupiedOnly) return {currentValid:false, complete:false, reason:'invalid-current', usable,
      beds:[], inferredVacancies:0};
    const beds = current.rows.map(stateOf);
    if (captureComplete !== true) return {currentValid:true, complete:false, reason:'incomplete-capture', usable,
      beds, inferredVacancies:0};
    const occupiedKeys = new Set(current.rows.map(row => row.key));
    let inferredVacancies = 0;
    // Only this exact reference may contribute bed identities. Unknown physical
    // label state is still a recorded bed; it must never authorize a reuse.
    if (usable) for (const previous of inspectStoredBeds(snapshot, ward).rows) {
      if (occupiedKeys.has(previous.key)) continue;
      beds.push({bed:previous.bed, chart:'', text:HC.norm(ward)+'  '+previous.bed, vacant:true});
      inferredVacancies++;
    }
    return {currentValid:true, complete:true, reason:'valid', usable, beds, inferredVacancies};
  }
  function compare(currentBeds, snapshot, {day, ward, mode = 'update', skipSame = true, coverVacant = true} = {}) {
    const current = inspectCurrent(currentBeds, ward), reason = referenceReason(snapshot, {day, ward});
    const usable = reason === 'comparable';
    const actualMode = mode === 'update' && usable ? 'update' : 'patients';
    const previous = usable ? inspectStoredBeds(snapshot, ward).rows : [];
    const byBed = new Map(previous.map(row => [row.key, row]));
    const knownCharts = new Set(previous.filter(row => row.known && !row.vacant).map(row => row.chart));
    const actions = (Array.isArray(currentBeds) ? currentBeds : []).map((row, index) => {
      const answer = (action, reason) => ({index, bed:String(row?.bed ?? ''), action, reason});
      if (!current.valid) return answer('exclude', 'invalid-current');
      const now = current.rows[index], stored = byBed.get(now.key), old = stored?.known ? stored : null;
      if (actualMode === 'patients') return answer(now.vacant ? 'exclude' : 'print', now.vacant ? 'empty-excluded' : 'all-patients');
      if (now.vacant) {
        if (!coverVacant) return answer('exclude', 'vacancy-cover-disabled');
        if (old?.vacant) return answer('reuse', 'vacant-unchanged');
        return answer('print', old ? 'became-vacant' : 'unknown-vacancy');
      }
      if (old && sameState(now, old)) return answer(skipSame ? 'reuse' : 'print', skipSame ? (old.identityOnly?'legacy-identity':'unchanged') : 'same-patient-reprint');
      if (old && !old.vacant && old.chart === now.chart) return answer('print', 'label-changed');
      if (knownCharts.has(now.chart)) return answer('print', 'transferred');
      return answer('print', old ? 'new-patient' : stored ? 'unknown-bed' : 'new-bed');
    });
    return {currentValid:current.valid, usable, mode:actualMode, requestedMode:mode,
      reason:current.valid ? reason : 'invalid-current', actions,
      printIndexes:new Set(actions.filter(a => a.action === 'print').map(a => a.index)),
      reusedIndexes:new Set(actions.filter(a => a.action === 'reuse').map(a => a.index)),
      excludedIndexes:new Set(actions.filter(a => a.action === 'exclude').map(a => a.index))};
  }
  function record(snapshot, currentBeds, {
    day, ward, capturedAt, savedAt, actions, manualIndexes = [], captureComplete = true
  } = {}) {
    if (!HC.validDay(day) || !validWard(ward) || !timestampValid(capturedAt) || !timestampValid(savedAt)) throw new Error('Invalid record metadata.');
    if (captureComplete !== true) throw new Error('Cannot record an incomplete census.');
    const current = inspectCurrent(currentBeds, ward);
    if (!current.valid) throw new Error('Cannot record invalid or duplicate current beds/patients.');
    if (!Array.isArray(actions) || actions.length !== current.rows.length) throw new Error('Every current bed requires one print decision.');
    const decisions = new Map();
    for (const item of actions) {
      if (!item || !Number.isInteger(item.index) || item.index < 0 || item.index >= current.rows.length
        || decisions.has(item.index) || !['print', 'reuse', 'exclude'].includes(item.action)
        || (item.bed !== undefined && HC.bedKey(item.bed) !== current.rows[item.index].key)) throw new Error('Invalid print decision.');
      decisions.set(item.index, item.action);
    }
    if (!(manualIndexes instanceof Set) && !Array.isArray(manualIndexes)) throw new Error('Invalid manual selection.');
    const manual = new Set(manualIndexes);
    if ([...manual].some(index => !Number.isInteger(index) || index < 0 || index >= current.rows.length)) throw new Error('Invalid manual selection.');
    // The caller selects today's record or the exact prior-cycle record. Never
    // reach into older history here, and never preserve a future record.
    const usable = snapshot?.day <= day && referenceUsable(snapshot, {day:snapshot?.day, ward});
    const previous = usable ? inspectStoredBeds(snapshot, ward).rows : [];
    const byBed = new Map(previous.filter(row => row.known).map(row => [row.key, row]));
    const beds = current.rows.map((now, index) => {
      const old = byBed.get(now.key), action = manual.has(index) ? 'exclude' : decisions.get(index);
      if (action === 'print') return {...stateOf(now), known:true};
      if (action === 'reuse') {
        if (!sameState(old, now)) throw new Error('Cannot record reuse without a matching known label.');
        return {...stateOf(old.identityOnly?old:now), known:true};
      }
      // Retain the physical label state, not the newly observed census state.
      return old ? {...stateOf(old), known:true} : {...stateOf(now), known:false};
    });
    // A bed seen only earlier today must not invent a vacancy in this job, but
    // omitting it from the new record would lose its still-present label state.
    const currentKeys = new Set(current.rows.map(row => row.key));
    for (const old of previous) if (!currentKeys.has(old.key)) beds.push({...stateOf(old), known:old.known});
    return {version:4, day, ward:HC.norm(ward), status:'saved', capturedAt, savedAt,
      captureComplete:true, bedSource:'census-history', beds};
  }
  const api = Object.freeze({referenceReason, referenceUsable, legacySnapshots, deriveBeds, compare, record});
  root.CartPrintPolicy = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis);
