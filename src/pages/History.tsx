import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import TransactionItem from '../components/features/TransactionItem';
import BottomNav from '../components/ui/BottomNav';

type Filter = 'all' | 'sent' | 'received';

export default function History() {
  const { transactions } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered =
    filter === 'all'
      ? transactions
      : transactions.filter((tx) =>
          filter === 'sent' ? tx.type === 'sent' : tx.type === 'received'
        );

  const handleTxClick = (txId: string) => {
    navigate(`/transaction/${txId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="max-w-lg mx-auto w-full px-5 pt-6 mb-4">
        <h2 className="font-semibold text-[24px] text-on-surface">Transaction History</h2>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-lg mx-auto w-full px-5 mb-6">
        <div className="flex bg-surface-container-low p-1 rounded-xl inline-flex w-full">
          {(['all', 'sent', 'received'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all capitalize ${
                filter === f
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="max-w-lg mx-auto w-full px-5 space-y-3 mb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="text-sm">No transactions yet.</p>
            <button
              onClick={() => navigate('/send')}
              className="mt-3 text-primary font-semibold text-sm"
            >
              Send your first transfer →
            </button>
          </div>
        ) : (
          filtered.map((tx) => (
            <button
              key={tx.id}
              onClick={() => handleTxClick(tx.id)}
              className="w-full text-left"
            >
              <TransactionItem tx={tx} />
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
