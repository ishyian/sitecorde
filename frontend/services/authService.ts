import { auth, db } from "./firebaseService";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";

// sign in with Google
export async function signIn() {
  // Instantiate provider just-in-time to avoid premature auth initialization
  const googleProvider = new GoogleAuthProvider();
  // Persistence is now handled in getAuth().
  // Using signInWithPopup to be compatible with iframe environments.
  await signInWithPopup(auth, googleProvider);

  // After successful sign-in, ensure a user profile exists in Firestore
  try {
    const u = auth.currentUser;
    if (u) {
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          fullName: u.displayName || "",
          phone: null,
          email: u.email || "",
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (e) {
    // Non-blocking: if profile creation fails, the app still signs in
    console.warn("Failed to ensure user profile document", e);
  }
}

// sign out
export async function logOut() {
  await signOut(auth);
}

// sign in with email and password
export async function emailSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Ensure user profile exists in Firestore (in case the account was created elsewhere)
  try {
    const u = cred.user;
    if (u) {
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          fullName: u.displayName || "",
          phone: null,
          email: u.email || email,
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (e) {
    console.warn("Failed to ensure user profile document after emailSignIn", e);
  }
}

// sign up with email and password and create user profile in Firestore
export async function emailSignUp(
  email: string,
  password: string,
  fullName: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Try to set display name for convenience (non-blocking if fails)
  try {
    if (cred.user && fullName) {
      await updateProfile(cred.user, { displayName: fullName });
    }
  } catch (_) {
    // no-op: profile update is optional
  }

  // Create user document in Firestore under /users/{uid}
  const userRef = doc(db, "users", cred.user.uid);
  await setDoc(userRef, {
    fullName,
    phone: null,
    email,
    createdAt: serverTimestamp(),
  });
}
