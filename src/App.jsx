import React, { useState, useEffect, Suspense, lazy, memo } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import { auth, loginWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { usePushNotifications } from './hooks/usePushNotifications';

const AdminPage = lazy(() => import('./pages/AdminPage'));

const providers = [
  { name: 'OpenAI', icon: '🤖', color: '#10a37f', from: 'from-[#10a37f]', to: 'to-[#0d8c6b]' },
  { name: 'Anthropic', icon: '🧠', color: '#c96442', from: 'from-[#c96442]', to: 'to-[#a85235]' },
  { name: 'Gemini', icon: '✨', color: '#4285f4', from: 'from-[#4285f4]', to: 'to-[#3367d6]' },
];

const GUIDE = [
  {
    name: 'OpenAI',
    icon: '🤖',
    color: 'text-[#10a37f]',
    bg: 'bg-[#10a37f]/10',
    border: 'border-[#10a37f]/20',
    steps: [
      { label: 'Accéder à', link: 'https://platform.openai.com/api-keys', text: 'platform.openai.com/api-keys' },
      { label: 'Créer une clé avec accès "All" (ou au minimum "Billing")' },
      { label: 'Coller la clé dans Admin → API Keys' },
    ],
    note: 'Les quotas nécessitent un compte avec facturation activée.',
  },
  {
    name: 'Anthropic',
    icon: '🧠',
    color: 'text-[#c96442]',
    bg: 'bg-[#c96442]/10',
    border: 'border-[#c96442]/20',
    steps: [
      { label: 'Accéder à', link: 'https://console.anthropic.com/settings/keys', text: 'console.anthropic.com/settings/keys' },
      { label: 'Créer une API Key' },
      { label: 'Coller la clé dans Admin → API Keys' },
    ],
    note: 'Les rate limits sont lus via les headers de l\'API (pas de quota absolu exposé).',
  },
  {
    name: 'Gemini',
    icon: '✨',
    color: 'text-[#4285f4]',
    bg: 'bg-[#4285f4]/10',
    border: 'border-[#4285f4]/20',
    steps: [
      { label: 'Accéder à', link: 'https://aistudio.google.com/app/apikey', text: 'aistudio.google.com/app/apikey' },
      { label: 'Créer une clé pour le projet souhaité' },
      { label: 'Coller la clé dans Admin → API Keys' },
    ],
    note: 'Google n\'expose pas les quotas via l\'API publique — la clé sera validée uniquement.',
  },
];

function Landing({ onLogin }) {
  return (
    <div className="text-center px-4 py-16 md:py-24 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-5xl md:text-6xl mb-6 animate-pulse">⚡</div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent mb-6">
        QuotaAlert AI
      </h1>
      <p className="text-gray-400 text-base md:text-lg mb-10 leading-relaxed max-w-lg">
        Surveillez vos quotas OpenAI, Anthropic et Gemini en temps réel.<br className="hidden md:block" />
        Recevez des alertes avant d'atteindre vos limites.
      </p>
      <div className="flex justify-center gap-3 mb-10 flex-wrap">
        {providers.map(p => (
          <span key={p.name} className={`px-4 py-2 rounded-full border bg-opacity-10 text-sm font-medium flex items-center gap-2`} style={{ borderColor: `${p.color}33`, color: p.color, backgroundColor: `${p.color}11` }}>
            <span>{p.icon}</span> {p.name}
          </span>
        ))}
      </div>
      <button onClick={onLogin} className="w-full md:w-auto group relative px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-white shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-blue-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span className="relative flex justify-center items-center gap-2">Commencer gratuitement <span className="group-hover:translate-x-1 transition-transform">→</span></span>
      </button>
    </div>
  );
}

const QuotaCard = memo(({ provider, quota, loading, onRefresh }) => {
  const p = providers.find(x => x.name === provider);
  const hasQuota = quota && !quota.error;
  const percentage = hasQuota ? quota.percent : 0;

  const status = percentage > 80 ? 'Critical' : percentage > 50 ? 'Warning' : 'Healthy';
  const statusColor = status === 'Critical' ? '#ef4444' : status === 'Warning' ? '#fbbf24' : '#22c55e';
  const statusClass = status === 'Critical' ? 'text-red-500' : status === 'Warning' ? 'text-amber-400' : 'text-green-500';

  const formatResetTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString();
  };

  const formatResetIn = (iso) => {
    if (!iso) return '-';
    const diff = new Date(iso) - new Date();
    if (diff <= 0) return 'Prêt';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={`relative p-5 md:p-6 rounded-2xl bg-[#161b22] border transition-all duration-300 ${loading ? 'border-white/5 opacity-70' : hasQuota ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.05)]' : 'border-white/5'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${p.from} ${p.to} bg-opacity-20`}>
            <span className="text-xl">{p.icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-200 text-sm md:text-base">{hasQuota && quota.models ? quota.models[0] : p.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:block">API</span>
            <div className={`w-8 h-4 rounded-full relative ${hasQuota ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${hasQuota ? 'translate-x-4' : ''}`} />
            </div>
          </div>
          {!loading && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRefresh && onRefresh(); }} 
              className="text-gray-500 hover:text-white hover:rotate-180 transition-all duration-300 focus:outline-none p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          )}
        </div>
      </div>

      <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-6 flex flex-col items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 120 120" className="transform -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#2d333b" strokeWidth="8" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={statusColor} strokeWidth="8"
            strokeDasharray={`${(percentage / 100) * 314} 314`}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl md:text-2xl font-bold text-white">{percentage.toFixed(0)}%</span>
          <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Used</span>
        </div>
      </div>

      <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
        <div className="flex justify-between items-center text-xs md:text-sm">
          <span className="text-gray-500">Status</span>
          <span className={`font-bold ${loading ? 'text-gray-400' : hasQuota ? statusClass : 'text-gray-600'}`}>
            {loading ? 'LOADING' : hasQuota ? status.toUpperCase() : 'OFFLINE'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs md:text-sm">
          <span className="text-gray-500">Reset In</span>
          <span className="font-semibold text-gray-300">{hasQuota ? formatResetIn(quota.resetTime) : '-'}</span>
        </div>
        <div className="flex justify-between items-center text-xs md:text-sm">
          <span className="text-gray-500">Reset Time</span>
          <span className="text-[10px] md:text-xs text-gray-400">{hasQuota ? formatResetTime(quota.resetTime) : '-'}</span>
        </div>
      </div>

      {hasQuota && quota.models && (
        <div className="pt-4 border-t border-white/5 border-dashed">
          <div className="text-xs text-gray-500 mb-3">
            Included Models ({quota.models.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {quota.models.map((m, i) => (
              <span key={i} className="text-[10px] md:text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

function GuideSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 md:mt-12">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-purple-400 font-semibold hover:text-purple-300 transition-colors focus:outline-none text-sm md:text-base w-full md:w-auto justify-center md:justify-start"
      >
        <span className={`transform transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
        Comment obtenir mes clés API ?
      </button>

      {open && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDE.map(g => (
            <div key={g.name} className={`p-5 rounded-2xl border ${g.border} ${g.bg}`}>
              <div className={`font-semibold mb-3 flex items-center gap-2 ${g.color}`}>
                <span>{g.icon}</span> {g.name}
              </div>
              <ol className="list-decimal pl-5 space-y-2 text-xs md:text-sm text-gray-400 mb-4">
                {g.steps.map((s, i) => (
                  <li key={i}>
                    {s.label}{' '}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" className={`${g.color} hover:underline ml-1`}>
                        {s.text}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
              {g.note && (
                <div className="text-[10px] md:text-xs text-gray-500 italic mt-auto pt-3 border-t border-white/5">
                  ℹ️ {g.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://quota-alert-ai.vercel.app';

function Dashboard({ user }) {
  const [keys, setKeys] = useState([]);
  const [quotas, setQuotas] = useState({});
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingQuotas, setLoadingQuotas] = useState({});

  const fetchQuotas = React.useCallback(async (keysList) => {
    for (const key of keysList) {
      const providerName = providers.find(p => p.name.toLowerCase() === key.provider.toLowerCase())?.name || key.provider;
      setLoadingQuotas(prev => ({ ...prev, [providerName]: true }));
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/v1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ p: providerName }),
        });
        const data = await res.json();
        setQuotas(prev => ({ ...prev, [providerName]: data }));
      } catch {
        setQuotas(prev => ({ ...prev, [providerName]: { error: 'Impossible de contacter l\'API' } }));
      } finally {
        setLoadingQuotas(prev => ({ ...prev, [providerName]: false }));
      }
    }
  }, [user]);

  useEffect(() => {
    async function fetchKeys() {
      try {
        const q = query(collection(db, 'apiKeys'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setKeys(docs);
        fetchQuotas(docs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingKeys(false);
      }
    }
    fetchKeys();
  }, [user.uid, fetchQuotas]);

  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications(user);
  const configuredProviders = new Set(keys.map(k => k.provider));

  return (
    <div className="px-4 py-8 md:px-8 md:py-12 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight text-center md:text-left">Tableau de bord</h1>
          <p className="text-gray-400 text-sm md:text-base text-center md:text-left">
            Bienvenue, <span className="text-gray-200 font-medium">{user.displayName?.split(' ')[0] || 'utilisateur'}</span>
          </p>
        </div>
        
        {pushStatus !== 'unsupported' && (
          <button
            onClick={pushStatus === 'granted' ? unsubscribe : subscribe}
            disabled={pushStatus === 'loading' || pushStatus === 'denied'}
            className={`w-full md:w-auto justify-center px-4 py-3 md:py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
              pushStatus === 'granted' 
                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                : pushStatus === 'denied'
                ? 'bg-red-500/5 text-gray-500 border-red-500/10 cursor-not-allowed'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            }`}
          >
            {pushStatus === 'granted' && <><span className="text-lg">🔔</span> Alertes activées</>}
            {pushStatus === 'idle' && <><span className="text-lg">🔕</span> Activer les alertes</>}
            {pushStatus === 'loading' && <><span className="animate-spin text-lg">⏳</span> En cours...</>}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        {providers.map(p => (
          <QuotaCard
            key={p.name}
            provider={p.name}
            quota={quotas[p.name]}
            loading={loadingKeys || !!loadingQuotas[p.name]}
            onRefresh={() => fetchQuotas(keys.filter(k => k.provider.toLowerCase() === p.name.toLowerCase()))}
          />
        ))}
      </div>

      <details className="mt-8 opacity-50 mb-8 cursor-pointer">
        <summary className="text-xs text-gray-500 hover:text-gray-300">Debug Raw Data</summary>
        <pre className="text-[10px] md:text-xs bg-black/50 p-4 rounded-xl overflow-auto text-left mt-2 border border-white/5 text-gray-400">
          {JSON.stringify(quotas, null, 2)}
        </pre>
      </details>

      {!loadingKeys && configuredProviders.size === 0 && (
        <div className="p-5 md:p-8 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-2xl mb-8 md:mb-12 shadow-lg">
          <h2 className="text-base md:text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            🚀 Commencer
          </h2>
          <ol className="list-decimal pl-5 space-y-3 text-sm md:text-base text-gray-400">
            <li>Allez dans <Link to="/admin" className="text-purple-400 font-medium hover:text-purple-300 hover:underline">Admin → API Keys</Link> pour ajouter vos clés</li>
            <li>Vos quotas s'afficheront ici automatiquement</li>
            <li>Configurez des alertes pour être notifié avant d'atteindre vos limites</li>
          </ol>
        </div>
      )}

      <GuideSection />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('En attente...');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    fetch(`${API_BASE}/api/ping`)
      .then(r => r.json())
      .then(d => setBackendStatus(d.message))
      .catch(() => setBackendStatus('Erreur de connexion au backend'));
    return unsub;
  }, []);

  const handleLogin = async () => {
    try { await loginWithGoogle(); }
    catch { alert("Erreur lors de la connexion. Vérifiez la configuration Firebase."); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d1117] text-gray-400">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-sm md:text-base animate-pulse font-medium">Chargement...</p>
      </div>
    </div>
  );

  return (
    <Layout backendStatus={backendStatus}>
      <Navbar user={user} onLogin={handleLogin} onLogout={logout} />
      <Suspense fallback={
        <div className="flex items-center justify-center p-20 text-gray-500">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mr-3"></div>
          Chargement de la page...
        </div>
      }>
        <Routes>
          <Route path="/" element={user ? <Dashboard user={user} /> : <Landing onLogin={handleLogin} />} />
          <Route path="/admin" element={user ? <AdminPage user={user} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;