import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertDeploymentAllowed} from './deploy-guard.mjs';
const policy = {enabled:true, repository:'example-owner/example-repo', accountId:'a'.repeat(32), workerName:'little-lab-test'};
const config = {name:'little-lab-test', workers_dev:true, assets:{directory:'./dist'}};
const env = {DEPLOY_ENABLED:'true', GITHUB_ACTIONS:'true', GITHUB_REF:'refs/heads/main', GITHUB_EVENT_NAME:'push', GITHUB_REPOSITORY:policy.repository, GITHUB_SHA:'b'.repeat(40), CLOUDFLARE_ACCOUNT_ID:policy.accountId};
test('approved main push is eligible',()=>assert.equal(assertDeploymentAllowed(policy,config,env),true));
test('approved policy works with an unset optional switch',()=>assert.equal(assertDeploymentAllowed(policy,config,{...env,DEPLOY_ENABLED:undefined}),true));
test('approved policy works with an empty optional switch',()=>assert.equal(assertDeploymentAllowed(policy,config,{...env,DEPLOY_ENABLED:''}),true));
test('disabled policy stays blocked even with optional switch unset',()=>assert.throws(()=>assertDeploymentAllowed({...policy,enabled:false},config,{...env,DEPLOY_ENABLED:undefined})));
test('approved manual main run is eligible',()=>assert.equal(assertDeploymentAllowed(policy,config,{...env,GITHUB_EVENT_NAME:'workflow_dispatch'}),true));
for (const [name,patch] of Object.entries({
  'pull request':{GITHUB_EVENT_NAME:'pull_request'},
  'pull_request_target':{GITHUB_EVENT_NAME:'pull_request_target'},
  'workflow_run':{GITHUB_EVENT_NAME:'workflow_run'},
  'non-main branch':{GITHUB_REF:'refs/heads/feature'},
  'tag':{GITHUB_REF:'refs/tags/main'},
  'fork repository':{GITHUB_REPOSITORY:'other-owner/example-repo'},
  'wrong account':{CLOUDFLARE_ACCOUNT_ID:'c'.repeat(32)},
  'invalid switch':{DEPLOY_ENABLED:'yes'},
  'uppercase false switch':{DEPLOY_ENABLED:'FALSE'},
  'false switch':{DEPLOY_ENABLED:'false'},
  'not GitHub Actions':{GITHUB_ACTIONS:''},
  'no triggering commit':{GITHUB_SHA:''}
})) test(`rejects ${name}`,()=>assert.throws(()=>assertDeploymentAllowed(policy,config,{...env,...patch})));
test('manual non-main run is rejected',()=>assert.throws(()=>assertDeploymentAllowed(policy,config,{...env,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/feature'})));
test('disabled source policy rejects even when repository switch enabled',()=>assert.throws(()=>assertDeploymentAllowed({...policy,enabled:false},config,env)));
test('unapproved repository is rejected',()=>assert.throws(()=>assertDeploymentAllowed({...policy,repository:''},config,env)));
test('unapproved account is rejected',()=>assert.throws(()=>assertDeploymentAllowed({...policy,accountId:''},config,env)));
test('wrong Worker is rejected',()=>assert.throws(()=>assertDeploymentAllowed(policy,{...config,name:'other-worker'},env)));
test('unexpected database binding is rejected',()=>assert.throws(()=>assertDeploymentAllowed(policy,{...config,d1_databases:[]},env)));
test('checked-in source policy must remain valid for its static target',()=>{
 const actual=JSON.parse(readFileSync('.github/deployment-policy.json','utf8'));
 if(actual.enabled===false)assert.throws(()=>assertDeploymentAllowed(actual,config,env));
 else {
  const actualConfig=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
  assert.equal(assertDeploymentAllowed(actual,actualConfig,{...env,DEPLOY_ENABLED:undefined,GITHUB_REPOSITORY:actual.repository,CLOUDFLARE_ACCOUNT_ID:actual.accountId}),true);
 }
});

const accountPolicy={...policy,runtime:'family-accounts',runtimeApproved:true,database:{name:'little-lab-family-progress',id:'12345678-1234-1234-1234-123456789abc'}};
const accountConfig={...config,triggers:{crons:['17 3 * * *']},main:'worker/index.mjs',keep_vars:true,assets:{directory:'./dist',binding:'ASSETS',run_worker_first:true},vars:{APP_ORIGIN:'https://labs.996fb.cn'},d1_databases:[{binding:'DB',database_name:'little-lab-family-progress',database_id:accountPolicy.database.id,migrations_dir:'migrations'}]};
test('only approved exact family runtime and D1 may deploy',()=>assert.equal(assertDeploymentAllowed(accountPolicy,accountConfig,env),true));
test('account runtime activation requires explicit source approval',()=>assert.throws(()=>assertDeploymentAllowed({...accountPolicy,runtimeApproved:false},accountConfig,env)));
test('account runtime rejects placeholder D1 UUID',()=>assert.throws(()=>assertDeploymentAllowed({...accountPolicy,database:{...accountPolicy.database,id:'00000000-0000-0000-0000-000000000000'}},accountConfig,env)));
for(const [name,patch] of Object.entries({
 'asset-first bypass':{assets:{...accountConfig.assets,run_worker_first:false}},
 'selective worker-first bypass':{assets:{...accountConfig.assets,run_worker_first:['/api/*']}},
 'unknown runtime entry':{main:'other/index.mjs'},
 'unapproved database':{d1_databases:[{...accountConfig.d1_databases[0],database_id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}]},
 'extra database':{d1_databases:[...accountConfig.d1_databases,{binding:'OTHER',database_id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}]},
 'public bootstrap email':{vars:{...accountConfig.vars,BOOTSTRAP_ADMIN_EMAIL:'private@example.test'}},
 'different application origin':{vars:{APP_ORIGIN:'https://other.example.test'}},
 'unapproved mail binding':{send_email:[{name:'EMAIL'}]},
 'unapproved route':{routes:['*/*']},
 'unapproved KV':{kv_namespaces:[]},
 'unapproved secret store':{secrets_store_secrets:[]},
 'unapproved unsafe bindings':{unsafe:{}},
 'unapproved extra configuration':{logpush:true},
 'unapproved cron':{triggers:{crons:['* * * * *']}},
 'private vars lost':{keep_vars:false}
}))test(`account runtime rejects ${name}`,()=>assert.throws(()=>assertDeploymentAllowed(accountPolicy,{...accountConfig,...patch},env)));
