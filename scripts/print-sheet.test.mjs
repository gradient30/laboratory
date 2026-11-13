import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {resolveAgeProtocol} from '../dist/diagrams.js';
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(app.split('\n').find(l=>l.startsWith('const escapeHTML='))+'\n'+app.slice(app.indexOf('function renderExperimentPrintSheet('),app.indexOf('function openExperimentPrintSheet('))+'\nglobalThis.render=renderExperimentPrintSheet;',ctx);
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
test('all 1460 age-specific print sheets preserve every material, operation and safety requirement without changing curriculum',()=>{
 const before=JSON.stringify(data);let count=0;
 for(const raw of data.experiments)for(const age of ['4-6','7-9','10-12','13-16']){
  const e=resolveAgeProtocol(raw,age),g=e.ageGuides[age],html=ctx.render(e,g,age);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  for(const text of [...e.materials,e.safety,...e.steps.flatMap((s,i)=>[s.title,s.detail,g.steps[i].action,g.steps[i].caption,g.steps[i].adultNote])].filter(Boolean))assert.ok(html.includes(escape(text)),`${raw.id}/${age}: missing ${text}`);
  assert.equal((html.match(/class="step"/g)||[]).length,4);assert.match(html,/@page\{size:A4/);assert.doesNotMatch(html,/overflow:\s*hidden/);count++;
 }
 assert.equal(count,1460);assert.equal(JSON.stringify(data),before);
});
test('print sheet escapes course strings and contains no saved child record',()=>{
 const e=structuredClone(resolveAgeProtocol(data.experiments[0],'4-6'));e.title='<img src=x onerror=alert(1)>';const html=ctx.render(e,e.ageGuides['4-6'],'4-6');assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('record-area'));assert.match(app,/printButton.addEventListener\('click',openExperimentPrintSheet\)/);
});
test('print fitting never shrinks below 9pt and explicitly retains overflow for continuation pages',()=>{
 const fitSource=app.slice(app.indexOf(' const fit=()=>'),app.indexOf("\n doc.querySelector('#print-now')"));
 for(const base of [900,1150,2000]){
  let size=11,multiple=false;const sheet={style:{setProperty:(_,s)=>{size=parseFloat(s)}},get scrollHeight(){return base*size/11},classList:{toggle:(_,v)=>{multiple=v}}},status={};
  vm.runInNewContext(fitSource+';fit();',{popup:{closed:false},sheet,status});
  assert.ok(size>=9&&size<=11);assert.equal(multiple,base*size/11>277*96/25.4+1);
  if(multiple)assert.match(status.textContent,/自动续页，不截断/);else assert.match(status.textContent,/一张 A4/);
 }
});
