(() => {
  'use strict';
  const IDS = Object.freeze({
    list: 'NTUHWeb1_InptOrderBox_grvInptOrder',
    returns: 'NTUHWeb1_SelectReturnDrugBox_grvOrderReturn',
    barcode: 'NTUHWeb1_QueryInptOrderByReviseBox_txbPrescriptionBarCode',
    showReturns: 'NTUHWeb1_InptOrderBox_ckbOpenReturnDetail',
    open: 'NTUHWeb1_btnReturnDrug',
    submit: 'NTUHWeb1_SelectReturnDrugBox_btnReturn',
    rechoose: 'NTUHWeb1_SelectReturnDrugBox_btnReChoose',
    pharmacy: 'NTUHWeb1_SelectReturnDrugBox_ddlPharmacy'
  });
  const clean = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const number = value => {
    const text = clean(value).replace(/,/g, '');
    return text !== '' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : null;
  };
  const status = value => ({ '停': '停用', '確': '確認', '完': '完成' }[clean(value)] || clean(value));
  const date = value => clean(value).replace(/\D/g, '').slice(0, 8);
  const day = value => /^\d{8}$/.test(date(value)) ? date(value).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1/$2/$3') : clean(value);
  const directRows = table => table ? Array.from(table.rows).filter(row => row.closest('table') === table) : [];
  const cellText = row => Array.from(row.cells, cell => clean(cell.textContent));
  function tableData(table) {
    if (!table) return null;
    const rows = directRows(table);
    const header = rows.find(row => row.querySelector('th'));
    const headers = header ? cellText(header) : [];
    return { headers, rows: rows.filter(row => row !== header && row.cells.length === headers.length && !row.querySelector('th')).map(cellText) };
  }
  function readPatient(doc) {
    const get = suffix => clean(doc.getElementById('NTUHWeb1_InPatientInfoBox_' + suffix)?.textContent);
    return { name: get('lblName'), chart: get('lblChartNo'), account: get('lblAccountIdse'), bed: get('lblBedNo'), age: get('lblAge'), sex: get('lblSex'), height: get('lblHeight'), weight: get('lblWeight') };
  }
  function parseOrderCells(cells, extra = {}) {
    if (cells.length < 16) throw new Error('處方欄位數與範例不符，請回原畫面確認。');
    const [ , serial, state, priority, type, prescribedDate, prescription, generic, brand, dose, frequency, route, days, accountType, group ] = cells;
    return { ...extra, serial, state: status(state), priority, type, prescribedDate, prescription, generic, brand, dose, frequency, route, days, accountType, group, key: [extra.patientAccount, serial, prescription, prescribedDate].join('|') };
  }
  function readOrders(doc) {
    const table = doc.getElementById(IDS.list);
    if (!table) return [];
    if (Array.from(table.querySelectorAll('a')).some(link => /Page\$/.test(link.getAttribute('href') || ''))) throw new Error('處方清單含分頁，請先於原畫面確認全部處方。');
    const patient = readPatient(doc);
    return directRows(table).filter(row => row.querySelector('input[id$="_ckbSelect"]')).map(row => {
      const checkbox = row.querySelector('input[id$="_ckbSelect"]');
      const detail = row.querySelector('a[id$="_btnDetail"]');
      return parseOrderCells(cellText(row), { checkboxId: checkbox.id, detailId: detail?.id || '', disabled: checkbox.disabled, patientAccount: patient.account });
    }).filter(row => !row.disabled);
  }
  function readReturns(doc) {
    const table = doc.getElementById(IDS.returns);
    return directRows(table).filter(row => row.querySelector('input[id$="_txbReturnAmount"]')).map(row => {
      const c = cellText(row), input = row.querySelector('input[id$="_txbReturnAmount"]');
      if (c.length !== 10) throw new Error('退藥欄位與範例不符，請回原畫面確認。');
      const values = [c[4],c[5],c[6]].map(number);
      if (values.some(n => n === null || !Number.isFinite(n))) throw new Error('無法辨識原系統的發藥量、退藥量或餘量，請回原畫面確認。');
      return { state: status(c[0]), type: c[1], generic: c[2], brand: c[3], issued: values[0], returned: values[1], rest: values[2], batch: c[7], start: c[9], inputId: input.id, amount: input.value, maxLength: input.maxLength > 0 ? input.maxLength : 6 };
    });
  }
  const fieldNames = {
    txbSpecificInstruction: '特殊醫囑', txbOrderReason: '用藥原因', txbSpecificDosePattern: '特殊劑量', txbDoseBase: '單位劑量',
    txbStartDateChar: '開始日', txbStartTimeChar: '開始時間', txbEndDateChar: '結束日', txbEndTimeChar: '結束時間',
    txbDispenseWayDescription: '調劑方式', txbDailyAmount: '藥局每日發藥量', txbGiveAmount: '醫師指定調劑量', txbDispenseDayListDescription: '指定日期',
    txbDiluentAbbrivation: '稀釋液', txbDiluentVolumn: '體積', txbConcentration: '濃度', txbFlowVelocity: '速度', txbMilliliterPerHour: '流速', txbInfusionTime: '時間',
    txbExecutionWard: '執行單位', txbRepeatReason: '重複用藥原因', txbVaccineSerialNo: '疫苗劑別', txbVaccineBatchNo: '疫苗批號',
    txbOrderPlanCreateEmpName: '醫令輸入者', txbOrderPlanCreateDateTime: '醫令輸入時間', txbCompleteEmpName: '醫令確認者', txbCompleteDateTime: '醫令確認時間',
    txbModifyEmpName: '醫令異動者', txbModifyDateTime: '醫令異動時間', txbModifyCauseContent: '醫令異動原因', txbDispenseEmpNo: '調劑藥師', txbVerifyEmpNo: '複核藥師'
  };
  function findDetailRoot(doc, order) {
    const table = doc.getElementById(IDS.list);
    if (!table) return null;
    const serialInput = Array.from(table.querySelectorAll('input[id$="_txbOrderSeqNo"]')).find(node => clean(node.value) === order.serial);
    if (!serialInput) return null;
    let node = serialInput;
    while (node && !(node.tagName === 'TR' && node.closest('table') === table)) node = node.parentElement;
    return node;
  }
  function readDetail(doc, order) {
    const root = findDetailRoot(doc, order);
    if (!root) return null;
    const value = suffix => root.querySelector('input[id$="_' + suffix + '"]')?.value ?? '';
    const fields = Object.entries(fieldNames).map(([suffix, label]) => [label, value(suffix)]).filter(([, v]) => clean(v));
    for (const [suffix, label] of [['ckbIsRepeat','是否重複用藥'],['ckbIsAllergy','是否過敏']]) {
      const input = root.querySelector('input[id$="_' + suffix + '"]');
      if (input) fields.push([label, input.checked ? '已勾選' : '未勾選']);
    }
    return {
      root, orderId: value('hdfPhrOrderIdse'), start: value('txbStartDateChar'), fields,
      daily: tableData(root.querySelector('[id="grvDailyRecord"]')),
      history: tableData(root.querySelector('[id="InptReturnRecordBox_grvReturnRecord"]')),
      delivery: tableData(root.querySelector('[id="grvDeliveryRecord"]')),
      review: tableData(root.querySelector('[id="grvVerifyLogs"]'))
    };
  }
  function sumColumn(data, index) {
    if (!data || !data.rows.length) return null;
    let total = 0;
    for (const row of data.rows) { const text = clean(row[index]); if (!text) continue; const n = number(text); if (n === null) return null; total += n; }
    return total;
  }
  function compatible(order, row, { useDailyTotals = true } = {}) {
    const matches = ['state', 'type', 'generic', 'brand'].every(key => clean(order[key]) === clean(row[key]));
    if (!matches) return false;
    if (order.detail?.start && date(order.detail.start) !== date(row.start)) return false;
    if (!useDailyTotals) return true;
    const issued = sumColumn(order.detail?.daily, 2), returned = sumColumn(order.detail?.daily, 4);
    if (issued !== null && row.issued !== null && Math.abs(issued - row.issued) > 1e-7) return false;
    if (returned !== null && row.returned !== null && Math.abs(returned - row.returned) > 1e-7) return false;
    return true;
  }
  function matchOrders(orders, rows, options = {}) {
    if (!orders.length || orders.length !== rows.length) throw new Error('處方筆數與退藥欄位不一致，已停止對應。請回原畫面確認。');
    if (new Set(orders.map(row => row.key)).size !== orders.length) throw new Error('原始處方識別資料重複，請回原畫面確認。');
    const candidates = rows.map(row => orders.map((o, i) => compatible(o, row, options) ? i : -1).filter(i => i >= 0));
    const assigned = new Map(), used = new Set();
    let progress = true;
    while (progress) {
      progress = false;
      candidates.forEach((list, index) => {
        if (assigned.has(index)) return;
        const available = list.filter(i => !used.has(i));
        if (available.length === 1) { assigned.set(index, available[0]); used.add(available[0]); progress = true; }
      });
    }
    if (assigned.size !== rows.length) throw Object.assign(new Error('有處方無法唯一對應退藥欄位，已停止輸入與送出。請回原畫面核對。'), {code:'ORDER_MATCH_AMBIGUOUS'});
    return rows.map((row, i) => ({ ...orders[assigned.get(i)], ...row, key: orders[assigned.get(i)].key }));
  }
  function validateAmount(raw, row) {
    const text = clean(raw);
    if (!text) return { valid: true, value: null };
    const value = number(text);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || value === null || !Number.isFinite(value) || text.length > row.maxLength) return { valid: false, message: '請輸入有效的退藥數量。' };
    if (row.rest === null || row.returned === null) return { valid: false, message: '無法取得原系統餘量，請回原畫面確認。' };
    if (value > row.rest + 1e-7) return { valid: false, message: '新退藥量超過餘量 ' + row.rest + '。' };
    if (value < -row.returned - 1e-7) return { valid: false, message: '負數調整超過目前總退藥量 ' + row.returned + '。' };
    return { valid: true, value };
  }
  function checkResult(before, after, amounts, { requireOrderIds = true } = {}) {
    if (before.length !== after.length || new Set(after.map(row => row.key)).size !== after.length) return false;
    return before.every(row => {
      const current = after.find(item => item.key === row.key), amount = amounts.get(row.key) || 0;
      return current && current.issued !== null && current.returned !== null && current.rest !== null &&
        (!requireOrderIds || !row.detail?.orderId || current.detail?.orderId === row.detail.orderId) &&
        Math.abs(current.issued - row.issued) < 1e-7 && Math.abs(current.returned - row.returned - amount) < 1e-7 && Math.abs(current.rest - row.rest + amount) < 1e-7;
    });
  }
  const core = { IDS, clean, number, status, date, day, directRows, cellText, tableData, readPatient, parseOrderCells, readOrders, readReturns, findDetailRoot, readDetail, sumColumn, compatible, matchOrders, validateAmount, checkResult };
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  else globalThis.NTUHReturnCore = Object.freeze(core);
})();
