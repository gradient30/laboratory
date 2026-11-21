import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {renderActivityDiagram} from '../dist/diagrams.js';

const {experiments}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=new Map([[274,3],[275,2],[276,1],[277,3],[278,3]]);
const marker='data-material-batch="october-first-rebuild-v1"';
const get=id=>experiments.find(e=>e.id===id);
const render=(day,step)=>renderActivityDiagram(get(day),step-1,'4-6');

test('October action art renders only in the five approved scenes',()=>{
 let count=0;
 for(const experiment of experiments)for(const [age,protocol] of Object.entries(experiment.ageProtocols))for(const [index,scene] of protocol.diagrams.entries()){
  const svg=renderActivityDiagram(experiment,index,age);
  const expected=age==='4-6'&&targets.get(experiment.id)===index+1;
  assert.equal(svg.includes(marker),expected,[experiment.id,age,index+1].join(':'));
  if(expected)assert.ok(svg.includes(scene.elements.find(e=>e.type==='text').text));
  count++;
 }
 assert.equal(count,5840);
});

test('if authored geometry, text or order differs, use the validated authored scene',()=>{
 for(const [day,step] of targets)for(const alter of [s=>s.description+='（修改）',s=>s.elements[0].y+=.5,s=>s.elements.reverse()]){
  const e=structuredClone(get(day));
  alter(e.ageProtocols['4-6'].diagrams[step-1]);
  assert.ok(!renderActivityDiagram(e,step-1,'4-6').includes(marker));
 }
});

test('safe stopping decisions and blank observations are visually distinct',()=>{
 const light=render(274,3);
 assert.match(light,/tilt-around-c-fixed-lamp.*约30cm.*只绕中心 C 小幅转纸.*separate-blank-a-and-b.*同灯低档；只看白纸.*A 持平.*B 倾斜.*分别画实际光斑.*出纸或漂移就停止/s);
 assert.equal((light.match(/stroke-dasharray="5 4"/g)||[]).length,2);
 assert.match(render(275,2),/same-positions-change-labels-only.*A 如实保留.*L：原标签.*R：原标签.*B 选新标签.*L：圆形.*R：方形.*位置和三张卡都不变.*不人为做出失败的 A/s);
 assert.match(render(276,1),/empty-cup-rim-check.*先用空杯.*side-wall-or-unclear-stop.*侧壁能看到、路径不清.*记 X，不加水.*不是实测光路.*仅合格后才加水：备水 50 mL，深度不超 5 cm/s);
 const ice=render(277,3);
 assert.match(ice,/blank-initial-dish-state.*起点｜同一碟 A.*blank-ending-dish-state.*截止｜按实际所见画.*未融完也可结束，不加热/s);
 assert.equal((ice.match(/stroke-dasharray="5 4"/g)||[]).length,2);
 const median=render(278,3);
 assert.match(median,/middle-position-no-answer.*一头.*在两头之间.*另一头.*不替孩子填数/s);
 assert.equal((median.match(/>？<\/text>/g)||[]).length,3);
});
