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
// Callable Cloud Functions (us-central1 is the default region used in backend)
export const functionsClient = getFunctions(app, "us-central1");

/*// Optional: connect to the local Functions emulator if explicitly enabled.
// This avoids accidental ERR_CONNECTION_REFUSED when the emulator isn't running.
// Usage: define VITE_USE_FUNCTIONS_EMULATOR=true in your .env.local (frontend)
// Optional overrides: VITE_FUNCTIONS_EMULATOR_HOST (default: localhost),
// VITE_FUNCTIONS_EMULATOR_PORT (default: 5001)
try {
  // import.meta.env is available at build-time in Vite
  const useEmu = (import.meta as any)?.env?.VITE_USE_FUNCTIONS_EMULATOR === "true";
  if (useEmu) {
    const host = (import.meta as any)?.env?.VITE_FUNCTIONS_EMULATOR_HOST || "localhost";
    const portStr = (import.meta as any)?.env?.VITE_FUNCTIONS_EMULATOR_PORT || "5001";
    const port = Number(portStr) || 5001;
    connectFunctionsEmulator(functionsClient, host, port);
  }
} catch {
  // no-op: in SSR or non-browser environments import.meta/env may be unavailable
}*/

setPersistence(auth, browserSessionPersistence);
