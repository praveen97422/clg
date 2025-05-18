import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAkTcT7IXbuKnQEimCb1rV5mH7CrQ4AvSQ",
  authDomain: "loginhavya.firebaseapp.com",
  projectId: "loginhavya",
  storageBucket: "loginhavya.firebasestorage.app",
  messagingSenderId: "521485794547",
  appId: "1:521485794547:web:f55574324b63b20c10cb86",
  measurementId: "G-6RHW3LMYF6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
