/**
 * Claim Service — StellarNest
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getClaimById, saveClaim, getClaims } from '../storage';

const CLAIMS_COL = 'claims';

// ─── Types ───────────────────────────────────────────────────
export interface CloudClaim {
  claimId: string;
  firestoreId?: string;
  senderUid: string;
  senderPublicKey: string;
  senderName?: string;
  totalAmountUSD: number;
  allocatedFamilyUSD: number;
  allocatedSavingsUSD: number;
  splitRatio: number;
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
  status: 'pending' | 'claimed' | 'expired';
  claimedByUid?: string;
  claimedByName?: string;
  claimedAt?: string;
  createdAt: string;
  expiresAt: string;
}

function toDateStr(val: any): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  if (val?.toDate) return val.toDate().toISOString();
  return String(val ?? '');
}

function mapDoc(d: any): CloudClaim {
  return {
    ...d.data(),
    firestoreId: d.id,
    createdAt: toDateStr(d.data().createdAt),
    expiresAt: toDateStr(d.data().expiresAt),
    claimedAt: d.data().claimedAt ? toDateStr(d.data().claimedAt) : undefined,
  };
}

// ─── Create ──────────────────────────────────────────────────
export async function createClaim(
  data: Omit<CloudClaim, 'status' | 'createdAt' | 'expiresAt'>
): Promise<CloudClaim> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const cloudClaim = {
    ...data,
    status: 'pending' as const,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  };

  let firestoreId = '';
  try {
    const ref = await addDoc(collection(db, CLAIMS_COL), cloudClaim);
    firestoreId = ref.id;
  } catch (err) {
    console.warn('[ClaimService] Firestore save failed (non-critical):', err);
  }

  const localClaim = {
    ...data,
    firestoreId,
    status: 'pending' as const,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  saveClaim(localClaim as any);
  return localClaim;
}

// ─── Get by claimId ─────────────────────────────────────────
export async function getClaim(claimId: string): Promise<CloudClaim | null> {
  try {
    const q = query(
      collection(db, CLAIMS_COL),
      where('claimId', '==', claimId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return mapDoc(snap.docs[0]);
  } catch (err) {
    console.warn('[ClaimService] Firestore lookup failed, using local:', err);
  }

  // Fallback to localStorage
  const local = getClaimById(claimId);
  return local ? (local as unknown as CloudClaim) : null;
}

// ─── Claim funds ─────────────────────────────────────────────
export async function claimFunds(
  firestoreId: string,
  claimerUid: string,
  claimerName: string,
  bankAccount: string,
  bankName: string
): Promise<void> {
  try {
    const claimRef = doc(db, CLAIMS_COL, firestoreId);
    await runTransaction(db, async (transaction) => {
      const claimDoc = await transaction.get(claimRef);
      if (!claimDoc.exists()) {
        throw new Error('Claim does not exist');
      }
      const data = claimDoc.data();
      if (data.status === 'claimed') {
        throw new Error('This claim has already been claimed');
      }
      const expiresAtDate = data.expiresAt instanceof Timestamp 
        ? data.expiresAt.toDate() 
        : new Date(data.expiresAt);
      if (data.status === 'expired' || expiresAtDate < new Date()) {
        throw new Error('This claim has expired');
      }
      transaction.update(claimRef, {
        status: 'claimed',
        claimedByUid: claimerUid,
        claimedByName: claimerName,
        claimedByBank: bankAccount,
        claimedByBankName: bankName,
        claimedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.error('[ClaimService] claimFunds failed:', err);
    throw err;
  }
}

// ─── User's claims ───────────────────────────────────────────
export async function getUserClaims(senderUid: string): Promise<CloudClaim[]> {
  try {
    const q = query(
      collection(db, CLAIMS_COL),
      where('senderUid', '==', senderUid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(mapDoc);
  } catch (err) {
    console.warn('[ClaimService] Firestore failed, using local cache:', err);
    return getClaims().map((c) => c as unknown as CloudClaim);
  }
}
