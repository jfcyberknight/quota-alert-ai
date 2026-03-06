import React from 'react';

const Navbar = ({ user, onLogin, onLogout }) => {
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: '#333',
            color: 'white',
            borderRadius: '8px',
            marginBottom: '2rem'
        }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                quota-alert-ai
            </div>
            <div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>{user.displayName || user.email}</span>
                        <button
                            onClick={onLogout}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Déconnexion
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLogin}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#44ff44',
                            color: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Connexion Google
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
