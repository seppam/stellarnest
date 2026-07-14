const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const responses = [];
  page.on('response', res => {
    if (res.status() >= 400) {
      responses.push({ url: res.url(), status: res.status(), type: res.request().resourceType() });
    }
  });

  console.log('=== Loading /auth ===');
  await page.goto(BASE + '/auth', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);

  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  const bodyText = (await page.textContent('body')).substring(0, 800);
  console.log('\nBody text:\n', bodyText);

  // Check for React root
  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML?.substring(0, 500) || 'NO ROOT');
  console.log('\nRoot HTML:\n', rootHTML);

  console.log('\n=== FAILED RESPONSES ===');
  responses.forEach(r => console.log(`[${r.status}] ${r.type}: ${r.url}`));

  // Check if there are any buttons at all
  const btns = await page.locator('button').all();
  console.log(`\nButtons found: ${btns.length}`);
  for (const b of btns) {
    console.log(' -', await b.textContent());
  }

  // Check inputs
  const inps = await page.locator('input').all();
  console.log(`\nInputs found: ${inps.length}`);

  await browser.close();
})();
