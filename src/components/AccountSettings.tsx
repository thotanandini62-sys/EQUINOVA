import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig } from '../firebase';
import { formatTimestamp } from '../utils/security';
import {
  User,
  Shield,
  Key,
  Mail,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Code,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const {
    user,
    userProfile,
    resendVerificationEmail,
    resetPassword,
    updateUserDisplayName,
    recordSecurityLog,
    refreshUserProfile,
  } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [updatingName, setUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [resetSent, setResetSent] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setUpdatingName(true);
    setNameSuccess(false);
    try {
      await updateUserDisplayName(displayName.trim());
      await recordSecurityLog('PROFILE_UPDATE', 'info', `Updated display name to: "${displayName.trim()}"`);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingName(false);
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      await recordSecurityLog('PASSWORD_RESET_DISPATCHED', 'info', `Password reset email dispatched to ${user.email}`);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      alert(`Could not send reset email: ${err.message}`);
    }
  };

  const handleSendVerify = async () => {
    try {
      await resendVerificationEmail();
      await recordSecurityLog('EMAIL_VERIFICATION_SENT', 'info', `Email verification link requested for ${user?.email}`);
      setVerifySent(true);
      setTimeout(() => setVerifySent(false), 5000);
    } catch (err: any) {
      alert(`Could not send verification email: ${err.message}`);
    }
  };

  const handleReloadUser = async () => {
    setRefreshing(true);
    await refreshUserProfile();
    setRefreshing(false);
  };

  const isGoogleUser = user?.providerData.some((p) => p.providerId === 'google.com');

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-400" />
          User Profile &amp; Authentication Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Edit Name Form */}
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Primary Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updatingName}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                {updatingName ? 'Saving...' : 'Save Profile Changes'}
              </button>
              {nameSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Updated successfully!
                </span>
              )}
            </div>
          </form>

          {/* Right: Security & Verification Badges */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Email Verification:</span>
              <div className="flex items-center gap-2">
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Pending Verification
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleReloadUser}
                  title="Check latest status"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {!user?.emailVerified && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300/90 space-y-2">
                <p>
                  A confirmation link was sent to your email. Click it to verify your identity and protect against unauthorized account modifications.
                </p>
                <button
                  type="button"
                  onClick={handleSendVerify}
                  disabled={verifySent}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifySent ? 'Verification Link Resent!' : 'Resend Verification Email'}
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Auth Identity Provider:</span>
                <span className="text-slate-200 font-medium">
                  {isGoogleUser ? 'Google OAuth 2.0' : 'Email & Password'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Firebase User UID:</span>
                <span className="text-slate-300 font-mono text-[11px] select-all">
                  {user?.uid}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Created:</span>
                <span className="text-slate-300">
                  {formatTimestamp(user?.metadata.creationTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Sign In:</span>
                <span className="text-slate-300">
                  {formatTimestamp(user?.metadata.lastSignInTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-indigo-400" />
          Password &amp; Credentials Recovery
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Initiate a cryptographically signed password reset token dispatched directly to your registered email address.
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSendReset}
            disabled={resetSent}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {resetSent ? 'Reset Email Dispatched!' : 'Send Password Reset Email'}
          </button>
          {resetSent && (
            <span className="text-xs text-emerald-400">
              Check your inbox for the reset link!
            </span>
          )}
        </div>
      </div>

      {/* Zero-Trust Architecture & Data Protection Blueprint */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Security Architecture &amp; Data Protection Blueprint
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-400" /> 1. Client-Side Encryption
            </div>
            <p className="text-slate-400 leading-relaxed">
              AES-GCM (256-bit) with PBKDF2 (100,000 iterations) encrypts payload strings before transmission, rendering the data unreadable to untrusted intermediaries.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-400" /> 2. Zero-Trust Firestore Rules
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every document path is bound to <code className="text-slate-200 font-mono">users/&#123;userId&#125;</code> and rejects any request where <code className="text-slate-200 font-mono">request.auth.uid != userId</code>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> 3. Immutable Security Logs
            </div>
            <p className="text-slate-400 leading-relaxed">
              Critical operations (logins, secrets generation, credential copies) generate append-only audit trail logs for tamper-evident activity monitoring.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between text-xs text-slate-400">
          <div>
            Connected Firebase Project: <strong className="text-slate-200 font-mono">{firebaseConfig.projectId}</strong>
          </div>
          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            Firebase Console <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
