import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7DKufh7Fa9DycEltn_TYU597-L_-Pp3A",
  authDomain: "chatapp-bda86.firebaseapp.com",
  projectId: "chatapp-bda86",
  storageBucket: "chatapp-bda86.firebasestorage.app",
  messagingSenderId: "872484719214",
  appId: "1:872484719214:web:92dd0cf4890409028cf47f"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);

// Initialize auth - Firebase handles persistence automatically on React Native
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// const analytics = getAnalytics(app);
