/**
 * AppContext — StellarNest
 *
 * Central state management for the app.
 *
 * Responsibilities:
 * - Auth state (via Firebase Auth listener)
 * - User profile (Firestore + localStorage cache)
 * - Encrypted Stellar secret (in memory only, encrypted in Firestore)
 * - Claims (Firestore primary + localStorage cache)
 * - Transactions (Firestore primary + localStorage cache)
 *
 * Anti-pattern avoided: business logic goes through services, NOT here.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { UserProfile, MagicClaim, Transaction } from '../types';
import {
  saveUser,
  clearUser,
  getClaims,
  saveClaim,
  getClaimById,
  getTransactions,
  getUser,
  seedDemoData,
} from '../lib/storage';
import {
  getCachedUser,
  clearCachedUser,
  fetchUserProfile,
  updateUserProfile,
  storeEncryptedSecret,
  getEncryptedSecret,
} from '../lib/services/user.service';
import { onAuthChange, getCurrentUser, signOut as authSignOut } from '../lib/services/auth.service';
import { createClaim, getClaim, getUserClaims, claimFunds } from '../lib/services/claim.service';
import { saveTransaction, getUserTransactions } from '../lib/services/transaction.service';
import { createTestnetAccount, establishUSDCTrust } from '../lib/stellar';
import { encryptSecret, decryptSecret } from '../lib/crypto';

// ─── Context shape ──────────────────────────────────────────────
interface AppContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (name: string, email: string) => Promise<void>;
  signOut: () => void;

  // Claims
  claims: MagicClaim[];
  createClaim: (
    data: Omit<MagicClaim, 'claimId' | 'createdAt' | 'expiresAt' | 'isClaimed'>
  ) => Promise<MagicClaim>;
  getClaim: (claimId: string) => Promise<MagicClaim | null>;
  claimFunds: (
    firestoreId: string,
    claimId: string,
    bankAccount: string,
    bankName: string
  ) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTx: (tx: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;

  // Balance helpers
  addFunds: (amount: number) => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────

// Initializer — restore cached user from localStorage (no demo auto-seed).
// Demo mode is opt-in via ?demo=1 URL param, triggered explicitly by user action.
function getInitialUser(): UserProfile | null {
  return getCachedUser();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(getInitialUser);
  const [claims, setClaims] = useState<MagicClaim[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // In-memory ref for the decrypted Stellar secret (NEVER persisted to localStorage)
  const walletSecretRef = useRef<string | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  // ─── Boot: Load from localStorage first, then sync from Firestore ──
  useEffect(() => {
    const bootstrap = async () => {
      // Step 1: Already done by getOrCreateDemoUser() initializer — just sync claims/txs
      const cached = getCachedUser();
      if (cached) {
        setUser(cached);
        setClaims(getClaims());
        setTransactions(getTransactions());
      }

      // Step 2: Listen to Firebase Auth state (4s timeout fallback for offline/no-network)
      const authTimeout = setTimeout(() => {
        console.warn('[AppContext] Firebase auth timed out — proceeding without auth');
        setIsLoading(false);
      }, 4000);

      const unsubscribe = onAuthChange(async (firebaseUser) => {
        clearTimeout(authTimeout);
        if (firebaseUser) {
          // Step 3: Sync user profile from Firestore (source of truth)
          try {
            const cloudProfile = await fetchUserProfile(firebaseUser.uid);
            if (cloudProfile) {
              const localProfile: UserProfile = {
                id: cloudProfile.uid, // Firebase UID as primary ID
                name: cloudProfile.name,
                email: cloudProfile.email,
                stellarPublicKey: cloudProfile.stellarPublicKey ?? '',
                emergencyFundBalanceUSD: cloudProfile.emergencyFundBalanceUSD ?? 0,
                savedLocalBank: cloudProfile.savedLocalBank ?? null,
                createdAt: cloudProfile.createdAt instanceof Date
                  ? cloudProfile.createdAt.toISOString()
                  : (cloudProfile as any).createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
              };
              setUser(localProfile);
              saveUser(localProfile);

              // Step 4: Decrypt and load Stellar secret into memory
              if (cloudProfile.encryptedSecret) {
                const secret = await decryptSecret(cloudProfile.encryptedSecret, firebaseUser.uid);
                if (secret) {
                  walletSecretRef.current = secret;
                  console.info('[AppContext] Stellar wallet loaded into memory');
                }
              }

              // Step 5: Sync claims + transactions from Firestore
              const [cloudClaims, cloudTxs] = await Promise.all([
                getUserClaims(firebaseUser.uid),
                getUserTransactions(firebaseUser.uid),
              ]);
              setClaims(cloudClaims as unknown as MagicClaim[]);
              setTransactions(cloudTxs as unknown as Transaction[]);
            }
          } catch (err) {
            console.warn('[AppContext] Firestore sync failed, using local cache:', err);
          }
        } else {
          // No Firebase user — check if demo mode is requested via URL param
          // Internet banking flow: landing → /auth → signup/login → dashboard
          // Demo mode (hackathon): landing → Get Started → /dashboard with seed data
          const url = new URL(window.location.href);
          if (url.searchParams.get('demo') === '1' || sessionStorage.getItem('__stellarnest_autofill_demo__') === '1') {
            sessionStorage.removeItem('__stellarnest_autofill_demo__');
            seedDemoData();
          }
          setUser(getCachedUser());
          setClaims(getClaims());
          setTransactions(getTransactions());
        }
        setIsLoading(false);
      });

      return () => { clearTimeout(authTimeout); unsubscribe(); };
    };

    const cleanup = bootstrap();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  // ─── Sign In ─────────────────────────────────────────────────
  const signIn = useCallback(async (name: string, email: string) => {
    setIsLoading(true);
    try {
      const currentAuth = getCurrentUser();

      if (currentAuth) {
        // ── Firebase user (returning or just signed up via Auth page) ──
        // Try to decrypt existing Stellar secret from Firestore
        const encrypted = await getEncryptedSecret(currentAuth.uid);
        if (encrypted) {
          const secret = await decryptSecret(encrypted, currentAuth.uid);
          if (secret) {
            walletSecretRef.current = secret;
          }
        } else {
          // New Firebase user — create Stellar wallet and encrypt secret
          const { publicKey, secret, funded } = await createTestnetAccount();
          if (funded) {
            await establishUSDCTrust(publicKey, secret);
          }
          const encryptedSecret = await encryptSecret(secret, currentAuth.uid);
          walletSecretRef.current = secret;

          const newProfile: UserProfile = {
            id: currentAuth.uid,
            name: currentAuth.displayName || name,
            email: currentAuth.email ?? email,
            stellarPublicKey: publicKey,
            emergencyFundBalanceUSD: 0,
            savedLocalBank: null,
            createdAt: new Date().toISOString(),
          };
          saveUser(newProfile);
          setUser(newProfile);

          // Store encrypted secret in Firestore
          await storeEncryptedSecret(currentAuth.uid, encryptedSecret);
        }

        // Sync from Firestore
        const cloudProfile = await fetchUserProfile(currentAuth.uid);
        if (cloudProfile) {
          const localProfile: UserProfile = {
            id: cloudProfile.uid,
            name: cloudProfile.name,
            email: cloudProfile.email,
            stellarPublicKey: cloudProfile.stellarPublicKey ?? '',
            emergencyFundBalanceUSD: cloudProfile.emergencyFundBalanceUSD ?? 0,
            savedLocalBank: cloudProfile.savedLocalBank ?? null,
            createdAt: cloudProfile.createdAt instanceof Date
              ? cloudProfile.createdAt.toISOString()
              : (cloudProfile as any).createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          };
          setUser(localProfile);
          saveUser(localProfile);
        }
        setClaims(getClaims());
        setTransactions(getTransactions());
      } else {
        // ── Local/demo user (no Firebase) — backwards compatible ──
        const existing = getUser();
        if (existing?.stellarPublicKey) {
          // Restore existing local user
          setUser(existing);
          setClaims(getClaims());
          setTransactions(getTransactions());
        } else {
          // Create new local wallet (no Firebase, no encrypted storage)
          const { publicKey, secret, funded } = await createTestnetAccount();
          if (funded) {
            await establishUSDCTrust(publicKey, secret);
          }
          const newUser: UserProfile = {
            id: publicKey, // Use Stellar key as ID for local users
            name,
            email,
            stellarPublicKey: publicKey,
            emergencyFundBalanceUSD: 0,
            savedLocalBank: null,
            createdAt: new Date().toISOString(),
          };
          saveUser(newUser);
          setUser(newUser);
          walletSecretRef.current = secret; // Unencrypted in memory for demo
          seedDemoData();
          setClaims(getClaims());
          setTransactions(getTransactions());
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Sign Out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    walletSecretRef.current = null;
    clearUser();
    clearCachedUser();
    setUser(null);
    setClaims([]);
    setTransactions([]);
    try {
      await authSignOut();
    } catch (err) {
      console.warn('[AppContext] Firebase signOut failed:', err);
    }
  }, []);

  // ─── Create Claim ─────────────────────────────────────────────
  const handleCreateClaim = useCallback(
    async (
      data: Omit<MagicClaim, 'claimId' | 'createdAt' | 'expiresAt' | 'isClaimed'>
    ): Promise<MagicClaim> => {
      const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // senderUid = Firebase UID (from user.id for Firebase users, Stellar key for demo)
      const senderUid = userRef.current?.id ?? data.senderId ?? '';
      const senderPublicKey = userRef.current?.stellarPublicKey ?? '';

      const claim = await createClaim({
        claimId,
        ...data,
        senderUid,
        senderPublicKey,
        senderName: userRef.current?.name ?? 'Anonymous',
      });

      // Build local MagicClaim
      const localClaim: MagicClaim = {
        claimId: claim.claimId,
        senderId: senderUid,
        senderPublicKey: claim.senderPublicKey,
        senderName: claim.senderName,
        recipientName: claim.recipientName,
        recipientBank: claim.recipientBank,
        recipientAccount: claim.recipientAccount,
        totalAmountUSD: claim.totalAmountUSD,
        allocatedFamilyUSD: claim.allocatedFamilyUSD,
        allocatedSavingsUSD: claim.allocatedSavingsUSD,
        splitRatio: claim.splitRatio,
        isClaimed: claim.status === 'claimed',
        createdAt: claim.createdAt,
        expiresAt: claim.expiresAt,
        ...(claim.firestoreId ? { firestoreId: claim.firestoreId } : {}),
      } as any;

      setClaims(getClaims());

      // Save transaction
      const tx: Omit<Transaction, 'id' | 'timestamp'> = {
        type: 'sent',
        amountUSD: data.totalAmountUSD,
        counterpartyName: 'Magic Link Sent',
        description: `${data.allocatedFamilyUSD.toFixed(2)} to family + ${data.allocatedSavingsUSD.toFixed(2)} saved`,
        status: 'completed',
        memo: claim.claimId,
      };
      await saveTransaction({
        ...tx,
        txId: `tx_${Date.now()}`,
        userUid: senderUid,
      });
      setTransactions(getTransactions());

      // Update emergency fund balance — use the already-computed newBalance so it's persisted correctly
      const newBalance = (userRef.current?.emergencyFundBalanceUSD ?? 0) + data.allocatedSavingsUSD;
      setUser((prev) => prev ? { ...prev, emergencyFundBalanceUSD: newBalance } : null);
      await updateUserProfile(userRef.current?.id ?? '', { emergencyFundBalanceUSD: newBalance });

      return localClaim;
    },
    []
  );

  // ─── Get Claim ───────────────────────────────────────────────
  const handleGetClaim = useCallback(async (claimId: string): Promise<MagicClaim | null> => {
    const result = await getClaim(claimId);
    return result as unknown as MagicClaim | null;
  }, []);

  // ─── Claim Funds ─────────────────────────────────────────────
  const handleClaimFunds = useCallback(
    async (firestoreId: string, claimId: string, bankAccount: string, bankName: string) => {
      const currentAuth = getCurrentUser();

      const claim = await getClaim(claimId);
      if (claim && currentAuth && claim.senderUid === currentAuth.uid) {
        throw new Error('You cannot claim your own Magic Link.');
      }

      await claimFunds(
        firestoreId,
        currentAuth?.uid ?? '',
        currentAuth?.displayName ?? 'Anonymous',
        bankAccount,
        bankName
      );

      // Update local claim
      const local = getClaimById(claimId);
      if (local) {
        saveClaim({ ...local, isClaimed: true, claimedAt: new Date().toISOString() } as MagicClaim);
      }
      setClaims(getClaims());
      setTransactions(getTransactions());
    },
    []
  );

  // ─── Add Transaction ──────────────────────────────────────────
  const handleAddTx = useCallback(
    async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
      const fullTx = {
        ...tx,
        txId: `tx_${Date.now()}`,
        userUid: userRef.current?.id ?? '',
        timestamp: new Date().toISOString(),
      };
      await saveTransaction(fullTx);
      setTransactions(getTransactions());
    },
    []
  );

  // ─── Add Funds ────────────────────────────────────────────────
  const handleAddFunds = useCallback((amount: number) => {
    if (!userRef.current) return;
    const newBalance = userRef.current.emergencyFundBalanceUSD + amount;
    updateUserProfile(userRef.current?.id ?? '', { emergencyFundBalanceUSD: newBalance });
    setUser((prev) => (prev ? { ...prev, emergencyFundBalanceUSD: newBalance } : null));
  }, []);

  // ─── Update User Profile ──────────────────────────────────────
  const handleUpdateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      const currentAuth = getCurrentUser();
      if (currentAuth) {
        await updateUserProfile(userRef.current?.id ?? '', {
          name: data.name ?? userRef.current?.name,
          email: data.email ?? userRef.current?.email,
          stellarPublicKey: data.stellarPublicKey ?? userRef.current?.stellarPublicKey,
          emergencyFundBalanceUSD: data.emergencyFundBalanceUSD,
          savedLocalBank: data.savedLocalBank ?? userRef.current?.savedLocalBank ?? undefined,
        });
      }
      const updated = { ...(userRef.current ?? {}), ...data } as UserProfile;
      saveUser(updated);
      setUser(updated);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        claims,
        createClaim: handleCreateClaim,
        getClaim: handleGetClaim,
        claimFunds: handleClaimFunds,
        transactions,
        addTx: handleAddTx,
        addFunds: handleAddFunds,
        updateUserProfile: handleUpdateUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
