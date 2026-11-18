import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {diagnoseRuntime,namesAndTypes} from './diagnose-runtime-secrets.mjs';

const ACCOUNT='69aa667ac081ed9ddac1e04d0822f164';
const BASE=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/little-lab-30-q7r8`;
const GOOD='ce4d15b5-648e-4e51-a602-aeb4a696d2a9';
const CURRENT='11111111-1111-4111-8111-111111111111';
const LATEST='22222222-2222-4222-8222-222222222222';
const DEPLOYMENT='33333333-3333-4333-8333-333333333333';
const CREATED='2026-11-17T15:59:31.000Z';
const PRIVATE='DO_NOT_PRINT_SECRET_VALUE';
const env={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',GITHUB_REPOSITORY:'gradient30/laboratory',GITHUB_SHA:'a'.repeat(40),CLOUDFLARE_ACCOUNT_ID:ACCOUNT,CLOUDFLARE_API_TOKEN:PRIVATE};
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(overrides={}){
  const calls=[];let secretsRead=0;
  const secrets=[{name:'AUTH_SECRET',type:'secret_text',text:PRIVATE}];
  const data={
    '/secrets':secrets,
    '/deployments':{deployments:[{id:DEPLOYMENT,created_on:CREATED,author_email:PRIVATE,versions:[{version_id:CURRENT,percentage:100}]}]},
    '/versions':{items:[{id:LATEST,metadata:{created_on:CREATED,author_email:PRIVATE}}]},
    ...Object.fromEntries([GOOD,CURRENT,LATEST].map(id=>['/versions/'+id,{id,metadata:{created_on:CREATED,author_email:PRIVATE},resources:{bindings:[...secrets,{name:'DB',type:'d1',id:PRIVATE},{name:'APP_ORIGIN',type:'plain_text',text:PRIVATE}],script:{etag:PRIVATE}}}]))
  };
  Object.assign(data,overrides);
  return {calls,data,async fetchImpl(url,init){
    calls.push({url,init});assert.ok(url.startsWith(BASE+'/'));assert.equal(init.method,'GET');assert.equal(init.redirect,'error');assert.equal(init.body,undefined);assert.equal(init.headers.Authorization,'Bearer '+PRIVATE);assert.ok(init.signal instanceof AbortSignal);
    const path=url.slice(BASE.length);assert.ok(Object.hasOwn(data,path));
    const result=path==='/secrets'&&typeof data[path]==='function'?data[path](secretsRead++):data[path];
    return {ok:true,json:async()=>({success:true,result:clone(result),private:PRIVATE})};
  }};
}
const run=f=>diagnoseRuntime({env,fetchImpl:f.fetchImpl.bind(f),delay:async ms=>assert.equal(ms,3000),now:()=>new Date(CREATED)});

test('GET-only diagnosis compares deployed, latest uploaded and known-good bindings, stripping all values',async()=>{
  const f=fixture(),r=await run(f);
  assert.deepEqual(Object.keys(r),['observedAt','secretNamesBefore','secretNamesAfter','deployments','latestUploaded','inspectedVersions']);
  assert.equal(r.latestUploaded.id,LATEST);assert.equal(r.deployments[0].versions[0].version_id,CURRENT);
  assert.deepEqual(r.inspectedVersions.map(v=>v.id),[CURRENT,LATEST,GOOD]);
  assert.equal(f.calls.length,7);assert.equal(f.calls.filter(c=>c.url.endsWith('/secrets')).length,2);
  const serialized=JSON.stringify(r);assert.ok(!serialized.includes(PRIVATE));assert.ok(!serialized.includes('author_email'));assert.ok(!serialized.includes('etag'));
  assert.deepEqual(r.secretNamesAfter,[{name:'AUTH_SECRET',type:'secret_text'}]);
});
test('missing AUTH_SECRET is faithfully reported, never created or interpreted as a deployment pass',async()=>{
  const f=fixture({'/secrets':[]}),r=await run(f);assert.deepEqual(r.secretNamesBefore,[]);assert.deepEqual(r.secretNamesAfter,[]);assert.ok(!('passed' in r));
});
test('two different metadata reads remain visible instead of silently accepted as convergence',async()=>{
  const f=fixture({'/secrets':n=>n===0?[{name:'AUTH_SECRET',type:'secret_text'}]:[]}),r=await run(f);assert.equal(r.secretNamesBefore.length,1);assert.equal(r.secretNamesAfter.length,0);
});
test('same latest/deployed/good version is read once',async()=>{
  const f=fixture({'/deployments':{deployments:[{id:DEPLOYMENT,created_on:CREATED,versions:[{version_id:GOOD,percentage:100}]}]},'/versions':{items:[{id:GOOD,metadata:{created_on:CREATED}}]}}),r=await run(f);
  assert.equal(r.inspectedVersions.length,1);assert.equal(f.calls.length,5);
});
for(const [key,value] of Object.entries({GITHUB_ACTIONS:'false',GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/other',GITHUB_REPOSITORY:'other/repository',GITHUB_SHA:'invalid',CLOUDFLARE_ACCOUNT_ID:'other',CLOUDFLARE_API_TOKEN:''})){
  test('rejects unapproved '+key+' before network',async()=>{const f=fixture();await assert.rejects(diagnoseRuntime({env:{...env,[key]:value},fetchImpl:f.fetchImpl.bind(f)}));assert.equal(f.calls.length,0);});
}
test('rejects duplicate and untrusted binding names without printing content',()=>{
  for(const entries of [null,[{name:'AUTH_SECRET',type:'secret_text'},{name:'AUTH_SECRET',type:'secret_text'}],[{name:'::error::'+PRIVATE,type:'secret_text'}],[{name:'AUTH_SECRET',type:'bad\n'+PRIVATE}]] )assert.throws(()=>namesAndTypes(entries),e=>!e.message.includes(PRIVATE));
});
test('rejects redirected/error/malformed provider responses with fixed error only',async()=>{
  for(const fetchImpl of [async()=>{throw Error(PRIVATE)},async()=>({ok:false,json:async()=>({error:PRIVATE})}),async()=>({ok:true,json:async()=>{throw Error(PRIVATE)}}),async()=>({ok:true,json:async()=>({success:false,result:PRIVATE})})])await assert.rejects(diagnoseRuntime({env,fetchImpl}),e=>!e.message.includes(PRIVATE));
});
test('rejects invalid version ID before it can enter a request URL',async()=>{
  const f=fixture({'/versions':{items:[{id:'../../'+PRIVATE,metadata:{created_on:CREATED}}]}});await assert.rejects(run(f));assert.equal(f.calls.length,3);
});
test('rejects invalid deployed traffic and mismatched version response',async()=>{
  for(const f of [fixture({'/deployments':{deployments:[{id:DEPLOYMENT,created_on:CREATED,versions:[{version_id:CURRENT,percentage:99}]}]}}),fixture({['/versions/'+CURRENT]:{id:LATEST,metadata:{created_on:CREATED},resources:{bindings:[]}}})])await assert.rejects(run(f));
});
test('CLI failure emits no provider values or stack traces',()=>{
  const r=spawnSync(process.execPath,[fileURLToPath(new URL('./diagnose-runtime-secrets.mjs',import.meta.url))],{encoding:'utf8',env:{GITHUB_ACTIONS:'false',CLOUDFLARE_API_TOKEN:PRIVATE}});
  assert.equal(r.status,1);assert.equal(r.stdout,'');assert.equal(r.stderr,'Runtime metadata diagnosis stopped; no response details or credentials were logged.\n');
});
test('standalone workflow is manual-only, serialized, pinned, with token scoped to a single read step',()=>{
  const s=readFileSync(new URL('../.github/workflows/runtime-diagnostics.yml',import.meta.url),'utf8');
  assert.match(s,/on:\n  workflow_dispatch:\n/);assert.ok(!/^\s+(push|pull_request|workflow_run|schedule):/m.test(s));
  assert.match(s,/github\.repository == 'gradient30\/laboratory' && github\.ref == 'refs\/heads\/main'/);
  assert.match(s,/permissions:\n  contents: read/);assert.match(s,/environment: cloudflare-production/);
  assert.match(s,/group: little-lab-cloudflare-production-\$\{\{ github.repository \}\}/);assert.match(s,/cancel-in-progress: false/);
  assert.match(s,/ref: \$\{\{ github.sha \}\}/);assert.match(s,/persist-credentials: false/);
  const uses=[...s.matchAll(/uses: ([^\s]+)/g)].map(x=>x[1]);assert.deepEqual(uses,['actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1','actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1']);
  assert.equal((s.match(/\$\{\{ secrets\./g)||[]).length,1);assert.match(s,/secrets.CLOUDFLARE_API_TOKEN/);
  const runCommands=[...s.matchAll(/^        run: (.+)$/gm)].map(x=>x[1]);assert.deepEqual(runCommands,['node --test scripts/diagnose-runtime-secrets.test.mjs','node scripts/diagnose-runtime-secrets.mjs']);
  assert.ok(s.indexOf('secrets.CLOUDFLARE_API_TOKEN')>s.indexOf('node --test'));
  assert.ok(!/npm|npx|wrangler|account-runtime-config|continue-on-error|upload-artifact/.test(s));
});
