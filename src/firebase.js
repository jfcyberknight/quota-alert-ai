import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";

// Ces informations devront être configurées via Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let db;
try {
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
} catch (e) {
  if (e.code === "firestore/already-initialized" || (e.message && e.message.includes("already been called"))) {
    db = getFirestore(app);
  } else {
    throw e;
  }
}
export { db };

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erreur de connexion Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
