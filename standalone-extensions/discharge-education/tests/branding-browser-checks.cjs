const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ext=path.join(root,'discharge-extension');
const server=http.createServer((req,res)=>{const p=path.resolve(ext,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(ext+path.sep)||!fs.existsSync(p)){res.writeHead(404).end();return;}const mime={'.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.html':'text/html; charset=utf-8'};res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--in-process-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:930},timezoneId:'Asia/Taipei'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let releaseApp,appRequested;const gate=new Promise(r=>releaseApp=r),requested=new Promise(r=>appRequested=r);
  await page.route('**/app.js',async route=>{appRequested();await gate;await route.continue();});
  const navigation=page.goto(`http://127.0.0.1:${server.address().port}/tool.html`);navigation.catch(()=>{});
  await requested;
  await page.locator('main.shell').waitFor({state:'attached'});
  assert.equal(await page.locator('main.shell > header.top, .mark svg').count(),0);
  assert.equal(await page.locator('svg,img').evaluateAll(nodes=>nodes.some(el=>{const r=el.getBoundingClientRect();return r.width>128||r.height>128;})),false);
  console.log('PASS delayed application initialization has no full-screen legacy logo');
  releaseApp();await navigation;await page.locator('.brand-logo').waitFor();
  await page.waitForFunction(()=>document.querySelector('.brand-logo').complete&&document.querySelector('.brand-logo').naturalWidth>0);
  const b=await page.locator('.brand-logo').boundingBox();assert.equal(b.width,27);assert.equal(b.height,27);
  assert.equal(await page.locator('.brand-logo').count(),1);assert.equal(await page.locator('#inputTab').isVisible(),true);
  const manifest=JSON.parse(fs.readFileSync(path.join(ext,'manifest.json')));
  const refs=new Set([...Object.values(manifest.icons),...Object.values(manifest.action.default_icon),...await page.locator('link[rel="icon"]').evaluateAll(a=>a.map(el=>el.getAttribute('href')))]);
  for(const p of refs){const response=await page.request.get(`http://127.0.0.1:${server.address().port}/${p}`);assert.equal(response.status(),200);const buf=await response.body();assert.equal(buf.subarray(1,4).toString(),'PNG');}
  console.log('PASS fixed-size header logo and all toolbar, extension and window icon assets load');
  // CSS may arrive late or fail: intrinsic dimensions must still prevent enlargement.
  await page.evaluate(()=>document.querySelectorAll('link[rel="stylesheet"]').forEach(el=>el.remove()));
  const plain=await page.locator('.brand-logo').boundingBox();assert.equal(plain.width,27);assert.equal(plain.height,27);
  console.log('PASS logo stays 27px even without stylesheets');
  assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
