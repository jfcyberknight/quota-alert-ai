import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getOpenAIQuota, getGeminiQuota, getAnthropicQuota } from './_lib/extractors.js';

function initFirebase() {
  if (getApps().length > 0) return { db: getFirestore(), auth: getAuth() };
  let saData = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saData) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');
  
  if ((saData.startsWith('"') && saData.endsWith('"')) || (saData.startsWith("'") && saData.endsWith("'"))) {
    saData = saData.slice(1, -1);
  }
  
  let sa;
  try {
    sa = JSON.parse(saData);
  } catch (err) {
    throw new Error(`JSON parse error in FIREBASE_SERVICE_ACCOUNT: ${err.message}. Data starts with: ${saData.substring(0, 30)}`);
  }

  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  
  const app = initializeApp({ credential: cert(sa) });
  return { db: getFirestore(app), auth: getAuth(app) };
}

export default async function handler(req, res) {
  console.log('[API] Request received:', req.method, req.url);
  console.log('[API] Node version:', process.version);
  console.log('[API] Global fetch available:', typeof fetch !== 'undefined');
  // CORS configuration
  const origin = req.headers.origin;
  const allowedOrigins = ['https://quota-alert-ai-jv.web.app', 'https://quota-alert-ai-jv.firebaseapp.com', 'http://localhost:5173'];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[API] Missing/invalid Authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    console.log('[API] Calling initFirebase...');
    const { db, auth } = initFirebase();
    
    let decodedToken;
    try {
      console.log('[API] Verifying ID token...');
      decodedToken = await auth.verifyIdToken(token);
      console.log('[API] Token verified, userId:', decodedToken.uid);
    } catch (authErr) {
      console.warn('[API AUTH ERROR]', authErr.message);
      return res.status(401).json({ error: 'Unauthorized: ' + authErr.message });
    }

    const userId = decodedToken.uid;

    // Vercel auto-parses req.body for application/json
    let provider;
    if (req.body && req.body.p) {
      provider = req.body.p;
      console.log('[API] Provider from req.body:', provider);
    } else {
      console.log('[API] Manually parsing body...');
      let body = '';
      await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
      const parsed = JSON.parse(body || '{}');
      provider = parsed.p;
      console.log('[API] Provider from manual parse:', provider);
    }

    if (!provider) {
      console.warn('[API] Provider missing');
      return res.status(400).json({ error: 'Provider missing in request body' });
    }

    console.log('[API] Fetching API key for provider:', provider);
    const q = await db.collection('apiKeys').where('userId', '==', userId).where('provider', '==', provider.toLowerCase()).get();
    if (q.empty) {
      console.warn('[API] API key not found for provider:', provider);
      return res.status(404).json({ error: 'Clé non trouvée' });
    }
    const apiKey = q.docs[0].data().value;
    console.log('[API] API key found');

    let result;
    if (provider === 'OpenAI') result = await getOpenAIQuota(apiKey);
    else if (provider === 'Anthropic') result = await getAnthropicQuota(apiKey);
    else if (provider === 'Gemini') result = await getGeminiQuota(apiKey);
    else return res.status(400).json({ error: 'Unknown provider' });

    console.log(`[API] Result for ${provider}:`, JSON.stringify(result, null, 2));
    return res.json(result);
  } catch (e) {
    console.error('[API ERROR]', e.message, e.stack);
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
