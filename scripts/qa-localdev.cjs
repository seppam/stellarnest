const { chromium } = require('playwright');
const BASE = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || (msg.type() === 'warning' && text.includes('Firebase'))) {
      console.log(`[${msg.type().toUpperCase()}] ${text.substring(0, 400)}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
    if (err.stack) {
      const lines = err.stack.split('\n').slice(0, 5).join('\n');
      console.log(lines);
    }
  });

  await page.goto(BASE + '/auth', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(800);

  const inputs = await page.locator('input').all();
  const email = `qatest_dev_${Date.now()}@test.com`;
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(email);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  console.log(`\n📧 Submitting: ${email}\n`);
  await page.click('button[type="submit"]');

  // Wait for dashboard OR error
  try {
    await page.waitForURL('**/dashboard', { timeout: 25000 });
    console.log('\n✅ REDIRECTED TO DASHBOARD!');
  } catch (e) {
    console.log('\n❌ No redirect to dashboard in 25s');
    console.log('Final URL:', page.url());
    const errorText = await page.locator('.text-error').textContent().catch(() => '(none)');
    console.log('On-screen error:', errorText);
  }

  await browser.close();
})();
