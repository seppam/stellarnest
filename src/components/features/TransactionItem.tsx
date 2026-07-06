import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatAmount } from '../../lib/stellar';

interface TransactionItemProps {
  tx: Transaction;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TransactionItem({ tx }: TransactionItemProps) {
  const isReceived = tx.type === 'received';

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-variant hover:shadow-sm transition-shadow cursor-pointer">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isReceived
            ? 'bg-secondary-container text-on-secondary-container'
            : 'bg-surface-container-high text-primary'
        }`}
      >
        {isReceived ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface truncate">{tx.counterpartyName}</p>
        <p className="text-[12px] font-semibold text-on-surface-variant tracking-wide uppercase mt-0.5">
          {formatDate(tx.timestamp)}
        </p>
      </div>

      {/* Amount */}
      <p
        className={`font-bold text-sm whitespace-nowrap ${
          isReceived ? 'text-secondary' : 'text-on-surface'
        }`}
      >
        {isReceived ? '+' : '-'}{formatAmount(tx.amountUSD)}
      </p>
    </div>
  );
}
