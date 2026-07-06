import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Wand2, Copy, Check, Info, Loader2, UserPlus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { generateClaimId, formatAmount } from '../lib/stellar';
import BottomNav from '../components/ui/BottomNav';

// Bank options used in recipient form (inline)

// ─── Recipient type ─────────────────────────────────────────────
interface SavedRecipient {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
}

const STORAGE_KEY_RECIPIENTS = 'stellarnest_recipients';

function getSavedRecipients(): SavedRecipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECIPIENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecipient(recipient: SavedRecipient): void {
  const list = getSavedRecipients();
  // Avoid duplicates by account number
  if (!list.find((r) => r.accountNumber === recipient.accountNumber)) {
    list.unshift(recipient);
    localStorage.setItem(STORAGE_KEY_RECIPIENTS, JSON.stringify(list.slice(0, 20))); // Max 20 saved
  }
}

export default function Send() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAddingFunds = searchParams.get('addFunds') === 'true';

  const { user, createClaim, addFunds } = useApp();

  const [amount, setAmount] = useState('');
  const [splitRatio, setSplitRatio] = useState(70);
  const [recipientBank, setRecipientBank] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Recipient picker state
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [familyAmountStr, setFamilyAmountStr] = useState('');
  const [savingsAmountStr, setSavingsAmountStr] = useState('');
  const [savedRecipients] = useState<SavedRecipient[]>(() => getSavedRecipients());
  const [selectedRecipient, setSelectedRecipient] = useState<SavedRecipient | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const familyAmount = numAmount * (splitRatio / 100);
  const savingsAmount = numAmount - familyAmount;

  // Filter recipients by search
  
  const handleSelectRecipient = (r: SavedRecipient) => {
    setSelectedRecipient(r);
    setRecipientName(r.name);
    setRecipientBank(r.bankName);
    setRecipientAccount(r.accountNumber);
    setShowRecipientPicker(false);
  };

  const handleSaveNewRecipient = () => {
    if (!recipientName || !recipientAccount) return;
    saveRecipient({
      id: `rec_${Date.now()}`,
      name: recipientName,
      bankName: recipientBank,
      accountNumber: recipientAccount,
    });
  };

  const handleGenerateLink = async () => {
    if (!amount || numAmount <= 0) return;

    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));

    let linkClaimId = '';

    if (isAddingFunds) {
      addFunds(numAmount);
      linkClaimId = generateClaimId();
    } else {
      // Save the new recipient if it's a new one
      handleSaveNewRecipient();
      const created = await createClaim({
        senderId: user?.id ?? 'unknown',
        senderPublicKey: user?.stellarPublicKey ?? '',
        totalAmountUSD: numAmount,
        allocatedFamilyUSD: familyAmount,
        allocatedSavingsUSD: savingsAmount,
        splitRatio,
        recipientName: selectedRecipient?.name || recipientName || undefined,
        recipientBank: selectedRecipient?.bankName || recipientBank || undefined,
        recipientAccount: selectedRecipient?.accountNumber || recipientAccount || undefined,
      });
      linkClaimId = created.claimId;
    }

    const link = `${window.location.origin}/claim/${linkClaimId}`;
    setGeneratedLink(link);
    setIsGenerating(false);
    setShowSuccess(true);
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setAmount('');
    setSplitRatio(70);
    setRecipientAccount('');
    setRecipientName('');
    setSelectedRecipient(null);
    setGeneratedLink(null);
    setShowSuccess(false);
    setCopied(false);
  };

  // ─── Success Modal ────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white px-5 pt-6 pb-8 flex flex-col max-w-lg mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleReset} className="text-primary">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-semibold text-[20px] text-on-surface">Transfer Created!</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mb-6">
            <Check size={40} className="text-secondary" strokeWidth={3} />
          </div>

          <p className="text-[24px] font-bold text-center text-on-surface mb-2">
            {formatAmount(isAddingFunds ? numAmount : numAmount)} Sent!
          </p>
          <p className="text-on-surface-variant text-sm text-center mb-8 max-w-xs">
            {isAddingFunds
              ? 'Funds added to your StellarNest wallet from the testnet faucet.'
              : `${formatAmount(familyAmount)} to family + ${formatAmount(savingsAmount)} to savings`
            }
          </p>

          {generatedLink && !isAddingFunds && (
            <div className="w-full bg-surface-container-low rounded-2xl p-4 mb-6">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
                Share Magic Link
              </p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs font-mono text-on-surface bg-white rounded-lg px-3 py-2 border border-outline-variant truncate">
                  {generatedLink}
                </p>
                <button
                  onClick={handleCopy}
                  className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
                    copied ? 'bg-secondary-container text-secondary' : 'bg-primary-container text-white'
                  }`}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2">
                {copied ? '✓ Copied to clipboard!' : 'Send this link to your recipient'}
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-sm press-effect"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Add Funds Mode ──────────────────────────────────────────
  if (isAddingFunds) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-lg mx-auto w-full px-5 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/dashboard')} className="text-primary">
              <ArrowLeft size={24} />
            </button>
            <h2 className="font-semibold text-[20px] text-on-surface">Add Funds</h2>
          </div>

          <p className="text-on-surface-variant text-sm mb-6">
            Add testnet USDC to your wallet. This simulates a deposit from an exchange or anchor.
          </p>

          <div className="bg-white rounded-2xl border border-surface-variant p-5 mb-6">
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
              Amount (USDC)
            </label>
            <div className="flex items-center gap-2 border-b-2 border-primary py-2">
              <span className="text-[28px] font-bold text-primary">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setFamilyAmountStr(''); setSavingsAmountStr(''); }}
                placeholder="0.00"
                className="w-full text-[28px] font-bold bg-transparent border-none focus:ring-0 p-0 text-on-background placeholder:text-on-surface-variant/30"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateLink}
            disabled={!amount || numAmount <= 0 || isGenerating}
            className="w-full bg-secondary-container text-on-secondary-container py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 press-effect disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Depositing via Faucet...
              </>
            ) : (
              <>
                <Info size={18} />
                Add {amount ? formatAmount(numAmount) : '$0.00'} via Testnet Faucet
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-on-surface-variant mt-3">
            Testnet only — no real funds will be transferred
          </p>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ─── Send Mode ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="max-w-lg mx-auto w-full px-5 pt-6 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-primary">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-semibold text-[20px] text-on-surface">Send Money</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-5 space-y-5">
        {/* Amount Input */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5">
          <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
            Amount to Send
          </label>
          <div className="flex items-center gap-2 border-b-2 border-primary py-2">
            <span className="text-[28px] font-bold text-primary">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-[28px] font-bold bg-transparent border-none focus:ring-0 p-0 text-on-background placeholder:text-on-surface-variant/30"
            />
          </div>
        </div>

        {/* Split Routing Info */}
        {numAmount > 0 && (
          <div className="bg-secondary-container/20 p-4 rounded-2xl border border-secondary-container">
            <div className="flex items-center gap-3 mb-2">
              <Info size={18} className="text-secondary flex-shrink-0" />
              <p className="font-semibold text-sm text-secondary">Freelancing is unpredictable</p>
            </div>
            <p className="text-on-secondary-fixed-variant text-xs">
              Consider allocating a portion of this transfer to your rainy-day fund.
            </p>
          </div>
        )}

        {/* Split Manual Input */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[12px] font-bold uppercase tracking-wide text-on-surface-variant">
              Allocation
            </span>
            {numAmount > 0 && (
              <span className="text-[12px] font-bold text-primary">
                Total: {formatAmount(numAmount)}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* To Family */}
            <div>
              <label className="block text-[11px] text-on-surface-variant mb-1.5 font-medium">
                To Family (Send)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">$</span>
                <input
                  type="text"
                  value={familyAmountStr}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    setFamilyAmountStr(raw);
                    const val = parseFloat(raw) || 0;
                    if (numAmount > 0) {
                      const capped = Math.min(val, numAmount);
                      setSplitRatio(numAmount > 0 ? Math.round((capped / numAmount) * 100) : 100);
                      // Auto-balance savings
                      setSavingsAmountStr(Math.max(0, numAmount - capped).toFixed(2).replace(/\.00$/, ""));
                    }
                  }}
                  onFocus={() => { if (!familyAmountStr) setFamilyAmountStr(''); }}
                  onBlur={() => { if (!familyAmountStr) setFamilyAmountStr(familyAmount > 0 ? familyAmount.toString() : ''); }}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 pl-7 pr-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* To Savings */}
            <div>
              <label className="block text-[11px] text-on-surface-variant mb-1.5 font-medium">
                To Savings (Emergency Fund)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-secondary">$</span>
                <input
                  type="text"
                  value={savingsAmountStr}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    setSavingsAmountStr(raw);
                    const val = parseFloat(raw) || 0;
                    if (numAmount > 0) {
                      const capped = Math.min(val, numAmount);
                      setSplitRatio(numAmount > 0 ? Math.round(((numAmount - capped) / numAmount) * 100) : 0);
                      // Auto-balance family
                      setFamilyAmountStr(Math.max(0, numAmount - capped).toFixed(2).replace(/\.00$/, ""));
                    }
                  }}
                  onFocus={() => { if (!savingsAmountStr) setSavingsAmountStr(''); }}
                  onBlur={() => { if (!savingsAmountStr) setSavingsAmountStr(savingsAmount > 0 ? savingsAmount.toString() : ''); }}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 pl-7 pr-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                />
              </div>
            </div>

            {/* Quick ratio buttons */}
            <div className="flex gap-2 pt-1">
              {[{ label: '100% Send', val: 100 }, { label: '70/30', val: 70 }, { label: '50/50', val: 50 }, { label: '100% Save', val: 0 }].map(({ label, val }) => (
                <button
                  key={label}
                  onClick={() => {
                    setSplitRatio(val);
                    const fam = numAmount * (val / 100);
                    const sav = numAmount - fam;
                    setFamilyAmountStr(fam > 0 ? fam.toFixed(2).replace(/\.00$/, "") : '');
                    setSavingsAmountStr(sav > 0 ? sav.toFixed(2).replace(/\.00$/, "") : '');
                  }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${splitRatio === val ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Warning if amounts don't match */}
            {numAmount > 0 && Math.abs(parseFloat(familyAmountStr || '0') + parseFloat(savingsAmountStr || '0') - numAmount) > 0.01 && familyAmountStr && savingsAmountStr && (
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ Allocation doesn't match total ({formatAmount(parseFloat(familyAmountStr || '0') + parseFloat(savingsAmountStr || '0'))} vs {formatAmount(numAmount)})
              </p>
            )}
          </div>
        </div>{/* Recipient Selection */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5 space-y-4">
          <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Recipient
          </label>

          {/* Selected recipient chip */}
          {selectedRecipient ? (
            <div className="flex items-center gap-3 bg-primary/10 rounded-xl p-3 border border-primary/30">
              <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center text-sm font-bold">
                {selectedRecipient.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-on-surface truncate">{selectedRecipient.name}</p>
                <p className="text-[11px] text-on-surface-variant">{selectedRecipient.bankName} ••••{selectedRecipient.accountNumber.slice(-4)}</p>
              </div>
              <button
                onClick={() => setSelectedRecipient(null)}
                className="text-on-surface-variant text-xs hover:text-error font-medium"
              >
                Change
              </button>
            </div>
          ) : null}

          {/* Saved recipients as pill buttons */}
          {!showRecipientPicker && savedRecipients.length > 0 && !selectedRecipient && (
            <div>
              <p className="text-[11px] text-on-surface-variant mb-2 font-medium">Saved Recipients</p>
              <div className="flex flex-wrap gap-2">
                {savedRecipients.slice(0, 5).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRecipient(r)}
                    className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-full px-3 py-2 hover:bg-primary/10 hover:border-primary transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[11px] font-bold">
                      {r.name.charAt(0)}
                    </span>
                    <span className="text-xs font-semibold text-on-surface">{r.name}</span>
                    <span className="text-[10px] text-on-surface-variant">({r.bankName})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual entry toggle */}
          {!showRecipientPicker ? (
            <button
              onClick={() => setShowRecipientPicker(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-outline-variant rounded-xl text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              <UserPlus size={16} />
              Enter New Recipient Details
            </button>
          ) : (
            <div className="space-y-3 border-t border-surface-variant pt-4">
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient Name"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="relative">
                <select
                  value={recipientBank}
                  onChange={(e) => setRecipientBank(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer pr-10"
                >
                  <option value="">-- Select Bank / E-Wallet --</option>
                  <optgroup label="E-Wallets">
                    {['GoPay', 'OVO', 'DANA', 'LinkAja'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Banks">
                    {['BCA', 'BNI', 'Mandiri', 'BRI', 'BSI'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </optgroup>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-xs">▾</span>
              </div>

              <input
                type="text"
                value={recipientAccount}
                onChange={(e) => setRecipientAccount(e.target.value)}
                placeholder={
                  ['GoPay', 'OVO', 'DANA'].includes(recipientBank)
                    ? '08xxxxxxxxx'
                    : recipientBank
                      ? 'Enter account number'
                      : 'Select bank first, then enter account number'
                }
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRecipientPicker(false);
                    setSelectedRecipient(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant border border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowRecipientPicker(false)}
                  disabled={!recipientName || !recipientBank || !recipientAccount}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-primary press-effect disabled:opacity-40"
                >
                  ✓ Use This Recipient
                </button>
              </div>
            </div>
          )}
        </div>{/* Generate Button */}
        <button
          onClick={handleGenerateLink}
          disabled={!amount || numAmount <= 0 || isGenerating}
          className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg press-effect disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating on Stellar...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              Generate Magic Link
            </>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
