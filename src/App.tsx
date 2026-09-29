/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ShieldCheck } from 'lucide-react';

function AppContent() {
  const { user, authReady, loading } = useAuth();

  if (!authReady || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl">
            <ShieldCheck className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-base font-semibold text-slate-200">Equinova Secure Auth</h2>
        <p className="text-xs text-slate-500 mt-1">Establishing secure identity session...</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
