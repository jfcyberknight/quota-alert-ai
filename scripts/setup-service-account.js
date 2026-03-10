/**
 * Configure FIREBASE_SERVICE_ACCOUNT pour le backend (API locale / Vercel).
 * Utilise le Firebase CLI pour le projet et peut ouvrir la console ou créer la clé via gcloud.
 *
 * Usage:
 *   node scripts/setup-service-account.js              # Ouvre la console + instructions
 *   node scripts/setup-service-account.js chemin.json  # Lit le JSON et met à jour .env.local
 */

import { readFileSync, readFile, writeFile, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const envPath = join(process.cwd(), '.env.local');
const keyPath = process.argv[2];

function getProjectId() {
  try {
    const firebasercPath = join(process.cwd(), '.firebaserc');
    const content = readFileSync(firebasercPath, 'utf8');
    const parsed = JSON.parse(content);
    return parsed.projects?.default || parsed.default;
  } catch {
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const m = envContent.match(/VITE_FIREBASE_PROJECT_ID=(.+)/);
      return m ? m[1].trim() : null;
    } catch {
      return null;
    }
  }
}

function getFirebaseAdminAccount(projectId) {
  try {
    const out = execSync(
      `gcloud iam service-accounts list --project=${projectId} --filter="email~firebase-adminsdk" --format="value(email)"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return out.trim().split('\n')[0] || null;
  } catch {
    return null;
  }
}

function openUrl(url) {
  const platform = process.platform;
  const cmd = platform === 'win32' ? `start "" "${url}"` : platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    console.log('Ouvre ce lien dans ton navigateur:', url);
  }
}

function tryGcloudCreateKey(projectId, outFile) {
  const email = getFirebaseAdminAccount(projectId);
  if (!email) return false;
  try {
    execSync(`gcloud iam service-accounts keys create "${outFile}" --iam-account=${email} --project=${projectId}`, {
      encoding: 'utf8',
      stdio: 'inherit',
    });
    return true;
  } catch {
    return false;
  }
}

function addToEnvLocal(line, key = 'FIREBASE_SERVICE_ACCOUNT') {
  return new Promise((resolve, reject) => {
    readFile(envPath, 'utf8', (err, content) => {
      const lines = err && err.code === 'ENOENT' ? [] : content.split(/\r?\n/);
      const newLines = lines.some((l) => l.startsWith(key + '='))
        ? lines.map((l) => (l.startsWith(key + '=') ? line : l))
        : [...lines, '', `# Compte de service Firebase`, line];

      writeFile(envPath, newLines.join('\n') + '\n', (writeErr) => {
        if (writeErr) reject(writeErr);
        else resolve();
      });
    });
  });
}

// --- Sans argument : projet via Firebase / .env, puis gcloud ou console
if (!keyPath) {
  let projectId = getProjectId();
  if (!projectId) {
    try {
      const out = execSync('npx firebase-tools use', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const m = out.match(/Active project: (\S+)/i) || out.match(/(\w[\w-]+)/);
      projectId = m ? m[1].trim() : null;
    } catch {
      projectId = null;
    }
  }
  if (!projectId) {
    console.log(`
Projet Firebase introuvable.
  - Lance "npx firebase-tools use" et choisis le projet (ex: quota-alert-ai-jv)
  - Ou ajoute VITE_FIREBASE_PROJECT_ID=quota-alert-ai-jv dans .env.local
`);
    process.exit(1);
  }

  const keyFile = join(process.cwd(), 'service-account-key.json');
  console.log(`Projet: ${projectId}\n`);

  // 1) Tenter gcloud pour créer la clé
  if (tryGcloudCreateKey(projectId, keyFile)) {
    console.log('Clé créée avec gcloud. Ajout à .env.local...');
    const parsed = JSON.parse(readFileSync(keyFile, 'utf8').replace(/\r/g, ''));
    const targetFile = join(process.cwd(), 'service-account.json');
    writeFileSync(targetFile, JSON.stringify(parsed, null, 2), 'utf8');
    const line = 'FIREBASE_SERVICE_ACCOUNT=./service-account.json';
    addToEnvLocal(line)
      .then(() => {
        console.log('FIREBASE_SERVICE_ACCOUNT a été ajouté dans .env.local');
        try {
          unlinkSync(keyFile);
          console.log('Fichier temporaire supprimé.');
        } catch {
          console.log('Supprime le fichier', keyFile, 'après usage (ne pas le commiter).');
        }
        process.exit(0);
      })
      .catch((e) => {
        console.error('Erreur écriture .env.local:', e.message);
        process.exit(1);
      });
  } else {
    // 2) Sinon ouvrir la console et donner les instructions
    const serviceAccountUrl = `https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`;
    console.log('gcloud non disponible ou échec. Ouvre la console Firebase (comptes de service) :');
    openUrl(serviceAccountUrl);
    console.log(`  ${serviceAccountUrl}`);
    console.log('  → "Générer une nouvelle clé privée", enregistre le JSON.');
    console.log('  → Puis : node scripts/setup-service-account.js chemin/vers/ton-fichier.json\n');
    process.exit(0);
  }
}

// --- Avec argument : fichier JSON fourni → copie en service-account.json + env pointe dessus
if (keyPath) {
  let parsed;
  try {
    const jsonString = readFileSync(keyPath, 'utf8').replace(/\r/g, '');
    parsed = JSON.parse(jsonString);
  } catch (e) {
    console.error('Fichier invalide ou introuvable:', keyPath, e.message);
    process.exit(1);
  }

  const targetFile = join(process.cwd(), 'service-account.json');
  writeFileSync(targetFile, JSON.stringify(parsed, null, 2), 'utf8');
  const line = 'FIREBASE_SERVICE_ACCOUNT=./service-account.json';

  addToEnvLocal(line)
    .then(() => {
      console.log('service-account.json créé, FIREBASE_SERVICE_ACCOUNT=./service-account.json dans .env.local');
    })
    .catch((e) => {
      console.error('Erreur écriture .env.local:', e.message);
      process.exit(1);
    });
}
