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
export async function importLocal(page){await openAccount(page);await page.locator('#import-details summary').click();await page.locator('#import-consent').check();page.once('dialog',d=>d.accept());await page.locator('#import-legacy').click();await expect(page.locator('#import-message')).toContainText('已导入');await page.locator('[data-select-child]').first().click();await expect(page.locator('#open-safety')).toBeVisible()}

export async function waitForCode(page,email,count=0){let box;await expect.poll(async()=>{box=await(await page.request.get('/__test/outbox?email='+encodeURIComponent(email))).json();return box.messages.length}).toBeGreaterThan(count);return box}
