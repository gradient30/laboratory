import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {syncAccountRuntime} from './account-runtime-config.mjs';
const account='69aa667ac081ed9ddac1e04d0822f164',worker='little-lab-30-q7r8';
const endpoint=`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}/secrets`;
const authMetadata=[{name:'AUTH_SECRET',type:'secret_text'}];
const approvedNames=['RESEND_API_KEY','EMAIL_FROM','BOOTSTRAP_ADMIN_EMAIL','EMAIL_PROVIDER','REGISTRATION_ENABLED'];
function fixture(){
 const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 const policy=JSON.parse(readFileSync(new URL('../.github/deployment-policy.json',import.meta.url),'utf8'));
 policy.enabled=true;policy.runtimeApproved=true;policy.database.id='11111111-2222-4333-8444-555555555555';config.d1_databases[0].database_id=policy.database.id;
 const env={GITHUB_ACTIONS:'true',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'gradient30/laboratory',GITHUB_SHA:'a'.repeat(40),CLOUDFLARE_ACCOUNT_ID:account,CLOUDFLARE_API_TOKEN:'synthetic-cloudflare-token',RESEND_API_KEY:'re_synthetic_test_key_only',BOOTSTRAP_ADMIN_EMAIL:'owner@qa.test',EMAIL_FROM:'Little Lab <lab@qa.test>'};
 return{policy,config,env};
}
function mock(metadata=authMetadata){const requests=[];return{requests,fetchImpl:async(url,init)=>{requests.push({url,...init,body:init.body?JSON.parse(init.body):undefined});return{ok:true,json:async()=>({success:true,result:init.method==='GET'?metadata:{name:JSON.parse(init.body).name,type:'secret_text'}})};}};}
function run(f=fixture(),m=mock()){return syncAccountRuntime({...f,...m});}
function onlyNameLookup(requests){
 assert.equal(requests.length,1);
 assert.equal(requests[0].url,endpoint);
 assert.equal(requests[0].method,'GET');
 assert.equal(requests[0].body,undefined);
 assert.equal(requests[0].redirect,'error');
}
test('first activation is not an upgrade fallback: missing auth secret stops after name-only GET',async()=>{
 for(const metadata of [[],[{name:'OTHER_PROJECT_SECRET',type:'secret_text'}]]){
  const m=mock(metadata);await assert.rejects(run(fixture(),m),/Required AUTH_SECRET is missing; no changes made/);onlyNameLookup(m.requests);
 }
});
test('existing authentication secret is never read, generated or overwritten; only exact approved names are synchronized',async()=>{
 const f=fixture(),auth={name:'AUTH_SECRET',type:'secret_text'};
 Object.defineProperty(auth,'text',{get(){throw Error('must not read secret value');}});
 Object.defineProperty(f.env,'AUTH_SECRET',{get(){throw Error('must not read signing key from environment');}});
 const m=mock([auth,{name:'OTHER_PROJECT_SECRET',type:'secret_text'}]);
 const result=await run(f,m);
 assert.deepEqual(result,{installedNames:approvedNames,authSecretCreated:false});
 assert.equal(m.requests.length,6);
 for(const r of m.requests){assert.equal(r.url,endpoint);assert.equal(r.redirect,'error');assert.equal(r.headers.Authorization,'Bearer synthetic-cloudflare-token');}
 assert.equal(m.requests[0].method,'GET');assert.equal(m.requests[0].body,undefined);
 assert.deepEqual(m.requests.slice(1).map(r=>r.method),Array(5).fill('PUT'));
 assert.deepEqual(m.requests.slice(1).map(r=>r.body),[
  {name:'RESEND_API_KEY',text:f.env.RESEND_API_KEY,type:'secret_text'},
  {name:'EMAIL_FROM',text:f.env.EMAIL_FROM,type:'secret_text'},
  {name:'BOOTSTRAP_ADMIN_EMAIL',text:f.env.BOOTSTRAP_ADMIN_EMAIL,type:'secret_text'},
  {name:'EMAIL_PROVIDER',text:'resend',type:'secret_text'},
  {name:'REGISTRATION_ENABLED',text:'true',type:'secret_text'}
 ]);
 for(const name of ['CLOUDFLARE_API_TOKEN','RESEND_API_KEY','EMAIL_FROM','BOOTSTRAP_ADMIN_EMAIL'])assert.ok(!JSON.stringify(result).includes(f.env[name]));
});
for(const name of ['RESEND_API_KEY','EMAIL_FROM','BOOTSTRAP_ADMIN_EMAIL','CLOUDFLARE_API_TOKEN'])test(`missing ${name} fails before network; no public vars fallback`,async()=>{const f=fixture(),m=mock();delete f.env[name];f.env[`VARS_${name}`]='must-not-use';await assert.rejects(run(f,m));assert.equal(m.requests.length,0);});
for(const mutate of [f=>f.policy.enabled=false,f=>f.policy.runtimeApproved=false,f=>f.env.GITHUB_REF='refs/heads/feature',f=>f.env.GITHUB_ACTIONS='false',f=>f.env.GITHUB_EVENT_NAME='pull_request',f=>f.policy.database.id=f.config.d1_databases[0].database_id='00000000-0000-0000-0000-000000000000',f=>f.policy.accountId=f.env.CLOUDFLARE_ACCOUNT_ID='f'.repeat(32),f=>f.policy.workerName=f.config.name='other-worker',f=>f.policy.repository=f.env.GITHUB_REPOSITORY='other/repo'])test('unapproved target or execution context is blocked before network',async()=>{const f=fixture(),m=mock();mutate(f);await assert.rejects(run(f,m));assert.equal(m.requests.length,0);});
for(const[name,value]of [['BOOTSTRAP_ADMIN_EMAIL','owner@qa.test\nInjected'],['BOOTSTRAP_ADMIN_EMAIL','DO_NOT_LOG_INVALID_EMAIL'],['EMAIL_FROM','Lab <invalid>'],['EMAIL_FROM','lab@qa.test\rX: injected'],['RESEND_API_KEY',' bad key ']])test('invalid private input fails without echoing value or making requests',async()=>{const f=fixture(),m=mock();f.env[name]=value;await assert.rejects(run(f,m),e=>!e.message.includes(value));assert.equal(m.requests.length,0);});
test('secret-list failure or bad metadata blocks all writes',async()=>{
 for(const data of [{success:false,errors:[{message:'DO_NOT_LOG'}]},...[null,{}, {name:'AUTH_SECRET'},[null],[[]],[42],[{name:42,type:'secret_text'}],[{name:'',type:'secret_text'}],[{name:' AUTH_SECRET',type:'secret_text'}],[{name:'AUTH_SECRET'}],[{name:'AUTH_SECRET',type:42}],[{name:'AUTH_SECRET',type:''}],[{name:'AUTH_SECRET',type:'secret_text '}],[...authMetadata,...authMetadata],[...authMetadata,{name:'AUTH_SECRET',type:'secret_key'}],[...authMetadata,{name:'OTHER_SECRET',type:null}]].map(result=>({success:true,result}))]){
  let count=0;await assert.rejects(run(fixture(),{fetchImpl:async()=>{count++;return Response.json(data);}}),e=>!e.message.includes('DO_NOT_LOG'));assert.equal(count,1);
 }
});
test('unexpected existing auth binding type blocks writes',async()=>{const m=mock([{name:'AUTH_SECRET',type:'secret_key'}]);await assert.rejects(run(fixture(),m),/unexpected type; no changes made/);onlyNameLookup(m.requests);});
test('network failure cannot expose token or response details',async()=>{await assert.rejects(run(fixture(),{fetchImpl:async()=>{throw Error('DO_NOT_LOG_PRIVATE_VALUE');}}),e=>!e.message.includes('DO_NOT_LOG'));});
test('partial approved-config failure stops immediately; no deletion or restore attempted',async()=>{const calls=[];await assert.rejects(run(fixture(),{fetchImpl:async(url,init)=>{calls.push(init);return Response.json(calls.length===1?{success:true,result:authMetadata}:{success:false,errors:[{message:'DO_NOT_LOG'}]});}}),e=>!e.message.includes('DO_NOT_LOG'));assert.deepEqual(calls.map(c=>c.method),['GET','PUT']);assert.equal(JSON.parse(calls[1].body).name,'RESEND_API_KEY');});
test('production workflow stops missing-key upgrade before entropy, any PUT, Wrangler, migration or deploy',t=>{
 const root=mkdtempSync(join(tmpdir(),'lab-upgrade-preflight-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const f=fixture(),events=join(root,'events'),bin=join(root,'bin');
 mkdirSync(join(root,'.github'));mkdirSync(bin);mkdirSync(join(root,'node_modules','.bin'),{recursive:true});
 writeFileSync(join(root,'.github','deployment-policy.json'),JSON.stringify(f.policy));writeFileSync(join(root,'wrangler.jsonc'),JSON.stringify(f.config));
 const preload=join(root,'mock-runtime.mjs');
 writeFileSync(preload,`import crypto from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
import {appendFileSync} from 'node:fs';
const record=event=>appendFileSync(process.env.TEST_EVENTS,event+'\\n');
crypto.randomBytes=()=>{record('ENTROPY');throw Error('DO_NOT_LOG_ENTROPY_FAILURE');};
syncBuiltinESMExports();
globalThis.fetch=async(url,init)=>{
 record(init.method);
 if(url!==${JSON.stringify(endpoint)}||init.method!=='GET'||init.body!==undefined)throw Error('DO_NOT_LOG_UNEXPECTED_REQUEST');
 return {ok:true,json:async()=>({success:true,result:[]})};
};\n`);
 writeFileSync(join(bin,'node'),'#!/bin/bash\nif [[ "$1" != "scripts/account-runtime-config.mjs" ]]; then\n  echo UNEXPECTED_NODE >> "$TEST_EVENTS"\n  exit 70\nfi\nexec "$TEST_NODE" --import "$TEST_PRELOAD" "$TEST_HELPER"\n',{mode:0o700});
 writeFileSync(join(root,'node_modules','.bin','wrangler'),'#!/bin/bash\necho WRANGLER >> "$TEST_EVENTS"\nexit 70\n',{mode:0o700});
 const workflow=readFileSync(new URL('../.github/workflows/cloudflare.yml',import.meta.url),'utf8');
 const step=workflow.slice(workflow.indexOf('      - name: Migrate approved D1 and deploy account Worker using locked Wrangler'));
 assert.ok(step.includes('        run: |\n'));
 const shell=step.split('        run: |\n')[1].split('\n').map(line=>line.replace(/^          /,'')).join('\n');
 const result=spawnSync('/bin/bash',['-c',shell],{cwd:root,encoding:'utf8',timeout:30000,env:{...f.env,PATH:`${bin}:${dirname(process.execPath)}:/usr/bin:/bin`,RUNNER_TEMP:root,GITHUB_STEP_SUMMARY:join(root,'summary'),TEST_EVENTS:events,TEST_NODE:process.execPath,TEST_PRELOAD:preload,TEST_HELPER:fileURLToPath(new URL('./account-runtime-config.mjs',import.meta.url))}});
 assert.equal(result.error,undefined);assert.equal(result.status,1);assert.equal(result.stdout,'');
 assert.match(result.stderr,/Private runtime configuration stopped/);
 assert.deepEqual(readFileSync(events,'utf8').trim().split('\n'),['GET']);
 assert.equal(existsSync(join(root,'summary')),false);
 for(const name of ['CLOUDFLARE_API_TOKEN','RESEND_API_KEY','EMAIL_FROM','BOOTSTRAP_ADMIN_EMAIL'])assert.ok(!`${result.stdout}${result.stderr}`.includes(f.env[name]));
 assert.ok(!`${result.stdout}${result.stderr}`.includes('DO_NOT_LOG'));
});
