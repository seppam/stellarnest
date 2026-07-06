import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatAmount } from '../lib/stellar';
import BottomNav from '../components/ui/BottomNav';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions } = useApp();

  const tx = transactions.find((t) => t.id === id);

  const [copied, setCopied] = useState(false);

  if (!tx) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
        <p className="text-[24px] font-bold text-on-surface mb-2">Transaction Not Found</p>
        <p className="text-on-surface-variant text-sm mb-6">This transaction doesn't exist or was removed.</p>
        <button
          onClick={() => navigate('/history')}
          className="bg-primary-container text-white px-6 py-3 rounded-xl font-bold text-sm press-effect"
        >
          Back to History
        </button>
      </div>
    );
  }

  const isReceived = tx.type === 'received';

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const handleCopyTxHash = () => {
    const hash = tx.memo || tx.id;
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="max-w-lg mx-auto w-full px-5 pt-6 mb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-primary">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-semibold text-[20px] text-on-surface">Transaction Details</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-5 space-y-4">
        {/* Amount Card */}
        <div
          className={`rounded-3xl p-6 text-white shadow-md ${
            isReceived ? 'bg-secondary-container' : 'bg-primary-container'
          }`}
        >
          <p className="text-[12px] font-semibold tracking-wider uppercase opacity-80 mb-1">
            {isReceived ? 'Received' : 'Sent'}
          </p>
          <p className={`text-[36px] font-bold leading-none ${isReceived ? '' : ''}`}>
            {isReceived ? '+' : '-'}{formatAmount(tx.amountUSD)}
          </p>
          <p className="text-sm opacity-80 mt-1">{tx.status}</p>
        </div>

        {/* Counterparty */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5 space-y-3">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-on-surface-variant">
            Counterparty
          </h3>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isReceived ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-primary'
              }`}
            >
              {tx.counterpartyName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface">{tx.counterpartyName}</p>
              <p className="text-[11px] text-on-surface-variant">{tx.description}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5 space-y-4">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-on-surface-variant">
            Details
          </h3>

          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Type</span>
            <span className="text-sm font-semibold text-on-surface capitalize">{tx.type}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Status</span>
            <span
              className={`text-sm font-semibold capitalize ${
                tx.status === 'completed'
                  ? 'text-secondary'
                  : tx.status === 'pending'
                  ? 'text-amber-600'
                  : 'text-error'
              }`}
            >
              {tx.status}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Date & Time</span>
            <span className="text-sm font-semibold text-on-surface text-right max-w-[180px]">
              {formatDate(tx.timestamp)}
            </span>
          </div>

          <div className="border-t border-surface-variant pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Transaction ID / Memo</span>
              <button
                onClick={handleCopyTxHash}
                className={`p-2 rounded-lg transition-all ${
                  copied ? 'bg-secondary-container text-secondary' : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs font-mono text-on-surface-variant mt-1 break-all">
              {tx.memo || tx.id}
            </p>
            {copied && (
              <p className="text-xs text-secondary mt-1">✓ Copied!</p>
            )}
          </div>
        </div>

        {/* Network Info (for demo) */}
        <div className="bg-surface-container-low rounded-2xl p-4 flex gap-3">
          <ExternalLink size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-on-surface">Stellar Testnet</p>
            <p className="text-[11px] text-on-surface-variant">
              View on Stellar Explorer — available when connected to live testnet
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={() => navigate('/send?addFunds=true')}
            className="flex-1 bg-surface-container-low border border-outline-variant py-3 rounded-xl font-bold text-sm text-on-surface press-effect"
          >
            Send Again
          </button>
          <button
            onClick={() => navigate('/insights')}
            className="flex-1 bg-primary-container text-white py-3 rounded-xl font-bold text-sm press-effect"
          >
            View Report
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// useState import for the component
import { useState } from 'react';
