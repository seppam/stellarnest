/**
 * Minimal test: Receiver claim + withdraw flow
 * Run: node scripts/test-receiver-minimal.cjs
 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  // Capture all console messages
  page.on('console', (m) => console.log('  [browser]', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('  [PAGEERROR]', e.message));

  // Create a fake claim directly in localStorage before navigation
  const fakeClaim = {
    claimId: 'test-claim-001',
    senderId: 'sender-test',
    senderPublicKey: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    senderName: 'Test Sender',
    totalAmountUSD: 100,
    allocatedFamilyUSD: 70,
    allocatedSavingsUSD: 30,
    familyPercent: 70,
    status: 'pending',
    createdAt: new Date().toISOString(),
    firestoreId: '',
  };

  // Inject claim BEFORE navigation (runs before page JS)
  await page.addInitScript((claim) => {
    // Save to localStorage via the same storage key the app uses
    const KEY = 'stellarnest_claims';
    let claims = [];
    try { claims = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
    // Remove existing test claim to avoid duplicates
    claims = claims.filter((c) => c.claimId !== claim.claimId);
    claims.unshift(claim);
    localStorage.setItem(KEY, JSON.stringify(claims));
    console.log('[init] Claim injected into localStorage:', claim.claimId);
  }, fakeClaim);

  // Also inject a fake user so the app doesn't redirect to auth
  await page.addInitScript((user) => {
    localStorage.setItem('stellarnest_user', JSON.stringify(user));
  }, {
    id: 'receiver-test-uid',
    name: 'Bayu Receiver',
    stellarPublicKey: 'GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    emergencyFundBalanceUSD: 0,
    savedLocalBank: { bankName: 'DANA', accountNumber: '085678901234', accountHolder: 'Bayu Receiver', country: 'ID' },
    createdAt: new Date().toISOString(),
  });

  console.log('\n1. Navigating directly to Withdraw page...');
  await page.goto(BASE + '/claim/test-claim-001/withdraw', { waitUntil: 'domcontentloaded' });

  console.log('2. Waiting 8s for page to load (Firestore timeout + render)...');
  await page.waitForTimeout(8000);

  const bodyText = await page.locator('body').innerText();
  console.log('3. Page text (first 400 chars):', bodyText.substring(0, 400).replace(/\n/g, ' | '));

  const allButtons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map((b) => ({
      text: b.innerText.trim(),
      visible: b.offsetParent !== null,
    }))
  );
  console.log('4. All buttons:', JSON.stringify(allButtons));

  const localStorageState = await page.evaluate(() => ({
    claims: JSON.parse(localStorage.getItem('stellarnest_claims') || '[]').map((c) => c.claimId),
    user: JSON.parse(localStorage.getItem('stellarnest_user') || '{}').name,
  }));
  console.log('5. localStorage state:', JSON.stringify(localStorageState));

  await browser.close();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
