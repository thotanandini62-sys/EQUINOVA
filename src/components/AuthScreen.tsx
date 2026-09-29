import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFriendlyAuthErrorMessage, firebaseConfig } from '../firebase';
import { evaluatePasswordStrength } from '../utils/security';
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  ShieldAlert,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ title: string; message: string; actionGuide?: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordStrength = evaluatePasswordStrength(password);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorInfo({ title: 'Email Required', message: 'Please enter your email address.' });
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        await resetPassword(email);
        setSuccessMessage(`Password reset link sent to ${email}. Please check your inbox or spam folder.`);
      } catch (err: any) {
        setErrorInfo(getFriendlyAuthErrorMessage(err.code || err.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorInfo({ title: 'Password Required', message: 'Please enter your password.' });
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorInfo({ title: 'Passwords Mismatch', message: 'The entered passwords do not match. Please verify.' });
        return;
      }
      if (passwordStrength.score < 2) {
        setErrorInfo({
          title: 'Password Too Weak',
          message: 'Please choose a stronger password with at least 8 characters, combining uppercase, numbers, and symbols.',
        });
        return;
      }
      if (!acceptTerms) {
        setErrorInfo({ title: 'Consent Required', message: 'Please accept the data protection and security agreement.' });
        return;
      }

      try {
        setLoading(true);
        await registerWithEmail(email, password, displayName.trim());
        setSuccessMessage('Account created successfully! Verification email has been dispatched.');
      } catch (err: any) {
        setErrorInfo(getFriendlyAuthErrorMessage(err.code || err.message));
      } finally {
        setLoading(false);
      }
    } else {
      // Login
      try {
        setLoading(true);
        await loginWithEmail(email, password);
      } catch (err: any) {
        setErrorInfo(getFriendlyAuthErrorMessage(err.code || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorInfo(null);
    setSuccessMessage(null);
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      setErrorInfo(getFriendlyAuthErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-950/40 via-blue-950/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-40 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Shield Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/20 mb-4 ring-1 ring-white/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Equinova Secure Auth
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Zero-Trust Identity Authentication &amp; Encrypted Data Protection
        </p>

        {/* Security badge pills */}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-xs">
          <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Project: <strong className="text-slate-100">{firebaseConfig.projectId}</strong>
          </span>
          <span className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
            <ShieldAlert className="w-3 h-3 text-indigo-400" />
            AES-256 / SHA-256
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 shadow-2xl rounded-2xl p-6 sm:p-8">
          {/* Auth Navigation Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorInfo(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorInfo(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert Display */}
          {errorInfo && (
            <div className="mb-5 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-rose-100">{errorInfo.title}</h4>
                  <p className="text-xs text-rose-300 leading-relaxed">{errorInfo.message}</p>
                  {errorInfo.actionGuide && (
                    <div className="mt-2 pt-2 border-t border-rose-800/50 text-xs text-amber-200 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{errorInfo.actionGuide}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Alert Display */}
          {successMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-100">Notice</h4>
                  <p className="text-xs text-emerald-300">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Third-Party Google Authentication Button */}
          {mode !== 'forgot' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium text-sm transition-all shadow-sm hover:border-slate-600 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
                    Or with email credentials
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main Credentials Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    maxLength={60}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorInfo(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter (Register Mode) */}
                {mode === 'register' && password.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Password Security:</span>
                      <span
                        className={`font-semibold ${
                          passwordStrength.score >= 3
                            ? 'text-emerald-400'
                            : passwordStrength.score === 2
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-all duration-300 ${
                            passwordStrength.score >= step
                              ? passwordStrength.color
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Criteria checklist */}
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {passwordStrength.checks.minLength ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>8+ Characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordStrength.checks.hasUppercase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>Uppercase Letter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordStrength.checks.hasNumber ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>Number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordStrength.checks.hasSpecial ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>Special Symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Passwords do not match
                  </p>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/50"
                  />
                  <span>
                    I acknowledge that personal vault data will be isolated per owner and protected under Zero-Trust Firestore Security Rules.
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <span>Sign In Safely</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'register' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Register &amp; Secure Account</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Password Reset Email</span>
                </>
              )}
            </button>
          </form>

          {/* Forgot Password back to login */}
          {mode === 'forgot' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorInfo(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                &larr; Back to Sign In
              </button>
            </div>
          )}

          {/* Quick Firebase Auth info card */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Firebase Auth Engine:</span>
              <span className="text-slate-300 font-mono text-[11px]">v10.x Web SDK</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Data Protection:</span>
              <span className="text-emerald-400 font-medium">ABAC Isolation + PBKDF2</span>
            </div>
          </div>
        </div>

        {/* Firebase Console Helper for User */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="text-slate-200 font-semibold">Firebase Project:</span> {firebaseConfig.projectId}.
            Make sure <strong>Email/Password</strong> and <strong>Google</strong> are enabled under <em>Authentication &gt; Sign-in method</em> in your{' '}
            <a
              href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 ml-1"
            >
              Firebase Console <ExternalLink className="w-2.5 h-2.5" />
            </a>.
          </div>
        </div>
      </div>
    </div>
  );
};
