import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',fullyParallel:false,workers:1,retries:0,timeout:45000,globalTimeout:600000,
 reporter:'list',use:{baseURL:'http://127.0.0.1:4173',channel:process.env.PLAYWRIGHT_CHANNEL==='chrome'?'chrome':undefined,trace:'off',screenshot:'only-on-failure'},
 projects:[{name:'desktop-chromium',use:{viewport:{width:1440,height:1000}}},{name:'mobile-chromium',use:{...devices['Pixel 7'],defaultBrowserType:'chromium'}}],
 webServer:{command:'node scripts/serve-account-test.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:30000}
});
