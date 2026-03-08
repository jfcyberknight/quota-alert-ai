import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function test() {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(sa) });
  const db = getFirestore();

  const snapshot = await db.collection('apiKeys').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`\n--- Testing ${data.provider} (User: ${data.userId}) ---`);
    const apiKey = data.value;

    if (data.provider === 'openai') {
      const headers = { Authorization: `Bearer ${apiKey}` };
      const sub = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', { headers }).then(r => r.json());
      const usage = await fetch('https://api.openai.com/v1/dashboard/billing/usage?start_date=2024-01-01&end_date=2024-03-31', { headers }).then(r => r.json());
      const grants = await fetch('https://api.openai.com/v1/dashboard/billing/credit_grants', { headers }).then(r => r.json());
      
      console.log('OpenAI Sub:', JSON.stringify(sub, null, 2));
      console.log('OpenAI Usage:', JSON.stringify(usage, null, 2));
      console.log('OpenAI Grants:', JSON.stringify(grants, null, 2));
    }

    if (data.provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      });
      console.log('Anthropic Headers:', JSON.stringify(Object.fromEntries(r.headers.entries()), null, 2));
    }

    if (data.provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      console.log(`Gemini /models: ${r.status}`);
    }
  }
}

test().catch(console.error);
