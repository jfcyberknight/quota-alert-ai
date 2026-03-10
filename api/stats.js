import { readFileSync } from 'fs';
import { join } from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let db, auth;

function loadServiceAccount() {
  let saData = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saData) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');
  saData = saData.replace(/^\uFEFF/, '').trim();
  let raw;
  if (saData.startsWith('{')) {
    raw = saData;
  } else {
    const path = saData.startsWith('/') || /^[A-Za-z]:\\/.test(saData) ? saData : join(process.cwd(), saData);
    raw = readFileSync(path, 'utf8');
  }
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) raw = raw.slice(1, -1);
  raw = raw.replace(/\\"/g, '"');
  const sa = JSON.parse(raw);
  if (sa.private_key && typeof sa.private_key === 'string') sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

function initFirebase() {
  if (db && auth) return { db, auth };
  if (getApps().length > 0) {
    db = getFirestore();
    auth = getAuth();
    return { db, auth };
  }
  const app = initializeApp({ credential: cert(loadServiceAccount()) });
  db = getFirestore(app);
  auth = getAuth(app);
  return { db, auth };
}

const allowedOrigins = ['https://quota-alert-ai-jv.web.app', 'https://quota-alert-ai-jv.firebaseapp.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];

export default async function handler(req, res) {
  const origin = req.headers?.origin || req.headers?.Origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || !String(authHeader).startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { db, auth } = initFirebase();
    await auth.verifyIdToken(String(authHeader).replace('Bearer ', ''));

    const [subSnap, keysSnap] = await Promise.all([
      db.collection('pushSubscriptions').get(),
      db.collection('apiKeys').get(),
    ]);

    const users = subSnap.size;
    const quotasMonitored = keysSnap.size;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.json({
      users,
      quotasMonitored,
      alertsSent: 0,
      apiCallsToday: null,
    });
  } catch (e) {
    console.error('[API STATS ERROR]', e.message);
    return res.status(500).json({ error: e.message });
  }
}
