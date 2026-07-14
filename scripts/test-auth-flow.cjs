const { chromium } = require('playwright');
const BASE = 'http://localhost:5173';
const DEMO_USER = {
  id: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX', name: 'Asep Demo', email: 'asep@demo.test',
  stellarPublicKey: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX',
  emergencyFundBalanceUSD: 500, savedLocalBank: null,
  createdAt: new Date().toISOString(),
};
const results = [];
async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // ── Fresh context: no session, no localStorage ─────────────────
  async function freshPage() {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    return { page, ctx };
  }

  // TEST 1: Landing (no session) → renders landing content
  console.log('\n📋 TEST 1: Landing page renders (no session)...');
  const { page: p1, ctx: ctx1 } = await freshPage();
  await p1.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 15000 });
  await p1.waitForTimeout(2000);
  const url1 = p1.url(), body1 = await p1.textContent('body');
  const landingContent = /send.*money|borderless|home|instant.*settlement/i.test(body1);
  console.log(`  URL: ${url1} | Landing content: ${landingContent}`);
  results.push({ test: 'Landing renders (no session)', pass: url1 === BASE + '/' && landingContent, detail: url1 });
  await ctx1.close();

  // TEST 2: Landing Get Started → /dashboard?demo=1 (demo flow)
  console.log('\n📋 TEST 2: Landing → Get Started → demo dashboard...');
  const { page: p2, ctx: ctx2 } = await freshPage();
  await p2.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 15000 });
  await p2.waitForTimeout(1000);
  const btns = await p2.$$('button');
  let clicked = false;
  for (const btn of btns) {
    const txt = (await btn.textContent().catch(() => '')).trim();
    if (/get.*started/i.test(txt)) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ force: true });
      clicked = true;
      break;
    }
  }
  await p2.waitForTimeout(2000);
  const url2 = p2.url();
  const body2 = await p2.textContent('body');
  const hasDashboard = /hi|total.*balance|send|deposit/i.test(body2);
  console.log(`  Clicked: ${clicked} | URL: ${url2} | Dashboard content: ${hasDashboard}`);
  results.push({ test: 'Get Started → demo dashboard', pass: clicked && /\/dashboard\?demo=1/.test(url2) && hasDashboard, detail: url2 });
  await ctx2.close();

  // TEST 3: /dashboard (no session) → /auth (no demo seed)
  console.log('\n📋 TEST 3: /dashboard (no session) → /auth...');
  const { page: p3, ctx: ctx3 } = await freshPage();
  await p3.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
  await p3.waitForTimeout(2000);
  const url3 = p3.url();
  const body3 = await p3.textContent('body');
  const onAuthPage = /sign.*in|sign.*up|email|password/i.test(body3);
  console.log(`  URL: ${url3} | Auth form shown: ${onAuthPage}`);
  results.push({ test: '/dashboard → /auth (no session)', pass: /\/auth/.test(url3) && onAuthPage, detail: url3 });
  await ctx3.close();

  // TEST 4: /auth (with demo user in localStorage) → /dashboard
  console.log('\n📋 TEST 4: /auth (demo user) → /dashboard...');
  const { page: p4, ctx: ctx4 } = await freshPage();
  await p4.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p4.evaluate((u) => localStorage.setItem('stellarnest_user', JSON.stringify(u)), DEMO_USER);
  await p4.goto(BASE + '/auth', { waitUntil: 'networkidle', timeout: 15000 });
  await p4.waitForTimeout(2000);
  const url4 = p4.url();
  const body4 = await p4.textContent('body');
  const dashContent = /hi|total.*balance/i.test(body4);
  console.log(`  URL: ${url4} | Dashboard content: ${dashContent}`);
  results.push({ test: '/auth (demo user) → /dashboard', pass: /\/dashboard/.test(url4) && dashContent, detail: url4 });
  await ctx4.close();

  // TEST 5: / (demo user) → /dashboard
  console.log('\n📋 TEST 5: Landing (demo user) → /dashboard...');
  const { page: p5, ctx: ctx5 } = await freshPage();
  await p5.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p5.evaluate((u) => localStorage.setItem('stellarnest_user', JSON.stringify(u)), DEMO_USER);
  await p5.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 15000 });
  await p5.waitForTimeout(2000);
  const url5 = p5.url();
  const body5 = await p5.textContent('body');
  const dash5 = /hi|total.*balance/i.test(body5);
  console.log(`  URL: ${url5} | Dashboard content: ${dash5}`);
  results.push({ test: 'Landing (demo user) → /dashboard', pass: /\/dashboard/.test(url5) && dash5, detail: url5 });
  await ctx5.close();

  await browser.close();

  console.log('\n========================================');
  console.log('🧪 AUTH FLOW TEST RESULTS');
  console.log('========================================');
  let pass = 0, fail = 0;
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.test}`);
    console.log(`     → ${r.detail}`);
    r.pass ? pass++ : fail++;
  }
  console.log(`\n  ${pass} ✅ passed  |  ${fail} ❌ failed  |  ${results.length} total`);
  console.log('========================================\n');
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Crashed:', e.message); process.exit(1); });
