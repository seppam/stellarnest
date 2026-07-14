import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Settlement',
    desc: '3–5 second finality. No more waiting 3 business days.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: ShieldCheck,
    title: 'Near-Zero Fees',
    desc: 'Send $5 or $500. Always pay less than a cent.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Users,
    title: 'Magic Claim Link',
    desc: 'Recipients claim funds with one tap. No wallet needed.',
    color: 'bg-blue-100 text-blue-600',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Internet banking flow: visit bank → sign up / sign in → dashboard
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header — brand only, no nav links */}
      <header className="flex justify-between items-center px-5 pt-6 pb-4 max-w-lg mx-auto w-full">
        <span className="text-[20px] font-bold text-primary tracking-tight">StellarNest</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-end px-5 pb-10 max-w-lg mx-auto w-full">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-on-background mb-3">
          Send money home<br />instantly at zero cost.
        </h1>
        <p className="text-on-surface-variant text-[14px] leading-relaxed mb-8 max-w-sm">
          Empowering remote workers and migrant families with borderless financial freedom and smart savings tools.
        </p>

        {/* Feature pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-1">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="flex-shrink-0 bg-surface-container-low rounded-2xl p-4 w-36 border border-surface-variant"
            >
              <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-2`}>
                <Icon size={16} />
              </div>
              <p className="font-semibold text-xs text-on-surface leading-tight mb-1">{title}</p>
              <p className="text-[11px] text-on-surface-variant leading-snug">{desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleGetStarted}
          className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-[16px] shadow-lg press-effect flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
