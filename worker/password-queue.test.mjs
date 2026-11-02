import test from 'node:test';
import assert from 'node:assert/strict';
import {PasswordQueue} from './password-queue.mjs';
test('same-shard queue caps at four and serializes KDF without unbounded retention',async()=>{
 const queue=new PasswordQueue(()=>0);let release,active=0,max=0,calls=0;
 const work=async()=>{calls++;active++;max=Math.max(max,active);if(calls===1)await new Promise(r=>release=r);active--;return true;};
 const jobs=Array.from({length:4},()=>queue.run(100,work));await Promise.resolve();
 await assert.rejects(queue.run(100,work),/unavailable/);assert.equal(calls,1);release();
 assert.deepEqual(await Promise.all(jobs),[true,true,true,true]);assert.equal(max,1);assert.equal(calls,4);
 assert.equal(await queue.run(100,work),true);
});
test('queued expired job never invokes KDF and late running result is discarded',async()=>{
 let now=0,release,calls=0;const queue=new PasswordQueue(()=>now);
 const first=queue.run(100,()=>new Promise(r=>release=r));
 const queued=queue.run(100,()=>{calls++;return true;});
 const rejected=Promise.all([assert.rejects(first,/unavailable/),assert.rejects(queued,/unavailable/)]);
 await Promise.resolve();now=100;release(true);await rejected;assert.equal(calls,0);
 assert.equal(await queue.run(200,()=>true),true);
});
