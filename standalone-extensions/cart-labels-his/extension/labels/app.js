const $=id=>document.getElementById(id);const labelNotes=new Map();let lastExcluded=[],vacantCaptions=new Map();
// 因出院排除而改印空床時，床號右側加註（今天：今日可出院；其他日期：原文 MM/DD可出院）
function vacantCaption(text){const b=labelBed(text),note=vacantCaptions.get(wardKey(b.ward)+'|'+bedKey(b.bed));return text.split('\n')[0]+(note?' '+note:'');}let records=[],current=0,dirty=false,printSelection=null,printOmitted=new Set(),recordsUsePresets=false;// Word template 20221031: exact twips / 15 = CSS pixels.
// First label starts at page-left 130 + table indent -108 + spacer 340 twips.
const defaults={width:1814/15,height:964/15,gapX:510/15,gapX2:510/15,gapX3:624/15,gapX4:454/15,gapY:227/15,left:362/15,top:397/15};
function parseRows(text){return text.replace(/\r\n?/g,'\n').split('\n').map((raw,i)=>({raw,cells:raw.split('\t').map(c=>c.trim()),line:i+1})).filter(r=>r.cells.some(Boolean));}
function toLabel(c){return c[4]+'  '+(c[5]===''?'':c[5]+'-'+c[6])+'\n'+c[7]+'\n'+c[2];}
// 擴充功能：院內「列印病人標籤」解析出的資料（病房、病室、病床、姓名、病歷號、生日）
function extractHisPrint(rows){
 const labels=[],bad=[],seen=new Set();
 for(const r of rows){
  if(r.cells[0]==='#院內列印資料')continue;
  const [ward,room,bed,name,chart,birthday,note]=r.cells;
  if(!ward||!name||!chart){bad.push(r.line);continue;}
  const key=chart+'|'+wardKey(ward)+'|'+room+'-'+bed;if(seen.has(key))continue;seen.add(key);
  const label=ward+'  '+(room?room+'-'+bed:'')+'\n'+name+'\n'+chart+(birthday?' '+birthday:'');
  labels.push(label);if(note)labelNotes.set(label,note);
 }
 if(bad.length)throw new Error(`第 ${bad.slice(0,8).join('、')} 行院內列印資料不完整，尚未轉換。`);
 if(!labels.length)throw new Error('院內列印資料中沒有病人。');
 return {labels,mode:'已讀取院內列印資料（病歷號、生日）。'};
}
// 文字中含院內列印資料時：依順序分段，院內列印段與一般清單段各自轉換後合併
function extractLabels(text,allowEmpty=false){
 if(!text.includes('#院內列印資料'))return extractListLabels(text,allowEmpty);
 const rows=parseRows(text),runs=[];let inHis=false;
 for(const r of rows){
  if(r.cells[0]==='#院內列印資料')inHis=true;
  else if(inHis&&!(r.cells.length>=5&&/^\d{6,8}$/.test(r.cells[4])))inHis=false;
  const type=inHis?'his':'list',last=runs[runs.length-1];
  if(last&&last.type===type)last.rows.push(r);else runs.push({type,rows:[r]});
 }
 const labels=[],modes=new Set();
 for(const run of runs){
  const res=run.type==='his'?extractHisPrint(run.rows):extractListLabels(run.rows.map(r=>r.raw).join('\n'),allowEmpty);
  labels.push(...res.labels);modes.add(res.mode);
 }
 return {labels,mode:[...modes].join(' ')};
}
function extractListLabels(text,allowEmpty=false){
 const rows=parseRows(text), labels=[],bad=[];
 const fields=['帳號','病房','病室','病床','姓名'];
 const tokens=r=>r.raw.includes('\t')?r.cells:r.raw.trim().split(/[\s\u00a0]+/);
 const isHeader=c=>fields.every(f=>c.includes(f));
 const hasHeader=rows.some(r=>isHeader(tokens(r)));
 const account=/^[0-9]{2}[A-Za-z][0-9]{6,}$/;
 const hasAccounts=rows.some(r=>tokens(r).some(c=>account.test(c)));
 let header=null;
 for(const r of rows){
  const c=tokens(r);
  if(isHeader(c)){header=c;continue;}
  if(hasHeader||hasAccounts){
   const at=c.findIndex(v=>account.test(v));
   if(at<0){if(header&&/選\s*Note|住院中/.test(r.raw))bad.push(r.line);continue;}
   let values;
   if(header&&r.raw.includes('\t')){
    const offset=at-header.indexOf('帳號');
    values=fields.map(f=>c[header.indexOf(f)+offset]);
   }else{
    let name=c[at+5];
    // Space-separated full-page copies may contain multiple words in a name.
    if(!r.raw.includes('\t')){
     const end=c.findIndex((v,i)=>i>at+5&&/^(M|F|男|女)$/.test(v)&&/^\d+(?:y|歲)/i.test(c[i+1]||''));
     if(end>at+5)name=c.slice(at+5,end).join(' ');
    }
    values=[c[at],c[at+2],c[at+3],c[at+4],name];
   }
   const [id,ward,room,bed,name]=values;
   if(values.some(v=>v===undefined)||!ward||!name||(!room&&bed)||/^(M|F|男|女)$/.test(name)){bad.push(r.line);continue;}
   const label=ward+'  '+(room?room+'-'+bed:'')+'\n'+name+'\n'+id;labels.push(label);
   const note=r.raw.match(/\d{1,2}\/\d{1,2}\s*可出院/);if(note)labelNotes.set(label,note[0]);
  }else{
   if(r.cells.length<8){bad.push(r.line);continue;}
   labels.push(toLabel(r.cells));
  }
 }
 if(bad.length)throw new Error(`第 ${bad.slice(0,8).join('、')} 行資料不完整或無法辨識，尚未轉換。請保留完整病人資料列與欄位分隔。`);
 if(!labels.length&&!(allowEmpty&&hasHeader))throw new Error('未找到病人資料。請貼上包含帳號、病房、病室、病床、姓名的完整清單。');
 return {labels,mode:hasHeader||hasAccounts?'已自動擷取病人清單，略過選單、標題與頁尾。':'已依原 Excel 欄位順序轉換。'};
}
let conversionBusy=false;
async function convert(){
 if(conversionBusy||printBusy)return false;
 conversionBusy=true;$('convert').disabled=true;
 try{
  const sourceSnapshot=$('source').value;let presetSnapshot=JSON.stringify([bedPresets,[...presetSelection],$('useBedPresets').checked]);
  const exclude=typeof chooseDischarge==='function'?await chooseDischarge(sourceSnapshot):new Set();if(exclude&&typeof manualRemoved!=='undefined')manualRemoved.forEach(l=>exclude.add(l));
  if(exclude===null){markDirty();$('status').textContent='已取消轉換，預覽尚未更新。';return false;}
  if(sourceSnapshot!==$('source').value){markDirty();$('status').textContent='資料已變更，請重新轉換。';return false;}
  let result=prepareLabelRecords(sourceSnapshot,exclude);
  // 讀到不在預設床位中的床位：詢問是否加入預設床位
  if(result.usedPresets&&typeof offerNewBeds==='function'){
   const added=await offerNewBeds(result.labels);
   if(added===null){markDirty();$('status').textContent='已取消轉換，預覽尚未更新。';return false;}
   if(added){result=prepareLabelRecords(sourceSnapshot,exclude);presetSnapshot=JSON.stringify([bedPresets,[...presetSelection],$('useBedPresets').checked]);}
  }
  if(result.missingWards?.length){
   const skipped=await (typeof chooseMissingWards==='function'?chooseMissingWards(result.missingWards):chooseEmptyWards(result.missingWards));
   if(skipped===null){markDirty();$('status').textContent='已取消轉換，預覽尚未更新。';return false;}
   if(sourceSnapshot!==$('source').value||presetSnapshot!==JSON.stringify([bedPresets,[...presetSelection],$('useBedPresets').checked])){markDirty();$('status').textContent='資料或床位設定已變更，請重新轉換。';return false;}
   result.labels=result.labels.filter(text=>!skipped.has(wardKey(labelBed(text).ward)));
   result.vacancies=result.labels.filter(isVacantLabel).length;
   result.skippedWards=skipped.size;
  }
  records=result.labels;lastExcluded=exclude?[...exclude]:[];vacantCaptions=new Map();for(const t of lastExcluded){const n=labelNotes.get(t);if(n&&!(typeof manualRemoved!=='undefined'&&manualRemoved.has(t))){const b=labelBed(t);vacantCaptions.set(wardKey(b.ward)+'|'+bedKey(b.bed),typeof dischargeOffset==='function'&&dischargeOffset(n)===0?'今日可出院':n.replace(/\s+/g,''));}}recordsUsePresets=result.usedPresets;current=0;dirty=false;document.body.classList.remove('dirty');render();
  $('status').textContent=records.length?`${result.mode} 共 ${records.length-result.vacancies} 位病人、${result.vacancies} 張空床標籤。${result.skippedWards?' 已跳過 '+result.skippedWards+' 個未輸入資料的病房。':''}${result.excluded?' 已排除 '+result.excluded+' 位出院病人。':''}${result.extra?' 有 '+result.extra+' 筆床位未列入預設，已保留在該病房後方。':''} 請核對預覽內容。`:result.excluded?`已排除 ${result.excluded} 位出院病人，本次沒有可列印的標籤。`:'已跳過未輸入資料的病房，本次沒有可列印的標籤。';
  return true;
 }catch(error){records=[];current=0;dirty=false;document.body.classList.remove('dirty');render();$('status').textContent=error.message;return false;}
 finally{conversionBusy=false;$('convert').disabled=false;}
}

const fontFamilies={noto:'"Noto Sans TC","Microsoft JhengHei",sans-serif',ming:'"PMingLiU","新細明體","Noto Serif CJK TC",serif',jhenghei:'"Microsoft JhengHei","微軟正黑體",sans-serif',kai:'"DFKai-SB","標楷體","BiauKai",serif',sans:'system-ui,sans-serif',serif:'serif'};
const TYPE_DEFAULTS={bedFont:8,nameFont:16,accountFont:8};
const TYPE_KEY='cart-label-typography-v1';
function selectedFontFamily(){const value=$('fontFamily').value;return value.startsWith('local:')?JSON.stringify(value.slice(6))+',sans-serif':fontFamilies[value]||fontFamilies.noto;}
function addLocalFont(name){
 if(typeof name!=='string'||!name.trim()||name.length>128||/[\r\n\x00]/.test(name))return null;
 name=name.trim();const value='local:'+name;
 if(![...$('fontFamily').options].some(o=>o.value===value)){const option=document.createElement('option');option.value=value;option.textContent=name+'（電腦字體）';$('fontFamily').append(option);}
 return value;
}
function saveTypography(){
 if(Object.keys(TYPE_DEFAULTS).some(k=>!$(k).checkValidity()||!$(k).value))return;
 try{localStorage.setItem(TYPE_KEY,JSON.stringify({sizes:Object.fromEntries(Object.keys(TYPE_DEFAULTS).map(k=>[k,Number($(k).value)])),font:$('fontFamily').value,defaultsVersion:2,sizesVersion:3}));$('typographyStatus').textContent='已記住字級與字體，下次開啟自動套用。';}catch{$('typographyStatus').textContent='此瀏覽器無法記住設定，本次仍可使用。';}
}
function typographyChanged(){saveTypography();render();if(document.fonts)document.fonts.ready.then(render);}
function initializeTypography(){
 $('fontFamily').value='noto';
 try{const saved=JSON.parse(localStorage.getItem(TYPE_KEY)||'null');if(saved){for(const k of Object.keys(TYPE_DEFAULTS)){const n=saved.sizes?.[k];if(Number.isFinite(n)&&n>=6&&n<=32)$(k).value=String(n);}if(saved.defaultsVersion===2&&typeof saved.font==='string'){if(saved.font.startsWith('local:')){const v=addLocalFont(saved.font.slice(6));if(v)$('fontFamily').value=v;}else if(Object.hasOwn(fontFamilies,saved.font))$('fontFamily').value=saved.font;}if(saved.defaultsVersion===2)$('typographyStatus').textContent='已套用上次的字級與字體。';else{saveTypography();$('typographyStatus').textContent='已套用預設 Noto Sans TC，保留原本字級。';}if(saved.sizesVersion!==3){if(Number($('bedFont').value)===10)$('bedFont').value='8';if(Number($('accountFont').value)===9)$('accountFont').value='8';saveTypography();}}}catch{}
 Object.keys(TYPE_DEFAULTS).forEach(k=>$(k).addEventListener('input',typographyChanged));$('fontFamily').addEventListener('change',typographyChanged);
 $('resetTypography').onclick=()=>{Object.entries(TYPE_DEFAULTS).forEach(([k,v])=>$(k).value=String(v));$('fontFamily').value='noto';typographyChanged();};
 $('applyFont').onclick=()=>{const value=addLocalFont($('fontName').value);if(!value){$('fontStatus').textContent='請輸入有效字體名稱。';return;}$('fontFamily').value=value;typographyChanged();$('fontStatus').textContent='已套用；請確認預覽。電腦沒有此字體時會使用替代字體。';};
 $('loadFonts').onclick=async()=>{
  if(!window.queryLocalFonts){$('fontStatus').textContent='此瀏覽器無法列出字體，請在下方輸入電腦已安裝的字體名稱。';return;}
  $('loadFonts').disabled=true;
  try{const result=await window.queryLocalFonts();const names=[...new Set(result.map(f=>f.family))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));names.forEach(addLocalFont);$('fontStatus').textContent=names.length?`已載入 ${names.length} 種電腦字體，請從字體選單選擇。`:'沒有可用字體，請手動輸入名稱。';}catch{$('fontStatus').textContent='未取得字體清單。可允許瀏覽器讀取字體，或在下方手動輸入名稱。';}finally{$('loadFonts').disabled=false;}
 };
}
// 每一頁各自的起印位置（前方留白張數）；第 1 頁以外預設從第 1 格開始
let pageStarts=[0];
function startOffset(page=current){return Math.max(0,Math.min(64,Number(pageStarts[page])||0));}
function pagePlan(count){const plan=[];let idx=0;for(let page=0;idx<count&&page<1000;page++){const offset=startOffset(page),cap=65-offset;plan.push({offset,start:idx,end:Math.min(count,idx+cap)});idx+=cap;}return plan;}
function cellLeft(s,col){return s.left+col*s.width+[s.gapX,s.gapX2,s.gapX3,s.gapX4].slice(0,col).reduce((sum,gap)=>sum+gap,0);}
// 起印處箭頭：畫在起始標籤左側（與左邊標籤的間隙或左側留白）
function startArrow(s,cell){
 const col=cell%5,row=Math.floor(cell/5),gap=col===0?s.left:[s.gapX,s.gapX2,s.gapX3,s.gapX4][col-1];
 const w=Math.max(2,Math.min(7,gap-1)),h=Math.max(2,Math.min(6,s.height*0.55));
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('class','start-arrow');svg.setAttribute('viewBox','0 0 20 12');svg.setAttribute('preserveAspectRatio','none');
 svg.style.cssText=`left:${cellLeft(s,col)-w-0.5}mm;top:${s.top+row*(s.height+s.gapY)+(s.height-h)/2}mm;width:${w}mm;height:${h}mm`;
 const path=document.createElementNS(ns,'path');path.setAttribute('d','M0 4.5H11V0L20 6L11 12V7.5H0Z');svg.append(path);return svg;
}
// 略過的病人（前前次已印）：在該格上方間隙標示床號與姓名，貼的時候核對；第一排上方超出可印範圍，改印在貼紙上
function omitMarkOn(){return $('omitMarks')?$('omitMarks').checked:true;}
function omitMarkText(orig){const {bed,lines}=labelBed(orig);return isVacantLabel(orig)?`SKIP ${bed} 空床`:`SKIP ${bed} ${(lines[1]||'').trim()}`.trim();}
// 「SKIP」改成灰底白字小標
function skipTag(node){const t=node.textContent;if(!t.startsWith('SKIP '))return;const tag=document.createElement('span');tag.className='skip-tag';tag.textContent='SKIP';node.replaceChildren(tag,t.slice(4));}
// 連續兩張以上略過（空白）的貼紙：合併成一張，貼紙上列出這段的 SKIP 清單（每張最多 4 筆），後面的標籤往前補
const OMIT_LIST_MAX=4;
function collapseOmitted(items){
 if(!omitMarkOn())return items;
 const out=[];
 for(let i=0;i<items.length;){
  const it=items[i];
  if(!(it.omitted&&it.orig)){out.push(it);i++;continue;}
  let j=i;while(j<items.length&&items[j].omitted&&items[j].orig)j++;
  const entries=[...new Set(items.slice(i,j).map(x=>omitMarkText(x.orig).replace(/^SKIP /,'')))];
  if(j-i<2||!entries.length){out.push(...items.slice(i,j));i=j;continue;}
  const n=Math.ceil(entries.length/OMIT_LIST_MAX),per=Math.ceil(entries.length/n);
  for(let k=0;k<n;k++){const chunk=entries.slice(k*per,(k+1)*per);out.push({text:'',separator:false,vacant:false,omitted:true,omitList:chunk.map((t,m)=>m===0?'SKIP '+t:t),record:it.record});}
  i=j;
 }
 return out;
}
function fitList(lines,s,family){
 const width=Math.max(1,s.width*96/25.4-14.4),height=Math.max(1,s.height*96/25.4-4),base=s.bedFont*96/72;
 const cap=Math.min(base,height/(lines.length*1.2)); // 每行高度相同；過長的那一行單獨縮小
 return lines.map(t=>{const size=Math.min(cap,base*width/measuredWidth(t,base,family));return {text:t,fontSize:size,lineHeight:cap*1.2,rows:1};});
}
function printItems(){
 const items=[];let previousWard=null;
 const view=printSelection?{list:printSelection,omitted:printOmitted}:(typeof filteredView==='function'&&filteredView())||{list:records,omitted:printOmitted};
 const omittedSet=view.omitted;
 for(const [index,text] of view.list.entries()){
  const ward=text.split('\n')[0].split('  ')[0].trim();
  if($('wardSeparators').checked&&previousWard!==null&&ward!==previousWard){items.push({text:ward,separator:true});}
  const n=typeof copiesFor==='function'?copiesFor(ward):1;
  for(let k=0;k<n;k++)items.push({text:omittedSet.has(index)?'':text,separator:false,vacant:!omittedSet.has(index)&&isVacantLabel(text),omitted:omittedSet.has(index),orig:text,record:index});previousWard=ward;
 }
 return collapseOmitted(items);
}
function pageCount(){return pagePlan(printItems().length).length;}
function settings(){return {...Object.fromEntries(Object.keys(defaults).map(k=>[k,Number($(k).value)*25.4/96])),...Object.fromEntries(Object.keys(TYPE_DEFAULTS).map(k=>[k,Number($(k).value)]))};}
// Measure with the selected font, independently of which preview page is visible.
const measureContext=document.createElement('canvas').getContext('2d');
function hasLatinName(text){return /[A-Za-zÀ-ɏ]/.test(text||'');}
function measuredWidth(text,size,family){
 if(!measureContext)return Array.from(text).length*size;
 measureContext.font=`${size}px ${family}`;
 const m=measureContext.measureText(text);
 return Math.max(1,m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0));
}
function fitLabelLines(lines,s,family){
 const latin=lines.length>=3&&hasLatinName(lines[1]); // 英文姓名：可分兩行並自動縮放（含病歷號／生日分兩行的樣式 D）
 const width=Math.max(1,s.width*96/25.4-(latin?4:14.4)),height=Math.max(1,s.height*96/25.4-2);
 const sizes=[s.bedFont,s.nameFont,s.accountFont];
 const fitted=lines.map((text,index)=>{
  const requested=(sizes[index]||s.accountFont)*96/72;
  const fontSize=requested*Math.min(1,width/measuredWidth(text,requested,family));
  return {text,fontSize,lineHeight:fontSize*1.2,rows:1};
 });
 if(latin){
  // Reserve room for the bed and account; compare one line against two lines.
  const available=Math.max(1,height-fitted.reduce((sum,line,i)=>i===1?sum:sum+line.lineHeight,0));
  const requested=s.nameFont*96/72,name=lines[1];
  const candidate=parts=>{
   const fontSize=Math.min(requested,available/(parts.length*1.2),...parts.map(t=>requested*width/measuredWidth(t,requested,family)));
   return {text:parts.join('\n'),fontSize,lineHeight:fontSize*1.2,rows:parts.length};
  };
  let best=candidate([name]);
  if(measuredWidth(name,requested,family)>width){
   const chars=Array.from(name),breaks=[];
   for(let i=1;i<chars.length;i++)if(/\s|[-‐‑]/.test(chars[i-1]))breaks.push(i);
   // Prefer word boundaries. Split within a single long word only if needed.
   const positions=breaks.length?breaks:chars.slice(1).map((_,i)=>i+1);
   for(const at of positions){
    const parts=[chars.slice(0,at).join('').trimEnd(),chars.slice(at).join('').trimStart()];
    if(parts.some(t=>!t))continue;
    const next=candidate(parts);
    if(next.fontSize>best.fontSize+0.1)best=next;
   }
  }
  fitted[1]=best;
 }
 const total=fitted.reduce((sum,line)=>sum+line.lineHeight*line.rows,0),scale=Math.min(1,height/Math.max(1,total));
 return fitted.map(line=>({...line,fontSize:line.fontSize*scale,lineHeight:line.lineHeight*scale}));
}
function fitWardLabel(text,s,family){
 const width=Math.max(1,s.width*96/25.4-14.4),height=Math.max(1,s.height*96/25.4-4);
 const requested=Math.min(28*96/72,height/1.2);
 let scale=1;
 if(measureContext){measureContext.font=`${requested}px ${family}`;const m=measureContext.measureText(text);scale=Math.min(1,width/Math.max(1,m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0)));}
 const fontSize=requested*scale;return {fontSize,lineHeight:fontSize*1.2};
}
function fitPreview(){
 if(window.matchMedia('print').matches)return;
 const viewport=$('previewViewport');if(!viewport.clientWidth||!viewport.clientHeight)return;
 const fit=Math.max(0.05,Math.min(1,(viewport.clientWidth-24)/(210*96/25.4),(viewport.clientHeight-24)/(297*96/25.4)));
 const scale=typeof previewZoomScale==='function'?previewZoomScale(fit):fit;
 $('previewSizer').style.setProperty('--preview-scale',String(scale));
}
function formatPrintTime(date=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
 return `列印時間：${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}
function updatePrintStamps(date=new Date()){
 const text=formatPrintTime(date);
 document.querySelectorAll('.print-stamp').forEach(stamp=>{stamp.textContent=text;});
}
window.addEventListener('beforeprint',()=>updatePrintStamps());
function render(){const stampText=formatPrintTime();const s=settings();const invalid=Object.keys({...defaults,...TYPE_DEFAULTS}).some(k=>!$(k).checkValidity()||$(k).value==='')||s.left+5*s.width+s.gapX+s.gapX2+s.gapX3+s.gapX4>210||s.top+13*s.height+12*s.gapY>297;const items=printItems();const plan=pagePlan(items.length),pos=[];plan.forEach(pg=>{for(let k=pg.start;k<pg.end;k++)pos[k]=pg.offset+k-pg.start;});const footerSpaceInvalid=items.some((item,index)=>!item.omitted&&s.top+Math.floor(pos[index]/5)*(s.height+s.gapY)+s.height>289);const outside=$('vacantBedOutside').checked;const markerSpaceInvalid=s.gapY*96/25.4<12&&items.some((item,index)=>pos[index]>=5&&((outside&&item.vacant)||(item.omitted&&omitMarkOn())));const p=plan.length;current=Math.max(0,Math.min(current,Math.max(0,p-1)));const offset=startOffset();$('startRow').value=String(Math.floor(offset/5)+1);$('startCol').value=String(offset%5+1);{const others=plan.map((pg,i)=>i!==current&&pg.offset?`第 ${i+1} 頁從第 ${Math.floor(pg.offset/5)+1} 排第 ${pg.offset%5+1} 張`:'').filter(Boolean);$('startHint').textContent=`${p>1?'第 '+(current+1)+' 頁：':''}從第 ${Math.floor(offset/5)+1} 排第 ${offset%5+1} 張開始，前方留白 ${offset} 張。${others.length?'（'+others.join('、')+'）':''}`;const title=$('startTitle');if(title)title.textContent=p>1?`第 ${current+1} 頁起印`:'起印位置';}$('pages').replaceChildren();for(let page=0;page<p;page++){const sheet=document.createElement('div');sheet.className='sheet'+(current===page?' active':'');for(let i=0;i<65;i++){const el=document.createElement('div');el.className='label';el.style.cssText=`left:${s.left+(i%5)*s.width+[s.gapX,s.gapX2,s.gapX3,s.gapX4].slice(0,i%5).reduce((sum,gap)=>sum+gap,0)}mm;top:${s.top+Math.floor(i/5)*(s.height+s.gapY)}mm;width:${s.width}mm;height:${s.height}mm;font-size:${s.nameFont}pt`;el.style.fontFamily=selectedFontFamily();const content=document.createElement('span');content.className='label-content';const pg=plan[page],item=i>=pg.offset&&pg.start+i-pg.offset<pg.end?items[pg.start+i-pg.offset]:undefined;if(i<pg.offset)el.classList.add('skipped');el.title=`點此設為第 ${page+1} 頁起印處（第 ${Math.floor(i/5)+1} 排第 ${i%5+1} 張）`;const text=item?.text??'';if(item?.separator)el.className+=' separator';if(item?.vacant)el.className+=' vacant';const run=item?.omitList?{list:item.omitList}:null,firstRow=Math.floor(i/5)===0,omitMark=!run&&item?.omitted&&item.orig&&omitMarkOn()?omitMarkText(item.orig):'';if(omitMark&&firstRow||run?.list)el.className+=' omit-mark';const lines=run?(run.list?[...run.list]:[]):omitMark?(firstRow?[omitMark]:[]):item?.vacant?(outside&&!firstRow?[]:[vacantCaption(text)]):(text?text.split('\n'):['','','']);const idv=!item?.separator&&!item?.vacant&&text&&typeof idStyleLines==='function'?idStyleLines(lines):null;if(idv)lines.splice(0,lines.length,...idv.measure);const sFit=idv?.extraMm?{...s,height:s.height-idv.extraMm}:s;if(!item?.separator&&!item?.vacant&&hasLatinName(lines[1]))el.className+=' latin-name';const qrOpt=!item?.separator&&!item?.vacant&&text&&typeof qrOptions==='function'?qrOptions():null;const qrFit=qrOpt?qrApply(el,content,lines,sFit,qrOpt,el.style.fontFamily):null;const fitted=item?.separator?[fitWardLabel(text,s,el.style.fontFamily)]:run?.list?fitList(lines,sFit,el.style.fontFamily):qrFit||fitLabelLines(lines,sFit,el.style.fontFamily);for(const [index,textLine] of lines.entries()){const line=document.createElement('span');line.className='label-line';line.style.fontSize=`${fitted[index].fontSize}px`;line.style.lineHeight=`${fitted[index].lineHeight}px`;line.textContent=(fitted[index].text??textLine)||'\u00a0';content.append(line);}if(omitMark&&firstRow||run?.list){const l=content.querySelector('.label-line');if(l)skipTag(l);}if(idv&&typeof idStyleDecorate==='function')idStyleDecorate(content,idv);el.append(content);sheet.append(el);if((item?.vacant&&outside||omitMark)&&!firstRow){
 const markText=omitMark||vacantCaption(text);
 const marker=document.createElement('div');marker.className='vacant-marker'+(omitMark?' omit':'');
 const available=s.gapY;
 const fit=fitLabelLines([markText],{...s,height:available},el.style.fontFamily)[0];
 marker.style.left=`${s.left+(i%5)*s.width+[s.gapX,s.gapX2,s.gapX3,s.gapX4].slice(0,i%5).reduce((sum,gap)=>sum+gap,0)}mm`;marker.style.width=`${s.width}mm`;
 marker.style.top=`${s.top+Math.floor(i/5)*(s.height+s.gapY)-(fit.lineHeight+1)*25.4/96}mm`;
 marker.style.height=`${fit.lineHeight}px`;marker.style.fontFamily=el.style.fontFamily;marker.style.fontSize=`${fit.fontSize}px`;marker.style.lineHeight=`${fit.lineHeight}px`;marker.textContent=markText;if(omitMark)skipTag(marker);sheet.append(marker);
 }} sheet.append(startArrow(s,plan[page].offset));const pageNo=document.createElement('div');pageNo.className='page-number';pageNo.textContent=`第 ${page+1} / ${p} 頁`;sheet.append(pageNo);const stamp=document.createElement('div');stamp.className='print-stamp';stamp.textContent=stampText;sheet.append(stamp);$('pages').append(sheet);} $('empty').style.display=p?'none':'block';$('previewViewport').style.display=p?'block':'none';const vacantCount=items.filter(item=>item.vacant).length,omittedCount=items.filter(item=>item.omitted).length;const labelItems=items.filter(item=>!item.separator),patientItems=labelItems.filter(item=>!item.vacant&&!item.omitted),patientRecords=new Set(patientItems.map(item=>item.record)).size;$('count').textContent=`${patientRecords} 位${patientItems.length>patientRecords?'（'+patientItems.length+' 張）':''} · 空床 ${vacantCount} 張 · 分隔 ${items.length-labelItems.length} 張 · ${p} 頁`;if(typeof filterInfoText==='function')$('filterInfo').textContent=filterInfoText();$('pageNumber').textContent=p?`${current+1} / ${p}`:'—';$('prev').disabled=current===0;$('next').disabled=current>=p-1;$('print').disabled=!p||invalid||markerSpaceInvalid||footerSpaceInvalid||dirty;$('layoutError').textContent=invalid?'目前尺寸超出 A4 範圍或數值無效，請調整後再列印。':footerSpaceInvalid?'標籤超出列印時間上方的可用範圍，請調整尺寸，讓標籤下緣不超過 289 mm。':markerSpaceInvalid?'格外標示空間不足：請將垂直間距調為至少 12 px，或取消「空床床號印在格子外上方」／「略過的病人標示床號與姓名」。':'';requestAnimationFrame(fitPreview);if(typeof afterRender==='function')afterRender();}
// Native paste inside the textarea preserves selection, undo and original text.
// Pasting elsewhere appends without changing either block of source text.
function appendSourceText(existing,incoming){return existing+(existing&&!/[\r\n]$/.test(existing)&&! /^[\r\n]/.test(incoming)?'\n':'')+incoming;}
document.addEventListener('paste',event=>{
 if(event.target===$('source')||event.target===$('fontName')||event.defaultPrevented||document.querySelector('dialog[open]'))return;
 const text=event.clipboardData?.getData('text/plain');
 if(!text)return;
 event.preventDefault();$('source').value=appendSourceText($('source').value,text);$('source').setSelectionRange($('source').value.length,$('source').value.length);convert();
});
$('wardSeparators').addEventListener('change',()=>{current=0;render();});
function markDirty(){dirty=true;document.body.classList.add('dirty');$('print').disabled=true;$('status').textContent='資料已變更，請按「更新預覽」更新預覽。';} $('source').addEventListener('input',markDirty);$('convert').onclick=convert;$('clear').onclick=()=>{pageStarts=[0];if(typeof dischargeDecisions!=='undefined')dischargeDecisions.clear();if(typeof manualRemoved!=='undefined')manualRemoved.clear();$('source').value='';records=[];current=0;dirty=false;document.body.classList.remove('dirty');render();$('status').textContent='資料已清除。';};$('demo').onclick=async()=>{$('source').value=Array.from({length:8},(_,i)=>['☑',String(i+1),'示範'+String(i+1).padStart(4,'0'),'',i<4?'示範A病房':'示範B病房','01',String(i+1).padStart(2,'0'),'測試姓名'+(i+1),'查'].join('\t')).join('\n');if(await convert())$('status').textContent='目前為虛構範例資料，請貼上實際資料後再列印。';};$('prev').onclick=()=>{current--;render();};$('next').onclick=()=>{current++;render();};$('print').onclick=()=>beginRememberedPrint();Object.keys(defaults).forEach(k=>$(k).addEventListener('input',render));['startRow','startCol'].forEach(k=>$(k).addEventListener('change',()=>{pageStarts[current]=(Number($('startRow').value)-1)*5+Number($('startCol').value)-1;render();if(document.fonts)document.fonts.ready.then(render);}));$('reset').onclick=()=>{pageStarts=[0];$('startRow').value='1';$('startCol').value='1';current=0;Object.entries(defaults).forEach(([k,v])=>$(k).value=v);render();};Object.entries(defaults).forEach(([k,v])=>$(k).value=String(v));initializeTypography();initializeBedPresets();render();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'convert_cart_labels',description:'從整頁文字或表格擷取病人清單，轉成藥車標籤並更新預覽，不列印。',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(typeof input?.text!=='string')throw new Error('請提供文字資料');prepareLabelRecords(input.text);$('source').value=input.text;if(!await convert())throw new Error($('status').textContent);return {patients:records.filter(text=>!isVacantLabel(text)).length,vacancies:records.filter(isVacantLabel).length,separators:printItems().length-records.length,labels:printItems().length,pages:pageCount()};}})).catch(()=>{});}catch{}}

if(typeof ResizeObserver!=="undefined"){const previewObserver=new ResizeObserver(fitPreview);previewObserver.observe($("previewViewport"));}window.addEventListener("resize",fitPreview);
