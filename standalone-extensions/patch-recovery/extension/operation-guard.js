// Only suppress the hospital's known empty-query alert while this tool queries.
(() => {
  const KEY='__patchRecoveryQueryV1';
  if(window.__patchRecoveryQueryGuardV1){window.__patchRecoveryQueryGuardV1.ensure();return;}
  let previous,wrapper,timer;
  const read=()=>{try{const s=JSON.parse(sessionStorage.getItem(KEY)||'null');return s&&s.expires>Date.now()?s:null;}catch{return null;}};
  const restore=()=>{clearTimeout(timer);if(wrapper&&window.alert===wrapper)window.alert=previous;wrapper=null;};
  function ensure(){
    const s=read();if(!s){restore();return;}
    if(!wrapper||window.alert!==wrapper){previous=window.alert;wrapper=function(message){const active=read(),text=String(message??'').normalize('NFKC').replace(/\s+/g,'');if(active&&/^(?:查無(?:病人)?資料|查無病人|沒有病人資料|無病人資料|沒有資料|無資料)[。!！]?$/.test(text)){active.empty=true;sessionStorage.setItem(KEY,JSON.stringify(active));return;}return previous.call(window,message);};window.alert=wrapper;}
    clearTimeout(timer);timer=setTimeout(restore,Math.max(1,s.expires-Date.now()+20));
  }
  window.__patchRecoveryQueryGuardV1={read,ensure,arm(token,kind){
    if(kind!=='query')throw new Error('僅支援名單查詢。');
    if(window.__patientPickerGuardV2?.read?.()||window.__medSettlementGuardV1?.read?.())throw new Error('其他院內工具正在處理，請等待完成後再查詢。');
    const old=read();if(old&&old.token!==token)throw new Error('另一個貼片查詢仍在處理中。');
    sessionStorage.setItem(KEY,JSON.stringify({token,kind,empty:false,expires:Date.now()+60000}));ensure();
  },clear(token){if(!read()||read().token===token){sessionStorage.removeItem(KEY);restore();}}};
  ensure();
})();
