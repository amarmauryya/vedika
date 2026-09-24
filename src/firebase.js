import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdfZkVIbsc0SsD_a4wUs8WLC3OTvfolvc",
  authDomain: "follica-4cff5.firebaseapp.com",
  projectId: "follica-4cff5",
  storageBucket: "follica-4cff5.firebasestorage.app",
  messagingSenderId: "206216903297",
  // Note: Using Android App ID. For production web, register a Web App in Firebase Console and replace this.
  appId: "1:206216903297:android:4d5ba82c3c86b21143ab80" 
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
