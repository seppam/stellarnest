import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '../components/ui/BottomNav';

type SettingPage = 'notifications' | 'security' | 'help' | 'privacy';

const SETTINGS: Record<SettingPage, { title: string; content: React.ReactNode }> = {
  notifications: {
    title: 'Notification Settings',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Choose how you want to be notified about your StellarNest activity.
        </p>
        {[
          { label: 'Push Notifications', desc: 'Get notified when money is sent or received', defaultOn: true },
          { label: 'Email Receipts', desc: 'Receive email confirmation for every transaction', defaultOn: true },
          { label: 'Marketing Updates', desc: 'Tips, new features, and Stellar ecosystem news', defaultOn: false },
          { label: 'Claim Reminders', desc: 'Remind me to claim pending transfers', defaultOn: true },
        ].map(({ label, desc, defaultOn }) => (
          <div key={label} className="flex items-center justify-between bg-white rounded-2xl border border-surface-variant p-4">
            <div>
              <p className="font-semibold text-sm text-on-surface">{label}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{desc}</p>
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
      </div>
    ),
  },
  security: {
    title: 'Security & PIN',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Protect your StellarNest wallet with additional security layers.
        </p>

        {/* Change PIN */}
        <div className="bg-white rounded-2xl border border-surface-variant p-5 space-y-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-on-surface-variant">Change PIN</p>
          <input
            type="password"
            placeholder="Current PIN"
            maxLength={6}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="New PIN (6 digits)"
            maxLength={6}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="w-full bg-primary-container text-white py-3 rounded-xl font-bold text-sm press-effect">
            Update PIN
          </button>
        </div>

        {/* Biometric */}
        <div className="bg-white rounded-2xl border border-surface-variant p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm text-on-surface">Device Authentication</p>
            <p className="text-[11px] text-on-surface-variant">Use WebAuthn (fingerprint, Face ID, or security key) on supported devices</p>
          </div>
          <label className="relative inline-flex cursor-pointer">
            <input type="checkbox" className="sr-only peer" disabled />
            <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full opacity-50 cursor-not-allowed" />
          </label>
        </div>
        <p className="text-[11px] text-on-surface-variant px-1">
          ℹ️ Requires HTTPS and compatible hardware (e.g., Touch ID on Mac, Windows Hello, Android fingerprint). Not available on all devices.
        </p>

        {/* Recovery Phrase */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-semibold text-sm text-amber-800">Recovery Phrase</p>
          <p className="text-[12px] text-amber-700 mt-1">
            Your Stellar secret key is stored locally. Never share it with anyone.
          </p>
          <button className="mt-3 text-sm font-bold text-amber-800 underline">
            View Secret Key
          </button>
        </div>
      </div>
    ),
  },
  help: {
    title: 'Help & Support',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Need help? Here are some quick answers and ways to reach us.
        </p>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-surface-variant divide-y divide-surface-variant">
          {[
            { q: 'How does Magic Claim Link work?', a: 'When you send money, we generate a unique link. Share it with your recipient — they can claim the funds by opening the link, no Stellar account needed.' },
            { q: 'What is Split-Routing?', a: 'Split-Routing automatically divides your transfer between family and savings. You control the ratio manually on the Send screen.' },
            { q: 'Is this real money?', a: 'This demo runs on Stellar Testnet with fake USDC. No real funds are involved. In production, this would use mainnet USDC.' },
            { q: 'How do I add funds?', a: 'Go to Dashboard → Deposit → Add Funds via Testnet Faucet. In production, you would deposit via bank transfer or card.' },
          ].map(({ q, a }) => (
            <details key={q} className="group p-4">
              <summary className="font-semibold text-sm text-on-surface cursor-pointer list-none flex justify-between items-center">
                {q}
                <span className="text-on-surface-variant group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-[13px] text-on-surface-variant mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-primary-container/10 rounded-2xl p-5 text-center">
          <p className="font-bold text-sm text-primary">Still need help?</p>
          <p className="text-[12px] text-on-surface-variant mt-1">
            Email us at support@stellarnest.app or join our Discord community.
          </p>
          <button className="mt-3 bg-primary-container text-white px-6 py-2.5 rounded-xl font-bold text-sm press-effect">
            Contact Support
          </button>
        </div>
      </div>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    content: (
      <div className="space-y-4 prose prose-sm">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Last updated: June 2026
        </p>

        <div className="bg-white rounded-2xl border border-surface-variant p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-on-surface mb-1">Data We Collect</h3>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              We collect only what is necessary to provide the service: your name, email address,
              Stellar public key, and transaction history. All data is stored locally on your device
              unless you opt into cloud backup via Firebase.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-on-surface mb-1">How We Use Your Data</h3>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              Your data is used to facilitate cross-border transfers, generate Proof of Income documents,
              and improve the app experience. We never sell your personal information to third parties.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-on-surface mb-1">Stellar Blockchain Transparency</h3>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              All transactions are recorded on the Stellar blockchain, which is publicly auditable.
              Your Stellar public key can be viewed on Stellar Explorer, but your personal identity
              (name, email) is never stored on-chain.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-on-surface mb-1">Your Rights</h3>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              You can export or delete all your data at any time from Profile → Security & PIN.
              Signing out clears all local storage.
            </p>
          </div>
        </div>
      </div>
    ),
  },
};

export default function Settings() {
  const { page = 'notifications' } = useParams<{ page?: string }>();
  const navigate = useNavigate();

  const setting = page as SettingPage;
  const config = SETTINGS[setting];

  if (!config) {
    return (
      <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto w-full flex flex-col items-center justify-center px-5">
        <p className="text-[24px] font-bold text-on-surface mb-2">Page Not Found</p>
        <button
          onClick={() => navigate('/profile')}
          className="mt-4 bg-primary-container text-white px-6 py-3 rounded-xl font-bold text-sm press-effect"
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-6 mb-6">
        <button onClick={() => navigate('/profile')} className="text-primary">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-[20px] text-on-surface">{config.title}</h2>
      </div>

      {/* Content */}
      <div className="px-5">
        {config.content}
      </div>

      <BottomNav />
    </div>
  );
}
