import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
export default function AuthModal() {
  const {
    closeAuthModal,
    signInWithGoogle,
    renderGoogleButton,
    signInAsGuest,
    authError,
    googleClientId,
  } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  useEffect(() => {
    if (!showGuestForm && googleClientId) {
      const timer = setTimeout(() => {
        renderGoogleButton('google-signin-button');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showGuestForm, googleClientId, renderGoogleButton]);
  const handleGoogle = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
    }
    setIsSigningIn(false);
  };
  const handleGuest = () => {
    if (!guestName.trim()) return;
    signInAsGuest(guestName.trim(), guestEmail.trim());
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-slide-up">
      {}
      <div className="relative w-full max-w-md mx-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-3xl shadow-2xl overflow-hidden">
        {}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
        {}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-full transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>
        {}
        <div className="px-8 pt-8 pb-6">
          {}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-[var(--color-accent-glow)]">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
              Welcome to Axon
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Sign in to save your chat history & unlock all features
            </p>
          </div>
          {}
          {authError && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-400">{authError}</p>
            </div>
          )}
          {}
          {!showGuestForm ? (
            <div className="space-y-3">
              {}
              <button
                onClick={handleGoogle}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--color-border-input)] bg-white/5 hover:bg-white/10 text-[var(--color-text-primary)] font-medium text-sm transition-all hover:shadow-lg hover:border-blue-500/30 disabled:opacity-50 group"
                id="google-signin-custom-button"
              >
                {isSigningIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Continue with Google</span>
                <span className="text-[10px] text-[var(--color-text-tertiary)] group-hover:text-blue-400 transition-colors">
                  — select your Gmail account
                </span>
              </button>
              {}
              <div
                id="google-signin-button"
                className="flex justify-center"
                style={{ minHeight: '0px' }}
              />
              {}
              <div className="mt-2 p-3 rounded-xl bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border-primary)]">
                <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-2">What you get with Google Sign-In:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    '☁️ Synced chat history',
                    '🔒 Secure authentication',
                    '🎨 Personalised experience',
                    '📱 Cross-device access',
                  ].map((feature) => (
                    <p key={feature} className="text-[10px] text-[var(--color-text-tertiary)]">
                      {feature}
                    </p>
                  ))}
                </div>
              </div>
              {}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
                <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
              </div>
              {}
              <button
                onClick={() => setShowGuestForm(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border-input)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium text-sm transition-all"
              >
                <Mail className="w-5 h-5" />
                Continue as Guest
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 ml-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border-input)] text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  autoFocus
                />
              </div>
              {}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 ml-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border-input)] text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleGuest()}
                />
              </div>
              {}
              <button
                onClick={handleGuest}
                disabled={!guestName.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <UserIcon className="w-4 h-4" />
                Get Started
              </button>
              {}
              <button
                onClick={() => setShowGuestForm(false)}
                className="w-full text-center text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors mt-1"
              >
                ← Back to Google Sign-In
              </button>
            </div>
          )}
        </div>
        {}
        <div className="px-8 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]/50">
          <p className="text-center text-[10px] text-[var(--color-text-tertiary)]">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}