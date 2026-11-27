import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync('dist/app.js','utf8');
const fragment=source.slice(source.indexOf('// Paper requests are read-only'),source.indexOf('function renderExperiment(){'));
function fixture(){
 let click,resolve,reject,calls=0;const button={textContent:'查看本龄纸样',disabled:false,hidden:false,setAttribute(){},removeAttribute(){},addEventListener(event,handler){assert.equal(event,'click');click=handler;}},root={isConnected:true,textContent:'',innerHTML:''};
 const context={URLSearchParams,encodeURIComponent,activeChild:{id:'c'.repeat(32),ageBand:'4-6'},state:{age:'4-6',day:233},contextEpoch:1,detailEpoch:1,curriculumRevision:'a'.repeat(64),curriculumAccessVersion:'0:0:4-6:sequential',$:s=>s==='#load-paper-resources'?button:root,escapeHTML:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),api:()=>{calls++;return new Promise((a,b)=>{resolve=a;reject=b;});}};
 vm.createContext(context);vm.runInContext(fragment+'\nbindPaperResources();',context);
 const data=()=>({childId:context.activeChild.id,day:233,age:'4-6',curriculumRevision:context.curriculumRevision,accessVersion:context.curriculumAccessVersion,papers:{day:233,age:'4-6',version:1,coverage:'complete',printInstruction:'100%',preparation:'成人准备',pages:[{id:'b'.repeat(64)+'.svg',title:'<unsafe>',pageCount:1,copies:2,shared:false,type:'image/svg+xml',filename:'paper.svg'}]}});
 return {context,root,button,click:()=>click(),resolve:x=>resolve(x),reject:x=>reject(x),calls:()=>calls,data};
}
test('click loads once, repeated clicks coalesce, successful links are current-context-only and escaped',async()=>{
 const f=fixture(),record=JSON.stringify(f.context.state),run=f.click();await f.click();assert.equal(f.calls(),1);f.resolve(f.data());await run;assert.ok(f.root.innerHTML.includes('&lt;unsafe>'));assert.ok(f.root.innerHTML.includes('/papers/233/4-6/'));assert.ok(f.root.innerHTML.includes('download=1'));assert.ok(f.root.innerHTML.includes('× 2份'));assert.ok(f.button.hidden);await f.click();assert.equal(f.calls(),1);assert.equal(JSON.stringify(f.context.state),record);
});
test('interrupted lookup is retryable and no-resource result gives an honest empty state',async()=>{
 const f=fixture(),run=f.click();f.reject(Error('network interrupted'));await run;assert.equal(f.button.disabled,false);assert.equal(f.button.hidden,false);assert.equal(f.root.textContent,'network interrupted');const retry=f.click();f.resolve({...f.data(),papers:null});await retry;assert.ok(f.root.textContent.includes('尚无已确认绑定'));assert.ok(f.button.hidden);assert.equal(f.calls(),2);
});
test('late response after age, child, day, permission, epoch or detached DOM change never paints old materials',async()=>{
 for(const mutate of [f=>f.context.state.age='7-9',f=>f.context.activeChild.ageBand='7-9',f=>f.context.activeChild.id='d'.repeat(32),f=>f.context.state.day=234,f=>f.context.contextEpoch++,f=>f.context.detailEpoch++,f=>f.context.curriculumRevision='f'.repeat(64),f=>f.context.curriculumAccessVersion='changed',f=>f.root.isConnected=false]){
  const f=fixture(),response=f.data(),run=f.click();mutate(f);f.root.innerHTML='NEW CONTEXT';f.resolve(response);await run;assert.equal(f.root.innerHTML,'NEW CONTEXT');
 }
});
test('mismatched server age/binding fails without presenting a link; partial coverage stays explicit',async()=>{
 const f=fixture(),response=f.data(),run=f.click();response.age='7-9';f.resolve(response);await run;assert.equal(f.root.innerHTML,'');assert.equal(f.button.hidden,false);
 const g=fixture(),next=g.data(),pending=g.click();next.papers.coverage='partial';g.resolve(next);await pending;assert.ok(g.root.innerHTML.includes('未列出的参考页不供本龄使用，不代表整套原稿'));
});
test('integration calls paper binding after workspace construction, inside materials section; no record writes',()=>{
 assert.ok(source.includes('${renderPaperPanel()}</section>'));assert.ok(source.includes('buildWorkspace();\n bindPaperResources();'));
 assert.doesNotMatch(fragment,/\b(?:save|flushSave|setCurrentProgress|saveNavigation|localStorage)\s*\(/);
});
test('R1 optional adult pages are not all-required; withheld names/reasons render explicitly',async()=>{
 const f=fixture(),response=f.data(),run=f.click();response.papers.pages[0].optional=true;response.papers.unprovided=[{names:'reference, model-input',reason:'年龄适用范围待核对'}];response.papers.coverage='partial';f.resolve(response);await run;
 assert.ok(f.root.innerHTML.includes('不必全部打印'));assert.ok(f.root.innerHTML.includes('0页本龄资料 + 2页可选资料'));assert.ok(f.root.innerHTML.includes('暂未提供：reference, model-input'));assert.ok(f.root.innerHTML.includes('年龄适用范围待核对'));
});
