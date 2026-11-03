const DB='adc-drugs-updater-v1';
let opened;
function db(){return opened??=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('local');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function updateStore(action,key,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('local',action==='get'?'readonly':'readwrite'),store=tx.objectStore('local'),r=action==='get'?store.get(key):action==='delete'?store.delete(key):store.put(value,key);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('更新資料無法保存'));});}

