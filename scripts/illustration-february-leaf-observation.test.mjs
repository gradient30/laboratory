import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const ages=['4-6','7-9','10-12','13-16'],count=(s,m)=>s.split(m).length-1;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function outlines(scene){const groups=[];for(let i=0;i<scene.elements.length;i++){const a=scene.elements.slice(i,i+8);if(a.length===8&&a.every((p,k)=>p.type==='line'&&p.stroke==='#52715B'&&p.x2===a[(k+1)%8].x1&&p.y2===a[(k+1)%8].y1)){groups.push(a);i+=7;}}return groups;}
test('vein leaves keep source extrema and do not invent internal branches',()=>{
 for(const age of ages)for(let step=0;step<4;step++){
 const e=rows[40],scene=e.ageProtocols[age].diagrams[step],svg=renderActivityDiagram(e,step,age),groups=outlines(scene);assert.equal(count(svg,'data-material="generic-leaf-location"'),groups.length);
 for(const p of groups)assert.ok(svg.includes(`data-extents="${p[6].x1},${p[0].y1},${p[2].x1},${p[4].y1}"`));
 for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)));
 assert.equal(count(svg,'data-material="battery-led-lamp"'),scene.elements.filter(p=>p.type==='rect'&&p.fill==='#E5D8B7'&&p.width===60&&p.height===30).length);
 const again=renderActivityDiagram(e,step,age);for(const m of svg.matchAll(/id="([^"]+)"/g))assert.ok(!again.includes(`id="${m[1]}"`));
 }
});
test('February leaf detail styles require exact scene and stay confined to their days',()=>{
 for(const id of [34,41])for(const age of ages)for(let s=0;s<4;s++){const e=structuredClone(rows[id-1]);e.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(leaf-edge|vein)-v1/);}
 for(const e of rows.filter(e=>![34,41].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(leaf-edge|vein)-v1/);
});
test('edge observation preserves all eight outline vertices and every authored label',()=>{
 for(const age of ages)for(let step=0;step<4;step++){
 const e=rows[33],scene=e.ageProtocols[age].diagrams[step],svg=renderActivityDiagram(e,step,age);assert.match(svg,/february-leaf-edge-v1/);
 for(const a of outlines(scene))assert.ok(svg.includes('M'+a.map(p=>`${p.x1} ${p.y1}`).join('L')+'Z'));
 for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)));
 const again=renderActivityDiagram(e,step,age);for(const m of svg.matchAll(/id="([^"]+)"/g))assert.ok(!again.includes(`id="${m[1]}"`));
 }
});
