import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function initFirebase() {
  if (getApps().length > 0) return { db: getFirestore(), auth: getAuth() };
  const saData = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saData) {
    throw new Error('La variable FIREBASE_SERVICE_ACCOUNT est manquante dans le backend.');
  }
  const sa = JSON.parse(saData);
  const app = initializeApp({ credential: cert(sa) });
  return { db: getFirestore(app), auth: getAuth(app) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  const { db, auth } = initFirebase();

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log(`[API] User authenticated: ${userId}`);

    let body = '';
    await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
    const { p: provider } = JSON.parse(body);
    console.log(`[API] Requested provider: ${provider}`);

    if (!provider) return res.status(400).json({ error: 'Missing provider' });

    // Fetch key from Firestore for this specific user and provider
    const providerLower = provider.toLowerCase();
    const q = await db.collection('apiKeys')
      .where('userId', '==', userId)
      .where('provider', '==', providerLower)
      .get();

    console.log(`[API] Firestore result size: ${q.size}`);

    if (q.empty) return res.status(404).json({ error: 'Clé non trouvée' });
    const apiKey = q.docs[0].data().value;

    if (provider === 'OpenAI') return await getOpenAIQuota(apiKey, res);
    if (provider === 'Anthropic') return await getAnthropicQuota(apiKey, res);
    if (provider === 'Gemini') return await getGeminiQuota(apiKey, res);
    return res.status(400).json({ error: 'Unknown provider' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getOpenAIQuota(apiKey, res) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  
  // First, verify if the key is actually valid using a standard endpoint
  const checkRes = await fetch('https://api.openai.com/v1/models', { headers });
  if (!checkRes.ok) {
    const err = await checkRes.json().catch(() => ({}));
    return res.status(checkRes.status).json({ error: err.error?.message || 'Clé OpenAI invalide' });
  }

  const start = getStartOfMonth();
  const end = getTomorrow();

  // Try to get billing info (often restricted for standard API keys)
  try {
    const [subRes, usageRes] = await Promise.all([
      fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers }),
      fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`, { headers }),
    ]);

    if (subRes.ok && usageRes.ok) {
      const sub = await subRes.json();
      const usage = await usageRes.json();
      const limit = sub.hard_limit_usd || sub.soft_limit_usd || 0;
      const used = (usage.total_usage || 0) / 100;

      return res.json({
        provider: 'OpenAI',
        used,
        limit,
        percent: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
        unit: 'USD',
        label: `$${used.toFixed(2)} / $${limit.toFixed(2)}`,
      });
    }
  } catch (err) {
    console.error('[API] OpenAI billing fetch failed:', err.message);
  }

  // Fallback: Key is valid but billing info is inaccessible
  return res.json({
    provider: 'OpenAI',
    used: 0,
    limit: 0,
    percent: 0,
    unit: 'USD',
    label: 'Clé valide — facturation masquée par OpenAI',
  });
}

async function getAnthropicQuota(apiKey, res) {
  const r = await fetch('https://api.anthropic.com/v1/models', {
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return res.status(r.status).json({ error: err.error?.message || 'Clé Anthropic invalide' });
  }

  const tokLimit = parseInt(r.headers.get('anthropic-ratelimit-tokens-limit') || '0');
  const tokRemaining = parseInt(r.headers.get('anthropic-ratelimit-tokens-remaining') || '0');
  const tokUsed = tokLimit - tokRemaining;

  return res.json({
    provider: 'Anthropic',
    used: tokUsed,
    limit: tokLimit,
    percent: tokLimit > 0 ? Math.min(100, Math.round((tokUsed / tokLimit) * 100)) : 0,
    unit: 'tokens/min',
    label: tokLimit > 0 ? `${tokUsed.toLocaleString()} / ${tokLimit.toLocaleString()} tokens` : 'Clé valide',
  });
}

async function getGeminiQuota(apiKey, res) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return res.status(r.status).json({ error: err.error?.message || 'Clé Gemini invalide' });
  }

  return res.json({
    provider: 'Gemini',
    used: 0,
    limit: 0,
    percent: 0,
    unit: '',
    label: 'Clé valide — quota non exposé par l\'API',
  });
}

function getStartOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
