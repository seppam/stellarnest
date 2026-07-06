# StellarNest — AI Code Audit Prompt

You are auditing **StellarNest**, a cross-border payment app for Indonesian migrant workers built on the Stellar blockchain. Your task is to conduct a thorough, structured audit and return findings with severity ratings.

---

## 📁 Project Context

**Path**: `~/Documents/Projects/StellarNest`
**Stack**: Vite + React 18 + TypeScript + Tailwind CSS + Firebase (Firestore + Auth) + Stellar SDK
**Dev server**: `http://localhost:5173/`

### Architecture (current)
```
UI Components → Hooks → Services → Firestore (primary) + localStorage (cache)
                        ↓
                   AppContext (state only)
```

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/firebase.ts` | Firebase init, env vars |
| `src/lib/stellar.ts` | Stellar mock/testnet operations |
| `src/lib/storage.ts` | localStorage cache layer |
| `src/lib/services/auth.service.ts` | Firebase Auth wrapper |
| `src/lib/services/user.service.ts` | User CRUD + cache |
| `src/lib/services/claim.service.ts` | Magic Link operations |
| `src/lib/services/transaction.service.ts` | Transaction history |
| `src/contexts/AppContext.tsx` | Global state + service orchestration |
| `src/hooks/useAuth.ts` | Firebase Auth state hook |
| `src/pages/*.tsx` | All page components |
| `src/types/index.ts` | TypeScript interfaces |

### Environment
- `VITE_MOCK_MODE=true` (Stellar operations are mocked, not live)
- Firebase project: `stellarnest-hackathon` (Firebase app initialized)

---

## 🎯 Audit Scope

Audit the entire `src/` directory. For each area below, report:
- ✅ What works well
- ⚠️ Issues with severity: **CRITICAL / HIGH / MEDIUM / LOW**
- 💡 Actionable suggestions

---

### 1. 🔐 Security & Privacy

**Check for:**
- Firebase API key exposed in client-side code (fine if in env vars, bad if hardcoded)
- Private keys / secrets in `localStorage` or any client-accessible storage
- `stellarSecretKey` being stored or transmitted insecurely
- User data being sent to third-party APIs without consent
- XSS vulnerabilities (user input rendered unsanitized)
- Auth state being bypassed on protected routes (no route guards)
- Sensitive data in URL query params or path params

**Severity thresholds:**
- CRITICAL: Secret key exposure, auth bypass
- HIGH: PII logged, sensitive data in URLs
- MEDIUM: Missing HTTPS enforcement, broad Firestore rules

---

### 2. 🏗️ Architecture & Code Quality

**Check for:**
- `any` type usage that bypasses type safety
- Unused imports or variables (TypeScript errors suppressed)
- Deeply nested callbacks / promise chains that could be simplified
- Business logic in components instead of services
- State duplication between AppContext and localStorage (no single source of truth)
- Missing error boundaries or unhandled promise rejections
- Missing loading states / skeleton screens
- Race conditions (e.g., useEffect with no dependency array running twice in React 18 Strict Mode)

**Severity thresholds:**
- HIGH: Business logic in JSX, type safety violations
- MEDIUM: Unused code, missing error handling
- LOW: Code style preferences

---

### 3. 💰 Stellar / Blockchain Logic

**Check for:**
- `MOCK_MODE` flag inconsistencies (some places respect it, others don't)
- Transaction memo handling (required for Stellar — is it being set?)
- Trustline setup for USDC (is `establishUSDCTrust()` called before sending?)
- Account creation flow (testnet account funding via Friendbot)
- Transaction timeout handling
- Proper public key validation before sending
- `signature` field being used but no actual signing happening (in mock mode)
- Gas/fee assumptions that differ from actual Stellar fees

**Severity thresholds:**
- CRITICAL: Funds lost due to wrong address, no memo on exchange deposits
- HIGH: Trustline missing, transaction fails silently
- MEDIUM: Missing validation

---

### 4. 🔥 Firebase / Backend Integration

**Check for:**
- Firestore security rules (are they open or properly restricted?)
- Missing indexes for queries (Firestore composite indexes needed for `where + orderBy`)
- Auth state not persisted across page refreshes
- User profile not created on sign-up (Firestore vs localStorage mismatch)
- Error handling: does the app crash if Firebase is unreachable?
- Firestore read/write operations happening on every render (missing `useEffect` or `useMemo`)
- Missing real-time listeners (`onSnapshot`) where they should exist

**Severity thresholds:**
- CRITICAL: Firestore rules allow anyone to read/write all data
- HIGH: Data loss, missing indexes causing query failures
- MEDIUM: Performance issues, missing real-time sync

---

### 5. 📱 UX / User Flows

**Check for:**
- Magic Link claim flow: sender generates link → recipient opens → claims to bank
  - Does the link work across devices?
  - What happens if the link is expired?
  - What happens if claim is attempted twice?
- Split routing (family vs savings): slider works correctly?
- Empty states: no transactions, no claims — is it clear to the user?
- Error messages: are they human-readable or raw error codes?
- Loading states: network operations block UI without feedback?
- Form validation: amount inputs, bank account number format
- Accessibility: alt text on images, aria labels on interactive elements

**Severity thresholds:**
- HIGH: Broken user flows, dead ends
- MEDIUM: Confusing UX, unclear errors
- LOW: Polish improvements

---

### 6. ⚡ Performance

**Check for:**
- Firebase SDK imported at module level (increases initial bundle)
- Large bundle size (anything over 1MB initial JS is worth noting)
- Missing React.memo on large list items
- Re-renders triggered unnecessarily (missing `useCallback` / `useMemo`)
- Images or assets not lazy loaded
- localStorage read on every render (should be in `useEffect`)

**Severity thresholds:**
- MEDIUM: Noticeable lag on mid-range devices
- LOW: Minor bundle optimizations

---

### 7. 🧪 Edge Cases

**Check for:**
- Network offline: what happens to pending claims/transactions?
- Claim link opened on the **same device** as sender (should still work)
- Very large amounts (1000+ USD) vs small amounts ($1-5) — any differences?
- Split ratio edge cases: 0% savings, 100% savings, 50/50
- Expired links (24h expiry) — is the expiry checked client-side?
- Concurrent claim attempts (race condition on same link)
- Unicode/special characters in names (Indonesian naming conventions)
- Very long bank account numbers or unusual formats

---

## 📋 Output Format

Structure your response as:

```markdown
# StellarNest Code Audit Report

## Executive Summary
[2-3 sentence overall assessment]

## 🔐 Security
### CRITICAL
- [issue]
### HIGH
- [issue]
...

## 🏗️ Architecture & Code Quality
...

## 💰 Stellar Logic
...

## 🔥 Firebase
...

## 📱 UX
...

## ⚡ Performance
...

## 🧪 Edge Cases
...

## ✅ Strengths
[What works well]

## 📋 Prioritized Fix List
1. [Most important first — issue, file, line number if known]
```

## Notes
- Be specific: cite file paths and line numbers
- If something looks intentional (e.g., mock mode shortcuts), note it as such
- For the mock mode shortcut (stellarSecretKey in localStorage): assess whether it would be acceptable for hackathon demo or if it must be fixed before submission
- Assume the reviewer is a senior engineer evaluating for production readiness

Good luck! 🔍
