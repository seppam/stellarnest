import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatAmount } from '../lib/stellar';
import { COUNTRY_CODES, getCountryConfig, formatLocal } from '../lib/regional';
import type { MagicClaim, CountryCode } from '../types';

export default function Claim() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClaim } = useApp();

  const [claim, setClaim] = useState<MagicClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('ID');

  // Load claim asynchronously on mount
  useEffect(() => {
    if (!id) return;

    getClaim(id).then((found) => {
      setClaim(found);
      setIsLoading(false);
    }).catch(() => {
      setClaim(null);
      setIsLoading(false);
    });
  }, [id, getClaim]);

  const handleContinue = () => {
    if (!name.trim()) {
      setNameError('Please enter your name to continue.');
      return;
    }
    setNameError('');
    // Persist for Withdraw page
    sessionStorage.setItem('stellarnest_claimer_name', name.trim());
    sessionStorage.setItem('stellarnest_recipient_country', selectedCountry);
    navigate(`/claim/${id}/withdraw`);
  };

  // ─── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold text-primary mb-8 block">StellarNest</span>
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-on-surface-variant text-sm mt-4">Verifying claim link...</p>
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────────────
  if (!claim) {
    return (
      <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold text-primary mb-8 block">StellarNest</span>
        <div className="text-center">
          <p className="text-[24px] font-bold text-on-surface mb-2">Link Not Found</p>
          <p className="text-on-surface-variant text-sm">
            This claim link may have expired or already been used.
          </p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(claim.expiresAt) < new Date();
  const isClaimed = !!(claim as any).isClaimed || (claim as any).status === 'claimed';

  if (isExpired) {
    return (
      <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold text-primary mb-8 block">StellarNest</span>
        <div className="text-center">
          <p className="text-[24px] font-bold text-error mb-2">Link Expired</p>
          <p className="text-on-surface-variant text-sm">
            This claim link has expired. Ask the sender to generate a new one.
          </p>
        </div>
      </div>
    );
  }

  if (isClaimed) {
    return (
      <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold text-primary mb-8 block">StellarNest</span>
        <div className="text-center">
          <p className="text-[24px] font-bold text-amber-600 mb-2">Already Claimed</p>
          <p className="text-on-surface-variant text-sm">
            This claim link has already been used.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 pt-12 max-w-md mx-auto w-full pb-8 flex flex-col">
      <span className="text-[20px] font-bold text-primary mb-10 block">StellarNest</span>

      {/* Hero Card */}
      <div className="bg-primary-container rounded-3xl p-6 text-white flex-1 mb-6">
        <p className="text-[12px] font-semibold tracking-wider uppercase opacity-80 mb-1">
          You've received
        </p>
        <p className="text-[36px] font-bold leading-none mb-1">
          {formatAmount(claim.allocatedFamilyUSD)}
        </p>
        <p className="text-[13px] opacity-80">
          ≈ {formatLocal(claim.allocatedFamilyUSD, selectedCountry)} · from {claim.senderName || 'Someone'}
        </p>
      </div>

      {/* Country Selector */}
      <div className="bg-surface-container-low rounded-2xl p-4 mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
          Cash-out Country
        </label>
        <div className="flex gap-2 flex-wrap">
          {COUNTRY_CODES.map((code) => {
            const cfg = getCountryConfig(code);
            return (
              <button
                key={code}
                onClick={() => setSelectedCountry(code)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCountry === code
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-outline-variant text-on-surface hover:border-primary'
                }`}
              >
                <span>{cfg.flag}</span>
                <span>{cfg.name}</span>
                <span className="text-[10px] opacity-60">{cfg.currency.code}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-on-surface-variant mt-2">
          Settles via {getCountryConfig(selectedCountry).settlementRails.join(', ')}
        </p>
      </div>

      {/* Details */}
      <div className="bg-surface-container-low rounded-2xl p-5 mb-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-on-surface-variant">Total sent</span>
          <span className="text-sm font-semibold text-on-surface">
            {formatAmount(claim.totalAmountUSD)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-on-surface-variant">To family</span>
          <span className="text-sm font-semibold text-primary">
            {formatAmount(claim.allocatedFamilyUSD)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-on-surface-variant">To savings</span>
          <span className="text-sm font-semibold text-secondary">
            {formatAmount(claim.allocatedSavingsUSD)}
          </span>
        </div>
        <div className="border-t border-surface-variant pt-3">
          <div className="flex justify-between">
            <span className="text-sm text-on-surface-variant">Sender</span>
            <span className="text-sm font-semibold text-on-surface">{claim.senderName}</span>
          </div>
        </div>
      </div>

      {/* Name Input */}
      <div className="mb-4">
        <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
          Your Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError('');
          }}
          placeholder="Enter your name as registered in your bank"
          className={`w-full bg-surface-container-low border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 ${
            nameError
              ? 'border-error focus:ring-error'
              : 'border-outline-variant focus:ring-primary'
          }`}
        />
        {nameError && <p className="text-error text-xs mt-1 font-medium">{nameError}</p>}
      </div>

      <button
        onClick={handleContinue}
        disabled={!name.trim()}
        className="w-full bg-white text-primary-container py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 press-effect disabled:opacity-40"
      >
        Claim Funds
      </button>

      <p className="text-center text-[11px] text-on-surface-variant mt-4">
        Funds will be sent to your local bank account. No Stellar wallet needed.
      </p>
    </div>
  );
}
