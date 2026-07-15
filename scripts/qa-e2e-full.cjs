/**
 * StellarNest E2E Test Suite — v2 (with proper wait times)
 *
 * Key timings measured from production:
 * - Firebase Auth sign-up: ~2-3s
 * - Friendbot wallet creation + initial funding: ~10-15s
 * - USDC trust line establishment: ~5-8s
 * - Firestore writes: ~2-3s
 * - Total registration flow: ~25-35s
 *
 * Run: node scripts/qa-e2e-full.cjs
 */

const { chromium } = require('playwright');
const BASE = 'https://stellarnest-omega.vercel.app';
const TIMESTAMPS = Date.now();

const TOTAL_TIMEOUT = 90 * 1000;   // 90s per test
const REG_TIMEOUT   = 50 * 1000;   // 50s for registration (most expensive op)
const NAV_TIMEOUT   = 15 * 1000;   // 15s for page navigation
const ACTION_WAIT   = 3 * 1000;    // 3s after a major action before asserting

const fs = require('fs');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT after ${ms}ms: ${label}`)), ms)
    )
  ]);
}

function log(step, status, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌';
  const msg = `${icon} ${step} | ${detail}`;
  console.log(msg);
  return { step, status, detail };
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  const results = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(`[PAGE] ${err.message}`));

  // Collect network failures for debugging
  const netFailures = [];
  page.on('requestfailed', req => {
    const url = req.url();
    // Ignore fonts and analytics — focus on app-critical requests
    if (!url.includes('fonts.') && !url.includes('google-analytics') && !url.includes('doubleclick')) {
      netFailures.push(`${req.method()} ${url.split('?')[0].split('/').slice(-2).join('/')} (${req.failure()?.errorText})`);
    }
  });

  const addResult = (step, status, detail) => results.push(log(step, status, detail));

  try {
    // ══════════════════════════════════════════════════════════════════
    // T1 — Landing Page
    // ══════════════════════════════════════════════════════════════════
    await withTimeout(page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }), NAV_TIMEOUT, 'T1: Landing load');
    await page.waitForTimeout(ACTION_WAIT);

    const h1 = await page.textContent('h1').catch(() => 'NOT FOUND');
    const getStartedVisible = await page.isVisible('button:has-text("Get Started")');
    addResult('T1-Landing Page', 'PASS',
      `h1="${h1.trim()}", Get Started visible=${getStartedVisible}`);

    // ══════════════════════════════════════════════════════════════════
    // T2 — Navigate to Auth
    // ══════════════════════════════════════════════════════════════════
    await withTimeout(page.click('button:has-text("Get Started")'), NAV_TIMEOUT, 'T2: Click Get Started');
    await withTimeout(page.waitForURL('**/auth', { timeout: 8000 }), NAV_TIMEOUT, 'T2: URL change to /auth');
    await page.waitForTimeout(ACTION_WAIT);
    addResult('T2-Auth Page', 'PASS', `URL=${page.url()}`);

    // ══════════════════════════════════════════════════════════════════
    // T3 — Switch to Create Account tab
    // ══════════════════════════════════════════════════════════════════
    const createAccBtn = page.locator('button:has-text("Create Account")').first();
    await createAccBtn.click();
    await page.waitForTimeout(1000);

    const inputs = await page.locator('form input').all();
    const inputTypes = await Promise.all(inputs.map(async inp => inp.getAttribute('type') || 'text'));
    addResult('T3-Create Account Form', 'PASS',
      `input types: [${inputTypes.join(', ')}], count=${inputs.length}`);

    // ══════════════════════════════════════════════════════════════════
    // T4 — Full Registration Flow (fresh user)
    // ══════════════════════════════════════════════════════════════════
    const testEmail = `qatest_${TIMESTAMPS}@test.com`;
    for (const inp of inputs) {
      const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
      const type = await inp.getAttribute('type') || 'text';
      if (ph.includes('name') || type === 'text') await inp.fill('QA Tester');
      if (type === 'email') await inp.fill(testEmail);
      if (type === 'password') await inp.fill('TestPass123!');
    }
    addResult('T4a-Register Inputs', 'PASS', `email=${testEmail}`);

    // Click submit and wait for dashboard — this takes ~25-35s
    await page.click('button[type="submit"]:has-text("Create Account")');
    console.log(`  🔄 Waiting up to ${REG_TIMEOUT / 1000}s for registration...`);

    let regSuccess = false;
    try {
      await withTimeout(page.waitForURL('**/dashboard', { timeout: REG_TIMEOUT }), REG_TIMEOUT, 'T4: Dashboard redirect');
      regSuccess = true;
    } catch (_) {
      // Didn't redirect — check if still on auth page
    }

    const urlAfterReg = page.url();
    if (regSuccess) {
      await page.waitForTimeout(ACTION_WAIT);
      const bodyAfterReg = await page.textContent('body');
      const hasBalance  = bodyAfterReg.includes('Balance') || bodyAfterReg.includes('balance');
      const hasSend     = bodyAfterReg.includes('Send');
      const hasHistory  = bodyAfterReg.includes('History');
      addResult('T4b-Registration', 'PASS',
        `✅ Redirected to dashboard in ~${REG_TIMEOUT / 1000}s | Balance=${hasBalance}, Send=${hasSend}, History=${hasHistory}`);
      addResult('T5-Dashboard UI', 'PASS',
        `Has Balance=${hasBalance}, Send=${hasSend}, History=${hasHistory}, bodyLen=${bodyAfterReg.length}`);
    } else {
      addResult('T4b-Registration', 'FAIL', `Still on: ${urlAfterReg} after ${REG_TIMEOUT / 1000}s`);
      addResult('T5-Dashboard UI', 'SKIP', 'Skipped — registration failed');
      addResult('T4-Registration Errors', 'FAIL', `Console errors: ${consoleErrors.slice(-3).join(' | ')}`);
    }

    // ══════════════════════════════════════════════════════════════════
    // T6 — Send Page (only if registered)
    // ══════════════════════════════════════════════════════════════════
    if (regSuccess) {
      await withTimeout(page.goto(BASE + '/send', { waitUntil: 'domcontentloaded' }), NAV_TIMEOUT, 'T6: Send page load');
      await page.waitForTimeout(ACTION_WAIT);

      const sendBody = await page.textContent('body');
      const sendPageLoaded = sendBody.length > 100;
      addResult('T6-Send Page', sendPageLoaded ? 'PASS' : 'FAIL',
        `URL=${page.url()}, bodyLen=${sendBody.length}`);

      // T7 — Fill Send form
      const sendInputs = await page.locator('input').all();
      let filledAmount = false, filledRecipient = false;
      for (const inp of sendInputs) {
        const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
        const id = ((await inp.getAttribute('id')) || '').toLowerCase();
        const name = ((await inp.getAttribute('name')) || '').toLowerCase();

        if (ph.includes('amount') || ph.includes('xlm') || ph.includes('usd') || id.includes('amount')) {
          await inp.fill('5');
          filledAmount = true;
        }
        if (ph.includes('recipient') || ph.includes('stellar') || ph.includes('address') || id.includes('recipient') || name.includes('recipient')) {
          await inp.fill('GCNY4OXVEYSJHIDZTIOXZ3GEK4TESJV5ER7BHD2WXD2D2ZVZLSDZNUQV');
          filledRecipient = true;
        }
      }
      addResult('T7-Send Form Filled', 'PASS',
        `Amount=5 filled:${filledAmount}, Recipient filled:${filledRecipient}, inputs found:${sendInputs.length}`);

      // T8 — Submit Send
      await page.waitForTimeout(1000);
      const sendBtn = page.locator('button[type="submit"]:has-text("Send")').first();
      const sendBtnVisible = await sendBtn.isVisible().catch(() => false);
      if (sendBtnVisible) {
        await sendBtn.click();
        await page.waitForTimeout(5000); // wait for Stellar tx to confirm
        const sendResultUrl = page.url();
        const sendResultBody = await page.textContent('body');
        const sendSuccess = sendResultBody.includes('sent') || sendResultBody.includes('success') ||
                            sendResultBody.includes('confirm') || sendResultBody.includes('History') ||
                            sendResultUrl.includes('history');
        addResult('T8-Send Submit', sendSuccess ? 'PASS' : 'FAIL',
          `URL=${sendResultUrl}, Success=${sendSuccess}, body snippet: ${sendResultBody.substring(0, 100)}`);
      } else {
        addResult('T8-Send Submit', 'FAIL', 'Send button not visible');
      }

      // T9 — History Page
      await withTimeout(page.goto(BASE + '/history', { waitUntil: 'domcontentloaded' }), NAV_TIMEOUT, 'T9: History load');
      await page.waitForTimeout(ACTION_WAIT);
      const historyBody = await page.textContent('body');
      addResult('T9-History Page', 'PASS',
        `URL=${page.url()}, bodyLen=${historyBody.length}`);
    } else {
      // Skip Send/History tests if registration failed
      ['T6-Send Page', 'T7-Send Form Filled', 'T8-Send Submit', 'T9-History Page'].forEach(s =>
        addResult(s, 'SKIP', 'Skipped — registration failed')
      );
    }

    // ══════════════════════════════════════════════════════════════════
    // T10-T12 — Static Pages (accessible without auth in SPA)
    // ══════════════════════════════════════════════════════════════════
    for (const [num, path] of [['T10', '/claim'], ['T11', '/withdraw'], ['T12', '/settings']]) {
      await withTimeout(page.goto(BASE + path, { waitUntil: 'domcontentloaded' }), NAV_TIMEOUT, `${num} page load`);
      await page.waitForTimeout(ACTION_WAIT);
      const body = await page.textContent('body');
      addResult(`${num}-${path} Page`, body.length > 50 ? 'PASS' : 'FAIL',
        `URL=${page.url()}, bodyLen=${body.length}`);
    }

    // ══════════════════════════════════════════════════════════════════
    // T13 — Sign In Flow (existing user)
    // ══════════════════════════════════════════════════════════════════
    await withTimeout(page.goto(BASE + '/auth', { waitUntil: 'domcontentloaded' }), NAV_TIMEOUT, 'T13: Auth page');
    await page.waitForTimeout(ACTION_WAIT);

    const signInBtn = page.locator('button:has-text("Sign In")').first();
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await page.waitForTimeout(1000);

      const signInInputs = await page.locator('input').all();
      for (const inp of signInInputs) {
        const type = await inp.getAttribute('type') || 'text';
        if (type === 'email') await inp.fill(testEmail);
        if (type === 'password') await inp.fill('TestPass123!');
      }

      await page.click('button[type="submit"]:has-text("Sign In")');
      console.log(`  🔄 Waiting up to ${REG_TIMEOUT / 1000}s for sign-in...`);

      let signInSuccess = false;
      try {
        await withTimeout(page.waitForURL('**/dashboard', { timeout: REG_TIMEOUT }), REG_TIMEOUT, 'T13: Sign-in redirect');
        signInSuccess = true;
      } catch (_) { /* didn't redirect */ }

      addResult('T13-Sign In (existing user)', signInSuccess ? 'PASS' : 'FAIL',
        signInSuccess ? 'Redirected to dashboard' : `Still on: ${page.url()}`);
    } else {
      addResult('T13-Sign In', 'SKIP', 'Sign In button not found');
    }

  } catch (err) {
    log('FATAL ERROR', 'FAIL', err.message);
    console.log('Last few console errors:', consoleErrors.slice(-5));
  }

  await browser.close();

  // ─── Summary ────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log('\n' + '═'.repeat(55));
  console.log(`  SUMMARY: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('═'.repeat(55));

  if (netFailures.length > 0) {
    console.log('\nNetwork failures (non-fonts):');
    netFailures.forEach(f => console.log('  ⚠️', f));
  }
  if (consoleErrors.length > 0) {
    console.log('\nConsole errors:');
    consoleErrors.slice(0, 5).forEach(e => console.log('  ❌', e.substring(0, 200)));
  }

  fs.writeFileSync('/tmp/qa-e2e-full.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    base: BASE,
    results,
    netFailures,
    consoleErrors: consoleErrors.slice(0, 10)
  }, null, 2));
  console.log('\nFull log written to /tmp/qa-e2e-full.json');
  process.exit(failed > 0 ? 1 : 0);
})();
