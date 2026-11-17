import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments,ages=['4-6','7-9','10-12','13-16'];
const count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('leaf measurement renderers retain source labels and reject every changed scene',()=>{
 for(const id of[48,55])for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);assert.match(svg,/february-leaf-measure-v1/);for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)),scene.sceneKey);
 const clone=structuredClone(e);clone.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(clone,s,age),/february-leaf-measure-v1/);
 }
 for(const e of rows.filter(e=>![48,55].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-leaf-measure-v1/);
});
test('original line endpoints stay fixed except the separately tested erroneous rotation',()=>{
 for(const id of[48,55])for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);
 for(const p of scene.elements.filter((p,i)=>p.type==='line'&&!(scene.sceneKey==='size-79-rotate'&&i>=12&&i<=16)))assert.ok(svg.includes(`x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"`),scene.sceneKey+JSON.stringify(p));
 const rs=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#E5D8B7');assert.equal(count(svg,'data-material="leaf-ruler"'),rs.length);
 for(const p of rs)assert.ok(svg.includes(`data-source-bounds="${p.x},${p.y},${p.width},${p.height}"`));
 }
});
test('physical leaf disappears after tracing; fixed tracing sheet does not move with underlying grid',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const svg=renderActivityDiagram(rows[54],s,age);assert.equal(count(svg,'data-material="original-leaf-silhouette"'),age==='4-6'&&s===0?1:0);
 assert.equal(count(svg,'data-material="fixed-tracing-paper"'),age==='7-9'?1:0);assert.equal(count(svg,'data-material="paper-edge-tape"'),age==='7-9'?2:0);
 if(age==='7-9'){assert.ok(svg.includes('data-bounds="50,85,210,202"'));const x=s<2?60:71.25,y=s<2?95:106.25;assert.ok(svg.includes(`x="${x}" y="${y}" width="180" height="180"`));}
 }
 const transfer=renderActivityDiagram(rows[47],1,'4-6');assert.match(transfer,/transfer-endpoint-marks/);const align=renderActivityDiagram(rows[47],2,'4-6');assert.match(align,/aligned-base-marks/);assert.doesNotMatch(align,/original-leaf-silhouette/);
});

test('same leaf uses a rigid half-turn, including blade axis and petiole, instead of a new diamond',()=>{
 const e=rows[47],scene=e.ageProtocols['7-9'].diagrams[2],svg=renderActivityDiagram(e,2,'7-9');
 const match=svg.match(/<g data-action="same-leaf-rotated-180" transform="matrix\(-1 0 0 -1 635 365\)">([\s\S]*?)<\/g>/);assert.ok(match);
 for(const p of scene.elements.slice(2,12))assert.ok(match[1].includes(`x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"`));
 const a=scene.elements.slice(2,10).map(p=>[p.x1,p.y1]),b=a.map(([x,y])=>[635-x,365-y]);
 const area=v=>Math.abs(v.reduce((sum,[x,y],i)=>{const[x2,y2]=v[(i+1)%v.length];return sum+x*y2-y*x2;},0)/2);
 const bounds=v=>[Math.max(...v.map(p=>p[0]))-Math.min(...v.map(p=>p[0])),Math.max(...v.map(p=>p[1]))-Math.min(...v.map(p=>p[1]))];
 assert.ok(Math.abs(area(a)-area(b))<1e-8);assert.deepEqual(bounds(a),bounds(b));assert.equal(count(svg,'data-material="original-leaf-silhouette"'),2);
 for(const[x,y]of b)assert.ok(x>360&&x<575&&y>105&&y<275);
});
