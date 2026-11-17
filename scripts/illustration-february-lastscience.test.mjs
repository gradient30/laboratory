import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments,ages=['4-6','7-9','10-12','13-16'];
const count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const selected=s=>s.sceneKey.startsWith('sugar53-')||s.elements.some(p=>p.type==='rect'&&['#D7E3D9','#F7F1DE','#D8C7E9'].includes(p.fill));
test('last-science full scene locks retain labels and all original force/guide arrows, lines and source boundaries',()=>{
 for(const id of[53,59])for(const age of ages)for(let step=0;step<4;step++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[step],svg=renderActivityDiagram(e,step,age);
 assert.equal(svg.includes('february-lastscience-v1'),selected(scene));
 for(const p of scene.elements){
 if(p.type==='text')assert.ok(svg.includes(esc(p.text)),scene.sceneKey);
 if(['line','arrow'].includes(p.type))assert.ok(svg.includes(`x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"`),scene.sceneKey);
 if(p.type==='rect')assert.ok(svg.includes(`x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"`)||svg.includes(`data-bounds="${p.x},${p.y},${p.width},${p.height}"`),scene.sceneKey);
 }
 const c=structuredClone(e);c.ageProtocols[age].diagrams[step].description+=' changed';assert.doesNotMatch(renderActivityDiagram(c,step,age),/february-lastscience-v1/);
 }
 for(const e of rows.filter(e=>![53,59].includes(e.id)))for(const a of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,a),/february-lastscience-v1/);
});
test('cups, measures and retained water preserve sequential preparation and never add particle observations or thermometer readings',()=>{
 for(const a of ages)for(let s=0;s<4;s++){
 const scene=rows[52].ageProtocols[a].diagrams[s],svg=renderActivityDiagram(rows[52],s,a);
 assert.equal(count(svg,'data-material="open-plastic-cup"'),scene.elements.filter(p=>p.type==='rect'&&p.width===100&&p.height===102).length);
 assert.equal(count(svg,'data-material="level-measuring-spoon"'),scene.elements.filter(p=>p.type==='rect'&&p.width===23&&p.height===9).length);
 for(const p of scene.elements.filter(p=>p.type==='rect'&&p.fill==='#DCEEF0'))assert.ok(svg.includes(`x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"`));
 assert.equal(count(svg,'>实看</text>'),scene.elements.filter(p=>p.type==='text'&&p.text==='实看').length);
 assert.doesNotMatch(svg,/<circle /); // no sugar particles or invented sediment outcomes
 }
 const prep=rows[52].ageProtocols['10-12'].diagrams[0];assert.equal(prep.elements.filter(p=>p.type==='rect'&&p.fill==='#DCEEF0').length,1);
});
test('paper supports and load packets retain counts and geometry; youngest remains completely unloaded',()=>{
 for(const a of ages)for(let s=0;s<4;s++){
 const scene=rows[58].ageProtocols[a].diagrams[s],svg=renderActivityDiagram(rows[58],s,a);
 const books=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#D7E3D9'),packets=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#D8C7E9');
 assert.equal(count(svg,'data-material="single-book-support"'),books.length);assert.equal(count(svg,'data-material="light-paper-packet"'),packets.length);
 if(a==='4-6'){assert.equal(books.length,0);assert.equal(packets.length,0);}
 const plate=scene.elements.find(p=>p.type==='rect'&&p.fill==='#DAD4B5');
 if(plate){const peaks=scene.elements.filter(p=>p.type==='line'&&p.stroke==='#3C8065').flatMap(p=>[[p.x1,p.y1],[p.x2,p.y2]]);const contacts=new Set(peaks.filter(([x,y])=>x>=plate.x&&x<=plate.x+plate.width&&y===plate.y+plate.height).map(([x])=>x));assert.ok(contacts.size>=2);assert.equal(packets[0].y+packets[0].height,plate.y);}
 }
});
test('fixed tray direction stays fixed across quarter-turn; folded projection swaps dimensions without extra creases',()=>{
 const d=rows[58].ageProtocols['4-6'].diagrams;
 for(const s of[2,3]){const svg=renderActivityDiagram(rows[58],s,'4-6');assert.equal(count(svg,'data-reference="fixed-tray-direction"'),1);assert.match(svg,/points="510,240 501,236 501,244"/);}
 const p=d[2].elements.find(p=>p.type==='rect'),q=d[3].elements.find(p=>p.type==='rect');assert.equal(p.width,q.height);assert.equal(p.height,q.width);
 assert.equal(d[0].elements.filter(p=>p.type==='line').length,9);
});
