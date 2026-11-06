// Settings adapter: keep the proven label renderer's units/IDs, while exposing
// simple controls and synchronously persisting every valid preference change.
(() => {
  const KEY = 'cart-label-settings-v213';
  const layoutIds = Object.keys(defaults);
  const values = [...layoutIds, ...Object.keys(TYPE_DEFAULTS), 'fontFamily', 'idStyle', 'qrSize', 'qrPos', 'dischargeMode'];
  const checks = ['wardSeparators', 'qrEnabled', 'printStartArrow'];
  const dialog = $('settingsDialog');
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  let stored = {}, status, copiesList, copiesAdd, copiesSummary, copying = false;
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
  const firstUpgrade = stored.version !== 213;
  const originalCopiesParser = parseWardCopies;
  parseWardCopies = text => {
    const parsed = originalCopiesParser(text);
    parsed.map = new Map([...parsed.map].map(([ward, count]) => [ward, Math.max(1, Math.min(5, count))]));
    return parsed;
  };
  // One-time migration supplies the newly agreed defaults. Subsequent launches
  // respect changes (including removal of a default two-copy ward).
  if (firstUpgrade) {
    try {
      const old = parseWardCopies(localStorage.getItem(COPIES_KEY) || '').map;
      const initial = new Map([['06PE', 2], ['08PE', 2], ...old]);
      localStorage.setItem(COPIES_KEY, [...initial].map(([w, n]) => w + 'x' + n).join(' '));
      localStorage.setItem(DISCHARGE_MODE_KEY, 'off');
    } catch {}
    $('dischargeMode').value = 'off';
    dischargeDecisions.clear();
  }
  const fieldValid = node => node.type === 'checkbox' || (node.value !== '' && node.checkValidity());
  for (const id of values) {
    const node = $(id), value = stored.values?.[id];
    if (!node || typeof value !== 'string' || (firstUpgrade && id === 'dischargeMode')) continue;
    if (id === 'fontFamily' && value.startsWith('local:')) addLocalFont(value.slice(6));
    const previous = node.value;
    node.value = value;
    if (!fieldValid(node)) node.value = previous;
  }
  for (const id of checks) if (typeof stored.checks?.[id] === 'boolean') $(id).checked = stored.checks[id];
  document.body.classList.toggle('print-start-arrow', $('printStartArrow').checked);
  syncQrBar();

  function saveStatus(text, error = false) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('error-text', error);
  }
  function persist() {
    const next = {version:213, values:{...(stored.values || {})}, checks:{}};
    let invalid = false;
    for (const id of values) {
      const node = $(id);
      if (fieldValid(node)) next.values[id] = node.value;
      else invalid = true;
    }
    for (const id of checks) next.checks[id] = $(id).checked;
    try {
      // localStorage writes are synchronous, so closing the window immediately
      // after typing does not race a delayed or debounced save.
      localStorage.setItem(KEY, JSON.stringify(next));
      stored = next;
      saveStatus(invalid ? '請修正無效數值；原設定仍保留。' : '已自動儲存', invalid);
      return true;
    } catch {
      saveStatus('無法儲存設定，關閉後可能無法保留。', true);
      return false;
    }
  }
  const mmFields = new Map();
  function syncMillimeters() {
    for (const [id, input] of mmFields) {
      const original = $(id);
      input.value = fieldValid(original) ? String(Math.round(Number(original.value) * 25.4 / 96 * 10000) / 10000) : '';
    }
  }
  function buildMillimeters() {
    const labels = {width:'標籤寬度', height:'標籤高度', gapX:'第 1–2 欄間距', gapX2:'第 2–3 欄間距', gapX3:'第 3–4 欄間距', gapX4:'第 4–5 欄間距', gapY:'垂直間距', left:'左側留白', top:'上方留白'};
    const grid = make('div', 'settings layout-mm-grid');
    for (const id of layoutIds) {
      const original = $(id), label = make('label', '', labels[id] + ' mm');
      original.closest('label').hidden = true;
      const input = make('input');
      input.type = 'number'; input.id = id + 'Mm'; input.step = 'any';
      input.min = String(Number(original.min) * 25.4 / 96);
      input.max = String(Number(original.max) * 25.4 / 96);
      input.setAttribute('aria-label', labels[id] + '（毫米）');
      input.addEventListener('input', () => {
        original.value = fieldValid(input) ? String(Number(input.value) * 96 / 25.4) : '';
        original.dispatchEvent(new Event('input', {bubbles:true}));
      });
      label.append(input); grid.append(label);
      mmFields.set(id, input);
    }
    const positionControls = make('div', 'preview-position-controls');
    positionControls.id = 'previewPositionControls';
    const layoutButton = make('button', 'preview-layout-button', '版面微調');
    layoutButton.id = 'openLayoutSettings'; layoutButton.type = 'button';
    layoutButton.setAttribute('aria-haspopup', 'dialog');
    layoutButton.setAttribute('aria-controls', 'settingsDialog');
    layoutButton.onclick = () => openSettingsAt('layoutFold');
    positionControls.append(layoutButton);
    const head = document.querySelector('.preview-head');
    head.insertBefore(positionControls, head.querySelector('.zoom'));
    syncMillimeters();
    const fold = $('layoutFold');
    fold.querySelector('summary').textContent = '版面微調';
    const hint = fold.querySelector(':scope > p');
    if (hint) hint.textContent = '依貼紙與印表機調整位置，變更會立即套用並自動儲存。';
    fold.insertBefore(grid, $('reset'));
    const originalReset = $('reset').onclick;
    $('reset').onclick = event => { originalReset(event); syncMillimeters(); persist(); };
  }
  function allWardCodes() {
    return [...new Set([
      ...(globalThis.CartWorkspaceCore?.wardCodes || []),
      ...(typeof ws !== 'undefined' ? ws.wards.map(w => w.code) : []),
      ...wardCopies.keys(), '06PE', '08PE'
    ])].sort((a, b) => a.localeCompare(b, 'en', {numeric:true}));
  }
  function writeCopies() {
    const text = [...wardCopies].map(([w, n]) => w + 'x' + n).join(' ');
    $('wardCopies').value = text;
    try { localStorage.setItem(COPIES_KEY, text); }
    catch { saveStatus('病房張數無法儲存，關閉後可能無法保留。', true); return; }
    copying = true;
    $('wardCopies').dispatchEvent(new Event('input', {bubbles:true}));
    copying = false;
    persist();
  }
  function addCopiesRow(ward = '', count = 2) {
    const row = make('div', 'ward-copy-row');
    const wardLabel = make('label', '', '病房'), select = make('select');
    select.className = 'copy-ward'; select.setAttribute('aria-label', '例外病房');
    const placeholder = make('option', '', '選擇病房'); placeholder.value = ''; select.append(placeholder);
    for (const code of allWardCodes()) {
      const option = make('option', '', code); option.value = code;
      option.disabled = code !== ward && wardCopies.has(code);
      select.append(option);
    }
    select.value = ward; wardLabel.append(select);
    const countLabel = make('label', '', '每床張數'), amount = make('select');
    amount.className = 'copy-count'; amount.setAttribute('aria-label', '每床張數');
    for (let n = 1; n <= 5; n++) { const option = make('option', '', n + ' 張'); option.value = String(n); amount.append(option); }
    amount.value = String(count); countLabel.append(amount);
    const remove = make('button', 'text-button copy-remove', '移除'); remove.type = 'button';
    remove.setAttribute('aria-label', ward ? '移除 ' + ward + ' 張數設定' : '取消新增張數設定');
    const commit = () => {
      const nextWard = select.value;
      if (!nextWard) return;
      if (ward && ward !== nextWard) wardCopies.delete(ward);
      wardCopies.set(nextWard, Number(amount.value));
      writeCopies(); renderCopies();
    };
    select.addEventListener('change', commit); amount.addEventListener('change', commit);
    remove.onclick = () => {
      if (ward) { wardCopies.delete(ward); writeCopies(); }
      renderCopies();
    };
    row.append(wardLabel, countLabel, remove); copiesList.append(row);
    return select;
  }
  function renderCopies() {
    if (!copiesList) return;
    copiesList.replaceChildren();
    for (const [ward, count] of wardCopies) addCopiesRow(ward, count);
    if (copiesSummary) {
      const exceptions = [...wardCopies].filter(([, count]) => count !== 1);
      copiesSummary.textContent = exceptions.length
        ? exceptions.slice(0, 3).map(([ward, count]) => ward + ' ' + count + ' 張').join('、') + (exceptions.length > 3 ? ' 等 ' + exceptions.length + ' 個病房' : '')
        : '全部病房每床 1 張';
    }
    copiesAdd.disabled = false;
  }
  function group(title, open = false) {
    const details = make('details', 'settings213-group');
    details.open = open; details.append(make('summary', '', title));
    return details;
  }
  function mount() {
    dialog.classList.add('settings213');
    status = make('span', 'settings-save-status', '變更會自動儲存');
    status.id = 'settingsSaveStatus'; status.setAttribute('role', 'status');
    dialog.querySelector('.settings-head').insertBefore(status, $('closeSettings'));
    const originalHint = dialog.querySelector(':scope > p');
    if (originalHint) originalHint.hidden = true;
    const body = make('div', 'settings213-body');
    const labelGroup = group('常用列印選項', true), copyGroup = group('每床列印張數'), typeGroup = group('字體與標籤樣式'), recordGroup = group('交車紀錄');
    labelGroup.id = 'commonSettingsGroup'; copyGroup.id = 'copySettingsGroup'; typeGroup.id = 'typeSettingsGroup';
    body.append(labelGroup, copyGroup, typeGroup);
    const legacy = make('div'); legacy.hidden = true; legacy.id = 'settingsLegacyAnchors';
    for (const child of [...dialog.children]) if (!child.classList.contains('settings-head') && child !== originalHint) legacy.append(child);
    dialog.append(body, legacy);

    const arrow = $('printStartArrow').closest('label'); arrow.className = 'check-option'; arrow.hidden = false;
    const divider = $('wardSeparators').closest('label'); divider.hidden = false;
    const commonOptions = make('div', 'common-print-options');
    labelGroup.append(commonOptions);
    const qrBlock = $('qrEnabled').closest('.qr-settings');
    commonOptions.append(arrow, divider, $('qrEnabled').closest('label'));
    const qrExtras = make('details', 'qr-extra-controls'); qrExtras.id = 'qrExtraControls';
    qrExtras.append(make('summary', '', 'QR Code 位置與大小'));
    for (const child of [...qrBlock.children]) qrExtras.append(child);
    const qrHint = qrExtras.querySelector('p'); if (qrHint) qrHint.hidden = true;
    labelGroup.append(qrExtras);
    const qrSync = () => { qrExtras.hidden = !$('qrEnabled').checked; };
    $('qrEnabled').addEventListener('change', qrSync); qrSync();
    $('qrEnabledBar').closest('label').hidden = true;
    const idLabel = $('idStyle').closest('label');

    const copySection = make('div', 'copy-settings');
    copiesSummary = make('small', 'settings-group-preview'); copiesSummary.id = 'copySettingsSummary';
    copyGroup.querySelector('summary').append(copiesSummary);
    copySection.append(make('p', 'hint', '未列出的病房每床 1 張；最多 5 張。'));
    copiesList = make('div', 'ward-copy-list'); copiesList.id = 'wardCopyRows';
    copiesAdd = make('button', 'text-button', '＋ 新增病房例外'); copiesAdd.type = 'button'; copiesAdd.id = 'addWardCopy';
    copiesAdd.onclick = () => { copiesAdd.disabled = true; addCopiesRow().focus(); };
    copySection.append(copiesList, copiesAdd); copyGroup.append(copySection);
    $('wardCopies').closest('label').hidden = true; $('wardCopiesStatus').hidden = true;
    renderCopies();

    const typography = $('bedFont').closest('details');
    for (const child of [...typography.children]) if (child.tagName !== 'SUMMARY') {
      if (child.tagName === 'P' && child.id !== 'fontStatus') child.hidden = true;
      typeGroup.append(child);
    }
    $('fontStatus').textContent = ''; $('fontStatus').classList.add('settings-secondary-note');
    const fontActions = typeGroup.querySelector('.actions');
    typeGroup.insertBefore(idLabel, fontActions);
    const styleNames = {A:'空白分隔', B:'直線分隔', C:'橫線分隔、左右對齊（預設）', D:'上下兩行', E:'加上「病」「生」標示', F:'病歷號反白'};
    for (const option of $('idStyle').options) if (styleNames[option.value]) option.textContent = styleNames[option.value];
    const layout = $('layoutFold'); layout.classList.add('settings213-group'); layout.open = false;
    body.append(layout, recordGroup); buildMillimeters();
    const dischargeLabel = $('dischargeMode').closest('label'); dischargeLabel.classList.add('discharge-choice'); labelGroup.append(dischargeLabel);
    for (const option of $('dischargeMode').options) {
      if (option.value === 'off') option.textContent = '照常印（預設）';
      if (option.value === 'ask') option.textContent = '列印前詢問';
      if (option.value === 'auto') option.textContent = '自動不印，改印空床貼紙';
    }
    // Keep legacy IDs available to the original scripts, but do not expose any
    // bed-preset setup/import controls in the settings interface.
    $('presetSettings').hidden = true;
    const recordInfo = make('p', 'hint', '交車紀錄保留 90 天，只有已儲存且有比對依據的床位會用來省印。');
    const viewRecords = make('button', '', '查看交車紀錄'); viewRecords.type = 'button';
    viewRecords.onclick = () => $('handoverLogOpen').click();
    const download = make('button', '', '下載紀錄備份'); download.type = 'button';
    download.onclick = () => $('handoverLogDownload').click();
    const recordActions = make('div', 'actions'); recordActions.append(viewRecords, download, $('clearMemory'));
    recordGroup.append(recordInfo, recordActions);
    if ($('legacyMemorySettings')) recordGroup.append($('legacyMemorySettings'));

    // Storage is restored before the first capture; original event handlers
    // keep their existing runtime behavior, and this listener also persists the
    // controls that the original tool never saved (geometry and separators).
    for (const id of [...values, ...checks]) {
      for (const event of ['input', 'change']) $(id).addEventListener(event, persist);
    }
    $('applyFont').hidden = true;
    $('fontName').addEventListener('input', () => {
      if (!$('fontName').value.trim()) return;
      const value = addLocalFont($('fontName').value);
      if (!value) { saveStatus('請輸入有效的電腦字體名稱。', true); return; }
      $('fontFamily').value = value;
      typographyChanged(); persist();
    });
    for (const id of ['applyFont', 'resetTypography']) $(id).addEventListener('click', persist);
    $('openSettings').addEventListener('click', () => {
      renderCopies(); syncMillimeters();
      for (const section of body.children) if (section.tagName === 'DETAILS') section.open = section === labelGroup;
      dialog.scrollTop = 0;
    });
    $('wardCopies').addEventListener('input', () => { if (!copying) renderCopies(); });
    openSettingsAt = id => {
      if (id === 'presetSettings') return;
      if (!dialog.open) dialog.showModal();
      const target = $(id);
      if (!target) return;
      renderCopies(); syncMillimeters();
      for (const section of body.children) if (section.tagName === 'DETAILS') section.open = section.contains(target);
      for (let node = target; node && node !== dialog; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
      requestAnimationFrame(() => {
        const headerHeight = dialog.querySelector('.settings-head').getBoundingClientRect().height;
        dialog.scrollTop += target.getBoundingClientRect().top - dialog.getBoundingClientRect().top - headerHeight - 8;
        if (id === 'layoutFold') $('widthMm').focus({preventScroll:true});
      });
    };
    persist(); render();
  }
  document.addEventListener('managed-app-ready', mount, {once:true});
  globalThis.CartSettings = {persist, refreshWards:renderCopies, syncMillimeters};
})();
