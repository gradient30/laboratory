import test from 'node:test';import assert from 'node:assert/strict';import {classify} from './diagnostic.mjs';
const base={CLOUDFLARE_API_TOKEN:'synthetic-token',RESEND_API_KEY:'re_synthetic_test_only_123456',BOOTSTRAP_ADMIN_EMAIL:'owner@qa.test',EMAIL_FROM:'Lab <lab@qa.test>'};
test('synthetic valid fields only output fixed names/categories',()=>{assert.ok(classify(base).every(x=>x.category==='valid'));assert.ok(!JSON.stringify(classify(base)).includes('@'));});
for(const [value,category]of [[undefined,'missing'],['','missing'],[' key ','outer_whitespace'],['key\nmid','control'],['not-a-provider-key','format']])test('safe enum '+category,()=>assert.equal(classify({...base,RESEND_API_KEY:value}).find(x=>x.name==='RESEND_API_KEY').category,category));
test('invalid owner never leaks injected input',()=>{const r=classify({...base,BOOTSTRAP_ADMIN_EMAIL:'PRIVATE_SENTINEL_BAD'});assert.equal(r[2].category,'format');assert.ok(!JSON.stringify(r).includes('PRIVATE_SENTINEL'));});
test('invalid sender never leaks input',()=>{const r=classify({...base,EMAIL_FROM:'PRIVATE_SENTINEL_BAD'});assert.equal(r[3].category,'format');assert.ok(!JSON.stringify(r).includes('PRIVATE_SENTINEL'));});
