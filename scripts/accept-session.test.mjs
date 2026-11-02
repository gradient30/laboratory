import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('async function acceptSession('),app.indexOf('\nfunction childForm')).replace("import('./diagrams.js')",'loadDiagrams()');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
const result=(id='a',hasPassword=false)=>({user:{id,hasPassword},csrfToken:'synthetic',canSetPassword:true,children:[{id:id+'-child'}]});
function harness({loaded=true,child=async()=>true,load=async()=>({renderActivityDiagram(){},resolveAgeProtocol(){}})}={}){
 const events=[];const c=vm.createContext({session:null,children:[],passwordRecovery:false,authEpoch:0,authBusy:false,recoverySnapshot:null,renderActivityDiagram:loaded?()=>{}:undefined,resolveAgeProtocol:undefined,loadDiagrams:load,selectChild:child,location:{hash:'#account'},history:{replaceState:(_a,_b,hash)=>events.push('history:'+hash)},clearPrivateState:()=>{c.session=null;events.push('clear');},renderAuth:()=>{c.authEpoch++;events.push('auth');},renderFamilyBar:()=>events.push('bar'),renderFamily:()=>events.push('family'),syncView:()=>events.push('sync'),openPasswordSetup:()=>events.push('password')});
 vm.runInContext(source,c);return {c,events,accept:(r,options)=>c.acceptSession(r,options),replace:()=>{c.session={user:{id:'b',hasPassword:true}};c.authEpoch++;}};
}
test('session acceptance does not prompt or render for a replaced session after child loading',async()=>{const wait=deferred(),h=harness({child:()=>wait.promise});const p=h.accept(result());h.replace();const before=h.events.slice();wait.resolve(false);await p;assert.deepEqual(h.events,before);assert.equal(h.c.session.user.id,'b');});
test('session acceptance ignores a stale module result without overwriting the new session or resolver',async()=>{const wait=deferred(),h=harness({loaded:false,load:()=>wait.promise});const p=h.accept(result());h.replace();const before=h.events.slice();wait.resolve({renderActivityDiagram(){},resolveAgeProtocol(){}});await p;assert.deepEqual(h.events,before);assert.equal(h.c.renderActivityDiagram,undefined);assert.equal(h.c.session.user.id,'b');});
test('current module failure clears half-initialized session and returns to auth',async()=>{const h=harness({loaded:false,load:async()=>{throw Error('synthetic module failure')}});await assert.rejects(h.accept(result()),/synthetic module failure/);assert.equal(h.c.session,null);assert.ok(h.events.includes('auth'));assert.ok(!h.events.includes('password'));});
test('stale module rejection cannot clear or redraw a newer session',async()=>{const wait=deferred(),h=harness({loaded:false,load:()=>wait.promise});const p=h.accept(result());h.replace();const before=h.events.slice();wait.reject(Error('synthetic failure'));await p;assert.equal(h.c.session.user.id,'b');assert.deepEqual(h.events,before);});
test('current acceptance imports the render path and prompts only the current eligible account',async()=>{const h=harness({loaded:false});await h.accept(result());assert.equal(typeof h.c.renderActivityDiagram,'function');assert.equal(h.events.filter(e=>e==='password').length,1);const known=harness();await known.accept(result('b',true));assert.ok(!known.events.includes('password'));});

test('resumed session does not prompt for an absent password',async()=>{const h=harness();await h.accept(result(),{resume:true});assert.ok(!h.events.includes('password'));assert.equal(h.c.session.user.id,'a');});
test('explicit recovery prompts a current password holder and consumes recovery intent',async()=>{const h=harness();h.c.passwordRecovery=true;await h.accept(result('a',true));assert.equal(h.events.filter(e=>e==='password').length,1);assert.equal(h.c.passwordRecovery,false);});
