import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('En attente...');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Test de communication avec le backend (Vercel API)
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Erreur de connexion au backend'));

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      alert("Erreur lors de la connexion. Vérifiez la configuration Firebase.");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Chargement...</div>;

  return (
    <Layout backendStatus={backendStatus}>
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        {!user ? (
          <div>
            <h1>Bienvenue sur quota-alert-ai</h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem' }}>
              Connectez-vous pour surveiller vos quotas OpenAI, Anthropic et Gemini.
            </p>
          </div>
        ) : (
          <div>
            <h1>Tableau de Bord</h1>
            <div style={{
              background: '#2a2a2a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #444',
              display: 'inline-block',
              minWidth: '300px'
            }}>
              <p>Statut du système: <span style={{ color: '#44ff44' }}>Opérationnel</span></p>
              <p>Quotas surveillés: 0</p>
              <button style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#646cff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Ajouter une API Key
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
