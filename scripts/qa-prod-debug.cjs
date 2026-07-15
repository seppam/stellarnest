const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('StellarNest') || text.includes('Firebase') || text.includes('hooks') || text.includes('offline') || text.includes('wallet') || text.includes('Friendbot')) {
      console.log(`[${msg.type().toUpperCase()}] ${text.substring(0, 350)}`);
    }
  });
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 250)}`));

  await page.goto(BASE + '/auth', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(800);

  const inputs = await page.locator('input').all();
  const email = `qatest_prod_${Date.now()}@test.com`;
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(email);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  console.log(`\nSubmitting: ${email}`);
  
  // Listen for network requests
  page.on('request', req => {
    const url = req.url();
    if (url.includes('firebase') || url.includes('googleapis') || url.includes('identitytoolkit') || url.includes('firestore') || url.includes('friendbot') || url.includes('horizon')) {
      console.log(`[REQ] ${req.method()} ${url.substring(0, 120)}`);
    }
  });
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('firebase') || url.includes('googleapis') || url.includes('identitytoolkit') || url.includes('firestore') || url.includes('friendbot') || url.includes('horizon')) {
      try {
        const body = await res.text().catch(() => '');
        console.log(`[RES ${res.status()}] ${url.substring(0, 120)} | ${body.substring(0, 150)}`);
      } catch(e) {
        console.log(`[RES ${res.status()}] ${url.substring(0, 120)}`);
      }
    }
  });

  await page.click('button[type="submit"]');

  // Wait longer - up to 40s
  try {
    await page.waitForURL('**/dashboard', { timeout: 40000 });
    console.log('\n✅ DASHBOARD! Registration successful!');
  } catch (e) {
    console.log('\n❌ No redirect after 40s');
    console.log('Final URL:', page.url());
    
    // Check for error message on screen
    const allText = await page.locator('body').textContent().catch(() => '');
    if (allText && allText.includes('✓')) {
      console.log('Success message found:', allText.match(/✓[^<\n]{5,80}/)?.[0]);
    }
    if (allText && allText.includes('rror')) {
      console.log('Error found:', allText.match(/[^.\n]{0,30}rror[^.\n]{0,80}/)?.[0]);
    }
  }

  await browser.close();
})();
