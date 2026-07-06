// ─── User Profile ──────────────────────────────────────────────
export interface SavedBank {
  bankName: string; // e.g., "GoPay", "BCA", "OVO"
  accountNumber: string;
  accountHolder?: string; // Full name as registered at the bank
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  stellarPublicKey: string;
  emergencyFundBalanceUSD: number;
  savedLocalBank: SavedBank | null;
  createdAt: string; // ISO timestamp
}

// ─── Magic Claim ───────────────────────────────────────────────
export type ClaimStatus = 'pending' | 'claimed' | 'expired';

export interface MagicClaim {
  claimId: string; // UUID v4
  senderId: string;
  senderPublicKey: string;
  senderName?: string;
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
  totalAmountUSD: number;
  allocatedFamilyUSD: number; // e.g. 70%
  allocatedSavingsUSD: number; // e.g. 30%
  splitRatio: number; // 0–100 (percentage to family)
  isClaimed: boolean;
  claimedByAccountNumber?: string;
  claimedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (7 days)
}

// ─── Transaction ────────────────────────────────────────────────
export type TransactionType = 'sent' | 'received';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountUSD: number;
  counterpartyName: string;
  counterpartyKey?: string;
  description: string;
  status: TransactionStatus;
  timestamp: string; // ISO timestamp
  memo?: string;
}

// ─── App State ─────────────────────────────────────────────────
export interface AppState {
  user: UserProfile | null;
  claims: MagicClaim[];
  transactions: Transaction[];
  pendingClaimId: string | null; // for claim flow
}
