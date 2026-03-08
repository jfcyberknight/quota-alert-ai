import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const PROVIDERS = [
  { id: 'openai',    label: 'OpenAI',    icon: '🤖', color: '#10a37f', twText: 'text-[#10a37f]', twBg: 'bg-[#10a37f]/10', twBorder: 'border-[#10a37f]/20' },
  { id: 'anthropic', label: 'Anthropic', icon: '🧠', color: '#c96442', twText: 'text-[#c96442]', twBg: 'bg-[#c96442]/10', twBorder: 'border-[#c96442]/20' },
  { id: 'gemini',    label: 'Gemini',    icon: '✨', color: '#4285f4', twText: 'text-[#4285f4]', twBg: 'bg-[#4285f4]/10', twBorder: 'border-[#4285f4]/20' },
];

const GUIDE = [
  {
    id: 'openai', label: 'OpenAI', icon: '🤖', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
    steps: [
      { label: 'Accéder à', link: 'https://platform.openai.com/api-keys', text: 'platform.openai.com/api-keys' },
      { label: 'Créer une clé avec accès "All" (ou au minimum "Billing")' },
      { label: 'Coller la clé dans le formulaire ci-dessus' },
    ],
    note: 'Les quotas nécessitent un compte avec facturation activée.',
  },
  {
    id: 'anthropic', label: 'Anthropic', icon: '🧠', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20',
    steps: [
      { label: 'Accéder à', link: 'https://console.anthropic.com/settings/keys', text: 'console.anthropic.com/settings/keys' },
      { label: 'Créer une API Key' },
      { label: 'Coller la clé dans le formulaire ci-dessus' },
    ],
    note: 'Les rate limits sont lus via les headers de l\'API.',
  },
  {
    id: 'gemini', label: 'Gemini', icon: '✨', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
    steps: [
      { label: 'Accéder à', link: 'https://aistudio.google.com/app/apikey', text: 'aistudio.google.com/app/apikey' },
      { label: 'Créer une clé pour le projet souhaité' },
      { label: 'Coller la clé dans le formulaire ci-dessus' },
    ],
    note: 'Google n\'expose pas les quotas via l\'API publique — la clé sera validée uniquement.',
  },
];

function GuideSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 md:mt-10">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-purple-400 font-semibold hover:text-purple-300 transition-colors focus:outline-none text-sm md:text-base"
      >
        <span className={`transform transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
        Comment obtenir mes clés API ?
      </button>
      {open && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {GUIDE.map(g => (
            <div key={g.id} className={`p-4 md:p-5 rounded-2xl border ${g.border} ${g.bg}`}>
              <div className={`font-semibold mb-3 flex items-center gap-2 ${g.color} text-sm md:text-base`}>
                <span>{g.icon}</span> {g.label}
              </div>
              <ol className="list-decimal pl-5 space-y-2 text-xs md:text-sm text-gray-400 mb-4">
                {g.steps.map((s, i) => (
                  <li key={i}>
                    {s.label}{' '}
                    {s.link && <a href={s.link} target="_blank" rel="noreferrer" className={`${g.color} hover:underline ml-1`}>{s.text}</a>}
                  </li>
                ))}
              </ol>
              {g.note && <div className="text-[10px] md:text-xs text-gray-500 italic mt-auto pt-3 border-t border-white/5">ℹ️ {g.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATS = [
  { label: 'Utilisateurs',     value: '1',  sub: 'inscrits',    color: 'text-blue-400' },
  { label: 'Quotas surveillés', value: '0', sub: 'actifs',      color: 'text-purple-400' },
  { label: 'Alertes envoyées', value: '0',  sub: 'ce mois',     color: 'text-amber-400' },
  { label: 'Appels API',       value: '—',  sub: "aujourd'hui", color: 'text-green-500' },
];

const SECTIONS = ['Vue générale', 'Utilisateurs', 'API Keys', 'Alertes', 'Système'];

function Toast({ message, type = 'success', onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2200);
    const t2 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border flex items-center gap-2 font-semibold text-sm shadow-xl transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500/10 border-green-500/30 text-green-400 backdrop-blur-md' 
        : 'bg-red-500/10 border-red-500/30 text-red-400 backdrop-blur-md'
    } ${leaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100 animate-in slide-in-from-right-8'}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span> {message}
    </div>
  );
}

function PressButton({ onClick, children, className, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  );
}

function ApiKeysSection({ user }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState({ provider: 'openai', name: '', value: '' });
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadKeys = React.useCallback(async () => {
    try {
      const colRef = collection(db, 'apiKeys');
      const q = query(colRef, where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setKeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [user.uid]);

  useEffect(() => {
    (async () => {
      await loadKeys();
    })();
  }, [loadKeys]);

  const closeForm = () => {
    setClosing(true);
    setTimeout(() => { setShowForm(false); setClosing(false); }, 250);
  };

  const toggleForm = () => {
    if (showForm) closeForm();
    else setShowForm(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.value.trim()) return;
    setSaving(true);
    try {
      const colRef = collection(db, 'apiKeys');
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai dépassé — vérifiez les règles Firestore')), 10000)
      );
      await Promise.race([
        addDoc(colRef, {
          userId: user.uid,
          provider: form.provider,
          name: form.name.trim(),
          value: form.value.trim(),
          createdAt: new Date().toISOString(),
        }),
        timeout,
      ]);
      setForm({ provider: 'openai', name: '', value: '' });
      closeForm();
      await loadKeys();
      setToast({ id: 'save-success', message: 'Clé enregistrée avec succès', type: 'success' });
    } catch (e) {
      setToast({ id: 'save-error', message: 'Erreur : ' + e.message, type: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette clé ?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'apiKeys', id));
      setKeys(k => k.filter(x => x.id !== id));
      setToast({ id: 'delete-success-' + id, message: 'Clé supprimée', type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ id: 'delete-error-' + id, message: 'Erreur suppression', type: 'error' });
    }
    setDeletingId(null);
  };

  const provider = (id) => PROVIDERS.find(p => p.id === id) || PROVIDERS[0];
  const mask = (v) => v.slice(0, 6) + '••••••••••••' + v.slice(-4);

  return (
    <div className="w-full">
      {toast && <Toast key={toast.id || toast.message} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <span className="text-sm text-gray-400 font-medium">
          {keys.length} clé{keys.length !== 1 ? 's' : ''} enregistrée{keys.length !== 1 ? 's' : ''}
        </span>
        <PressButton
          onClick={toggleForm}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-sm ${
            showForm 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-blue-500'
          }`}
        >
          {showForm ? '✕ Annuler' : '+ Ajouter une clé'}
        </PressButton>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className={`p-5 md:p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl mb-8 flex flex-col gap-5 ${closing ? 'animate-out slide-out-to-top-4 fade-out duration-200' : 'animate-in slide-in-from-top-4 fade-in duration-300'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Fournisseur</label>
              <select
                value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Nom (ex: "Production")</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ma clé principale"
                required
                className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Clé API</label>
            <input
              type="password"
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="sk-... ou AIza..."
              required
              className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-gray-200 text-sm font-mono focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
            />
          </div>
          <div className="flex justify-end mt-2">
            <PressButton
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-blue-500"
            >
              {saving ? '⏳ Sauvegarde...' : 'Enregistrer'}
            </PressButton>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-10">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      ) : keys.length === 0 ? (
        <div className="p-10 md:p-16 bg-white/5 border border-white/10 rounded-2xl text-center text-gray-400 flex flex-col items-center justify-center">
          <div className="text-4xl md:text-5xl mb-4">🔑</div>
          <p className="text-sm md:text-base font-medium">Aucune clé API enregistrée.</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto w-full hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider bg-black/20">
                <th className="p-4 font-semibold">Fournisseur</th>
                <th className="p-4 font-semibold">Nom</th>
                <th className="p-4 font-semibold">Clé</th>
                <th className="p-4 font-semibold">Ajoutée le</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const p = provider(k.provider);
                return (
                  <tr key={k.id} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors ${deletingId === k.id ? 'opacity-40' : ''}`}>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${p.twText} ${p.twBg}`}>
                        <span>{p.icon}</span> {p.label}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 text-sm font-medium">{k.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-gray-400 tracking-wider bg-black/30 px-2.5 py-1.5 rounded-md border border-white/5">
                          {revealed[k.id] ? k.value : mask(k.value)}
                        </span>
                        <button
                          onClick={() => setRevealed(r => ({ ...r, [k.id]: !r[k.id] }))}
                          className="text-[10px] uppercase font-bold text-purple-400 hover:text-purple-300 focus:outline-none"
                        >
                          {revealed[k.id] ? 'masquer' : 'voir'}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {k.createdAt?.slice(0, 10) || '—'}
                    </td>
                    <td className="p-4 text-right">
                      <PressButton
                        onClick={() => handleDelete(k.id)}
                        disabled={deletingId === k.id}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/20 focus:outline-none"
                      >
                        {deletingId === k.id ? '...' : 'Supprimer'}
                      </PressButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <GuideSection />
    </div>
  );
}

export default function AdminPage({ user }) {
  const [section, setSection] = useState('API Keys');

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-76px)]">
      {/* Mobile/Tablet Horizontal Scroll Nav */}
      <aside className="md:w-64 border-b md:border-b-0 md:border-r border-white/10 py-4 md:py-8 flex-shrink-0 bg-[#0d1117]/80 md:bg-transparent sticky top-[64px] md:top-[76px] z-40 backdrop-blur-md">
        <div className="px-4 md:px-6 mb-4 hidden md:block">
          <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
            Administration
          </span>
        </div>
        <div className="flex md:flex-col overflow-x-auto hide-scrollbar px-4 md:px-0 gap-2 md:gap-1">
          {SECTIONS.map(s => (
            <button 
              key={s} 
              onClick={() => setSection(s)} 
              className={`flex-shrink-0 px-4 py-2.5 md:py-3 md:px-6 text-sm text-left whitespace-nowrap md:whitespace-normal rounded-xl md:rounded-none md:border-l-2 transition-all duration-200 ${
                section === s 
                  ? 'bg-purple-500/10 text-purple-400 font-semibold border-purple-500 md:bg-purple-500/5' 
                  : 'text-gray-400 font-medium border-transparent hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 p-4 md:p-8 lg:p-10 w-full overflow-y-auto">
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">{section}</h1>
          <p className="text-gray-400 text-sm md:text-base">
            {section === 'Vue générale' && 'Aperçu global de la plateforme'}
            {section === 'Utilisateurs' && 'Gérez les comptes utilisateurs'}
            {section === 'API Keys' && 'Gérez vos clés API par fournisseur'}
            {section === 'Alertes' && 'Historique des alertes'}
            {section === 'Système' && 'Santé du système'}
          </p>
        </div>

        {section === 'Vue générale' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
              {STATS.map(s => (
                <div key={s.label} className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
                  <div className={`text-3xl md:text-4xl font-extrabold leading-none mb-3 ${s.color}`}>{s.value}</div>
                  <div>
                    <div className="text-xs md:text-sm font-semibold text-gray-300">{s.label}</div>
                    <div className="text-[10px] md:text-xs text-gray-500 mt-1">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-5 md:p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Santé du système</h2>
              <div className="space-y-4">
                {[{ name: 'API Backend', ok: true }, { name: 'Firebase Auth', ok: true }, { name: 'Firestore', ok: true }, { name: 'Vercel Hosting', ok: true }].map(item => (
                  <div key={item.name} className="flex justify-between items-center pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-sm md:text-base text-gray-300">{item.name}</span>
                    <span className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-full ${item.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {item.ok ? '● Opérationnel' : '● Hors ligne'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'Utilisateurs' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto w-full animate-in fade-in duration-300 hide-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider bg-black/20">
                  <th className="p-4 font-semibold">Nom</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Rôle</th>
                  <th className="p-4 font-semibold">Inscrit le</th>
                  <th className="p-4 font-semibold">API Keys</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-gray-300 text-sm">
                    <div className="flex items-center gap-3">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">U</div>
                      )}
                      <span className="font-medium">{user?.displayName || '—'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{user?.email}</td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">admin</span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{new Date().toISOString().slice(0, 10)}</td>
                  <td className="p-4 text-gray-500 text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {section === 'API Keys' && <ApiKeysSection user={user} />}

        {section === 'Alertes' && (
          <div className="p-10 md:p-16 bg-white/5 border border-white/10 rounded-2xl text-center text-gray-400 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="text-4xl md:text-5xl mb-4">🔔</div>
            <p className="text-sm md:text-base font-medium">Aucune alerte pour l'instant.</p>
          </div>
        )}

        {section === 'Système' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-300">
            {[
              { label: 'Version app', value: '0.1.0' },
              { label: 'Environnement', value: 'Production' },
              { label: 'Firebase projet', value: 'quota-alert-ai-jv' },
              { label: 'Vercel déploiement', value: 'Actif' },
              { label: 'Node.js (API)', value: 'ESM / Serverless' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-sm text-gray-400 font-medium">{item.label}</span>
                <span className="text-sm text-gray-200 font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}