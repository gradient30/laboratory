import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
test('January pilot covers exactly 16 age-specific leaf scenes and retains every text label',()=>{
 const e=rows[2];let n=0;
 for(const [age,p] of Object.entries(e.ageProtocols))for(let s=0;s<4;s++){
  const svg=renderActivityDiagram(e,s,age);assert.match(svg,/data-illustration-version="january-leaf-v1"/);
  for(const el of p.diagrams[s].elements.filter(x=>x.type==='text')) assert.ok(svg.includes(el.text),el.text);
  const leaves=p.diagrams[s].elements.filter(x=>x.type==='circle'&&x.fill==='#A5CF92').length;
  assert.equal((svg.match(/data-material="(?:mint|celery)-leaf"/g)||[]).length,leaves);
  assert.doesNotMatch(svg,/NaN|undefined|<image|<script|<foreignObject/);n++;
 }assert.equal(n,16);
});
test('changed source falls back rather than using stale material assumptions',()=>{
 const e=structuredClone(rows[2]);e.ageProtocols['4-6'].diagrams[0].description+=' changed';
 assert.doesNotMatch(renderActivityDiagram(e,0,'4-6'),/data-illustration-version/);
});
test('other courses retain unstyled protocol renderer',()=>{
 for(const e of rows.filter(e=>e.id!==3))for(const age of Object.keys(e.ageProtocols))for(let s=0;s<4;s++) assert.doesNotMatch(renderActivityDiagram(e,s,age),/data-illustration-version="january-leaf-v1"/);
});
test('projected active-age protocol receives the same pilot',()=>{const e=structuredClone(rows[2]);e.activeAgeProtocol=e.ageProtocols['4-6'];delete e.ageProtocols;assert.match(renderActivityDiagram(e,0,'4-6'),/data-illustration-version/);});
test('pilot top labels clear the clip edge and explicit adult handling has visible hands',()=>{
 const e=rows[2];
 for(const [age,p] of Object.entries(e.ageProtocols))for(let i=0;i<4;i++){
  const svg=renderActivityDiagram(e,i,age);
  for(const el of p.diagrams[i].elements.filter(x=>x.type==='text'&&x.y<90)) assert.ok(svg.includes(`y="90"`),el.text);
 }
 assert.equal((renderActivityDiagram(e,1,'4-6').match(/data-action="adult-hand"/g)||[]).length,2);
 assert.equal((renderActivityDiagram(e,3,'4-6').match(/data-action="adult-hand"/g)||[]).length,1);
 assert.equal((renderActivityDiagram(e,2,'4-6').match(/data-action="adult-hand"/g)||[]).length,0);
});
