// Validate the actual published package with the previous production updater.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),os=require('node:os'),{pathToFileURL}=require('node:url');
(async()=>{
 const project=path.resolve(__dirname,'..'),repo=path.resolve(project,'../..');
 const previous=JSON.parse(await fs.readFile(path.join(repo,'updates/patch-recovery/packages/1.5.5.json'),'utf8'));
 const bytes=await fs.readFile(path.join(repo,'updates/patch-recovery/packages/1.6.0.json'));
 const pkg=JSON.parse(bytes),latest=JSON.parse(await fs.readFile(path.join(repo,'updates/patch-recovery/latest.json'),'utf8'));
 const oldFile=n=>Buffer.from(previous.files.find(f=>f.path===n).base64,'base64');
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'patch-release-'));
 try{
  await fs.writeFile(path.join(temp,'update-core.mjs'),oldFile('update-core.js'));
  const old=await import(pathToFileURL(path.join(temp,'update-core.mjs'))),current=JSON.parse(oldFile('manifest.json')),checks=[];
  const pass=s=>{checks.push(s);console.log('PASS',s);};
  assert.equal(latest.sha256,await old.sha256(bytes));assert.equal(latest.size,bytes.length);assert.equal(latest.version,pkg.version);const valid=await old.validatePackage(pkg,current);pass('Full v1.6.0 update is accepted by the exact v1.5.5 updater with matching index hash and length');
  for(const f of pkg.files)assert.deepEqual(Buffer.from(f.base64,'base64'),await fs.readFile(path.join(project,'extension',f.path)));
  assert(pkg.files.some(f=>f.path==='registration.css'));assert(!pkg.files.some(f=>/demo|test/i.test(f.path)));const next=JSON.parse(Buffer.from(pkg.files.find(f=>f.path==='manifest.json').base64,'base64'));const strip=x=>{const{version,version_name,...rest}=x;return rest;};assert.deepEqual(strip(next),strip(current));pass('Every packaged byte matches production source; extension identity, permissions and CSP are unchanged');
  for(const name of ['model.js','core.js','engine.js','bridge.js','excel.js','background.js','portal-connection.js','installation-config.js','installation-core.js','installation-ui.js','management-core.js','update-core.js','update-network.js','update-store.js','updater.js','patch-tool.json','app.css'])assert.deepEqual(oldFile(name),await fs.readFile(path.join(project,'extension',name)));
  pass('Original storage, Portal, pharmacist extraction, printing, Excel, background, installation and updater cores are byte-identical to production v1.5.5');
  const files=new Map(previous.files.map(f=>[f.path,Buffer.from(f.base64,'base64')]));files.set('user-backup.json',Buffer.from('LOCAL ONLY'));let journal;
  const missing=()=>Object.assign(Error('missing'),{name:'NotFoundError'});
  const dir=(prefix='')=>({name:'extension',kind:'directory',async getDirectoryHandle(n){return dir(prefix+n+'/');},async getFileHandle(n,{create=false}={}){const key=prefix+n;if(!files.has(key)){if(!create)throw missing();files.set(key,Buffer.alloc(0));}return {async getFile(){return new Blob([files.get(key)]);},async createWritable(){let data;return {async write(b){data=Buffer.from(b);},async close(){files.set(key,data);},async abort(){}};}};},async removeEntry(n){if(!files.delete(prefix+n))throw missing();}});
  await old.applyPackage(dir(),valid,{saveJournal:async j=>journal=j,clearJournal:async()=>{}});
  assert.equal(JSON.parse(files.get('manifest.json')).version,'1.6.0');assert.equal(files.get('user-backup.json').toString(),'LOCAL ONLY');for(const f of pkg.files)assert.deepEqual(files.get(f.path),Buffer.from(f.base64,'base64'));assert.equal(journal.phase,'written');pass('Old updater applies the complete release, journals original files and preserves unrelated local backup files');
  await fs.writeFile(path.join(project,'docs/release-check-results.json'),JSON.stringify({version:'1.6.0',previousVersion:'1.5.5',passed:checks.length,checks,files:pkg.files.length,packageBytes:bytes.length,sha256:latest.sha256},null,2));
 }finally{await fs.rm(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
