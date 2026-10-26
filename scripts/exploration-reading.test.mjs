import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('// Reading is separate'),app.indexOf('const isDone='));
function harness(){
 const ctx=vm.createContext({console});
 vm.runInContext(`
 let state={day:1,age:'4-6',steps:{},viewedSteps:{},completed:{}},session={},activeChild={id:'a'},loadingChild=false,loadedChildId='a',contextEpoch=1,gate='preview',activePanel='procedure',innerHeight=800;
 const document={visibilityState:'visible'},entry={ageGuides:{},steps:Array.from({length:4},()=>({title:'step'}))};
 const nodes={'#lab':{hidden:false},'#learning-view':{hidden:false},'#procedure':{hidden:false},'#step-stage':{hidden:false,getBoundingClientRect:()=>({width:300,height:600,top:150,bottom:750})}};
 const $=s=>nodes[s]||null,$$=()=>[],recordKey=()=>state.day+':'+state.age,current=()=>entry,stepNumber=()=>state.steps[recordKey()]??0;
 let saves=0,raf=null;const save=()=>saves++,requestAnimationFrame=f=>(raf=f,1),cancelAnimationFrame=()=>raf=null;
 ${source}
 updateReadingProgress=()=>{};
 globalThis.get=()=>({state:JSON.parse(JSON.stringify(state)),saves});globalThis.runFrame=()=>{const f=raf;raf=null;f?.()};
 `,ctx);return ctx;
}
const run=(ctx,s)=>vm.runInContext(s,ctx);
test('exact 4-bit reading mask, not cursor prefix or completed inference',()=>{
 const c=harness();for(let mask=0;mask<16;mask++){run(c,`globalThis.p=readingProgress(${mask},3)`);assert.equal(c.p.count,mask.toString(2).replaceAll('0','').length);assert.equal(c.p.remaining,4-c.p.count)}
 for(const mask of [undefined,null,-1,16,1.2,'3',true]){c.mask=mask;run(c,'globalThis.p=readingProgress(mask,3)');assert.equal(c.p.count,0);assert.equal(c.p.nextUnread,0)}
 run(c,"state.completed['1:4-6']=true;state.steps['1:4-6']=3;globalThis.p=reading()");assert.equal(c.p.count,0);assert.equal(c.p.nextUnread,0);
});
test('displaying only 1 and 4 creates 1001, repeated renders do not save again',()=>{
 const c=harness();run(c,'queueDisplayedStep();');c.runFrame();run(c,"state.steps['1:4-6']=3;queueDisplayedStep()");c.runFrame();run(c,'queueDisplayedStep()');c.runFrame();assert.equal(c.get().state.viewedSteps['1:4-6'],9);assert.equal(c.get().saves,2);assert.equal(Object.keys(c.get().state.completed).length,0);
});
test('hidden panels, dialogs, locked content, loading and offscreen rendering never count',()=>{
 const guards=["gate='locked'","activePanel='observations'","document.visibilityState='hidden'","nodes['#lab'].hidden=true","nodes['#learning-view'].hidden=true","nodes['#procedure'].hidden=true","nodes['dialog[open]']={}","entry.locked=true","entry.ageGuides=null","loadingChild=true","loadedChildId='b'","session=null","activeChild=null","nodes['#step-stage'].hidden=true","nodes['#step-stage'].getBoundingClientRect=()=>({width:300,height:600,top:900,bottom:1500})"];
 for(const guard of guards){const c=harness();run(c,guard+';queueDisplayedStep()');c.runFrame();assert.equal(c.get().saves,0,guard);assert.equal(Object.keys(c.get().state.viewedSteps).length,0,guard)}
});
test('stale animation frames cannot leak views across child, age, day, cursor, epoch',()=>{
 for(const change of ["activeChild={id:'b'};loadedChildId='b'","state.age='7-9'","state.day=2","state.steps['1:4-6']=3","contextEpoch++"]){const c=harness();run(c,'queueDisplayedStep();'+change);c.runFrame();assert.equal(c.get().saves,0,change)}
});
test('same-frame skipped steps count only the final displayed cursor',()=>{
 const c=harness();run(c,"queueDisplayedStep();state.steps['1:4-6']=3;queueDisplayedStep()");c.runFrame();assert.equal(c.get().state.viewedSteps['1:4-6'],8);
});
test('view evidence is separate from all experiment records and completion code',()=>{
 assert.match(app,/steps:\{\},viewedSteps:\{\},completed:\{\}/);assert.match(app,/\['records','steps','viewedSteps','completed','legacyRecords'\]/);
 const marker=source.slice(source.indexOf('function queueDisplayedStep'),source.indexOf('function watchDisplayedStep'));
 assert.doesNotMatch(marker,/state\.(completed|records|legacyRecords)\s*\[/);assert.match(marker,/state\.viewedSteps\[visible\.key\]/);
});
