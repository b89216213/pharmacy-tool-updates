import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {validatePackage,sha256,applyPackage,verifyDirectory,readFile} from '../extension/update-core.js';
import {parseIndex,githubFile} from '../extension/update-network.js';
const root=new URL('../extension/',import.meta.url),manifest=JSON.parse(await fs.readFile(new URL('manifest.json',root),'utf8'));
const packageURL=new URL('../release/'+manifest.version+'.json',import.meta.url);
const pkg=JSON.parse(await fs.readFile(packageURL,'utf8'));
const nextVersion=manifest.version.split('.').map((part,index,parts)=>index===parts.length-1?String(Number(part)+1):part).join('.');
async function repack(p,path,value){const bytes=Buffer.from(JSON.stringify(value));const f=p.files.find(f=>f.path===path);Object.assign(f,{size:bytes.length,sha256:await sha256(bytes),base64:bytes.toString('base64')});}
async function newer(){const p=structuredClone(pkg);p.version=nextVersion;await repack(p,'manifest.json',{...manifest,version:nextVersion});return p;}
class Directory{
 constructor(files=new Map(),prefix='',control={writes:[],fail:null}){this.files=files;this.prefix=prefix;this.control=control;this.name='extension';}
 async getDirectoryHandle(name){return new Directory(this.files,this.prefix+name+'/',this.control);}
 async getFileHandle(name,{create=false}={}){
  const path=this.prefix+name,files=this.files,control=this.control;
  if(!files.has(path)&&!create)throw Object.assign(Error('missing'),{name:'NotFoundError'});
  return {async getFile(){if(!files.has(path))throw Object.assign(Error('missing'),{name:'NotFoundError'});return {arrayBuffer:async()=>Uint8Array.from(files.get(path)).buffer};},async createWritable(){let staged;return {async write(bytes){staged=Uint8Array.from(bytes);},async close(){if(control.fail===path){control.fail=null;throw Error('Synthetic disk failure');}control.writes.push(path);files.set(path,staged);},async abort(){}};}};
 }
 async removeEntry(name){this.files.delete(this.prefix+name);}
}
test('published package, announcement and extracted source bytes match',async()=>{
 await validatePackage(pkg,manifest,{allowSame:true});
 const release=parseIndex(await fs.readFile(new URL('../release/latest.json',import.meta.url)));
 const bytes=await fs.readFile(packageURL);assert.equal(await sha256(bytes),release.sha256);assert.equal(bytes.length,release.size);
 for(const f of pkg.files)assert.deepEqual(await fs.readFile(new URL(f.path,root)),Buffer.from(f.base64,'base64'));
});
test('wrong tool, same version, tampering, traversal and new permissions are rejected',async()=>{
 await assert.rejects(validatePackage(pkg,manifest));
 const p=await newer();await validatePackage(p,manifest);
 for(const change of [x=>x.toolId='ntuh-patch-recovery',x=>x.files[0].sha256='0'.repeat(64),x=>x.files[0].path='../outside.js',x=>x.files.push(x.files[0])]){const bad=structuredClone(p);change(bad);await assert.rejects(validatePackage(bad,manifest));}
 const access=structuredClone(p);await repack(access,'manifest.json',{...manifest,version:nextVersion,permissions:[...manifest.permissions,'management']});await assert.rejects(validatePackage(access,manifest),/額外權限/);
 await assert.rejects(githubFile('updates/patch-recovery/latest.json'));await assert.rejects(githubFile('updates/pharmacy-toolbox/../latest.json'));
});
test('folder proof rejects an identical copy and cleans temporary files',async()=>{
 const data=new Map([['manifest.json',Buffer.from(JSON.stringify(manifest))]]),installed=new Directory(data),copy=new Directory(new Map(data));
 await verifyDirectory(installed,manifest,p=>readFile(installed,p));
 await assert.rejects(verifyDirectory(copy,manifest,p=>readFile(installed,p)));
 assert.deepEqual([...data.keys()],['manifest.json']);assert.deepEqual([...copy.files.keys()],['manifest.json']);
});
test('journal is durable before any write; successful update commits manifest last',async()=>{
 const v=await validatePackage(await newer(),manifest),original=new Map(pkg.files.map(f=>[f.path,Buffer.from(f.base64,'base64')]));
 const failDir=new Directory(new Map(original));await assert.rejects(applyPackage(failDir,v,{saveJournal:async()=>{throw Error('Synthetic journal failure');},clearJournal:async()=>{}}));assert.equal(failDir.control.writes.length,0);
 const dir=new Directory(new Map(original));let journal;
 await applyPackage(dir,v,{saveJournal:async value=>{if(value.phase==='writing')assert.equal(dir.control.writes.length,0);journal=structuredClone(value);},clearJournal:async()=>{journal=null;}});
 assert.equal(journal.phase,'written');assert.equal(dir.control.writes.at(-1),'manifest.json');assert.equal(JSON.parse(Buffer.from(dir.files.get('manifest.json'))).version,nextVersion);
});
test('partial disk-write failure restores every original file',async()=>{
 const v=await validatePackage(await newer(),manifest),original=new Map(pkg.files.map(f=>[f.path,Buffer.from(f.base64,'base64')]));
 original.set('manager.js',Buffer.from('// synthetic previous manager'));
 const dir=new Directory(new Map(original));let journal;
 dir.control.fail='manifest.json';
 await assert.rejects(applyPackage(dir,v,{saveJournal:async j=>{journal=structuredClone(j);},clearJournal:async()=>{journal=null;}}),/已還原/);
 assert.equal(journal,null);for(const [key,value]of original)assert.deepEqual(Buffer.from(dir.files.get(key)),value);
});
