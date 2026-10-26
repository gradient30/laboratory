// Deployment-only secret synchronization. Never imported by the Worker or public assets.
// API contract: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/secrets/methods/update/
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertDeploymentAllowed} from './deploy-guard.mjs';

const ACCOUNT='69aa667ac081ed9ddac1e04d0822f164';
const WORKER='little-lab-30-q7r8';
const ENDPOINT=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/${WORKER}/secrets`;
const emailPattern=/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
function fail(message){throw new Error(message);}
function privateValue(env,name){const v=env[name];if(typeof v!=='string'||!v.trim()||v!==v.trim()||/[\r\n\0]/.test(v))fail(`Missing or invalid private configuration: ${name}`);return v;}
function validateInputs(policy,config,env){
  // Do not forward assertion objects, which may contain private configuration values.
  try{assertDeploymentAllowed(policy,config,env);}catch{fail('Runtime configuration blocked by deployment guard.');}
  if(policy.repository!=='gradient30/laboratory'||policy.accountId!==ACCOUNT||policy.workerName!==WORKER||policy.runtime!=='family-accounts'||env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT)fail('Runtime configuration target is not approved.');
  const token=privateValue(env,'CLOUDFLARE_API_TOKEN');
  const resend=privateValue(env,'RESEND_API_KEY');
  if(!/^re_[A-Za-z0-9_-]{12,500}$/.test(resend))fail('Missing or invalid private configuration: RESEND_API_KEY');
  const owner=privateValue(env,'BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
  if(owner.length>254||!emailPattern.test(owner))fail('Missing or invalid private configuration: BOOTSTRAP_ADMIN_EMAIL');
  const sender=privateValue(env,'EMAIL_FROM');
  const address=sender.match(/^[^<>\x00-\x1f\x7f]{1,100} <([^<>]+)>$/)?.[1]||sender;
  if(sender.length>360||!emailPattern.test(address))fail('Missing or invalid private configuration: EMAIL_FROM');
  return {token,resend,owner,sender};
}

/** Call only inside the serialized production deployment job after source approval. */
export async function syncAccountRuntime({policy,config,env,fetchImpl=fetch,randomBytesImpl=randomBytes}){
  const {token,resend,owner,sender}=validateInputs(policy,config,env);
  async function api(method,body){
    let response,data;
    try{response=await fetchImpl(ENDPOINT,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(30000)});data=await response.json();}
    catch{fail('Cloudflare runtime configuration request failed; no response details logged.');}
    if(!response.ok||data?.success!==true)fail('Cloudflare runtime configuration was rejected; no response details logged.');
    return data.result;
  }
  const metadata=await api('GET');
  if(!Array.isArray(metadata)||metadata.some(x=>!x||typeof x.name!=='string'||typeof x.type!=='string'))fail('Cloudflare secret-name metadata was invalid.');
  const auth=metadata.find(x=>x.name==='AUTH_SECRET');
  if(auth&&auth.type!=='secret_text')fail('Existing authentication binding has an unexpected type; no changes made.');
  const writes=[];
  if(!auth){const bytes=randomBytesImpl(32);if(!(bytes instanceof Uint8Array)||bytes.length!==32)fail('Authentication key generation failed.');writes.push(['AUTH_SECRET',Buffer.from(bytes).toString('base64url')]);}
  writes.push(['RESEND_API_KEY',resend],['EMAIL_FROM',sender],['BOOTSTRAP_ADMIN_EMAIL',owner],['EMAIL_PROVIDER','resend'],['REGISTRATION_ENABLED','true']);
  // No ALLOWED_EMAIL_DOMAINS binding: runtime uses D1-only settings, defaulting to bootstrap-only.
  // PUT only updates these exact approved secret names; other bindings and databases are untouched.
  for(const[name,text]of writes)await api('PUT',{name,text,type:'secret_text'});
  return {installedNames:writes.map(([name])=>name),authSecretCreated:!auth};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const result=await syncAccountRuntime({policy:JSON.parse(readFileSync('.github/deployment-policy.json','utf8')),config:JSON.parse(readFileSync('wrangler.jsonc','utf8')),env:process.env});
    console.log(JSON.stringify({status:'configured',...result}));
  }catch{
    // Never emit an exception object, request payload, provider value, or server error response.
    console.error('Private runtime configuration stopped. Check approved targets, required secret names and Cloudflare permissions; no values were logged.');
    process.exitCode=1;
  }
}
