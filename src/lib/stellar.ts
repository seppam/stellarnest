/**
 * Stellar Service — StellarNest
 *
 * MOCK MODE (default=true):
 *   All Stellar operations are simulated. No real blockchain calls.
 *   Safe for hackathon demo — no API keys, no rate limits.
 *
 * LIVE MODE (MOCK_MODE=false):
 *   Set VITE_STELLAR_NETWORK=testnet
 *   Uses real @stellar/stellar-sdk on Stellar Testnet.
 *   Requires network access to horizon-testnet.stellar.org
 */

import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';
import { Horizon } from '@stellar/stellar-sdk';

// ─── Network Config ─────────────────────────────────────────────
export const NETWORK = Networks.TESTNET;
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';

// Testnet USDC issuer (Circle testnet)
// Note: Using a placeholder — real Circle testnet USDC requires a valid issuer key
export const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
export let USDC_ASSET: Asset;
try {
  USDC_ASSET = new Asset('USDC', USDC_ISSUER);
} catch {
  // Fallback: use XLM (native asset) if USDC issuer is invalid
  USDC_ASSET = Asset.native();
}

// ─── Mock Mode ─────────────────────────────────────────────────
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false';

// ─── Types ──────────────────────────────────────────────────────
export interface CreateAccountResult {
  publicKey: string;
  secret: string;
  funded: boolean;
}

export interface SendResult {
  success: boolean;
  txHash?: string;
  error?: string;
  /** Whether the Stellar network confirmed this transaction as successful */
  successful?: boolean;
}

// ─── UUID ──────────────────────────────────────────────────────
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mockTxHash(): string {
  return `MOCK_${uuid().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}

// ─── Create Testnet Account ─────────────────────────────────────
export async function createTestnetAccount(): Promise<CreateAccountResult> {
  if (MOCK_MODE) {
    const keypair = Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secret: keypair.secret(),
      funded: true,
    };
  }

  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();

  try {
    await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
    return { publicKey, secret: keypair.secret(), funded: true };
  } catch {
    return { publicKey, secret: keypair.secret(), funded: false };
  }
}

// ─── Fund Account via Friendbot ─────────────────────────────────
export async function fundAccount(publicKey: string): Promise<boolean> {
  if (MOCK_MODE) return true;

  try {
    await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
    return true;
  } catch {
    return false;
  }
}

// ─── Establish USDC Trustline ───────────────────────────────────
export async function establishUSDCTrust(publicKey: string, secret: string): Promise<boolean> {
  if (MOCK_MODE) return true;

  try {
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    const keypair = Keypair.fromSecret(secret);

    const tx = new TransactionBuilder(account, {
      networkPassphrase: NETWORK_PASSPHRASE,
      fee: '100',
    })
      .addOperation(
        Operation.changeTrust({
          asset: USDC_ASSET,
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    await server.submitTransaction(tx);
    return true;
  } catch (err) {
    console.warn('Trustline error (may already exist):', err);
    return false;
  }
}

// ─── Send USDC Payment ──────────────────────────────────────────
export async function sendUSDC(
  _senderSecret: string,
  _recipientPublicKey: string,
  amount: string,
  _memoText?: string
): Promise<SendResult> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    return { success: true, successful: true, txHash: mockTxHash() };
  }

  try {
    const server = new Horizon.Server(HORIZON_URL);
    const sender = Keypair.fromSecret(_senderSecret);
    const account = await server.loadAccount(sender.publicKey());

    const tx = new TransactionBuilder(account, {
      networkPassphrase: NETWORK_PASSPHRASE,
      fee: '100',
    })
      .addMemo(_memoText ? Memo.text(_memoText.slice(0, 28)) : Memo.none())
      .addOperation(
        Operation.payment({
          destination: _recipientPublicKey,
          asset: USDC_ASSET,
          amount,
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(sender);
    const result = (await server.submitTransaction(tx)) as unknown as Record<string, unknown>;
    const successful = (result as Record<string, unknown>).successful as boolean ?? true;
    return { success: true, successful, txHash: String(result.id ?? result.hash ?? Date.now()) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, successful: false, error: msg };
  }
}

// ─── Mint Test USDC (Faucet) ───────────────────────────────────
export async function mintTestUSDC(
  _recipientPublicKey: string,
  _amount: string
): Promise<SendResult> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true, successful: true, txHash: mockTxHash() };
  }
  const TREASURY_SECRET = import.meta.env.VITE_STELLAR_TREASURY_SECRET || 'SDEXDEMOTREASURYXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  return sendUSDC(TREASURY_SECRET, _recipientPublicKey, _amount, 'FAUCET');
}

// ─── Query Transactions from Horizon ──────────────────────────
export async function getAccountTransactions(publicKey: string): Promise<unknown[]> {
  if (MOCK_MODE) return [];

  try {
    const server = new Horizon.Server(HORIZON_URL);
    const txs = await server.transactions().forAccount(publicKey).call();
    return txs.records;
  } catch {
    return [];
  }
}

// ─── Formatting Helpers ─────────────────────────────────────────
export function formatPublicKey(key: string): string {
  if (!key || key.length < 12) return key;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export function formatAmount(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function generateClaimId(): string {
  return `claim_${Date.now()}_${uuid().replace(/-/g, '').slice(0, 8)}`;
}
