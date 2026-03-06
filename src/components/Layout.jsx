import React from 'react';

const Layout = ({ children, backendStatus }) => {
    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <main style={{ flex: 1 }}>
                {children}
            </main>
            <footer style={{
                padding: '2rem 0',
                textAlign: 'center',
                borderTop: '1px solid #444',
                marginTop: '4rem',
                color: '#666',
                fontSize: '0.8rem'
            }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    © 2026 quota-alert-ai - Monitoring Intelligent
                </div>
                <div>
                    Backend: <span style={{ color: backendStatus?.includes('active') ? '#44ff44' : '#ff4444', opacity: 0.7 }}>{backendStatus}</span>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
