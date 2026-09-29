import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { SecurityLog } from '../types';
import { formatTimestamp } from '../utils/security';
import {
  ShieldAlert,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const SecurityAuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const pathForOnSnapshot = `users/${user.uid}/logs`;
    const logsRef = collection(db, 'users', user.uid, 'logs');
    const q = query(logsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: SecurityLog[] = [];
        snapshot.forEach((d) => {
          fetched.push(d.data() as SecurityLog);
        });
        // Sort newest first
        fetched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(fetched);
        setLoading(false);
      },
      (error) => {
        console.warn('Audit logs listener:', error);
        try {
          handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
        } catch {
          // Local fallback
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const getStatusIcon = (status: SecurityLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Security Audit Trail
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Chronological immutable access logs recording authentication sessions and protected vault activity.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
          <p className="text-xs">Fetching security telemetry...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No events recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Activity such as logins, vault entries, and credential changes will be logged here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-850/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {log.event}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        log.status === 'success'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : log.status === 'warning'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                      }`}
                    >
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{log.details}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                {formatTimestamp(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
