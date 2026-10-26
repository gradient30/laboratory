import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const required=['AUTH_SECRET','BOOTSTRAP_ADMIN_EMAIL','EMAIL_FROM','EMAIL_PROVIDER','REGISTRATION_ENABLED','RESEND_API_KEY'];
function run(script,data){const dir=mkdtempSync(join(tmpdir(),'lab-preflight-'));try{const file=join(dir,'input.json'),summary=join(dir,'summary');writeFileSync(file,JSON.stringify(data));const result=spawnSync(process.execPath,[script,file],{encoding:'utf8',env:{...process.env,GITHUB_STEP_SUMMARY:summary}});return{...result,summary:result.status===0&&script.includes('bookmark')?readFileSync(summary,'utf8'):''};}finally{rmSync(dir,{recursive:true,force:true});}}
test('runtime preflight accepts required names without exposing values',()=>{const r=run('scripts/check-runtime-secrets.mjs',required.map(name=>({name,type:'secret_text',value:'DO_NOT_LOG_SYNTHETIC_VALUE'})));assert.equal(r.status,0);assert.ok(!r.stdout.includes('DO_NOT_LOG'));});
for(const missing of required)test(`runtime preflight blocks missing ${missing}`,()=>{const r=run('scripts/check-runtime-secrets.mjs',required.filter(n=>n!==missing).map(name=>({name})));assert.notEqual(r.status,0);});
test('runtime preflight blocks malformed name metadata',()=>assert.notEqual(run('scripts/check-runtime-secrets.mjs',{name:'AUTH_SECRET'}).status,0));
test('recovery reporter records only validated bookmark',()=>{const r=run('scripts/report-recovery-bookmark.mjs',{bookmark:'00000001-00000002-deadbeef',other:'DO_NOT_LOG_SYNTHETIC_VALUE'});assert.equal(r.status,0);assert.match(r.summary,/00000001-00000002-deadbeef/);assert.ok(!r.stdout.includes('DO_NOT_LOG'));});
for(const data of [{},{bookmark:'bad\nInjected text'},{bookmark:42}])test('missing or invalid recovery bookmark blocks migration',()=>assert.notEqual(run('scripts/report-recovery-bookmark.mjs',data).status,0));
