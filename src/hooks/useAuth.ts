/**
 * useAuth — StellarNest
 *
 * Manages Firebase Auth state reactively.
 * Automatically syncs with AppContext on auth state changes.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthChange,
  signIn,
  signUp,
  signOut as authSignOut,
  getCurrentUser,
  type AuthUser,
} from '../lib/services/auth.service';
import { getCachedUser, fetchUserProfile, createUserProfile, clearCachedUser } from '../lib/services/user.service';
import type { UserProfile } from '../types';
import { createTestnetAccount, establishUSDCTrust } from '../lib/stellar';

export interface UseAuthReturn {
  user: AuthUser | null;
  localProfile: UserProfile | null; // Mirrored from AppContext
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(
  onAuthSuccess: (profile: UserProfile) => void,
  onSignOut: () => void
): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch profile from Firestore or create if new user
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          if (profile) {
            // Convert CloudUserProfile → UserProfile for AppContext
            const mappedProfile: UserProfile = {
              id: profile.uid,
              name: profile.name,
              email: profile.email,
              stellarPublicKey: profile.stellarPublicKey ?? '',
              emergencyFundBalanceUSD: profile.emergencyFundBalanceUSD ?? 0,
              savedLocalBank: profile.savedLocalBank ?? null,
              createdAt: profile.createdAt instanceof Date
                ? profile.createdAt.toISOString()
                : (profile as any).createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
            };
            onAuthSuccess(mappedProfile);
            setLocalProfile(mappedProfile);
          }
        } catch (err) {
          console.warn('[useAuth] fetchUserProfile failed, using cache:', err);
          const cached = getCachedUser();
          if (cached) {
            onAuthSuccess(cached);
            setLocalProfile(cached);
          }
        }
      } else {
        setUser(null);
        onSignOut();
        setLocalProfile(null);
      }
    });

    return () => unsubscribe();
  }, [onAuthSuccess, onSignOut]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // Auth state listener will handle the success
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await signUp(email, password, name);

      // Create Stellar testnet account for the new user
      setError('Creating your Stellar wallet...');
      const { publicKey, secret, funded } = await createTestnetAccount();
      if (funded) {
        await establishUSDCTrust(publicKey, secret);
      }

      // Create user profile in Firestore
      await createUserProfile(newUser.uid, {
        email,
        name,
        stellarPublicKey: publicKey,
      });

      // Auth state listener will handle the success
    } catch (err: any) {
      setError(err?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    try {
      clearCachedUser();
      await authSignOut();
      onSignOut();
    } catch (err) {
      console.error('[useAuth] signOut failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onSignOut]);

  return {
    user,
    localProfile,
    isLoading,
    isAuthenticated: !!user,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    clearError: () => setError(null),
  };
}
