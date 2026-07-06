/**
 * StellarNest — Routing debug
 */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5174';

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const DEMO_USER = {
    id: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX',
    name: 'Asep Demo',
    email: 'asep@demo.test',
    stellarPublicKey: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX',
    emergencyFundBalanceUSD: 500,
    savedLocalBank: null,
    createdAt: new Date().toISOString(),
  };

  async function seedAndReload(path) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate((u) => localStorage.setItem('stellarnest_user', JSON.stringify(u)), [DEMO_USER]);
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    const url = page.url();
    const body = await page.textContent('body');
    console.log(`\n  → ${path}`);
    console.log(`  URL: ${url}`);
    console.log(`  Body: ${body.slice(0, 100)}`);
  }

  console.log('Testing routing with demo user...');
  await seedAndReload('/');       // Landing
  await seedAndReload('/dashboard'); // Should show Dashboard
  await seedAndReload('/send');   // Should show Send form
  await seedAndReload('/insights'); // Should show Insights
  await seedAndReload('/profile'); // Should show Profile

  await browser.close();
}

run().catch(console.error);
