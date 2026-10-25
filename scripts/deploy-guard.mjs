import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function assertDeploymentAllowed(policy, config, env) {
  assert.equal(policy.enabled, true, 'Deployment policy is disabled. Obtain target/account approval first.');
  assert.ok([undefined, '', 'true'].includes(env.DEPLOY_ENABLED), 'Repository kill switch is false or invalid; deployment is disabled.');
  assert.equal(env.GITHUB_ACTIONS, 'true', 'This guard is for the approved GitHub Actions job only.');
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Only the main branch may deploy.');
  assert.ok(['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME), 'Only main push or manual dispatch may deploy.');
  assert.match(policy.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'An exact owner/repository must be approved.');
  assert.equal(env.GITHUB_REPOSITORY, policy.repository, 'Repository differs from the approved target.');
  assert.match(env.GITHUB_SHA || '', /^[0-9a-f]{40}$/, 'The triggering commit SHA is missing or invalid.');
  assert.match(policy.accountId, /^[0-9a-f]{32}$/, 'An exact Cloudflare account ID must be approved.');
  assert.equal(env.CLOUDFLARE_ACCOUNT_ID, policy.accountId, 'Account ID differs from the approved target.');
  assert.equal(config.name, policy.workerName, 'Worker name differs from the approved target.');
  assert.match(policy.workerName, /^[a-z][a-z0-9-]{0,62}$/, 'Invalid approved Worker name.');
  assert.equal(config.assets?.directory, './dist', 'Only the reviewed assets directory may be published.');
  assert.equal(config.workers_dev, true, 'Unexpected public Worker endpoint configuration.');
  if (policy.runtime === 'family-accounts') {
    assert.equal(policy.runtimeApproved, true, 'Account runtime has not been approved for activation.');
    assert.equal(config.main, 'worker/index.mjs', 'Only the reviewed account Worker entry is allowed.');
    assert.deepEqual(config.assets, {directory:'./dist', binding:'ASSETS', run_worker_first:true}, 'Worker must authorize before the exact reviewed static asset binding.');
    const permitted = new Set(['$schema','name','compatibility_date','workers_dev','assets','main','keep_vars','d1_databases','vars','triggers']);
    for (const key of Object.keys(config)) assert.ok(permitted.has(key), `Unapproved account runtime setting: ${key}`);
    assert.deepEqual(config.triggers,{crons:['17 3 * * *']},'Only daily expired-auth cleanup is approved.');
    assert.equal(config.keep_vars, true, 'Preserve privately configured runtime variables.');
    assert.match(policy.database?.id || '', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Approved D1 UUID is required.');
    assert.notEqual(policy.database.id, '00000000-0000-0000-0000-000000000000', 'Placeholder database cannot deploy.');
    assert.equal(policy.database.name, 'little-lab-family-progress', 'Database name differs from approved application resource.');
    assert.deepEqual(config.d1_databases, [{binding:'DB', database_name:policy.database.name, database_id:policy.database.id, migrations_dir:'migrations'}], 'Only the exact approved D1 binding is allowed.');
    assert.deepEqual(config.vars, {APP_ORIGIN:'https://labs.996fb.cn'}, 'Only the public canonical origin may be committed as a runtime variable.');
    assert.ok(!('send_email' in config), 'Email binding requires a separately reviewed provider policy.');
    for(const field of ['account_id','routes','route','r2_buckets','kv_namespaces','services','unsafe','durable_objects','queues','workflows','hyperdrive','secrets_store_secrets']) {
      assert.ok(!(field in config), `Unexpected runtime resource, secret, or route: ${field}`);
    }
  } else {
    assert.ok(!policy.runtime || policy.runtime === 'static', 'Unknown runtime policy.');
    for (const field of ['main','account_id','routes','route','d1_databases','r2_buckets','kv_namespaces','services','vars','send_email']) {
      assert.ok(!(field in config), `Unexpected runtime resource, secret, or route: ${field}`);
    }
  }
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const policy = JSON.parse(readFileSync('.github/deployment-policy.json', 'utf8'));
    const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
    assertDeploymentAllowed(policy, config, process.env);
    console.log('Deployment target and authorization guards passed. No credentials printed.');
  } catch (error) {
    console.error(`Deployment blocked before any Cloudflare command: ${error.message}`);
    process.exitCode = 1;
  }
}
