import {TOOL_ID,MAX_BYTES,compareVersion} from './update-core.js';
export const SOURCE=Object.freeze({repo:'b89216213/pharmacy-tool-updates',ref:'main',index:'updates/patch-recovery/latest.json'});
export async function githubFile(path,{fetcher=fetch,max=MAX_BYTES*2}={}){
  if(typeof path!=='string'||!/^updates\/patch-recovery\/[a-zA-Z0-9./_-]+\.json$/.test(path)||path.split('/').some(p=>p==='..'||p==='.'||!p))throw new Error('更新來源路徑無效');
  const url=`https://raw.githubusercontent.com/${SOURCE.repo}/${SOURCE.ref}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const headers={Accept:'application/json'};
  let response;
  try{response=await fetcher(url,{headers,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(25000)});}catch{throw new Error('無法連線 GitHub，請確認院內網路可存取 raw.githubusercontent.com。現有工具仍可照常使用。');}
  if(response.status===401)throw new Error('公開更新來源無法讀取，請聯絡工具維護者確認發布設定。');
  if(response.status===404)throw new Error('尚未取得更新檔，請稍後重試或聯絡工具維護者確認新版已發布。');
  if(response.status===403||response.status===429)throw new Error('GitHub 暫時限制連線，請稍後再試。現有工具仍可照常使用。');
  if(!response.ok)throw new Error('GitHub 讀取失敗（'+response.status+'），請稍後再試。');
  if(Number(response.headers.get('content-length'))>max)throw new Error('更新檔過大');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new Error('更新檔過大');chunks.push(value);}}finally{await reader.cancel();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
export function parseIndex(bytes){
  const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(value.toolId!==TOOL_ID||value.format!=='patch-recovery-release-v1'||!/^updates\/patch-recovery\/packages\/[\d.]+\.json$/.test(value.packagePath)||! /^(?:[a-f0-9]{64})$/.test(value.sha256)||!Number.isSafeInteger(value.size)||value.size<1||value.size>MAX_BYTES*2)throw new Error('更新公告格式無效');
  compareVersion(value.version,value.version);if(value.packagePath!==`updates/patch-recovery/packages/${value.version}.json`)throw new Error('更新公告版本與檔名不一致');
  return {...value,notes:String(value.notes||'').slice(0,4000)};
}
