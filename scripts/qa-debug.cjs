const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Capture ALL network requests
  const requests = [];
  page.on('request', req => {
    if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr' || req.resourceType() === 'script' || req.resourceType() === 'stylesheet') {
      requests.push({ url: req.url(), type: req.resourceType(), method: req.method() });
    }
  });

  // Capture ALL responses with status codes
  const responses = [];
  page.on('response', res => {
    if (res.status() >= 400) {
      responses.push({ url: res.url(), status: res.status(), type: res.request().resourceType() });
    }
  });

  await page.goto(BASE + '/auth', { waitUntil: 'networkidle', timeout: 20000 });
  
  // Fill and submit
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(500);
  
  const inputs = await page.locator('input').all();
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(`qatest${Date.now()}@test.com`);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  console.log('--- Clicking Create Account ---');
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(8000);

  console.log('\n=== FAILED RESPONSES (status >= 400) ===');
  responses.forEach(r => {
    console.log(`[${r.status}] ${r.type}: ${r.url}`);
  });

  console.log('\n=== ALL NETWORK REQUESTS (fetch/xhr/script/css) ===');
  requests.forEach(r => {
    console.log(`${r.type} ${r.method} → ${r.url}`);
  });

  console.log('\n=== CURRENT URL ===');
  console.log(page.url());

  console.log('\n=== PAGE TEXT (first 500 chars) ===');
  console.log((await page.textContent('body')).substring(0, 500));

  await browser.close();
})();
