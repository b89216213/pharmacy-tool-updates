const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const bridge=fs.readFileSync(__dirname+'/../discharge-extension/education-bridge.js','utf8'),base='https://ihisaw.ntuh.gov.tw/WebApplication/PharManagement/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_PATH||'/tmp/chromium',args:['--no-sandbox','--single-process','--no-zygote']});
 const page=await browser.newPage();
 try{
  await page.route('**/*',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><button id="menu-plus" onclick="document.getElementById('menu-cont').style.display='block'">藥事服務</button><div class="webfx-tree-container" id="menu-cont" style="display:none"><a href="${base}CareEducationRecord.aspx?SESSION=synthetic-test">衛教紀錄</a><a href="${base}InMedicationProcess.aspx?SESSION=synthetic-test">查詢處理</a></div>`}));
  const call=(action,expiresAt=Date.now()+8000)=>page.evaluate(({action,expiresAt})=>educationPageBridge(action,{},expiresAt),{action,expiresAt});
  await page.goto(base+'OtherTask.aspx');await page.evaluate(bridge);
  assert.equal((await call('eduDiscover')).kind,'other');assert.equal((await call('eduNavigate',Date.now()-1)).error.includes('逾時'),true);assert(page.url().endsWith('OtherTask.aspx'));
  assert.equal((await call('eduNavigate')).expanded,true);assert(page.url().endsWith('OtherTask.aspx'));console.log('PASS only the existing menu expander is clicked before navigation');
  await Promise.all([page.waitForURL(base+'CareEducationRecord.aspx?SESSION=synthetic-test'),call('eduNavigate').catch(e=>{if(!/context|navigation/i.test(e.message))throw e;})]);await page.evaluate(bridge);
  assert.equal((await call('eduDiscover')).kind,'education');console.log('PASS existing education link preserves its session query');
  await page.evaluate(()=>{const e=document.createElement('input');e.id='NTUHWeb1_EditorBox_ContentBox_rdbEducationType_1';e.type='radio';document.body.append(e);});assert((await call('eduReturnCapture')).error.includes('未儲存'));assert(page.url().includes('CareEducationRecord.aspx'));await page.evaluate(()=>document.getElementById('NTUHWeb1_EditorBox_ContentBox_rdbEducationType_1').remove());
  assert.equal((await call('eduReturnCapture')).expanded,true);
  await Promise.all([page.waitForURL(base+'InMedicationProcess.aspx?SESSION=synthetic-test'),call('eduReturnCapture').catch(e=>{if(!/context|navigation/i.test(e.message))throw e;})]);await page.evaluate(bridge);assert.equal((await call('eduDiscover')).kind,'capture');console.log('PASS unsaved form blocks leaving; saved/home page returns through the original capture link');
  await page.evaluate(()=>{for(const a of document.querySelectorAll('a'))a.href='https://example.invalid/CareEducationRecord.aspx';});assert((await call('eduNavigate')).error.includes('連結'));assert(page.url().includes('InMedicationProcess.aspx'));console.log('PASS matching text with an unrelated destination cannot trigger navigation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
