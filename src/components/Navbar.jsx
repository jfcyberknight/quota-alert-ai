import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogin, onLogout }) => {
  const { pathname } = useLocation();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 2rem',
      height: '64px',
      background: 'rgba(255,255,255,0.03)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <span style={{
            fontSize: '1.05rem', fontWeight: '700', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            QuotaAlert AI
          </span>
        </Link>

        {user && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[{ to: '/', label: 'Dashboard' }, { to: '/admin', label: 'Admin' }].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: pathname === to ? 600 : 400,
                color: pathname === to ? '#e2e2e2' : '#666',
                background: pathname === to ? 'rgba(255,255,255,0.07)' : 'transparent',
                textDecoration: 'none',
                transition: 'color 0.15s, background 0.15s',
              }}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user.photoURL && (
                <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              )}
              <span style={{ fontSize: '0.875rem', color: '#888' }}>
                {user.displayName || user.email}
              </span>
            </div>
            <button onClick={onLogout} style={{
              padding: '0.4rem 1rem',
              background: 'rgba(239,68,68,0.12)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px',
              fontSize: '0.85rem', cursor: 'pointer',
            }}>
              Déconnexion
            </button>
          </div>
        ) : (
          <button onClick={onLogin} style={{
            padding: '0.5rem 1.2rem',
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: 'white', border: 'none', borderRadius: '8px',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
          }}>
            Se connecter avec Google
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
