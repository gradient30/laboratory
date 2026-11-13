import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createProgressClient} from '../dist/progress-client.js';
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function setup(){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'synthetic-password',disabled:false,addEventListener(type,handler){this[type]=handler},focus(){}});return nodes.get(id)};
 const dialog={setAttribute(){},addEventListener(){},showModal(){},close(){}};
 const ctx=vm.createContext({session:{user:{id:'owner',hasPassword:false},csrfToken:'old'},contextEpoch:1,document:{activeElement:null,createElement:()=>dialog,body:{append(){nodes.set('#password-dialog',dialog)}}},$:id=>id==='#password-dialog'?nodes.get(id):node(id),ensureSaved:async()=>true,trapDialogFocus(){},syncDialogUI(){},toast(){},renderFamily(){},location:{hash:'#lab'},action:(_button,work)=>ctx.actionPromise=work()});
 vm.runInContext(app.slice(app.indexOf('function openPasswordSetup()'),app.indexOf('function passwordSettingsHTML()')),ctx);
 return {ctx,node,submit:async()=>{ctx.openPasswordSetup();node('#set-password-form').submit({preventDefault(){}});await ctx.actionPromise}};
}
test('password rotation preserves active progress client and uses rotated CSRF token for saving',async()=>{
 const {ctx,submit}=setup(),owner=ctx.session,key='1:4-6:v1',writes=[];
 ctx.api=async(path,opts)=>{if(path==='/api/auth/password')return {user:{id:'owner',hasPassword:true},csrfToken:'rotated',canSetPassword:false};writes.push({path,csrf:ctx.session.csrfToken});return {key,record:{records:{}},etag:'v1',revision:1,summary:{key}}};
 const client=createProgressClient({api:ctx.api,childId:'child',isCurrent:()=>ctx.session===owner&&ctx.contextEpoch===1});
 await client.getRecord(key);await submit();
 await client.saveRecord(key,{records:{spoken:'kept after password rotation'}});assert.equal(ctx.session,owner);assert.equal(ctx.session.csrfToken,'rotated');assert.equal(ctx.session.user.hasPassword,true);assert.equal(writes.at(-1).csrf,'rotated');
 ctx.contextEpoch++;await assert.rejects(client.saveRecord(key,{records:{spoken:'wrong context'}}),{code:'STALE_PROGRESS_CONTEXT'});
});
test('late password response cannot update a different active session',async()=>{
 const {ctx,submit}=setup();let resolve;ctx.api=()=>new Promise(r=>resolve=r);const pending=submit();await new Promise(r=>setImmediate(r));const next={user:{id:'other'},csrfToken:'other-token'};ctx.session=next;ctx.contextEpoch++;
 resolve({user:{id:'owner'},csrfToken:'late'});await pending;assert.equal(ctx.session,next);assert.equal(ctx.session.csrfToken,'other-token');
});
