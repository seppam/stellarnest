import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, LogOut, Key, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatPublicKey, formatAmount } from '../lib/stellar';
import BottomNav from '../components/ui/BottomNav';

export default function Profile() {
  const { user, signOut } = useApp();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    if (!user?.stellarPublicKey) return;
    navigator.clipboard.writeText(user.stellarPublicKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSignOut = () => {
    if (window.confirm('Sign out? Your local data will be cleared.')) {
      signOut();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="px-5 pt-6 mb-6">
        <h2 className="font-semibold text-[24px] text-on-surface">Profile</h2>
      </div>

      <div className="px-5 space-y-4">
        {/* Avatar & Name */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[18px] text-on-surface truncate">{user?.name ?? 'User'}</p>
            <p className="text-sm text-on-surface-variant">{user?.email ?? ''}</p>
          </div>
        </div>

        {/* Stellar Wallet */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-primary" />
            <p className="text-[12px] font-bold uppercase tracking-wide text-on-surface-variant">
              Stellar Wallet
            </p>
          </div>

          <p className="text-[11px] text-on-surface-variant mb-1">Public Key</p>
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl p-3 mb-4">
            <p className="flex-1 text-xs font-mono text-on-surface truncate">
              {user?.stellarPublicKey ? formatPublicKey(user.stellarPublicKey) : '\u2014'}
            </p>
            <button
              onClick={handleCopyKey}
              className={`p-2 rounded-lg flex-shrink-0 transition-all ${
                copied ? 'bg-secondary-container text-secondary' : 'bg-primary-container text-white'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <p className="text-[11px] text-on-surface-variant mb-1">Emergency Fund Balance</p>
          <p className="text-[24px] font-bold text-primary">
            {formatAmount(user?.emergencyFundBalanceUSD ?? 0)}
          </p>
        </div>

        {/* Saved Bank */}
        <button
          onClick={() => navigate("/settings/bank")}
          className="w-full bg-white rounded-2xl border border-surface-variant p-5 flex justify-between items-center text-left hover:bg-surface-container-low transition-colors"
        >
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                Saved Bank / E-Wallet
              </p>
              <p className="font-semibold text-sm text-on-surface">
                {user?.savedLocalBank
                  ? user.savedLocalBank.bankName + ' \u2022\u2022\u2022' + user.savedLocalBank.accountNumber.slice(-4)
                  : 'No bank saved yet'}
              </p>
            </div>
            <ChevronRight size={18} className="text-on-surface-variant" />
          </button>

        {/* Menu Items */}
        {[
          { label: 'Notification Settings', onClick: () => navigate('/settings/notifications') },
          { label: 'Security & PIN', onClick: () => navigate('/settings/security') },
          { label: 'Help & Support', onClick: () => navigate('/settings/help') },
          { label: 'Privacy Policy', onClick: () => navigate('/settings/privacy') },
        ].map(({ label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full bg-white rounded-2xl border border-surface-variant p-4 flex justify-between items-center text-left hover:bg-surface-container-low transition-colors"
          >
            <span className="font-semibold text-sm text-on-surface">{label}</span>
            <ChevronRight size={18} className="text-on-surface-variant" />
          </button>
        ))}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-error-container text-on-error-container rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-sm press-effect"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <p className="text-center text-[11px] text-on-surface-variant">
          StellarNest v1.0 \u2014 Hackathon Demo (Testnet only)
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
