import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAz7gdV4Vr1rSVpr125PQTWNirQK8MnM4c",
  authDomain: "beteproodb.firebaseapp.com",
  databaseURL: "https://beteproodb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "beteproodb",
  storageBucket: "beteproodb.firebasestorage.app",
  messagingSenderId: "115750551989",
  appId: "1:115750551989:web:b1a88d15c412524ada59fc",
  measurementId: "G-MJ9HMS5THX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use custom Firestore Database ID or (default) if using default database
export const db = getFirestore(app);

