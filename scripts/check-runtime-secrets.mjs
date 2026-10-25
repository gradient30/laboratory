import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const entries=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.ok(Array.isArray(entries),'Secret name response must be an array');
const names=new Set(entries.map(x=>x.name));
// Configuration deliberately kept private on the Worker, never serialized into repository vars.
const required=['AUTH_SECRET','BOOTSTRAP_ADMIN_EMAIL','EMAIL_FROM','EMAIL_PROVIDER','REGISTRATION_ENABLED'];
for(const name of required)assert.ok(names.has(name),`Required private runtime configuration is missing: ${name}`);
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
if(!config.send_email?.some(x=>x.name==='EMAIL'))assert.ok(names.has('RESEND_API_KEY'),'Verified transactional email provider configuration is required');
console.log('Required runtime secret names are present. Values and deliverability were not inspected by this check.');
