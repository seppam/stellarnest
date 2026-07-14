import type { UserProfile, MagicClaim, Transaction } from '../types';

const KEYS = {
  USER: 'stellarnest_user',
  CLAIMS: 'stellarnest_claims',
  TXS: 'stellarnest_transactions',
} as const;

// ─── Generic helpers ───────────────────────────────────────────
function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── User ──────────────────────────────────────────────────────
export function getUser(): UserProfile | null {
  return get<UserProfile | null>(KEYS.USER, null);
}

export function saveUser(user: UserProfile): void {
  set(KEYS.USER, user);
}

export function clearUser(): void {
  localStorage.removeItem(KEYS.USER);
}

export function updateUser(updates: Partial<UserProfile>): UserProfile | null {
  const current = getUser();
  if (!current) return null;
  const updated = { ...current, ...updates };
  saveUser(updated);
  return updated;
}

// ─── Claims ────────────────────────────────────────────────────
export function getClaims(): MagicClaim[] {
  return get<MagicClaim[]>(KEYS.CLAIMS, []);
}

export function getClaimById(claimId: string): MagicClaim | undefined {
  return getClaims().find((c) => c.claimId === claimId);
}

export function saveClaim(claim: MagicClaim): void {
  const claims = getClaims();
  const idx = claims.findIndex((c) => c.claimId === claim.claimId);
  if (idx >= 0) {
    claims[idx] = claim;
  } else {
    claims.unshift(claim);
  }
  set(KEYS.CLAIMS, claims);
}

export function getClaimsForUser(userId: string): MagicClaim[] {
  return getClaims().filter((c) => c.senderId === userId);
}

export function getReceivedClaims(): MagicClaim[] {
  return getClaims().filter((c) => c.isClaimed);
}

// ─── Transactions ─────────────────────────────────────────────
export function getTransactions(): Transaction[] {
  return get<Transaction[]>(KEYS.TXS, []);
}

export function addTransaction(tx: Transaction): void {
  const txs = getTransactions();
  txs.unshift(tx);
  set(KEYS.TXS, txs);
}

export function getTransactionsForUser(): Transaction[] {
  return getTransactions();
}

// ─── Seed demo data ────────────────────────────────────────────
export function seedDemoData(): void {
  const existing = getTransactions();

  // Always create a demo user profile if none exists
  if (!getUser()) {
    const demoUser: UserProfile = {
      id: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX',
      name: 'Asep Demo',
      email: 'asep@demo.test',
      stellarPublicKey: 'GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX',
      emergencyFundBalanceUSD: 500, // starts with $500 in emergency fund
      savedLocalBank: null,
      createdAt: new Date().toISOString(),
    };
    saveUser(demoUser);
  }

  // Only seed transactions if none exist yet
  if (existing.length > 0) return;

  const txs: Transaction[] = [
    {
      id: 'tx-1',
      type: 'received',
      amountUSD: 850,
      counterpartyName: 'Upwork Client',
      description: 'Project milestone #3',
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tx-2',
      type: 'sent',
      amountUSD: 400,
      counterpartyName: 'Mom — Indonesia',
      description: 'Monthly support',
      status: 'completed',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tx-3',
      type: 'received',
      amountUSD: 1200,
      counterpartyName: 'Fiverr Client',
      description: 'Logo design package',
      status: 'completed',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tx-4',
      type: 'sent',
      amountUSD: 250,
      counterpartyName: 'Brother',
      description: 'School fee help',
      status: 'completed',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tx-5',
      type: 'received',
      amountUSD: 600,
      counterpartyName: 'Direct Client',
      description: 'Website maintenance',
      status: 'completed',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  set(KEYS.TXS, txs);

  // Seed a pending incoming claim for demo
  const claim: MagicClaim = {
    claimId: 'pending-demo-001',
    senderId: 'demo-other',
    senderPublicKey: 'GA2DEMOSENDERXXXXXXXXXXXXXXXXXXXXXX',
    totalAmountUSD: 250,
    allocatedFamilyUSD: 175,
    allocatedSavingsUSD: 75,
    splitRatio: 70,
    recipientCountry: 'ID',
    isClaimed: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
  };
  saveClaim(claim);
}
