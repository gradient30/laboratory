import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {renderActivityDiagram,protocolAges} from '../dist/diagrams.js';
const root=new URL('../verification/static-scenes/',import.meta.url),data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const normalized=svg=>svg.replace(/science-diagram-\d+-\d+-\d+/g,'diagram');
const directories=fs.readdirSync(root).filter(name=>/^day\d+$/.test(name));
test('every integrated protocol has retained static evidence and no evidence claims an unintegrated activity',()=>{
 const expected=data.experiments.filter(e=>e.ageProtocols).map(e=>`day${String(e.id).padStart(2,'0')}`).sort();
 assert.deepEqual([...directories].sort(),expected);
});
for(const dir of directories)test(`${dir} retained source, SVG and PNG evidence has exact hashes and current equivalent rendering`,()=>{
 const folder=new URL(dir+'/',root),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',folder))),source=fs.readFileSync(new URL('../reviewed-protocols/'+dir+'.json',import.meta.url));
 assert.equal(sha(source),manifest.sourceSha256);const input=JSON.parse(source),activity={...data.experiments[input.activityId-1],ageProtocols:input.ageProtocols};
 for(const [name,hash]of Object.entries({...manifest.files,...manifest.pngSha256})){assert.match(name,/^[a-zA-Z0-9.-]+\.(svg|png)$/);assert.equal(sha(fs.readFileSync(new URL(name,folder))),hash,`Evidence changed: ${dir}/${name}`);}
 assert.deepEqual(input.ageProtocols,data.experiments[input.activityId-1].ageProtocols,'Integrated protocol changed after reviewed source was frozen');
 for(const age of protocolAges)for(let step=0;step<4;step++){const saved=fs.readFileSync(new URL(`${age}-${step+1}.svg`,folder),'utf8');assert.equal(normalized(renderActivityDiagram(activity,step,age)),normalized(saved),`Renderer output changed after static review: ${dir}/${age}/${step}`);}
});
