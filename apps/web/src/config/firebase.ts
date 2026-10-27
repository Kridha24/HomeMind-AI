import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBW7jYXkBoi06s3_R97mVQqv7iCD0H8b4c',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'homemind-96a21.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'homemind-96a21',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'homemind-96a21.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '91216619042',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:91216619042:web:f4b8c18ae9202668748c7b',
};

let app: any = null;
let auth: any = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  }
} catch (err) {
  console.warn('Firebase initialization skipped or failed:', err);
}

export {
  app,
  auth,
  firebaseConfig,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  googleProvider,
};



