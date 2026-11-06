// Shared label identities. Bed-preset editing/import/storage has been retired.
// Empty collections and no-op hooks only keep older renderer references valid.
let bedPresets = [], presetSelection = new Set();
function wardKey(value) { return String(value || '').trim().toUpperCase(); }
function bedKey(value) {
  return String(value || '').trim().toUpperCase().split('-').map(part => part.replace(/^0+(?=\d)/, '')).join('-');
}
function labelBed(text) {
  const lines = String(text || '').split('\n'), parts = lines[0].split('  ');
  return {ward:parts.shift().trim(), bed:parts.join('  ').trim(), lines};
}
function isVacantLabel(text) {
  const {bed, lines} = labelBed(text);
  return Boolean(bed) && !(lines[1] || '').trim() && !(lines[2] || '').trim();
}
function bedCompare(a, b) {
  const pa = bedKey(a).split('-'), pb = bedKey(b).split('-');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || '', y = pb[i] || '';
    const numeric = /^\d+$/.test(x) && /^\d+$/.test(y);
    const result = numeric ? Number(x) - Number(y) : x.localeCompare(y, 'en');
    if (result) return result;
  }
  return 0;
}
function downloadPresetText(text, name) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', text], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initializeBedPresets() {}
function syncPresetSide() {}
// Safe startup fallback. The handover controller replaces this adapter before
// acquisition and derives relevant beds from current census and its reference.
function prepareLabelRecords(text, excluded) {
  const raw = String(text || '').trim() ? extractLabels(text, true) : {labels:[], mode:'已讀取病人資料。'};
  const labels = raw.labels.filter(label => !excluded?.has(label));
  return {...raw, labels, excluded:raw.labels.length - labels.length,
    vacancies:labels.filter(isVacantLabel).length, extra:0, usedPresets:false};
}
