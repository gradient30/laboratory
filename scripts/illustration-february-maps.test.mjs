import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments,ages=['4-6','7-9','10-12','13-16'];
const count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('map renderers keep source labels and geometry and fail closed when source changes',()=>{
 for(const id of[43,50])for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);if(id===50||(age==='4-6'&&s===0))assert.match(svg,/february-maps-v1/);else assert.doesNotMatch(svg,/february-maps-v1/);
 for(const p of scene.elements){if(p.type==='text')assert.ok(svg.includes(esc(p.text)));if(['line','arrow'].includes(p.type))assert.ok(svg.includes(`x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"`));if(p.type==='circle')assert.ok(svg.includes(`cx="${p.x}" cy="${p.y}" r="${p.r}"`));}
 const clone=structuredClone(e);clone.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(clone,s,age),/february-maps-v1/);
 }
 for(const e of rows.filter(e=>![43,50].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-maps-v1/);
});
test('pictures only clarify youngest material cards, never reveal hidden legends or modify encoded symbols',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const svg=renderActivityDiagram(rows[42],s,age),yes=age==='4-6'&&s===0;for(const kind of['tree','bench','pond'])assert.equal(count(svg,`data-material="${kind}-picture"`),yes?1:0);
 const r=renderActivityDiagram(rows[49],s,age);for(const kind of['tree','house','pond'])assert.equal(count(r,`data-material="${kind}-picture"`),age==='4-6'?1:0);
 }
});
test('fixed table star never rotates; movable route paper is never taped down',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const scene=rows[49].ageProtocols[age].diagrams[s],svg=renderActivityDiagram(rows[49],s,age);assert.equal(count(svg,'data-reference="fixed-table-star"'),1);assert.match(svg,/<text x="580" y="117"[^>]*>★<\/text>/);
 const sheets=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#FAF6E9');const fixed=age==='4-6'?1:age==='7-9'?0:sheets.length;assert.equal(count(svg,'data-material="fixed-map-paper"'),fixed);assert.equal(count(svg,'data-material="transparent-moving-sheet"'),['10-12','13-16'].includes(age)?sheets.length:0);
 }
});
test('constructed quarter/half-turn point coordinates and inverse-axis cases remain geometrically consistent',()=>{
 const points=(age,s)=>rows[49].ageProtocols[age].diagrams[s].elements.filter(e=>e.type==='circle').map(e=>[e.x,e.y]);
 const rotate=([x,y])=>[320-(y-195),195+(x-320)];
 for(const age of['7-9','10-12']){const p=points(age,0);assert.deepEqual(points(age,1),p.map(rotate));assert.deepEqual(points(age,2),p.map(rotate).map(rotate));assert.deepEqual(points(age,3),p);}
 const passive=points('13-16',1),initial=points('10-12',0);assert.deepEqual(passive,initial);assert.deepEqual(points('13-16',2),initial.map(rotate));
});
