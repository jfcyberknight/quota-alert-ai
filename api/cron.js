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
    // OpenAI billing APIs are blocked for standard keys. We can't reliably trigger a quota alert.
    return null;
  }

  if (provider === 'Anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'Ping' }] })
    });
    if (!r.ok) return null;
    const tokLimit = parseInt(r.headers.get('anthropic-ratelimit-tokens-limit') || '0');
    const tokRemaining = parseInt(r.headers.get('anthropic-ratelimit-tokens-remaining') || '0');
    const tokUsed = tokLimit - tokRemaining;
    return { percent: tokLimit > 0 ? Math.min(100, Math.round((tokUsed / tokLimit) * 100)) : 0, label: `${tokUsed.toLocaleString()} / ${tokLimit.toLocaleString()} tokens` };
  }
  
  if (provider === 'Gemini') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'a' }] }] })
    });
    const hLimit = parseInt(r.headers.get('x-ratelimit-limit-requests') || r.headers.get('x-goog-ratelimit-limit') || '0');
    const hRemaining = parseInt(r.headers.get('x-ratelimit-remaining-requests') || r.headers.get('x-goog-ratelimit-remaining') || '0');
    if (hLimit > 0) {
      const used = hLimit - hRemaining;
      return { percent: Math.min(100, Math.round((used / hLimit) * 100)), label: `${used} / ${hLimit} reqs` };
    }
  }

  return null;
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
