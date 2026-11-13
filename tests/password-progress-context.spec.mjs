import {test,expect} from '@playwright/test';
import {resetServer,fixture,loginAPI,cloudSaved,openAccount,authFetch} from './account-helpers.mjs';
test('setting a password with a loaded child preserves saving and saved notes after reload',async({page})=>{
 await resetServer(page);const seed=await fixture(page);await loginAPI(page);await page.goto('/#lab');await expect(page.locator('#open-safety')).toBeVisible();
 await page.locator('#tab-observations').click();await page.locator('[data-field="spoken"]').fill('密码设置前的记录');await cloudSaved(page);
 await openAccount(page);await page.locator('#manage-password').click();await page.locator('#new-password').fill('synthetic-test-password');await page.locator('#confirm-password').fill('synthetic-test-password');await page.locator('#save-password').click();await expect(page.locator('#password-dialog')).toHaveCount(0);
 await page.locator('nav a[href="#lab"]').click();await page.locator('#tab-observations').click();await page.locator('[data-field="spoken"]').fill('密码设置后仍能保存');await cloudSaved(page);
 const saved=await(await authFetch(page,`/api/children/${seed.children[0].id}/progress/records/1:4-6:v1`)).json();expect(saved.record.records.spoken).toBe('密码设置后仍能保存');
 await page.reload();await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('密码设置后仍能保存');
});
