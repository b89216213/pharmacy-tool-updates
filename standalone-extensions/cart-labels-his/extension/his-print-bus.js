// 院內列印元件攔截（共用）：藥車標籤擴充與「HIS 院內列印」擴充都含這個檔案。
// 頁面上只會安裝一次（先載入者安裝），兩個擴充都透過下列事件取得資料，不會互相搶：
//   his-print-call     每次呼叫院內元件（方法名稱、參數摘要；不含內容）
//   his-print-data     有列印資料（.NET 版面）時：{ obj, method, data, compressed }
//   his-print-command  IE 列印指令但沒有資料（ExecWB 列印、ScriptX factory.printing…）
(() => {
  if (window.__hisPrintBus) return;
  window.__hisPrintBus = { version: 1 };
  const emit = (type, detail) => document.dispatchEvent(new CustomEvent(type, { detail: JSON.stringify(detail) }));
  // 參數摘要：只留型別／長度與數字，不留文字內容（避免病人資料）
  const summary = a => typeof a === 'string' ? `字串(${a.length})` : typeof a === 'number' || typeof a === 'boolean' ? String(a) : a == null ? String(a) : typeof a;
  const looksData = a => typeof a === 'string' && a.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(a.slice(0, 400));

  function handleCall(name, path, args, state) {
    emit('his-print-call', { obj: name, method: path, args: args.map(summary) });
    const leaf = path.split('.').pop();
    const isExecPrint = /^execwb$/i.test(leaf) && (args[0] === 6 || args[0] === 7);
    // Print、PrintLabel、PrintPreview、DoPrint、Preview…；不含 SetPrinter、PrinterName 等設定
    const isPrintName = /^(do|start|show)?print(?!er)|preview/i.test(leaf);
    if (!isExecPrint && !isPrintName) return;
    const dataArg = args.find(looksData);
    const stateData = state && Object.entries(state).find(([, v]) => looksData(v));
    const data = dataArg || (stateData && stateData[1]);
    if (data) {
      emit('his-print-data', { obj: name, method: path, data, compressed: !!state && (state.Compressed === true || state.Compressed === 'true') });
      if (!dataArg && stateData) delete state[stateData[0]];
    } else {
      emit('his-print-command', { obj: name, method: path, args: args.map(summary), execwb: isExecPrint, scriptx: /printing\./i.test(path) });
    }
  }

  // 可呼叫、也可再取屬性的替身（例如 factory.printing.Print(false)）
  function callable(name, path, state) {
    const fn = function () {};
    return new Proxy(fn, {
      apply: (t, self, args) => { handleCall(name, path, args, state); return ''; },
      get: (t, k) => {
        if (k === Symbol.toPrimitive) return () => '';
        if (typeof k === 'symbol' || k === 'then') return undefined;
        if (k === 'toString' || k === 'valueOf') return () => '';
        return callable(name, path + '.' + k, state);
      }
    });
  }

  function patch(el) {
    if (!el || el.__hisPrintPatched) return;
    el.__hisPrintPatched = true;
    const state = {};
    const name = el.id || el.getAttribute?.('name') || 'object';
    const base = Object.getPrototypeOf(el);
    // 晚一步才安裝（按下按鈕時）：頁面先前直接寫在元件上的屬性（例如 Data）移到狀態裡，之後的讀寫才會經過攔截
    for (const k of Object.keys(el)) if (k !== '__hisPrintPatched' && !(k in base)) { state[k] = el[k]; try { delete el[k]; } catch {} }
    Object.setPrototypeOf(el, new Proxy(base, {
      get(target, key, receiver) {
        if (typeof key === 'symbol' || key in target) return Reflect.get(target, key, receiver);
        if (key in state) return state[key];
        return callable(name, key, state);
      },
      set(target, key, value, receiver) {
        if (typeof key === 'symbol' || key in target) return Reflect.set(target, key, value, receiver);
        emit('his-print-call', { obj: name, method: key + ' =', args: [summary(value)] });
        state[key] = value;
        return true;
      }
    }));
  }

  if (!('ActiveXObject' in window)) {
    window.ActiveXObject = function (prog) {
      emit('his-print-call', { obj: 'ActiveXObject', method: 'new', args: [String(prog).slice(0, 60)] });
      const fake = document.createElement('object');
      fake.id = 'ActiveX:' + String(prog).slice(0, 60);
      patch(fake);
      return fake;
    };
  }

  const scan = () => document.querySelectorAll('object,embed').forEach(patch);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.addEventListener('load', scan);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
