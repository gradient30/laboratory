import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertDeploymentAllowed} from './deploy-guard.mjs';
const policy = {enabled:true, repository:'example-owner/example-repo', accountId:'a'.repeat(32), workerName:'little-lab-test'};
const config = {name:'little-lab-test', workers_dev:true, assets:{directory:'./dist'}};
const env = {DEPLOY_ENABLED:'true', GITHUB_ACTIONS:'true', GITHUB_REF:'refs/heads/main', GITHUB_EVENT_NAME:'push', GITHUB_REPOSITORY:policy.repository, GITHUB_SHA:'b'.repeat(40), CLOUDFLARE_ACCOUNT_ID:policy.accountId};
test('approved main push is eligible',()=>assert.equal(assertDeploymentAllowed(policy,config,env),true));
test('approved manual main run is eligible',()=>assert.equal(assertDeploymentAllowed(policy,config,{...env,GITHUB_EVENT_NAME:'workflow_dispatch'}),true));
for (const [name,patch] of Object.entries({
  'pull request':{GITHUB_EVENT_NAME:'pull_request'},
  'pull_request_target':{GITHUB_EVENT_NAME:'pull_request_target'},
  'workflow_run':{GITHUB_EVENT_NAME:'workflow_run'},
  'non-main branch':{GITHUB_REF:'refs/heads/feature'},
  'tag':{GITHUB_REF:'refs/tags/main'},
  'fork repository':{GITHUB_REPOSITORY:'other-owner/example-repo'},
  'wrong account':{CLOUDFLARE_ACCOUNT_ID:'c'.repeat(32)},
  'unset switch':{DEPLOY_ENABLED:''},
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
test('source policy cannot be deployed by default',()=>{
 const actual=JSON.parse(readFileSync('.github/deployment-policy.json','utf8'));
 if(actual.enabled===false)assert.throws(()=>assertDeploymentAllowed(actual,config,env));
 else {assert.match(actual.repository,/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);assert.match(actual.accountId,/^[0-9a-f]{32}$/)}
});
