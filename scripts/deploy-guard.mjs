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
  assert.equal(config.assets?.directory, './dist', 'Only the reviewed static directory may be published.');
  assert.equal(config.workers_dev, true, 'This policy approves the public workers.dev static site only.');
  for (const field of ['main','account_id','routes','route','d1_databases','r2_buckets','kv_namespaces','services','vars']) {
    assert.ok(!(field in config), `Unexpected runtime resource, secret, or route: ${field}`);
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
