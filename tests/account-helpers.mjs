import {expect} from '@playwright/test';
export const origin='http://127.0.0.1:4173';
export async function resetServer(page){const r=await page.request.post('/__test/reset',{data:{}});expect(r.ok()).toBe(true)}
export async function fixture(page,{email='owner@qa.test',role='admin',unlockAll=true,unlockThrough=0,children=[{nickname:'合成探险家',ageBand:'4-6'}]}={}){const r=await page.request.post('/__test/seed',{data:{email,role,unlockAll,unlockThrough,children}});expect(r.ok()).toBe(true);return r.json()}
export async function loginAPI(page,email='owner@qa.test',intent='login'){
 const prior=await(await page.request.get('/__test/outbox?email='+encodeURIComponent(email))).json();const count=prior.messages.length;const request=await page.request.post('/api/auth/request-code',{headers:{Origin:origin},data:{email,intent,adultConsent:true,privacyAccepted:true}});expect(request.ok()).toBe(true);const challenge=await request.json();const outbox=await waitForCode(page,email,count);expect(outbox.code).toMatch(/^\d{8}$/);const verified=await page.request.post('/api/auth/verify-code',{headers:{Origin:origin},data:{challengeId:challenge.challengeId,code:outbox.code}});expect(verified.ok()).toBe(true);return verified.json();
}
export async function authFetch(page,path,method='GET',body){const info=await (await page.request.get('/api/session')).json();return page.request.fetch(path,{method,headers:{Origin:origin,'X-CSRF-Token':info.csrfToken},...(body===undefined?{}:{data:body})})}
export async function cloudSaved(page){await expect(page.locator('#cloud-status')).toHaveText(/^已保存 · /,{timeout:15000})}
export async function openAccount(page){await page.locator('#account-nav').click();await expect(page.locator('#account-view')).toBeVisible()}
export async function importLocal(page){await openAccount(page);await page.locator('#import-details summary').click();await page.locator('#import-consent').check();page.once('dialog',d=>d.accept());await page.locator('#import-legacy').click();await expect(page.locator('#import-message')).toContainText('导入成功');await page.locator('[data-select-child]').first().click();await expect(page.locator('#open-safety')).toBeVisible()}

export async function waitForCode(page,email,count=0){let box;await expect.poll(async()=>{box=await(await page.request.get('/__test/outbox?email='+encodeURIComponent(email))).json();return box.messages.length}).toBeGreaterThan(count);return box}

// Age is a property of the selected child profile, never a learning-page override.
export async function changeProfileAge(page,age){
 const id=await page.locator('#child-switch').inputValue();await cloudSaved(page);await openAccount(page);await page.locator(`[data-edit-child="${id}"]`).click();await page.locator('#child-age').selectOption(age);await page.locator('#child-consent').check();await page.locator('#save-child').click();await expect(page.locator('#open-safety')).toBeVisible();await expect(page.locator('#child-switch')).toHaveValue(id);await expect(page.locator('[data-age]')).toHaveCount(0);await cloudSaved(page);
}

// Assertion-only reconstruction uses the real paginated v2 export, not the
// retired whole-state endpoint. The browser app never downloads this whole map.
export async function readProgressSnapshot(page,id){
 const summary=await(await authFetch(page,`/api/children/${id}/progress`)).json();expect(summary.ok).toBe(true);let after=null,through,context,first,items=[];
 do{const result=await(await authFetch(page,`/api/children/${id}/progress/export`+(after!==null?`?after=${after}&through=${through}&context=${encodeURIComponent(context)}`:''))).json();expect(result.ok).toBe(true);first??=result;context=result.context;items.push(...result.items);through=result.through;after=result.nextCursor}while(after!==null);
 const state={records:{},steps:{},viewedSteps:{},completed:{},legacyRecords:{},protocolProgress:{},...JSON.parse(first.legacyStateJSON),...first.navigation,recordSchemaVersion:3};
 for(const {key,record}of items){const[day,age,version]=key.split(':'),base=day+':'+age;if(version==='v0'){state.records[base]=record.records;state.steps[base]=record.step;state.viewedSteps[base]=record.viewedSteps;state.completed[base]=record.completed;if(record.legacyRecord)state.legacyRecords[base]=record.legacyRecord;}else state.protocolProgress[key]={records:record.records,step:record.step,viewedSteps:record.viewedSteps,completed:record.completed};}
 return {state,access:summary.access,navigationRevision:summary.navigationRevision};
}
export async function writeProgressRecord(page,id,key,record){
 const session=await(await page.request.get('/api/session')).json(),current=await(await authFetch(page,`/api/children/${id}/progress/records/${key}`)).json();expect(current.ok).toBe(true);
 return page.request.put(`/api/children/${id}/progress/records/${key}`,{headers:{Origin:origin,'X-CSRF-Token':session.csrfToken,'If-Match':current.etag,'Idempotency-Key':crypto.randomUUID()},data:{record}});
}
export async function writeProgressNavigation(page,id,change){
 const session=await(await page.request.get('/api/session')).json(),summary=await(await authFetch(page,`/api/children/${id}/progress`)).json();expect(summary.ok).toBe(true);
 return page.request.put(`/api/children/${id}/progress/navigation`,{headers:{Origin:origin,'X-CSRF-Token':session.csrfToken,'If-Match':summary.navigationETag,'Idempotency-Key':crypto.randomUUID()},data:{...summary.navigation,...change}});
}
export async function openOriginalRecord(page,key){const detail=page.locator(`[data-history-key="${key}"]`);await detail.locator('summary').click();await detail.locator('[data-read-history]').click();await expect(detail.locator('.saved-history-entry')).toBeVisible();return detail;}
