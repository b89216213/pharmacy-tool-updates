export const PREFERENCES_KEY='pharmacyToolboxPreferencesV1';
export const FLAGS=Object.freeze(['barcodeReturn','controlledInventory']);
export const TOOLS=Object.freeze([
 {id:'patient-query',title:'病人快速選擇',mark:'選',color:'sage',section:'main',ready:false},
 {id:'cart-labels-his',title:'藥車標籤列印',mark:'車',color:'ochre',section:'main',ready:false},
 {id:'patch-recovery',title:'貼片回收紀錄',mark:'貼',color:'blue',section:'main',ready:false},
 {id:'discharge-education',title:'出院藥衛教名單擷取',mark:'出',color:'clay',section:'main',ready:false},
 {id:'adc-drugs',title:'ADC 特殊藥品批次取歸藥',mark:'ADC',color:'slate',section:'advanced',ready:false}
]);
export function preferences(raw){return {schema:1,barcodeReturn:raw?.barcodeReturn===true,controlledInventory:raw?.controlledInventory===true};}
export function setPreference(raw,name,value){if(!FLAGS.includes(name)||typeof value!=='boolean')throw Error('開關設定不正確');return {...preferences(raw),[name]:value};}
export function supportedUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&['portal.ntuh.gov.tw','ihisaw.ntuh.gov.tw'].includes(u.hostname);}catch{return false;}}
export function ownSender(sender,base,id){return sender?.id===id&&typeof sender.url==='string'&&sender.url.startsWith(base);}
export function allowedSender(sender,base,id){return ownSender(sender,base,id)||(sender?.id===id&&sender.frameId===0&&Number.isInteger(sender.tab?.id)&&supportedUrl(sender.url));}
// Each future module has its own window. Callers can only select catalog IDs.
// Real module routes must be added together with their management/operation guards.
export function moduleFor(id){const tool=TOOLS.find(t=>t.id===id);if(!tool)throw Error('未知的工具');return tool;}
