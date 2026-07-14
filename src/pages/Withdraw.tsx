import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Loader2, Globe } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatAmount } from '../lib/stellar';
import { getCountryConfig, formatLocal } from '../lib/regional';
import type { MagicClaim, CountryCode } from '../types';

export default function Withdraw() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClaim, claimFunds } = useApp();

  const [claim, setClaim] = useState<MagicClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [country, setCountry] = useState<CountryCode>('ID');

  // Load claim + restore country from session on mount
  useEffect(() => {
    const savedCountry = sessionStorage.getItem('stellarnest_recipient_country') as CountryCode | null;
    if (savedCountry) setCountry(savedCountry);

    if (id) {
      getClaim(id).then((found) => {
        setClaim(found);
        setIsLoading(false);
      }).catch(() => {
        setClaim(null);
        setIsLoading(false);
      });
    }
  }, [id, getClaim]);

  const countryConfig = getCountryConfig(country);

  const handleWithdraw = async () => {
    if (!claim || !bankName || !accountNumber) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Read balance BEFORE the transfer (used in catch block for success detection)
    const userBeforeStr = localStorage.getItem('stellarnest_user');
    const userBeforeObj = userBeforeStr ? JSON.parse(userBeforeStr) : {};
    const balanceBefore = userBeforeObj.emergencyFundBalanceUSD ?? 0;
    const claimAmount = claim?.allocatedFamilyUSD ?? 0;
    console.log(`[Withdraw] handleSubmit — claimAmount=${claimAmount}, balanceBefore=${balanceBefore}, claimId=${id}`);

    try {
      // claimFunds now takes: firestoreId, claimId, bankAccount, bankName
      const cfResult = await claimFunds(
        (claim as any).firestoreId || id || '',
        id || '',
        accountNumber,
        bankName
      );
      console.log(`[Withdraw] claimFunds resolved successfully, cfResult=`, cfResult);
      setSuccess(true);
    } catch (err) {
      console.error(`[Withdraw] claimFunds THREW: ${err}`);
      // Check localStorage claim status — if isClaimed=true, Stellar tx DID succeed
      let claimIsClaimed = false;
      try {
        const claims = JSON.parse(localStorage.getItem('stellarnest_claims') || '[]');
        const found = claims.find((c: any) => c.claimId === id);
        claimIsClaimed = !!(found && found.isClaimed);
        console.log(`[Withdraw] claim in storage: isClaimed=${claimIsClaimed}, amount=${found?.allocatedFamilyUSD}`);
      } catch (e) { console.error('[Withdraw] storage read error:', e); }

      if (claimIsClaimed) {
        console.warn('[Withdraw] Transfer succeeded (isClaimed=true):', err);
        setSuccess(true);
      } else {
        console.error('[Withdraw] Transfer FAILED: isClaimed=false, balanceBefore=' + balanceBefore);
        setError('Failed to claim funds. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mb-6">
          <Check size={40} className="text-secondary" strokeWidth={3} />
        </div>
        <p className="text-[24px] font-bold text-on-surface mb-2">Funds Claimed!</p>
        <p className="text-on-surface-variant text-sm text-center mb-2">
          {claim ? formatAmount(claim.allocatedFamilyUSD) : ''} has been sent to your{' '}
          {bankName} account.
        </p>
        <p className="text-on-surface-variant text-xs text-center mb-8">
          The sender has been notified. Funds typically arrive within 1-3 business days.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-sm press-effect"
        >
          Create Your Own Account
        </button>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <p className="text-[24px] font-bold text-on-surface mb-2">Invalid Link</p>
        <button onClick={() => navigate('/')} className="text-primary font-semibold text-sm mt-4">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full pb-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(`/claim/${id}`)} className="text-primary">
          ←
        </button>
        <h2 className="font-semibold text-[20px] text-on-surface">Withdraw to Bank</h2>
      </div>

      {/* Amount Summary */}
      <div className="bg-surface-container-low rounded-2xl p-4 mb-6 flex justify-between items-center">
        <div>
          <p className="text-[11px] text-on-surface-variant font-medium">You receive</p>
          <p className="text-[20px] font-bold text-primary">
            {formatAmount(claim.allocatedFamilyUSD)}
            <span className="text-[13px] font-normal text-primary/70 ml-1">
              ≈ {formatLocal(claim.allocatedFamilyUSD, country)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-on-surface-variant font-medium">Settlement via</p>
          <p className="text-sm font-semibold text-on-surface">{countryConfig.settlementRails[0]}</p>
        </div>
      </div>

      {/* Bank Selection — dynamically driven by selected country */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Bank / E-Wallet
          </label>
          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
            <Globe size={11} />
            <span>{countryConfig.flag} {countryConfig.name}</span>
          </div>
        </div>

        {/* E-wallets section */}
        {countryConfig.paymentRails.some((r) => r.type === 'ewallet') && (
          <div className="mb-2">
            <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1.5">E-Wallets</p>
            <div className="flex flex-wrap gap-2">
              {countryConfig.paymentRails
                .filter((r) => r.type === 'ewallet')
                .map((rail) => (
                  <button
                    key={rail.id}
                    onClick={() => { setBankName(rail.label); setAccountNumber(''); }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      bankName === rail.label
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white border-outline-variant text-on-surface hover:border-primary'
                    }`}
                  >
                    {rail.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Banks section */}
        {countryConfig.paymentRails.some((r) => r.type === 'bank') && (
          <div>
            <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1.5">Banks</p>
            <div className="relative">
              <select
                value={bankName}
                onChange={(e) => { setBankName(e.target.value); setAccountNumber(''); }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary pr-10"
              >
                <option value="">-- Select Bank --</option>
                {countryConfig.paymentRails
                  .filter((r) => r.type === 'bank')
                  .map((rail) => (
                    <option key={rail.id} value={rail.label}>{rail.label}</option>
                  ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-xs">▾</span>
            </div>
          </div>
        )}

        {/* Mobile money (Vietnam) */}
        {countryConfig.paymentRails.some((r) => r.type === 'mobile_money') && (
          <div className="mt-2">
            <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mb-1.5">Mobile Money</p>
            <div className="flex flex-wrap gap-2">
              {countryConfig.paymentRails
                .filter((r) => r.type === 'mobile_money')
                .map((rail) => (
                  <button
                    key={rail.id}
                    onClick={() => { setBankName(rail.label); setAccountNumber(''); }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      bankName === rail.label
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white border-outline-variant text-on-surface hover:border-primary'
                    }`}
                  >
                    {rail.label}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Account Number */}
      <div className="mb-6">
        <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
          Account Number
        </label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder={
            countryConfig.paymentRails.find((r) => r.label === bankName)?.accountHint
              ?? 'Enter account / phone number'
          }
          className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          ⚠️ By confirming, you agree that funds will be sent to the above account.
          Transfers are final and cannot be reversed. Estimated arrival: 1-3 business days.
        </p>
      </div>

      {error && (
        <div className="bg-error-container/30 border border-error/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-error text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={handleWithdraw}
        disabled={isSubmitting || !bankName || !accountNumber}
        className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 press-effect disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </>
        ) : (
          `Withdraw ${claim ? formatAmount(claim.allocatedFamilyUSD) : ''}`
        )}
      </button>
    </div>
  );
}
