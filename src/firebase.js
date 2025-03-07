import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA1OZ1CDdF771mo2s96Cn0fndHhd_5XkKs",
  authDomain: "messenger-app-a7c65.firebaseapp.com",
  projectId: "messenger-app-a7c65",
  storageBucket: "messenger-app-a7c65.appspot.com",
  messagingSenderId: "336285659316",
  appId: "1:336285659316:web:67c09e45eff65e916727e1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, storage, sendPasswordResetEmail };