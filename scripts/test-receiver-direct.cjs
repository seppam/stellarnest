/**
 * Test: Does the Withdraw page work when navigating DIRECTLY to it
 * (bypassing the claim page) with a real claim from the full E2E flow?
 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  // Capture all browser console messages
  const browserLogs = [];
  page.on('console', (m) => browserLogs.push(`[${m.type()}] ${m.text()}`));

  // ── Step 1: Go to claim page first to get the app initialized ──────
  console.log('\n1. Init app on claim page...');
  await page.goto(BASE + '/claim/any-placeholder', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000); // let React settle

  // ── Step 2: Inject a real-format claim into localStorage ───────────
  const realClaim = {
    claimId: 'direct-test-claim',
    senderId: 'sender-uid',
    senderPublicKey: 'GDIAGONAL4LJCAGZXRDZSSVHNHLIXFQU5SFGUE4XNVBPTBL27YIRZBUZF',
    senderName: 'Test Sender',
    totalAmountUSD: 100,
    allocatedFamilyUSD: 70,
    allocatedSavingsUSD: 30,
    familyPercent: 70,
    status: 'pending',
    createdAt: new Date().toISOString(),
    firestoreId: '',
  };

  await page.evaluate((claim) => {
    // Save to the same key the app uses
    const KEY = 'stellarnest_claims';
    let claims = [];
    try { claims = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
    claims = claims.filter((c) => c.claimId !== claim.claimId);
    claims.unshift(claim);
    localStorage.setItem(KEY, JSON.stringify(claims));
    console.log('[test] Claim saved:', claim.claimId);
  }, realClaim);

  const afterInject = await page.evaluate(() => ({
    claims: JSON.parse(localStorage.getItem('stellarnest_claims') || '[]').map((c) => c.claimId),
  }));
  console.log('2. localStorage after inject:', JSON.stringify(afterInject));

  // ── Step 3: Navigate directly to Withdraw page ─────────────────────
  console.log('\n3. Navigating directly to Withdraw page...');
  await page.goto(BASE + '/claim/direct-test-claim/withdraw', { waitUntil: 'domcontentloaded' });

  console.log('4. Waiting 8s for e-wallets to render...');
  await page.waitForTimeout(8000);

  const bodyText = await page.locator('body').innerText();
  console.log('5. Page text (first 500 chars):', bodyText.substring(0, 500).replace(/\n/g, ' | '));

  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean)
  );
  console.log('6. Buttons:', JSON.stringify(buttons));

  const localAfter = await page.evaluate(() => ({
    claims: JSON.parse(localStorage.getItem('stellarnest_claims') || '[]').map((c) => c.claimId),
  }));
  console.log('7. localStorage at Withdraw:', JSON.stringify(localAfter));

  console.log('\n8. Browser logs:');
  browserLogs.forEach((l) => console.log(' ', l));

  await browser.close();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
