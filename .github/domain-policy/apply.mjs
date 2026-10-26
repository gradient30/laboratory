// One-time owner-approved exact public registration-domain setting only.
// API: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const DOMAINS=Object.freeze(['qq.com','163.com','gmail.com','996fb.cn']);
export const ACCOUNT='69aa667ac081ed9ddac1e04d0822f164';
export const DATABASE='b3d2c512-e532-4cf5-aa50-22237beb77d3';
export const ENDPOINT=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DATABASE}/query`;
export const SELECT="SELECT value,updated_at FROM settings WHERE key='allowedDomains' LIMIT 1";
export const UPSERT="INSERT INTO settings(key,value,updated_at) SELECT 'allowedDomains',?,? WHERE (?=0 AND NOT EXISTS(SELECT 1 FROM settings WHERE key='allowedDomains')) OR (?=1 AND EXISTS(SELECT 1 FROM settings WHERE key='allowedDomains' AND value=? AND updated_at=?)) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at WHERE ?=1 AND settings.value=? AND settings.updated_at=? RETURNING value";
function stop(){throw new Error('domain-policy-operation-blocked-or-indeterminate');}
function authorize(e){if(e.GITHUB_ACTIONS!=='true'||e.GITHUB_REPOSITORY!=='gradient30/laboratory'||e.GITHUB_REF!=='refs/heads/registration-domains-20261026'||!['push','workflow_dispatch'].includes(e.GITHUB_EVENT_NAME)||e.LAB_DOMAIN_APPROVAL!=='owner-approved-four-domains-20261026'||e.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||!e.CLOUDFLARE_API_TOKEN||/[\x00-\x20\x7f]/.test(e.CLOUDFLARE_API_TOKEN))stop();}
function parseRow(rows){if(!Array.isArray(rows)||rows.length>1)stop();if(!rows.length)return null;const r=rows[0];if(typeof r.value!=='string'||!Number.isSafeInteger(r.updated_at))stop();let values;try{values=JSON.parse(r.value)}catch{stop()}if(!Array.isArray(values)||values.some(v=>typeof v!=='string'))stop();return {...r,values};}
const same=v=>v.length===DOMAINS.length&&DOMAINS.every(d=>v.includes(d));
export async function applyDomains({env,fetchImpl=fetch,now=()=>Date.now()}){
 authorize(env);
 async function query(sql,params=[]){let r,d;try{r=await fetchImpl(ENDPOINT,{method:'POST',headers:{Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({sql,params}),redirect:'error',signal:AbortSignal.timeout(30000)});d=await r.json()}catch{stop()}if(!r.ok||d?.success!==true||!Array.isArray(d.result)||d.result.length!==1||d.result[0]?.success!==true||!Array.isArray(d.result[0].results))stop();return d.result[0].results;}
 const before=parseRow(await query(SELECT));
 if(before&&same(before.values))return {status:'already-configured',allowedDomains:DOMAINS};
 // Never overwrite a different existing non-empty policy or a concurrent admin edit.
 if(before&&before.values.length)stop();
 const result=await query(UPSERT,[JSON.stringify(DOMAINS),Math.floor(now()/1000),before?1:0,before?1:0,before?.value||'',before?.updated_at||0,before?1:0,before?.value||'',before?.updated_at||0]);
 if(result.length!==1||result[0].value!==JSON.stringify(DOMAINS))stop();
 const after=parseRow(await query(SELECT));if(!after||!same(after.values))stop();
 return {status:'configured',allowedDomains:DOMAINS};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(await applyDomains({env:process.env})))}catch{console.error(JSON.stringify({status:'blocked-or-indeterminate-no-auto-retry'}));process.exitCode=1}}
