(() => {
  'use strict';
  function failure(code, message) { return Object.assign(new Error(message), { code }); }

  // A completed request and a ready DOM are separate conditions. Do not fail
  // on the first inspection, and never send the original action a second time.
  async function runNativeAction({ ready, subscribe, send, isBusy, inspect, description, token,
    timeoutMs = 25000, settleMs = 4000, pollMs = 50 }) {
    await ready();
    return new Promise((resolve, reject) => {
      let started = false, endedAt = null, sequence = null, finished = false;
      let unsubscribe = () => {};
      const timeout = setTimeout(() => finish(failure('REQUEST_TIMEOUT', description + '逾時，請回原畫面確認處理結果。')), timeoutMs);
      const poll = setInterval(check, pollMs);
      function finish(error, result) {
        if (finished) return;
        finished = true; clearTimeout(timeout); clearInterval(poll); unsubscribe();
        error ? reject(error) : resolve(result);
      }
      function check() {
        if (finished || endedAt === null || isBusy()) return;
        try {
          const result = inspect();
          if (result) return finish(null, result);
          if (Date.now() - endedAt >= settleMs) finish(failure('DOM_NOT_READY', description + '後尚未取得完整畫面。'));
        } catch (error) { finish(error); }
      }
      unsubscribe = subscribe(data => {
        if (data.token === token && data.type === 'rejected') return finish(failure('ACTION_REJECTED', data.error));
        if (data.type === 'begin') {
          if (started && data.seq !== sequence) return finish(failure('REQUEST_CHANGED', '原頁面發生其他操作，已停止自動處理。'));
          started = true; sequence = data.seq;
        }
        if (data.type === 'end' && started && data.seq === sequence) {
          if (data.error) return finish(failure('NATIVE_ERROR', '原系統回報錯誤：' + data.error));
          endedAt = Date.now(); queueMicrotask(check);
        }
      });
      try { send(); } catch (error) { finish(error); }
    });
  }

  // Only the read-only 詳 operation may be reopened once. Network/server
  // errors and unknown request outcomes are not retried.
  async function readDetailWithRetry(load) {
    try { return await load(); }
    catch (error) {
      if (error.code !== 'DOM_NOT_READY') throw error;
      return load();
    }
  }

  // Once independent quantity verification succeeds, an optional history
  // refresh cannot turn that confirmed result back into an uncertain write.
  async function completeReturn({ verify, refresh, onVerified = () => {} }) {
    const verified = await verify();
    onVerified(verified);
    try { return { verified, data: await refresh(verified), detailsError: null }; }
    catch (detailsError) { return { verified, data: verified, detailsError }; }
  }
  // Ambiguous rows are submitted only after selecting exactly one source
  // prescription. Stop immediately on an unknown outcome; never retry writes.
  async function runSequence({ items, prepare, submit, verify, onProgress = () => {} }) {
    const completed = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index]; let phase = 'prepare', attempted = false;
      try {
        onProgress(item, index, items.length);
        const prepared = await prepare(item);
        phase = 'submit'; attempted = true;
        await submit(item, prepared);
        phase = 'verify';
        const data = await verify(item, prepared);
        completed.push({item, data});
      } catch (error) {
        return { completed, failed:{item,phase,attempted,error}, remaining:items.slice(index + 1) };
      }
    }
    return {completed, failed:null, remaining:[]};
  }
  const workflow = { runNativeAction, readDetailWithRetry, completeReturn, runSequence };
  if (typeof module !== 'undefined' && module.exports) module.exports = workflow;
  else globalThis.NTUHReturnWorkflow = Object.freeze(workflow);
})();
