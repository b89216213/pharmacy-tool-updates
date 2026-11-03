export async function managedRequest(action,extra={}){let result;try{result=await chrome.runtime.sendMessage({kind:'managed-tool',action,...extra});}catch{throw Error('工具連線已變更，請重新開啟工具並重新整理 Portal。');}if(!result?.ok)throw Error(result?.error||'管理驗證未完成');return result.data;}
export const managedStatus=()=>managedRequest('status');
export const openManagement=()=>managedRequest('open');
export async function managedOperation(operation){const {token}=await managedRequest('acquire');try{return await operation();}finally{await managedRequest('release',{token});}}
