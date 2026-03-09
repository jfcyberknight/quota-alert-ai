export default function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && (origin.includes('web.app') || origin.includes('firebaseapp.com') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.status(200).json({ status: 'ok', message: 'Backend is active' });
}
