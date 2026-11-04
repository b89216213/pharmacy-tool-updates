// .NET BinaryFormatter（MS-NRBF）解析器：把院內列印元件的資料還原成物件
// 只讀取、不執行任何內容。
(function (global) {
  'use strict';

  function parseNrbf(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const dec = new TextDecoder('utf-8');
    let p = 0;
    const objects = new Map(); // id -> value
    const classes = new Map(); // objectId -> class metadata（供 ClassWithId 重用）
    const libraries = new Map();
    let rootId = null;

    const u8 = () => bytes[p++];
    const i32 = () => { const v = dv.getInt32(p, true); p += 4; return v; };
    const varint = () => { let n = 0, s = 0, c; do { c = bytes[p++]; n |= (c & 0x7f) << s; s += 7; } while (c & 0x80); return n; };
    const str = () => { const n = varint(); const v = dec.decode(bytes.subarray(p, p + n)); p += n; return v; };

    function prim(t) {
      switch (t) {
        case 1: return !!u8();                                   // Boolean
        case 2: return u8();                                     // Byte
        case 3: { // Char（UTF-8）
          const b = bytes[p]; const len = b < 0x80 ? 1 : b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4;
          const v = dec.decode(bytes.subarray(p, p + len)); p += len; return v;
        }
        case 5: return str();                                    // Decimal
        case 6: { const v = dv.getFloat64(p, true); p += 8; return v; }
        case 7: { const v = dv.getInt16(p, true); p += 2; return v; }
        case 8: return i32();
        case 9: { const v = Number(dv.getBigInt64(p, true)); p += 8; return v; }
        case 10: { const v = dv.getInt8(p); p += 1; return v; }
        case 11: { const v = dv.getFloat32(p, true); p += 4; return v; }
        case 12: case 13: { const v = Number(dv.getBigInt64(p, true)); p += 8; return v; } // TimeSpan / DateTime（ticks）
        case 14: { const v = dv.getUint16(p, true); p += 2; return v; }
        case 15: { const v = dv.getUint32(p, true); p += 4; return v; }
        case 16: { const v = Number(dv.getBigUint64(p, true)); p += 8; return v; }
        case 17: return null;
        case 18: return str();
        default: throw new Error('未知的基本型別 ' + t + ' @' + p);
      }
    }

    function classInfo() {
      const id = i32(), name = str(), count = i32(), members = [];
      for (let k = 0; k < count; k++) members.push(str());
      return { id, name, members };
    }
    function memberTypes(count) {
      const kinds = []; for (let k = 0; k < count; k++) kinds.push(u8());
      const extra = kinds.map(kind => {
        if (kind === 0 || kind === 7) return u8();          // Primitive / PrimitiveArray
        if (kind === 3) return str();                       // SystemClass
        if (kind === 4) { const n = str(); i32(); return n; } // Class（型別名＋程式庫 id）
        return null;
      });
      return { kinds, extra };
    }

    const NULLS = Symbol('nulls');
    // 讀一筆紀錄；回傳值或 {ref}；ObjectNullMultiple 回傳 {[NULLS]: n}
    function record() {
      const t = u8();
      switch (t) {
        case 0: { rootId = i32(); i32(); i32(); i32(); return record(); }
        case 1: { const id = i32(), meta = classes.get(i32()); return readObject(id, meta); }
        case 2: { const ci = classInfo(); return readObject(ci.id, { ...ci, types: null }); }
        case 3: { const ci = classInfo(); i32(); return readObject(ci.id, { ...ci, types: null }); }
        case 4: { const ci = classInfo(); return readObject(ci.id, { ...ci, types: memberTypes(ci.members.length) }); }
        case 5: { const ci = classInfo(); const types = memberTypes(ci.members.length); i32(); return readObject(ci.id, { ...ci, types }); }
        case 6: { const id = i32(), v = str(); objects.set(id, v); return v; }
        case 7: return binaryArray();
        case 8: { const pt = u8(); return prim(pt); }
        case 9: return { ref: i32() };
        case 10: return null;
        case 11: return { end: true };
        case 12: { libraries.set(i32(), str()); return record(); }
        case 13: return { [NULLS]: u8() };
        case 14: return { [NULLS]: i32() };
        case 15: { const id = i32(), n = i32(), pt = u8(); const arr = [];
          if (pt === 2) { arr.push(...bytes.subarray(p, p + n)); p += n; }
          else for (let k = 0; k < n; k++) arr.push(prim(pt));
          arr.primitive = pt; objects.set(id, arr); return arr; }
        case 16: case 17: { const id = i32(), n = i32(); const arr = []; objects.set(id, arr); fillArray(arr, n, null); return arr; }
        default: throw new Error('未知的紀錄型別 ' + t + ' @' + (p - 1));
      }
    }
    function fillArray(arr, n, primType) {
      while (arr.length < n) {
        if (primType != null) { arr.push(prim(primType)); continue; }
        const v = record();
        if (v && v[NULLS]) for (let k = 0; k < v[NULLS]; k++) arr.push(null);
        else arr.push(v);
      }
    }
    function binaryArray() {
      const id = i32(), kind = u8(), rank = i32(); const lens = [];
      for (let k = 0; k < rank; k++) lens.push(i32());
      if (kind === 3 || kind === 4 || kind === 5) for (let k = 0; k < rank; k++) i32();
      const tkind = u8();
      let primType = null;
      if (tkind === 0 || tkind === 7) primType = u8(); else if (tkind === 3) str(); else if (tkind === 4) { str(); i32(); }
      const total = lens.reduce((a, b) => a * b, 1);
      const arr = []; objects.set(id, arr);
      fillArray(arr, total, tkind === 0 ? primType : null);
      return arr;
    }
    function readObject(id, meta) {
      classes.set(id, meta);
      const obj = { $class: meta.name, $id: id };
      objects.set(id, obj);
      meta.members.forEach((name, k) => {
        const kind = meta.types ? meta.types.kinds[k] : null;
        obj[name] = kind === 0 ? prim(meta.types.extra[k]) : record();
      });
      return obj;
    }

    while (p < bytes.length) { const v = record(); if (v && v.end) break; }
    // 解析參照
    const seen = new Set();
    function resolve(v) {
      if (v && typeof v === 'object' && 'ref' in v && Object.keys(v).length === 1) return resolve(objects.get(v.ref));
      if (!v || typeof v !== 'object' || seen.has(v)) return v;
      seen.add(v);
      if (Array.isArray(v)) { for (let k = 0; k < v.length; k++) v[k] = resolve(v[k]); return v; }
      for (const k of Object.keys(v)) if (!k.startsWith('$')) v[k] = resolve(v[k]);
      return v;
    }
    const root = resolve(objects.get(rootId));
    return { root, libraries };
  }

  global.parseNrbf = parseNrbf;
})(typeof window !== 'undefined' ? window : globalThis);
