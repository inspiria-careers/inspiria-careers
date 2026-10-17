"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export type UserRole = "admin" | "counsellor" | "client";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// Helper: get or create user doc in Firestore
async function ensureUserDoc(
  u: User,
  extra?: Partial<{ displayName: string; role: UserRole }>
): Promise<AppUser> {
  const ref = doc(db, "users", u.uid);
  let snap = await getDoc(ref);

  if (!snap.exists()) {
    const newDoc: Omit<AppUser, "uid"> & { createdAt: ReturnType<typeof serverTimestamp> } = {
      email: u.email,
      displayName: u.displayName || extra?.displayName || null,
      photoURL: u.photoURL || null,
      role: extra?.role ?? "client",
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, newDoc);
    snap = await getDoc(ref);
  }

  const data = snap.data()!;
  return {
    uid: u.uid,
    email: data.email ?? u.email,
    displayName: data.displayName ?? u.displayName,
    photoURL: data.photoURL ?? u.photoURL,
    role: (data.role as UserRole) ?? "client",
  };
}

async function fetchAppUser(u: User): Promise<AppUser> {
  try {
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        uid: u.uid,
        email: d.email ?? u.email,
        displayName: d.displayName ?? u.displayName,
        photoURL: d.photoURL ?? u.photoURL,
        role: (d.role as UserRole) ?? "client",
      };
    }
  } catch {}
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    role: "client",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await fetchAppUser(firebaseUser);
          setUser(appUser);
          setRole(appUser.role);
        } catch {
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Sync role to cookie for Next.js Edge middleware
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (role) {
      document.cookie = `ic_user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      document.cookie = `ic_user_role=; path=/; max-age=0; SameSite=Lax`;
    }
  }, [role]);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const appUser = await ensureUserDoc(result.user);
    setUser(appUser);
    setRole(appUser.role);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    // onAuthStateChanged will pick up the new user
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const appUser = await ensureUserDoc(result.user, { displayName, role: "client" });
    setUser(appUser);
    setRole(appUser.role);
    // Send email verification (non-blocking)
    sendEmailVerification(result.user).catch(() => {});
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!email.trim()) throw new Error("Please enter your email address.");
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, sendPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}
