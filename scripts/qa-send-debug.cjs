/**
 * Debug Send form flow step by step
 */
const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';
const REG_TIMEOUT = 55 * 1000;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    // ── Register ──────────────────────────────────────────────────
    await page.goto(BASE + '/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Create Account")').first().click();
    await page.waitForTimeout(800);

    const inputs = await page.locator('form input').all();
    for (const inp of inputs) {
      const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
      const type = await inp.getAttribute('type') || 'text';
      if (ph.includes('name') || type === 'text') await inp.fill('Debug User');
      if (type === 'email') await inp.fill(`debug_${Date.now()}@test.com`);
      if (type === 'password') await inp.fill('TestPass123!');
    }
    await page.click('button[type="submit"]:has-text("Create Account")');
    console.log('⏳ Waiting for registration...');
    await page.waitForURL('**/dashboard', { timeout: REG_TIMEOUT });
    console.log('✅ Registered! At:', page.url());
    await page.waitForTimeout(3000);

    // ── Go to Send ─────────────────────────────────────────────────
    await page.goto(BASE + '/send', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    console.log('📍 On Send page:', page.url());

    // Step 1: Fill amount
    const amountInput = page.locator('input[type="number"][placeholder="0.00"]').first();
    const amountVisible = await amountInput.isVisible().catch(() => false);
    console.log('STEP 1 - Amount input visible:', amountVisible);
    if (amountVisible) {
      await amountInput.click();
      await amountInput.pressSequentially('5', { delay: 100 });
      await page.waitForTimeout(1000);
      const val = await amountInput.inputValue().catch(() => 'ERROR');
      console.log('STEP 1 - Amount value after typing:', val);
    }

    // Step 2: Click "Enter New Recipient Details"
    const enterBtn = page.locator('button:has-text("Enter New Recipient Details")').first();
    const enterVisible = await enterBtn.isVisible().catch(() => false);
    console.log('STEP 2 - Enter New Recipient button visible:', enterVisible);
    if (enterVisible) {
      await enterBtn.click();
      await page.waitForTimeout(2000);
    }

    // Step 3: Fill recipient name
    const allInputsNow = await page.locator('input').all();
    console.log('STEP 3 - Total inputs visible:', allInputsNow.length);
    for (const inp of allInputsNow) {
      const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
      const type = await inp.getAttribute('type') || 'text';
      console.log(`  input type=${type}, placeholder="${ph}"`);
    }

    const nameInput = page.locator('input[placeholder*="Recipient"]').first();
    const nameVisible = await nameInput.isVisible().catch(() => false);
    console.log('STEP 3 - Name input visible:', nameVisible);
    if (nameVisible) {
      await nameInput.fill('John Doe');
      console.log('STEP 3 - Name filled');
    }

    // Step 4: Select bank
    const bankSelect = page.locator('select').first();
    const bankVisible = await bankSelect.isVisible().catch(() => false);
    console.log('STEP 4 - Bank select visible:', bankVisible);
    if (bankVisible) {
      const options = await bankSelect.locator('option').allTextContents();
      console.log('STEP 4 - Bank options:', options.slice(0, 6));
      await bankSelect.selectOption({ label: 'BCA' });
      await page.waitForTimeout(800);
    }

    // Step 5: Fill account
    const acctInput = page.locator('input[placeholder*="08\"], input[placeholder*="account\"]').first();
    const acctVisible = await acctInput.isVisible().catch(() => false);
    console.log('STEP 5 - Account input visible:', acctVisible);
    if (acctVisible) {
      await acctInput.fill('1234567890');
      console.log('STEP 5 - Account filled');
    }
    await page.waitForTimeout(500);

    // Step 6: Click "Use This Recipient"
    const useBtn = page.locator('button:has-text("Use This Recipient")').first();
    const useVisible = await useBtn.isVisible().catch(() => false);
    const useEnabled = useVisible && await useBtn.isEnabled().catch(() => false);
    console.log('STEP 6 - Use This Recipient button visible:', useVisible, ', enabled:', useEnabled);
    if (useEnabled) {
      await useBtn.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('STEP 6 - Button DISABLED — checking disabled fields:');
      for (const inp of await page.locator('input').all()) {
        const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
        const val = await inp.inputValue().catch(() => '');
        console.log(`  placeholder="${ph}", value="${val}"`);
      }
    }

    // Step 7: Check Generate Magic Link button
    const genBtns = await page.locator('button:has-text("Generate Magic Link")').all();
    console.log('STEP 7 - Generate Magic Link buttons found:', genBtns.length);
    for (let i = 0; i < genBtns.length; i++) {
      const vis = await genBtns[i].isVisible().catch(() => false);
      const en = await genBtns[i].isEnabled().catch(() => false);
      const txt = await genBtns[i].textContent().catch(() => '');
      console.log(`  Button ${i}: visible=${vis}, enabled=${en}, text="${txt.trim()}"`);
    }

    // Step 8: Click Generate Magic Link
    const genBtn = page.locator('button:has-text("Generate Magic Link")').last();
    const genEnabled = await genBtn.isEnabled().catch(() => false);
    console.log('STEP 8 - Last Generate Magic Link enabled:', genEnabled);
    if (genEnabled) {
      await genBtn.click();
      console.log('STEP 8 - Clicked! Waiting 12s...');
      await page.waitForTimeout(12000);
      const body = await page.textContent('body');
      console.log('STEP 8 - Body after click:', body.substring(0, 300));
    } else {
      console.log('STEP 8 - CANNOT CLICK — button disabled');
      const body = await page.textContent('body');
      console.log('STEP 8 - Current body:', body.substring(0, 300));
    }

    if (errors.length > 0) {
      console.log('\nConsole errors:', errors.slice(0, 3));
    }
  } catch (err) {
    console.error('FATAL:', err.message);
  }

  await browser.close();
})();
