// src/lib/env.ts
// Environment Variable Validation and Diagnostics (Phase 7 Part B)
// Ensures required client-safe Firebase public variables are available without hard runtime crashes.

export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const REQUIRED_PUBLIC_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export function validateFirebaseEnv(): { valid: boolean; missing: string[]; config: FirebaseEnvConfig } {
  const missing: string[] = [];

  for (const key of REQUIRED_PUBLIC_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  const valid = missing.length === 0;

  if (!valid && typeof window !== "undefined") {
    console.error(
      `[Inspiria Careers] Configuration Error: Missing required Firebase environment variables in .env.local: ${missing.join(", ")}. Please review .env.example.`
    );
  }

  const config: FirebaseEnvConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  return { valid, missing, config };
}
