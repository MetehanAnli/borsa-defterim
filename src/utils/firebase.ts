import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBwMBYD1jZSi-vEhKKA1k_fLeLae6foniU",
  authDomain: "borsa-defterim.firebaseapp.com",
  projectId: "borsa-defterim",
  storageBucket: "borsa-defterim.firebasestorage.app",
  messagingSenderId: "858014537516",
  appId: "1:858014537516:web:8b5562fee6503cb5e9be89"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
