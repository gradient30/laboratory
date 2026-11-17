import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments,ages=['4-6','7-9','10-12','13-16'];
const count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const cards=scene=>scene.elements.filter(p=>p.type==='rect'&&(scene.sceneKey.startsWith('ten-')?['#BEDDDD','#F3D5AE'].includes(p.fill):p.width<100));
test('number cards retain all source text and use exact-scene fallback only for days 40/47',()=>{
 for(const id of[40,47])for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);assert.match(svg,/february-number-v1/);for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)),scene.sceneKey+': '+p.text);
 const clone=structuredClone(e);clone.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(clone,s,age),/february-number-v1/);
 }
 for(const e of rows.filter(e=>![40,47].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-number-v1/);
});
test('ten-frame original grid and cards stay fixed; youngest stock conserves six blue plus four orange',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[39],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);const outside=age==='4-6'?[10,4,0,4][s]:0;
 assert.equal(count(svg,'data-role="outside-frame-card"'),outside);assert.equal(count(svg,'data-material="number-paper-card"'),cards(scene).length+outside);
 for(const p of cards(scene))assert.ok(svg.includes(`data-bounds="${p.x},${p.y},${p.width},${p.height}"`));
 for(const p of scene.elements.filter(p=>p.type==='line'))assert.ok(svg.includes(`M${p.x1} ${p.y1}L${p.x2} ${p.y2}`));
 if(age==='4-6'){
 const section=svg.slice(svg.indexOf('data-material="february-number-v1"'));assert.equal(count(section,'fill="#B8D8EB"'),6);assert.equal(count(section,'fill="#F4CB95"'),4);
 for(const m of section.matchAll(/data-bounds="([\d,.]+)" data-role="outside-frame-card"/g)){const[x,y,w,h]=m[1].split(',').map(Number);assert.ok(x>=470&&x+w<=616&&y>=65&&y+h<=300);}
 }
 }
});
test('counting audit keeps eight cards outside a usable empty counted area; all other source card positions remain',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[46],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);assert.equal(count(svg,'data-material="number-paper-card"'),cards(scene).length);
 if(scene.sceneKey==='count47-79-audit'){
 assert.equal(count(svg,'data-action="empty-counted-area"'),1);assert.equal(count(svg,'data-action="move-one-card"'),1);assert.match(svg,/x="350" y="145" width="240" height="140"/);assert.doesNotMatch(svg,/x="55" y="280" width="500" height="18"/);
 for(let i=0;i<8;i++)assert.ok(svg.includes(`data-bounds="${60+i%4*55},${150+Math.floor(i/4)*70},40,40"`));
 }else{assert.doesNotMatch(svg,/empty-counted-area/);for(const p of cards(scene))assert.ok(svg.includes(`data-bounds="${p.x},${p.y},${p.width},${p.height}"`));}
 }
});
