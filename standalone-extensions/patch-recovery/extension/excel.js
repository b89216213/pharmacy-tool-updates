// Self-contained OOXML workbook writer. Stored ZIP entries; no remote dependencies.
import {FIELDS,LABELS,DOSES,totals,onlyWard} from './model.js';
const enc=new TextEncoder(),xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function block(size){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);return {bytes,set:(offset,n,width=4)=>width===2?view.setUint16(offset,n,true):view.setUint32(offset,n,true)};}
export function zipFiles(files){
  const chunks=[],directory=[];let offset=0,centralSize=0;
  for(const [path,value]of Object.entries(files)){
    const name=enc.encode(path),data=enc.encode(value),crc=crc32(data),local=block(30);
    local.set(0,0x04034b50);local.set(4,20,2);local.set(6,0x0800,2);local.set(14,crc);local.set(18,data.length);local.set(22,data.length);local.set(26,name.length,2);
    chunks.push(local.bytes,name,data);
    const c=block(46);c.set(0,0x02014b50);c.set(4,20,2);c.set(6,20,2);c.set(8,0x0800,2);c.set(16,crc);c.set(20,data.length);c.set(24,data.length);c.set(28,name.length,2);c.set(42,offset);
    directory.push(c.bytes,name);centralSize+=46+name.length;offset+=30+name.length+data.length;
  }
  const end=block(22),n=Object.keys(files).length;end.set(0,0x06054b50);end.set(8,n,2);end.set(10,n,2);end.set(12,centralSize);end.set(16,offset);
  return new Blob([...chunks,...directory,end.bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
export function workbook(records,month,requestedWard=''){
  const ward=onlyWard(records,requestedWard);
  const cell=(value,col,row,style=2)=>typeof value==='number'?`<c r="${String.fromCharCode(65+col)}${row}" s="${style}"><v>${value}</v></c>`:`<c r="${String.fromCharCode(65+col)}${row}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  const rows=[];
  rows.push(`<row r="1" ht="28" customHeight="1">${cell('臺大醫院 FENTANYL 貼片發藥紀錄表　藥局回收／銷毀記錄',0,1,0)}</row>`);
  rows.push(`<row r="2" ht="23" customHeight="1">${cell('病房：'+ward+'　　回收月份：'+month,0,2,0)}</row>`);
  rows.push(`<row r="3" ht="26" customHeight="1">${[...FIELDS.map(k=>LABELS[k]),'回收日期','回收數量（片）','','','回收藥師','覆核藥師核章'].map((x,i)=>cell(x,i,3,1)).join('')}</row>`);
  rows.push(`<row r="4" ht="24" customHeight="1">${Array.from({length:12},(_,i)=>cell(i>=7&&i<=9?DOSES[i-7]:'',i,4,1)).join('')}</row>`);
  records.forEach((r,i)=>{const row=i+5,values=[...FIELDS.map(k=>r.patient[k]),r.date.replaceAll('-','/'),...DOSES.map(d=>r.quantities[d]||''),r.pharmacist,''];rows.push(`<row r="${row}" ht="28" customHeight="1">${values.map((x,c)=>cell(x,c,row)).join('')}</row>`);});
  const sumRow=records.length+5,sum=totals(records);rows.push(`<row r="${sumRow}" ht="25" customHeight="1">${['本月合計 '+records.length+' 筆','','','','','','',...DOSES.map(d=>sum[d]),'',''].map((x,c)=>cell(x,c,sumRow,1)).join('')}</row>`);
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const merges=['A1:L1','A2:L2',...['A','B','C','D','E','F','G','K','L'].map(x=>x+'3:'+x+'4'),'H3:J3',`A${sumRow}:G${sumRow}`];
  const files={
    '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(month)}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'${xml(month)}'!$1:$4</definedName><definedName name="_xlnm.Print_Area" localSheetId="0">'${xml(month)}'!$A$1:$L$${sumRow}</definedName></definedNames></workbook>`,
    'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':`<styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="11"/><name val="Microsoft JhengHei"/></font><font><b/><sz val="11"/><name val="Microsoft JhengHei"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE5EFED"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml':`<worksheet xmlns="${ns}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:L${sumRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${[18,18,10,7,7,15,15,8,8,8,13,15].map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData><mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.3" bottom="0.3" header="0.1" footer="0.1"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/></worksheet>`
  };
  return zipFiles(files);
}
