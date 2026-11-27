import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {resolveAgeProtocol,renderActivityDiagram} from '../dist/diagrams.js';
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(app.split('\n').find(l=>l.startsWith('const escapeHTML='))+'\n'+app.slice(app.indexOf('function renderExperimentPrintSheet('),app.indexOf('function openExperimentPrintSheet('))+'\nglobalThis.render=renderExperimentPrintSheet;globalThis.cards=EXPERIMENT_PRINT_CARDS;globalThis.sourceCheck=printSourceCheck;globalThis.renderCard=renderConcisePrintSheet;globalThis.renderVisual=renderVisualPrintSheet;globalThis.visualSafety=printVisualSafety;',ctx);
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('1460 printable variants preserve full safety, source sentences or fingerprint-bound curated cards, and never mutate curriculum',()=>{
 const before=JSON.stringify(data);let automatic=0,curated=0;
 for(const raw of data.experiments)for(const age of ['4-6','7-9','10-12','13-16']){
  const e=resolveAgeProtocol(raw,age),g=e.ageGuides[age],html=ctx.render(e,g,age),card=ctx.cards[`${e.id}:${age}`];
  assert.ok(html.includes(escape(e.safety)),`${raw.id}/${age}: complete safety`);
  if(card){
   const source={id:e.id,age,title:e.title,duration:e.duration,question:e.question,wait:e.wait,materials:e.materials,safety:e.safety,steps:e.steps,guide:g};
   assert.equal(createHash('sha256').update(JSON.stringify(source)).digest('hex'),card.sourceFingerprint,`${raw.id}/${age}: stale curated source`);
   assert.equal(ctx.sourceCheck(e,g,age),card.sourceCheck);assert.match(html,/精简操作卡/);assert.equal(card.steps.length,4);assert.equal(card.age,age);assert.equal(card.safety,e.safety);
   assert.ok(card.materials.length&&card.materials.every(t=>typeof t==='string'&&t.length));assert.ok(card.steps.every(s=>s.length===2&&s.every(t=>typeof t==='string'&&t.length)));assert.ok(card.discovery.length);curated++;
  }else{
   const texts=[...e.materials,e.safety,g.support,g.control,g.time,g.observe||e.question,...e.steps.flatMap((s,i)=>[s.title,s.detail,g.steps[i].action,g.steps[i].caption,g.steps[i].adultNote])].filter(Boolean);
   for(const text of texts)for(const sentence of text.match(/[^。！？\n]+[。！？]?/g)||[])assert.ok(html.includes(escape(sentence.trim())),`${raw.id}/${age}: missing ${sentence}`);
   automatic++;
  }
  assert.equal((html.match(/class="step"/g)||[]).length,4);assert.match(html,/@page\{size:A4/);assert.doesNotMatch(html,/overflow:\s*hidden/);assert.match(html,/height:12mm/);
 }
 assert.equal(automatic,1405);assert.equal(curated,55);assert.equal(JSON.stringify(data),before);
});
test('stale card falls back to full current source after a procedure change; unicode age labels resolve',()=>{
 const e=structuredClone(resolveAgeProtocol(data.experiments[171],'13-16')),g=e.ageGuides['13-16'];
 assert.match(ctx.render(e,g,'13–16'),/精简操作卡/);
 g.steps[0].action+='新增安全要求：停止操作，成人检查。';e.steps[0].detail=g.steps[0].action;
 const html=ctx.render(e,g,'13–16');assert.doesNotMatch(html,/精简操作卡/);assert.ok(html.includes('新增安全要求：停止操作，成人检查。'));
});
test('both rendering modes escape all strings and print no saved child record',()=>{
 const e=structuredClone(resolveAgeProtocol(data.experiments[0],'4-6'));e.title='<img src=x onerror=alert(1)>';
 const html=ctx.render(e,e.ageGuides['4-6'],'4-6');assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('record-area'));
 const c=JSON.parse(JSON.stringify(ctx.cards['172:13-16']));c.title='<img src=x>';c.materials[0]='<script>alert(1)</script>';const ch=ctx.renderCard(c);assert.ok(ch.includes('&lt;img'));assert.ok(ch.includes('&lt;script'));assert.ok(!ch.includes('<script'));assert.ok(!ch.includes('record-area'));
 assert.match(app,/printButton.addEventListener\('click',openExperimentPrintSheet\)/);
});
test('single-page fitting keeps at least 10pt and refuses overflow without truncating content',()=>{
 const fitSource=app.slice(app.indexOf(' const fit=()=>'),app.indexOf("\n  printButton.addEventListener",app.indexOf(" const fit=()=>")));
 for(const base of [900,1150,2000]){
  let size=11,blocked=false;const sheet={isConnected:true,classList:{remove:()=>{}},style:{setProperty:(name,s)=>{if(name==='--body-size')size=parseFloat(s)}},get scrollHeight(){return base*size/11},scrollWidth:733,clientWidth:733};
  const status={},printButton={},doc={body:{classList:{add:()=>{},remove:name=>{if(name==='print-overflow')blocked=false},toggle:(_,v)=>{blocked=v}}}};
  const sandbox=vm.createContext({popup:{closed:false},sheet,status,printButton,doc,visual:false});vm.runInContext(fitSource+';globalThis.result=fit();',sandbox);
  assert.ok(size>=10&&size<=11);assert.equal(blocked,base*size/11>281*96/25.4+1);assert.equal(printButton.disabled,blocked);assert.equal(sandbox.result,!blocked);
  if(blocked)assert.match(status.textContent,/暂不提供单页打印/);else assert.match(status.textContent,/一张 A4/);
 }
 assert.match(app,/if\(!fit\(\)\)return/);assert.doesNotMatch(app,/自动续页/);
});
test('supplemental deduplication removes only exact repeats',()=>{
 const e=structuredClone(resolveAgeProtocol(data.experiments[0],'4-6')),g=e.ageGuides['4-6'];g.steps[0].adultNote='独立安全要求：停止后由成人清理，材料不可入口。';g.steps[1].adultNote=g.steps[0].adultNote;
 const html=ctx.render(e,g,'4-6');assert.equal(html.split(g.steps[0].adultNote).length-1,1);assert.ok(html.includes(e.safety));
});

test('illustrated card has four age-correct scenes, adult safety and space to draw',()=>{
 for(const [day,age] of [[1,'4-6'],[172,'10-12'],[255,'13-16'],[365,'7-9']]){
  const e=resolveAgeProtocol(data.experiments[day-1],age),g=e.ageGuides[age];
  const actual=[];const html=ctx.renderVisual(e,g,age.replace('-','–'),(...args)=>{assert.equal(args[3]?.sceneOnly,true);actual.push(args.slice(1,3));return renderActivityDiagram(...args);});
  assert.deepEqual(actual,(day===172?[0]:day===255?[0,1,3]:[0,1,2,3]).map(i=>[i,age]));
  assert.equal((html.match(/class="science-diagram"/g)||[]).length,4);
  for(const sentence of ctx.visualSafety(e,g,age))assert.ok(html.includes(escape(sentence)));
  assert.equal((html.match(/viewBox="24 65 592 235"/g)||[]).length,actual.length);
  assert.doesNotMatch(html,/分龄操作图/);
  assert.ok(html.includes('安全要点'));assert.ok(html.includes('图是示意'));
  assert.match(html,/height:24mm/);assert.match(html,/我的发现/);assert.doesNotMatch(html,/record-area|儿童姓名/);
  if(day===1)for(const item of e.materials)assert.ok(html.includes(escape(item)));
  if(day===172||day===255){
   assert.match(html,/按完整版的材料表准备/);
   assert.match(ctx.render(e,g,age),/精简操作卡/);
  }
 }
});

test('Day 1 print keeps concrete limits and stop conditions without repeating adult guidance',()=>{
 for(const age of ['4-6','7-9','10-12','13-16']){
  const e=structuredClone(resolveAgeProtocol(data.experiments[0],age)),g=e.ageGuides[age];
  const safety=markup=>markup.match(/<section class="safety">[^]*?<\/section>/)[0];
  const quick=safety(ctx.renderVisual(e,g,age,renderActivityDiagram));
  assert.doesNotMatch(quick,/先请成人读完整版|全程近距离陪伴/);
  assert.ok(!quick.includes(escape(g.support)));
  assert.match(quick,age==='4-6'?/不放任何重物/:/只用纸包.*不加硬币/);
  assert.match(quick,/不按压或固定桥头.*滑落.*书移动就停.*材料不入口.*收好剪刀/);
  assert.ok(safety(ctx.render(e,g,age)).includes(escape(e.safety)));
  e.safety+='新增停止条件。';
  assert.ok(safety(ctx.renderVisual(e,g,age,renderActivityDiagram)).includes(escape(e.safety)));
 }
});

test('printed safety condenses reviewed guidance, but leaves unfamiliar warnings verbatim',()=>{
 const e={id:0,safety:'成人全程近距离陪伴4—6岁；所有剪裁、预制小纸片由成人完成并收齐，纸片和笔不入口。',ageGuides:{}};
 const lines=ctx.visualSafety(e,{support:'成人可代读代画代记；未知可保留，不要求幼儿完成高龄推导，疲倦即停。'},'4-6');
 assert.deepEqual(Array.from(lines),['成人剪裁、准备并收齐纸片；纸片和笔不入口。','疲倦即停。']);
 e.safety='成人全程近距离陪伴；打翻即停，不能徒手清理。';
 assert.deepEqual(Array.from(ctx.visualSafety(e,{support:'成人独占温度计操作；可口述代记，不强求预期结论。'},'4-6')),[e.safety,'成人独占温度计操作。']);
 assert.deepEqual(Array.from(ctx.visualSafety(e,{support:e.safety+'温度计仅成人操作。'},'4-6')),[e.safety,'温度计仅成人操作。']);
 let touched=0;
 for(const raw of data.experiments)for(const age of ['4-6','7-9','10-12','13-16']){
  const e=resolveAgeProtocol(raw,age),g=e.ageGuides[age];
  const [safety,...guidance]=Array.from(ctx.visualSafety(e,g,age));
  const original=[e.safety,...(g.support&&!e.safety.includes(g.support)?[g.support]:[])];
  if(JSON.stringify([safety,...guidance])!==JSON.stringify(original))touched++;
  assert.ok(safety,`${raw.id}/${age}: missing safety`);
 }
 assert.ok(touched>=140);
});
test('Day 172 illustrated discovery preserves age-specific comparisons and full safety',()=>{
 for(const [age,comparison] of [['4-6',/等一样久.*5圈和20圈.*一样吗/],['7-9',/不搅、搅5圈、搅20圈/],['10-12',/同一观察时窗.*小圆和较大圆.*5或20圈.*水杯参照/],['13-16',/搅10圈的B和C.*缺测或无差别/]]){
  const e=structuredClone(resolveAgeProtocol(data.experiments[171],age)),g=e.ageGuides[age];
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  const discovery=html.match(/<section class="discovery">[^]*?<p>([^<]+)<\/p>/)[1];
  assert.match(discovery,comparison);assert.ok(html.includes(escape(e.safety)));assert.match(html,/height:24mm/);
  assert.ok(ctx.render(e,g,age).includes(escape(ctx.cards['172:'+age].discovery)));
  assert.deepEqual([...html.matchAll(/data-a4-action="(\d)"/g)].map(m=>m[1]),['2','3','4']);
  assert.match(html,/10 秒[\s\S]*60 秒[\s\S]*180 秒/);
  assert.match(html,/成人收废液/);
  if(age==='10-12')assert.match(html,/1 cm · 5 圈[\s\S]*3 cm · 20 圈[\s\S]*data-a4-water-only[\s\S]*W · 纯水/);
  if(age==='7-9')assert.match(html,/C0 · 不搅[\s\S]*S5 · 5 圈[\s\S]*M20 · 20 圈[\s\S]*指定零点/);
  if(age==='13-16'){
   assert.match(html,/A1 → D1 → B1 → C1 → C2 → B2 → D2 → A2/);
   assert.match(html,/B1[\s\S]*B2[\s\S]*C1[\s\S]*C2[\s\S]*同为 10 圈/);
  }
  g.observe='新的实际观察问题？';
  assert.notEqual(ctx.sourceCheck(e,g,age),ctx.cards['172:'+age].sourceCheck);
  const revised=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.ok(revised.includes(g.observe));assert.ok(!revised.includes(discovery));assert.doesNotMatch(revised,/data-a4-action/);
 }
});

test('material drawings identify anchored objects without replacing original directions',()=>{
 for(const [day,expected] of [[7,['paper']],[9,['measure','book','measure']],[14,['cup']]]){
  const age='4-6',e=resolveAgeProtocol(data.experiments[day-1],age),g=e.ageGuides[age];
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  const materials=html.match(/<section class="materials">[^]*?<\/section>/)[0];
  const icons=[...materials.matchAll(/data-icon="([^"]+)"/g)].map(m=>m[1]);
  if(day===9)assert.deepEqual(icons,expected);
  else for(const key of expected)assert.ok(icons.includes(key));
  for(const item of e.materials)assert.ok(materials.includes(escape(item)));
  if(day===14){
   assert.match(materials,/data-review="full"/);
   assert.doesNotMatch(materials,/按完整版的材料表准备/);
   assert.ok(ctx.render(e,g,age).includes('至少200毫升的敞口透明塑料杯1个'));
   const changed=structuredClone(e);
   changed.materials[0]+='材料清单更新。';
   const fallback=ctx.renderVisual(changed,changed.ageGuides[age],age,renderActivityDiagram);
   assert.match(fallback,/按完整版的材料表准备/);
   assert.doesNotMatch(fallback,/data-review="full"/);
  }
 }
 for(const age of ['10-12','13-16']){
  const e=resolveAgeProtocol(data.experiments[6],age),g=e.ageGuides[age];
  assert.match(ctx.renderVisual(e,g,age,renderActivityDiagram),/<li><svg [^>]*data-icon="paper"[^]*?<span>硬纸板1张（/);
 }
 for(const age of ['7-9','10-12','13-16']){
  const e=resolveAgeProtocol(data.experiments[13],age),g=e.ageGuides[age];
  assert.match(ctx.renderVisual(e,g,age,renderActivityDiagram),/<li><svg [^>]*data-icon="cup"/);
  assert.ok(ctx.render(e,g,age).includes(escape(e.materials[2])));
 }
 const e=structuredClone(resolveAgeProtocol(data.experiments[8],'4-6'));
 e.materials=['不用透明塑料杯；不要以书本替代','替代品不是直尺'];
 const materials=ctx.renderVisual(e,e.ageGuides['4-6'],'4-6',renderActivityDiagram).match(/<section class="materials">[^]*?<\/section>/)[0];
 assert.deepEqual([...materials.matchAll(/data-icon="([^"]+)"/g)].map(m=>m[1]),['list','list']);
});

test('print scenes keep exact artwork and accessibility, leaving non-duplicate and legacy framing alone',()=>{
 const raw=data.experiments[0],e=resolveAgeProtocol(raw,'4-6');
 const stable=svg=>svg.replace(/science-diagram-(\d+)-(\d+)-\d+/g,'science-diagram-$1-$2-serial');
 for(let step=0;step<4;step++){
  const web=stable(renderActivityDiagram(e,step,'4-6'));
  const print=stable(renderActivityDiagram(e,step,'4-6',{sceneOnly:true}));
  assert.match(web,/分龄操作图/);assert.doesNotMatch(print,/分龄操作图/);
  assert.match(print,/viewBox="24 65 592 235"/);
  for(const start of ['title','desc','defs'])assert.equal(print.match(new RegExp('<'+start+'[\\s\\S]*?</'+start+'>'))[0],web.match(new RegExp('<'+start+'[\\s\\S]*?</'+start+'>'))[0]);
  const extract=s=>s.slice(s.indexOf('<g clip-path='),s.lastIndexOf('</g>')+4);
  assert.notEqual(extract(web),'');assert.equal(extract(print),extract(web));
 }
 const unresolved=structuredClone(e);unresolved.steps[0].title='不同的外层标题';
 assert.equal(stable(renderActivityDiagram(unresolved,0,'4-6',{sceneOnly:true})),stable(renderActivityDiagram(unresolved,0,'4-6')));
 const legacy={...raw,ageProtocols:undefined};
 assert.equal(stable(renderActivityDiagram(legacy,0,'4-6',{sceneOnly:true})),stable(renderActivityDiagram(legacy,0,'4-6')));
});


test('Day 228 short preparation is pinned, age-specific and leaves full directions intact',()=>{
 for(const age of ['4-6','7-9','10-12','13-16']){
  const e=structuredClone(resolveAgeProtocol(data.experiments[227],age)),g=e.ageGuides[age];
  const complete=ctx.render(e,g,age), before=JSON.stringify(e);
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.equal(JSON.stringify(e),before);
  assert.equal(ctx.render(e,g,age),complete);
  assert.ok(html.includes(escape(e.safety)));
  if(age==='4-6'||age==='7-9'){
   assert.match(html,/data-review="setup" hidden/);
   assert.match(html,/5毫升样品＋5毫升I指示液/);
   e.materials[0]+='新的布置条件。';
   assert.doesNotMatch(ctx.renderVisual(e,g,age,renderActivityDiagram),/data-review="setup"/);
  }else assert.doesNotMatch(html,/data-review="setup"/);
 }
});

test('mechanical print setup summarizes only the exact pinned lesson without changing the full materials or safety',()=>{
 for(const day of [73,136])for(const age of ['4-6','7-9','10-12','13-16']){
  const e=structuredClone(resolveAgeProtocol(data.experiments[day-1],age)),g=e.ageGuides[age];
  const complete=ctx.render(e,g,age),before=JSON.stringify(e);
  const visual=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.match(visual,/data-review="setup" hidden/);
  assert.match(visual,day===73?/闭盒实称≤120克/:/坡高只有3或6厘米/);
  assert.ok(visual.includes(escape(e.safety)));
  assert.equal(JSON.stringify(e),before);
  assert.equal(ctx.render(e,g,age),complete);
  e.materials[0]+='新的器具限制。';
  const fallback=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.doesNotMatch(fallback,/data-review="setup"/);
  assert.match(fallback,/按完整版的材料表准备/);
 }
});

test('Day 203 print setup keeps the source pinned and the 10–12 fields covered until M',()=>{
 for(const age of ['10-12','13-16']){
  const e=structuredClone(resolveAgeProtocol(data.experiments[202],age)),g=e.ageGuides[age];
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  const setup=html.match(/<ul data-fit-inventory data-review="setup" hidden>(.*?)<\/ul>/s)?.[1];
  assert.ok(setup);
  assert.match(setup,/2003-19574.*24×19厘米.*不裁、不拉伸.*印不清，记未实施/s);
  assert.match(setup,/A4档案字段抄件/);
  assert.ok(html.includes(escape(e.safety)));
  assert.ok(ctx.render(e,g,age).includes(escape(e.materials[0])));
  if(age==='10-12'){
   assert.match(setup,/A4遮罩 ×1（开窗12×8厘米）.*先盖字段.*局部、全图、全图＋字段/s);
   assert.doesNotMatch(html,/1950s|1950年代|1903|Creator Unknown/);
  }else assert.match(setup,/对象／照片／扫描／上传分行；未列日期不落点/);
  e.materials[0]+='来源变化。';
  assert.doesNotMatch(ctx.renderVisual(e,g,age,renderActivityDiagram),/data-review="setup"/);
 }
});

test('Day 307 keeps dry observation, all safety, and a blank older audit separate from fictional inputs',()=>{
 for(const age of ['4-6','7-9','10-12','13-16']){
  const e=structuredClone(resolveAgeProtocol(data.experiments[306],age)),g=e.ageGuides[age],before=JSON.stringify(e);
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  const setup=html.match(/<ul data-fit-inventory data-review="setup" hidden>(.*?)<\/ul>/s)?.[1];
  assert.ok(setup);
  assert.match(setup,/最多约1毫升干颗粒.*只做干样观察，不加水/s);
  assert.match(setup,/食盐｜仅观察，不入口.*白糖｜仅观察，不入口/s);
  assert.match(setup,/湿纸巾×2和垃圾容器×1，仅成人清理用/);
  assert.ok(html.includes(escape(e.safety.replace('成人处理小样和水滴','成人处理干样'))));
  assert.ok(ctx.render(e,g,age).includes(escape(e.safety)));
  assert.doesNotMatch(html,/成人处理小样和水滴/);
  assert.equal(JSON.stringify(e),before);
  if(age==='13-16'){
   const steps=[...html.matchAll(/<section class="visual-step">(.*?)<\/section>/gs)].map(m=>m[1]);
   assert.equal(steps.length,4);
   assert.match(steps[1],/虚构输入.*S1食盐/s);
   assert.match(steps[2],/假设数据 · 不是实测.*圈出来/s);
   assert.equal((steps[2].match(/<circle\b/g)||[]).length,6);
   assert.doesNotMatch(steps[2],/只白：|白且粗：|仍不可分/);
   for(const i of [0,2,3])assert.doesNotMatch(steps[i],/S1食盐|S2食盐|T1白糖/);
  }else assert.doesNotMatch(html,/虚构输入|d307-print-audit/);
  e.materials[0]+='当前用量已变。';
  const fallback=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.doesNotMatch(fallback,/data-review="setup"|d307-print-audit/);
  assert.ok(fallback.includes(escape(e.safety)));
 }
});

test('Day 240 print setup preserves each age’s trials and removes F1 only from the youngest illustration',()=>{
 const ageCopy={'4-6':'F0、F2各1轮','7-9':'F0、F2、F1各1轮','10-12':'F0/F2/F1/F1/F2/F0共6轮','13-16':'实测和收整完再打开虚构模型'};
 for(const age of Object.keys(ageCopy)){
  const e=structuredClone(resolveAgeProtocol(data.experiments[239],age)),g=e.ageGuides[age],before=JSON.stringify(e);
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  const setup=html.match(/<ul data-fit-inventory data-review="setup" hidden>(.*?)<\/ul>/s)?.[1];
  assert.ok(setup?.includes(ageCopy[age]));
  assert.match(setup,/模板100%打印，核对100毫米标线/);
  assert.match(setup,/托盘距桌边至少150毫米.*需强推就只做纸上/);
  assert.ok(html.includes(escape(e.safety)));
  assert.equal(JSON.stringify(e),before);
  const panel=[...html.matchAll(/<section class="visual-step">(.*?)<\/section>/gs)][2][1];
  if(age==='4-6'){
   assert.match(panel,/F0 不加填充.*F2 两侧各一件.*只做F0和F2/s);
   assert.doesNotMatch(html,/F1/);
   assert.match(renderActivityDiagram(e,2,age,{sceneOnly:true}),/F1仅L/);
  }else assert.match(panel,/F1仅L/);
  e.materials[0]+='更新后的装置尺寸。';
  assert.doesNotMatch(ctx.renderVisual(e,g,age,renderActivityDiagram),/data-review="setup"/);
 }
});

test('Day 172 A4 preparation preserves the per-age cup counts, dry cleanup reserve and distinct controls',()=>{
 const counts={'4-6':'2杯2专勺','7-9':'3杯2专勺，C0不插勺','10-12':'5杯5专勺；W只有50毫升水也搅','13-16':'8杯8专勺'};
 for(const age of Object.keys(counts)){
  const e=structuredClone(resolveAgeProtocol(data.experiments[171],age)),g=e.ageGuides[age],before=JSON.stringify(e);
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  const setup=html.match(/<ul data-fit-inventory data-review="setup" hidden>(.*?)<\/ul>/s)?.[1];
  assert.ok(setup?.includes(counts[age]));
  assert.ok(setup.includes('另备清理水50毫升'));
  assert.ok(setup.includes(age==='13-16'?'废液罐≥1升':'废液罐≥500毫升'));
  assert.ok(html.includes(escape(e.safety)));
  assert.equal(JSON.stringify(e),before);
  if(age==='10-12')assert.match(setup,/另外4杯水50＋油2.5毫升/);
  if(age==='13-16')assert.match(setup,/另加1张A4记录纸/);
  e.materials[0]+='当前杯数已改。';
  assert.doesNotMatch(ctx.renderVisual(e,g,age,renderActivityDiagram),/data-review="setup"/);
 }
});

test('Day 250 child handout preserves assigned inputs and blank plots, while full diagrams keep their worked examples',()=>{
 for(const age of ['4-6','7-9','10-12','13-16']){
  const e=structuredClone(resolveAgeProtocol(data.experiments[249],age)),g=e.ageGuides[age],before=JSON.stringify(e);
  const html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.match(html,/data-review="setup" hidden/);
  assert.ok(html.includes(escape(e.safety)));
  assert.equal(JSON.stringify(e),before);
  const panels=[...html.matchAll(/<section class="visual-step">(.*?)<\/section>/gs)].map(m=>m[1]);
  const guides=panels.filter(s=>s.includes('data-a4-coordinate-exercise'));
  assert.equal(guides.length,age==='10-12'?1:age==='13-16'?3:2);
  assert.ok(guides.every(p=>!/<circle|<polygon/.test(p)));
  if(age==='4-6'){
   assert.match(panels[1],/第一张 · 画星.*右 2 格.*上 1 格/s);
   assert.match(panels[2],/第二张 · 画叉.*右 1 格.*上 2 格/s);
  }else if(age==='7-9'){
   assert.match(panels[1],/P：\(3,1\)/);
   assert.match(panels[2],/Q：\(1,3\)/);
   assert.doesNotMatch(html,/和P=\(3,1\)不同/);
  }else if(age==='10-12'){
   assert.match(panels[0],/预给A\/B\/C\/D四点/);
   assert.match(panels[2],/\(2,2\) ↔ \(2,2\)/);
   assert.doesNotMatch(html,/交换仍同点|对角线上x=y/);
  }else{
   assert.match(panels[0],/T原点是S的\(2,2\)/);
   assert.match(panels[1],/u=x−2，v=y−2/);
   assert.match(panels[2],/x=u\+2，y=v\+2/);
   assert.doesNotMatch(html,/P在T为|Q在T为|交换不一定不同/);
   assert.match(renderActivityDiagram(e,1,age,{sceneOnly:true}),/P在T为.*Q在T为/s);
  }
  e.materials[0]+='当前规则已更新。';
  assert.doesNotMatch(ctx.renderVisual(e,g,age,renderActivityDiagram),/data-a4-coordinate-exercise|data-review="setup"/);
 }
});

test('Day 255 print links calibrated masters and separates real observations from blank older model rows',()=>{
 const forms={'4-6':'4张观察空表','7-9':'5张观察空表','10-12':'8张观察空表','13-16':'6张观察空表'};
 for(const age of Object.keys(forms)){
  const e=structuredClone(resolveAgeProtocol(data.experiments[254],age)),g=e.ageGuides[age];
  const before=JSON.stringify(e),html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  const setup=html.match(/<ul data-fit-inventory data-review="setup" hidden>(.*?)<\/ul>/s)?.[1];
  assert.ok(setup?.includes(forms[age]));
  assert.match(setup,/按100%打印，先核100毫米线.*不合格就只做纸上/s);
  assert.ok(html.includes(escape(e.safety)));
  assert.equal(JSON.stringify(e),before);
  if(age==='13-16'){
   const model=html.match(/<svg[^>]+data-a4-optics-model.*?<\/svg>/s)?.[0];
   assert.match(model,/收妥装置后.*墙交点.*靶交点.*40°.*45°.*50°.*推算不回填真实观察/s);
   assert.match(setup,/O\/C\/U45\/U40\/U50\/C.*实录或记未做.*关灯收妥.*最后看示例/);
   assert.doesNotMatch(html,/cot\(2θ\)|x靶 =/);
   assert.match(renderActivityDiagram(e,2,age,{sceneOnly:true}),/cot\(2θ\)/);
  }else assert.doesNotMatch(html,/data-a4-optics-model/);
  e.materials[0]+='装置已调整。';
  assert.doesNotMatch(ctx.renderVisual(e,g,age,renderActivityDiagram),/data-review="setup"|data-a4-optics-model/);
 }
});

test('Days 235 and 248 label adult-only handling on the correct pinned print steps',()=>{
 for(const day of [235,248])for(const age of ['4-6','7-9','10-12','13-16']){
  const e=structuredClone(resolveAgeProtocol(data.experiments[day-1],age)),g=e.ageGuides[age];
  const before=JSON.stringify(e),html=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.match(html,/data-review="setup" hidden/);
  assert.ok(html.includes(escape(e.safety)));
  assert.equal(JSON.stringify(e),before);
  const roles=[...html.matchAll(/class="step-role">([^<]+)<\/p>/g)].map(m=>m[1]);
  assert.equal(roles.length,4);
  assert.ok(roles.every(role=>role!=='亲子一起'));
  if(day===248){
   assert.match(html,/半花母版整张A4不剪.*A4折剪母版.*按100%打印，先核100毫米线/s);
   assert.match(html,age==='7-9'?/仅本龄在X框自选位置画≤2×2毫米小叉/:/X框留空/);
   assert.match(roles[age==='13-16'?0:2],/剪好收剪刀 · 孩子再拿纸/);
   if(age==='13-16'){
    assert.match(html,/实物观察及折剪完成，再开纸上模型/);
    assert.match(html,/10°：d的符号？/);
    assert.doesNotMatch(html,/d&lt;0，背侧|P′=P−2\(n·P\)n/);
   }else assert.match(roles[1],/成人转镜 · 孩子/);
  }else{
   assert.match(roles[0],/^成人备样 · 孩子/);
   assert.match(html,/白醋仅1毫升.*干区离湿盘至少40厘米/s);
   assert.match(html,/杯图不预填液体色/);
   if(age==='10-12')assert.match(html,/各自写完再揭表/);
   if(age==='13-16')assert.match(html,/收液后揭表。实录后才打开六行虚构模型/);
  }
  e.materials[0]+='制备条件已更新。';
  const reset=ctx.renderVisual(e,g,age,renderActivityDiagram);
  assert.doesNotMatch(reset,/data-review="setup"/);
  assert.match(reset,/class="step-role">亲子一起/);
 }
});
