"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export type UserRole = "user" | "principal" | "admin";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role?: UserRole;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AppUser | User | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@inspiriacareers.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const PRINCIPAL_EMAILS = (process.env.NEXT_PUBLIC_PRINCIPAL_EMAIL || "principal@inspiriacareers.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const determineRole = async (u: User | AppUser): Promise<UserRole> => {
    const email = (u.email || "").toLowerCase();
    if (ADMIN_EMAILS.includes(email)) return "admin";
    if (PRINCIPAL_EMAILS.includes(email)) return "principal";
    try {
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) return (snap.data().role as UserRole) || "user";
    } catch {}
    return (u as AppUser).role || "user";
  };

  const ensureUserDoc = async (u: User, extraData?: Record<string, unknown>) => {
    try {
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || extraData?.name || "",
          photoURL: u.photoURL || "",
          role: "user",
          createdAt: new Date().toISOString(),
          ...extraData,
        });
      }
    } catch {}
  };

  useEffect(() => {
    // Check for existing demo session in localStorage
    if (typeof window !== "undefined") {
      const savedDemo = localStorage.getItem("insersia_demo_auth");
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          setUser(parsed);
          setRole(parsed.role || "user");
          setLoading(false);
          return;
        } catch {}
      }
    }

    try {
      const unsub = onAuthStateChanged(auth, async (u) => {
        if (u) {
          setUser(u);
          const r = await determineRole(u);
          setRole(r);
          await ensureUserDoc(u);
        } else {
          // If no Firebase user and no demo user
          if (typeof window !== "undefined" && !localStorage.getItem("insersia_demo_auth")) {
            setUser(null);
            setRole(null);
          }
        }
        setLoading(false);
      });
      return unsub;
    } catch {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (typeof window !== "undefined") localStorage.removeItem("insersia_demo_auth");
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (typeof window !== "undefined") localStorage.removeItem("insersia_demo_auth");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (typeof window !== "undefined") localStorage.removeItem("insersia_demo_auth");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(result.user, { name });
    await sendEmailVerification(result.user);
  };

  const demoLogin = (targetRole: UserRole) => {
    let mockUser: AppUser;
    if (targetRole === "principal") {
      mockUser = {
        uid: "demo-principal-id",
        email: "principal@insersia.com",
        displayName: "Principal Ma'am",
        photoURL: "/logo.jpg",
        role: "principal",
        isDemo: true,
      };
    } else if (targetRole === "admin") {
      mockUser = {
        uid: "demo-admin-id",
        email: "admin@insersia.com",
        displayName: "System Administrator",
        photoURL: "/logo.jpg",
        role: "admin",
        isDemo: true,
      };
    } else {
      mockUser = {
        uid: "demo-student-id",
        email: "student@insersia.com",
        displayName: "Aarav Sharma (Student)",
        photoURL: "",
        role: "user",
        isDemo: true,
      };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_demo_auth", JSON.stringify(mockUser));
    }
    setUser(mockUser);
    setRole(targetRole);
    setLoading(false);
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("insersia_demo_auth");
    }
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
