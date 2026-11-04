(async () => {
  const KEY = '__medicationOverlayV2';
  if (globalThis[KEY]?.host.isConnected) {
    globalThis[KEY].show();
    return {mode:'overlay'};
  }
  const PLACEMENT_KEY = 'medication-window-placement-v1';
  let savedPlacement = null;
  try {
    const saved = (await chrome.storage.local.get(PLACEMENT_KEY))[PLACEMENT_KEY];
    if (saved && ['x','y','w','h'].every(k => Number.isFinite(saved[k])) && saved.w > 0 && saved.h > 0) {
      savedPlacement = {x:saved.x,y:saved.y,w:saved.w,h:saved.h};
    }
  } catch {}
  if (globalThis[KEY]?.host.isConnected) { globalThis[KEY].show(); return {mode:'overlay'}; }
  const host = document.createElement('div');
  host.setAttribute('data-medication-tool', 'embedded');
  // A closed shadow root prevents host styles from changing the panel controls.
  const shadow = host.attachShadow({ mode: 'closed' });
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0 auto auto 0!important;width:0!important;height:0!important;z-index:2147483647!important;display:block!important;';
  const style = new CSSStyleSheet();
  style.replaceSync(`
    :host{font-family:Arial,"Microsoft JhengHei",sans-serif;color-scheme:dark}
    *{box-sizing:border-box}
    .panel{position:fixed;display:flex;flex-direction:column;overflow:hidden;border:1px solid #5198ad;border-radius:12px;background:#082333;box-shadow:0 16px 65px #0006;font:14px Arial,"Microsoft JhengHei",sans-serif;color:#e9f9ff;isolation:isolate}
    .bar{height:44px;min-height:44px;display:flex;align-items:center;gap:8px;padding:0 8px 0 14px;background:#082333;border-bottom:1px solid #345565;cursor:move;touch-action:none;user-select:none}
    .title{flex:1;min-width:0;font-weight:600;color:#a7edff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    button{width:32px;height:30px;padding:0;border:1px solid #456574;border-radius:6px;background:transparent;color:#c9f5ff;font:18px Arial;cursor:pointer}
    button:hover,button:focus-visible{background:#194354;outline:2px solid #66d5f1;outline-offset:1px}
    .status{padding:8px 12px;background:#443917;color:#fff0bb;font-size:12px;line-height:1.5}
    .status[hidden],.panel.minimized .status{display:none}
    iframe{display:block;flex:1;min-height:0;width:100%;border:0;background:#051923}
    .resize{position:absolute;z-index:5;touch-action:none;user-select:none}
    .resize-n,.resize-s{left:16px;right:16px;height:7px;cursor:ns-resize}
    .resize-n{top:0}.resize-s{bottom:0}
    .resize-e,.resize-w{top:16px;bottom:16px;width:7px;cursor:ew-resize}
    .resize-e{right:0}.resize-w{left:0}
    .resize-ne,.resize-nw,.resize-se,.resize-sw{width:16px;height:16px;z-index:6}
    .resize-ne{top:0;right:0;cursor:nesw-resize}.resize-nw{top:0;left:0;cursor:nwse-resize}
    .resize-se{bottom:0;right:0;cursor:nwse-resize;background:linear-gradient(135deg,transparent 50%,#5dcced 52%,#5dcced 59%,transparent 61%,transparent 69%,#5dcced 71%,#5dcced 78%,transparent 80%)}
    .resize-sw{bottom:0;left:0;cursor:nesw-resize}
    .resize:focus-visible{outline:2px solid #66d5f1;outline-offset:-3px}
    .panel.interacting iframe{pointer-events:none}
    .panel.minimized iframe,.panel.minimized .resize{display:none}
  `);
  shadow.adoptedStyleSheets = [style];
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '雲端藥歷整理器');
  const bar = document.createElement('div');bar.className = 'bar';
  const title = document.createElement('span');title.className = 'title';title.textContent = '雲端藥歷整理器';
  const badge=document.createElementNS('http://www.w3.org/2000/svg','svg');badge.setAttribute('viewBox','0 0 128 128');badge.setAttribute('width','24');badge.setAttribute('height','24');badge.setAttribute('aria-hidden','true');badge.style.flex='0 0 24px';badge.innerHTML="<rect x=\"2\" y=\"2\" width=\"124\" height=\"124\" rx=\"26\" fill=\"#187594\"/><path fill=\"#fff\" d=\"M32.181000000000004 67.29H96.19500000000001V76.22000000000001H32.181000000000004ZM20.995000000000005 79.322H107.00500000000001V88.62800000000001H20.995000000000005ZM73.35300000000001 90.132 83.881 85.71400000000001Q87.077 88.06400000000001 90.78999999999999 91.025Q94.503 93.986 97.981 96.9Q101.459 99.81400000000001 103.809 102.25800000000001L92.435 107.24000000000001Q90.555 104.89000000000001 87.31200000000001 101.882Q84.069 98.87400000000001 80.356 95.81900000000002Q76.643 92.76400000000001 73.35300000000001 90.132ZM33.215 106.30000000000001Q32.839 105.078 32.181 103.01Q31.523000000000003 100.94200000000001 30.771000000000004 98.686Q30.019000000000005 96.43 29.267000000000003 94.926Q30.677000000000003 94.644 32.087 93.89200000000001Q33.497 93.14000000000001 35.095 92.10600000000001Q36.223 91.35400000000001 38.573 89.75600000000001Q40.923 88.15800000000002 43.55500000000001 85.85500000000002Q46.187000000000005 83.552 48.443 80.92000000000002L61.321000000000005 84.962Q56.527 89.474 50.746 93.798Q44.965 98.12200000000001 39.795 100.66000000000001V100.84800000000001Q39.795 100.84800000000001 38.761 101.412Q37.727000000000004 101.97600000000001 36.458000000000006 102.775Q35.18900000000001 103.57400000000001 34.202000000000005 104.561Q33.215 105.548 33.215 106.30000000000001ZM33.215 106.30000000000001 33.121 98.498 39.795 95.02000000000001 91.025 93.986Q91.21300000000001 96.14800000000001 91.73 98.82700000000001Q92.247 101.50600000000001 92.717 103.19800000000001Q80.403 103.57400000000001 71.47300000000001 103.90300000000002Q62.543000000000006 104.23200000000001 56.339000000000006 104.42000000000002Q50.135000000000005 104.608 46.14 104.796Q42.145 104.98400000000001 39.70100000000001 105.17200000000001Q37.257000000000005 105.36000000000001 35.753 105.64200000000001Q34.249 105.924 33.215 106.30000000000001ZM28.797000000000004 20.760000000000005H98.827V29.50200000000001H28.797000000000004ZM57.655 24.426000000000002H69.781V64.18800000000002H57.655ZM22.123000000000005 32.040000000000006H105.971V52.156000000000006H94.503V39.748000000000005H33.121V52.156000000000006H22.123000000000005ZM29.737000000000002 57.79600000000001Q34.625 56.76200000000001 41.393 54.83500000000001Q48.161 52.90800000000001 55.211000000000006 50.934000000000005L56.527 58.92400000000001Q50.605000000000004 61.18000000000001 44.730000000000004 63.43600000000001Q38.855000000000004 65.69200000000001 33.59100000000001 67.572ZM33.873000000000005 45.85800000000001 38.197 39.184000000000005Q41.111000000000004 39.842000000000006 44.44800000000001 40.923Q47.785000000000004 42.004000000000005 50.934000000000005 43.132000000000005Q54.083000000000006 44.260000000000005 56.245000000000005 45.20000000000001L51.827000000000005 52.626000000000005Q49.759 51.592000000000006 46.657000000000004 50.370000000000005Q43.55500000000001 49.14800000000001 40.218 47.92600000000001Q36.881 46.70400000000001 33.873000000000005 45.85800000000001ZM89.239 39.37200000000001 94.59700000000001 46.89200000000001Q91.683 48.11400000000001 88.15800000000002 49.28900000000001Q84.63300000000001 50.464000000000006 81.202 51.357000000000006Q77.771 52.25000000000001 74.951 52.90800000000001L70.62700000000001 46.14000000000001Q73.35300000000001 45.482000000000006 76.73700000000001 44.307Q80.12100000000001 43.132000000000005 83.458 41.816Q86.795 40.50000000000001 89.239 39.37200000000001ZM70.909 58.45400000000001 74.575 51.028000000000006Q78.053 51.96800000000001 82.424 53.33100000000001Q86.795 54.69400000000001 90.837 56.10400000000001Q94.879 57.51400000000001 97.51100000000001 58.64200000000001L93.93900000000001 67.102Q91.401 65.88000000000001 87.406 64.28200000000001Q83.411 62.684000000000005 79.04 61.13300000000001Q74.66900000000001 59.58200000000001 70.909 58.45400000000001Z\"/>";
  bar.append(badge,title);
  const button = (label, glyph, callback) => {
    const el = document.createElement('button');
    el.type = 'button'; el.title = label; el.setAttribute('aria-label', label);
    el.textContent = glyph; el.addEventListener('click', callback); bar.append(el);return el;
  };
  let minimized = false, maximized = false, dragging = null;
  // This rectangle always describes the normal window, never the bottom-right dock.
  let rect = savedPlacement || { x: Math.max(8, innerWidth - 996), y: 16, w: Math.min(980, innerWidth - 16), h: Math.min(720, innerHeight - 32) };
  let displayed = {...rect};
  const status = document.createElement('div');
  status.className = 'status';status.hidden = true;status.setAttribute('role','status');
  let contextInvalidated = false;
  const savePlacement = async () => {
    if (contextInvalidated) return;
    // The API can throw before returning a Promise after an extension reload.
    try {
      await chrome.storage.local.set({[PLACEMENT_KEY]: {...rect}});
      status.hidden = true;
    } catch (error) {
      contextInvalidated = /extension context invalidated/i.test(String(error?.message || error));
      status.textContent = contextInvalidated
        ? '擴充功能已更新或停用，設定暫時無法儲存。請先複製需要的內容，再重新整理網頁並點「雲」。'
        : '視窗位置暫時無法儲存；仍可繼續操作。';
      status.hidden = false;
    }
  };
  const fit = () => {
    const maxW = Math.max(1, innerWidth - 16), maxH = Math.max(44, innerHeight - 16);
    if (minimized) {
      displayed = {x:Math.max(8,innerWidth-Math.min(340,maxW)-8),y:Math.max(8,innerHeight-52),w:Math.min(340,maxW),h:44};
    } else if (maximized) {
      displayed = {x:8,y:8,w:maxW,h:maxH};
    } else {
      rect.w = Math.max(Math.min(360,maxW),Math.min(rect.w,maxW));
      rect.h = Math.max(Math.min(240,maxH),Math.min(rect.h,maxH));
      rect.x = Math.max(8,Math.min(rect.x,innerWidth-rect.w-8));
      rect.y = Math.max(8,Math.min(rect.y,innerHeight-rect.h-8));
      displayed = {...rect};
    }
    Object.assign(panel.style,{left:displayed.x+'px',top:displayed.y+'px',width:displayed.w+'px',height:displayed.h+'px'});
    panel.classList.toggle('minimized',minimized);
    bar.title=minimized?'連點兩下還原視窗':'拖曳移動視窗';
    minimize.textContent = minimized ? '+' : '−';
    minimize.title = minimized ? '還原縮小前的大小' : '縮小至右下角（保留內容）';
    minimize.setAttribute('aria-label',minimize.title);
    maximize.title = minimized ? '還原縮小前的大小' : maximized ? '還原大小' : '放大至頁面內';
    maximize.setAttribute('aria-label',maximize.title);
  };
  const minimize = button('縮小至右下角（保留內容）','−',() => {
    if (minimized) { show(); return; }
    savePlacement(); minimized=true; maximized=false; fit();
  });
  const maximize = button('放大至頁面內','□',() => {
    // Restoring from the dock is a complete first action; do not also maximize.
    if (minimized) { show(); return; }
    maximized=!maximized; fit(); savePlacement();
  });
  button('關閉並清除本次內容','×',() => {
    savePlacement();
    window.removeEventListener('resize',fit);
    host.remove();delete globalThis[KEY];
  });
  const iframe = document.createElement('iframe');
  iframe.title = '雲端藥歷整理器工作區';
  iframe.allow = 'clipboard-write';
  try {
    iframe.src = chrome.runtime.getURL('app.html');
  } catch {
    // Let the background's existing fallback handle a reload during startup.
    return {mode:'unavailable'};
  }
  // Resize only the grabbed edges; the opposite edges remain anchored.
  function resizeRect(base, direction, dx, dy) {
    const minW=Math.min(360,Math.max(1,innerWidth-16));
    const minH=Math.min(240,Math.max(44,innerHeight-16));
    const clamp=(v,low,high)=>Math.max(low,Math.min(v,high));
    let left=base.x, right=base.x+base.w, top=base.y, bottom=base.y+base.h;
    if(direction.includes('w'))left=clamp(base.x+dx,8,right-minW);
    if(direction.includes('e'))right=clamp(base.x+base.w+dx,left+minW,innerWidth-8);
    if(direction.includes('n'))top=clamp(base.y+dy,8,bottom-minH);
    if(direction.includes('s'))bottom=clamp(base.y+base.h+dy,top+minH,innerHeight-8);
    return {x:left,y:top,w:right-left,h:bottom-top};
  }
  const directions={n:'上邊',s:'下邊',e:'右邊',w:'左邊',ne:'右上角',nw:'左上角',se:'右下角',sw:'左下角'};
  const resizeHandles=Object.entries(directions).map(([direction,label])=>{
    const handle=document.createElement('div');handle.className='resize resize-'+direction;handle.tabIndex=0;
    handle.setAttribute('role','button');handle.setAttribute('aria-label',label+'調整大小；方向鍵微調');
    handle.title='拖曳'+label+'調整大小，或聚焦後按方向鍵';
    handle.addEventListener('pointerdown',e=>start(e,direction));
    handle.addEventListener('keydown',e=>{
      if(minimized || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();
      const dx=e.key==='ArrowRight'?20:e.key==='ArrowLeft'?-20:0;
      const dy=e.key==='ArrowDown'?20:e.key==='ArrowUp'?-20:0;
      rect=resizeRect(displayed,direction,dx,dy);maximized=false;fit();savePlacement();
    });
    return handle;
  });
  function start(e,kind) {
    if (minimized || e.button!==0 || (kind==='move' && (e.target.closest('button') || maximized))) return;
    e.preventDefault();e.stopPropagation();
    dragging={kind,x:e.clientX,y:e.clientY,rect:{...displayed}};
    e.currentTarget.setPointerCapture(e.pointerId);panel.classList.add('interacting');
  }
  function move(e) {
    if (!dragging) return;
    const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y,base=dragging.rect;
    if(dragging.kind==='move'){rect.x=base.x+dx;rect.y=base.y+dy;}
    else {maximized=false;rect=resizeRect(base,dragging.kind,dx,dy);}
    fit();
  }
  function stop(){if(dragging) savePlacement();dragging=null;panel.classList.remove('interacting');}
  bar.addEventListener('pointerdown',e=>start(e,'move'));
  bar.addEventListener('dblclick',e=>{
    if (!minimized || e.target.closest('button')) return;
    e.preventDefault();e.stopPropagation();show();
  });
  for(const el of [bar,...resizeHandles]){
    el.addEventListener('pointermove',move);
    el.addEventListener('pointerup',stop);
    el.addEventListener('pointercancel',stop);
    el.addEventListener('lostpointercapture',stop);
  }
  function show() {
    if (minimized) maximized=false;
    minimized=false;fit();
  }
  panel.append(bar,status,iframe,...resizeHandles);shadow.append(panel);document.documentElement.append(host);
  window.addEventListener('resize',fit);
  globalThis[KEY]={host,show};fit();
  return {mode:'overlay'};
})();

