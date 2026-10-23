import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('.github/workflows/cloudflare.yml','utf8');
const pins={
 'actions/checkout':'3d3c42e5aac5ba805825da76410c181273ba90b1',
 'actions/setup-node':'949feb2413d6458794dcd2491c4babbbce0c15c1'
};
const uses=[...s.matchAll(/uses:\s+([^@\s]+)@([a-f0-9]{40})/g)];
assert.equal(uses.length,4);
for(const [,action,sha] of uses)assert.equal(sha,pins[action],`Unexpected action revision: ${action}`);
assert.match(s,/permissions:\n  contents: read/);
assert.ok(!/^\s+(pull_request_target|workflow_run):/m.test(s));
assert.match(s,/github\.ref == 'refs\/heads\/main'/);
assert.match(s,/needs\.check\.outputs\.deployment_enabled == 'true'/);
assert.match(s,/\(vars\.CLOUDFLARE_DEPLOY_ENABLED == '' \|\| vars\.CLOUDFLARE_DEPLOY_ENABLED == 'true'\)/);
assert.match(s,/deployment_enabled: \$\{\{ steps\.policy\.outputs\.enabled \}\}/);
assert.match(s,/typeof enabled !== 'boolean'/);
assert.match(s,/needs: check/);
assert.match(s,/environment: cloudflare-production/);
assert.match(s,/cancel-in-progress: false/);
assert.equal((s.match(/persist-credentials: false/g)||[]).length,2);
const [check,deploy]=s.split('\n  deploy:');assert.ok(deploy);
assert.ok(!/secrets\./.test(check),'PR job must not reference secrets');
assert.equal((s.match(/secrets\.CLOUDFLARE_API_TOKEN/g)||[]).length,1);
assert.ok(s.indexOf('node scripts/deploy-guard.mjs')<s.indexOf('secrets.CLOUDFLARE_API_TOKEN'));
assert.equal((s.match(/npm ci --ignore-scripts/g)||[]).length,2);
const pkg=JSON.parse(readFileSync('package.json','utf8')),lock=JSON.parse(readFileSync('package-lock.json','utf8'));
assert.equal(pkg.devDependencies.wrangler,'4.151.3');assert.equal(lock.packages[''].devDependencies.wrangler,'4.151.3');assert.equal(lock.packages['node_modules/wrangler'].version,'4.151.3');
for(const [path,p] of Object.entries(lock.packages))if(path){assert.ok(p.integrity,`Missing lock integrity: ${path}`);assert.match(p.resolved,/^https:\/\/registry\.npmjs\.org\//)}
console.log('Workflow policy assertions, verified action pins, and exact Wrangler lockfile checks passed. These are local structural checks, not a GitHub Actions execution.');
