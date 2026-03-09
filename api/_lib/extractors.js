/**
 * Utilitaires d'extraction de quota simulant le comportement des CLI officiels.
 */

export async function getOpenAIQuota(apiKey) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    // Appel parallèle pour gagner 50% de temps de réponse
    const [subRes, usageRes] = await Promise.all([
      fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers }),
      fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${today}&end_date=${tomorrow}`, { headers })
    ]);
    
    if (subRes.status === 403) {
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

export async function getGeminiQuota(apiKey) {
  let limit = 0, remaining = 0, percent = 0, resetTime = null, debug = [], detectedModel = 'gemini-1.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${detectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'a' }] }] })
    });
    
    const h = r.headers;
    const hLimit = parseInt(h.get('x-ratelimit-limit-requests') || h.get('x-goog-ratelimit-limit') || h.get('ratelimit-limit') || '0');
    const hRemaining = parseInt(h.get('x-ratelimit-remaining-requests') || h.get('x-goog-ratelimit-remaining') || h.get('ratelimit-remaining') || '0');
    const hReset = h.get('x-ratelimit-reset-requests') || h.get('x-goog-ratelimit-reset') || h.get('ratelimit-reset');
    
    if (hLimit > 0) {
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
    } else {
      debug.push(`St:${r.status}`);
    }
  } catch (e) { debug.push(`F:${e.message}`); }

  return {
    provider: 'Gemini',
    used: limit - remaining, limit, percent,
    unit: 'RPM',
    label: limit > 0 ? `${percent.toFixed(1)}% (${limit} RPM)` : 'Clé active',
    resetTime,
    models: [detectedModel],
    debug: debug.join('|')
  };
}

export async function getAnthropicQuota(apiKey) {
  let limit = 0, remaining = 0, resetTime = null, debug = [];
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ 
        model: 'claude-3-haiku-20240307', 
        max_tokens: 10, 
        messages: [{ role: 'user', content: 'Hi' }] 
      })
    });
    
    const h = r.headers;
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
      debug.push(`St:${r.status}`);
    }
  } catch (e) { debug.push(`Err:${e.message}`); }

  const used = limit - remaining;
  const percent = limit > 0 ? parseFloat(((used / limit) * 100).toFixed(2)) : 0;
  return {
    provider: 'Anthropic',
    used, limit, percent,
    unit: 'tokens',
    label: limit > 0 ? `${percent.toFixed(1)}% tokens` : 'Clé active',
    resetTime,
    models: ['Claude 3 Haiku'],
    debug: debug.join('|')
  };
}
