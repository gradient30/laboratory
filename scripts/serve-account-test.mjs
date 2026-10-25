// Local/CI only. This Node server is not deployed and is not part of public assets.
// /__test/* is synthetic fixture control, absent from production Worker routes.
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {createAccountHarness, TEST_ORIGIN} from './account-test-harness.mjs';
const h=await createAccountHarness();
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function payload(req){let text='';for await(const c of req){text+=c;if(Buffer.byteLength(text)>2*1024*1024)throw Error('Fixture body too large');}return text?JSON.parse(text):{};}
async function reset(){const tables=['sessions','bootstrap_claim','auth_challenges','rate_limits','children','audit_log','settings','users'];await h.db.batch(tables.map(name=>h.db.prepare(`DELETE FROM ${name}`)));h.outbox.length=0;}
async function seed(input){
  if(typeof input.email!=='string'||!input.email.endsWith('@qa.test'))throw Error('Only synthetic qa.test fixture addresses allowed');
  const now=Math.floor(Date.now()/1000),id=randomBytes(16).toString('hex'),role=input.role==='admin'?'admin':'parent';
  await h.db.prepare('INSERT INTO users(id,email,role,status,unlock_all,unlock_through,verified_at,consent_at,privacy_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,input.email.toLowerCase(),role,'active',input.unlockAll?1:0,Number.isInteger(input.unlockThrough)?input.unlockThrough:0,now,now,'2026-10-25-v1',now,now).run();
  if(role==='admin')await h.db.prepare('INSERT OR IGNORE INTO bootstrap_claim(singleton,user_id,claimed_at) VALUES(1,?,?)').bind(id,now).run();
  const children=[];
  for(const c of input.children||[]){const childId=randomBytes(16).toString('hex'),age=c.ageBand||'4-6';
    const state={startDate:new Date().toISOString().slice(0,10),day:1,age,records:{},steps:{},completed:{},legacyRecords:{},recordSchemaVersion:3,...c.state};
    await h.db.prepare('INSERT INTO children(id,user_id,nickname,age_band,state_json,revision,unlocked_through,guardian_consent_at,created_at,updated_at) VALUES(?,?,?,?,?,0,?,?,?,?)').bind(childId,id,c.nickname||'合成测试档案',age,JSON.stringify(state),Number.isInteger(c.unlockedThrough)?c.unlockedThrough:0,now,now,now).run();
    children.push({id:childId,nickname:c.nickname||'合成测试档案',ageBand:age,createdAt:now,archivedAt:null});
  }
  return {ok:true,user:{id,email:input.email.toLowerCase(),role},children,childId:children[0]?.id};
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,TEST_ORIGIN);
    if(url.pathname==='/__test/reset'&&req.method==='POST'){await payload(req);await reset();return json(res,200,{ok:true});}
    if(url.pathname==='/__test/seed'&&req.method==='POST')return json(res,200,await seed(await payload(req)));
    if(url.pathname==='/__test/outbox'&&req.method==='GET'){const email=url.searchParams.get('email')?.toLowerCase();const messages=h.outbox.filter(m=>!email||m.email===email);return json(res,200,{ok:true,messages,code:messages.at(-1)?.code});}
    if(url.pathname.startsWith('/__test/'))return json(res,404,{ok:false});
    const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);
    headers.set('CF-Connecting-IP','127.0.0.1');
    const init={method:req.method,headers};
    if(!['GET','HEAD'].includes(req.method)){const chunks=[];for await(const c of req)chunks.push(c);init.body=Buffer.concat(chunks);}
    const response=await h.fetch(url.pathname+url.search,init);
    res.statusCode=response.status;
    for(const[k,v]of response.headers)if(k.toLowerCase()!=='set-cookie')res.setHeader(k,v);
    const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
    res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  }catch(error){console.error('Synthetic account test server error:',error.message);json(res,500,{ok:false,error:'Test harness failure'});}
});
server.listen(4173,'127.0.0.1',()=>console.log('Actual Worker + local D1 synthetic test server ready on 127.0.0.1:4173'));
async function stop(){server.close();await h.dispose();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
