import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if environment variables are configured
const hasFirebaseConfig = 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Fallback configuration for build compilation stability
const fallbackConfig = {
  apiKey: "AIzaSyMockKeyForBuildStabilityGraceful",
  authDomain: "mock-atelier.firebaseapp.com",
  projectId: "mock-atelier",
  storageBucket: "mock-atelier.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:mockappid0912",
};

// Initialize Firebase App
const app = getApps().length > 0 
  ? getApp() 
  : initializeApp(hasFirebaseConfig ? firebaseConfig : fallbackConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
