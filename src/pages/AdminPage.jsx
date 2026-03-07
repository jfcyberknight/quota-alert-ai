import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const PROVIDERS = [
  { id: 'openai',    label: 'OpenAI',    icon: '🤖', color: '#10a37f' },
  { id: 'anthropic', label: 'Anthropic', icon: '🧠', color: '#c96442' },
  { id: 'gemini',    label: 'Gemini',    icon: '✨', color: '#4285f4' },
];

const STATS = [
  { label: 'Utilisateurs',     value: '1',  sub: 'inscrits',    color: '#60a5fa' },
  { label: 'Quotas surveillés', value: '0', sub: 'actifs',      color: '#a78bfa' },
  { label: 'Alertes envoyées', value: '0',  sub: 'ce mois',     color: '#f59e0b' },
  { label: 'Appels API',       value: '—',  sub: "aujourd'hui", color: '#22c55e' },
];

const SECTIONS = ['Vue générale', 'Utilisateurs', 'API Keys', 'Alertes', 'Système'];

function ApiKeysSection({ user }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ provider: 'openai', name: '', value: '' });
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});

  const colRef = collection(db, 'apiKeys');

  const loadKeys = async () => {
    setLoading(true);
    try {
      const q = query(colRef, where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setKeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadKeys(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.value.trim()) return;
    setSaving(true);
    try {
      await addDoc(colRef, {
        userId: user.uid,
        provider: form.provider,
        name: form.name.trim(),
        value: form.value.trim(),
        createdAt: new Date().toISOString(),
      });
      setForm({ provider: 'openai', name: '', value: '' });
      setShowForm(false);
      await loadKeys();
    } catch (e) {
      alert('Erreur lors de la sauvegarde: ' + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette clé ?')) return;
    await deleteDoc(doc(db, 'apiKeys', id));
    setKeys(k => k.filter(x => x.id !== id));
  };

  const provider = (id) => PROVIDERS.find(p => p.id === id) || PROVIDERS[0];
  const mask = (v) => v.slice(0, 6) + '••••••••••••' + v.slice(-4);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#555' }}>{keys.length} clé{keys.length !== 1 ? 's' : ''} enregistrée{keys.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: '0.5rem 1.1rem',
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: 'white', border: 'none', borderRadius: '7px',
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Annuler' : '+ Ajouter une clé'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{
          padding: '1.5rem',
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          display: 'grid',
          gap: '1rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>
                Fournisseur
              </label>
              <select
                value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                style={{
                  width: '100%', padding: '0.55rem 0.85rem',
                  background: '#1a1a22', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '7px', color: '#e2e2e2', fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>
                Nom (ex: "Production")
              </label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ma clé principale"
                required
                style={{
                  width: '100%', padding: '0.55rem 0.85rem',
                  background: '#1a1a22', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '7px', color: '#e2e2e2', fontSize: '0.875rem',
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>
              Clé API
            </label>
            <input
              type="password"
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="sk-... ou AIza..."
              required
              style={{
                width: '100%', padding: '0.55rem 0.85rem',
                background: '#1a1a22', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '7px', color: '#e2e2e2', fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.55rem 1.4rem',
                background: saving ? '#333' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                color: 'white', border: 'none', borderRadius: '7px',
                fontWeight: 600, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: '#555', fontSize: '0.875rem' }}>Chargement...</p>
      ) : keys.length === 0 ? (
        <div style={{
          padding: '3rem', background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
          textAlign: 'center', color: '#444',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔑</div>
          <p style={{ margin: 0 }}>Aucune clé API enregistrée.</p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Fournisseur', 'Nom', 'Clé', 'Ajoutée le', ''].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1.25rem', textAlign: 'left',
                    color: '#555', fontWeight: 600, fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map(k => {
                const p = provider(k.provider);
                return (
                  <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 600,
                        color: p.color, background: `${p.color}15`,
                        padding: '0.2rem 0.7rem', borderRadius: 4,
                      }}>
                        {p.icon} {p.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#ccc' }}>{k.name}</td>
                    <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>
                      <span>{revealed[k.id] ? k.value : mask(k.value)}</span>
                      <button
                        onClick={() => setRevealed(r => ({ ...r, [k.id]: !r[k.id] }))}
                        style={{
                          marginLeft: '0.6rem', padding: '0.1rem 0.5rem',
                          background: 'rgba(255,255,255,0.06)', border: 'none',
                          borderRadius: 4, color: '#888', fontSize: '0.72rem', cursor: 'pointer',
                        }}
                      >
                        {revealed[k.id] ? 'masquer' : 'voir'}
                      </button>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#555', fontSize: '0.8rem' }}>
                      {k.createdAt?.slice(0, 10)}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <button
                        onClick={() => handleDelete(k.id)}
                        style={{
                          padding: '0.3rem 0.7rem',
                          background: 'rgba(239,68,68,0.1)', color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 5, fontSize: '0.78rem', cursor: 'pointer',
                        }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPage({ user }) {
  const [section, setSection] = useState('API Keys');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <aside style={{
        width: 220, borderRight: '1px solid rgba(255,255,255,0.07)',
        padding: '1.5rem 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase' }}>
            Administration
          </span>
        </div>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '0.6rem 1.25rem',
            background: section === s ? 'rgba(167,139,250,0.1)' : 'transparent',
            color: section === s ? '#a78bfa' : '#666',
            border: 'none',
            borderLeft: section === s ? '2px solid #a78bfa' : '2px solid transparent',
            fontSize: '0.875rem', cursor: 'pointer',
            fontWeight: section === s ? 600 : 400,
          }}>{s}</button>
        ))}
      </aside>

      <div style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{section}</h1>
          <p style={{ color: '#555', margin: 0, fontSize: '0.875rem' }}>
            {section === 'Vue générale' && 'Aperçu global de la plateforme'}
            {section === 'Utilisateurs' && 'Gérez les comptes utilisateurs'}
            {section === 'API Keys' && 'Gérez vos clés API par fournisseur'}
            {section === 'Alertes' && 'Historique des alertes'}
            {section === 'Système' && 'Santé du système'}
          </p>
        </div>

        {section === 'Vue générale' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {STATS.map(s => (
                <div key={s.label} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.4rem' }}>{s.label} <span style={{ color: '#555' }}>({s.sub})</span></div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>Santé du système</h2>
              {[{ name: 'API Backend', ok: true }, { name: 'Firebase Auth', ok: true }, { name: 'Firestore', ok: true }, { name: 'Vercel Hosting', ok: true }].map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.875rem', color: '#aaa' }}>{item.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.ok ? '#22c55e' : '#ef4444', background: item.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>
                    {item.ok ? '● Opérationnel' : '● Hors ligne'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'Utilisateurs' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Nom', 'Email', 'Rôle', 'Inscrit le', 'API Keys'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#555', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user?.photoURL && <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                      {user?.displayName || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#888' }}>{user?.email}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '0.2rem 0.6rem', borderRadius: 4 }}>admin</span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#666' }}>{new Date().toISOString().slice(0, 10)}</td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#666' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {section === 'API Keys' && <ApiKeysSection user={user} />}

        {section === 'Alertes' && (
          <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center', color: '#444' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔔</div>
            <p style={{ margin: 0 }}>Aucune alerte pour l'instant.</p>
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
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '0.875rem' }}>
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
