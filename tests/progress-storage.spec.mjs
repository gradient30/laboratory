import {test,expect} from '@playwright/test';
import {resetServer,fixture,loginAPI,cloudSaved,openAccount,authFetch,writeProgressRecord} from './account-helpers.mjs';
async function ready(page,options={}){await resetServer(page);const seed=await fixture(page,options);await loginAPI(page,options.email||'owner@qa.test');await page.goto('/#lab');await expect(page.locator('#open-safety')).toBeVisible();if(await page.locator('#child-switch').inputValue()!==seed.children[0].id){await page.locator('#child-switch').selectOption(seed.children[0].id);await expect(page.locator('#open-safety')).toBeVisible();await expect(page.locator('#child-switch')).toHaveValue(seed.children[0].id)}return seed}
async function stored(page,id,key='1:4-6:v1'){return(await authFetch(page,`/api/children/${id}/progress/records/${key}`)).json()}
async function put(page,id,key,record,etag){const session=await(await page.request.get('/api/session')).json();return page.request.put(`/api/children/${id}/progress/records/${key}`,{headers:{Origin:'http://127.0.0.1:4173','X-CSRF-Token':session.csrfToken,'If-Match':etag,'Idempotency-Key':crypto.randomUUID()},data:{record}})}
test('typed selected record saves exact labels and values without sending or echoing a year of private notes',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));const seed=await ready(page,{children:[{nickname:'逐项记录',ageBand:'7-9',state:{records:{'365:7-9':{field0:'未加载的私人笔记'}}}}]});const writes=[];page.on('request',r=>{if(r.method()==='PUT')writes.push({url:r.url(),body:r.postDataJSON()})});await page.locator('#tab-observations').click();const field=page.locator('[data-field="field0"]');const label=await field.locator('..').textContent();await field.fill('真实输入：桥中央较平，没有负重。');await cloudSaved(page);const saved=await stored(page,seed.children[0].id,'1:7-9:v1');expect(saved.record.records.field0).toBe('真实输入：桥中央较平，没有负重。');expect(label).toContain(saved.schema.fields.find(f=>f.key==='field0').label);expect(writes.every(r=>!r.url.endsWith('/state'))).toBe(true);expect(JSON.stringify(writes)).not.toContain('未加载的私人笔记');expect((await stored(page,seed.children[0].id,'365:7-9:v0')).record.records.field0).toBe('未加载的私人笔记');await page.reload();await page.locator('#tab-observations').click();await expect(page.locator('[data-field="field0"]')).toHaveValue('真实输入：桥中央较平，没有负重。');expect(errors).toEqual([]);
});
test('offline retry reuses request identity, changed draft survives, and failed save blocks child switch',async({page})=>{
 await ready(page,{children:[{nickname:'合成甲',ageBand:'4-6'},{nickname:'合成乙',ageBand:'4-6'}]});
 // Exercise the non-default profile: fixture creation order is not session display order.
 const {children:[sibling,target]}=await (await page.request.get('/api/session')).json();
 const child=page.locator('#child-switch'),field=page.locator('[data-field="spoken"]');
 if(await child.inputValue()!==target.id)await child.selectOption(target.id);
 await expect(child).toHaveValue(target.id);await cloudSaved(page);
 const path=`**/api/children/${target.id}/progress/records/*`,attempts=[];
 await page.route(path,route=>{if(route.request().method()==='PUT'){attempts.push(route.request().headers()['idempotency-key']);return route.abort('failed')}return route.continue()});
 await page.locator('#tab-observations').click();await field.fill('断网时第一份草稿');await expect(page.locator('#cloud-status')).toContainText('尚未保存');await field.fill('断网后继续修改的草稿');await expect(page.locator('#cloud-status')).toContainText('尚未保存');
 await child.selectOption(sibling.id);await expect(child).toHaveValue(target.id);expect(new Set(attempts).size).toBe(1);
 await page.unroute(path);await page.locator('#retry-save').click();await cloudSaved(page);expect((await stored(page,target.id)).record.records.spoken).toBe('断网后继续修改的草稿');
 await page.reload();await expect(page.locator('#open-safety')).toBeVisible();if(await child.inputValue()!==target.id)await child.selectOption(target.id);
 await expect(child).toHaveValue(target.id);await cloudSaved(page);await page.locator('#tab-observations').click();await expect(field).toHaveValue('断网后继续修改的草稿');
});
test('same record conflict preserves unsaved draft and original labels are readable through paged history',async({page})=>{
 const seed=await ready(page,{children:[{nickname:'合成历史',ageBand:'4-6',state:{records:{'1:4-6':{spoken:'原方案孩子原话'}}}}]}),id=seed.children[0].id;await page.locator('#tab-observations').click();await page.locator('[data-read-history="1:4-6:v0"]').locator('..').locator('summary').click();await page.locator('[data-read-history="1:4-6:v0"]').click();await expect(page.locator('.saved-history-entry')).toContainText('原方案孩子原话');await expect(page.locator('.saved-history-entry')).toContainText('孩子原话');const current=await stored(page,id);expect((await put(page,id,'1:4-6:v1',{records:{spoken:'另一页面的记录'},step:0,viewedSteps:0,completed:false},current.etag)).ok()).toBe(true);await page.locator('[data-field="spoken"]').fill('本页草稿不可覆盖');await expect(page.locator('#cloud-status')).toContainText('另一设备');expect((await stored(page,id)).record.records.spoken).toBe('另一页面的记录');await openAccount(page);await expect(page.locator('#download-unsaved')).toBeVisible();const download=page.waitForEvent('download');await page.locator('#download-unsaved').click();const file=await download;expect(file.suggestedFilename()).toMatch(/unsaved/);
});
test('failed selected read does not become empty editable state or leak prior child notes',async({page})=>{
 const seed=await ready(page,{children:[{nickname:'甲',ageBand:'4-6',state:{protocolProgress:{'1:4-6:v1':{records:{spoken:'甲的私人笔记'},step:0,viewedSteps:0,completed:false}}}},{nickname:'乙',ageBand:'4-6'}]});await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('甲的私人笔记');const path=`**/api/children/${seed.children[1].id}/progress/records/*`;await page.route(path,route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:{code:'QA_FAIL',message:'合成读取失败'}})}));await page.locator('#child-switch').selectOption(seed.children[1].id);await expect(page.locator('#retry-child')).toBeVisible();await expect(page.locator('[data-field]')).toHaveCount(0);expect(await page.locator('#experiment').textContent()).not.toContain('甲的私人笔记');await page.unroute(path);await page.locator('#retry-child').click();await expect(page.locator('#open-safety')).toBeVisible();await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('');
});
test('complete export traverses all record pages, preserves original raw state and archived children',async({page})=>{
 const seed=await ready(page,{children:[{nickname:'甲',ageBand:'4-6',state:{records:{'1:4-6':{spoken:'原始备份'}}}},{nickname:'乙',ageBand:'4-6'}]});
 const [active,archived]=seed.children,firstKey='1:4-6:v1';
 await page.locator('#tab-observations').click();
 for(let n=0;n<6;n++){await page.locator('[data-field="spoken"]').fill('第'+n+'次保存');await cloudSaved(page)}
 // Repeated autosaves update one key. Add four genuinely distinct keys to cross the four-item page boundary.
 const otherNotes={};
 for(const day of [2,3,4,5]){
  const key=`${day}:4-6:v1`,spoken=`QA 第${day}天的独立记录`;
  const result=await writeProgressRecord(page,active.id,key,{records:{spoken},step:0,viewedSteps:0,completed:false});
  expect(result.ok(),`seed export record ${key}`).toBe(true);
  otherNotes[key]=spoken;
 }
 await openAccount(page);
 page.once('dialog',d=>d.accept());
 await page.locator(`[data-archive-child="${archived.id}"]`).click();
 const restore=page.locator(`[data-restore-child="${archived.id}"]`);
 await page.locator('details').filter({has:restore}).locator('summary').click();
 await expect(restore).toBeVisible();
 const activePages=[];
 page.on('request',request=>{
  const url=new URL(request.url());
  if(request.method()==='GET'&&url.pathname===`/api/children/${active.id}/progress/export`)activePages.push(url);
 });
 const download=page.waitForEvent('download');await page.locator('#export-account').click();
 const file=await download,stream=await file.createReadStream();let text='';for await(const chunk of stream)text+=chunk;
 const data=JSON.parse(text);
 expect(data.complete).toBe(true);
 expect(data.children).toHaveLength(2);
 const child=data.children.find(c=>c.id===active.id);
 expect(child.legacyStateJSON).toContain('原始备份');
 const firstRevisions=child.progressRevisions.filter(item=>item.key===firstKey);
 expect(firstRevisions).toHaveLength(1);
 expect(firstRevisions[0].record.records.spoken).toBe('第5次保存');
 expect(child.progressRevisions.map(item=>[item.key,item.record.records.spoken])).toEqual(Object.entries({[firstKey]:'第5次保存',...otherNotes}));
 expect(activePages.some(url=>Number(url.searchParams.get('after'))>0)).toBe(true);
 expect(data.children.find(c=>c.id===archived.id).archivedAt).toBeTruthy();
});

test('segmented export includes an ordered hashed backup part and allows the same part to be downloaded again',async({page})=>{
 const seed=await ready(page,{children:[{nickname:'分卷合成档案',ageBand:'4-6',state:{records:{'365:4-6':{spoken:'分卷保留旧记录'}}}}]});await openAccount(page);const download=page.waitForEvent('download');await page.locator('#export-account-parts').click();const file=await download,stream=await file.createReadStream();let text='';for await(const chunk of stream)text+=chunk;const data=JSON.parse(text);expect(data.exportVersion).toBe(3);expect(data.part).toBe(1);expect(data.complete).toBe(true);expect(data.previousPartSha256).toBe(null);expect(data.partSha256).toMatch(/^[a-f0-9]{64}$/);expect(data.pages[0].childId).toBe(seed.children[0].id);expect(data.pages[0].legacyStateJSON).toContain('分卷保留旧记录');await expect(page.locator('#family-message')).toContainText('检查浏览器已下载');const again=page.waitForEvent('download');await page.locator('#export-part-again').click();expect((await again).suggestedFilename()).toBe(file.suggestedFilename());
});

for(const [day,cue] of [[259,'访谈只写纸上 · 网页只标记完成'],[265,'两人的原始清单留在纸上 · 网页只标记完成']])
for(const ageBand of ['4-6','7-9','10-12','13-16']){
 test(`Day ${day} ${ageBand} keeps original notes on paper and saves completion only`,async({page})=>{
  const key=`${day}:${ageBand}:v1`,prior=ageBand==='4-6'?{spoken:'QA retained quote',field2:'QA retained observation'}:{};
  const seed=await ready(page,{children:[{nickname:'合成纸上练习',ageBand,state:{day,age:ageBand,protocolProgress:{[key]:{records:prior,step:0,viewedSteps:0,completed:false}}}}]});
  const id=seed.children[0].id;
  await expect(page.locator('#day-number')).toContainText(`DAY ${day} / 365`);
  await page.locator('#tab-observations').click();
  await expect(page.locator('#observations')).toContainText(cue);
  await expect(page.locator('#observations')).toContainText('虚构练习');
  if(day===265)await expect(page.locator('#observations')).toContainText('只用 X/Y，不记姓名');
  await expect(page.locator('#record-area textarea,#record-area input,#record-area [contenteditable],#record-area [data-choice]')).toHaveCount(0);
  const opening=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await opening;
  await expect(popup.locator('.discovery')).toContainText(cue);
  await expect(popup.locator('.discovery')).not.toContainText('QA retained');
  await expect(popup.locator('#print-now')).toBeEnabled();
  await popup.emulateMedia({media:'print'});
  const pdf=await popup.pdf({format:'A4',preferCSSPageSize:true});
  expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
  await popup.close();
  const complete=page.locator('#complete-day');await complete.click();await cloudSaved(page);
  const current=await stored(page,id,key);expect(current.record.completed).toBe(true);expect(current.record.records).toEqual(prior);
  await page.reload();await page.locator('#tab-observations').click();
  await expect(page.locator('#complete-day')).toHaveAttribute('aria-pressed','true');
  if(ageBand==='4-6'){
   const history=page.locator(`[data-history-key="${key}"]`);await history.locator('summary').click();
   await history.locator('[data-read-history]').click();
   await expect(history).toContainText(prior.spoken);await expect(history).toContainText(prior.field2);
  }
 });
}
