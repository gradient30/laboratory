import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments,ages=['4-6','7-9','10-12','13-16'];
const count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('instrument source locks preserve all labels, ticks, guides and target bounding boxes; unrelated diagrams fall through',()=>{
 for(const id of[51,58])for(const age of ages)for(let step=0;step<4;step++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[step],svg=renderActivityDiagram(e,step,age);
 assert.equal(svg.includes('february-instruments-v1'),scene.sceneKey!=='tare51-1012-parts');
 for(const p of scene.elements){
 if(p.type==='text')assert.ok(svg.includes(esc(p.text)),scene.sceneKey+': '+p.text);
 if(['line','arrow'].includes(p.type))assert.ok(svg.includes(`x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"`),scene.sceneKey);
 if(p.type==='rect')assert.ok(svg.includes(`x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"`),scene.sceneKey);
 }
 const changed=structuredClone(e);changed.ageProtocols[age].diagrams[step].description+=' changed';assert.doesNotMatch(renderActivityDiagram(changed,step,age),/february-instruments-v1/);
 }
 for(const e of rows.filter(e=>![51,58].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-instruments-v1/);
});
test('scales retain flat-bottom contact and empty/loaded states with unread displays, never numerical mass or automatic zero',()=>{
 for(const age of ages)for(let step=0;step<4;step++){
 const scene=rows[50].ageProtocols[age].diagrams[step],svg=renderActivityDiagram(rows[50],step,age);
 const scales=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#CDD9D7');
 assert.equal(count(svg,'data-material="kitchen-scale"'),scales.length);assert.equal(count(svg,'data-material="unread-scale-display"'),scales.length);
 if(!scales.length)continue;
 assert.ok(svg.includes('待读 g'));assert.doesNotMatch(svg,/>\s*\d+(?:\.\d+)?\s*g\s*</);
 const bottoms=scene.elements.filter(p=>p.type==='line'&&p.y1===270&&p.y2===270);
 assert.equal(count(svg,'data-material="open-flat-box"'),bottoms.length);
 for(const p of bottoms)assert.ok(svg.includes(`data-contact="${p.x1},270,${p.x2},270"`));
 assert.ok(svg.includes('data-bounds="115,270,410,28"'));
 }
});
test('paper and plastic ruler roles remain distinct; one interval bracket uses two adjacent ticks, not two units',()=>{
 for(const age of ages)for(let step=0;step<4;step++){
 const scene=rows[57].ageProtocols[age].diagrams[step],svg=renderActivityDiagram(rows[57],step,age);
 const rulers=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#F0E4BD'),strips=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#BBDCD6');
 assert.equal(count(svg,`data-material="${age==='13-16'?'constructed-paper-ruler':'plastic-ruler'}"`),rulers.length);
 assert.equal(count(svg,'data-material="target-paper-strip"'),strips.length);
 assert.equal(count(svg,'data-action="one-centimeter-interval"'),scene.sceneKey==='offset58-46-gaps'?1:0);
 if(scene.sceneKey==='offset58-46-gaps')assert.match(svg,/x1="65" y1="162" x2="100" y2="162"/);
 }
});
test('nonzero starts preserve strip lengths and older fixed-strip coordinates with descending ruler labels',()=>{
 const diagrams=rows[57].ageProtocols;
 const strip=s=>s.elements.find(p=>p.type==='rect'&&p.fill==='#BBDCD6');
 const young=diagrams['4-6'].diagrams.map(strip);
 assert.ok(young.every(p=>p.width===280));assert.equal(young[2].x-young[0].x,3*35);
 const older=diagrams['10-12'].diagrams;
 assert.ok(older.map(strip).every(p=>p.x===240&&p.width===210&&p.y===180));
 const numbers=s=>s.elements.filter(p=>p.type==='text'&&/^\d+$/.test(p.text)).map(p=>Number(p.text));
 for(const s of older.slice(2)){const n=numbers(s);assert.equal(n.length,15);assert.ok(n.slice(1).every((v,i)=>v===n[i]-1));}
});
