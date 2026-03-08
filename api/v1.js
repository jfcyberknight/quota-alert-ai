import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function initFirebase() {
  if (getApps().length > 0) return { db: getFirestore(), auth: getAuth() };
  const saData = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saData) throw new Error('Variable FIREBASE_SERVICE_ACCOUNT manquante');
  const sa = JSON.parse(saData);
  const app = initializeApp({ credential: cert(sa) });
  return { db: getFirestore(app), auth: getAuth(app) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split('Bearer ')[1];
  try {
    const { db, auth } = initFirebase();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    let body = '';
    await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
    const { p: provider } = JSON.parse(body);

    const q = await db.collection('apiKeys').where('userId', '==', userId).where('provider', '==', provider.toLowerCase()).get();
    if (q.empty) return res.status(404).json({ error: 'Clé non trouvée' });
    const apiKey = q.docs[0].data().value;

    let result;
    if (provider === 'OpenAI') result = await getOpenAIQuota(apiKey);
    else if (provider === 'Anthropic') result = await getAnthropicQuota(apiKey);
    else if (provider === 'Gemini') result = await getGeminiQuota(apiKey);
    else return res.status(400).json({ error: 'Unknown provider' });

    console.log(`[API] Result for ${provider}:`, JSON.stringify(result, null, 2));
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getOpenAIQuota(apiKey) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  try {
    const subRes = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers });
    const usageRes = await fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${new Date().toISOString().split('T')[0]}&end_date=${getTomorrow()}`, { headers });
    
    if (subRes.status === 403) {
      // Endpoint bloqué par OpenAI pour les clés standards. On vérifie juste la validité de la clé.
      const modelsRes = await fetch('https://api.openai.com/v1/models', { headers });
      if (!modelsRes.ok) throw new Error('Clé OpenAI invalide ou bloquée');
      return {
        provider: 'OpenAI',
        used: 0, limit: 0, percent: 0,
        unit: 'USD',
        label: 'Clé active (Quota masqué par OpenAI)',
        models: ['GPT-4o', 'GPT-3.5'],
        debug: `S:${subRes.status}`
      };
    }

    const sub = await subRes.json();
    const usage = await usageRes.json();
    
    const limit = sub.hard_limit_usd || 0;
    const used = (usage.total_usage || 0) / 100;
    const percent = limit > 0 ? parseFloat(((used / limit) * 100).toFixed(2)) : 0;

    return {
      provider: 'OpenAI',
      used, limit, percent,
      unit: 'USD',
      label: `$${used.toFixed(2)} / $${limit.toFixed(2)}`,
      models: ['GPT-4o', 'GPT-3.5'],
      debug: `S:${subRes.status} U:${usageRes.status}`
    };
  } catch (e) {
    return { provider: 'OpenAI', error: e.message, percent: 0 };
  }
}

async function getGeminiQuota(apiKey) {
  let limit = 0, remaining = 0, percent = 0, resetTime = null, debug = [], detectedModel = 'gemini-2.5-flash';
  try {
    const modelId = 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'a' }] }] })
    });
    
    const h = r.headers;
    const hLimit = parseInt(h.get('x-ratelimit-limit-requests') || h.get('x-goog-ratelimit-limit') || '0');
    const hRemaining = parseInt(h.get('x-ratelimit-remaining-requests') || h.get('x-goog-ratelimit-remaining') || '0');
    const hReset = h.get('x-ratelimit-reset-requests') || h.get('x-goog-ratelimit-reset');
    
    if (hLimit > 0) {
      limit = hLimit;
      remaining = hRemaining;
      percent = parseFloat((( (limit - remaining) / limit) * 100).toFixed(2));
      if (hReset) resetTime = new Date(Date.now() + parseInt(hReset) * 1000).toISOString();
      debug.push('Hdr OK');
    } else if (r.ok) {
      // Fallback: Key is valid but no headers. Assume Free Tier (15 RPM)
      limit = 15;
      remaining = 15;
      percent = 0;
      debug.push('Fallback 15RPM');
    } else {
      debug.push(`Err:${r.status}`);
    }
  } catch (e) { debug.push(`F:${e.message}`); }

  return {
    provider: 'Gemini',
    used: limit - remaining, limit, percent,
    unit: 'RPM',
    label: limit > 0 ? `${percent.toFixed(2)}% utilisé` : 'Clé active (Quota masqué)',
    resetTime,
    models: [detectedModel],
    debug: debug.join('|')
  };
}

async function getAnthropicQuota(apiKey) {
  let limit = 1, remaining = 1, resetTime = null, debug = [];
  let errorLabel = null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ 
        model: 'claude-3-haiku-20240307', 
        max_tokens: 1, 
        messages: [{ role: 'user', content: 'Ping' }] 
      })
    });
    
    const h = r.headers;
    const hLimit = h.get('anthropic-ratelimit-tokens-limit') || h.get('x-ratelimit-limit-tokens');
    const hRemaining = h.get('anthropic-ratelimit-tokens-remaining') || h.get('x-ratelimit-remaining-tokens');
    const hReset = h.get('anthropic-ratelimit-requests-reset') || h.get('retry-after');

    if (hLimit) {
      limit = parseInt(hLimit);
      remaining = parseInt(hRemaining);
      if (hReset) resetTime = new Date(Date.now() + parseInt(hReset) * 1000).toISOString();
      debug.push('Hdr OK');
    } else if (r.ok) {
      debug.push('OK but No Hdr');
    } else {
      debug.push(`St:${r.status}`);
      if (r.status === 400) {
         const errBody = await r.json().catch(() => ({}));
         if (errBody?.error?.message?.includes('credit balance is too low')) {
            errorLabel = 'Crédits épuisés';
         }
      }
    }
  } catch (e) { debug.push(`Err:${e.message}`); }

  const used = limit - remaining;
  const percent = parseFloat(((used / limit) * 100).toFixed(2));
  return {
    provider: 'Anthropic',
    used, limit, percent,
    unit: 'tokens/min',
    label: errorLabel || (limit > 1 ? `${percent.toFixed(2)}% utilisé` : 'Clé active (Quota masqué)'),
    resetTime,
    models: ['Claude 3 Haiku'],
    debug: debug.join('|')
  };
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
