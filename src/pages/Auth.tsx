import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { signUp, signIn, sendPasswordReset } from '../lib/services/auth.service';

type AuthMode = 'signin' | 'signup';

export default function Auth() {
  const { signIn: localSignIn } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        // Create Firebase auth account
        const authUser = await signUp(email, password, name);
        await localSignIn(name, authUser.email);
      } else {
        // Sign in with Firebase
        const authUser = await signIn(email, password);
        const displayName = authUser.displayName || email.split('@')[0];
        await localSignIn(displayName, authUser.email);
      }
      navigate('/dashboard');
    } catch (err: any) {
      // Handle Firebase auth errors
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in instead.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email. Sign up first.');
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password. Try again.');
      } else {
        console.error('Auth error:', err);
        setError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setError('✓ Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {/* Brand */}
        <span className="text-[20px] font-bold text-primary mb-8 block">StellarNest</span>

        {/* Tab Toggle */}
        <div className="flex bg-surface-container-low p-1 rounded-xl mb-8">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
              mode === 'signin'
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
              mode === 'signup'
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Heading */}
        <h2 className="text-[24px] font-semibold tracking-tight text-on-background mb-1">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-on-surface-variant text-sm mb-8">
          {mode === 'signin'
            ? 'Sign in to continue your global journey.'
            : 'Start sending money at near-zero cost today.'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-[12px] font-semibold tracking-wide uppercase text-on-surface-variant mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rizky Pratama"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold tracking-wide uppercase text-on-surface-variant mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rizky@email.com"
              autoComplete="email"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold tracking-wide uppercase text-on-surface-variant mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-[11px] text-on-surface-variant mt-1.5">Minimum 6 characters</p>
            )}
          </div>

          {error && (
            <div className="bg-error-container/30 border border-error/30 rounded-xl px-4 py-3">
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 press-effect disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
              </>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Forgot password */}
        {mode === 'signin' && (
          <p className="text-center text-on-surface-variant text-sm mt-4">
            Forgot password?{' '}
            <button type="button" className="text-primary font-semibold" onClick={handleForgotPassword}>
              Reset
            </button>
          </p>
        )}

        {/* Note */}
        <p className="text-center text-[11px] text-on-surface-variant mt-6 leading-relaxed">
          By continuing, you agree to StellarNest's Terms of Service.
          Your data is secured by Firebase Authentication & Firestore.
        </p>

        {/* Demo notice */}
        <p className="text-center text-[10px] text-primary/60 mt-3 font-medium">
          🔥 Hackathon Demo — Powered by Firebase
        </p>
      </div>
    </div>
  );
}
