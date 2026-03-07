import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import AdminPage from './pages/AdminPage';
import { auth, loginWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { usePushNotifications } from './hooks/usePushNotifications';

const providers = [
  { name: 'OpenAI', icon: '🤖', color: '#10a37f' },
  { name: 'Anthropic', icon: '🧠', color: '#c96442' },
  { name: 'Gemini', icon: '✨', color: '#4285f4' },
];

const GUIDE = [
  {
    name: 'OpenAI',
    icon: '🤖',
    color: '#10a37f',
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
    color: '#c96442',
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
    color: '#4285f4',
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
    <div style={{ textAlign: 'center', padding: '5rem 2rem 2rem', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
      <h1 style={{
        fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em',
        background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        margin: '0 0 1rem',
      }}>
        QuotaAlert AI
      </h1>
      <p style={{ color: '#666', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
        Surveillez vos quotas OpenAI, Anthropic et Gemini en temps réel.<br />
        Recevez des alertes avant d'atteindre vos limites.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        {providers.map(p => (
          <span key={p.name} style={{
            padding: '0.5rem 1rem', borderRadius: '8px',
            border: `1px solid ${p.color}33`, background: `${p.color}11`,
            color: p.color, fontSize: '0.875rem', fontWeight: 500,
          }}>
            {p.icon} {p.name}
          </span>
        ))}
      </div>
      <button onClick={onLogin} style={{
        padding: '0.8rem 2rem',
        background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
        color: 'white', border: 'none', borderRadius: '10px',
        fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
      }}>
        Commencer gratuitement →
      </button>
    </div>
  );
}

function QuotaCard({ provider, quota, loading }) {
  const p = providers.find(x => x.name === provider);
  const hasQuota = quota && !quota.error;

  return (
    <div style={{
      padding: '1.5rem', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontWeight: 600 }}>{p.icon} {p.name}</span>
        {loading ? (
          <span style={{ fontSize: '0.72rem', color: '#555', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>
            Chargement...
          </span>
        ) : hasQuota ? (
          <span style={{ fontSize: '0.72rem', color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>
            Connecté
          </span>
        ) : quota?.error ? (
          <span style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(239,68,68,0.08)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>
            Erreur
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: '#555', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>
            Non configuré
          </span>
        )}
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: '0.75rem' }}>
        <div style={{
          height: '100%',
          width: `${hasQuota ? quota.percent : 0}%`,
          background: hasQuota && quota.percent > 80 ? '#ef4444' : p.color,
          borderRadius: 3, transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ fontSize: '0.8rem', color: '#555' }}>
        {loading ? '—' : hasQuota ? quota.label : quota?.error || 'Aucune clé configurée'}
      </div>
    </div>
  );
}

function GuideSection() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '2rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'none', border: 'none', color: '#a78bfa',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', padding: 0,
        }}
      >
        <span style={{ fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        Comment obtenir mes clés API ?
      </button>

      {open && (
        <div style={{
          marginTop: '1rem', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem',
        }}>
          {GUIDE.map(g => (
            <div key={g.name} style={{
              padding: '1.25rem', borderRadius: '12px',
              border: `1px solid ${g.color}22`, background: `${g.color}08`,
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: g.color }}>
                {g.icon} {g.name}
              </div>
              <ol style={{ margin: '0 0 0.75rem', paddingLeft: '1.1rem', fontSize: '0.82rem', color: '#888', lineHeight: 1.9 }}>
                {g.steps.map((s, i) => (
                  <li key={i}>
                    {s.label}{' '}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" style={{ color: g.color, textDecoration: 'none' }}>
                        {s.text}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
              {g.note && (
                <div style={{ fontSize: '0.75rem', color: '#555', fontStyle: 'italic' }}>
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

function Dashboard({ user }) {
  const [keys, setKeys] = useState([]);
  const [quotas, setQuotas] = useState({});
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingQuotas, setLoadingQuotas] = useState({});

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
  }, [user.uid]);

  async function fetchQuotas(keys) {
    for (const key of keys) {
      // Normalize to display name (e.g. 'openai' → 'OpenAI')
      const providerName = providers.find(p => p.name.toLowerCase() === key.provider.toLowerCase())?.name || key.provider;
      setLoadingQuotas(prev => ({ ...prev, [providerName]: true }));
      try {
        const res = await fetch('/api/quotas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: providerName, apiKey: key.value }),
        });
        const data = await res.json();
        setQuotas(prev => ({ ...prev, [providerName]: data }));
      } catch {
        setQuotas(prev => ({ ...prev, [providerName]: { error: 'Impossible de contacter l\'API' } }));
      } finally {
        setLoadingQuotas(prev => ({ ...prev, [providerName]: false }));
      }
    }
  }

  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications(user);
  const configuredProviders = new Set(keys.map(k => k.provider));

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Tableau de bord</h1>
          <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
            Bienvenue, {user.displayName?.split(' ')[0] || 'utilisateur'}
          </p>
        </div>
        {pushStatus !== 'unsupported' && (
          <button
            onClick={pushStatus === 'granted' ? unsubscribe : subscribe}
            disabled={pushStatus === 'loading' || pushStatus === 'denied'}
            style={{
              padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.82rem',
              fontWeight: 600, cursor: pushStatus === 'denied' ? 'not-allowed' : 'pointer',
              border: '1px solid',
              ...(pushStatus === 'granted'
                ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.25)' }
                : pushStatus === 'denied'
                ? { background: 'rgba(239,68,68,0.08)', color: '#666', borderColor: 'rgba(239,68,68,0.15)' }
                : { background: 'rgba(167,139,250,0.1)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.25)' }
              ),
              transition: 'transform 0.1s ease',
            }}
          >
            {pushStatus === 'granted' && '🔔 Alertes activées'}
            {pushStatus === 'idle' && '🔕 Activer les alertes'}
            {pushStatus === 'loading' && '⏳ En cours...'}
            {pushStatus === 'denied' && '🚫 Notifications bloquées'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {providers.map(p => (
          <QuotaCard
            key={p.name}
            provider={p.name}
            quota={quotas[p.name]}
            loading={loadingKeys || !!loadingQuotas[p.name]}
          />
        ))}
      </div>

      {!loadingKeys && configuredProviders.size === 0 && (
        <div style={{
          padding: '1.5rem', background: 'rgba(167,139,250,0.05)',
          border: '1px solid rgba(167,139,250,0.15)', borderRadius: '12px', marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem', color: '#c4b5fd' }}>
            🚀 Commencer
          </h2>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#666', fontSize: '0.875rem', lineHeight: 2 }}>
            <li>Allez dans <Link to="/admin" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>Admin → API Keys</Link> pour ajouter vos clés</li>
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
    fetch('/api/status')
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555' }}>
      Chargement...
    </div>
  );

  return (
    <Layout backendStatus={backendStatus}>
      <Navbar user={user} onLogin={handleLogin} onLogout={logout} />
      <Routes>
        <Route path="/" element={user ? <Dashboard user={user} /> : <Landing onLogin={handleLogin} />} />
        <Route path="/admin" element={user ? <AdminPage user={user} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;
