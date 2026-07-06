/**
 * Transaction Service — StellarNest
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getTransactions, addTransaction } from '../storage';

const TXS_COL = 'transactions';

// ─── Types ───────────────────────────────────────────────────
export interface CloudTransaction {
  txId: string;
  userUid: string;
  type: 'sent' | 'received' | 'deposit' | 'savings';
  amountUSD: number;
  counterpartyName: string;
  counterpartyAccount?: string;
  description: string;
  memo?: string;
  status: 'completed' | 'pending' | 'failed';
  claimId?: string;
  timestamp: string;
}

function toDateStr(val: any): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  if (val?.toDate) return val.toDate().toISOString();
  return String(val ?? '');
}

function mapDoc(d: any): CloudTransaction {
  const data = d.data();
  return {
    ...data,
    timestamp: toDateStr(data.timestamp),
  };
}

// ─── Save ───────────────────────────────────────────────────
export async function saveTransaction(
  tx: Omit<CloudTransaction, 'timestamp'>
): Promise<void> {
  try {
    await addDoc(collection(db, TXS_COL), {
      ...tx,
      timestamp: Timestamp.now(),
    });
  } catch (err) {
    console.warn('[TxService] Firestore save failed, using local only:', err);
  }
  // Always save locally
  addTransaction(tx as any);
}

// ─── Get user's transactions ────────────────────────────────
export async function getUserTransactions(userUid: string): Promise<CloudTransaction[]> {
  try {
    const q = query(
      collection(db, TXS_COL),
      where('userUid', '==', userUid),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map(mapDoc);
  } catch (err) {
    console.warn('[TxService] Firestore failed, using local:', err);
    return getTransactions() as unknown as CloudTransaction[];
  }
}
