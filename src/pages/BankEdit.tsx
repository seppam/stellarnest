import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import BottomNav from '../components/ui/BottomNav';

export default function BankEdit() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useApp();

  const [bankName, setBankName] = useState(user?.savedLocalBank?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(user?.savedLocalBank?.accountNumber ?? '');
  const [accountHolder, setAccountHolder] = useState(user?.savedLocalBank?.accountHolder ?? '');
  const [saved, setSaved] = useState(false);

  const hasExisting = !!(user?.savedLocalBank?.bankName && user?.savedLocalBank?.accountNumber);

  const handleSave = () => {
    if (!bankName || !accountNumber) return;

    updateUserProfile({
      savedLocalBank: {
        bankName,
        accountNumber,
        accountHolder: accountHolder || user?.name || '',
      },
    });

    setSaved(true);
    setTimeout(() => navigate('/profile'), 1200);
  };

  const handleDelete = () => {
    if (window.confirm('Remove this bank account?')) {
      updateUserProfile({ savedLocalBank: undefined });
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-6 mb-6">
        <button onClick={() => navigate('/profile')} className="text-primary">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-[20px] text-on-surface">Saved Bank / E-Wallet</h2>
      </div>

      <div className="px-5 space-y-5">
        {/* Info */}
        <div className="bg-surface-container-low rounded-2xl p-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Save your local bank or e-wallet account for faster transfers.
            This is where your family will receive funds when they claim a Magic Link.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5 space-y-4">
          {/* Account Holder Name */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Full name as registered at the bank"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Bank / E-Wallet Selection */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
              Bank or E-Wallet
            </label>
            <div className="relative">
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-10"
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
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
              Account Number / Phone Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={
                ['GoPay', 'OVO', 'DANA'].includes(bankName)
                  ? '08xxxxxxxxxx'
                  : 'Enter account number'
              }
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!bankName || !accountNumber}
            className="w-full bg-primary-container text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 press-effect disabled:opacity-40"
          >
            {saved ? (
              <>✓ Saved!</>
            ) : (
              <>
                <Save size={18} />
                Save Bank Details
              </>
            )}
          </button>

          {/* Delete (only if existing) */}
          {hasExisting && (
            <button
              onClick={handleDelete}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-error hover:bg-error-container transition-colors"
            >
              <Trash2 size={16} />
              Remove Saved Bank
            </button>
          )}
        </div>

        <p className="text-[11px] text-on-surface-variant text-center px-4">
          Your bank details are stored locally on this device only and are never shared with third parties.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
