const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Capture ALL network activity
  const allResponses = [];
  page.on('response', res => {
    const url = res.url();
    if (url.includes('firebase') || url.includes('google') || url.includes('firestore') || url.includes('identitytoolkit')) {
      allResponses.push({ url: url.substring(0, 120), status: res.status(), type: res.request().resourceType() });
    }
  });

  // Also capture console
  const consoleMsgs = [];
  page.on('console', msg => { consoleMsgs.push(msg.type() + ': ' + msg.text()); });

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

  console.log('\n=== Submitting Registration ===\n');
  
  // Clear responses before submit
  allResponses.length = 0;
  
  // Click submit and wait
  await Promise.race([
    page.click('button:has-text("Create Account")'),
    page.waitForURL('**/dashboard', { timeout: 15000 }).then(() => 'DASHBOARD!'),
  ]);
  
  // Wait for any Firebase calls
  await page.waitForTimeout(8000);

  console.log('Final URL:', page.url());
  console.log('\n=== Firebase/Google Network Calls ===');
  if (allResponses.length === 0) {
    console.log('(none detected — this is the problem!)');
  } else {
    allResponses.forEach(r => console.log(`[${r.status}] ${r.type}: ${r.url}`));
  }
  
  console.log('\n=== Console Messages ===');
  consoleMsgs.forEach(m => console.log(m));

  // Check for error messages on screen
  const bodyText = (await page.textContent('body')).substring(0, 600);
  console.log('\n=== Page Body (after submit) ===\n', bodyText);

  await browser.close();
})();
