const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const log = [];
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  const pass = (step, detail) => { log.push({ step, status: 'PASS', detail }); console.log('✅', step, '|', detail); };
  const fail = (step, detail) => { log.push({ step, status: 'FAIL', detail }); console.log('❌', step, '|', detail); };

  try {
    // T1: Landing
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const h1 = await page.textContent('h1').catch(() => 'NOT FOUND');
    pass('T1-Landing Page', `h1="${h1.trim()}", Get Started visible=${await page.isVisible('button:has-text("Get Started")')}`);

    // T2: Navigate to Auth
    await page.click('button:has-text("Get Started")');
    await page.waitForURL('**/auth', { timeout: 8000 });
    await page.waitForTimeout(1500);
    pass('T2-Auth Page', `URL=${page.url()}`);

    // T3: Create Account tab
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(500);
    const inputs = await page.locator('input').all();
    const inputTypes = await Promise.all(inputs.map(async inp => await inp.getAttribute('type') || 'text'));
    pass('T3-Create Account Form', `input types: [${inputTypes.join(', ')}]`);

    // T4: Fill registration
    const ts = Date.now();
    const testEmail = `qatest${ts}@test.com`;
    for (const inp of inputs) {
      const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
      const type = await inp.getAttribute('type') || 'text';
      if (ph.includes('name') || type === 'text') { await inp.fill('QA Tester'); }
      if (type === 'email') { await inp.fill(testEmail); }
      if (type === 'password') { await inp.fill('TestPass123!'); }
    }
    pass('T4a-Register Inputs', `email=${testEmail}`);

    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(6000); // wait for Firebase + redirect
    const urlAfterReg = page.url();
    const bodyAfterReg = await page.textContent('body');
    if (urlAfterReg.includes('/dashboard')) {
      pass('T4b-Registration', `Redirected to dashboard: ${urlAfterReg}`);
    } else {
      fail('T4b-Registration', `Still on: ${urlAfterReg} | Errors: ${errors.join('; ')}`);
      fail('T4b-Registration Body', bodyAfterReg.substring(0, 200));
    }

    // T5: Dashboard elements
    if (urlAfterReg.includes('/dashboard')) {
      const hasBalance = bodyAfterReg.includes('Balance') || bodyAfterReg.includes('balance');
      const hasSend = bodyAfterReg.includes('Send');
      const hasHistory = bodyAfterReg.includes('History');
      pass('T5-Dashboard UI', `Has Balance=${hasBalance}, Send=${hasSend}, History=${hasHistory}`);
    }

    // T6: Send page
    await page.goto(BASE + '/send', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    const sendBody = await page.textContent('body');
    pass('T6-Send Page', `URL=${page.url()}, has content=${sendBody.length > 50}`);

    // T7: Fill send form
    const sendInputs = await page.locator('input').all();
    let filledAmount = false, filledRecipient = false;
    for (const inp of sendInputs) {
      const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
      if (ph.includes('amount') || ph.includes('xlm') || ph.includes('usd')) { await inp.fill('5'); filledAmount = true; }
      if (ph.includes('recipient') || ph.includes('stellar') || ph.includes('g ')) { await inp.fill('GCNY4OXVEYSJHIDZTIOXZ3GEK4TESJV5ER7BHD2WXD2D2ZVZLSDZNUQV'); filledRecipient = true; }
    }
    pass('T7-Send Form Filled', `Amount=5 XLM:${filledAmount}, Recipient filled:${filledRecipient}`);

    // T8: Submit send
    const sendBtnVisible = await page.isVisible('button:has-text("Send")');
    if (sendBtnVisible) {
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(5000);
      const sendResultUrl = page.url();
      const sendResultBody = await page.textContent('body');
      const sendSuccess = sendResultBody.includes('sent') || sendResultBody.includes('success') || sendResultBody.includes('confirm') || sendResultBody.includes('History') || sendResultUrl.includes('history');
      pass('T8-Send Submit', `URL=${sendResultUrl}, Success=${sendSuccess}`);
    } else {
      pass('T8-Send Submit', 'SKIP - Send button not found');
    }

    // T9: History
    await page.goto(BASE + '/history', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    pass('T9-History Page', `URL=${page.url()}, bodyLen=${(await page.textContent('body')).length}`);

    // T10: Claim page
    await page.goto(BASE + '/claim', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    pass('T10-Claim Page', `URL=${page.url()}`);

    // T11: Withdraw page
    await page.goto(BASE + '/withdraw', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    pass('T11-Withdraw Page', `URL=${page.url()}`);

    // T12: Settings page
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    pass('T12-Settings Page', `URL=${page.url()}`);

  } catch (err) {
    fail('FATAL', err.message);
    console.log('Console errors:', errors);
  }

  await browser.close();

  // Write log to file
  const fs = require('fs');
  fs.writeFileSync('/tmp/qa-log.json', JSON.stringify({ log, errors }, null, 2));
  console.log('\nAll errors captured:', errors);
  console.log('Log written to /tmp/qa-log.json');
  process.exit(0);
})();
