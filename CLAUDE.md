# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server only (frontend)
npm run dev:full     # Start Vite + local API server concurrently
npm run build        # Production build
npm run lint         # ESLint
```

There are no tests configured in this project.

## Architecture

**QuotaAlert AI** is a React + Vite app that monitors AI provider quotas (OpenAI, Anthropic, Gemini) and sends push notifications when usage exceeds 80%.

### Two deployment targets (deployed simultaneously via CI/CD)

1. **Vercel** — hosts the React SPA and runs the serverless API functions (`/api/`)
2. **Firebase Hosting** — also hosts the built SPA (dual deploy)

Firestore rules are deployed to Firebase project `quota-alert-ai-jv` on every push to `main`/`master`.

### Frontend (`src/`)

- `main.jsx` → `App.jsx` using React Router v7 with two routes: `/` and `/admin`
- Auth state from Firebase drives routing: unauthenticated users see `<Landing>`, authenticated users see `<Dashboard>`
- `src/firebase.js` — initializes Firebase client SDK, exports `auth`, `db`, `loginWithGoogle`, `logout`
- `src/hooks/usePushNotifications.js` — manages Web Push subscription lifecycle; stores subscription objects in Firestore `pushSubscriptions/{userId}`
- `src/pages/AdminPage.jsx` — sidebar nav with sections; only "API Keys" section (`<ApiKeysSection>`) is fully implemented; other sections are placeholders

### API (`api/` — Vercel serverless functions)

- `api/quotas.js` — POST endpoint called by the dashboard; proxies quota checks to OpenAI/Anthropic/Gemini APIs using the user's stored key. Returns `{ used, limit, percent, unit, label }`.
- `api/cron.js` — GET endpoint meant to be called on a schedule (protected by `CRON_SECRET` header); reads all `pushSubscriptions` and `apiKeys` from Firestore via `firebase-admin`, fetches quotas, and sends Web Push notifications for any provider at >= 80%.
- `api/status.js` — simple health check

### Firestore Collections

| Collection | Document ID | Purpose |
|---|---|---|
| `apiKeys` | auto | Stores `{ userId, provider, name, value, createdAt }` |
| `pushSubscriptions` | `{userId}` | Stores Web Push subscription object |

### Environment Variables

**Frontend (Vite — must be prefixed `VITE_`):**
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_VAPID_PUBLIC_KEY`

**Backend (Vercel serverless only):**
- `FIREBASE_SERVICE_ACCOUNT` — full service account JSON (stringified)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `CRON_SECRET` — bearer token to protect `api/cron.js`

### Key design notes

- API keys are stored **in plaintext** in Firestore. Firestore rules enforce that only the owner can create/delete their own keys, but any authenticated user can read all keys (current security limitation).
- The quota-fetching logic is **duplicated** between `api/quotas.js` (frontend-triggered) and `api/cron.js` (cron-triggered) — these need to be kept in sync if quota logic changes.
- The service worker file (`/sw.js`) must be served at the root — it should exist in the `public/` folder for Vite to serve it correctly.
- Provider names have a case inconsistency: `AdminPage` stores them lowercase (`openai`, `anthropic`, `gemini`) while `App.jsx` and `api/quotas.js` use title case (`OpenAI`, `Anthropic`, `Gemini`). The dashboard normalizes this via a `providers.find()` lookup.
