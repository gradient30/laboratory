import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const ages=['4-6','7-9','10-12','13-16'],count=(s,m)=>s.split(m).length-1;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('map books and paper tokens keep exact source bounds and are distinct materials',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[35],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age),zone=scene.elements.find(p=>p.type==='rect'&&p.fill==='#F6F0DF');
 const items=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#E0E9DB');let books=0,papers=0;
 for(const p of items){const isBook=zone&&p.x>=zone.x&&p.y>=zone.y&&p.x+p.width<=zone.x+zone.width&&p.y+p.height<=zone.y+zone.height;isBook?books++:papers++;assert.ok(svg.includes(`data-material="${isBook?'closed-notebook':'paper-map-token'}" data-bounds="${p.x},${p.y},${p.width},${p.height}"`));}
 assert.equal(count(svg,'data-material="closed-notebook"'),books);assert.equal(count(svg,'data-material="paper-map-token"'),papers);
 for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)));
 }
});
test('February map and bridge require exact source and never spread to unrelated courses',()=>{
 for(const id of [36,38])for(const age of ages)for(let s=0;s<4;s++){const e=structuredClone(rows[id-1]);e.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(map|bridge)-v1/);}
 for(const e of rows.filter(e=>![36,38].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(map|bridge)-v1/);
});
test('bridge retains single-book supports, all captions and unique gradient identities',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[37],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);assert.match(svg,/february-bridge-v1/);
 assert.equal(count(svg,'data-material="single-hardback-support"'),scene.elements.filter(p=>p.type==='rect'&&p.fill==='#D5DFD5').length);
 for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)));
 const second=renderActivityDiagram(e,s,age),ids=[...svg.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);for(const id of ids)assert.ok(!second.includes(`id="${id}"`));
 }
});
