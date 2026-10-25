// Test-only harness. Never imported by the production Worker or shipped in dist.
// Executes the actual bundled Worker and SQL migrations against local Miniflare D1.
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {build} from 'esbuild';
import {readFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

export const TEST_ORIGIN='http://127.0.0.1:4173';
export const TEST_OWNER='owner@qa.test';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
let bundle;
async function workerBundle(){
  if(!bundle){const result=await build({entryPoints:[resolve(root,'worker/index.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',external:['cloudflare:*'],logLevel:'silent'});bundle=result.outputFiles[0].text;}
  return bundle;
}
export async function createAccountHarness({origin=TEST_ORIGIN,bindings={},initialDomains=['qa.test']}={}){
  const outbox=[];
  const mf=new Miniflare(convertV4MiniflareOptions({
    name:'little-lab-account-test',modules:true,script:await workerBundle(),compatibilityDate:'2026-10-22',
    host:'127.0.0.1',port:0,inspectorPort:0,cf:false,
    d1Databases:{DB:'test-family-progress'},d1Persist:false,
    bindings:{APP_ORIGIN:origin,BOOTSTRAP_ADMIN_EMAIL:TEST_OWNER,ALLOWED_EMAIL_DOMAINS:'qa.test',EMAIL_FROM:'lab@qa.test',REGISTRATION_ENABLED:'true',PROGRESSION_MODE:'sequential',EMAIL_PROVIDER:'resend',RESEND_API_KEY:'synthetic-not-a-real-provider-key',AUTH_SECRET:'synthetic-test-only-auth-secret-never-used-in-production-20261025',...bindings},
    serviceBindings:{ASSETS:async request=>{
      const path=new URL(request.url).pathname;
      const names={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css','/diagrams.js':'diagrams.js','/data.json':'data.json'};
      const file=names[path];if(!file)return new Response('Not found',{status:404});
      const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8'};
      return new Response(await readFile(resolve(root,'dist',file)),{headers:{'Content-Type':types[file.split('.').pop()]}});
    }},
    outboundService:async request=>{
      const url=new URL(request.url);
      if(url.href!=='https://api.resend.com/emails'||request.method!=='POST')return new Response('Test network is denied',{status:503});
      const message=await request.json();const to=Array.isArray(message.to)?message.to[0]:message.to;
      const code=String(message.text||message.html||'').match(/\b\d{8}\b/)?.[0];
      outbox.push({email:String(to).toLowerCase(),code,messageId:'test-'+randomUUID()});
      return Response.json({id:outbox.at(-1).messageId});
    }
  }));
  try{
    await mf.ready;
    const db=await mf.getD1Database('DB');
    for(const name of (await readdir(resolve(root,'migrations'))).filter(n=>/^\d.*\.sql$/.test(n)).sort()){
      const sql=await readFile(resolve(root,'migrations',name),'utf8');
      await db.exec(sql);
    }
    if(initialDomains.length)await db.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?,?,?)').bind('allowedDomains',JSON.stringify(initialDomains),Math.floor(Date.now()/1000)).run();
    return {mf,db,outbox,origin,initialDomains,fetch:(path,init={})=>mf.dispatchFetch(new URL(path,origin).href,init),dispose:()=>mf.dispose()};
  }catch(error){await mf.dispose();throw error;}
}
