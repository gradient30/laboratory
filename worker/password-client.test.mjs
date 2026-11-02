import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword} from './password-client.mjs';

test('RPC identity maps to one of exactly 16 non-identifying shards, same for set and verify',async()=>{
 const names=[],calls=[];let disposed=0;const record='scrypt-v1$16384$8$5$'+'a1'.repeat(16)+'$'+'00'.repeat(32);
 const env={PASSWORD_HASHER:{idFromName:n=>(names.push(n),n),get:()=>({compute:async(...args)=>(calls.push(args),args[0]==='hash'?record:true),[Symbol.dispose](){disposed++}})}};
 assert.equal(await hashPassword(env,'parent@qa.test','passwordA'),record);assert.equal(await verifyPassword(env,'parent@qa.test','passwordA',record),true);
 assert.equal(names[0],names[1]);assert.match(names[0],/^password-hasher-v1-(?:[0-9]|1[0-5])$/);assert.equal(disposed,2);
 for(const call of calls){assert.ok(call[3]<=Date.now()+5000);assert.ok(call[3]>Date.now());}
});
test('RPC wrong-shaped results and provider errors fail closed without leaking text',async()=>{
 for(const value of [null,{},'bad',false]){
  const env={PASSWORD_HASHER:{idFromName:n=>n,get:()=>({compute:async()=>value})}};
  await assert.rejects(hashPassword(env,'parent@qa.test','passwordA'),/^Error: Password service unavailable$/);
 }
 const env={PASSWORD_HASHER:{idFromName:n=>n,get:()=>({compute:async()=>{throw Error('private payload')}})}};
 await assert.rejects(verifyPassword(env,'parent@qa.test','passwordA',null),/^Error: Password service unavailable$/);
});
test('RPC timeout ignores late success and releases stub',async()=>{
 let resolve,disposed=0;const env={PASSWORD_HASHER:{idFromName:n=>n,get:()=>({compute:()=>new Promise(r=>resolve=r),[Symbol.dispose](){disposed++}})}};
 const pending=verifyPassword(env,'parent@qa.test','passwordA',null);
 await assert.rejects(pending,/Password service unavailable/);assert.equal(disposed,1);resolve(true);
});
