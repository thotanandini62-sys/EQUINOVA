import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'vault' | 'logs' | 'settings';
  setActiveTab: (tab: 'vault' | 'logs' | 'settings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, userProfile, logout, firestoreConnected } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-2">
                Equinova <span className="text-cyan-400 font-semibold text-xs px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60">Data Vault</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Protected Vault
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Audit Logs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Account &amp; Security
            </button>
          </nav>

          {/* Right User Bar & Sign Out */}
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auth Active</span>
            </div>

            {/* User Avatar & Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 p-0.5">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold text-slate-200">
                    {(userProfile?.displayName || user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {userProfile?.displayName || user?.displayName || 'User'}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[140px]">
                  {user?.email}
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-slate-850 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'vault' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vault
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Logs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};
