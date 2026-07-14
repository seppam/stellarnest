const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const allResponses = [];
  page.on('response', res => {
    const url = res.url();
    if (url.includes('firebase') || url.includes('google') || url.includes('identitytoolkit') || url.includes('firestore')) {
      allResponses.push({ url: url.substring(0, 100), status: res.status() });
    }
  });

  await page.goto(BASE + '/auth', { waitUntil: 'networkidle', timeout: 20000 });
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(500);

  const inputs = await page.locator('input').all();
  const email = `qatest${Date.now()}@test.com`;
  for (const inp of inputs) {
    const type = await inp.getAttribute('type') || 'text';
    if (type === 'text') await inp.fill('QA Tester');
    if (type === 'email') await inp.fill(email);
    if (type === 'password') await inp.fill('TestPass123!');
  }

  console.log(`\n📧 Submitting with: ${email}\n`);
  await page.click('button[type="submit"]');

  // Wait up to 20s for navigation to dashboard
  try {
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    console.log('✅ REDIRECTED TO DASHBOARD!');
    console.log('Final URL:', page.url());
  } catch (e) {
    console.log('❌ Did NOT redirect to dashboard within 20s');
    console.log('Final URL:', page.url());
    
    // Check for error on page
    const errorEl = await page.locator('.text-error').first();
    const errorText = await errorEl.textContent().catch(() => '');
    console.log('Error on screen:', errorText || '(none)');
  }

  console.log('\n=== Firebase Network Calls ===');
  if (allResponses.length === 0) {
    console.log('(none)');
  } else {
    allResponses.forEach(r => console.log(`[${r.status}] ${r.url}`));
  }

  await browser.close();
})();
