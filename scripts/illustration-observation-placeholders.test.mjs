import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const count=(s,m)=>s.split(m).length-1;
test('ink results are explicit unknowns, not predicted disappearance',()=>{
 for(const [age,step,n]of [['4-6',2,1],['4-6',3,1],['7-9',3,2],['10-12',3,3],['13-16',3,4]]){
 const svg=renderActivityDiagram(rows[11],step,age);assert.equal(count(svg,'data-observation-placeholder="ink-unknown"'),n);
 assert.match(svg,/stroke-dasharray/);
 }
 for(const age of Object.keys(rows[11].ageProtocols))for(let s=0;s<2;s++)assert.doesNotMatch(renderActivityDiagram(rows[11],s,age),/data-observation-placeholder/);
});
test('ice final records remain unknown independently for every labelled vessel',()=>{
 for(const[age,n]of [['4-6',1],['7-9',2],['10-12',3],['13-16',6]]){
 const svg=renderActivityDiagram(rows[25],3,age);assert.equal(count(svg,'data-observation-placeholder="ice-unknown"'),n);
 assert.equal(count(svg,'待观察'),n);assert.equal(count(svg,'>实记<'),n);
 for(let s=0;s<3;s++)assert.doesNotMatch(renderActivityDiagram(rows[25],s,age),/data-observation-placeholder/);
 }
});
test('January ink/ice badges cannot spread to changed source scenes or other courses',()=>{
 for(const id of [12,26]){const e=structuredClone(rows[id-1]);e.ageProtocols['4-6'].diagrams[3].description+=' changed';assert.doesNotMatch(renderActivityDiagram(e,3,'4-6'),/data-observation-placeholder/);}
 for(const e of rows.filter(e=>![12,26].includes(e.id)))for(const age of Object.keys(e.ageProtocols))for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/data-observation-placeholder="(?:ink|ice)-unknown"/);
});
