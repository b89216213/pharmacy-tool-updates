import{compareVersion}from'./update-core.js';
export const MANAGEMENT_KEY='patchManagementV1',TOOL_ID='ntuh-patch-recovery',MANAGEMENT_URL='https://pharmacy-device-console.cx760.chatgpt.site';
export function validateManagementReply(value,now=Date.now()){
 if(!value||value.toolId!==TOOL_ID||typeof value.deviceId!=='string'||!/^[0-9a-f-]{36}$/i.test(value.deviceId)||typeof value.deviceName!=='string'||!value.deviceName.trim()||value.deviceName.length>60)throw Error('管理後台回覆格式不正確');
 const p=value.policy;if(!p||typeof p.revision!=='string'||!/^\d+\.\d+$/.test(p.revision)||!Array.isArray(p.rules)||p.rules.length!==2||!Number.isSafeInteger(p.serverTime)||!Number.isSafeInteger(p.validUntil)||p.validUntil<=p.serverTime||p.validUntil-p.serverTime>86400000)throw Error('管理政策格式不正確');
 const scopes=['tool:'+TOOL_ID,'device:'+value.deviceId];
 for(let i=0;i<2;i++){const r=p.rules[i];if(r.scope!==scopes[i]||typeof r.disabled!=='boolean'||!Number.isSafeInteger(r.effectiveAt)||r.effectiveAt<0||!Number.isSafeInteger(r.revision)||r.revision<0||typeof r.reason!=='string'||r.reason.length>240)throw Error('管理政策格式不正確');compareVersion(r.minimumVersion,'0');}
 if(p.rules.map(r=>r.revision).join('.')!==p.revision)throw Error('管理政策版本不一致');
 return {deviceId:value.deviceId,deviceName:value.deviceName,policy:p,receivedAt:now,expiresAt:now+(p.validUntil-p.serverTime)};
}
export function managementState(record,version,now=Date.now()){
 if(!record?.registered)return {state:'registration',reason:'請先登記這台電腦的名稱，並輸入管理員提供的一次性登記碼。'};
 const p=record.policy;if(!p)return {state:'offline',reason:'請連線至管理後台完成驗證。'};
 const serverNow=p.serverTime+Math.max(0,now-record.receivedAt),active=p.rules.filter(r=>r.effectiveAt<=serverNow);
 const disabled=active.find(r=>r.disabled);if(disabled)return{state:'disabled',reason:disabled.reason||'管理員已暫停這台電腦使用工具。'};
 const update=active.filter(r=>compareVersion(version,r.minimumVersion)<0).sort((a,b)=>compareVersion(b.minimumVersion,a.minimumVersion))[0];if(update)return{state:'upgrade',reason:update.reason||'請更新後繼續使用。',minimumVersion:update.minimumVersion};
 if(!Number.isSafeInteger(record.expiresAt)||now>=record.expiresAt||now<record.receivedAt-60000)return{state:'offline',reason:'已超過 24 小時未完成管理驗證，請重新連線。原有資料仍保留。'};
 return {state:'allowed',reason:''};
}
