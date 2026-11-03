// Active only during a picker query or settlement. No patient identifiers are stored.
(() => {
  const KEY='__patientPickerOperationV2';
  if(window.__patientPickerGuardV2){window.__patientPickerGuardV2.ensure();return;}
  const norm=s=>String(s??'').normalize('NFKC').replace(/\s+/g,'');
  const empty=s=>/^(?:查無(?:病人)?資料|查無病人|沒有病人資料|無病人資料|沒有資料|無資料)[。!！]?$/.test(norm(s));
  const read=()=>{try{const s=JSON.parse(sessionStorage.getItem(KEY)||'null');if(s&&Date.now()<s.expires)return s;sessionStorage.removeItem(KEY);}catch{}return null;};
  const write=s=>{sessionStorage.setItem(KEY,JSON.stringify(s));return s;};
  let generation=0,installed=null,depth=0,timer;
  const restore=()=>{generation++;if(installed){for(const [obj,key,value,previous] of installed.parts)if(obj[key]===value)obj[key]=previous;document.removeEventListener('submit',installed.listener,true);installed=null;}clearTimeout(timer);};
  const block=(s,message)=>{s.blocked=true;s.message=String(message||'原系統出現警示，請確認。');write(s);return false;};
  function ensure(){
    const active=read();if(!active){restore();return;}
    if(installed&&installed.parts.every(([o,k,v])=>o[k]===v)){clearTimeout(timer);timer=setTimeout(()=>{if(!read())restore();},Math.max(1,active.expires-Date.now()+20));return;}
    if(installed)document.removeEventListener('submit',installed.listener,true);
    const gen=++generation,parts=[],original={alert:window.alert,confirm:window.confirm,prompt:window.prompt};
    const current=()=>gen===generation?read():null;
    function permit(id){
      const s=current();if(!s||s.kind!=='settlement')return true;
      if(s.blocked)return false;if(s.phase!=='sending'||depth)return true;
      if(!s.confirmed||s.submitted)return block(s,'結清尚未確認或已送出，已阻止重複送出。');
      if(id&&id.replace(/\$/g,'_')!==s.buttonId)return block(s,'結清期間出現其他表單操作，已停止此筆。');
      s.submitted=true;write(s);return true;
    }
    const wrap=(obj,key,value)=>{const previous=obj[key];obj[key]=value;parts.push([obj,key,value,previous]);};
    wrap(window,'alert',function(message){const s=current();if(s?.kind==='query'&&empty(message)){s.empty=true;write(s);return;}if(s?.kind==='settlement'){block(s,message);return;}return original.alert.call(window,message);});
    wrap(window,'confirm',function(message){const s=current();if(s?.kind!=='settlement')return original.confirm.call(window,message);if(s.phase==='sending'&&!s.blocked&&!s.confirmed&&Date.now()<s.confirmUntil&&norm(message)==='確定執行藥品結清?'){s.confirmed=true;write(s);return true;}return block(s,'原系統要求非預期確認，已停止此筆。');});
    wrap(window,'prompt',function(message,value){const s=current();if(s?.kind==='settlement'){block(s,message);return null;}return original.prompt.call(window,message,value);});
    const listener=e=>{if(!permit(e.submitter?.id)){e.preventDefault();e.stopImmediatePropagation();}};
    document.addEventListener('submit',listener,true);
    if(window.HTMLFormElement){
      const proto=HTMLFormElement.prototype,submit=proto.submit;
      wrap(proto,'submit',function(){if(!permit())return;depth++;try{return submit.call(this);}finally{depth--;}});
      if(proto.requestSubmit){const request=proto.requestSubmit;wrap(proto,'requestSubmit',function(button){if(current()?.blocked)return;return request.call(this,button);});}
    }
    if(typeof window.__doPostBack==='function'){const postback=window.__doPostBack;wrap(window,'__doPostBack',function(target,arg){if(!permit(target))return;depth++;try{return postback.call(this,target,arg);}finally{depth--;}});}
    installed={parts,listener};clearTimeout(timer);timer=setTimeout(()=>{if(!read())restore();},Math.max(1,active.expires-Date.now()+20));
  }
  window.__patientPickerGuardV2={read,ensure,
    arm(token,kind){const prior=read();if(prior?.kind==='settlement'&&prior.token!==token)throw new Error('另一筆結清仍在處理中。');const other=window.__medSettlementGuardV1?.read?.();if(other)throw new Error('另一個結清工具仍在處理，請等待完成。');write({token,kind,phase:'preparing',expires:Date.now()+60000,empty:false,blocked:false,confirmed:false,submitted:false});ensure();},
    sending(token,buttonId){const s=read();if(!s||s.token!==token||s.kind!=='settlement'||s.blocked||s.phase!=='preparing')throw new Error('此筆結清已失效或已送出。');s.phase='sending';s.buttonId=buttonId;s.confirmUntil=Date.now()+2500;write(s);ensure();},
    clear(token){const s=read();if(!s||s.token===token){sessionStorage.removeItem(KEY);restore();}},
    block(token){const s=read();if(s?.token===token)block(s,'此筆操作已停止。');}
  };
  ensure();
})();
