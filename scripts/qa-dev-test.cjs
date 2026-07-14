const { chromium } = require('playwright');
const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('StellarNest') || text.includes('Firebase') || text.includes('hooks')) {
      console.log(`[${msg.type().toUpperCase()}] ${text.substring(0, 300)}`);
    }
  });
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message.substring(0, 200)}`));

  await page.goto(BASE + '/auth', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(800);

  const inputs = await page.locator('input').all();
  const email = `qatest_dev2_${Date.now()}@test.com`;
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(email);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  console.log(`\nSubmitting: ${email}`);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard', { timeout: 35000 });
    console.log('✅ DASHBOARD! Registration successful!');
  } catch (e) {
    console.log('❌ No redirect');
    console.log('URL:', page.url());
    const errorText = await page.locator('.text-error').textContent().catch(() => '');
    console.log('Error:', errorText || '(none)');
  }

  await browser.close();
})();
