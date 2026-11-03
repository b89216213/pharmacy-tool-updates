(() => {
  'use strict';
  if (globalThis.__PORTAL_INVENTORY_V1__) return;
  const state = { busy: false, message: '', run: null, unresolved: false, canStop: false };
  let panel, status, list, choices, stop, close, ack, veil, note;
  const controller = globalThis.PortalInventoryFactory(change => {
    Object.assign(state, change);
    if (panel) render();
  });
  globalThis.__PORTAL_INVENTORY_V1__ = controller;
  function el(tag, text, parent) {
    const e = document.createElement(tag); if (text) e.textContent = text; parent?.append(e); return e;
  }
  function pendingReview() {
    return state.unresolved || controller.history().some(h => !h.acknowledged && h.jobs?.some(j => ['sending', 'unknown'].includes(j.status)));
  }
  function render() {
    status.textContent = state.message || '選擇範圍後，將讀取藥帳並自動送出盤點。';
    status.setAttribute('role', state.busy ? 'status' : 'alert');
    let locked = false;
    try { locked = pendingReview(); } catch (e) { locked = true; status.textContent = e.message; }
    choices.hidden = state.busy || locked;
    stop.hidden = !state.canStop; close.hidden = state.busy;
    ack.hidden = state.busy || !locked;
    veil.hidden = !state.busy;
    if (state.busy) panel.hidden = false;
    note.textContent = state.busy ? 'Portal 正在處理，請保留此分頁。' : '全部填入後一次確認；結果會逐項列出。';
    list.replaceChildren();
    const run = state.run;
    if (run) {
      const report = run.report;
      el('p', `${run.pharmacy} · 管1～管${run.maxGrade}` + (report ? ` · ${report.date} ${String(report.hour).padStart(2, '0')}:00` : ''), list).className = 'meta';
      const done = (run.jobs || []).filter(j => j.status === 'done').length;
      if (run.jobs?.length) {
        const progress = el('progress', '', list); progress.max = run.jobs.length; progress.value = done;
        el('p', `已確認成功 ${done}／${run.jobs.length} 項`, list).className = 'meta';
        const details = el('details', '', list); details.open = run.status !== 'done';
        el('summary', '查看本次結果', details);
        const ul = el('ul', '', details);
        const labels = { pending: '尚未執行', filled: '已填入', checking: '正在檢核', sending: '正在送出／待查核', unknown: '待查核', done: '成功', failed: '未送出' };
        for (const job of run.jobs) {
          el('li', `${labels[job.status] || job.status} · ${job.label}：${job.amount} ${job.unit}` + (job.message ? `（${job.message}）` : ''), ul).className = job.status;
        }
      }
    }
  }
  function mount() {
    if (!document.body || document.getElementById('portal-inventory-helper')) return;
    const host = el('div', '', document.body); host.id = 'portal-inventory-helper';
    const shadow = host.attachShadow({ mode: 'open' });
    el('style', `
      :host { all: initial; font-family: "Microsoft JhengHei", system-ui, sans-serif; font-size: 14px; color: #173137; }
      * { box-sizing: border-box; } [hidden] { display: none !important; }
      button { font: inherit; cursor: pointer; border-radius: 9px; padding: 11px 14px; border: 1px solid #ccdcdc; background: white; color: #173137; }
      button:hover { background: #eef7f5; } button:focus-visible, summary:focus-visible { outline: 3px solid #6cbda9; outline-offset: 2px; }
      .launcher { position: fixed; bottom: 20px; right: 20px; z-index: 2147483645; background: #116756; color: white; box-shadow: 0 4px 18px #001b2430; }
      .launcher:hover { background: #0d5547; }
      .veil { position: fixed; inset: 0; background: #132d3b24; z-index: 2147483646; }
      .panel { position: fixed; bottom: 76px; right: 20px; width: min(410px, calc(100vw - 32px)); max-height: calc(100vh - 100px); overflow: auto; z-index: 2147483647; background: #fff; border: 1px solid #d9e5e3; border-radius: 15px; padding: 20px; box-shadow: 0 12px 42px #152d3940; line-height: 1.6; }
      h2 { margin: 0 0 8px; font-size: 19px; } p { margin: 8px 0; } .subtitle, .meta, .note { color: #596e73; font-size: 12px; }
      .status { margin: 14px 0; padding: 11px; background: #eff6f4; border-radius: 8px; overflow-wrap: anywhere; }
      .choices { display: grid; gap: 9px; } .choices button { background: #116756; color: #fff; border: 0; text-align: left; font-weight: 600; }
      .choices button:hover { background: #0d5547; } .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      progress { width: 100%; height: 8px; accent-color: #116756; } summary { cursor: pointer; }
      ul { margin: 8px 0; padding-left: 18px; font-size: 12px; max-height: 210px; overflow: auto; } li { margin-bottom: 7px; } .unknown, .failed, .sending { color: #a04416; } .done { color: #116756; }
    `, shadow);
    const launcher = el('button', '藥帳帶入盤點', shadow); launcher.type = 'button'; launcher.className = 'launcher'; launcher.setAttribute('aria-expanded', 'false');
    veil = el('div', '', shadow); veil.className = 'veil'; veil.hidden = true;
    panel = el('section', '', shadow); panel.className = 'panel'; panel.hidden = true; panel.tabIndex = -1; panel.setAttribute('aria-label', '藥帳帶入盤點');
    el('h2', '藥帳帶入盤點', panel);
    el('p', '讀取今日未來時段的結存量，帶入盤點並送出。', panel).className = 'subtitle';
    status = el('div', '', panel); status.className = 'status'; status.setAttribute('aria-live', 'polite');
    choices = el('div', '', panel); choices.className = 'choices';
    for (const [grade, title] of [[2, '管1 ＋ 管2'], [3, '管1 ＋ 管2 ＋ 管3']]) {
      const b = el('button', title, choices); b.type = 'button';
      b.onclick = () => {
        globalThis.ManagedInventory.run(() => controller.run(grade)).catch(e => { state.message = e.message; state.busy = false; render(); });
        stop.focus();
      };
    }
    list = el('div', '', panel);
    ack = el('button', '已回 Portal 查核，解除鎖定', panel); ack.type = 'button'; ack.hidden = true;
    ack.onclick = () => { try { controller.acknowledge(); state.message = '已解除鎖定。再次選擇範圍會建立新的一次盤點。'; } catch (e) { state.message = e.message; } render(); };
    note = el('p', '', panel); note.className = 'note';
    const management = el('button', '電腦登記／工具更新', panel); management.type = 'button';
    const refreshManagement=async()=>{try{const s=await globalThis.ManagedInventory.status();management.textContent=s.updateAvailable?'有新版 v'+s.latestVersion+' · 工具更新':'電腦登記／工具更新';}catch{management.textContent='重新整理 Portal 以連接工具';}};
    void refreshManagement();setInterval(refreshManagement,60000);
    management.onclick = () => globalThis.ManagedInventory.open().catch(e => { state.message = e.message; render(); });
    const actions = el('div', '', panel); actions.className = 'actions';
    stop = el('button', '取消', actions); stop.type = 'button'; stop.hidden = true; stop.onclick = () => controller.stop();
    close = el('button', '關閉', actions); close.type = 'button'; close.onclick = () => { panel.hidden = true; launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); };
    launcher.onclick = () => {
      panel.hidden = !panel.hidden; launcher.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) {
        try {
          if (!state.run) state.run = controller.history()[0] || null;
          if (pendingReview()) state.message = '上次有尚未確認結果的盤點。請先回 Portal 查核，再解除鎖定。';
        } catch (e) { state.message = e.message; }
        render(); choices.querySelector('button')?.focus();
      }
    };
    document.addEventListener('keydown', e => {
      if (!state.busy) return;
      const focusTarget = stop.hidden ? panel : stop;
      if (!e.composedPath().includes(host)) { e.preventDefault(); e.stopImmediatePropagation(); focusTarget.focus(); }
      else if (e.key === 'Tab') { e.preventDefault(); focusTarget.focus(); }
    }, true);
    render();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();

