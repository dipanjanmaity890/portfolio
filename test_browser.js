const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  const fileUrl = 'file://' + path.resolve('index.html');
  await page.goto(fileUrl);
  await page.waitForTimeout(2000);
  await browser.close();
})();
