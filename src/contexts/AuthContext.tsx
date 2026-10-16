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
  sendPasswordResetEmail,
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
  loginWithStaffPasscode: (role: "admin" | "principal", passcode: string) => Promise<{ success: boolean; error?: string }>;
  sendCandidatePasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@inspiriacareers.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const PRINCIPAL_EMAILS = (process.env.NEXT_PUBLIC_PRINCIPAL_EMAIL || "principal@inspiriacareers.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Admin@Inspiria2025";
export const PRINCIPAL_PASSWORD = process.env.NEXT_PUBLIC_PRINCIPAL_PASSWORD || "Principal@Inspiria2025";

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
    // Check for existing authenticated staff session in localStorage
    if (typeof window !== "undefined") {
      // Clear obsolete demo bypass
      localStorage.removeItem("insersia_demo_auth");
      const savedStaff = localStorage.getItem("insersia_staff_auth");
      if (savedStaff) {
        try {
          const parsed = JSON.parse(savedStaff);
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
          // If no Firebase user and no authenticated staff session
          if (typeof window !== "undefined" && !localStorage.getItem("insersia_staff_auth")) {
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("insersia_demo_auth");
      localStorage.removeItem("insersia_staff_auth");
    }
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
  };

  const loginWithStaffPasscode = async (
    targetRole: "admin" | "principal",
    passcode: string
  ): Promise<{ success: boolean; error?: string }> => {
    let expected = targetRole === "admin" ? ADMIN_PASSWORD : PRINCIPAL_PASSWORD;

    // 1. Check cached site settings (configured via Admin Panel)
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("inspiria_site_settings") || localStorage.getItem("insersia_site_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (targetRole === "admin" && parsed.adminPassword) expected = parsed.adminPassword;
          if (targetRole === "principal" && parsed.principalPassword) expected = parsed.principalPassword;
        }
      } catch {}
    }

    // 2. Fetch fresh from Firestore to allow immediate cross-device password changes (with 2s timeout)
    try {
      const snap = (await Promise.race([
        getDoc(doc(db, "settings", "site")),
        new Promise<null>((_, rej) => setTimeout(() => rej(new Error("Timeout")), 2000)),
      ])) as any;
      if (snap && snap.exists && snap.exists()) {
        const data = snap.data();
        if (targetRole === "admin" && data.adminPassword) expected = data.adminPassword;
        if (targetRole === "principal" && data.principalPassword) expected = data.principalPassword;
      }
    } catch {}

    if (!passcode || passcode.trim() !== expected.trim()) {
      return {
        success: false,
        error: `Incorrect security password for ${targetRole === "admin" ? "Master Admin" : "Principal Ma'am"}. Access denied.`,
      };
    }

    const staffUser: AppUser = {
      uid: targetRole === "admin" ? "staff-admin-master-id" : "staff-principal-counselor-id",
      email: targetRole === "admin" ? ADMIN_EMAILS[0] : PRINCIPAL_EMAILS[0],
      displayName: targetRole === "admin" ? "System Administrator" : "Principal Ma'am",
      photoURL: "/logo.jpg",
      role: targetRole,
      isDemo: false,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_staff_auth", JSON.stringify(staffUser));
      localStorage.removeItem("insersia_demo_auth");
    }

    setUser(staffUser);
    setRole(targetRole);
    setLoading(false);
    return { success: true };
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("insersia_demo_auth");
      localStorage.removeItem("insersia_staff_auth");
    }
    const cleanEmail = email.trim().toLowerCase();

    // Check if logging in as Admin or Principal with their dedicated staff password
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      const res = await loginWithStaffPasscode("admin", password);
      if (res.success) return;
    }
    if (PRINCIPAL_EMAILS.includes(cleanEmail)) {
      const res = await loginWithStaffPasscode("principal", password);
      if (res.success) return;
    }

    await signInWithEmailAndPassword(auth, email, password);
  };

  const sendCandidatePasswordReset = async (email: string) => {
    if (!email) throw new Error("Please enter your registered email address.");
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("insersia_demo_auth");
      localStorage.removeItem("insersia_staff_auth");
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(result.user, { name });
    await sendEmailVerification(result.user);
  };

  const demoLogin = (targetRole: UserRole) => {
    if (targetRole === "admin" || targetRole === "principal") {
      // Demo login requires password verification
      return;
    }
    const mockUser: AppUser = {
      uid: "demo-student-id",
      email: "student@insersia.com",
      displayName: "Aarav Sharma (Student)",
      photoURL: "",
      role: "user",
      isDemo: true,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_staff_auth", JSON.stringify(mockUser));
    }
    setUser(mockUser);
    setRole(targetRole);
    setLoading(false);
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("insersia_demo_auth");
      localStorage.removeItem("insersia_staff_auth");
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
        loginWithStaffPasscode,
        sendCandidatePasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
