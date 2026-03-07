import React from 'react';

const Layout = ({ children, backendStatus }) => {
  const isOnline = backendStatus?.includes('active');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <footer style={{
        padding: '1.5rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: '4rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#555',
        fontSize: '0.78rem',
      }}>
        <span>© 2026 QuotaAlert AI</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isOnline ? '#22c55e' : '#ef4444',
            display: 'inline-block',
          }} />
          API {isOnline ? 'en ligne' : 'hors ligne'}
        </span>
      </footer>
    </div>
  );
};

export default Layout;
