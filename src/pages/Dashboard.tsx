import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatPublicKey } from '../lib/stellar';
import BalanceCard from '../components/features/BalanceCard';
import TransactionItem from '../components/features/TransactionItem';
import BottomNav from '../components/ui/BottomNav';

export default function Dashboard() {
  const { user, transactions } = useApp();
  const navigate = useNavigate();

  const totalBalance = user?.emergencyFundBalanceUSD ?? 0;
  const recentTxs = transactions.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-5 py-4 bg-background sticky top-0 z-10 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm text-on-surface">
              Hi, {user?.name?.split(' ')[0] ?? 'there'}! 👋
            </p>
            <p className="text-[11px] text-on-surface-variant font-mono">
              {user?.stellarPublicKey ? formatPublicKey(user.stellarPublicKey) : '—'}
            </p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
          <Bell size={18} className="text-on-surface-variant" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="px-5 pt-2 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Balance Card */}
        <BalanceCard balance={totalBalance} />

        {/* Pending Claims Alert */}
        <div
          onClick={() => navigate('/history')}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 cursor-pointer hover:shadow-sm transition-shadow"
        >
          <p className="text-amber-800 font-semibold text-sm">💰 Pending Claim Received</p>
          <p className="text-amber-600 text-xs mt-1">
            You have a pending transfer waiting to be claimed.
          </p>
        </div>

        {/* Recent Activity */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-[20px] text-on-surface">Recent Activity</h4>
          <button
            onClick={() => navigate('/history')}
            className="text-primary text-[12px] font-semibold"
          >
            See all
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant">
            <p className="text-sm">No transactions yet.</p>
            <button
              onClick={() => navigate('/send')}
              className="mt-2 text-primary font-semibold text-sm"
            >
              Send your first transfer →
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {recentTxs.map((tx) => (
              <button
                key={tx.id}
                onClick={() => navigate(`/transaction/${tx.id}`)}
                className="w-full text-left"
              >
                <TransactionItem tx={tx} />
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
