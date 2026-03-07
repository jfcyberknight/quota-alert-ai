import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import AdminPage from './pages/AdminPage';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const providers = [
  { name: 'OpenAI', icon: '🤖', color: '#10a37f' },
  { name: 'Anthropic', icon: '🧠', color: '#c96442' },
  { name: 'Gemini', icon: '✨', color: '#4285f4' },
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

function Dashboard({ user }) {
  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Tableau de bord</h1>
        <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
          Bienvenue, {user.displayName?.split(' ')[0] || 'utilisateur'}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {providers.map(p => (
          <div key={p.name} style={{
            padding: '1.5rem', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>{p.icon} {p.name}</span>
              <span style={{ fontSize: '0.72rem', color: '#555', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>
                Non configuré
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: '0.75rem' }}>
              <div style={{ height: '100%', width: '0%', background: p.color, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#555' }}>0 / — requêtes</div>
          </div>
        ))}
      </div>
      <button style={{
        padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
        color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
      }}>
        + Ajouter une API Key
      </button>
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
