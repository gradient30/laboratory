import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function runtime(){
 const data=new Map(),sessionStorage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k),key:i=>[...data.keys()][i]??null,get length(){return data.size}};
 const context=vm.createContext({sessionStorage,Map,encodeURIComponent,JSON,Math,isRecord:v=>!!v&&typeof v==='object'&&!Array.isArray(v),session:{user:{id:'family-a'}},activeChild:{id:'child-a'},state:{age:'4-6'},gate:'locked',checks:[false,false,false],activity:{id:1,safety:'adult present',materials:['paper'],ageGuides:{'4-6':{support:'close adult',steps:['a','b','c','d']},'7-9':{support:'adult',steps:['a','b','c','d']}}}});
 vm.runInContext("const current=()=>activity;"+source.slice(source.indexOf("const PREPARATION_PREFIX="),source.indexOf('let toolbarObserver;')),context);
 return {context,data,run:code=>vm.runInContext(code,context),snapshot:()=>JSON.parse(vm.runInContext('JSON.stringify({gate,checks})',context))};
}
test('preparation keeps partial choices but requires explicit begin, and revocation persists',()=>{
 const r=runtime();r.run("checks=[true,false,true];rememberPreparation();checks=[false,false,false];restorePreparation()");assert.deepEqual(r.snapshot(),{gate:'locked',checks:[true,false,true]});
 r.run("checks=[true,true,true];rememberPreparation();restorePreparation()");assert.equal(r.snapshot().gate,'locked');
 r.run("gate='ready';rememberPreparation();gate='locked';restorePreparation()");assert.equal(r.snapshot().gate,'ready');
 r.run("checks[1]=false;rememberPreparation();restorePreparation()");assert.deepEqual(r.snapshot(),{gate:'locked',checks:[true,false,true]});
});
test('preparation is isolated by account, child, activity, age and safety content',()=>{
 const r=runtime();r.run("checks=[true,true,true];gate='ready';rememberPreparation()");
 for(const [change,revert] of [["session.user.id='family-b'","session.user.id='family-a'"],["activeChild.id='child-b'","activeChild.id='child-a'"],["activity.id=2","activity.id=1"],["state.age='7-9'","state.age='4-6'"],["activity.safety='changed adult preparation'","activity.safety='adult present'"]]){r.run(change+';restorePreparation()');assert.equal(r.snapshot().gate,'locked');r.run(revert+';restorePreparation()');assert.equal(r.snapshot().gate,'ready')}
});
test('preview is not a safety confirmation; locked curriculum never restores preparation',()=>{
 const r=runtime();r.run("gate='preview';rememberPreparation();restorePreparation()");assert.equal(r.snapshot().gate,'locked');r.run("checks=[true,true,true];gate='ready';rememberPreparation();activity.locked=true;restorePreparation()");assert.equal(r.snapshot().gate,'locked');assert.deepEqual(r.snapshot().checks,[false,false,false]);
});
test('logout clears only app preparation keys and blocked storage uses in-page fallback',()=>{
 const r=runtime();r.data.set('unrelated','keep');r.run("checks=[true,true,true];gate='ready';rememberPreparation();clearPreparation();restorePreparation()");assert.equal(r.snapshot().gate,'locked');assert.deepEqual([...r.data],[['unrelated','keep']]);
 r.run("sessionStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};checks=[true,false,true];rememberPreparation();checks=[false,false,false];restorePreparation()");assert.deepEqual(r.snapshot(),{gate:'locked',checks:[true,false,true]});
});
test('malformed preparation cannot restore readiness into a fresh runtime',()=>{
 const r=runtime();const key=r.run('preparationKey()');for(const value of ['{bad','null','{"checks":[1,1,1],"gate":"ready"}','{"checks":[true,false,true],"gate":"ready"}']){r.data.set(key,value);r.run('restorePreparation()');assert.equal(r.snapshot().gate,'locked')}
});
test('month/year locks aggregate only when no underlying activity is accessible',()=>{
 const context=vm.createContext({experiments:[{id:1,locked:false},{id:2,locked:true},{id:32,locked:true}],monthForDay:id=>id<32?1:2});
 vm.runInContext(source.slice(source.indexOf('function groupAccess('),source.indexOf('function lockedNotice(')),context);
 const read=value=>JSON.parse(vm.runInContext('JSON.stringify(groupAccess('+JSON.stringify(value)+'))',context));assert.equal(read('all').locked,false);assert.equal(read('1').available,1);assert.equal(read('2').locked,true);
});
