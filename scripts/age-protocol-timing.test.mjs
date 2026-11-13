import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveAgeProtocol,protocolAges} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
test('every selected age uses only protocol timing, without mutating original wait or any records',()=>{
 const before=JSON.stringify(data);let count=0;
 for(const e of data.experiments.filter(e=>e.ageProtocols))for(const age of protocolAges){
  const p=e.ageProtocols[age],r=resolveAgeProtocol(e,age);count++;
  assert.equal(r.wait,null,`day ${e.id}, ${age}`);
  assert.equal(r.duration,p.guide.time);
  assert.deepEqual(r.steps.map(s=>s.detail),p.steps.map(s=>s.action));
  assert.equal(r.safety,p.safety);assert.equal(r.activeAgeProtocol.version,p.version);
 }
 assert.equal(count,1460);assert.equal(JSON.stringify(data),before);
});
test('complete coverage has no unrebuilt activities; explicit legacy fixtures retain original timing and behavior',()=>{
 assert.equal(data.experiments.filter(e=>!e.ageProtocols).length,0);
 const rows=structuredClone(data.experiments);for(const e of rows)delete e.ageProtocols;
 assert.equal(rows.length,365);assert.ok(rows.some(e=>e.wait));assert.ok(rows.every(e=>!Object.hasOwn(e,'ageProtocols')));
 for(const e of rows)for(const age of protocolAges){const r=resolveAgeProtocol(e,age);assert.equal(r.wait,e.wait);assert.equal(r.duration,e.duration);}
});
test('stale timing cannot reappear when age, protocol version, or original wait changes',()=>{
 const e=structuredClone(data.experiments[0]);e.wait='STALE: retain indefinitely';
 for(const age of protocolAges){e.ageProtocols[age].guide.time=`selected ${age}`;e.ageProtocols[age].version=2;
 const r=resolveAgeProtocol(e,age);assert.equal(r.wait,null);assert.equal(r.duration,`selected ${age}`);assert.equal(r.activeAgeProtocol.version,2);}
 assert.equal(e.wait,'STALE: retain indefinitely');
});
