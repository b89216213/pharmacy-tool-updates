(() => {
 'use strict';
 if(globalThis.PharmacyToolboxUI)return;
 const css=`
 :host{all:initial;color:#34383d;font:14px/1.5 "Microsoft JhengHei","Noto Sans TC",system-ui,sans-serif;color-scheme:light;--sage:#67916b;--blue:#5488a5;--clay:#c87f62;--ochre:#c59b50;--slate:#628095}
 *,*:before,*:after{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}button:disabled{cursor:wait;opacity:.65}[hidden]{display:none!important}
 button:focus-visible{outline:3px solid #5488a5;outline-offset:3px}button{touch-action:manipulation}
 .dock{background:#faf9f6;border:1px solid #d8d6d0;border-radius:18px;padding:6px;box-shadow:0 4px 18px #262c321c;width:max-content}
 .trigger{display:flex;align-items:center;justify-content:center;gap:10px;min-height:44px;padding:8px 15px;border:1px solid #d0d0cc;background:#fffefa;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 1px 3px #00000008}
 .trigger:hover,.trigger[aria-expanded=true]{background:#e9eaeb}.grid-icon{display:grid;grid-template-columns:repeat(2,9px);gap:3px;flex:none}.grid-icon i{width:9px;height:9px;border-radius:2.5px;background:var(--sage)}.grid-icon i:nth-child(2){background:var(--blue)}.grid-icon i:nth-child(3){background:var(--clay)}.grid-icon i:nth-child(4){background:var(--ochre)}
 .panel{position:fixed;right:18px;bottom:88px;width:420px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 110px);overflow:auto;overscroll-behavior:contain;border:1px solid #d3d1cb;border-radius:20px;background:#fffefa;box-shadow:0 9px 32px #252b3324;padding:18px}
 .header{display:flex;align-items:center;gap:10px;margin:0 0 15px}.header h2{margin:0;font-size:21px;letter-spacing:.03em;flex:1}.icon-button{border:0;background:transparent;border-radius:8px;width:32px;height:32px;font-size:24px;display:grid;place-items:center;line-height:1}.icon-button:hover{background:#ececea}
 .tool-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tool{display:flex;text-align:left;align-items:center;gap:10px;border:1px solid #e0ded9;border-radius:13px;background:#faf9f6;padding:12px;min-height:86px;transition:background .12s,border-color .12s}.tool:hover{background:#f0efeb;border-color:#b8b7b1}.tool-name{display:block;font-size:15px;font-weight:700;line-height:1.45;word-break:normal}.sub{display:block;font-size:11px;font-weight:400;color:#747873;margin-top:4px}
 .tool-icon{display:grid;place-items:center;border-radius:10px;width:40px;height:40px;flex:none;background:var(--sage);color:#fff;font-size:25px;font-weight:700}.tool-icon.ochre{background:var(--ochre)}.tool-icon.blue{background:var(--blue)}.tool-icon.clay{background:var(--clay)}.tool-icon.slate{background:var(--slate);font-size:15px}
 .advanced-link{display:flex;width:100%;align-items:center;gap:10px;padding:14px 4px 2px;margin-top:16px;border:0;border-top:1px solid #dddcd7;background:transparent;font-size:15px;font-weight:700}.chevron{font-size:25px;font-weight:400;margin-left:auto;line-height:1}.advance-card{width:100%;min-height:70px;background:transparent;border:0;padding:0 0 15px}.switch-row{padding:16px 0;border-top:1px solid #deddd7}.switch-head{display:flex;align-items:center;gap:12px;justify-content:space-between}.switch-head h3{margin:0;font-size:16px}.switch-desc{font-size:12px;line-height:1.6;color:#626761;margin:7px 0 0;max-width:300px}
 .switch{display:flex;align-items:center;justify-content:space-between;flex:none;width:76px;height:32px;border:1px solid #c8cacb;border-radius:18px;padding:3px 8px 3px 3px;background:#e4e5e5;font-size:12px;font-weight:700;gap:4px}.switch .thumb{width:24px;height:24px;border-radius:50%;background:white;box-shadow:0 1px 3px #0002}.switch[aria-checked=true]{background:#41464b;border-color:#41464b;color:white;flex-direction:row-reverse;padding:3px 3px 3px 8px}
 .shell-note{font-size:12px;color:#686c71;background:#f2f2ef;border-radius:8px;padding:9px 11px;margin:14px 0 0}.footer{border-top:1px solid #e5e3df;padding-top:12px;margin-top:14px;display:flex;gap:10px;align-items:center;justify-content:space-between}.settings{font-size:12px;border:0;background:transparent;padding:5px 0;text-decoration:underline;text-underline-offset:3px}.version{font-size:11px;color:#767a7e}.status{font-size:12px;margin:6px 0 0;color:#767a7e;line-height:1.5}.status[data-error=true]{color:#8c492c}.notice{font-size:13px;line-height:1.5;background:#f0eee6;border-radius:8px;padding:10px 12px;margin:12px 0 0;color:#4a4a43}
 :host([data-standalone]) .panel{position:relative;right:auto;bottom:auto!important;width:100%;max-width:none;max-height:none;box-shadow:0 3px 18px #252b3310;margin:0}
 :host([data-standalone]) .dock{display:none}
 @media(max-width:370px){.panel{padding:14px}.tool-grid{gap:8px}.tool{padding:10px;gap:8px}.tool-icon{width:32px;height:36px;font-size:23px}.tool-name{font-size:14px}.trigger{padding:8px 12px}.switch-desc{font-size:12px}}
 @media(prefers-reduced-motion:reduce){*{transition:none!important}}@media print{:host{display:none!important}}
 `;
 const mark='<span class="grid-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
 const mainTools=[['patient-query','選','sage','病人快速選擇'],['cart-labels-his','車','ochre','藥車標籤列印'],['patch-recovery','貼','blue','貼片回收紀錄'],['discharge-education','出','clay','出院藥衛教名單擷取']];
 function create(host,{request,managed,standalone=false}){
  const root=host.attachShadow({mode:'closed'});let opened=standalone,section='main',pending=false,disposed=false,refreshing=false,version='0.1.0',prefs={barcodeReturn:false,controlledInventory:false};
  if(standalone)host.setAttribute('data-standalone','');
  const style=document.createElement('style');style.textContent=css;root.append(style);
  const shell=document.createElement('div');shell.innerHTML=`<section class="panel" role="dialog" aria-label="藥局工具箱" ${opened?'':'hidden'}><div class="header"><button class="icon-button back" type="button" aria-label="返回主選單" hidden>←</button><h2>藥局工具箱</h2><button class="icon-button close" type="button" aria-label="關閉工具箱">×</button></div><div class="body"></div><p class="notice" role="status" aria-live="polite" hidden></p><div class="footer"><button class="settings" type="button">電腦登記／工具更新</button><span class="version"></span></div><p class="status" role="status">正在確認管理狀態…</p></section><div class="dock"><button class="trigger" type="button" aria-label="藥局工具箱" aria-expanded="${opened}" aria-haspopup="dialog">${mark}<span>工具箱</span></button></div>`;root.append(shell);
  const $=s=>root.querySelector(s),panel=$('.panel'),trigger=$('.trigger'),body=$('.body'),notice=$('.notice');
  const notify=text=>{notice.textContent=text;notice.hidden=!text;};
  const switchHtml=(key,title,description)=>`<section class="switch-row"><div class="switch-head"><h3>${title}</h3><button class="switch" type="button" role="switch" aria-label="${title}" aria-checked="${prefs[key]}" data-flag="${key}"><span class="thumb" aria-hidden="true"></span><span class="value">${prefs[key]?'ON':'OFF'}</span></button></div><p class="switch-desc">${description}</p></section>`;
  function render(){
   $('.header h2').textContent=section==='main'?'藥局工具箱':'進階工具';$('.back').hidden=section==='main';notify('');
   if(section==='main')body.innerHTML=`<div class="tool-grid">${mainTools.map(([id,mark,color,title])=>`<button class="tool" type="button" data-tool="${id}"><span class="tool-icon ${color}" aria-hidden="true">${mark}</span><span><span class="tool-name">${title}</span><span class="sub">尚未接入</span></span></button>`).join('')}</div><button class="advanced-link" type="button"><span aria-hidden="true">☷</span>進階工具<span class="chevron" aria-hidden="true">›</span></button>`;
   else body.innerHTML=`<button class="tool advance-card" type="button" data-tool="adc-drugs"><span class="tool-icon slate" aria-hidden="true">ADC</span><span><span class="tool-name">ADC 特殊藥品批次取歸藥</span><span class="sub">尚未接入</span></span><span class="chevron" aria-hidden="true">›</span></button>${switchHtml('barcodeReturn','刷條碼退藥','ON 時，開啟刷條碼退藥頁面會自動取代原頁面。')}${switchHtml('controlledInventory','Portal 管藥盤點','ON 時，開啟特殊藥品管理頁面會在右下角顯示按鈕。')}<p class="shell-note">目前為空殼版。開關預設 OFF；變更會保存，對應工具接入後才會生效。</p>`;
  }
  function updateSwitches(){for(const el of root.querySelectorAll('[data-flag]')){const on=prefs[el.dataset.flag];el.setAttribute('aria-checked',String(on));el.querySelector('.value').textContent=on?'ON':'OFF';}}
  async function refresh(){if(disposed||refreshing)return;refreshing=true;try{
   const data=await request('preferences');prefs=data.preferences;version=data.version;$('.version').textContent='v'+version+' · 空殼版';updateSwitches();
   try{const s=await managed('status');if(disposed)return;$('.status').textContent=(s.state==='allowed'?(s.deviceName+' · 已連線後台'):s.reason)+(s.updateAvailable?' · 有新版可更新':'');$('.status').dataset.error=String(s.state!=='allowed');}catch(e){$('.status').textContent=e.message;$('.status').dataset.error='true';}
  }catch(e){notify(e.message);}finally{refreshing=false;}}
  function open(){if(disposed)return;opened=true;panel.hidden=false;trigger.setAttribute('aria-expanded','true');void refresh();$('.close').focus();}
  function close(){if(standalone)return;opened=false;panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}
  trigger.addEventListener('click',()=>opened?close():open());$('.close').hidden=standalone;$('.close').addEventListener('click',close);
  $('.back').addEventListener('click',()=>{section='main';render();$('.advanced-link').focus();});
  $('.settings').addEventListener('click',async()=>{try{await request('manager');}catch(e){notify(e.message);}});
  body.addEventListener('click',async event=>{
   const button=event.target.closest('button');if(!button||pending)return;
   if(button.classList.contains('advanced-link')){section='advanced';render();$('.back').focus();return;}
   if(button.dataset.tool){try{const r=await request('launch',{id:button.dataset.tool});if(r.message)notify(r.message);}catch(e){notify(e.message);}return;}
   if(button.dataset.flag){pending=true;button.disabled=true;try{const r=await request('set-preference',{name:button.dataset.flag,value:!prefs[button.dataset.flag]});prefs=r.preferences;updateSwitches();notify('開關設定已儲存；此工具尚未接入，目前不會執行。');}catch(e){notify(e.message);}finally{pending=false;button.disabled=false;}}
  });
  const outside=e=>{if(opened&&!standalone&&!e.composedPath().includes(host))close();};
  const escape=e=>{if(opened&&e.key==='Escape'&&!standalone){e.stopPropagation();close();}};
  document.addEventListener('pointerdown',outside,true);root.addEventListener('keydown',escape);
  const timer=setInterval(()=>{if(opened&&!document.hidden)void refresh();},30000);
  render();if(standalone)void refresh();
  return {toggle(){opened?close():open();},refresh,anchor(bottom){panel.style.bottom=bottom+'px';panel.style.maxHeight='calc(100dvh - '+(bottom+18)+'px)';},dispose(){disposed=true;clearInterval(timer);document.removeEventListener('pointerdown',outside,true);host.remove();}};
 }
 globalThis.PharmacyToolboxUI=Object.freeze({create});
})();
