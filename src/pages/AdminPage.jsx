import React, { useState } from 'react';

const stat = (label, value, sub, color = '#a78bfa') => ({ label, value, sub, color });

const STATS = [
  stat('Utilisateurs', '1', 'inscrits', '#60a5fa'),
  stat('Quotas surveillés', '0', 'actifs', '#a78bfa'),
  stat('Alertes envoyées', '0', 'ce mois', '#f59e0b'),
  stat('Appels API', '—', 'aujourd\'hui', '#22c55e'),
];

const MOCK_USERS = [
  { email: 'admin@example.com', name: 'Admin', role: 'admin', joined: '2026-03-07', keys: 0 },
];

const SECTIONS = ['Vue générale', 'Utilisateurs', 'API Keys', 'Alertes', 'Système'];

export default function AdminPage({ user }) {
  const [section, setSection] = useState('Vue générale');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        padding: '1.5rem 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#444',
            textTransform: 'uppercase',
          }}>
            Administration
          </span>
        </div>
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '0.6rem 1.25rem',
              background: section === s ? 'rgba(167,139,250,0.1)' : 'transparent',
              color: section === s ? '#a78bfa' : '#666',
              border: 'none',
              borderLeft: section === s ? '2px solid #a78bfa' : '2px solid transparent',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: section === s ? 600 : 400,
            }}
          >
            {s}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
            {section}
          </h1>
          <p style={{ color: '#555', margin: 0, fontSize: '0.875rem' }}>
            {section === 'Vue générale' && 'Aperçu global de la plateforme'}
            {section === 'Utilisateurs' && 'Gérez les comptes utilisateurs'}
            {section === 'API Keys' && 'Clés API enregistrées'}
            {section === 'Alertes' && 'Historique des alertes'}
            {section === 'Système' && 'Santé du système'}
          </p>
        </div>

        {section === 'Vue générale' && (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {STATS.map(s => (
                <div key={s.label} style={{
                  padding: '1.25rem 1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.4rem' }}>
                    {s.label} <span style={{ color: '#555' }}>({s.sub})</span>
                  </div>
                </div>
              ))}
            </div>

            {/* System status */}
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
            }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                Santé du système
              </h2>
              {[
                { name: 'API Backend', ok: true },
                { name: 'Firebase Auth', ok: true },
                { name: 'Firestore', ok: true },
                { name: 'Vercel Hosting', ok: true },
              ].map(item => (
                <div key={item.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#aaa' }}>{item.name}</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: item.ok ? '#22c55e' : '#ef4444',
                    background: item.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    padding: '0.2rem 0.6rem', borderRadius: 4,
                  }}>
                    {item.ok ? '● Opérationnel' : '● Hors ligne'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'Utilisateurs' && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Nom', 'Email', 'Rôle', 'Inscrit le', 'API Keys'].map(h => (
                    <th key={h} style={{
                      padding: '0.85rem 1.25rem', textAlign: 'left',
                      color: '#555', fontWeight: 600, fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Current user */}
                {[{
                  email: user?.email,
                  name: user?.displayName || '—',
                  role: 'admin',
                  joined: new Date().toISOString().split('T')[0],
                  keys: 0,
                }].map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#ddd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user?.photoURL && <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                      {u.name}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#888' }}>{u.email}</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: '#a78bfa', background: 'rgba(167,139,250,0.1)',
                        padding: '0.2rem 0.6rem', borderRadius: 4,
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#666' }}>{u.joined}</td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#666' }}>{u.keys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(section === 'API Keys' || section === 'Alertes') && (
          <div style={{
            padding: '3rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#444',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
              {section === 'API Keys' ? '🔑' : '🔔'}
            </div>
            <p style={{ margin: 0 }}>Aucune donnée pour l'instant.</p>
          </div>
        )}

        {section === 'Système' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { label: 'Version app', value: '0.0.0' },
              { label: 'Environnement', value: 'Production' },
              { label: 'Firebase projet', value: 'quota-alert-ai-jv' },
              { label: 'Vercel déploiement', value: 'Actif' },
              { label: 'Node.js (API)', value: 'ESM / Serverless' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '8px',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: '#666' }}>{item.label}</span>
                <span style={{ color: '#ccc', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
