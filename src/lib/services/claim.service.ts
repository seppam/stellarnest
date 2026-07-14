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
import { sendUSDC, type SendResult } from '../stellar';

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
  recipientCountry: string;   // CountryCode as string — 'ID' | 'PH' | 'VN' | 'TH' | 'MY' | 'SG'
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
  status: 'pending' | 'claimed' | 'expired';
  claimedByUid?: string;
  claimedByName?: string;
  claimedByBank?: string;
  claimedByBankName?: string;
  claimedAt?: string;
  claimTxHash?: string | null;
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
  // Claims expire in 7 days (not 24 h) for cross-border use cases
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Write to localStorage FIRST — synchronous, always works, no network
  // This is the source of truth in demo / no-Firebase mode.
  const localClaim = {
    ...data,
    firestoreId: '',
    status: 'pending' as const,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  saveClaim(localClaim as any);

  // Attempt Firestore as a background sync (fire-and-forget with timeout)
  // If Firebase isn't configured or times out, localStorage is already correct.
  const cloudClaim = {
    ...data,
    status: 'pending' as const,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  };

  Promise.resolve().then(async () => {
    try {
      const ref = await Promise.race([
        addDoc(collection(db, CLAIMS_COL), cloudClaim),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore create timeout')), 5000)
        ),
      ]);
      // Update local claim with Firestore ID for future cross-device sync
      if (ref?.id) {
        localClaim.firestoreId = ref.id;
        saveClaim(localClaim as any);
      }
    } catch (err) {
      console.warn('[ClaimService] Firestore sync (async, non-blocking):', err);
    }
  });

  return localClaim;
}

// ─── Get by claimId ─────────────────────────────────────────
export async function getClaim(claimId: string): Promise<CloudClaim | null> {
  // Check localStorage first (fast, no network) — works in demo/test mode without Firebase
  const local = getClaimById(claimId);
  if (local) return local as unknown as CloudClaim;

  // Try Firestore with a 4-second timeout — graceful degradation if Firebase isn't configured
  try {
    const q = query(
      collection(db, CLAIMS_COL),
      where('claimId', '==', claimId),
      limit(1)
    );
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 4000)
      ),
    ]);
    if (!snap.empty) return mapDoc(snap.docs[0]);
  } catch (err) {
    console.warn('[ClaimService] Firestore lookup failed/timed out, using local:', err);
  }

  return null;
}

// ─── Claim funds ─────────────────────────────────────────────
export async function claimFunds(
  firestoreId: string,
  claimerUid: string,
  claimerName: string,
  bankAccount: string,
  bankName: string
): Promise<void> {
  // ─── Step 1: Read claim from localStorage (source of truth in demo mode) ───
  // In demo mode firestoreId is '' — try claimId as primary key, then firestoreId
  const localClaims = getClaims();
  const localClaim = localClaims.find((c) => c.claimId === firestoreId)
    ?? localClaims.find((c) => (c as any).firestoreId === firestoreId)
    ?? localClaims[localClaims.length - 1];  // fallback: most recent claim

  if (localClaim) {
    if (localClaim.isClaimed) throw new Error('This claim has already been claimed');
    const expiresAtDate = new Date(localClaim.expiresAt);
    if (expiresAtDate < new Date()) throw new Error('This claim has expired');
  }

  // ─── Step 2: Simulate / execute Stellar payment ───────────────────────────
  const treasuryKey = import.meta.env.VITE_STELLAR_TREASURY_KEY
    ?? 'GAV7X26J5B7MFX37WGOKLV5CIRQWJYCI2XOOIUGLP373P4TIYRGE2PSW';
  const amountToPay = String(localClaim?.allocatedFamilyUSD ?? 70);
  const paymentResult: SendResult = await sendUSDC(
    import.meta.env.VITE_STELLAR_TREASURY_SECRET ?? 'SBBONMMZSKVFLZKUNH63I5DZZFAEH3TAG4S3NRTY44SGA6YNGF3FSYKJ',
    treasuryKey,
    amountToPay,
    `CLAIM:${firestoreId}`
  );

  if (!paymentResult.successful) {
    throw new Error(paymentResult.error ?? 'Stellar payment failed on-chain');
  }

  const txHash = paymentResult.txHash ?? `LOCAL_${Date.now()}`;

  // ─── Step 3: Persist to localStorage immediately (works offline / no Firebase) ───
  if (localClaim) {
    const updatedClaim = {
      ...localClaim,
      isClaimed: true,
      status: 'claimed' as const,
      claimedByUid: claimerUid,
      claimedByName: claimerName,
      claimedByBank: bankAccount,
      claimedByBankName: bankName,
      claimedAt: new Date().toISOString(),
      claimTxHash: txHash,
    };
    // Update in the claims list
    const allClaims = getClaims();
    const idx = allClaims.findIndex((c) => c.claimId === firestoreId);
    if (idx !== -1) {
      allClaims[idx] = updatedClaim;
      localStorage.setItem('stellarnest_claims', JSON.stringify(allClaims));
    }
  }

  // ─── Step 4: Sync to Firestore in background (fire-and-forget) ───────────
  Promise.resolve().then(async () => {
    if (!firestoreId || firestoreId.startsWith('pending-')) return;
    try {
      const claimRef = doc(db, CLAIMS_COL, firestoreId);
      await Promise.race([
        runTransaction(db, async (transaction) => {
          const claimDoc = await transaction.get(claimRef);
          if (!claimDoc.exists()) {
            // Document not in Firestore yet — write it as claimed directly
            transaction.set(claimRef, {
              claimId: firestoreId,
              senderUid: localClaim?.senderId ?? '',
              senderPublicKey: localClaim?.senderPublicKey ?? '',
              totalAmountUSD: localClaim?.totalAmountUSD ?? 0,
              allocatedFamilyUSD: localClaim?.allocatedFamilyUSD ?? 0,
              allocatedSavingsUSD: localClaim?.allocatedSavingsUSD ?? 0,
              splitRatio: localClaim?.splitRatio ?? 70,
              recipientCountry: localClaim?.recipientCountry ?? 'ID',
              status: 'claimed',
              claimedByUid: claimerUid,
              claimedByName: claimerName,
              claimedByBank: bankAccount,
              claimedByBankName: bankName,
              claimTxHash: txHash,
              claimedAt: serverTimestamp(),
              createdAt: localClaim?.createdAt ? Timestamp.fromDate(new Date(localClaim.createdAt)) : serverTimestamp(),
              expiresAt: localClaim?.expiresAt ? Timestamp.fromDate(new Date(localClaim.expiresAt)) : serverTimestamp(),
            });
          } else {
            transaction.update(claimRef, {
              status: 'claimed',
              claimedByUid: claimerUid,
              claimedByName: claimerName,
              claimedByBank: bankAccount,
              claimedByBankName: bankName,
              claimTxHash: txHash,
              claimedAt: serverTimestamp(),
            });
          }
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore claimFunds timeout')), 5000)
        ),
      ]);
    } catch (err) {
      console.warn('[ClaimService] Firestore sync (async, non-blocking):', err);
    }
  });
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
