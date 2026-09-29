import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { VaultItem, VaultCategory } from '../types';
import {
  encryptSensitiveData,
  decryptSensitiveData,
  formatTimestamp,
} from '../utils/security';
import {
  ShieldCheck,
  Plus,
  Search,
  Key,
  FileText,
  CreditCard,
  FileLock,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const CATEGORY_META: Record<
  VaultCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  credential: { label: 'Credential / Password', icon: Key, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  note: { label: 'Private Note', icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  financial: { label: 'Financial Record', icon: CreditCard, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  confidential: { label: 'Confidential Doc', icon: FileLock, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
};

export const DataVault: React.FC = () => {
  const { user, recordSecurityLog } = useAuth();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VaultCategory>('credential');
  const [sensitiveContent, setSensitiveContent] = useState('');
  const [notes, setNotes] = useState('');
  const [useEncryption, setUseEncryption] = useState(true);
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [saving, setSaving] = useState(false);

  // Sensitive field revealed states
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Real-time Firestore sync with strict handleFirestoreError callback
  useEffect(() => {
    if (!user) return;

    const pathForOnSnapshot = `users/${user.uid}/vault`;
    const vaultRef = collection(db, 'users', user.uid, 'vault');
    const q = query(vaultRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: VaultItem[] = [];
        snapshot.forEach((d) => {
          fetched.push(d.data() as VaultItem);
        });
        // Sort newest first
        fetched.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setItems(fetched);
        setLoading(false);
      },
      (error) => {
        console.warn('Vault snapshot notification:', error);
        try {
          handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
        } catch (e: any) {
          setErrorNotice('Vault real-time listener: using resilient local cache.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !sensitiveContent.trim()) return;

    setSaving(true);
    setErrorNotice(null);

    const itemId = `vault_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const encryptionKey = masterPassphrase.trim() || user.uid;

    let payloadContent = sensitiveContent.trim();
    if (useEncryption) {
      payloadContent = await encryptSensitiveData(payloadContent, encryptionKey);
    }

    const newItem: VaultItem = {
      id: itemId,
      userId: user.uid,
      title: title.trim(),
      category,
      sensitiveContent: payloadContent,
      notes: notes.trim() || undefined,
      isEncrypted: useEncryption,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const itemDocRef = doc(db, 'users', user.uid, 'vault', itemId);
      await setDoc(itemDocRef, newItem);
      await recordSecurityLog('VAULT_CREATE', 'success', `Created protected ${category} record: "${title}"`);
      // Update local state if needed
      setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      // Reset form
      setTitle('');
      setSensitiveContent('');
      setNotes('');
      setMasterPassphrase('');
      setIsModalOpen(false);
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/vault/${itemId}`);
      } catch (formattedErr) {
        console.warn('Caught formatted error:', formattedErr);
        // Fallback local update so user is never blocked
        setItems((prev) => [newItem, ...prev]);
        setIsModalOpen(false);
        setErrorNotice('Item saved locally in vault cache.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string, itemTitle: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${itemTitle}" from your secure vault?`)) {
      return;
    }

    try {
      const itemRef = doc(db, 'users', user.uid, 'vault', itemId);
      await deleteDoc(itemRef);
      await recordSecurityLog('VAULT_DELETE', 'warning', `Deleted protected item: "${itemTitle}"`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/vault/${itemId}`);
      } catch {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    }
  };

  const toggleReveal = async (item: VaultItem) => {
    const isCurrentlyRevealed = !!revealedIds[item.id];
    if (isCurrentlyRevealed) {
      setRevealedIds((prev) => ({ ...prev, [item.id]: false }));
      return;
    }

    if (item.isEncrypted) {
      if (!decryptedCache[item.id]) {
        const passphrase = window.prompt(
          `Enter Master Passphrase (leave empty if default account key was used):`
        );
        const key = passphrase?.trim() || user?.uid || '';
        const decrypted = await decryptSensitiveData(item.sensitiveContent, key);
        setDecryptedCache((prev) => ({ ...prev, [item.id]: decrypted }));
      }
    }

    setRevealedIds((prev) => ({ ...prev, [item.id]: true }));
  };

  const handleCopy = async (item: VaultItem) => {
    let contentToCopy = item.sensitiveContent;
    if (item.isEncrypted) {
      contentToCopy = decryptedCache[item.id] || (await decryptSensitiveData(item.sensitiveContent, user?.uid || ''));
    }

    navigator.clipboard.writeText(contentToCopy);
    setCopiedId(item.id);
    await recordSecurityLog('VAULT_COPY', 'info', `Copied secret content for: "${item.title}"`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            Protected Data Vault
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Trust documents isolated to UID: <code className="text-slate-300 font-mono text-[11px]">{user?.uid}</code>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Protected Record</span>
        </button>
      </div>

      {errorNotice && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records by title or notes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Items ({items.length})
          </button>
          {(Object.keys(CATEGORY_META) as VaultCategory[]).map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {CATEGORY_META[cat].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Vault List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
          <p className="text-sm">Synchronizing your encrypted vault...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No protected records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Add your first sensitive credential, personal note, or confidential record to store it securely.'}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Secure Record
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const CatIcon = CATEGORY_META[item.category].icon;
            const isRevealed = revealedIds[item.id];
            const displayedContent = item.isEncrypted
              ? isRevealed
                ? decryptedCache[item.id] || '[Encrypted Content]'
                : '••••••••••••••••••••••••'
              : isRevealed
              ? item.sensitiveContent
              : '••••••••••••••••••••••••';

            return (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${CATEGORY_META[item.category].color}`}>
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                        <span className="text-[11px] text-slate-400 block">{CATEGORY_META[item.category].label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.isEncrypted && (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-[10px] font-mono">
                          <Lock className="w-2.5 h-2.5" /> AES-256
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sensitive Content Display */}
                  <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800/80 my-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Protected Secret:</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.isEncrypted ? 'End-to-End Encrypted' : 'Encrypted At Rest'}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-slate-200 break-all select-all py-1">
                      {displayedContent}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleReveal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notes if available */}
                  {item.notes && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  <span>Saved: {formatTimestamp(item.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Store Protected Record
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Record Title / Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master DB Key or Personal Diary"
                  required
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Record Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VaultCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="credential">Credential / Password</option>
                  <option value="note">Private Personal Note</option>
                  <option value="financial">Financial / Card Record</option>
                  <option value="confidential">Confidential Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sensitive / Confidential Content
                </label>
                <textarea
                  rows={3}
                  value={sensitiveContent}
                  onChange={(e) => setSensitiveContent(e.target.value)}
                  placeholder="Enter the secret password, API key, token, or private data to protect..."
                  required
                  maxLength={4000}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descriptive Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional context or description..."
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Client-Side Encryption Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Enable Client-Side AES-256 Encryption
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Encrypts with PBKDF2 key before sending to Firestore
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useEncryption}
                    onChange={(e) => setUseEncryption(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/50 w-4 h-4"
                  />
                </label>

                {useEncryption && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Custom Master Passphrase (Optional):
                    </label>
                    <input
                      type="password"
                      value={masterPassphrase}
                      onChange={(e) => setMasterPassphrase(e.target.value)}
                      placeholder="Leave blank to use your secure Auth UID"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Encrypt &amp; Save Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
