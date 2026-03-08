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
  const debug = [];
  try {
    const subRes = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers });
    const usageRes = await fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${new Date().toISOString().split('T')[0]}&end_date=${getTomorrow()}`, { headers });
    
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
  let percent = 0, resetTime = null, debug = [], detectedModel = 'Gemini';
  try {
    // 1. List models to find a valid one for this key
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();
    
    if (listRes.ok && listData.models && listData.models.length > 0) {
      // Pick the first flash or pro model
      const model = listData.models.find(m => m.name.includes('flash') || m.name.includes('pro')) || listData.models[0];
      const modelId = model.name.split('/').pop();
      detectedModel = modelId;
      
      // 2. Ping that model to get headers
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'a' }] }] })
      });
      
      const h = r.headers;
      const limit = parseInt(h.get('x-ratelimit-limit-requests') || h.get('x-goog-ratelimit-limit') || '0');
      const remaining = parseInt(h.get('x-ratelimit-remaining-requests') || h.get('x-goog-ratelimit-remaining') || '0');
      const reset = h.get('x-ratelimit-reset-requests') || h.get('x-goog-ratelimit-reset');
      
      if (limit > 0) {
        percent = parseFloat((( (limit - remaining) / limit) * 100).toFixed(2));
        if (reset) resetTime = new Date(Date.now() + parseInt(reset) * 1000).toISOString();
        debug.push(`Hdr OK (${modelId})`);
      } else {
        debug.push(`No Headers (${r.status})`);
      }
    } else {
      debug.push(`List failed: ${listRes.status}`);
    }
  } catch (e) { debug.push(`F:${e.message}`); }

  return {
    provider: 'Gemini',
    used: 0, limit: 0, percent,
    unit: 'RPM',
    label: percent > 0 ? `${percent}% utilisé` : 'Clé active (Quota masqué)',
    resetTime,
    models: [detectedModel],
    debug: debug.join('|')
  };
}

async function getAnthropicQuota(apiKey) {
  let limit = 1, remaining = 1, resetTime = null, debug = [];
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'x-api-key': apiKey, 
        'anthropic-version': '2023-06-01', 
        'content-type': 'application/json' 
      },
      body: JSON.stringify({ 
        model: 'claude-3-5-sonnet-20241022', 
        max_tokens: 10, 
        messages: [{ role: 'user', content: 'Ping' }] 
      })
    });
    
    const h = r.headers;
    const hLimit = h.get('anthropic-ratelimit-tokens-limit');
    const hRemaining = h.get('anthropic-ratelimit-tokens-remaining');
    const hReset = h.get('anthropic-ratelimit-requests-reset');

    if (hLimit) {
      limit = parseInt(hLimit);
      remaining = parseInt(hRemaining);
      if (hReset) resetTime = new Date(Date.now() + parseInt(hReset) * 1000).toISOString();
      debug.push('Hdr OK');
    } else {
      debug.push(`No Hdr (${r.status})`);
    }
  } catch (e) { debug.push(`Err:${e.message}`); }

  const used = limit - remaining;
  const percent = parseFloat(((used / limit) * 100).toFixed(2));
  return {
    provider: 'Anthropic',
    used, limit, percent,
    unit: 'tokens/min',
    label: limit > 1 ? `${(remaining/1000).toFixed(1)}k tokens restants` : 'Clé active (Quota masqué)',
    resetTime,
    models: ['Claude 3.5 Sonnet'],
    debug: debug.join('|')
  };
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
