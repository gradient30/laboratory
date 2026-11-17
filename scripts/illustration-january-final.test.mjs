import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const marker=/january-day(?:2628|2931)-material-v1/;
const ages=['4-6','7-9','10-12','13-16'];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
test('January days 26–31 render 96 material scenes and retain every source label',()=>{
 let n=0;
 for(let id=26;id<=31;id++) for(const age of ages) for(let i=0;i<4;i++){
  const e=rows[id-1],svg=renderActivityDiagram(e,i,age);
  assert.match(svg,marker,`${id}/${age}/${i}`);
  for(const t of e.ageProtocols[age].diagrams[i].elements.filter(x=>x.type==='text'))assert.ok(svg.includes(escape(t.text)),`${id}/${age}/${i}: ${t.text}`);
  assert.doesNotMatch(svg,/NaN|undefined|<image|<script|<foreignObject/);n++;
 }
 assert.equal(n,96);
});
test('January final material renderers reject changed descriptions, keys, and element geometry',()=>{
 for(let id=26;id<=31;id++) for(const age of ages) for(let i=0;i<4;i++) for(const change of ['description','sceneKey','elements']){
  const e=structuredClone(rows[id-1]),s=e.ageProtocols[age].diagrams[i];
  if(change==='elements')s.elements[0].x=(s.elements[0].x||0)+1;else s[change]+=' changed';
  assert.doesNotMatch(renderActivityDiagram(e,i,age),marker,`${id}/${age}/${i}/${change}`);
 }
});
test('January final additions do not apply to any other day',()=>{
 for(const e of rows) if(e.id<26||e.id>31) for(const age of ages) for(let i=0;i<4;i++)assert.doesNotMatch(renderActivityDiagram(e,i,age),marker);
});
test('January final material scenes work with active protocol projections for all ages',()=>{
 for(let id=26;id<=31;id++) for(const age of ages){const e=structuredClone(rows[id-1]);e.activeAgeProtocol=e.ageProtocols[age];delete e.ageProtocols;for(let i=0;i<4;i++)assert.match(renderActivityDiagram(e,i,age),marker);}
});
