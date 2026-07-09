import fs from 'fs';
import path from 'path';

export interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
}

let cachedConfig: FirebaseConfig | null = null;

export function getFirebaseConfig(): FirebaseConfig {
  if (cachedConfig) return cachedConfig;

  // Default hardcoded fallback config (matches firebase-applet-config.json)
  let config: FirebaseConfig = {
    projectId: "beteproodb",
    appId: "1:115750551989:web:b06054d72482fcafda59fc",
    apiKey: "AIzaSyAz7gdV4Vr1rSVpr125PQTWNirQK8MnM4c",
    authDomain: "beteproodb.firebaseapp.com",
    firestoreDatabaseId: "default",
    storageBucket: "beteproodb.firebasestorage.app",
    messagingSenderId: "115750551989"
  };

  // 1. Try to load from FIREBASE_CONFIG env
  if (process.env.FIREBASE_CONFIG) {
    try {
      config = JSON.parse(process.env.FIREBASE_CONFIG);
      cachedConfig = config;
      return config;
    } catch (err) {
      console.error('[AUTH-FIREBASE] Failed to parse FIREBASE_CONFIG env:', err);
    }
  }

  // 2. Try to load from file paths
  const pathsToTry = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    '/var/task/firebase-applet-config.json',
    'firebase-applet-config.json'
  ];

  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.projectId && parsed.apiKey) {
          config = parsed;
          break;
        }
      } catch (err) {
        console.error(`[AUTH-FIREBASE] Failed to read firebase config from ${p}:`, err);
      }
    }
  }

  cachedConfig = config;
  return config;
}
