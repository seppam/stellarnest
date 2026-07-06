/**
 * Auth Service — StellarNest
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
}

export type AuthErrorCode =
  | 'email-already-in-use' | 'invalid-email' | 'weak-password'
  | 'user-not-found' | 'wrong-password' | 'too-many-requests'
  | 'network-request-failed' | 'unknown';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

function mapError(err: any): AuthError {
  const code = (err?.code ?? '').replace('auth/', '') as AuthErrorCode;
  const messages: Record<string, string> = {
    'email-already-in-use': 'This email is already registered. Sign in instead.',
    'invalid-email': 'Please enter a valid email address.',
    'weak-password': 'Password must be at least 6 characters.',
    'user-not-found': 'No account found. Sign up first.',
    'wrong-password': 'Incorrect password. Try again.',
    'too-many-requests': 'Too many failed attempts. Try again later.',
    'network-request-failed': 'Network error. Check your connection.',
    'internal-error': 'Something went wrong. Please try again.',
  };
  return { code, message: messages[code] ?? err?.message ?? 'Unexpected error.' };
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(cred.user);
  } catch (err) {
    throw mapError(err);
  }
}

export async function signUp(email: string, password: string, displayName: string): Promise<AuthUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return { uid: cred.user.uid, email: cred.user.email ?? email, displayName };
  } catch (err) {
    throw mapError(err);
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw mapError(err);
  }
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (u: FirebaseUser | null) => {
    callback(u ? mapUser(u) : null);
  });
}

export function getCurrentUser(): AuthUser | null {
  const u = auth.currentUser;
  return u ? mapUser(u) : null;
}

function mapUser(u: FirebaseUser): AuthUser {
  return { uid: u.uid, email: u.email ?? '', displayName: u.displayName };
}
