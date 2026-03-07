import webpush from 'web-push';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const THRESHOLD = 80; // alert when quota >= 80%

function initFirebase() {
  if (getApps().length > 0) return getFirestore();
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({ credential: cert(sa) });
  return getFirestore();
}

webpush.setVapidDetails(
  'mailto:admin@quotaalert.ai',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = initFirebase();
    const subsSnap = await db.collection('pushSubscriptions').get();
    const results = [];

    for (const subDoc of subsSnap.docs) {
      const { userId, subscription } = subDoc.data();
      const keysSnap = await db.collection('apiKeys').where('userId', '==', userId).get();

      for (const keyDoc of keysSnap.docs) {
        const key = keyDoc.data();
        try {
          const quota = await fetchQuota(key.provider, key.value);
          if (quota && quota.percent >= THRESHOLD) {
            await webpush.sendNotification(subscription, JSON.stringify({
              title: `⚠️ ${key.provider} — ${quota.percent}% utilisé`,
              body: quota.label,
              url: '/',
            }));
            results.push({ userId, provider: key.provider, percent: quota.percent, sent: true });
          } else {
            results.push({ userId, provider: key.provider, percent: quota?.percent ?? 0, sent: false });
          }
        } catch (e) {
          results.push({ userId, provider: key.provider, error: e.message });
        }
      }
    }

    return res.json({ ok: true, checked: results.length, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function fetchQuota(provider, apiKey) {
  if (provider === 'OpenAI') {
    const h = { Authorization: `Bearer ${apiKey}` };
    const start = fmtDate(new Date(new Date().setDate(1)));
    const end = fmtDate(new Date(Date.now() + 86400000));
    const [subRes, usageRes] = await Promise.all([
      fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers: h }),
      fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`, { headers: h }),
    ]);
    if (!subRes.ok) return null;
    const sub = await subRes.json();
    const usage = usageRes.ok ? await usageRes.json() : {};
    const limit = sub.hard_limit_usd || sub.soft_limit_usd || 0;
    const used = (usage.total_usage || 0) / 100;
    return { percent: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0, label: `$${used.toFixed(2)} / $${limit.toFixed(2)}` };
  }

  if (provider === 'Anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    });
    if (!r.ok) return null;
    const tokLimit = parseInt(r.headers.get('anthropic-ratelimit-tokens-limit') || '0');
    const tokRemaining = parseInt(r.headers.get('anthropic-ratelimit-tokens-remaining') || '0');
    const tokUsed = tokLimit - tokRemaining;
    return { percent: tokLimit > 0 ? Math.min(100, Math.round((tokUsed / tokLimit) * 100)) : 0, label: `${tokUsed.toLocaleString()} / ${tokLimit.toLocaleString()} tokens` };
  }

  return null; // Gemini: no quota API
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
