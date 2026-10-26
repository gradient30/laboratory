import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const curriculum=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url),'utf8')).experiments;
const subjects={physics:'物理',chemistry:'化学',maths:'数学',biology:'生物',history:'历史',geography:'地理',everyday:'生活常识'};
const scope=vm.createContext({ageBands:['4-6','7-9','10-12','13-16'],subjects,category:e=>e.category});
vm.runInContext(source.slice(source.indexOf('function dashboardMetrics('),source.indexOf('function environmentSnapshotHTML('))+';globalThis.metrics=dashboardMetrics',scope);
const metrics=scope.metrics;
test('dashboard completion deduplicates valid activity IDs and accepts exact true only',()=>{
 const m=metrics(curriculum,{completed:{'1:4-6':true,'1:7-9':true,'2:4-6':'true','3:4-6':false,'366:4-6':true,'4:invalid':true},records:{}},1);
 assert.equal(m.completed,1);assert.equal(m.remaining,364);assert.equal(m.next.id,2);assert.equal(m.covered,1);
 assert.equal(m.coverage.map(s=>s.total).join(','),'75,55,65,47,45,43,35');
});
test('empty records and step navigation are not notes or completion; choice zero and legacy text are notes',()=>{
 const m=metrics(curriculum,{completed:{},steps:{'1:4-6':3},records:{'1:4-6':{},'2:4-6':{spoken:'  ',choice:null},'3:4-6':{choice:0},'3:7-9':{field0:'same activity'},'4:4-6':{spoken:'a note'}},legacyRecords:{'5:13-16':{fields:[{label:'old',value:'kept'}]},'6:13-16':{fields:[{label:'empty',value:' '}]}}},1);
 assert.equal(m.completed,0);assert.equal(m.noted,3);assert.equal(m.next.id,1);
});
test('admin permissions and historical completion remain independent, including relock and imported last-open marker',()=>{
 const locked=curriculum.map(e=>({...e,locked:true}));let m=metrics(locked,{completed:{'1:4-6':true}},1);
 assert.equal(m.completed,1);assert.equal(m.unlocked,0);assert.equal(m.remaining,0);assert.equal(m.lockedCompleted,1);assert.equal(m.next,undefined);assert.equal(m.review,undefined);
 locked[0].locked=false;m=metrics(locked,{completed:{'1:4-6':true}},2);
 assert.equal(m.completed,1);assert.equal(m.unlocked,1);assert.equal(m.remaining,0);assert.equal(m.locked,364);assert.equal(m.next,undefined);assert.equal(m.review.id,1);
 const open=metrics(curriculum,{completed:{}},365);assert.equal(open.completed,0);assert.equal(open.unlocked,365);assert.equal(open.next.id,365);
});
test('all-complete and separate child data are not confused with no-open or no-data states',()=>{
 const completed=Object.fromEntries(curriculum.map(e=>[`${e.id}:4-6`,true]));const all=metrics(curriculum,{completed},1),fresh=metrics(curriculum,{completed:{}},1);
 assert.equal(all.completed,365);assert.equal(all.covered,7);assert.equal(all.remaining,0);assert.equal(all.review.id,1);assert.equal(fresh.completed,0);assert.equal(fresh.covered,0);assert.equal(fresh.remaining,365);
});
