import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync('dist/app.js','utf8'),revision='a'.repeat(64),accessVersion='0:0:4-6:sequential';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
function harness(){
 const requests=[],renders=[],nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{replaceChildren(){},open:false,addEventListener(){},close(){this.open=false},textContent:'',innerHTML:''});return nodes.get(id);};
 const ctx=vm.createContext({URLSearchParams,APIError:class extends Error{constructor(message,status,code){super(message);this.status=status;this.code=code}},session:{user:{id:'parent'}},activeChild:{id:'a'},contextEpoch:0,catalogEpoch:0,detailEpoch:0,curriculumRevision:revision,curriculumAccessVersion:accessVersion,selectedDetail:null,loadedRecordKey:null,recordLoadEpoch:0,loadingRecord:false,childLoadError:'',detailLoading:false,detailError:'',curriculumError:'',state:{day:1,age:'4-6',records:{},steps:{},viewedSteps:{},completed:{},legacyRecords:{},protocolProgress:{}},experiments:Array.from({length:365},(_,i)=>({id:i+1,title:'day '+(i+1),locked:false})),stepViewObserver:null,viewFrame:null,gate:'locked',checks:[false,false,false],history:{state:null},location:{hash:'#lab'},environmentSnapshot:null,access:null,resolveAgeProtocol:e=>e,recordKey:()=>ctx.state.day+':4-6',progressKey:()=>ctx.state.day+':4-6:v0',progressClient:{getRecord:async key=>({key,record:{records:{},step:0,viewedSteps:0,completed:false}})},renderProgressLoading(){},escapeHTML:s=>s,isRecord:v=>!!v&&typeof v==='object'&&!Array.isArray(v),$:node,clearStaleDialogState(){},syncDialogUI(){},renderAge(){},renderJourney(){},renderDots(){},updateCloudStatus(){},renderExperiment:()=>renders.push(ctx.selectedDetail?.experiment?.id??null),api:path=>{const d=deferred();requests.push({path,...d});return d.promise;}});
 vm.runInContext(app.slice(app.indexOf('const current='),app.indexOf('\nconst guide='))+app.slice(app.indexOf('function activeProtocolProgress'),app.indexOf('function readingProgress'))+app.slice(app.indexOf('function applyProgressRecord('),app.indexOf('function chooseDay('))+app.slice(app.indexOf('function invalidateDetail('),app.indexOf('\nasync function selectChild(')),ctx);
 const resolve=(request,{day=ctx.state.day,child=ctx.activeChild.id,rev=revision,access=accessVersion}={})=>request.resolve({childId:child,curriculumRevision:rev,accessVersion:access,experiment:{id:day,ageGuides:{},title:'protected '+day}});
 const catalog=()=>({experiments:ctx.experiments,curriculumRevision:revision,accessVersion,meta:{},access:{}});
 return {ctx,requests,renders,resolve,catalog};
}
test('selected day only: a slower old day cannot replace a newer selection',async()=>{
 const h=harness(),a=h.ctx.loadSelectedDay();assert.match(h.requests[0].path,/curriculum\/1\?/);h.ctx.state.day=2;const b=h.ctx.loadSelectedDay();h.resolve(h.requests[1],{day:2});assert.equal(await b,true);h.resolve(h.requests[0],{day:1});assert.equal(await a,false);assert.equal(h.ctx.selectedDetail.day,2);assert.equal(h.renders.at(-1),2);assert.equal(h.requests.length,2);
});
test('child switch, logout and catalog replacement reject old detail success and failure',async()=>{
 for(const change of [h=>{h.ctx.activeChild={id:'b'};h.ctx.contextEpoch++;h.ctx.invalidateDetail();},h=>{h.ctx.session=null;h.ctx.contextEpoch++;h.ctx.invalidateDetail();},h=>{h.ctx.curriculumRevision='b'.repeat(64);h.ctx.invalidateDetail();}])for(const reject of [false,true]){
  const h=harness(),p=h.ctx.loadSelectedDay();change(h);const before=h.renders.slice();if(reject)h.requests[0].reject(Error('old failure'));else h.resolve(h.requests[0],{day:1,child:'a'});assert.equal(await p,false);assert.equal(h.ctx.selectedDetail,null);assert.deepEqual(h.renders,before);
 }
});
test('failure and stale response versions clear existing content and prevent completion',async()=>{
 for(const mode of ['network','revision','child','access']){
  const h=harness();h.ctx.selectedDetail={childId:'a',day:1,revision,experiment:{id:1,ageGuides:{}}};const p=h.ctx.loadSelectedDay();assert.equal(h.ctx.selectedDetail,null);assert.equal(h.ctx.detailLoading,true);h.ctx.setCurrentProgress('completed',true);assert.deepEqual(h.ctx.state.completed,{});
  if(mode==='network')h.requests[0].reject(Error('offline'));else h.resolve(h.requests[0],{rev:mode==='revision'?'b'.repeat(64):revision,child:mode==='child'?'b':'a',access:mode==='access'?'old':accessVersion});
  assert.equal(await p,false);assert.equal(h.ctx.selectedDetail,null);assert.ok(h.ctx.detailError);h.ctx.setCurrentProgress('completed',true);assert.deepEqual(h.ctx.state.completed,{});
 }
});
test('newer metadata refresh wins; older catalog cannot launch detail or overwrite access',async()=>{
 const h=harness(),a=h.ctx.refreshCurriculum(),b=h.ctx.refreshCurriculum();h.requests[1].resolve(h.catalog());await new Promise(setImmediate);assert.equal(h.requests.length,3);h.resolve(h.requests[2]);await b;h.requests[0].resolve({...h.catalog(),curriculumRevision:'b'.repeat(64)});await a;assert.equal(h.requests.length,3);assert.equal(h.ctx.curriculumRevision,revision);assert.equal(h.ctx.selectedDetail.day,1);
});
test('metadata failure clears detail, revision and interactive data; locked metadata never asks for a day',async()=>{
 const h=harness();h.ctx.selectedDetail={childId:'a',day:1,revision,experiment:{id:1,ageGuides:{}}};const p=h.ctx.refreshCurriculum();h.requests[0].reject(Error('permission refresh failed'));await assert.rejects(p);assert.equal(h.ctx.selectedDetail,null);assert.equal(h.ctx.curriculumRevision,null);
 const locked=harness();locked.ctx.experiments[0].locked=true;assert.equal(await locked.ctx.loadSelectedDay(),false);assert.equal(locked.requests.length,0);
});
test('protected day plus selected record: notes stay unavailable until both requests resolve',async()=>{
 const h=harness(),notes=deferred();h.ctx.progressClient.getRecord=()=>notes.promise;const loading=h.ctx.loadSelectedDay();h.resolve(h.requests[0]);await new Promise(setImmediate);assert.equal(h.ctx.loadingRecord,true);assert.equal(h.ctx.loadedRecordKey,null);h.ctx.setCurrentProgress('completed',true);assert.deepEqual(h.ctx.state.completed,{});notes.resolve({key:'1:4-6:v0',record:{records:{spoken:'正确孩子的记录'},step:1,viewedSteps:2,completed:false}});assert.equal(await loading,true);assert.equal(h.ctx.state.records['1:4-6'].spoken,'正确孩子的记录');assert.equal(h.ctx.loadedRecordKey,'1:4-6:v0');
});
test('late selected-record success after another day or child cannot leak notes or mark it loaded',async()=>{
 for(const change of [h=>{h.ctx.state.day=2;h.ctx.invalidateDetail()},h=>{h.ctx.activeChild={id:'b'};h.ctx.contextEpoch++;h.ctx.invalidateDetail()}]){const h=harness(),notes=deferred();h.ctx.progressClient.getRecord=()=>notes.promise;const loading=h.ctx.loadSelectedDay();h.resolve(h.requests[0]);await new Promise(setImmediate);change(h);notes.resolve({key:'1:4-6:v0',record:{records:{spoken:'不能泄漏的甲记录'},step:0,viewedSteps:0,completed:false}});assert.equal(await loading,false);assert.equal(h.ctx.loadedRecordKey,null);assert.deepEqual(h.ctx.state.records,{});}
});
test('refreshing access for an already loaded key keeps the in-memory unsaved draft',async()=>{
 const h=harness();h.ctx.loadedRecordKey='1:4-6:v0';h.ctx.state.records['1:4-6']={spoken:'还没保存的正文'};let noteRequests=0;h.ctx.progressClient.getRecord=async()=>{noteRequests++;throw Error('Must not replace an active draft')};const load=h.ctx.loadSelectedDay();h.resolve(h.requests[0]);assert.equal(await load,true);assert.equal(noteRequests,0);assert.equal(h.ctx.state.records['1:4-6'].spoken,'还没保存的正文');
});

// Run the actual navigation and popstate code, not a rewritten model of the handler.
function historyHarness(){
 const h=harness(),ctx=h.ctx,dialogs=new Map();
 const dialog=id=>{if(!dialogs.has(id))dialogs.set(id,{id,open:false,shows:0,close(){this.open=false},showModal(){this.open=true;this.shows++;}});return dialogs.get(id);};
 const oldDollar=ctx.$;ctx.$=id=>['#safety-dialog','#diagram-dialog','#day-map'].includes(id)?dialog(id.slice(1)):id==='dialog[open]'?[...dialogs.values()].find(d=>d.open):oldDollar(id);
 Object.assign(ctx,{appLoaded:true,dayNavigationEpoch:0,dayNavigationPending:false,ensureSaved:async()=>true,loadedChildId:'a',loadingChild:false,totalDays:365,dialogRestoreEpoch:0,dialogNavigation:false,pendingDialogAction:null,pendingDialogFocus:null,detailPromise:Promise.resolve(false),dayNavigationPromise:Promise.resolve(false),activePanel:'materials-panel',journeyMonth:1,monthForDay:()=>1,
  $$:selector=>selector==='dialog[open]'?[...dialogs.values()].filter(d=>d.open):[],restoreDialogFocus(){},renderMap(){},rememberPreparation(){},save(){},renderStep(){},populateDiagram(){},showPanel(){},syncView(){},requestAnimationFrame:f=>f(),window:{addEventListener(type,fn){ctx.popstate=fn;}},history:{state:null,replaceState(value){this.state=value;}}});
 ctx.activeChild={id:'a',ageBand:'4-6'};ctx.experiments.forEach(e=>e.protocolVersions={});ctx.state.day=2;
 vm.runInContext(app.slice(app.indexOf('function chooseDay('),app.indexOf('\nlet dialogNavigation='))+app.slice(app.indexOf('function clearStaleDialogState('),app.indexOf('\n\n// Dashboard counters')),ctx);
 const entry=(id,day=1)=>({littleLabDialog:id,littleLabDialogContext:{userId:'parent',childId:'a',day,age:'4-6',protocolVersion:0,step:2}});
 const go=value=>{ctx.history.state=value;return ctx.popstate();};
 return {...h,dialog,entry,go};
}
for(const id of ['safety-dialog','diagram-dialog'])test(`actual popstate: repeated Back/Forward restores ${id} after the same pending day succeeds`,async()=>{
 const h=historyHarness(),first=h.go(h.entry(id));await new Promise(setImmediate);assert.equal(h.ctx.state.day,1);assert.equal(h.requests.length,1);assert.equal(h.ctx.detailLoading,true);
 await h.go(null);const latest=h.go(h.entry(id));h.resolve(h.requests[0],{day:1});await Promise.all([first,latest]);assert.equal(h.ctx.selectedDetail.day,1);assert.equal(h.dialog(id).open,true);assert.equal(h.dialog(id).shows,1);assert.equal(h.requests.length,1);
});
for(const id of ['safety-dialog','diagram-dialog'])test(`actual popstate: ${id} waits for same-day metadata refresh and its selected-day load`,async()=>{
 const h=historyHarness();h.ctx.state.day=1;const refresh=h.ctx.refreshCurriculum(),first=h.go(h.entry(id));assert.equal(h.requests.length,1);await h.go(null);const latest=h.go(h.entry(id));
 h.requests[0].resolve(h.catalog());await new Promise(setImmediate);assert.equal(h.requests.length,2);assert.equal(h.dialog(id).open,false);
 h.resolve(h.requests[1],{day:1});await Promise.all([refresh,first,latest]);assert.equal(h.ctx.selectedDetail.day,1);assert.equal(h.dialog(id).open,true);assert.equal(h.dialog(id).shows,1);
});
for(const id of ['safety-dialog','diagram-dialog'])test(`actual popstate: ${id} never reopens after newer history, child, day, revision or failed fetch`,async()=>{
 for(const mode of ['history','child','day','revision','failure']){
  const h=historyHarness(),first=h.go(h.entry(id));await new Promise(setImmediate);await h.go(null);const latest=h.go(h.entry(id));
  if(mode==='history')await h.go(null);
  if(mode==='child'){h.ctx.activeChild={id:'b',ageBand:'4-6'};h.ctx.contextEpoch++;h.ctx.invalidateDetail();}
  if(mode==='day'){h.ctx.chooseDay(3);await new Promise(setImmediate);h.resolve(h.requests[1],{day:3});}
  if(mode==='revision'){h.ctx.curriculumRevision='b'.repeat(64);h.ctx.invalidateDetail();}
  if(mode==='failure')h.requests[0].reject(Error('offline'));else h.resolve(h.requests[0],{day:1,child:'a'});
  await Promise.all([first,latest]);assert.equal(h.dialog(id).open,false,mode);assert.equal(h.dialog(id).shows,0,mode);
 }
});
for(const id of ['safety-dialog','diagram-dialog'])test(`actual popstate: ${id} handles rejected metadata and updated protocol versions without stale restoration`,async()=>{
 for(const mode of ['rejected-metadata','new-protocol-version']){
  const h=historyHarness();h.ctx.state.day=1;const refresh=h.ctx.refreshCurriculum();const failure=mode==='rejected-metadata'?assert.rejects(refresh,/offline/):refresh;const navigation=h.go(h.entry(id));
  if(mode==='rejected-metadata')h.requests[0].reject(Error('offline'));
  else {const catalog=h.catalog();catalog.experiments[0].protocolVersions={'4-6':2};h.requests[0].resolve(catalog);await new Promise(setImmediate);h.resolve(h.requests[1],{day:1});}
  await Promise.all([failure,navigation]);assert.equal(h.dialog(id).open,false);assert.equal(h.dialog(id).shows,0);
 }
});
for(const id of ['safety-dialog','diagram-dialog'])test(`combined popstate: ${id} restores once after selected notes finish, not merely after lesson detail`,async()=>{
 const h=historyHarness(),notes=deferred();h.ctx.progressClient.getRecord=()=>notes.promise;const first=h.go(h.entry(id));await new Promise(setImmediate);h.resolve(h.requests[0],{day:1});await new Promise(setImmediate);assert.equal(h.ctx.detailLoading,false);assert.equal(h.ctx.loadingRecord,true);await h.go(null);const latest=h.go(h.entry(id));assert.equal(h.dialog(id).open,false);notes.resolve({key:'1:4-6:v0',record:{records:{spoken:'该项保存的文字'},step:1,viewedSteps:2,completed:false}});await Promise.all([first,latest]);assert.equal(h.dialog(id).open,true);assert.equal(h.dialog(id).shows,1);assert.equal(h.ctx.loadedRecordKey,'1:4-6:v0');
});
for(const id of ['safety-dialog','diagram-dialog'])test(`combined popstate: ${id} follows the latest navigation while an older save is pending`,async()=>{
 const h=historyHarness(),saving=deferred();h.ctx.ensureSaved=()=>saving.promise;const first=h.go(h.entry(id));assert.equal(h.ctx.dayNavigationPending,true);assert.equal(h.requests.length,0);await h.go(null);const latest=h.go(h.entry(id));saving.resolve(true);await new Promise(setImmediate);assert.equal(h.requests.length,1);h.resolve(h.requests[0],{day:1});await Promise.all([first,latest]);assert.equal(h.dialog(id).open,true);assert.equal(h.dialog(id).shows,1);assert.equal(h.ctx.dayNavigationPending,false);
});
for(const id of ['safety-dialog','diagram-dialog'])test(`combined popstate: failed or superseded selected notes never reopen ${id}`,async()=>{
 for(const mode of ['failed','logout','history']){const h=historyHarness(),notes=deferred();h.ctx.progressClient.getRecord=()=>notes.promise;const first=h.go(h.entry(id));await new Promise(setImmediate);h.resolve(h.requests[0],{day:1});await new Promise(setImmediate);await h.go(null);const latest=h.go(h.entry(id));if(mode==='logout'){h.ctx.session=null;h.ctx.contextEpoch++;h.ctx.invalidateDetail()}if(mode==='history')await h.go(null);if(mode==='failed')notes.reject(Error('notes offline'));else notes.resolve({key:'1:4-6:v0',record:{records:{spoken:'旧页面'},step:0,viewedSteps:0,completed:false}});await Promise.all([first,latest]);assert.equal(h.dialog(id).open,false,mode);assert.equal(h.dialog(id).shows,0,mode);}
});
