import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {resetServer,fixture,loginAPI} from './account-helpers.mjs';

for(const ageBand of ['4-6','7-9'])test(`Day 265 ${ageBand}: age-specific solo sheet downloads without revealing reference or altering records`,async({page})=>{
 await resetServer(page);const {children:[child]}=await fixture(page,{children:[{nickname:'合成纸样档案',ageBand,state:{day:265,age:ageBand}}]});
 await loginAPI(page);await page.goto('/');await expect(page.locator('#day-number')).toContainText('DAY 265 / 365');
 await page.locator('#tab-materials-panel').click();
 const recordURL=`/api/children/${child.id}/progress/records/265:${ageBand}:v1`;
 const before=await (await page.request.get(recordURL)).json();expect(before.ok).toBe(true);
 await page.locator('#load-paper-resources').click();
 const list=page.locator('#paper-resource-list');
 const first=list.locator('li').first();await expect(first).toContainText('单人替代｜虚构练习（没有真人观察）');
 await expect(first).toContainText('只打印这一页');await expect(first).toContainText('可选');
 await expect(first).not.toContainText('成人选读');await expect(list).not.toContainText('高龄另题：完全虚构清单');
 await expect(list.locator('li').nth(1)).toContainText('同一片虚构景物');
 const url=await first.getByRole('link',{name:'下载'}).getAttribute('href');
 const res=await page.request.get(url);expect(res.status()).toBe(200);expect(res.headers()['content-disposition']).toMatch(/^attachment;/);
 expect(res.headers()['cache-control']).toBe('private, no-store');
 const body=await res.body();expect(url).toContain(createHash('sha256').update(body).digest('hex')+'.svg');
 const svg=body.toString();expect(svg).toContain('虚构练习 · 没有真人观察');expect(svg).toContain('真实双人观察：未做');
 expect(svg).toContain('两行都有');expect(svg.includes('未知：保留在哪一行？')).toBe(ageBand==='7-9');
 expect(svg).not.toMatch(/松鼠|答案：/);
 expect((await page.request.get(url.replace('/'+ageBand+'/',ageBand==='4-6'?'/7-9/':'/4-6/'))).status()).toBe(409);
 const after=await (await page.request.get(recordURL)).json();expect(after.record).toEqual(before.record);expect(after.revision).toBe(before.revision);
});
