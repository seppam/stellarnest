# StellarNest — Borderless Payments on Stellar

> Cross-border payment app for Indonesian migrant workers and freelancers, built on the Stellar blockchain.

**Status**: Private dev | Hackathon submission (APAC Stellar Hackathon — Deadline July 15, 2026)

**Live demo**: `http://localhost:5173` (dev) | **Repo**: `https://github.com/seppam/stellarnest`

---

## Features

### ✅ Implemented
- **Magic Claim Links** — Generate shareable payment URLs via Stellar testnet; recipient claims without installing the app
- **Split-Routing** — Allocate payment between Family savings + Emergency fund in one transaction
- **Proof of Income** — Generate signed income statements from on-chain transaction history
- **Insights Dashboard** — YTD income, spending breakdown, transaction history
- **Stellar Wallet** — BIP39 key generation, AES-GCM encrypted secret storage (PBKDF2, 100k iterations), USDC on testnet
- **Firebase Auth** — Magic Link email authentication with Firestore profile sync
- **Offline-first** — localStorage cache for instant load; syncs to Firestore on reconnect
- **Demo Mode** — Pre-seeded with 5 transactions ($2,650 YTD income) for black-box testing

### 🚧 In Progress
- Production Firebase config + real Stellar mainnet migration
- Bank payout withdrawal flow (Indonesian VA / QRIS)
- Magic Link email delivery (Firebase Email Action handler)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Blockchain | Stellar SDK v16 (testnet) |
| Auth | Firebase Auth (Magic Link) |
| Database | Firestore |
| Encryption | Web Crypto API — AES-GCM + PBKDF2 |
| Payments | USDC on `horizon-testnet.stellar.org` |
| Treasury | `GAV7X26J5B7MFX37WGOKLV5CIRQWJYCI2XOOIUGLP373P4TIYRGE2PSW` |

---

## Getting Started

### 1. Prerequisites
```bash
node >= 18  |  npm >= 9
```

### 2. Clone & install
```bash
git clone https://github.com/seppam/stellarnest.git
cd stellarnest
npm install
```

### 3. Firebase config
```bash
cp .env.example .env.local
# Fill in your Firebase project credentials in .env.local
```

### 4. Run dev server
```bash
npm run dev
```
App opens at `http://localhost:5173`

### 5. Build for production
```bash
npm run build    # TypeScript check + Vite build
```

---

## Demo Mode

The app ships with a demo user pre-seeded in localStorage:

| Field | Value |
|-------|-------|
| Name | Asep Demo |
| Email | asep@demo.test |
| Balance | $500.00 USDC |
| Stellar Key | `GDEMOACCOUNTXXXXXXXXXXXXXXXXXXXXXXX` |
| Transactions | 5 seeded (Upwork, Mom, Freelance) |

**To reset demo**: open DevTools → Application → Local Storage → delete `stellarnest_user`, `stellarnest_claims`, `stellarnest_transactions` → hard refresh.

---

## Project Structure

```
src/
├── components/
│   ├── features/        # BalanceCard, TransactionItem
│   └── ui/             # BottomNav, ErrorBoundary
├── contexts/
│   └── AppContext.tsx   # Global state: user, claims, txs, wallet secret
├── hooks/
│   └── useAuth.ts       # Firebase auth helpers
├── lib/
│   ├── crypto.ts        # AES-GCM encrypt/decrypt Stellar secrets
│   ├── firebase.ts     # Firebase init
│   ├── storage.ts       # localStorage helpers + seed data
│   ├── stellar.ts       # Stellar SDK: pay, selfMintUSDC, loadAccount
│   └── services/        # auth, claim, transaction, user (Firestore)
└── pages/
    ├── Landing.tsx      # Marketing landing + app entry
    ├── Dashboard.tsx    # Balance + quick actions
    ├── Send.tsx         # Split-payment form
    ├── History.tsx      # Transaction list
    ├── Insights.tsx     # YTD stats + charts
    ├── Profile.tsx      # Wallet + bank account
    ├── Claim.tsx        # Magic Link redemption (public route)
    ├── Auth.tsx         # Firebase Magic Link sign-in
    └── TransactionDetail.tsx
```

---

## Key Decisions

- **BrowserRouter** (not HashRouter) — clean URLs; deploy to Vercel/Firebase Hosting with rewrites
- **Encrypted secrets in Firestore** — AES-GCM blob; decrypted into memory only (never localStorage)
- **Demo bypass** — `stellarnest_user` localStorage key bypasses Firebase Auth for black-box E2E testing
- **`seedDemoData` in useState initializer** — synchronous user creation before first paint eliminates null-flash

---

## Test Results

```
✅ Landing page         — StellarNest branding
✅ Dashboard            — Hi, Asep! | Balance $500.00
✅ Send form            — Split routing UI
✅ Magic Link generate  — Testnet payment submitted
✅ Insights             — YTD $2,650 across 3 transactions
✅ Transaction history  — Upwork, Mom, Freelance entries
✅ Claim page (public)  — Standalone redemption flow
✅ Profile page         — Wallet + Emergency Fund display
✅ Console errors       — 0 critical errors
```

---

## Hackathon Info

| Item | Detail |
|------|--------|
| Event | APAC Stellar Hackathon |
| Submission | https://www.risein.com/programs/apac-stellar-hackathon |
| Deadline | July 15, 2026 |
| Demo Day | July 18, 2026 |
| Grand Finale | July 24, 2026 |

---

## Documentation

Detailed project documentation (external, not in repo):
`~/Documents/Hackathon/StellarNest_docs/StellarNest_Project_Documentation.docx`
