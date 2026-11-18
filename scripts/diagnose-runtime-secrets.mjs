// Read-only incident diagnosis. No dependency install, secret values, writes or deployment.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ACCOUNT='69aa667ac081ed9ddac1e04d0822f164';
const WORKER='little-lab-30-q7r8';
const BASE=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/${WORKER}`;
const GOOD='ce4d15b5-648e-4e51-a602-aeb4a696d2a9';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const stop=()=>{throw new Error('Runtime metadata diagnosis stopped; no response details or credentials were logged.');};
const id=x=>{if(typeof x!=='string'||!UUID.test(x))stop();return x;};
const time=x=>{if(typeof x!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?Z$/.test(x)||!Number.isFinite(Date.parse(x)))stop();return x;};

export function namesAndTypes(entries){
  if(!Array.isArray(entries)||entries.length>1000)stop();
  const seen=new Set();
  return entries.map(x=>{
    if(!object(x)||typeof x.name!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(x.name)||seen.has(x.name)||typeof x.type!=='string'||!/^[a-z][a-z0-9_]{0,63}$/.test(x.type))stop();
    seen.add(x.name);return {name:x.name,type:x.type};
  }).sort((a,b)=>a.name.localeCompare(b.name));
}

export async function diagnoseRuntime({env=process.env,fetchImpl=fetch,delay=ms=>new Promise(r=>setTimeout(r,ms)),now=()=>new Date()}={}){
  if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_EVENT_NAME!=='workflow_dispatch'||env.GITHUB_REF!=='refs/heads/main'||env.GITHUB_REPOSITORY!=='gradient30/laboratory'||!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||'')||env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT)stop();
  const token=env.CLOUDFLARE_API_TOKEN;
  if(typeof token!=='string'||!token.trim()||token!==token.trim()||/[\r\n\0]/.test(token))stop();
  async function get(suffix){
    if(!['/secrets','/deployments','/versions'].includes(suffix)&&!/^\/versions\/[a-f0-9-]{36}$/i.test(suffix))stop();
    try{
      const response=await fetchImpl(BASE+suffix,{method:'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
      if(!response.ok)stop();
      const data=await response.json();
      if(!object(data)||data.success!==true)stop();
      return data.result;
    }catch{stop();}
  }
  const first=namesAndTypes(await get('/secrets'));
  const deploymentsResult=await get('/deployments');
  if(!object(deploymentsResult)||!Array.isArray(deploymentsResult.deployments)||!deploymentsResult.deployments.length||deploymentsResult.deployments.length>100)stop();
  const deployments=deploymentsResult.deployments.map(d=>{
    if(!object(d)||!Array.isArray(d.versions)||!d.versions.length||d.versions.length>2)stop();
    const versions=d.versions.map(v=>{
      if(!object(v)||!Number.isFinite(v.percentage)||v.percentage<=0||v.percentage>100)stop();
      return {version_id:id(v.version_id),percentage:v.percentage};
    });
    if(new Set(versions.map(v=>v.version_id)).size!==versions.length||Math.abs(versions.reduce((s,v)=>s+v.percentage,0)-100)>0.000001)stop();
    return {id:id(d.id),created_on:time(d.created_on),versions};
  }).sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on)).slice(0,10);
  const uploaded=await get('/versions');
  if(!object(uploaded)||!Array.isArray(uploaded.items)||!uploaded.items.length||uploaded.items.length>100)stop();
  const versions=uploaded.items.map(v=>{
    if(!object(v)||!object(v.metadata))stop();
    return {id:id(v.id),created_on:time(v.metadata.created_on)};
  }).sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on));
  const latestUploaded=versions[0];
  const inspectIds=[...new Set([...deployments[0].versions.map(v=>v.version_id),latestUploaded.id,GOOD])];
  const inspected=[];
  for(const versionId of inspectIds){
    const v=await get('/versions/'+versionId);
    if(!object(v)||v.id!==versionId||!object(v.metadata)||!object(v.resources))stop();
    inspected.push({id:id(v.id),created_on:time(v.metadata.created_on),bindings:namesAndTypes(v.resources.bindings)});
  }
  await delay(3000);
  const second=namesAndTypes(await get('/secrets'));
  return {observedAt:time(now().toISOString()),secretNamesBefore:first,secretNamesAfter:second,deployments,latestUploaded,inspectedVersions:inspected};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(await diagnoseRuntime(),null,2));}
  catch{console.error('Runtime metadata diagnosis stopped; no response details or credentials were logged.');process.exitCode=1;}
}
