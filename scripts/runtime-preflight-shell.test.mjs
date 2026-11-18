import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {validateRuntimeSecretNames} from './check-runtime-secrets.mjs';
const required=['AUTH_SECRET','BOOTSTRAP_ADMIN_EMAIL','EMAIL_FROM','EMAIL_PROVIDER','REGISTRATION_ENABLED','RESEND_API_KEY'];
const complete=()=>required.map(name=>({name,type:'secret_text'}));

test('name/type validator never inspects values and preserves the separately approved EMAIL-binding option',()=>{
 const entries=complete();
 for(const entry of entries)for(const key of ['value','text'])Object.defineProperty(entry,key,{get(){throw Error('value must not be inspected');}});
 assert.deepEqual(validateRuntimeSecretNames(entries,{}),required);
 assert.deepEqual(validateRuntimeSecretNames(entries.filter(e=>e.name!=='RESEND_API_KEY'),{send_email:[{name:'EMAIL'}]}),required.slice(0,-1));
 assert.throws(()=>validateRuntimeSecretNames(entries.filter(e=>e.name!=='RESEND_API_KEY'),{send_email:[{name:'OTHER'}]}));
});
for(const name of required)test(`name/type validator rejects non-secret binding ${name}`,()=>{
 const entries=complete();entries.find(e=>e.name===name).type='plain_text';assert.throws(()=>validateRuntimeSecretNames(entries,{}),/unexpected type/);
});
test('name/type validator fails closed for duplicate or malformed metadata without echoing it',()=>{
 const marker='DO_NOT_LOG_PRIVATE_VALUE';
 for(const entries of [null,{},42,[...complete(),complete()[0]],[...complete(),{name:'bad '+marker,type:'secret_text'}],[...complete(),{name:'OTHER',type:'bad '+marker}],[null],[[]],[42],[{name:'AUTH_SECRET'}],[{name:42,type:'secret_text'}],[{name:'AUTH_SECRET',type:42}],Array(1001).fill({name:'OTHER',type:'secret_text'})]){
  assert.throws(()=>validateRuntimeSecretNames(entries,{}),error=>!String(error).includes(marker));
 }
});

function shellFixture(t,{entries=complete(),raw,lookupExit=0,token='synthetic-cloudflare-token'}={}){
 const root=mkdtempSync(join(tmpdir(),'lab-readonly-upgrade-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const events=join(root,'events'),bin=join(root,'bin'),input=join(root,'input.json');
 mkdirSync(bin);mkdirSync(join(root,'node_modules','.bin'),{recursive:true});
 writeFileSync(input,raw===undefined?JSON.stringify(entries):raw);
 writeFileSync(join(root,'wrangler.jsonc'),readFileSync(new URL('../wrangler.jsonc',import.meta.url)));
 writeFileSync(join(bin,'node'),`#!/bin/bash
case "$1" in
 scripts/check-runtime-secrets.mjs) echo CHECK_RUNTIME >> "$TEST_EVENTS"; shift; exec "$TEST_NODE" "$TEST_CHECKER" "$@" ;;
 scripts/report-recovery-bookmark.mjs) echo REPORT_RECOVERY >> "$TEST_EVENTS"; shift; exec "$TEST_NODE" "$TEST_REPORTER" "$@" ;;
 *) echo UNEXPECTED_NODE >> "$TEST_EVENTS"; exit 70 ;;
esac
`,{mode:0o700});
 writeFileSync(join(root,'node_modules','.bin','wrangler'),`#!/bin/bash
case "$*" in
 'secret list --config wrangler.jsonc') echo SECRET_LIST >> "$TEST_EVENTS"; cat "$TEST_METADATA"; exit "$TEST_LOOKUP_EXIT" ;;
 'd1 time-travel info DB --json --config wrangler.jsonc') echo RECOVERY_INFO >> "$TEST_EVENTS"; printf '{"bookmark":"00000001-00000002-deadbeef"}'; exit 0 ;;
 'd1 migrations apply DB --remote --config wrangler.jsonc') echo MIGRATIONS >> "$TEST_EVENTS"; exit 0 ;;
 'deploy --config wrangler.jsonc') echo DEPLOY >> "$TEST_EVENTS"; exit 0 ;;
 *) echo UNEXPECTED_WRANGLER >> "$TEST_EVENTS"; exit 70 ;;
esac
`,{mode:0o700});
 const workflow=readFileSync(new URL('../.github/workflows/cloudflare.yml',import.meta.url),'utf8');
 const step=workflow.slice(workflow.indexOf('      - name: Migrate approved D1 and deploy account Worker using locked Wrangler'));
 const shell=step.split('        run: |\n')[1].split('\n').map(line=>line.replace(/^          /,'')).join('\n');
 const result=spawnSync('/bin/bash',['-c',shell],{cwd:root,encoding:'utf8',timeout:30000,env:{PATH:`${bin}:${dirname(process.execPath)}:/usr/bin:/bin`,CLOUDFLARE_API_TOKEN:token,RUNNER_TEMP:root,GITHUB_STEP_SUMMARY:join(root,'summary'),GITHUB_SHA:'a'.repeat(40),TEST_EVENTS:events,TEST_NODE:process.execPath,TEST_METADATA:input,TEST_LOOKUP_EXIT:String(lookupExit),TEST_CHECKER:fileURLToPath(new URL('./check-runtime-secrets.mjs',import.meta.url)),TEST_REPORTER:fileURLToPath(new URL('./report-recovery-bookmark.mjs',import.meta.url))}});
 assert.equal(result.error,undefined);
 assert.ok(!`${result.stdout}${result.stderr}`.includes('synthetic-cloudflare-token'));
 assert.ok(!`${result.stdout}${result.stderr}`.includes('DO_NOT_LOG'));
 return {...result,events:existsSync(events)?readFileSync(events,'utf8').trim().split('\n'):[],hasSummary:existsSync(join(root,'summary'))};
}
for(const missing of required)test(`actual deployment shell stops missing ${missing} after read-only lookup`,t=>{
 const r=shellFixture(t,{entries:complete().filter(e=>e.name!==missing)});
 assert.equal(r.status,1);assert.deepEqual(r.events,['SECRET_LIST','CHECK_RUNTIME']);assert.equal(r.hasSummary,false);
});
for(const [name,options]of [
 ['wrong required type',{entries:complete().map(e=>e.name==='AUTH_SECRET'?{...e,type:'plain_text'}:e)}],
 ['duplicate required name',{entries:[...complete(),complete()[0]]}],
 ['malformed secret metadata',{entries:{private:'DO_NOT_LOG_PRIVATE_VALUE'}}],
 ['invalid JSON',{raw:'{"DO_NOT_LOG_PRIVATE_VALUE": INVALID'}]
])test(`actual deployment shell stops ${name} without recovery/migration/deploy`,t=>{
 const r=shellFixture(t,options);assert.equal(r.status,1);assert.deepEqual(r.events,['SECRET_LIST','CHECK_RUNTIME']);assert.equal(r.hasSummary,false);
});
test('actual deployment shell rejects failed read-only lookup before checker or remote writes',t=>{
 const r=shellFixture(t,{lookupExit:23});assert.equal(r.status,23);assert.deepEqual(r.events,['SECRET_LIST']);assert.equal(r.hasSummary,false);
});
test('actual deployment shell rejects missing token before lookup',t=>{
 const r=shellFixture(t,{token:''});assert.equal(r.status,1);assert.deepEqual(r.events,[]);assert.equal(r.hasSummary,false);
});
test('actual deployment shell keeps recovery/migration/deploy ordering without injecting or syncing private values',t=>{
 const r=shellFixture(t);assert.equal(r.status,0);assert.deepEqual(r.events,['SECRET_LIST','CHECK_RUNTIME','RECOVERY_INFO','REPORT_RECOVERY','MIGRATIONS','DEPLOY']);assert.equal(r.hasSummary,true);
});
