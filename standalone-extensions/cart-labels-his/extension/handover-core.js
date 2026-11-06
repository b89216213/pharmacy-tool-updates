// Pure handover dates and label comparison. No browser storage or network access.
(function (root) {
  'use strict';

  const DAY_MS = 86400000;
  const norm = value => String(value ?? '').trim().toUpperCase();
  const bedKey = value => norm(value).split('-').map(part => part.replace(/^0+(?=\d)/, '')).join('-');
  const normalizeText = value => String(value ?? '').replace(/\r\n?/g, '\n')
    .split('\n').map(line => line.trim()).join('\n').trim();

  function validDay(day) {
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    const parsed = new Date(day + 'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
  }

  function shiftDay(day, delta) {
    if (!validDay(day) || !Number.isInteger(delta)) return '';
    const shifted = new Date(Date.parse(day + 'T00:00:00Z') + delta * DAY_MS);
    if (!Number.isFinite(shifted.getTime())) return '';
    const result = shifted.toISOString().slice(0, 10);
    return validDay(result) ? result : '';
  }

  function isHandover(day, overrides = {}) {
    if (!validDay(day)) return false;
    if (overrides && Object.hasOwn(overrides, day) && typeof overrides[day] === 'boolean') return overrides[day];
    const weekday = new Date(day + 'T00:00:00Z').getUTCDay();
    return weekday >= 1 && weekday <= 5;
  }

  function previousDates(today, overrides = {}, count = 2) {
    if (!validDay(today) || !Number.isInteger(count) || count < 1 || count > 32) return [];
    const dates = [];
    let day = today;
    // A bounded search also handles corrupt/imported calendars without hanging.
    for (let attempts = 0; attempts < 3660 && dates.length < count; attempts++) {
      day = shiftDay(day, -1);
      if (!day) break;
      if (isHandover(day, overrides)) dates.push(day);
    }
    return dates;
  }

  function timestampValid(value) {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0;
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
  }

  function inspectBeds(beds, ward) {
    if (!norm(ward) || /\s|[\x00-\x1f]/.test(norm(ward)) || !Array.isArray(beds) || !beds.length) {
      return { valid: false, reason: 'invalid-beds', rows: [] };
    }
    const seenBeds = new Set(), seenCharts = new Set(), rows = [];
    for (const row of beds) {
      if (!row || typeof row !== 'object' || typeof row.bed !== 'string' ||
          !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(row.bed.trim()) || row.bed.length > 32 ||
          typeof row.text !== 'string' || typeof row.vacant !== 'boolean' ||
          /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(row.text)) {
        return { valid: false, reason: 'invalid-bed', rows: [] };
      }
      const text = normalizeText(row.text), lines = text.split('\n');
      const heading = /^(\S+)[ \t]{2,}([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)$/.exec(lines[0]);
      const key = bedKey(row.bed), chart = norm(row.chart);
      if (!heading || norm(heading[1]) !== norm(ward) || bedKey(heading[2]) !== key || seenBeds.has(key)) {
        return { valid: false, reason: seenBeds.has(key) ? 'duplicate-bed' : 'invalid-bed-heading', rows: [] };
      }
      seenBeds.add(key);
      if (row.vacant) {
        if (chart || lines.length !== 1) return { valid: false, reason: 'invalid-vacancy', rows: [] };
      } else {
        if (lines.length !== 3 || !lines[1] || !/^[A-Z0-9]{6,64}$/.test(chart) ||
            norm(lines[2].split(/\s+/)[0]) !== chart || seenCharts.has(chart)) {
          return { valid: false, reason: seenCharts.has(chart) ? 'duplicate-chart' : 'invalid-patient', rows: [] };
        }
        seenCharts.add(chart);
      }
      rows.push({ bed: row.bed.trim(), key, chart, text, vacant: row.vacant });
    }
    return { valid: true, reason: 'valid', rows };
  }

  function snapshotReason(snapshot, { day, ward } = {}) {
    if (!validDay(day) || !norm(ward)) return 'invalid-reference';
    if (!snapshot || typeof snapshot !== 'object') return 'missing-snapshot';
    if (snapshot.version !== 2) return 'invalid-snapshot';
    if (snapshot.day !== day || !validDay(snapshot.day)) return 'date-mismatch';
    if (norm(snapshot.ward) !== norm(ward)) return 'ward-mismatch';
    if (snapshot.status !== 'complete') return 'incomplete-snapshot';
    if (!timestampValid(snapshot.confirmedAt)) return 'unconfirmed-snapshot';
    if (snapshot.hasBedMap !== true) return 'missing-bed-map';
    if (!inspectBeds(snapshot.beds, ward).valid) return 'invalid-snapshot';
    return 'comparable';
  }

  function snapshotUsable(snapshot, reference) {
    return snapshotReason(snapshot, reference) === 'comparable';
  }

  function compare(currentBeds, snapshot, { day, ward, forceFull = false } = {}) {
    const current = inspectBeds(currentBeds, ward);
    const referenceReason = snapshotReason(snapshot, { day, ward });
    const reason = !current.valid ? 'invalid-current' : forceFull ? 'forced-full' : referenceReason;
    const usable = reason === 'comparable';
    const omittedIndexes = new Set();
    const previous = usable ? inspectBeds(snapshot.beds, ward).rows : [];
    const byBed = new Map(previous.map(row => [row.key, row]));
    const byChart = new Map(previous.filter(row => !row.vacant).map(row => [row.chart, row]));
    const changes = (Array.isArray(currentBeds) ? currentBeds : []).map((row, index) => {
      if (!usable) return { index, bed: String(row?.bed ?? ''), action: 'print', reason };
      const now = current.rows[index], old = byBed.get(now.key);
      let change;
      if (!old) change = !now.vacant && byChart.has(now.chart) ? 'transferred' : 'new-bed';
      else if (now.vacant) change = old.vacant ? 'vacant-unchanged' : 'became-vacant';
      else if (old.vacant || old.chart !== now.chart) change = byChart.has(now.chart) ? 'transferred' : 'new-patient';
      else change = old.text === now.text ? 'unchanged' : 'label-changed';
      const action = change === 'unchanged' || change === 'vacant-unchanged' ? 'skip' : 'print';
      if (action === 'skip') omittedIndexes.add(index);
      return { index, bed: now.bed, action, reason: change };
    });
    return { omittedIndexes, reason, usable, currentValid: current.valid, changes };
  }

  const api = Object.freeze({ norm, bedKey, normalizeText, validDay, shiftDay, isHandover, previousDates,
    inspectBeds, snapshotReason, snapshotUsable, compare });
  root.CartHandoverCore = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis);
