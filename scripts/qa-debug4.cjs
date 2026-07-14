const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Capture ALL console (including errors)
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Capture uncaught exceptions
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
    if (err.stack) console.log(err.stack.substring(0, 300));
  });

  await page.goto(BASE + '/auth', { waitUntil: 'networkidle', timeout: 20000 });
  
  // Click Create Account tab
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(1000);

  // Fill form
  const inputs = await page.locator('input').all();
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(`qatest${Date.now()}@test.com`);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  // Check form state before submit
  const formHTML = await page.evaluate(() => {
    const form = document.querySelector('form');
    return form ? form.outerHTML.substring(0, 500) : 'NO FORM FOUND';
  });
  console.log('\n=== Form HTML ===\n', formHTML);

  // Try clicking the submit button directly
  console.log('\n=== Clicking submit button ===\n');
  const btn = page.locator('button[type="submit"]');
  const count = await btn.count();
  console.log(`Submit buttons found: ${count}`);
  
  if (count > 0) {
    // Use evaluate to click and check what happens
    await btn.first().click({ timeout: 5000 });
    
    // Wait for navigation or Firebase call
    try {
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 12000 }),
        page.waitForTimeout(12000),
      ]);
    } catch(e) {}
    
    console.log('\nURL after click:', page.url());
    
    // Check for any loading spinner
    const isLoading = await page.locator('.animate-spin').count();
    console.log(`Loading spinners visible: ${isLoading}`);
    
    // Check for error text
    const errorText = await page.locator('.text-error').textContent().catch(() => '');
    console.log(`Error message on screen: "${errorText}"`);
  }

  await browser.close();
})();
