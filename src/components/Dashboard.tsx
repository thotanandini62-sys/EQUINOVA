import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';
import { DataVault } from './DataVault';
import { SecurityAuditLogs } from './SecurityAuditLogs';
import { AccountSettings } from './AccountSettings';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertTriangle,
  Key,
  Shield,
  Activity,
  CheckCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, userProfile, resendVerificationEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<'vault' | 'logs' | 'settings'>('vault');
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const handleResend = async () => {
    try {
      await resendVerificationEmail();
      setResendNotice('Verification email dispatched! Please check your inbox.');
      setTimeout(() => setResendNotice(null), 4000);
    } catch (e: any) {
      setResendNotice('Error sending verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Verification Warning Banner if Email is not verified */}
        {user && !user.emailVerified && (
          <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-800/70 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-100 block text-sm">
                  Email Verification Incomplete
                </span>
                <span className="text-amber-300/90">
                  Verify <strong className="text-amber-100">{user.email}</strong> to activate full Zero-Trust write permissions and identity recovery.
                </span>
                {resendNotice && (
                  <span className="block mt-1 font-semibold text-emerald-400">{resendNotice}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleResend}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer self-start sm:self-auto"
            >
              Resend Verification
            </button>
          </div>
        )}

        {/* Security Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Auth Status */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Authentication Status</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active Session
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                UID: {user?.uid.substring(0, 12)}...
              </div>
            </div>
          </div>

          {/* Card 2: Data Protection */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Data Vault Protection</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                AES-256 + ABAC
              </div>
              <div className="text-[10px] text-slate-500">Zero-Trust rules active</div>
            </div>
          </div>

          {/* Card 3: Identity Verification */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Account Integrity</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                {user?.emailVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Verified
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Card 4: Audit Activity */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Security Telemetry</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">Audit Logging</div>
              <div className="text-[10px] text-slate-500">Tamper-evident logs</div>
            </div>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'vault' && <DataVault />}
        {activeTab === 'logs' && <SecurityAuditLogs />}
        {activeTab === 'settings' && <AccountSettings />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          Equinova Secure Platform &bull; Firebase Authentication &amp; Firestore Data Isolation &bull; End-to-End Protection
        </p>
      </footer>
    </div>
  );
};
