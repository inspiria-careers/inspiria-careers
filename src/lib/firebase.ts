import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { validateFirebaseEnv } from "@/lib/env";

const { config: firebaseConfig } = validateFirebaseEnv();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Firebase App Check with reCAPTCHA v3
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  import("firebase/app-check")
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn("Firebase App Check already active or failed to initialize:", err);
      }
    })
    .catch((err) => {
      console.warn("Failed to load Firebase App Check module:", err);
    });
}

export default app;
