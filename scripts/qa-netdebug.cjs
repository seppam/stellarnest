const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const allNetworkCalls = [];
  page.on('request', req => {
    const u = req.url();
    if (u.includes('googleapis') || u.includes('firebase') || u.includes('firestore') || u.includes('identitytoolkit')) {
      allNetworkCalls.push(`→ ${req.method()} ${u.substring(0, 110)}`);
    }
  });
  page.on('response', res => {
    const u = res.url();
    if (u.includes('googleapis') || u.includes('firebase') || u.includes('firestore') || u.includes('identitytoolkit')) {
      allNetworkCalls.push(`← [${res.status()}] ${u.substring(0, 100)}`);
    }
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[ERR]', msg.text().substring(0, 200));
  });

  console.log('Step 1: Loading /auth...');
  await page.goto(BASE + '/auth', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  console.log('Step 2: Clicking Create Account...');
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(800);

  const email = `qatest${Date.now()}@test.com`;
  console.log(`Step 3: Filling form (${email})...`);
  const inputs = await page.locator('input').all();
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(email);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  console.log('Step 4: Clicking Create Account submit...');
  await page.click('button[type="submit"]');

  // Wait 25s for any Firebase activity
  await page.waitForTimeout(25000);

  console.log('\nFinal URL:', page.url());
  
  const errorText = await page.locator('.text-error').textContent().catch(() => '');
  if (errorText) console.log('On-screen error:', errorText);

  console.log('\n=== All Firebase/Google API calls ===');
  if (allNetworkCalls.length === 0) {
    console.log('(none — Firebase SDK not called at all!)');
  } else {
    allNetworkCalls.forEach(c => console.log(c));
  }

  await browser.close();
})();
