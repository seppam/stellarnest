/**
 * StellarNest Treasury Setup Script
 * ─────────────────────────────────
 * Run ONCE to set up a funded testnet treasury account.
 *
 * What it does:
 * 1. Generates a new Keypair (treasury account)
 * 2. Funds it with 10,000 XLM via Friendbot (testnet faucet)
 * 3. Establishes a USDC trustline (so it can hold/mint USDC)
 * 4. Prints the secret key — ADD IT TO .env.local as VITE_STELLAR_TREASURY_SECRET
 *
 * Usage:
 *   npx tsx scripts/setup-treasury.ts
 *   # or: npx ts-node scripts/setup-treasury.ts
 *
 * ⚠️  WARNING: The treasury secret has full control over all USDC in this account.
 *    Only use this for hackathon/demo purposes on TESTNET.
 *    NEVER use on Stellar mainnet.
 */

import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';

// ─── Config ──────────────────────────────────────────────────────
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Testnet USDC issuer (Circle testnet) — same as in stellar.ts
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC_ASSET = new Asset('USDC', USDC_ISSUER);

// ─── Helpers ─────────────────────────────────────────────────────
async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fundViaFriendbot(publicKey: string): Promise<boolean> {
  console.log(`  📡 Calling Friendbot for ${publicKey.slice(0, 8)}...`);
  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ Friendbot error: ${text}`);
      return false;
    }
    const data = await res.json();
    console.log(`  ✅ Account funded! Balance: ${data.balance ?? 'unknown'} XLM`);
    return true;
  } catch (err) {
    console.error(`  ❌ Network error funding account:`, err);
    return false;
  }
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('\n🔑 StellarNest Treasury Setup');
  console.log('=============================\n');

  // Step 1: Generate treasury keypair
  console.log('1. Generating treasury Keypair...');
  const treasuryKeypair = Keypair.random();
  const treasuryPublic = treasuryKeypair.publicKey();
  const treasurySecret = treasuryKeypair.secret();
  console.log(`   Public:  ${treasuryPublic}`);
  console.log(`   Secret:  ${treasurySecret}`);

  // Step 2: Fund via Friendbot
  console.log('\n2. Funding treasury account via Friendbot...');
  const funded = await fundViaFriendbot(treasuryPublic);
  if (!funded) {
    console.error('\n❌ Failed to fund account via Friendbot.');
    console.error('   Note: Each testnet account can only receive XLM once.');
    console.error('   If this account was already funded, you can skip to step 3.');
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>((r) =>
      rl.question('   Continue anyway? (yes/no): ', r)
    );
    rl.close();
    if (answer.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      return;
    }
  }

  // Step 3: Establish USDC trustline
  console.log('\n3. Loading treasury account and establishing USDC trustline...');
  try {
    // Dynamic import of Horizon Server
    const { Horizon } = await import('@stellar/stellar-sdk');
    const server = new Horizon.Server(HORIZON_URL);

    const account = await server.loadAccount(treasuryPublic);
    console.log(`   Account loaded. Seq: ${account.sequenceNumber()}`);

    // Build trustline transaction
    const trustTx = new TransactionBuilder(account, {
      networkPassphrase: NETWORK_PASSPHRASE,
      fee: '100',
    })
      .addOperation(
        Operation.changeTrust({
          asset: USDC_ASSET,
          limit: '10000000', // 10M USDC max
        })
      )
      .setTimeout(30)
      .build();

    trustTx.sign(treasuryKeypair);
    const trustResult = await server.submitTransaction(trustTx);
    console.log(`   ✅ USDC trustline established! Tx: ${trustResult.hash ?? trustResult.id}`);

    // Wait for finality
    await wait(2000);

    // Step 4: Mint test USDC to self (so the treasury can distribute later)
    console.log('\n4. Minting initial test USDC to treasury (self-mint for faucet)...');
    const account2 = await server.loadAccount(treasuryPublic);
    const mintTx = new TransactionBuilder(account2, {
      networkPassphrase: NETWORK_PASSPHRASE,
      fee: '100',
    })
      .addOperation(
        Operation.payment({
          destination: treasuryPublic,
          asset: USDC_ASSET,
          amount: '1000', // 1000 test USDC
        })
      )
      .addMemo(Memo.text('STELLARNEST-FAUCET-INIT'))
      .setTimeout(30)
      .build();

    mintTx.sign(treasuryKeypair);
    const mintResult = await server.submitTransaction(mintTx);
    console.log(`   ✅ Minted 1000 test USDC! Tx: ${mintResult.hash ?? mintResult.id}`);
    console.log(`   Treasury can now act as USDC faucet/distributor.`);

  } catch (err) {
    console.error('\n⚠️  Trustline/mint error:', err);
    console.error('   The account is funded — you may need to wait and retry.');
    console.error('   Or the USDC issuer account may not exist on testnet.');
    console.error('   Fallback: set USDC_ASSET = XLM (native) in stellar.ts');
  }

  // Step 5: Summary
  console.log('\n========================================');
  console.log('✅ Treasury setup complete!');
  console.log('========================================\n');
  console.log('Add this line to your .env.local:');
  console.log(`VITE_STELLAR_TREASURY_SECRET=${treasurySecret}\n`);
  console.log('Then set MOCK_MODE=false in .env.local to go live on testnet.');
  console.log('');
}

main().catch(console.error);
