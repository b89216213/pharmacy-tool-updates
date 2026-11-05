import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const baseline={'workflow.js':'38042a3e1171308ca3325113f122e618deac74f4','page-bridge.js':'a01a961ae73180698e70a6c6d40035e3b7df6f76'};
for(const [name,sha] of Object.entries(baseline)){const bytes=await fs.readFile(new URL('../extension/'+name,import.meta.url));assert.equal(createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'),sha);}
for(const file of await fs.readdir(new URL('../extension/',import.meta.url)))if(file.endsWith('.js'))execFileSync(process.execPath,['--check',fileURLToPath(new URL('../extension/'+file,import.meta.url))]);
for(const test of ['status-checks.mjs','managed-checks.mjs','controller-checks.mjs','launch-checks.cjs'])execFileSync(process.execPath,[fileURLToPath(new URL(test,import.meta.url))],{stdio:'inherit'});
console.log('Status regressions passed; workflow and page bridge remain byte-identical to v1.0.2.');
