import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectProtocolBrowserSample} from './protocol-browser-sample.mjs';
const activities=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
test('browser sample selects subject boundary activities without claiming all lessons',()=>{const result=selectProtocolBrowserSample(activities);assert.ok(result.activities.length<=14);assert.ok(result.completeActivities>=result.activities.length);assert.match(result.scope,/Not full-year/);for(const category of new Set(result.activities.map(e=>e.category))){const group=activities.filter(e=>e.category===category&&e.ageProtocols);assert.ok(result.activities.some(e=>e.id===group[0].id));assert.ok(result.activities.some(e=>e.id===group.at(-1).id));}});
test('empty or legacy-only curriculum has an explicitly empty protocol sample',()=>{assert.equal(selectProtocolBrowserSample(activities.map(e=>({...e,ageProtocols:undefined}))).activities.length,0);});
