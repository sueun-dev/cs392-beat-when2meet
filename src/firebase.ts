import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'cs392-react-challenges-3d0d7.firebaseapp.com',
  projectId: 'cs392-react-challenges-3d0d7',
  appId: '1:523620722107:web:8d9d236d5062a65096509e',
  databaseURL: 'https://cs392-react-challenges-3d0d7-default-rtdb.firebaseio.com',
});

export const database = getDatabase(app);
export const session = signInAnonymously(getAuth(app));
