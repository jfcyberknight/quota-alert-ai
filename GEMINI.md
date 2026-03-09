# 🧠 Project Overview: quota-alert-ai

`quota-alert-ai` is a multi-source quota monitoring application for AI services (OpenAI, Anthropic, Google Gemini). It provides real-time tracking of usage (RPM, TPM, costs) and implements an intelligent alerting system.

## 🛠️ Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Firebase Firestore (Centralized storage for user API keys and settings)
- **Authentication**: Firebase Auth (Google Provider)
- **Deployment**: Vercel (API & Frontend) and optionally Firebase Hosting

## 🏗️ Architecture
- `/api`: Contains Vercel serverless functions (e.g., `v1.js` for quota fetching, `cron.js` for periodic checks).
- `/src`: Frontend React application.
- `/scripts`: Utility scripts for development and debugging.
- `.agents/workflows`: Instructional guides for specialized AI agents (Orchestrator, App Developer, etc.).

---

# 🚀 Getting Started

## 📦 Installation
```powershell
npm install
```

## 🛠️ Development
To run both the frontend and the local API proxy:
```powershell
npm run dev:full
```
- Frontend: `http://localhost:5173`
- API Proxy: `http://localhost:3000` (proxied via `/api` in Vite)

## 🏗️ Building
```powershell
npm run build
```

## 🧪 Testing & Linting
```powershell
npm run lint
```

---

# 📖 Development Conventions

- **API Routes**: All backend logic resides in the `/api` directory. Routes are accessed via the `/api/*` prefix.
- **Firebase Admin**: The backend uses `firebase-admin` and requires a `FIREBASE_SERVICE_ACCOUNT` environment variable (JSON string).
- **Quota Fetching**: The logic in `api/v1.js` simulates official CLI behavior by extracting deep metadata from response headers (e.g., `x-ratelimit-*`).
- **Autonomous Mode**: The project includes `yolo.ps1` and `yolo.sh` to run the Gemini CLI in autonomous mode (`--approval-mode=yolo`).
- **Styling**: Vanilla CSS and Tailwind CSS are used.

# 🔑 Essential Environment Variables
- `VITE_FIREBASE_*`: Client-side Firebase configuration.
- `FIREBASE_SERVICE_ACCOUNT`: JSON credentials for the Firebase Admin SDK.
- `VERCEL_TOKEN`: Required for Vercel CLI operations.
- `FIREBASE_TOKEN`: Required for Firebase Hosting/Firestore rules deployment.
