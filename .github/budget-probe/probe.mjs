// One-time owner-authorized GET-only budget inspection; never logs response bodies.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const ACCOUNT='69aa667ac081ed9ddac1e04d0822f164';
export const WORKER='little-lab-30-q7r8';
export const BRANCH='workers-budget-probe-20261028';
const ROOT=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
export const ENDPOINTS=Object.freeze({account:`${ROOT}/workers/account-settings`,worker:`${ROOT}/workers/scripts/${WORKER}/settings`,subscriptions:`${ROOT}/subscriptions`});
const MODELS=new Set(['standard','bundled','unbound']);
function authorize(env){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!=='gradient30/laboratory'||env.GITHUB_REF!==`refs/heads/${BRANCH}`||env.GITHUB_EVENT_NAME!=='push'||env.GITHUB_RUN_ATTEMPT!=='1'||env.BUDGET_READ_APPROVAL!=='owner-approved-readonly-20261028'||env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||typeof env.CLOUDFLARE_API_TOKEN!=='string'||!env.CLOUDFLARE_API_TOKEN||/[\x00-\x20\x7f]/.test(env.CLOUDFLARE_API_TOKEN))throw Error('probe-context-rejected');
}
function safeMode(value){return MODELS.has(value)?value:null;}
// Only public Workers product identifiers are accepted; no IDs, prices or identities printed.
export function subscriptionEvidence(rows){
 if(!Array.isArray(rows))return {status:'unrecognized-response',workersPlans:[]};
 const known=new Set(['workers_free','workers_paid','workers_bundled','workers_unbound','workers_standard','workers_standard_paid','workers_standard_free']);
 const plans=[];
 for(const row of rows){const id=row?.rate_plan?.id;if(known.has(id))plans.push({plan:id,state:['Trial','Provisioned','Paid','AwaitingPayment','Cancelled','Failed','Expired'].includes(row.state)?row.state:'unknown'});}
 return {status:plans.length?'recognized-workers-products':'no-recognized-workers-product-not-proof-of-free',workersPlans:plans};
}
export async function readBudget({env,fetchImpl=fetch}){
 authorize(env);
 async function get(url){
  let response;
  try{response=await fetchImpl(url,{method:'GET',headers:{Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`},redirect:'error',signal:AbortSignal.timeout(30000)});}catch{return {status:'request-failed-no-details'};}
  if(!response.ok){await response.body?.cancel();return {status:'http-error',httpStatus:response.status};}
  let body;try{body=await response.json();}catch{return {status:'invalid-json'};}
  if(body?.success!==true)return {status:'api-unsuccessful'};
  return {status:'ok',result:body.result};
 }
 const a=await get(ENDPOINTS.account);
 const account=a.status==='ok'?{status:'ok',defaultUsageModel:safeMode(a.result?.default_usage_model)}:a;
 const w=await get(ENDPOINTS.worker);
 const cpu=w.result?.limits?.cpu_ms;
 const worker=w.status==='ok'?{status:'ok',usageModel:safeMode(w.result?.usage_model),configuredCpuMs:Number.isSafeInteger(cpu)&&cpu>0&&cpu<=300000?cpu:null}:w;
 const s=await get(ENDPOINTS.subscriptions);
 const subscriptions=s.status==='ok'?subscriptionEvidence(s.result):s;
 return {probe:'workers-budget-readonly',account,worker,subscriptions,interpretation:'Usage model or absent explicit CPU limit alone does not prove Workers Paid. Missing subscription evidence is unknown, never infer free or upgrade.'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(await readBudget({env:process.env})));}catch{console.error('Budget probe context rejected; no request details logged.');process.exitCode=1;}}
