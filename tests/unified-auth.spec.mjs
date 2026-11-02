import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {resetServer,fixture,loginAPI,waitForCode,authFetch} from './account-helpers.mjs';

test.beforeEach(async({page})=>{await resetServer(page)});

async function snapshot(page,info,name){
 await mkdir('test-results/visual-review',{recursive:true});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:`test-results/visual-review/${info.project.name}-unified-${name}.png`,fullPage:true});
}

async function requestCode(page,email){
 await page.locator('#auth-email').fill(email);
 await page.locator('#auth-consent').check();
 const sent=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/request-code'&&response.request().method()==='POST');
 await page.locator('#request-code').click();
 const response=await sent;
 expect(response.ok()).toBe(true);
 expect(response.request().postDataJSON()).toMatchObject({email:email.trim().toLowerCase(),intent:'continue',adultConsent:true,privacyAccepted:true});
 await expect(page.locator('#verify-form')).toBeVisible();
 return response.json();
}

async function verifyCode(page,email,priorCount=0){
 const mail=await waitForCode(page,email,priorCount);
 await page.locator('#auth-code').fill(mail.code);
 const verified=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/verify-code'&&response.request().method()==='POST');
 await page.locator('#verify-code').click();
 const response=await verified;
 expect(response.ok()).toBe(true);
 const result=await response.json();if(!result.user.hasPassword){await expect(page.locator('#password-dialog')).toBeVisible();await page.locator('#skip-password').click()}
 return result;
}

test('one email entry creates an eligible parent only after OTP without creating a child',async({page,request},info)=>{
 // The independent API fixture is a synthetic administrator, not the UI's session.
 const administrator={request};
 await fixture(administrator,{children:[]});
 await loginAPI(administrator);
 await page.goto('/');
 await expect(page.locator('[data-auth-intent]')).toHaveCount(0);
 await expect(page.locator('#auth-consent')).not.toBeChecked();
 await expect(page.locator('#auth-policy-note')).toContainText('qa.test');
 await snapshot(page,info,'new-entry');
 const email='newfamily@qa.test';
 const before=await(await authFetch(administrator,'/api/admin/users?query='+encodeURIComponent(email))).json();
 expect(before.total).toBe(0);
 const challenge=await requestCode(page,email);
 await snapshot(page,info,'new-verify');
 expect(challenge).toMatchObject({ok:true,expiresIn:600});
 expect(challenge.challengeId).toMatch(/^[a-f0-9]{32}$/);
 const pending=await(await authFetch(administrator,'/api/admin/users?query='+encodeURIComponent(email))).json();
 expect(pending.total).toBe(0);
 expect((await page.request.get('/api/session')).status()).toBe(401);
 const account=await verifyCode(page,email);
 expect(account.user).toMatchObject({email,role:'parent',status:'active',unlockAll:false,unlockThrough:1});
 expect(account.children).toEqual([]);
 await expect(page.locator('#child-form')).toBeVisible();
 await expect(page.locator('#child-consent')).not.toBeChecked();
 await snapshot(page,info,'new-onboarding');
 await expect(page.locator('#admin-nav')).not.toBeVisible();
 const created=await(await authFetch(administrator,'/api/admin/users?query='+encodeURIComponent(email))).json();
 expect(created.total).toBe(1);
 expect(created.users[0].id).toBe(account.user.id);
});

test('one email entry keeps existing login available after registration closes and domains empty',async({page,request},info)=>{
 const administrator={request};
 await fixture(administrator,{children:[]});
 const existing=await fixture(page,{email:'existing@qa.test',role:'parent',unlockAll:false,unlockThrough:1});
 await loginAPI(administrator);
 const updated=await authFetch(administrator,'/api/admin/settings','PUT',{allowedDomains:[],registrationEnabled:false,progressionMode:'sequential'});
 expect(updated.ok()).toBe(true);
 await page.goto('/');
 await expect(page.locator('#auth-policy-note')).toContainText(/未开放|暂停|关闭/);
 await expect(page.locator('#auth-policy-note')).toContainText(/已有账号/);
 await expect(page.locator('#request-code')).toBeEnabled();
 await snapshot(page,info,'returning-registration-closed');
 await requestCode(page,'existing@qa.test');
 await snapshot(page,info,'returning-verify-closed');
 const account=await verifyCode(page,'existing@qa.test');
 expect(account.user.id).toBe(existing.user.id);
 expect(account.children.map(child=>child.id)).toEqual(existing.children.map(child=>child.id));
 await expect(page.locator('#child-switch')).toHaveValue(existing.children[0].id);
 await expect(page.locator('#open-safety')).toBeVisible();
 const users=await(await authFetch(administrator,'/api/admin/users?query=existing')).json();
 expect(users.total).toBe(1);
});

test('guardian consent is unchecked and prevents email requests until explicitly confirmed',async({page})=>{
 await fixture(page,{children:[]});
 const requests=[];
 page.on('request',request=>{if(new URL(request.url()).pathname==='/api/auth/request-code')requests.push(request.postDataJSON())});
 await page.goto('/');
 await page.locator('#auth-email').fill('newfamily@qa.test');
 await expect(page.locator('#auth-consent')).not.toBeChecked();
 await expect(page.locator('#auth-consent')).toHaveAttribute('required','');
 await page.locator('#request-code').click();
 await expect(page.locator('#email-form')).toBeVisible();
 expect(await page.locator('#email-form').evaluate(form=>form.checkValidity())).toBe(false);
 expect(requests).toEqual([]);
 expect((await(await page.request.get('/__test/outbox?email=newfamily%40qa.test')).json()).messages).toHaveLength(0);
 await requestCode(page,'newfamily@qa.test');
 expect(requests).toHaveLength(1);
});

test('resend keeps the confirmed email but changing email resets consent and challenge',async({page})=>{
 await fixture(page,{children:[]});
 await page.clock.install();
 const requests=[];
 page.on('request',request=>{if(new URL(request.url()).pathname==='/api/auth/request-code')requests.push(request.postDataJSON())});
 await page.goto('/');
 const first=await requestCode(page,'first@qa.test');
 await waitForCode(page,'first@qa.test');
 await expect(page.locator('#resend-code')).toBeDisabled();
 await page.clock.fastForward(61000);
 await expect(page.locator('#resend-code')).toBeEnabled();
 const resent=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/request-code');
 await page.locator('#resend-code').click();
 const resendResponse=await resent;
 expect(resendResponse.ok()).toBe(true);
 const second=await resendResponse.json();
 expect(second.challengeId).not.toBe(first.challengeId);
 expect(resendResponse.request().postDataJSON()).toMatchObject({email:'first@qa.test',intent:'continue',adultConsent:true,privacyAccepted:true});
 await waitForCode(page,'first@qa.test',1);
 await expect(page.locator('#change-email')).toBeEnabled();
 await page.locator('#change-email').click();
 await expect(page.locator('#auth-consent')).not.toBeChecked();
 await page.locator('#auth-email').fill('second@qa.test');
 await page.locator('#request-code').click();
 expect(requests).toHaveLength(2);
 await expect(page.locator('#email-form')).toBeVisible();
 const changed=await requestCode(page,'second@qa.test');
 expect(changed.challengeId).not.toBe(second.challengeId);
 const account=await verifyCode(page,'second@qa.test');
 expect(account.user.email).toBe('second@qa.test');
 await expect(page.locator('#child-form')).toBeVisible();
});

test('repeated submission while code request is pending cannot change identity or send twice',async({page})=>{
 await fixture(page,{children:[]});
 await page.goto('/');
 await page.locator('#auth-email').fill('pending@qa.test');
 await page.locator('#auth-consent').check();
 let release,requestCount=0;
 const blocked=new Promise(resolve=>{release=resolve});
 await page.route('**/api/auth/request-code',async route=>{requestCount++;await blocked;await route.continue()});
 try{
  await page.locator('#request-code').click();
  await expect.poll(()=>requestCount).toBe(1);
  await expect(page.locator('#request-code')).toBeDisabled();
  await expect(page.locator('#auth-email')).toHaveAttribute('readonly','');
  await expect(page.locator('#auth-consent')).toBeDisabled();
  await page.locator('#request-code').evaluate(button=>button.click());
  await page.locator('#email-form').evaluate(form=>form.requestSubmit());
  expect(requestCount).toBe(1);
 }finally{release();await page.unrouteAll({behavior:'wait'})}
 await expect(page.locator('#verify-form')).toBeVisible();
 await expect(page.locator('#account-content')).toContainText('pending@qa.test');
 expect((await waitForCode(page,'pending@qa.test')).messages).toHaveLength(1);
 await page.locator('#change-email').click();
 await expect(page.locator('#auth-email')).not.toHaveAttribute('readonly','');
 await expect(page.locator('#auth-consent')).toBeEnabled();
 await expect(page.locator('#auth-consent')).not.toBeChecked();
});

test('refresh drops an unfinished challenge and does not preserve consent or OTP',async({page})=>{
 await fixture(page,{children:[]});
 await page.goto('/');
 await requestCode(page,'interrupted@qa.test');
 const mail=await waitForCode(page,'interrupted@qa.test');
 await page.locator('#auth-code').fill(mail.code);
 await page.reload();
 await expect(page.locator('#email-form')).toBeVisible();
 await expect(page.locator('#auth-consent')).not.toBeChecked();
 await expect(page.locator('#auth-email')).toHaveValue('');
 await expect(page.locator('#auth-code')).toHaveCount(0);
 expect((await page.request.get('/api/session')).status()).toBe(401);
 expect((await(await page.request.get('/__test/outbox?email=interrupted%40qa.test')).json()).messages).toHaveLength(1);
});
