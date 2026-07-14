/**
 * User Service — StellarNest
 */

import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getUser, saveUser, clearUser } from '../storage';
import type { SavedBank } from '../../types';

const USERS_COL = 'users';

// ─── Types ───────────────────────────────────────────────────
export interface CloudUserProfile {
  uid: string;
  email: string;
  name: string;
  stellarPublicKey?: string;
  /** Base64 AES-GCM encrypted Stellar secret, decrypted with Firebase UID */
  encryptedSecret?: string;
  emergencyFundBalanceUSD?: number;
  savedLocalBank?: SavedBank;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ─── Cache ───────────────────────────────────────────────────
export function cacheUser(profile: CloudUserProfile): void {
  saveUser({
    id: profile.uid,
    name: profile.name,
    email: profile.email,
    stellarPublicKey: profile.stellarPublicKey ?? '',
    emergencyFundBalanceUSD: profile.emergencyFundBalanceUSD ?? 0,
    savedLocalBank: profile.savedLocalBank ?? null,
    createdAt: profile.createdAt instanceof Date
      ? profile.createdAt.toISOString()
      : (profile as any).createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  });
}

export function getCachedUser() {
  return getUser();
}

export function clearCachedUser() {
  clearUser();
}

// ─── Firestore CRUD ─────────────────────────────────────────

export async function fetchUserProfile(uid: string): Promise<CloudUserProfile | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COL, uid));
    if (!snap.exists()) return null;
    cacheUser(snap.data() as CloudUserProfile);
    return snap.data() as CloudUserProfile;
  } catch (err) {
    console.warn('[UserService] fetchUserProfile failed:', err);
    return null;
  }
}

export async function createUserProfile(
  uid: string,
  data: { email: string; name: string; stellarPublicKey?: string }
): Promise<void> {
  const profile = {
    uid,
    email: data.email,
    name: data.name,
    stellarPublicKey: data.stellarPublicKey ?? '',
    emergencyFundBalanceUSD: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, USERS_COL, uid), profile);
    cacheUser({ ...profile, createdAt: new Date(), updatedAt: new Date() });
  } catch (err) {
    console.warn('[UserService] createUserProfile failed (non-critical):', err);
    // Still cache locally so the user can use the app
    cacheUser({ ...profile, createdAt: new Date(), updatedAt: new Date() });
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<CloudUserProfile, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    // Use setDoc with merge=true so it works for both new users (first sign-up)
    // and existing users (profile updates) — avoids "No document to update" errors
    await setDoc(doc(db, USERS_COL, uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[UserService] updateUserProfile failed (non-critical):', err);
  }

  // Always update local cache
  const cached = getCachedUser();
  if (cached) {
    saveUser({ ...cached, ...updates } as any);
  }
}

/**
 * Store the encrypted Stellar secret in Firestore under the user's document.
 * The secret is encrypted client-side with AES-GCM before being stored.
 * Only call this immediately after creating a new wallet (sign-up).
 */
export async function storeEncryptedSecret(
  uid: string,
  encryptedSecret: string
): Promise<void> {
  try {
    // Use setDoc with merge=true so it works for brand-new users with no Firestore document yet
    await setDoc(doc(db, USERS_COL, uid), {
      encryptedSecret,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('[UserService] storeEncryptedSecret failed:', err);
    throw err;
  }
}

/**
 * Retrieve the encrypted Stellar secret from Firestore.
 * Returns the base64 encrypted blob, or null if not found.
 */
export async function getEncryptedSecret(uid: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COL, uid));
    if (!snap.exists()) return null;
    return (snap.data() as CloudUserProfile).encryptedSecret ?? null;
  } catch (err) {
    console.warn('[UserService] getEncryptedSecret failed:', err);
    return null;
  }
}
