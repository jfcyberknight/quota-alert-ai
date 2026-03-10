/**
 * Utilitaires d'extraction de quota simulant le comportement des CLI officiels.
 */

export async function getOpenAIQuota(apiKey) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  try {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const firstDay = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];
    const nextMonth = m === 11 ? new Date(y + 1, 0, 1) : new Date(y, m + 1, 1);
    const resetTime = nextMonth.toISOString();

    const [subRes, usageRes] = await Promise.all([
      fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers }),
      fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${firstDay}&end_date=${today}`, { headers })
    ]);

    if (subRes.status === 403) {
      const modelsRes = await fetch('https://api.openai.com/v1/models', { headers });
      if (!modelsRes.ok) throw new Error('Clé OpenAI invalide ou bloquée');
      return {
        provider: 'OpenAI',
        used: 0, limit: 0, percent: 0,
        unit: 'USD',
        label: 'Clé active',
        statsUnavailableReason: 'Activer l’accès Billing sur ta clé (platform.openai.com → API keys) pour voir les quotas.',
        models: ['GPT-4o', 'GPT-3.5'],
        resetTime: null,
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
      resetTime,
      debug: `S:${subRes.status} U:${usageRes.status}`
    };
  } catch (e) {
    return { provider: 'OpenAI', error: e.message, percent: 0 };
  }
}

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];

export async function getGeminiQuota(apiKey) {
  let limit = 0, remaining = 0, percent = 0, resetTime = null, debug = [], detectedModel = GEMINI_MODELS[0];
  let r;
  try {
    for (const model of GEMINI_MODELS) {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'a' }] }] })
      });
      if (r.ok || r.status !== 404) { detectedModel = model; break; }
    }
  } catch (e) {
    debug.push(`F:${e.message}`);
  }
  if (!r) r = { ok: false, status: 404, headers: new Headers() };
  try {
    const h = r.headers;
    const hLimit = parseInt(h.get('x-ratelimit-limit-requests') || h.get('x-goog-ratelimit-limit') || h.get('ratelimit-limit') || '0');
    const hRemaining = parseInt(h.get('x-ratelimit-remaining-requests') || h.get('x-goog-ratelimit-remaining') || h.get('ratelimit-remaining') || '0');
    let hReset = h.get('x-ratelimit-reset-requests') || h.get('x-goog-ratelimit-reset') || h.get('ratelimit-reset');
    if (r.status === 429) {
      percent = 100;
      remaining = 0;
      limit = limit || 1;
      const retryAfter = h.get('retry-after') || h.get('Retry-After');
      const sec = retryAfter ? (parseInt(retryAfter) || 60) : 60;
      resetTime = new Date(Date.now() + sec * 1000).toISOString();
      debug.push('429');
    }
    if (hLimit > 0 && r.status !== 429) {
      limit = hLimit;
      remaining = hRemaining;
      percent = parseFloat((( (limit - remaining) / limit) * 100).toFixed(2));
      if (hReset) {
        const resetVal = parseInt(hReset);
        resetTime = resetVal > 1000000000 ? new Date(resetVal * 1000).toISOString() : new Date(Date.now() + resetVal * 1000).toISOString();
      }
      debug.push('H OK');
    } else if (r.ok) {
      limit = 15;
      remaining = 15;
      debug.push('Free');
    } else if (percent === 0) {
      debug.push(`St:${r.status}`);
    }
  } catch (e) { debug.push(`F:${e.message}`); }

  const is429 = debug.includes('429');
  const label = is429 ? 'Limite atteinte' : (limit > 0 ? `${percent.toFixed(1)}% (${limit} RPM)` : 'Clé active');
  return {
    provider: 'Gemini',
    used: limit - remaining, limit, percent,
    unit: 'RPM',
    label,
    resetTime,
    models: [detectedModel],
    debug: debug.join('|')
  };
}

const ANTHROPIC_MODELS = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];

export async function getAnthropicQuota(apiKey) {
  let limit = 0, remaining = 0, resetTime = null, debug = [];
  let errorMessage = null;
  let status = 0;

  let modelId = null;
  try {
    const listRes = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData?.data?.length) modelId = listData.data[0].id;
    }
  } catch (_) {}

  const modelsToTry = modelId ? [modelId] : ANTHROPIC_MODELS;
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  for (const model of modelsToTry) {
    try {
      const promise = client.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      });
      const withResp = promise.withResponse ? promise.withResponse() : null;
      if (withResp) {
        const { response } = await withResp;
        status = response.status;
        const h = response.headers;
        const tLimit = parseInt(h.get('anthropic-ratelimit-tokens-limit') || h.get('x-ratelimit-limit-tokens') || '0');
        const tRemaining = parseInt(h.get('anthropic-ratelimit-tokens-remaining') || h.get('x-ratelimit-remaining-tokens') || '0');
        const hReset = h.get('anthropic-ratelimit-tokens-reset') || h.get('retry-after');
        if (tLimit > 0) {
          limit = tLimit;
          remaining = tRemaining;
          if (hReset) {
            const seconds = parseInt(hReset) || 60;
            resetTime = new Date(Date.now() + seconds * 1000).toISOString();
          }
          debug.push('H OK');
        } else {
          debug.push(`St:${response.status}`);
        }
      } else {
        await promise;
        status = 200;
        debug.push('H OK');
      }
      break;
    } catch (e) {
      status = e.status ?? 0;
      errorMessage = e.message ?? String(e);
      if (e.status === 429) {
        const h = e.headers;
        const retryAfter = (typeof h?.get === 'function' ? h.get('retry-after') : h?.['retry-after']) || e.retryAfter;
        const sec = retryAfter ? (parseInt(String(retryAfter)) || 60) : 60;
        resetTime = new Date(Date.now() + sec * 1000).toISOString();
        limit = 1;
        remaining = 0;
        debug.push('429');
        break;
      }
      if (e.status !== 400 && e.status !== 404) break;
    }
  }

  const used = limit - remaining;
  const percent = limit > 0 ? parseFloat(((used / limit) * 100).toFixed(2)) : 0;
  if (limit === 0 && status) debug.push(`St:${status}`);
  if (limit === 0 && errorMessage) debug.push(errorMessage.slice(0, 80));

  const label = limit > 0
    ? `${percent.toFixed(1)}% tokens`
    : (errorMessage ? `Clé active (${errorMessage.slice(0, 50)}…)` : 'Clé active');
  const statsUnavailableReason = limit === 0 && !errorMessage
    ? 'Anthropic n’expose pas les limites pour ce compte. Contacter le support pour les activer.'
    : null;

  return {
    provider: 'Anthropic',
    used, limit, percent,
    unit: 'tokens',
    label,
    statsUnavailableReason: statsUnavailableReason || undefined,
    resetTime,
    models: ['Claude 3 Haiku'],
    debug: debug.join('|')
  };
}
