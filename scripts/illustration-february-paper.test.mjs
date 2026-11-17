import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const ages=['4-6','7-9','10-12','13-16'],count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('span supports and load retain exact bounds and youngest is never loaded',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[51],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);for(const p of scene.elements.filter(p=>p.type==='rect'&&['#D9E4DB','#D7C7E8'].includes(p.fill)))assert.ok(svg.includes(`data-bounds="${p.x},${p.y},${p.width},${p.height}"`));
 assert.equal(count(svg,'data-material="single-span-support"'),scene.elements.filter(p=>p.type==='rect'&&p.fill==='#D9E4DB').length);assert.equal(count(svg,'data-material="single-taped-paper-load"'),scene.elements.filter(p=>p.type==='rect'&&p.fill==='#D7C7E8').length);
 if(age==='4-6')assert.doesNotMatch(svg,/single-taped-paper-load/);
 }
});
test('paper guides preserve labels, isolate their exact source and use unique SVG identities',()=>{
 for(const id of[45,52])for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);assert.match(svg,/february-(fold|span)-v1/);for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)));
 const again=renderActivityDiagram(e,s,age);for(const m of svg.matchAll(/id="([^"]+)"/g))assert.ok(!again.includes(`id="${m[1]}"`));
 const c=structuredClone(e);c.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(c,s,age),/february-(fold|span)-v1/);
 }
 for(const e of rows.filter(e=>![45,52].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(fold|span)-v1/);
});
test('youngest folded-paper task has no supports or load and all original edge endpoints remain',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[44],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);if(age==='4-6')assert.doesNotMatch(svg,/single-hardback-support|single-paper-packet/);
 for(const p of scene.elements.filter(p=>p.type==='line'&&p.strokeWidth===4))assert.ok(svg.includes(`M${p.x1} ${p.y1}L${p.x2} ${p.y2}`));
 }
});
