export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const origin = req.headers.get('origin');
  const allowedOrigins = ['https://quota-alert-ai-jv.web.app', 'https://quota-alert-ai-jv.firebaseapp.com', 'http://localhost:5173'];
  
  const headers = { 'Content-Type': 'application/json' };
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(JSON.stringify({ status: 'ok', message: 'Backend is active (Edge)' }), {
    status: 200,
    headers,
  });
}
