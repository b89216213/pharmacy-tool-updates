// Browser fixtures are synthetic. No actual Portal accounts or patient data.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+'/')||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_PATH,args:['--single-process','--no-zygote','--in-process-gpu','--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1763,height:904}}),base=`http://127.0.0.1:${server.address().port}`;
 const done=s=>{checks.push(s);console.log('PASS',s);};
 // Reproduce the supplied DOM: DIV + image logout, a short sidebar container,
 // then #vertical with FONT and trailing BR. Names remain synthetic.
 const shell=(name,extra='')=>`<style>body{margin:0;font:18px sans-serif}#vertical{width:1.5em;float:left;display:inline}</style><div id="leftContents" style="position:absolute;top:0;left:0;width:19px;height:70px;z-index:2"><div id="ContentHide"></div><div id="Portal"></div><div id="Logout" onclick="window.logoutClicks=(window.logoutClicks||0)+1"><img id="LogoutImg" width="26" height="64"></div><div id="vertical"><font size="2">${name}<br></font></div>${extra}</div><main style="margin-left:210px"><div id="NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_divInPatientListBox"><span>病人姓名：測試病人</span><table><tr><td>另一病人</td></tr></table></div><div id="vertical"><font>查詢區病人</font></div></main>`;
 const read=()=>page.evaluate(async()=>{const {portalBridge}=await import('/extension/bridge.js');return portalBridge('readPharmacist');});
 try{
  await page.goto(base+'/extension/patch-tool.json');
  await page.setContent(shell('測試甲'));assert.deepEqual((await read()).pharmacist,{name:'測試甲',status:'found'});assert.equal(await page.evaluate(()=>window.logoutClicks||0),0);done('Reads the confirmed leftContents/vertical/font DOM with DIV-image logout without clicking it');
  await page.setContent(shell('測<br>試<br>乙'));assert.equal((await read()).pharmacist.name,'測試乙');done('Line breaks and fullwidth whitespace in the sidebar are normalized');
  await page.setContent(shell('測試甲','<span>另一側欄名字</span><div id="vertical" style="display:none"><font>隱藏姓名</font></div>'));assert.equal((await read()).pharmacist.name,'測試甲');done('Unrelated sidebar text, hidden fields and identically named patient-area elements are ignored');
  await page.setContent(shell('測試甲','<div id="vertical"><font>測試乙</font></div>'));assert.equal((await read()).pharmacist.status,'ambiguous');assert.equal((await read()).pharmacist.name,'');done('Conflicting names in the exact login field fail closed');
  await page.setContent(shell('　'));assert.equal((await read()).pharmacist.status,'missing');done('An empty login field does not infer a name from nearby text');
  await page.setContent(shell('測試甲'));
  await page.evaluate(()=>{document.querySelector('#Logout').remove();document.querySelector('#leftContents').style.cssText='position:absolute;top:300px;left:400px;width:19px;height:70px';});assert.equal((await read()).pharmacist.name,'測試甲');done('Name extraction is independent of logout labels and screen coordinates');
  await page.setContent(shell('測試甲')+'<input type="password">');assert.equal((await read()).login,true);done('A login page does not supply a pharmacist');
  await page.setContent(shell('測試丙'));await page.evaluate(()=>document.querySelector('#leftContents #vertical').innerHTML='測<br>試<br>丙');assert.equal((await read()).pharmacist.name,'測試丙');done('The same verified field supports text nodes without a FONT wrapper');
  await page.setContent('<button>登出</button><span>測試甲</span>');assert.equal((await read()).pharmacist.status,'missing');done('Without the confirmed field, nearby name-like text is never guessed');
  const engineResult=await page.evaluate(async()=>{
    const {PortalEngine}=await import('/extension/engine.js');let response=[],target;
    const api={tabs:{get:async()=>({url:'https://portal.example.test/query'})},scripting:{executeScript:async p=>{target=p.target;return response;}}};
    const e=new PortalEngine({sourceId:7,origin:'https://portal.example.test',api});
    response=[{frameId:0,result:{ok:true,pharmacist:{name:'',status:'missing'}}},{frameId:2,result:{ok:true,pharmacist:{name:'測試甲',status:'found'}}}];const found=await e.readPharmacist();
    response.push({frameId:3,result:{ok:true,pharmacist:{name:'測試乙',status:'found'}}});const conflict=await e.readPharmacist();return{found,conflict,target};
  });assert.equal(engineResult.found.name,'測試甲');assert.equal(engineResult.conflict.status,'ambiguous');assert.equal(engineResult.target.allFrames,true);done('A sibling frame can supply the name; conflicting frames are rejected');
  fs.writeFileSync(path.join(root,'docs/pharmacist-browser-results.json'),JSON.stringify({passed:checks.length,scope:'User-confirmed sidebar DOM reproduced with synthetic names, plus simulated frame results; not live hospital access',checks},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
