const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://dipanjanmaity890.github.io/portfolio/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const container = await page.$('#gdev-badges-container');
  const html = await container.innerHTML();
  console.log('CONTAINER HTML:\n' + html);
  
  await browser.close();
})();
