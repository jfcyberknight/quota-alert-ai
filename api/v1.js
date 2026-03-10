import { readFileSync } from 'fs';
import { join } from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getOpenAIQuota, getGeminiQuota, getAnthropicQuota } from './_lib/extractors.js';

// Cache global pour réutiliser les instances entre les appels (Backend Efficiency)
let db, auth;

// Cache des réponses 429 Gemini par userId pour éviter de rappeler l'API à chaque refresh
const gemini429Cache = new Map();

function loadServiceAccount() {
  let saData = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saData) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');
  saData = saData.replace(/^\uFEFF/, '').trim();

  let raw;
  if (saData.startsWith('{')) {
    raw = saData;
  } else {
    const path = saData.startsWith('/') || /^[A-Za-z]:\\/.test(saData) ? saData : join(process.cwd(), saData);
    try {
      raw = readFileSync(path, 'utf8');
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT file not found: ' + saData);
    }
  }

  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  raw = raw.replace(/\\"/g, '"');
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT invalid JSON: ' + e.message);
  }
  if (sa.private_key && typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  return sa;
}

function initFirebase() {
  if (db && auth) return { db, auth };
  
  if (getApps().length > 0) {
    db = getFirestore();
    auth = getAuth();
    return { db, auth };
  }

  const sa = loadServiceAccount();
  const app = initializeApp({ credential: cert(sa) });
  db = getFirestore(app);
  auth = getAuth(app);
  return { db, auth };
}

export default async function handler(req, res) {
  // CORS configuration
  const origin = req.headers.origin;
  const allowedOrigins = ['https://quota-alert-ai-jv.web.app', 'https://quota-alert-ai-jv.firebaseapp.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split('Bearer ')[1];
  try {
    const { db, auth } = initFirebase();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Vercel auto-parses req.body for application/json. 
    // Manual parsing is removed to prevent hangs on already consumed streams.
    const providers = req.body?.ps || (req.body?.p ? [req.body.p] : null);

    if (!providers || providers.length === 0) {
      console.warn('[API] Missing providers in body:', req.body);
      return res.status(400).json({ error: 'Provider(s) missing in request body' });
    }

    // Récupérer toutes les clés de l'utilisateur en un seul appel Firestore (Optimization)
    const keysSnap = await db.collection('apiKeys').where('userId', '==', userId).get();
    const userKeys = {};
    keysSnap.forEach(doc => {
      const data = doc.data();
      userKeys[data.provider.toLowerCase()] = data.value;
    });

    // Traitement parallèle de tous les fournisseurs demandés (Batching)
    const results = await Promise.all(providers.map(async (p) => {
      const apiKey = userKeys[p.toLowerCase()];
      if (!apiKey) return { provider: p, error: 'Clé non trouvée' };

      if (p === 'Gemini') {
        const cached = gemini429Cache.get(userId);
        if (cached && Date.now() < cached.expiry) return cached.result;
        const result = await getGeminiQuota(apiKey);
        if (result.percent === 100 && result.resetTime) {
          const expiry = new Date(result.resetTime).getTime();
          gemini429Cache.set(userId, { result, expiry });
        } else {
          gemini429Cache.delete(userId);
        }
        return result;
      }
      if (p === 'OpenAI') return await getOpenAIQuota(apiKey);
      if (p === 'Anthropic') return await getAnthropicQuota(apiKey);
      return { provider: p, error: 'Unknown provider' };
    }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    // Si un seul provider demandé, on garde la compatibilité descendante du format de retour
    return res.json(results.length === 1 && !Array.isArray(req.body.ps) ? results[0] : { results });

  } catch (e) {
    console.error('[API ERROR]', e.message, e.stack);
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
