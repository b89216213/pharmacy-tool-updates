(() => {
  'use strict';
  if (window.__ntuhBarcodeReturnBridgeV1) return;
  window.__ntuhBarcodeReturnBridgeV1 = true;
  const COMMAND = 'ntuh-barcode-return-command-v1';
  const SIGNAL = 'ntuh-barcode-return-signal-v1';
  let hooked = false, seq = 0, busy = false;
  const emit = data => window.dispatchEvent(new CustomEvent(SIGNAL, { detail: JSON.stringify(data) }));
  function hook() {
    if (hooked) return;
    const manager = window.Sys?.WebForms?.PageRequestManager?.getInstance();
    if (!manager) return;
    manager.add_beginRequest(() => { busy = true; emit({ type: 'begin', seq: ++seq, busy }); });
    manager.add_endRequest((sender, args) => {
      busy = false;
      const error = args.get_error?.();
      emit({ type: 'end', seq, busy, error: error ? String(error.message || error) : '' });
      // 不攔截原系統錯誤、驗證、confirm 或 alert。
    });
    hooked = true;
    emit({ type: 'ready', seq, busy });
  }
  const allowedClick = /^(?:NTUHWeb1_QueryInptOrderByReviseBox_btnQuery|NTUHWeb1_btnReturnDrug2?|NTUHWeb1_SelectReturnDrugBox_btn(?:Return|ReChoose)1?|NTUHWeb1_InptOrderBox_grvInptOrder_ctl\d+_btnDetail)$/;
  window.addEventListener(COMMAND, event => {
    let command;
    try { command = JSON.parse(event.detail); } catch { return; }
    if (!command || typeof command.token !== 'string') return;
    hook();
    if (command.type === 'ping') { emit({ type: 'ready', seq, busy, token: command.token, hooked }); return; }
    if (busy) { emit({ type: 'rejected', token: command.token, error: '原系統正在處理其他操作。' }); return; }
    const node = document.getElementById(command.id);
    if (!node || node.disabled) { emit({ type: 'rejected', token: command.token, error: '原系統按鈕不存在或無法操作。' }); return; }
    if (command.type === 'barcode-change' && command.id === 'NTUHWeb1_QueryInptOrderByReviseBox_txbPrescriptionBarCode') {
      node.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (command.type === 'click' && allowedClick.test(command.id)) {
      node.click();
    } else return;
    emit({ type: 'activated', token: command.token });
  });
  const timer = setInterval(() => { hook(); if (hooked) clearInterval(timer); }, 100);
  setTimeout(() => clearInterval(timer), 30000);
})();
