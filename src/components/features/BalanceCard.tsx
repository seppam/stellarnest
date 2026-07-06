import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus } from 'lucide-react';
import { formatAmount } from '../../lib/stellar';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-primary-container rounded-3xl p-6 text-white mb-6 shadow-md relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-16 -mt-16" />

      <p className="text-on-primary-container opacity-80 text-[12px] font-semibold tracking-wider uppercase mb-1">
        Total Balance
      </p>
      <h3 className="text-[36px] font-bold leading-none tracking-tight mb-6">
        {formatAmount(balance)}
      </h3>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/send')}
          className="flex-1 bg-white text-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 press-effect shadow-sm"
        >
          <ArrowUpRight size={18} />
          Send
        </button>
        <button
          onClick={() => navigate('/send?addFunds=true')}
          className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm border border-white/20 flex items-center justify-center gap-2 press-effect"
        >
          <Plus size={18} />
          Deposit
        </button>
      </div>
    </div>
  );
}
