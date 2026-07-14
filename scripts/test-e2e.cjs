/**
 * StellarNest — Black Box E2E Test (FINAL)
 * Uses BrowserRouter URLs (/send, not /#/send)
 * Run: node scripts/test-e2e.cjs
 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`));

  const results = [];

  // Demo user (bypasses Firebase auth for testing)
  const DEMO_USER = {
    id: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX',
    name: 'Asep Demo',
    email: 'asep@demo.test',
    stellarPublicKey: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX',
    emergencyFundBalanceUSD: 500,
    savedLocalBank: null,
    createdAt: new Date().toISOString(),
  };

  async function seedUser() {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate((u) => localStorage.setItem('stellarnest_user', JSON.stringify(u)), [DEMO_USER]);
  }

  async function go(path, waitMs = 3000) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(waitMs);
    return page.url();
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 1: Landing page (public)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 1: Landing page...');
  try {
    const url = await go('/');
    await sleep(1000);
    const title = await page.title();
    const body = await page.textContent('body');
    results.push({ test: 'Landing page renders', pass: title.includes('StellarNest') && body.includes('Send money'), detail: title });
    console.log(`  ✅ "${title}"`);
  } catch (e) {
    results.push({ test: 'Landing page renders', pass: false, detail: e.message });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 2: App shell — Dashboard loads
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 2: Dashboard renders...');
  try {
    await seedUser();
    const url = await go('/dashboard');
    const body = await page.textContent('body');
    const hasGreeting = /hi|hello|hey|welcome/i.test(body);
    const hasNav = body.includes('Send') && body.includes('Claim');
    results.push({ test: 'Dashboard renders', pass: hasGreeting && hasNav, detail: body.slice(0, 80) });
    console.log(`  ${hasGreeting && hasNav ? '✅' : '⚠️'} Dashboard: ${body.slice(0, 60)}`);
  } catch (e) {
    results.push({ test: 'Dashboard renders', pass: false, detail: e.message });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 3: Send page renders
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 3: Send page renders...');
  try {
    await seedUser();
    await go('/send');
    const body = await page.textContent('body');
    const hasForm = /amount|allocation|family|savings|split|magic|send.*money/i.test(body);
    results.push({ test: 'Send page renders', pass: hasForm, detail: body.slice(0, 80) });
    console.log(`  ${hasForm ? '✅' : '⚠️'} Send page: ${body.slice(0, 80)}`);
  } catch (e) {
    results.push({ test: 'Send page renders', pass: false, detail: e.message });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 4: Send — Fill form + Generate Magic Link
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 4: Generate Magic Link...');
  try {
    await seedUser();
    await go('/send');
    await sleep(1000);

    // Fill amount
    const inputs = await page.$$('input');
    let amountSet = false;
    for (const input of inputs) {
      const type = await input.getAttribute('type').catch(() => '');
      const ph = (await input.getAttribute('placeholder').catch(() => '')).toLowerCase();
      if (type === 'number' || /amount/i.test(ph)) {
        await input.fill('50');
        amountSet = true;
        console.log('  ✅ Amount: 50');
        break;
      }
    }
    if (!amountSet) console.log('  ⚠️ No amount input found');

    // Fill recipient name
    for (const input of inputs) {
      const ph = (await input.getAttribute('placeholder').catch(() => '')).toLowerCase();
      const type = await input.getAttribute('type').catch(() => '');
      if ((type === 'text' || type === '') && /recipient|name/i.test(ph)) {
        await input.fill('Budi Santoso');
        console.log('  ✅ Recipient: Budi Santoso');
        break;
      }
    }

    await sleep(500);

    // Click the generate button
    const btns = await page.$$('button');
    let genBtn = null, genTxt = '';
    for (const btn of btns) {
      const txt = (await btn.textContent().catch(() => '')).trim();
      if (!/sign|log|auth|account|forgot|continue|back|close/i.test(txt) && txt.length > 0 && txt.length < 50) {
        if (/generate|create.*link|send.*link|share|magic|link|send.*now/i.test(txt)) {
          genBtn = btn; genTxt = txt;
          console.log('  🎯 Button:', txt);
          break;
        }
      }
    }
    if (!genBtn) {
      for (const btn of btns.slice(-4)) {
        const txt = (await btn.textContent().catch(() => '')).trim();
        if (!/sign|log|auth|account|forgot|continue|back|close/i.test(txt) && txt.length > 0) {
          genBtn = btn; genTxt = txt;
          console.log('  🎯 Fallback button:', txt);
          break;
        }
      }
    }

    if (genBtn) {
      await genBtn.scrollIntoViewIfNeeded();
      await genBtn.click({ force: true });
      console.log('  ✅ Clicked:', genTxt);

      // Wait for testnet transaction (can take 10s for Horizon)
      await page.waitForTimeout(12000);

      const body = await page.textContent('body');
      const hasLink = /https?:\/\/|stellarnest|vercel|claim/i.test(body);
      const hasSuccess = /success|sent|created|link.*generat/i.test(body);
      const hasError = /error|failed|rejected|insufficient|try again|network/i.test(body);
      const url = page.url();

      console.log(`  Result — Link: ${hasLink} | Success: ${hasSuccess} | Error: ${hasError} | URL: ${url}`);
      if (hasError && !hasLink) console.log('  Error text:', body.slice(0, 150));

      // Check for shareable link in page
      const linkElements = await page.$$('a[href*="claim"]');
      if (linkElements.length > 0) {
        const href = await linkElements[0].getAttribute('href');
        console.log('  ✅ Shareable claim link found:', href?.slice(0, 80));
      }

      results.push({
        test: 'Magic Link generates',
        pass: (hasLink || hasSuccess) && !hasError,
        detail: hasLink ? 'Link/URL found in page' : hasSuccess ? 'Success message shown' : hasError ? `Error: ${body.slice(0, 80)}` : 'No evidence',
      });
    } else {
      results.push({ test: 'Magic Link generates', pass: false, detail: 'No generate button found' });
    }
  } catch (e) {
    results.push({ test: 'Magic Link generates', pass: false, detail: e.message });
    console.log('  ❌ FAILED:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 5: Insights dashboard
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 5: Insights dashboard...');
  try {
    await seedUser();
    await go('/insights');
    const body = await page.textContent('body');
    const hasInsights = /insight|analytics|income|sent|received|family|split|total|month|transaction/i.test(body);
    results.push({ test: 'Insights dashboard', pass: hasInsights, detail: body.slice(0, 100) });
    console.log(`  ${hasInsights ? '✅' : '⚠️'} Insights: ${body.slice(0, 80)}`);
  } catch (e) {
    results.push({ test: 'Insights dashboard', pass: false, detail: e.message });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 6: History page
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 6: Transaction history...');
  try {
    await seedUser();
    await go('/history');
    const body = await page.textContent('body');
    const hasHistory = /history|transaction|sent|received|amount|date|status/i.test(body);
    results.push({ test: 'History page renders', pass: hasHistory, detail: body.slice(0, 80) });
    console.log(`  ${hasHistory ? '✅' : '⚠️'} History: ${body.slice(0, 80)}`);
  } catch (e) {
    results.push({ test: 'History page renders', pass: false, detail: e.message });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 7: Claim page (public)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 7: Claim page (public)...');
  try {
    await go('/claim');
    const body = await page.textContent('body');
    const hasClaim = /claim|recipient|bank|account|withdraw|magic|enter|link/i.test(body);
    results.push({ test: 'Claim page renders', pass: hasClaim, detail: body.slice(0, 80) });
    console.log(`  ${hasClaim ? '✅' : '⚠️'} Claim: ${body.slice(0, 80)}`);
  } catch (e) {
    results.push({ test: 'Claim page renders', pass: false, detail: e.message });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 8: Profile page
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 8: Profile page...');
  try {
    await seedUser();
    await go('/profile');
    const body = await page.textContent('body');
    const hasProfile = /profile|wallet|public.*key|bank|stellar|emergency|balance/i.test(body);
    results.push({ test: 'Profile page renders', pass: hasProfile, detail: body.slice(0, 80) });
    console.log(`  ${hasProfile ? '✅' : '⚠️'} Profile: ${body.slice(0, 80)}`);
  } catch (e) {
    results.push({ test: 'Profile page renders', pass: false, detail: e.message });
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 9: Console errors
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 9: Console errors...');
  const critical = errors.filter(e =>
    !e.toLowerCase().includes('warning') &&
    !e.includes('DevTools') && !e.includes('favicon') && !e.includes('Download'),
  );
  console.log(`  Critical errors: ${critical.length}`);
  if (critical.length > 0) critical.slice(0, 5).forEach(e => console.log('  -', e.slice(0, 150)));
  results.push({ test: 'No critical console errors', pass: critical.length === 0, detail: `${critical.length} errors` });

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════
  await browser.close();

  console.log('\n========================================');
  console.log('🧪 BLACK BOX TEST RESULTS');
  console.log('========================================');
  let pass = 0, fail = 0;
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.test}`);
    console.log(`     → ${r.detail}`);
    r.pass ? pass++ : fail++;
  }
  console.log(`\n  ${pass} ✅ passed  |  ${fail} ❌ failed  |  ${results.length} total`);
  console.log('========================================\n');

  // Key findings
  const magicLinkPass = results.find(r => r.test === 'Magic Link generates')?.pass;
  console.log('🏆 KEY RESULT:', magicLinkPass ? 'Magic Link flow WORKS on testnet!' : 'Magic Link blocked by testnet latency/error');
  console.log('📝 NOTE: Auth (Firebase sign-up) is skipped in automated test — use manual browser testing for auth.\n');

  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Crashed:', e.message); process.exit(1); });
