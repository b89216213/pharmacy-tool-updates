// 食藥署公開藥品資料（背景下載）
// #36 全部藥品許可證、#43 藥品詳細處方成分、#42 藥品外觀 → 依許可證字號整合成精簡索引，
// 存在 chrome.storage.local（只含公開藥品資料，不含病人資料），每 7 天更新一次。
const MR_DATA_KEY = "medref-data";
const MR_STATUS_KEY = "medref-status";
const MR_MAX_AGE = 7 * 86400000;
const MR_RETRY_AFTER_ERROR = 6 * 3600000;
const MR_STALE_RUN = 5 * 60000;
const MR_KEEP_CANCELLED_YEARS = 3;
const MR_BASE = "https://data.fda.gov.tw/data/opendata/export/";
let mrJob = null;

async function mrGetStatus() {
  try { return (await chrome.storage.local.get(MR_STATUS_KEY))[MR_STATUS_KEY] || {}; } catch { return {}; }
}
async function mrSetStatus(patch) {
  const cur = await mrGetStatus();
  await chrome.storage.local.set({ [MR_STATUS_KEY]: Object.assign({}, cur, patch) });
}

// Minimal ZIP reader: first entry, stored or deflated (sizes from the central directory).
async function mrUnzipFirst(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  let e = buf.byteLength - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("ZIP 格式無法辨識");
  const cd = dv.getUint32(e + 16, true);
  const method = dv.getUint16(cd + 10, true), csize = dv.getUint32(cd + 20, true), lho = dv.getUint32(cd + 42, true);
  const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
  const comp = u8.subarray(start, start + csize);
  if (method === 0) return new TextDecoder().decode(comp);
  if (method !== 8) throw new Error("不支援的壓縮方式 " + method);
  const out = await new Response(new Blob([comp]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
  return new TextDecoder().decode(out);
}
async function mrFetch(id) {
  let r;
  try { r = await fetch(MR_BASE + id + "/json", { cache: "no-store" }); }
  catch (e) { throw new Error("無法連線到食藥署開放資料（data.fda.gov.tw），請確認網路後按「立即更新」"); }
  if (!r.ok) throw new Error("食藥署資料 #" + id + " 下載失敗（HTTP " + r.status + "）");
  const buf = await r.arrayBuffer();
  const u8 = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
  const text = u8[0] === 0x50 && u8[1] === 0x4b ? await mrUnzipFirst(buf) : new TextDecoder().decode(buf);
  const j = JSON.parse(text.replace(/^﻿/, ""));
  const arr = Array.isArray(j) ? j : Array.isArray(j && j.data) ? j.data : null;
  if (!arr) throw new Error("食藥署資料 #" + id + " 格式不符");
  return arr;
}
const mrStr = v => (v == null ? "" : String(v)).trim();

async function mrRun() {
  const keepAlive = setInterval(() => { try { chrome.runtime.getPlatformInfo(() => void chrome.runtime.lastError); } catch (e) {} }, 20000);
  try { await mrRunInner(); } finally { clearInterval(keepAlive); }
}
async function mrRunInner() {
  const startedAt = Date.now();
  await mrSetStatus({ state: "downloading", step: "許可證", startedAt, error: "" });
  // license → [英文品名, 中文品名, 已註銷(0/1), [[成分, 含量, 單位]…], 外觀(0 或 [圖, 形狀, 顏色, 刻痕, 標註, 尺寸])]
  const out = {};
  const dropped = new Set();
  const cutoff = new Date().getFullYear() - MR_KEEP_CANCELLED_YEARS;
  let lic = await mrFetch(36);
  for (const r of lic) {
    const L = mrStr(r["許可證字號"]);
    if (!L) continue;
    const cancelled = !!mrStr(r["註銷狀態"]);
    const y = parseInt(mrStr(r["註銷日期"]).slice(0, 4), 10);
    if (cancelled && Number.isFinite(y) && y < cutoff) { if (!out[L]) dropped.add(L); continue; }
    dropped.delete(L);
    if (!out[L] || (out[L][2] && !cancelled)) out[L] = [mrStr(r["英文品名"]), mrStr(r["中文品名"]), cancelled ? 1 : 0, [], 0];
  }
  const nLic = lic.length;
  lic = null;
  await mrSetStatus({ step: "成分" });
  let ing = await mrFetch(43);
  for (const r of ing) {
    const L = mrStr(r["許可證字號"]);
    if (!L || dropped.has(L)) continue;
    const e = out[L] || (out[L] = ["", "", 0, [], 0]);
    const a = parseFloat(r["含量"]);
    e[3].push([mrStr(r["成分名稱"]), Number.isFinite(a) ? +a.toFixed(4) : "", mrStr(r["含量單位"])]);
  }
  const nIng = ing.length;
  ing = null;
  await mrSetStatus({ step: "外觀圖" });
  const app = await mrFetch(42);
  let nImg = 0;
  for (const r of app) {
    const L = mrStr(r["許可證字號"]);
    const url = mrStr(r["外觀圖檔連結"]).split(";;;")[0].trim();   // 膠囊兩半可能各一張圖
    if (!L || !/^https:\/\//i.test(url) || dropped.has(L)) continue;
    const e = out[L] || (out[L] = ["", "", 0, [], 0]);
    if (e[4]) continue;
    e[4] = [url, mrStr(r["形狀"]), mrStr(r["顏色"]).split(";;;").filter(Boolean).join("／"), mrStr(r["刻痕"]),
      [mrStr(r["標註一"]), mrStr(r["標註二"])].filter(x => x && x !== "null").join(" / "), mrStr(r["外觀尺寸"])];
    nImg++;
  }
  const counts = { licenses: Object.keys(out).length, sourceLicenses: nLic, ingredients: nIng, images: nImg };
  const data = { v: 1, updatedAt: Date.now(), counts, lic: out };
  await chrome.storage.local.set({ [MR_DATA_KEY]: data });
  await mrSetStatus({ state: "ready", step: "", updatedAt: data.updatedAt, counts, error: "", ms: Date.now() - startedAt });
}

function mrStart(force) {
  if (mrJob) return mrJob;
  mrJob = (async () => {
    const s = await mrGetStatus();
    if (!force) {
      if (s.state === "downloading" && s.startedAt && Date.now() - s.startedAt < MR_STALE_RUN) return;
      if (s.updatedAt && Date.now() - s.updatedAt < MR_MAX_AGE && s.state !== "missing") return;
      if (s.state === "error" && s.failedAt && Date.now() - s.failedAt < MR_RETRY_AFTER_ERROR) return;
    }
    try { await mrRun(); }
    catch (err) { await mrSetStatus({ state: "error", step: "", error: String((err && err.message) || err), failedAt: Date.now() }); }
  })().finally(() => { mrJob = null; });
  return mrJob;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || (msg.type !== "medref-ensure" && msg.type !== "medref-update")) return;
  mrStart(msg.type === "medref-update").then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
  return true;
});
chrome.runtime.onInstalled.addListener(() => { mrStart(false); });
chrome.runtime.onStartup.addListener(() => { mrStart(false); });

