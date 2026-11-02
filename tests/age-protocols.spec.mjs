import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {resolveAgeProtocol} from '../dist/diagrams.js';
import {selectProtocolBrowserSample} from '../scripts/protocol-browser-sample.mjs';
import {resetServer,fixture,loginAPI,cloudSaved,changeProfileAge,authFetch} from './account-helpers.mjs';
const activities=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const e=activities[0];
async function viewportShot(page,info,name){fs.mkdirSync('test-results/visual-review',{recursive:true});await page.screenshot({path:`test-results/visual-review/${info.project.name}-protocol-${name}.png`,fullPage:false});}
test('four genuine protocol views share no old instructions and keep old records separate',async({page},info)=>{
 test.setTimeout(150000);await resetServer(page);await fixture(page,{children:[{nickname:'合成试验档案',ageBand:'4-6',state:{records:{'1:4-6':{spoken:'QA old bridge note'},'1:7-9':{field0:'QA old coin count'}},steps:{'1:4-6':3},viewedSteps:{'1:4-6':15},completed:{'1:4-6':true}}}]});await loginAPI(page);await page.goto('/');await expect(page.locator('#open-safety')).toBeVisible();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const age of ['4-6','7-9','10-12','13-16']){
  if(age!=='4-6')await changeProfileAge(page,age);const p=resolveAgeProtocol(e,age);
  await expect(page.locator('.protocol-status')).toContainText('独立方案');for(const m of p.materials)await expect(page.locator('#materials-panel')).toContainText(m);
  await page.locator('#open-safety').click();for(const m of p.materials)await expect(page.locator('.dialog-materials')).toContainText(m);await expect(page.locator('.safety-specific').first()).toContainText(p.safety);await page.locator('#close-safety').click();
  await expect(page.locator('#exploration-status')).toContainText('尚未标记完成');await expect(page.locator('#reading-count')).toContainText('0 / 4');
  await page.locator('#preview-main').click();for(let step=0;step<4;step++){await page.locator(`[data-step="${step}"]`).click();await expect(page.locator('.age-action')).toContainText(p.steps[step].detail);await expect(page.locator('#step-stage svg desc')).toContainText(p.activeAgeProtocol.diagrams[step].description);}
  await page.locator('#zoom-diagram').click();await expect(page.locator('#enlarged-instruction')).toContainText(p.steps[3].detail);await page.goBack();await expect(page.locator('#diagram-dialog')).not.toBeVisible();
  await page.locator('#tab-learning-panel').click();await expect(page.locator('#learning-panel')).toContainText(p.explanation);
  await page.locator('#tab-observations').click();if(age==='4-6'){await expect(page.locator('.protocol-history')).toContainText('QA old bridge note');await expect(page.locator('[data-field="spoken"]')).toHaveValue('');await page.locator('[data-field="spoken"]').fill('QA new paper bridge');await page.locator('.protocol-history').scrollIntoViewIfNeeded();await viewportShot(page,info,'legacy-and-new-records');}else{await expect(page.locator('[data-field="field0"]')).toHaveValue('');if(age==='7-9')await expect(page.locator('.protocol-history')).toContainText('QA old coin count');await page.locator('[data-field="field0"]').fill('QA new '+age);}
  await page.locator('#complete-day').click();await cloudSaved(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 const session=await(await page.request.get('/api/session')).json(),r=await(await authFetch(page,'/api/children/'+session.children[0].id+'/state')).json();
 expect(r.state.records['1:4-6'].spoken).toBe('QA old bridge note');expect(r.state.records['1:7-9'].field0).toBe('QA old coin count');expect(r.state.steps['1:4-6']).toBe(3);expect(r.state.viewedSteps['1:4-6']).toBe(15);expect(r.state.completed['1:4-6']).toBe(true);
 for(const age of ['4-6','7-9','10-12','13-16'])expect(r.state.protocolProgress[`1:${age}:v1`].completed).toBe(true);
 await page.reload();await expect(page.locator('#open-safety')).toBeVisible();await page.locator('#tab-observations').click();await expect(page.locator('[data-field="field0"]')).toHaveValue('QA new 13-16');expect(errors).toEqual([]);
});
for(const initialChild of ['owner','sibling'])test(`unmigrated activity stays honest and sibling isolation holds with ${initialChild} initially listed first`,async({page},info)=>{
 await resetServer(page);
 const seeded=await fixture(page,{children:[{nickname:'合成一',ageBand:'4-6',state:{protocolProgress:{'1:4-6:v1':{records:{spoken:'QA sibling secret'},step:3,viewedSteps:15,completed:true}}}},{nickname:'合成二',ageBand:'4-6'}]});
 // Session ordering is created_at,id; same-second random IDs need not match seed order.
 const owner=seeded.children.find(child=>child.nickname==='合成一'),sibling=seeded.children.find(child=>child.nickname==='合成二');
 expect(owner.id).not.toBe(sibling.id);
 // Exercise both legitimate display orders deterministically, without replacing any state/content.
 const firstId=initialChild==='owner'?owner.id:sibling.id;
 await page.route('**/api/session',async route=>{const response=await route.fetch(),body=await response.json();if(Array.isArray(body.children))body.children.sort((a,b)=>(a.id===firstId?-1:b.id===firstId?1:0));await route.fulfill({response,json:body});});
 await loginAPI(page);await page.goto('/');await expect(page.locator('#open-safety')).toBeVisible();await expect(page.locator('#child-switch')).toHaveValue(firstId);
 for(let repeat=0;repeat<2;repeat++){
  await page.locator('#child-switch').selectOption(owner.id);await expect(page.locator('#child-switch')).toHaveValue(owner.id);
  await expect(page.locator('#cloud-status')).toHaveText('已保存 · 合成一');await expect(page.locator('#reading-count')).toContainText('4 / 4');
  await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('QA sibling secret');
  await page.locator('#child-switch').selectOption(sibling.id);await expect(page.locator('#child-switch')).toHaveValue(sibling.id);
  await expect(page.locator('#cloud-status')).toHaveText('已保存 · 合成二');await expect(page.locator('#reading-count')).toContainText('0 / 4');
  await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('');await expect(page.locator('#experiment')).not.toContainText('QA sibling secret');if(repeat===1){await page.locator('[data-field="spoken"]').scrollIntoViewIfNeeded();await viewportShot(page,info,`sibling-empty-${initialChild}-first`);}
 }
 const ownerState=await(await authFetch(page,`/api/children/${owner.id}/state`)).json(),siblingState=await(await authFetch(page,`/api/children/${sibling.id}/state`)).json();
 expect(ownerState.state.protocolProgress['1:4-6:v1']).toEqual({records:{spoken:'QA sibling secret'},step:3,viewedSteps:15,completed:true});
 expect(siblingState.state.protocolProgress?.['1:4-6:v1']?.records||{}).toEqual({});expect(siblingState.state.protocolProgress?.['1:4-6:v1']?.viewedSteps||0).toBe(0);expect(siblingState.state.protocolProgress?.['1:4-6:v1']?.completed||false).toBe(false);
 const legacy=activities.find(row=>!row.ageProtocols);if(legacy){await page.locator('#navigator-handle').click();await page.locator('#map-month').selectOption('all');await page.locator('#map-search').fill(String(legacy.id));await page.locator(`#map-grid [data-day="${legacy.id}"]`).click();await expect(page.locator('.protocol-status')).toContainText('原有分龄引导');}
});

// All protocols have schema/render checks; browser integration uses explicit bounded subject sampling.
const sample=selectProtocolBrowserSample(activities);
for(const sampled of sample.activities.filter(activity=>activity.id!==e.id)){const day=sampled.id;test(`sampled authored theme ${day}: every age loads its own materials, procedure, apparatus and saved observation`,async({page})=>{
 test.setTimeout(150000);const activity=activities[day-1];await resetServer(page);await fixture(page,{children:[{nickname:'合成分龄核对',ageBand:'4-6',state:{day}}]});await loginAPI(page);await page.goto('/');await expect(page.locator('#open-safety')).toBeVisible();
 for(const age of ['4-6','7-9','10-12','13-16']){
  if(age!=='4-6')await changeProfileAge(page,age);const selected=resolveAgeProtocol(activity,age);
  await expect(page.locator('#day-number')).toContainText('DAY '+activity.day);await expect(page.locator('.protocol-status')).toContainText('独立方案');
  for(const material of selected.materials)await expect(page.locator('#materials-panel')).toContainText(material);
  await page.locator('#open-safety').click();await expect(page.locator('.safety-specific').first()).toContainText(selected.safety);await expect(page.locator('.big-question')).toContainText(selected.question);await page.locator('#close-safety').click();await page.locator('#preview-main').click();
  for(let step=0;step<4;step++){await page.locator(`[data-step="${step}"]`).click();await expect(page.locator('.age-action')).toContainText(selected.steps[step].detail);await expect(page.locator('#step-stage svg desc')).toContainText(selected.activeAgeProtocol.diagrams[step].description);}
  await page.locator('#tab-learning-panel').click();await expect(page.locator('#learning-panel')).toContainText(selected.explanation);await page.locator('#tab-observations').click();const field=age==='4-6'?'spoken':'field0';await page.locator(`[data-field="${field}"]`).fill(`QA theme${day} age${age}`);await cloudSaved(page);
 }
 const session=await(await page.request.get('/api/session')).json(),r=await(await authFetch(page,'/api/children/'+session.children[0].id+'/state')).json();
 for(const age of ['4-6','7-9','10-12','13-16']){const protocol=r.state.protocolProgress[`${day}:${age}:v1`];expect(protocol.records[age==='4-6'?'spoken':'field0']).toBe(`QA theme${day} age${age}`);expect(protocol.completed).toBe(false);}
});}

// Live viewport hit-testing distinguishes a full-page fixed-toolbar capture artifact from obstruction.
test('360px viewport exposes step navigation and scrolled adult confirmations without overlays',async({page},info)=>{
 await page.setViewportSize({width:360,height:640});await resetServer(page);await fixture(page);await loginAPI(page);await page.goto('/');await expect(page.locator('#open-safety')).toBeVisible();await page.locator('#preview-main').click();
 const unobscured=async locator=>{await locator.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await expect(locator).toBeInViewport();await expect.poll(()=>locator.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&(hit===el||el.contains(hit));})).toBe(true);};
 for(let step=0;step<4;step++){const button=page.locator(`[data-step="${step}"]`);await unobscured(button);await viewportShot(page,info,`360-navigation-${step+1}`);await button.click();await expect(button).toHaveAttribute('aria-current','step');}
 await page.locator('#open-safety').click();
 for(let check=0;check<3;check++){const box=page.locator(`[data-check="${check}"]`);await unobscured(box);await box.check();}
 const begin=page.locator('#begin');await expect(begin).toBeEnabled();await unobscured(begin);await viewportShot(page,info,'360-safety-confirmations-bottom');await begin.click();await expect(page.locator('#safety-dialog')).not.toBeVisible();await expect(page.locator('#workspace-toolbar')).toHaveAttribute('data-preparation','ready');
});
