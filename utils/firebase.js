import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAuSS3yurn1fTQQHgjJpQb8N7U8JGDmtWU",
  authDomain: "pathos-c9518.firebaseapp.com",
  projectId: "pathos-c9518",
  storageBucket: "pathos-c9518.firebasestorage.app",
  messagingSenderId: "692094864257",
  appId: "1:692094864257:web:c6af361002b26736da3680",
  measurementId: "G-91V1QZCN2L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);