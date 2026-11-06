import {managedRequest} from './managed-client.js';
const request=async(action,extra={})=>{const r=await chrome.runtime.sendMessage({kind:'pharmacy-toolbox',action,...extra});if(!r?.ok)throw Error(r?.error||'工具箱沒有回應');return r.data;};
PharmacyToolboxUI.create(document.getElementById('toolbox'),{request,managed:managedRequest,standalone:true});
