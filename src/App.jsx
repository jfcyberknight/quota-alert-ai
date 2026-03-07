import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const providers = [
  { name: 'OpenAI', icon: '🤖', color: '#10a37f' },
  { name: 'Anthropic', icon: '🧠', color: '#c96442' },
  { name: 'Gemini', icon: '✨', color: '#4285f4' },
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('En attente...');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    fetch('/api/status')
      .then(res => res.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Erreur de connexion au backend'));

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch {
      alert("Erreur lors de la connexion. Vérifiez la configuration Firebase.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555' }}>
        Chargement...
      </div>
    );
  }

  return (
    <Layout backendStatus={backendStatus}>
      <Navbar user={user} onLogin={handleLogin} onLogout={logout} />

      <div style={{ padding: '3rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        {!user ? (
          <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
            <h1 style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
            }}>
              QuotaAlert AI
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
              Surveillez vos quotas OpenAI, Anthropic et Gemini en temps réel. Recevez des alertes avant d'atteindre vos limites.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              {providers.map(p => (
                <div key={p.name} style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  border: `1px solid ${p.color}33`,
                  background: `${p.color}11`,
                  color: p.color,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}>
                  {p.icon} {p.name}
                </div>
              ))}
            </div>

            <button onClick={handleLogin} style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer',
            }}>
              Commencer gratuitement →
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Tableau de bord
              </h1>
              <p style={{ color: '#666', margin: 0 }}>Bienvenue, {user.displayName?.split(' ')[0] || 'utilisateur'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {providers.map(p => (
                <div key={p.name} style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600 }}>{p.icon} {p.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#555', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                      Non configuré
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: '0.75rem' }}>
                    <div style={{ height: '100%', width: '0%', background: p.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>0 / — requêtes</div>
                </div>
              ))}
            </div>

            <button style={{
              padding: '0.6rem 1.4rem',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}>
              + Ajouter une API Key
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
