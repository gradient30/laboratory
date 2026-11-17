import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments,ages=['4-6','7-9','10-12','13-16'];
const count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('history renderer is exactly locked to the sixteen paper-model scenes and preserves labels/geometry',()=>{
 for(const a of ages)for(let step=0;step<4;step++){
 const e=rows[48],scene=e.ageProtocols[a].diagrams[step],svg=renderActivityDiagram(e,step,a);assert.match(svg,/february-history-v1/);
 for(const p of scene.elements){
 if(p.type==='text')assert.ok(svg.includes(esc(p.text)));
 if(['line','arrow'].includes(p.type))assert.ok(svg.includes(`x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"`));
 if(p.type==='rect')assert.ok(svg.includes(`x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"`));
 if(p.type==='circle')assert.ok(svg.includes(`cx="${p.x}" cy="${p.y}" r="${p.r}"`));
 }
 const clone=structuredClone(e);clone.ageProtocols[a].diagrams[step].description+=' changed';assert.doesNotMatch(renderActivityDiagram(clone,step,a),/february-history-v1/);
 }
 for(const e of rows.filter(e=>e.id!==49))for(const a of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,a),/february-history-v1/);
});
test('paper curl identity does not introduce rods, extra segments, letters or measured search results',()=>{
 for(const a of ages)for(let s=0;s<4;s++){
 const scene=rows[48].ageProtocols[a].diagrams[s],svg=renderActivityDiagram(rows[48],s,a),circles=scene.elements.filter(p=>p.type==='circle');
 assert.equal(count(svg,'data-material="paper-curl-no-rod"'),circles.length);
 if(circles.length){assert.equal(circles.length,2);assert.ok(svg.includes('纸卷示意：不用木杆'));assert.equal(count(svg,'data-material="joined-paper-scroll"'),1);}
 for(const letter of 'ABCDEF'){assert.equal(count(svg,`>${letter}</text>`),scene.elements.filter(p=>p.type==='text'&&p.text===letter).length);}
 assert.doesNotMatch(svg,/data-material="(?:wood|rod|axle)/);
 }
});
test('modern notebook still has blank left page and exactly one right-page content frame, no invented target retrieval',()=>{
 for(const a of ages)for(let s=0;s<4;s++){
 const scene=rows[48].ageProtocols[a].diagrams[s],svg=renderActivityDiagram(rows[48],s,a);
 const book=scene.elements.find(p=>p.type==='rect'&&p.width===330);
 assert.equal(count(svg,'data-material="modern-notebook"'),book?1:0);
 if(!book)continue;
 const frame=scene.elements.find(p=>p.type==='rect'&&p.width===130),aText=scene.elements.find(p=>p.type==='text'&&p.text==='A');
 assert.ok(frame.x>book.x+book.width/2);assert.ok(aText.x>frame.x&&aText.x<frame.x+frame.width);
 assert.equal(count(svg,'>留白</text>'),1);assert.equal(count(svg,'>A</text>'),1);
 }
});
test('audited history tasks retain explicit evidence/date range and non-printing model limits',()=>{
 const sources=JSON.stringify(rows[34].ageProtocols);assert.ok(sources.includes('1454'));assert.ok(sources.includes('1455'));assert.ok(sources.includes('586'));
 for(const a of ages){assert.match(rows[55].ageProtocols[a].safety,/不用刻刀/);assert.match(JSON.stringify(rows[55].ageProtocols[a].steps),/正向/);}
 assert.match(JSON.stringify(rows[53].ageProtocols['13-16']),/未知不等/);
 assert.match(JSON.stringify(rows[41].ageProtocols['7-9']),/24个月/);
});
