// Only source files pass through this module. Patient storage is never exported.
export const TOOL_ID='ntuh-barcode-return';
export const MAX_BYTES=6*1024*1024;
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
export async function sha256(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function compareVersion(a,b){
  const parse=v=>{if(typeof v!=='string'||!/^\d{1,5}(\.\d{1,5}){0,3}$/.test(v)||v.split('.').some(x=>Number(x)>65535))throw new Error('版本號格式不正確');return v.split('.').map(Number);};
  const x=parse(a),y=parse(b);for(let i=0;i<4;i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}return 0;
}
export function validPath(path){
  if(typeof path!=='string'||path.length>180||!path.split('/').every(p=>/^[a-z0-9][a-z0-9._-]*$/i.test(p)&&p!=='.'&&p!=='..'&&!p.endsWith('.')&&!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))||! /\.(js|css|html|json|png|svg|jpg|woff2|txt)$/i.test(path))throw new Error('更新包含不允許的檔案路徑');return path;
}
function checkAccess(next,current){
  for(const key of ['permissions','host_permissions','optional_permissions','optional_host_permissions']){
    if((next[key]||[]).some(p=>!(current[key]||[]).includes(p)))throw new Error('新版需要額外權限，請改用手動安裝。');
  }
  for(const key of ['key','content_security_policy','externally_connectable'])if(JSON.stringify(next[key]??null)!==JSON.stringify(current[key]??null))throw new Error('新版變更識別或安全設定，請改用手動安裝。');
  if(next.manifest_version!==3||next.name!==current.name)throw new Error('更新檔不屬於刷條碼退藥工具');
  for(const script of next.content_scripts||[]){for(const match of script.matches||[])if(!(current.content_scripts||[]).some(s=>(s.matches||[]).includes(match)))throw new Error('新版增加網頁存取範圍，請改用手動安裝。');}
  const match=globalThis.navigator?.userAgent?.match(/(?:Chrome|Chromium)\/(\d+(?:\.\d+){0,3})/);
  if(match&&next.minimum_chrome_version&&compareVersion(next.minimum_chrome_version,match[1])>0)throw new Error('請先更新 Chrome，再更新工具。');
}
export async function validatePackage(pkg,current,{allowSame=false}={}){
  if(!pkg||pkg.format!=='barcode-return-update-v1'||pkg.toolId!==TOOL_ID||!Array.isArray(pkg.files)||pkg.files.length<3||pkg.files.length>80)throw new Error('不是有效的刷條碼退藥更新檔');
  const cmp=compareVersion(pkg.version,current.version);if(cmp<0||(!allowSame&&cmp===0))throw new Error('更新版本必須高於目前版本');
  const seen=new Set(),files=[];let total=0;
  for(const f of pkg.files){
    validPath(f.path);const key=f.path.toLowerCase();if(seen.has(key))throw new Error('更新包含重複路徑');seen.add(key);
    if(typeof f.base64!=='string'||f.base64.length>MAX_BYTES*1.4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(f.base64))throw new Error('更新檔案編碼錯誤');
    const bytes=Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0));total+=bytes.length;
    if(total>MAX_BYTES||bytes.length!==f.size||await sha256(bytes)!==f.sha256)throw new Error('更新檔案不完整或驗證失敗');files.push({path:f.path,bytes});
  }
  for(const p of seen)for(const q of seen)if(q!==p&&q.startsWith(p+'/'))throw new Error('檔案與資料夾路徑衝突');
  const get=path=>files.find(f=>f.path===path);
  if(!get('manifest.json')||!get('tool-marker.json')||!get('manager.html'))throw new Error('更新缺少必要檔案');
  const next=JSON.parse(decoder.decode(get('manifest.json').bytes)),marker=JSON.parse(decoder.decode(get('tool-marker.json').bytes));
  if(next.version!==pkg.version||marker.toolId!==TOOL_ID)throw new Error('更新版本或工具識別不一致');checkAccess(next,current);
  for(const p of [next.background?.service_worker,...(next.content_scripts||[]).flatMap(s=>s.js||[])].filter(Boolean))if(!get(p))throw new Error('更新缺少必要程式檔');
  return {version:pkg.version,notes:String(pkg.notes||'').slice(0,4000),files};
}
async function parent(dir,path,create){const parts=validPath(path).split('/');for(const p of parts.slice(0,-1))dir=await dir.getDirectoryHandle(p,{create});return {dir,name:parts.at(-1)};}
export async function readFile(dir,path){const p=await parent(dir,path,false);return new Uint8Array(await (await (await p.dir.getFileHandle(p.name)).getFile()).arrayBuffer());}
export async function writeFile(dir,path,bytes){const p=await parent(dir,path,true),handle=await p.dir.getFileHandle(p.name,{create:true}),writer=await handle.createWritable();try{await writer.write(bytes);await writer.close();}catch(e){try{await writer.abort();}catch{}throw e;}}
export async function removeFile(dir,path){try{const p=await parent(dir,path,false);await p.dir.removeEntry(p.name);}catch(e){if(e.name!=='NotFoundError')throw e;}}
export async function verifyDirectory(dir,current,readInstalled){
  const manifest=JSON.parse(decoder.decode(await readFile(dir,'manifest.json')));
  if(manifest.name!==current.name||manifest.version!==current.version)throw new Error('請選擇目前使用的小工具安裝資料夾，或解壓縮後的最外層資料夾。');
  // A matching manifest alone cannot distinguish an installed directory from a copy.
  const file='tool-folder-proof-'+crypto.randomUUID()+'.txt',proof=encoder.encode(crypto.randomUUID());
  try{await writeFile(dir,file,proof);const installed=await readInstalled(file);if(await sha256(installed)!==await sha256(proof))throw new Error('資料夾不是目前載入的工具位置');}
  catch(e){throw new Error('無法確認這是目前載入的工具資料夾，或 Chrome 不允許寫入。請選擇原本在 Chrome 載入的小工具安裝資料夾。');}
  finally{await removeFile(dir,file);}
}
export async function restoreFiles(dir,journal,onProgress=()=>{}){
  const failures=[];
  // Restore the manifest last. It is the version commit marker.
  const originals=[...journal.originals].sort((a,b)=>(a.path==='manifest.json')-(b.path==='manifest.json'));
  for(const f of originals){try{if(f.bytes===null)await removeFile(dir,f.path);else{await writeFile(dir,f.path,f.bytes);if(await sha256(await readFile(dir,f.path))!==await sha256(f.bytes))throw new Error('還原驗證失敗');}}catch{failures.push(f.path);}onProgress('正在還原原版檔案…');}
  if(failures.length)throw new Error('部分原版檔案無法還原，請用原版 ZIP 覆蓋相同資料夾後重新載入。作業資料仍留在 Chrome。');
}
export async function applyPackage(dir,validated,{saveJournal,clearJournal,onProgress=()=>{}}){
  const files=[...validated.files].sort((a,b)=>(a.path==='manifest.json')-(b.path==='manifest.json'));
  const originals=[];
  for(const f of files){let bytes=null;try{bytes=await readFile(dir,f.path);}catch(e){if(e.name!=='NotFoundError')throw e;}originals.push({path:f.path,bytes});}
  const journal={version:validated.version,phase:'writing',originals,createdAt:new Date().toISOString()};
  // Persist all originals before the first mutation so failure never loses the backup.
  await saveJournal(journal);
  try{
    for(let i=0;i<files.length;i++){const f=files[i];onProgress(`正在更新 ${i+1}／${files.length}…`);await writeFile(dir,f.path,f.bytes);if(await sha256(await readFile(dir,f.path))!==await sha256(f.bytes))throw new Error('寫入後檔案驗證失敗');}
    journal.phase='written';await saveJournal(journal);return journal;
  }catch(e){
    try{await restoreFiles(dir,journal,onProgress);await clearJournal();}catch(recovery){throw recovery;}
    throw new Error('更新未完成，已還原原版檔案。'+(e.name==='NotAllowedError'?'請重新授權資料夾後再試。':'請稍後再試。'));
  }
}

