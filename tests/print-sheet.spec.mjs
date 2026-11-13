import {test,expect} from '@playwright/test';
import {resetServer,fixture,loginAPI} from './account-helpers.mjs';
test('A4 preview contains all four steps and prints without marking the experiment complete',async({page})=>{
 await resetServer(page);await fixture(page);await loginAPI(page);await page.goto('/');
 await expect(page.locator('#print-experiment')).toBeVisible();
 const before=await page.locator('#complete-day').getAttribute('aria-pressed');
 const popupPromise=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await popupPromise;
 await expect(popup.locator('#print-fit')).not.toHaveText('正在排版…');await expect(popup.locator('.step')).toHaveCount(4);await expect(popup.locator('.materials li').first()).toBeVisible();await expect(popup.locator('.safety')).toContainText('成人');
 await popup.emulateMedia({media:'print'});await expect(popup.locator('.toolbar')).toBeHidden();
 const sizes=await popup.locator('.sheet').evaluate(el=>({width:el.scrollWidth,available:el.clientWidth,font:parseFloat(el.style.getPropertyValue('--body-size')),height:el.scrollHeight,multi:el.classList.contains('multipage')}));
 expect(sizes.width).toBeLessThanOrEqual(sizes.available+1);expect(sizes.font).toBeGreaterThanOrEqual(9);if(!sizes.multi)expect(sizes.height).toBeLessThanOrEqual(277*96/25.4+1);
 await popup.close();expect(await page.locator('#complete-day').getAttribute('aria-pressed')).toBe(before);
});
