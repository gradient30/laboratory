import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const ages=['4-6','7-9','10-12','13-16'],count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('youngest starting setup shows one measuring vessel and both empty A/B cups',()=>{
 const svg=renderActivityDiagram(rows[36],0,'4-6');assert.equal(count(svg,'data-material="graduated-plastic-vessel"'),1);assert.equal(count(svg,'data-material="observation-plastic-cup"'),2);assert.match(svg,/A 空杯/);assert.match(svg,/B 空杯/);
});
test('measurement scenes preserve source labels, unique gradients and exact-source fallback',()=>{
 for(const id of[37,44])for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[id-1],svg=renderActivityDiagram(e,s,age),scene=e.ageProtocols[age].diagrams[s];assert.match(svg,/february-(cup|reading)-v1/);
 for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)));
 const again=renderActivityDiagram(e,s,age);for(const m of svg.matchAll(/id="([^"]+)"/g))assert.ok(!again.includes(`id="${m[1]}"`));
 const changed=structuredClone(e);changed.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(changed,s,age),/february-(cup|reading)-v1/);
 }
 for(const e of rows.filter(e=>![37,44].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(cup|reading)-v1/);
});
test('height rulers stay external while volume vessel graduations are part of vessel',()=>{
 assert.match(renderActivityDiagram(rows[36],3,'4-6'),/data-material="vessel-graduations"/);
 for(const s of[0,2,3])assert.doesNotMatch(renderActivityDiagram(rows[36],s,'10-12'),/data-material="vessel-graduations"/);
});
