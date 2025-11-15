import { initializeApp } from "firebase/app";
import {
  browserSessionPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAwwIHdCaQC-j5UY_iWtifvMyDV18vS4-w",
  authDomain: "sitecord-c9a0d.firebaseapp.com",
  projectId: "sitecord-c9a0d",
  storageBucket: "sitecord-c9a0d.firebasestorage.app",
  messagingSenderId: "1083375226734",
  appId: "1:1083375226734:web:824417803dd2375e83bb7f",
  measurementId: "G-N7X0YM0DXD",
};

// Initialize once (important in dev with HMR)
const app = initializeApp(firebaseConfig);

// Core services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functionsClient = getFunctions(app, "us-central1");

setPersistence(auth, browserSessionPersistence);
