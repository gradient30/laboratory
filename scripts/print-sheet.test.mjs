import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {resolveAgeProtocol,renderActivityDiagram} from '../dist/diagrams.js';
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(app.split('\n').find(l=>l.startsWith('const escapeHTML='))+'\n'+app.slice(app.indexOf('function renderExperimentPrintSheet('),app.indexOf('function openExperimentPrintSheet('))+'\nglobalThis.render=renderExperimentPrintSheet;globalThis.cards=EXPERIMENT_PRINT_CARDS;globalThis.sourceCheck=printSourceCheck;globalThis.renderCard=renderConcisePrintSheet;globalThis.renderVisual=renderVisualPrintSheet;',ctx);
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
  let size=11,blocked=false;const sheet={isConnected:true,style:{setProperty:(name,s)=>{if(name==='--body-size')size=parseFloat(s)}},get scrollHeight(){return base*size/11},scrollWidth:733,clientWidth:733};
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
  assert.deepEqual(actual,day===172?[[0,age]]:[[0,age],[1,age],[2,age],[3,age]]);
  assert.equal((html.match(/class="science-diagram"/g)||[]).length,4);
  if(day!==1)assert.ok(html.includes(escape(e.safety)));
  assert.equal((html.match(/viewBox="24 65 592 235"/g)||[]).length,day===172?1:4);
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
  if(age==='10-12')assert.match(html,/1 cm · 5 圈[\s\S]*3 cm · 20 圈[\s\S]*水杯参照/);
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
  if(day!==14)for(const item of e.materials)assert.ok(materials.includes(escape(item)));
  else{
   assert.match(materials,/按完整版的材料表准备/);
   assert.ok(ctx.render(e,g,age).includes('至少200毫升的敞口透明塑料杯1个'));
  }
  assert.ok(html.includes(escape(e.safety)));
 }
 for(const age of ['10-12','13-16']){
  const e=resolveAgeProtocol(data.experiments[6],age),g=e.ageGuides[age];
  assert.match(ctx.renderVisual(e,g,age,renderActivityDiagram),/<li><svg [^>]*data-icon="paper"[^]*?<span>硬纸板1张（/);
 }
 for(const age of ['7-9','10-12','13-16']){
  const e=resolveAgeProtocol(data.experiments[13],age),g=e.ageGuides[age];
  assert.match(ctx.renderVisual(e,g,age,renderActivityDiagram),/class="recognize"><svg [^>]*data-icon="cup"/);
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
