import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ACCOUNT='69aa667ac081ed9ddac1e04d0822f164';
const WORKER='little-lab-30-q7r8';
const email=/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
export function classify(env){return ['CLOUDFLARE_API_TOKEN','RESEND_API_KEY','BOOTSTRAP_ADMIN_EMAIL','EMAIL_FROM'].map(name=>{const v=env[name];let category='valid';if(typeof v!=='string'||!v.trim())category='missing';else if(v!==v.trim())category='outer_whitespace';else if(/[\r\n\0]/.test(v))category='control';else if(name==='RESEND_API_KEY'&&!/^re_[A-Za-z0-9_-]{12,500}$/.test(v))category='format';else if(name==='BOOTSTRAP_ADMIN_EMAIL'&&(v.length>254||!email.test(v.toLowerCase())))category='format';else if(name==='EMAIL_FROM'){const address=v.match(/^[^<>\x00-\x1f\x7f]{1,100} <([^<>]+)>$/)?.[1]||v;if(v.length>360||!email.test(address))category='format';}return{name,category};});}
async function main(){
 if(process.env.GITHUB_REPOSITORY!=='gradient30/laboratory'||process.env.GITHUB_REF!=='refs/heads/account-capability-probe-20261025'||process.env.GITHUB_ACTIONS!=='true')throw Error('context');
 console.log(JSON.stringify({probe:'private-input-categories',fields:classify(process.env)}));
 if(process.env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT||classify(process.env)[0].category!=='valid'){console.log(JSON.stringify({probe:'secret-names',status:'context-or-token-invalid'}));return;}
 try{
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/${WORKER}/secrets`,{method:'GET',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},redirect:'error',signal:AbortSignal.timeout(30000)});
 const result={probe:'secret-names',httpStatus:r.status};
 if(r.ok){const data=await r.json();if(data.success===true&&Array.isArray(data.result)){const names=new Set(data.result.map(x=>x.name));result.present=Object.fromEntries(['AUTH_SECRET','RESEND_API_KEY','EMAIL_FROM','BOOTSTRAP_ADMIN_EMAIL','EMAIL_PROVIDER','REGISTRATION_ENABLED'].map(n=>[n,names.has(n)]));}else result.status='invalid-metadata';}else await r.body?.cancel();
 console.log(JSON.stringify(result));
 }catch{console.log(JSON.stringify({probe:'secret-names',status:'request-failed-no-details-logged'}));}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Diagnostic context rejected; no details logged.');process.exitCode=1;});
