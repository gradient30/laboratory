import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('.github/workflows/cloudflare.yml','utf8');
const pins={
 'actions/upload-artifact':'cf430e030ddbb5b0abf93d22962f4752f3646cd9',
 'actions/checkout':'3d3c42e5aac5ba805825da76410c181273ba90b1',
 'actions/setup-node':'949feb2413d6458794dcd2491c4babbbce0c15c1'
};
const uses=[...s.matchAll(/uses:\s+([^@\s]+)@([a-f0-9]{40})/g)];
assert.equal(uses.length,7);
for(const [,action,sha] of uses)assert.equal(sha,pins[action],`Unexpected action revision: ${action}`);
assert.match(s,/permissions:\n  contents: read/);
assert.ok(!/^\s+(pull_request_target|workflow_run):/m.test(s));
assert.match(s,/github\.ref == 'refs\/heads\/main'/);
assert.match(s,/needs\.check\.outputs\.deployment_enabled == 'true'/);
assert.match(s,/\(vars\.CLOUDFLARE_DEPLOY_ENABLED == '' \|\| vars\.CLOUDFLARE_DEPLOY_ENABLED == 'true'\)/);
assert.match(s,/deployment_enabled: \$\{\{ steps\.policy\.outputs\.enabled \}\}/);
assert.match(s,/typeof enabled !== 'boolean'/);
assert.match(s,/needs: \[check, curriculum-release-readiness\]/);
assert.match(s,/environment: cloudflare-production/);
assert.match(s,/cancel-in-progress: false/);
assert.equal((s.match(/persist-credentials: false/g)||[]).length,3);
const [check,deploy]=s.split('\n  deploy:');assert.ok(deploy);
assert.ok(!/secrets\./.test(check),'PR job must not reference secrets');
assert.equal((s.match(/secrets\.CLOUDFLARE_API_TOKEN/g)||[]).length,1);
assert.ok(s.indexOf('node scripts/deploy-guard.mjs')<s.indexOf('secrets.CLOUDFLARE_API_TOKEN'));
assert.equal((s.match(/npm ci --ignore-scripts/g)||[]).length,2);
const pkg=JSON.parse(readFileSync('package.json','utf8')),lock=JSON.parse(readFileSync('package-lock.json','utf8'));
assert.equal(pkg.devDependencies.wrangler,'4.151.3');assert.equal(lock.packages[''].devDependencies.wrangler,'4.151.3');assert.equal(lock.packages['node_modules/wrangler'].version,'4.151.3');
for(const [path,p] of Object.entries(lock.packages))if(path){assert.ok(p.integrity,`Missing lock integrity: ${path}`);assert.match(p.resolved,/^https:\/\/registry\.npmjs\.org\//)}
console.log('Workflow policy assertions, verified action pins, and exact Wrangler lockfile checks passed. These are local structural checks, not a GitHub Actions execution.');

assert.equal(pkg.devDependencies['@playwright/test'],'1.64.1');assert.equal(lock.packages['node_modules/@playwright/test'].version,'1.64.1');assert.match(check,/npx --no-install playwright install --with-deps chromium/);assert.match(check,/npm run test:browser/);
assert.match(check,/npm run test:curriculum:complete/,'Incomplete age protocols must block publication');
assert.match(check,/npm run test:curriculum:partial/);
assert.match(deploy,/npm run test:curriculum:complete/,'Exact deployed content must recheck coverage');
assert.equal(pkg.scripts['test:curriculum:complete'],'node scripts/check-age-protocols.mjs');

assert.match(check,/google-chrome --version/);assert.match(check,/chromium.launch\(\{channel: 'chrome'\}\)/);assert.match(check,/PLAYWRIGHT_CHANNEL=chrome/);

assert.match(check,/fc-list :lang=zh/);assert.match(check,/fonts-wqy-zenhei/);

assert.match(check,/npm test/);
assert.match(pkg.scripts.test,/npm run test:backend/);
assert.match(pkg.scripts['test:backend'],/node --test worker\/\*\.test\.mjs/);
assert.match(deploy,/wrangler secret list --config wrangler\.jsonc/);
assert.match(deploy,/node scripts\/check-runtime-secrets\.mjs/);
assert.match(deploy,/d1 time-travel info DB --json/);
assert.match(deploy,/d1 migrations apply DB --remote/);
assert.ok(deploy.indexOf('check-runtime-secrets.mjs')<deploy.indexOf('d1 migrations apply'));
assert.ok(deploy.indexOf('report-recovery-bookmark.mjs')<deploy.indexOf('d1 migrations apply'));
assert.ok(deploy.indexOf('d1 migrations apply')<deploy.indexOf('wrangler deploy'));
assert.ok(!/d1 (?:delete|time-travel restore|export)/.test(s),'No automatic destructive restore/delete or production data export');
console.log('Account runtime tests, private-config preflight, recovery-bookmark and additive migration deployment ordering passed.');

assert.ok(!s.includes('account-runtime-config.mjs'),'Configuration synchronization must not run as a deployment side effect');
for(const name of ['AUTH_SECRET','RESEND_API_KEY','EMAIL_FROM','BOOTSTRAP_ADMIN_EMAIL','EMAIL_PROVIDER','REGISTRATION_ENABLED']){
 assert.ok(!s.includes(`secrets.${name}`)&&!s.includes(`vars.${name}`),`Deployment must not receive or rewrite private configuration ${name}`);
}
assert.ok(!/\bsecret\s+(?:put|bulk|delete)\b|\bsecrets-bulk\b|--secrets-file|(?:-X|--request)\s+(?:PUT|PATCH|POST|DELETE)\b/.test(s),'No private-configuration mutation command in deployment');
assert.equal((deploy.match(/wrangler secret list --config wrangler\.jsonc/g)||[]).length,1);
assert.ok(deploy.indexOf('wrangler secret list')<deploy.indexOf('check-runtime-secrets.mjs'));
assert.match(deploy,/set -euo pipefail/,'Runtime preflight failure must stop the deployment shell');
assert.ok(deploy.indexOf('check-runtime-secrets.mjs')<deploy.indexOf('d1 time-travel info'));
assert.ok(deploy.indexOf('check-runtime-secrets.mjs')<deploy.indexOf('d1 migrations apply'));
assert.ok(deploy.indexOf('check-runtime-secrets.mjs')<deploy.indexOf('wrangler deploy'));

// Preview is an explicit, exact-candidate exception, never the default path.
const jobBlocks=Object.fromEntries(['check','curriculum-release-readiness','deploy'].map(name=>{
 const start=s.indexOf(`\n  ${name}:\n`);assert.ok(start>=0);
 const rest=s.slice(start+1);
 // Job names have exactly two spaces; nested fields have four or more.
 const boundary=rest.slice(3).search(/\n  [a-z][a-z-]*:\n/);
 return [name,boundary<0?rest:rest.slice(0,boundary+3)];
}));
const steps=job=>job.split(/\n      - name: /).slice(1).map(block=>({name:block.split('\n')[0],block}));
const named=(job,name)=>{const matches=steps(job).filter(step=>step.name===name);assert.equal(matches.length,1,`Expected one step: ${name}`);return matches[0].block;};
assert.match(s,/workflow_dispatch:\n    inputs:\n      release_mode:\n        description: [^\n]+\n        type: choice\n        required: true\n        default: standard\n        options:\n          - standard\n          - personal-preview-20261109\n/);
assert.match(s,/RELEASE_MODE: \$\{\{ inputs\.release_mode \|\| 'standard' \}\}/);
assert.ok(!/continue-on-error:|always\(\).*needs\./.test(s),'No failed-check deployment fallback');
assert.equal((s.match(/run: node scripts\/check-release-mode\.mjs/g)||[]).length,3);
const skip="        if: steps.release.outputs.personal_preview != 'true'\n";
for(const [name,job]of Object.entries(jobBlocks)){
 assert.equal((job.match(/        id: release\n/g)||[]).length,1,`${name} must validate its own exact revision`);
 assert.ok(job.indexOf('run: node scripts/check-release-mode.mjs')<job.indexOf(skip),`${name} cannot skip before validation`);
 const selector=steps(job).find(step=>step.block.includes('id: release\n'));
 assert.ok(selector&&!/\n        if:|continue-on-error/.test(selector.block),'Release selector must be unconditional and fail closed');
}
const checkJob=jobBlocks.check,readyJob=jobBlocks['curriculum-release-readiness'];
for(const name of ['Verify runner Chrome or install pinned Chromium','Ensure Chinese glyphs exist for actual visual review','Verify desktop and mobile browser flows','Verify archived static visual evidence for standard releases'])assert.ok(named(checkJob,name).includes(skip),`Only validated preview may defer ${name}`);
assert.ok(named(checkJob,'Retain synthetic interface screenshots for visual review').includes("        if: always() && steps.release.outputs.personal_preview != 'true'\n"));
for(const [job,name]of [[readyJob,'Reject incomplete independent protocols and final review evidence for standard releases'],[deploy,'Recheck all five final reviews for standard deployment']]){
 const step=named(job,name);assert.ok(step.includes(skip));assert.match(step,/\n        run: npm run test:curriculum:complete(?:\n|$)/);
}
for(const [job,name,command]of [[checkJob,'Check JavaScript syntax','npm run check:syntax'],[checkJob,'Check content, deployment policy and workflow','npm test'],[checkJob,'Audit authored age protocols without pretending the remaining curriculum is complete','npm run test:curriculum:partial'],[checkJob,'Validate Wrangler package without deploying','./node_modules/.bin/wrangler deploy --dry-run --config wrangler.jsonc'],[deploy,'Recheck deployable content','npm run check:syntax && npm test'],[deploy,'Verify approved repository, branch, account and Worker','node scripts/deploy-guard.mjs'],[deploy,'Migrate approved D1 and deploy account Worker using locked Wrangler',null]]){
 const step=named(job,name);assert.ok(!/\n        if:|continue-on-error/.test(step),`Both release modes require ${name}`);if(command)assert.ok(step.split('\n').includes(`        run: ${command}`),name);
}
assert.ok(deploy.indexOf('run: node scripts/check-release-mode.mjs')<deploy.indexOf('run: node scripts/deploy-guard.mjs'));
assert.equal((s.match(/if: steps\.release\.outputs\.personal_preview != 'true'/g)||[]).length,6);
console.log('Standard browser/five-review gates remain strict; exact-candidate manual preview retains all common tests and deployment safeguards. This is structural validation, not a live Actions run.');

assert.equal(pkg.scripts['test:visual-evidence'],'node --test scripts/static-scene-evidence.check.mjs');
assert.match(named(checkJob,'Verify archived static visual evidence for standard releases'),/run: npm run test:visual-evidence/);

assert.equal((s.match(/run: npm run prepare:source/g)||[]).length,3);
for(const job of Object.values(jobBlocks))assert.ok(job.indexOf('run: npm run prepare:source')<job.indexOf('run: node scripts/check-release-mode.mjs'));
