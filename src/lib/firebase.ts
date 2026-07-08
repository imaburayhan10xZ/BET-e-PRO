import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDUmN8a_aMiRL5tnZqlVA2ySoPOxX-Gtzk",
  authDomain: "caramel-poet-vgxqk.firebaseapp.com",
  projectId: "caramel-poet-vgxqk",
  storageBucket: "caramel-poet-vgxqk.firebasestorage.app",
  messagingSenderId: "858474249110",
  appId: "1:858474249110:web:ef9c60b0d204af3a963bb7",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use custom Firestore Database ID or (default) if using default database
export const db = getFirestore(app, "ai-studio-betepro-b6a3f733-91bd-405a-80ee-cc6e3903d102");

