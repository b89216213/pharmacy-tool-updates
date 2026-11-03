// Browser fixtures are synthetic. No actual Portal accounts or patient data.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+'/')||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_PATH,args:['--single-process','--no-zygote','--in-process-gpu','--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1763,height:904}}),base=`http://127.0.0.1:${server.address().port}`;
 const done=s=>{checks.push(s);console.log('PASS',s);};
 const shell=(name,extra='')=>`<style>body{margin:0;font:18px sans-serif}#side{position:absolute;left:0;top:100px;width:26px}#out{height:64px;width:26px;padding:0;white-space:normal}#user{display:block;width:26px;overflow-wrap:anywhere;margin-top:12px;line-height:30px}</style><div id="side"><button id="out">登<br>出</button><span id="user">${name}</span>${extra}</div><main style="margin-left:210px"><div id="NTUHWeb1_InPatientNavigatorBox_QueryInPatientBox_divInPatientListBox"><span>病人姓名：測試病人</span><table><tr><td>另一病人</td></tr></table></div></main>`;
 const read=()=>page.evaluate(async()=>{const {portalBridge}=await import('/extension/bridge.js');return portalBridge('readPharmacist');});
 try{
  await page.goto(base+'/extension/patch-tool.json');
  await page.setContent(shell('測試甲'));assert.deepEqual((await read()).pharmacist,{name:'測試甲',status:'found'});done('Reads a narrow vertical login name immediately below logout');
  await page.setContent(shell('測<br>試<br>乙'));assert.equal((await read()).pharmacist.name,'測試乙');done('Line breaks and fullwidth whitespace in the sidebar are normalized');
  await page.setContent(shell('測試甲','<span style="display:none">隱藏姓名</span>'));assert.equal((await read()).pharmacist.name,'測試甲');done('Hidden names and patient names in the query area are ignored');
  await page.setContent(shell('測試甲','<span style="display:block;position:absolute;left:35px;top:78px">測試乙</span>'));assert.equal((await read()).pharmacist.status,'ambiguous');assert.equal((await read()).pharmacist.name,'');done('Conflicting visible names fail closed instead of picking one');
  await page.setContent(shell('查詢處理'));assert.equal((await read()).pharmacist.status,'missing');done('Navigation labels are not treated as pharmacist names');
  await page.setContent(shell('測試甲'));
  await page.evaluate(()=>document.querySelector('#out').remove());assert.equal((await read()).pharmacist.status,'missing');done('Without the login-sidebar anchor, no name is inferred');
  await page.setContent(shell('測試甲')+'<input type="password">');assert.equal((await read()).login,true);done('A login page does not supply a pharmacist');
  await page.setContent('<style>body{margin:0;font:18px sans-serif;line-height:30px}</style><button style="width:26px;height:64px">登出</button><br>測<br>試<br>丙');assert.equal((await read()).pharmacist.name,'測試丙');done('Legacy bare text nodes separated by BR are read as one name');
  const engineResult=await page.evaluate(async()=>{
    const {PortalEngine}=await import('/extension/engine.js');let response=[],target;
    const api={tabs:{get:async()=>({url:'https://portal.example.test/query'})},scripting:{executeScript:async p=>{target=p.target;return response;}}};
    const e=new PortalEngine({sourceId:7,origin:'https://portal.example.test',api});
    response=[{frameId:0,result:{ok:true,pharmacist:{name:'',status:'missing'}}},{frameId:2,result:{ok:true,pharmacist:{name:'測試甲',status:'found'}}}];const found=await e.readPharmacist();
    response.push({frameId:3,result:{ok:true,pharmacist:{name:'測試乙',status:'found'}}});const conflict=await e.readPharmacist();return{found,conflict,target};
  });assert.equal(engineResult.found.name,'測試甲');assert.equal(engineResult.conflict.status,'ambiguous');assert.equal(engineResult.target.allFrames,true);done('A sibling frame can supply the name; conflicting frames are rejected');
  fs.writeFileSync(path.join(root,'docs/pharmacist-browser-results.json'),JSON.stringify({passed:checks.length,scope:'Synthetic sidebar DOM and frame results, not the live hospital Portal',checks},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
