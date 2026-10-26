// Bounded execution authorized 2026-10-26 after owner confirmed configuration and D1 residency boundary.
// List: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/list/
// Create: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/
// The sentinel is an execution guard, NOT a substitute for explicit owner approval.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const APPROVAL_SENTINEL='approved-create-little-lab-family-progress-20261025';
const ACCOUNT='69aa667ac081ed9ddac1e04d0822f164';
const NAME='little-lab-family-progress';
const ENDPOINT=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database`;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE=100,MAX_PAGES=100;
function block(message){throw new Error(message);}
function validUUID(value){return typeof value==='string'&&UUID.test(value)&&value!=='00000000-0000-0000-0000-000000000000';}
function authorize(env){
 if(env.LAB_D1_CREATE_APPROVAL!==APPROVAL_SENTINEL||env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!=='gradient30/laboratory'||env.GITHUB_REF!=='refs/heads/account-d1-provision-20261025'||!['push','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME)||env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT)block('Dedicated D1 provisioning approval or execution context is missing.');
 if(typeof env.CLOUDFLARE_API_TOKEN!=='string'||!env.CLOUDFLARE_API_TOKEN.trim()||/[\x00-\x20\x7f]/.test(env.CLOUDFLARE_API_TOKEN))block('Existing scoped Cloudflare token is missing or invalid.');
}
/** Requires a separately approved, serialized one-time GitHub Actions workflow. No automatic retries. */
export async function provisionDedicatedD1({env,fetchImpl=fetch}){
 authorize(env);
 async function api(method,url,body){
  let response,data;
  try{response=await fetchImpl(url,{method,headers:{Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(30000)});data=await response.json();}
  catch{block(method==='POST'?'Create outcome is indeterminate. Do not retry automatically; review exact-name metadata first.':'D1 metadata request failed; no response details logged.');}
  if(!response.ok||data?.success!==true)block(method==='POST'?'Create did not return confirmed success. Do not retry automatically; review exact-name metadata first.':'D1 metadata was rejected; no response details logged.');
  return data;
 }
 const matches=[],seen=new Set();let total=null,complete=false;
 for(let page=1;page<=MAX_PAGES;page++){
  const data=await api('GET',`${ENDPOINT}?page=${page}&per_page=${PAGE_SIZE}`);
  const info=data.result_info,rows=data.result;
  if(!Array.isArray(rows)||!info||!Number.isSafeInteger(info.page)||info.page!==page||!Number.isSafeInteger(info.per_page)||info.per_page!==PAGE_SIZE||!Number.isSafeInteger(info.count)||info.count!==rows.length||!Number.isSafeInteger(info.total_count)||info.total_count<0||info.total_count>PAGE_SIZE*MAX_PAGES)block('D1 pagination metadata is malformed or exceeds the approved scan bound.');
  if(total===null)total=info.total_count;
  if(info.total_count!==total||info.count!==Math.min(PAGE_SIZE,Math.max(0,total-(page-1)*PAGE_SIZE)))block('D1 pagination changed or is inconsistent; no create attempted.');
  if(info.total_pages!==undefined&&(!Number.isSafeInteger(info.total_pages)||info.total_pages!==Math.max(1,Math.ceil(total/PAGE_SIZE))))block('D1 total-page metadata is inconsistent.');
  for(const row of rows){
   if(!row||typeof row.name!=='string'||!validUUID(row.uuid)||seen.has(row.uuid))block('D1 list metadata is malformed or repeats a database; no create attempted.');
   seen.add(row.uuid);
   if(row.name===NAME)matches.push({name:NAME,uuid:row.uuid});
  }
  if(seen.size===total){complete=true;break;}
 }
 if(!complete)block('D1 pagination did not complete within the approved scan bound.');
 if(matches.length>1)block('Multiple exact-name database matches require manual review; no create attempted.');
 if(matches.length===1)return {...matches[0],status:'existing-review-required'};
 // A concurrent external creator may race the list. Never retry POST or alter/delete their resource.
 const created=await api('POST',ENDPOINT,{name:NAME});
 if(created.result?.name!==NAME||!validUUID(created.result?.uuid))block('Create response identity is indeterminate. Review exact-name metadata before any retry.');
 return {name:NAME,uuid:created.result.uuid,status:'created-review-required'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await provisionDedicatedD1({env:process.env})));}
 catch{console.error(JSON.stringify({name:NAME,status:'blocked-or-indeterminate-review-required'}));process.exitCode=1;}
}
