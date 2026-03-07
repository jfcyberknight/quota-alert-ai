import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const PROVIDERS = [
  { id: 'openai',    label: 'OpenAI',    icon: '🤖', color: '#10a37f' },
  { id: 'anthropic', label: 'Anthropic', icon: '🧠', color: '#c96442' },
  { id: 'gemini',    label: 'Gemini',    icon: '✨', color: '#4285f4' },
];

const GUIDE = [
  {
    id: 'openai', label: 'OpenAI', icon: '🤖', color: '#10a37f',
    steps: [
      { label: 'Accéder à', link: 'https://platform.openai.com/api-keys', text: 'platform.openai.com/api-keys' },
      { label: 'Créer une clé avec accès "All" (ou au minimum "Billing")' },
      { label: 'Coller la clé dans le formulaire ci-dessus' },
    ],
    note: 'Les quotas nécessitent un compte avec facturation activée.',
  },
  {
    id: 'anthropic', label: 'Anthropic', icon: '🧠', color: '#c96442',
    steps: [
      { label: 'Accéder à', link: 'https://console.anthropic.com/settings/keys', text: 'console.anthropic.com/settings/keys' },
      { label: 'Créer une API Key' },
      { label: 'Coller la clé dans le formulaire ci-dessus' },
    ],
    note: 'Les rate limits sont lus via les headers de l\'API.',
  },
  {
    id: 'gemini', label: 'Gemini', icon: '✨', color: '#4285f4',
    steps: [
      { label: 'Accéder à', link: 'https://aistudio.google.com/app/apikey', text: 'aistudio.google.com/app/apikey' },
      { label: 'Créer une clé pour le projet souhaité' },
      { label: 'Coller la clé dans le formulaire ci-dessus' },
    ],
    note: 'Google n\'expose pas les quotas via l\'API publique — la clé sera validée uniquement.',
  },
];

function GuideSection() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'none', border: 'none', color: '#a78bfa',
          fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: 0,
        }}
      >
        <span style={{ fontSize: '0.7rem', display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        Comment obtenir mes clés API ?
      </button>
      {open && (
        <div style={{
          marginTop: '1rem', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem',
          animation: 'slideDown 0.2s ease',
        }}>
          {GUIDE.map(g => (
            <div key={g.id} style={{
              padding: '1.1rem', borderRadius: '10px',
              border: `1px solid ${g.color}22`, background: `${g.color}08`,
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.6rem', color: g.color, fontSize: '0.875rem' }}>
                {g.icon} {g.label}
              </div>
              <ol style={{ margin: '0 0 0.6rem', paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#888', lineHeight: 1.9 }}>
                {g.steps.map((s, i) => (
                  <li key={i}>
                    {s.label}{' '}
                    {s.link && <a href={s.link} target="_blank" rel="noreferrer" style={{ color: g.color, textDecoration: 'none' }}>{s.text}</a>}
                  </li>
                ))}
              </ol>
              {g.note && <div style={{ fontSize: '0.72rem', color: '#555', fontStyle: 'italic' }}>ℹ️ {g.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATS = [
  { label: 'Utilisateurs',     value: '1',  sub: 'inscrits',    color: '#60a5fa' },
  { label: 'Quotas surveillés', value: '0', sub: 'actifs',      color: '#a78bfa' },
  { label: 'Alertes envoyées', value: '0',  sub: 'ce mois',     color: '#f59e0b' },
  { label: 'Appels API',       value: '—',  sub: "aujourd'hui", color: '#22c55e' },
];

const SECTIONS = ['Vue générale', 'Utilisateurs', 'API Keys', 'Alertes', 'Système'];

const ANIM_STYLES = `
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-10px); }
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(20px); }
}
@keyframes rowIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;

function Toast({ message, type = 'success', onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2200);
    const t2 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
      padding: '0.75rem 1.25rem',
      background: type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
      borderRadius: '10px', color: type === 'success' ? '#4ade80' : '#f87171',
      fontSize: '0.875rem', fontWeight: 600,
      backdropFilter: 'blur(8px)',
      animation: `${leaving ? 'toastOut' : 'toastIn'} 0.3s ease forwards`,
      display: 'flex', alignItems: 'center', gap: '0.5rem',
    }}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  );
}

function PressButton({ onClick, children, style, disabled, type = 'button' }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        ...style,
        transform: pressed && !disabled ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.1s ease, opacity 0.15s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ApiKeysSection({ user }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState({ provider: 'openai', name: '', value: '' });
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const closeForm = () => {
    setClosing(true);
    setTimeout(() => { setShowForm(false); setClosing(false); }, 250);
  };

  const toggleForm = () => {
    if (showForm) closeForm();
    else setShowForm(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.value.trim()) return;
    setSaving(true);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai dépassé — vérifiez les règles Firestore')), 10000)
      );
      await Promise.race([
        addDoc(colRef, {
          userId: user.uid,
          provider: form.provider,
          name: form.name.trim(),
          value: form.value.trim(),
          createdAt: new Date().toISOString(),
        }),
        timeout,
      ]);
      setForm({ provider: 'openai', name: '', value: '' });
      closeForm();
      await loadKeys();
      setToast({ message: 'Clé enregistrée avec succès', type: 'success' });
    } catch (e) {
      setToast({ message: 'Erreur : ' + e.message, type: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette clé ?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'apiKeys', id));
      setKeys(k => k.filter(x => x.id !== id));
      setToast({ message: 'Clé supprimée', type: 'success' });
    } catch (e) {
      setToast({ message: 'Erreur suppression', type: 'error' });
    }
    setDeletingId(null);
  };

  const provider = (id) => PROVIDERS.find(p => p.id === id) || PROVIDERS[0];
  const mask = (v) => v.slice(0, 6) + '••••••••••••' + v.slice(-4);

  return (
    <div>
      <style>{ANIM_STYLES}</style>

      {toast && <Toast key={toast.message + Date.now()} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#555' }}>{keys.length} clé{keys.length !== 1 ? 's' : ''} enregistrée{keys.length !== 1 ? 's' : ''}</span>
        <PressButton
          onClick={toggleForm}
          style={{
            padding: '0.5rem 1.1rem',
            background: showForm ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: showForm ? '#f87171' : 'white',
            border: showForm ? '1px solid rgba(239,68,68,0.25)' : 'none',
            borderRadius: '7px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Annuler' : '+ Ajouter une clé'}
        </PressButton>
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
          animation: `${closing ? 'slideUp' : 'slideDown'} 0.25s ease forwards`,
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
                  borderRadius: '7px', color: '#e2e2e2', fontSize: '0.875rem', cursor: 'pointer',
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
                borderRadius: '7px', color: '#e2e2e2', fontSize: '0.875rem', fontFamily: 'monospace',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PressButton
              type="submit"
              disabled={saving}
              style={{
                padding: '0.55rem 1.4rem',
                background: saving ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                color: 'white', border: 'none', borderRadius: '7px',
                fontWeight: 600, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '⏳ Sauvegarde...' : 'Enregistrer'}
            </PressButton>
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
              {keys.map((k, i) => {
                const p = provider(k.provider);
                return (
                  <tr key={k.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    animation: `rowIn 0.2s ease ${i * 0.04}s both`,
                    opacity: deletingId === k.id ? 0.4 : 1,
                    transition: 'opacity 0.2s ease',
                  }}>
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
                      <PressButton
                        onClick={() => setRevealed(r => ({ ...r, [k.id]: !r[k.id] }))}
                        style={{
                          marginLeft: '0.6rem', padding: '0.1rem 0.5rem',
                          background: 'rgba(255,255,255,0.06)', border: 'none',
                          borderRadius: 4, color: '#888', fontSize: '0.72rem', cursor: 'pointer',
                        }}
                      >
                        {revealed[k.id] ? 'masquer' : 'voir'}
                      </PressButton>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#555', fontSize: '0.8rem' }}>
                      {k.createdAt?.slice(0, 10)}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <PressButton
                        onClick={() => handleDelete(k.id)}
                        disabled={deletingId === k.id}
                        style={{
                          padding: '0.3rem 0.7rem',
                          background: 'rgba(239,68,68,0.1)', color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 5, fontSize: '0.78rem', cursor: 'pointer',
                        }}
                      >
                        {deletingId === k.id ? '...' : 'Supprimer'}
                      </PressButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <GuideSection />
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
            transition: 'color 0.15s ease, background 0.15s ease',
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
