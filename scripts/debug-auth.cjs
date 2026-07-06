/**
 * StellarNest — Debug auth failure (password fix)
 */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5174';

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const errors = [];
  const logs = [];
  page.on('console', (msg) => {
    const txt = msg.text();
    if (msg.type() === 'error') { errors.push(txt); console.log('[ERROR]', txt.slice(0, 200)); }
    if (msg.type() === 'log') {
      logs.push(txt);
      if (txt.includes('AppContext') || txt.includes('stellar') || txt.includes('Firebase') || txt.includes('auth') || txt.includes('Creating')) {
        console.log('[LOG]', txt.slice(0, 150));
      }
    }
  });
  page.on('pageerror', (err) => { console.log('[PAGEERROR]', err.message); errors.push(`PAGEERROR: ${err.message}`); });

  const apiCalls = [];
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('firestore') || url.includes('firebase') || url.includes('stellar') || url.includes('identitytoolkit') || url.includes('horizon')) {
      apiCalls.push(`${res.status()} ${url.slice(0, 80)}`);
    }
  });

  console.log('Step 1: Landing → Auth');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);

  const btns = await page.$$('button');
  for (const btn of btns) {
    const txt = await btn.textContent().catch(() => '');
    if (/get started|start/i.test(txt)) { await btn.click(); break; }
  }
  await sleep(2000);
  console.log('URL:', page.url());

  // ── Debug: show all inputs ──
  const allInputs = await page.$$('input');
  console.log('All inputs found:', allInputs.length);
  for (const input of allInputs) {
    const ph = await input.getAttribute('placeholder').catch(() => '');
    const type = await input.getAttribute('type').catch(() => '');
    const value = await input.inputValue().catch(() => '');
    console.log(`  type=${type} placeholder="${ph}" value="${value}"`);
  }

  // Fill form (NAME + EMAIL + PASSWORD)
  for (const input of allInputs) {
    const ph = (await input.getAttribute('placeholder').catch(() => '')).toLowerCase();
    const type = await input.getAttribute('type').catch(() => '');
    if (ph.includes('name')) { await input.fill('Asep Debug'); console.log('✅ name filled'); }
    else if (type === 'email' || ph.includes('email')) { await input.fill('asep.debug@test.com'); console.log('✅ email filled'); }
    else if (type === 'password' || ph.includes('password') || ph.includes('pass')) { await input.fill('TestPass123!'); console.log('✅ password filled'); }
  }

  await sleep(300);

  // Click Create Account
  const authBtns = await page.$$('button');
  for (const btn of authBtns) {
    const txt = await btn.textContent().catch(() => '');
    if (/create|sign up|register/i.test(txt)) { await btn.scrollIntoViewIfNeeded(); await btn.click(); console.log('✅ Clicked:', txt.trim()); break; }
  }

  // Wait 40s for Firebase + testnet
  console.log('\nWaiting 40s for auth...');
  let navigated = false;
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const url = page.url();
    const body = await page.textContent('body').catch(() => '').then(t => t.slice(0, 60));
    const newErrors = errors.length;
    console.log(`${i+1}s | ${url} | errors:${newErrors} | ${body}`);
    if (!url.includes('/auth') && body.length > 300) { navigated = true; console.log('✅ Navigated away from /auth!'); break; }
  }

  console.log('\n--- Errors:', errors.length, '---');
  errors.forEach(e => console.log('  ERROR:', e.slice(0, 200)));
  console.log('\n--- API calls:', apiCalls.length, '---');
  apiCalls.forEach(a => console.log(' ', a));

  await browser.close();
  console.log('\nFinal result: navigated =', navigated);
}

run().catch(e => console.error('Crashed:', e.message));
