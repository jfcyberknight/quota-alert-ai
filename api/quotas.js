export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = '';
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });

  const { provider, apiKey } = JSON.parse(body);
  if (!provider || !apiKey) return res.status(400).json({ error: 'Missing provider or apiKey' });

  try {
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
  const start = getStartOfMonth();
  const end = getTomorrow();

  const [subRes, usageRes] = await Promise.all([
    fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers }),
    fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`, { headers }),
  ]);

  if (!subRes.ok) {
    const err = await subRes.json().catch(() => ({}));
    return res.status(subRes.status).json({ error: err.error?.message || 'Clé OpenAI invalide' });
  }

  const sub = await subRes.json();
  const usage = usageRes.ok ? await usageRes.json() : {};

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
