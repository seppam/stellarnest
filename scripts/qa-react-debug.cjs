const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[ERR]', msg.text().substring(0, 300));
  });

  // Load landing page first (safer)
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1000);
  console.log('Landing URL:', page.url());

  // Navigate to auth via the button
  await page.click('button:has-text("Get Started")');
  await page.waitForTimeout(2000);
  console.log('Auth URL:', page.url());

  // Check for React errors on the page
  const reactErrors = await page.locator('text=Minified React error').count();
  console.log('React errors on page:', reactErrors);

  // Try clicking Create Account
  const createBtn = page.locator('button:has-text("Create Account")');
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(1000);
  }
  
  console.log('After tab switch URL:', page.url());

  // Fill and submit
  const inputs = await page.locator('input').all();
  const email = `qatest${Date.now()}@test.com`;
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(email);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  console.log('\nSubmitting...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  console.log('URL after 5s:', page.url());
  const errorText = await page.locator('.text-error').textContent().catch(() => '');
  console.log('On-screen error:', errorText || '(none)');

  await browser.close();
})();
