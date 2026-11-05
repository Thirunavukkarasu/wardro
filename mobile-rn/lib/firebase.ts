import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

import { firebaseConfig } from "~/lib/firebase-config";

/**
 * Native Firebase instance.
 *
 * Web resolves `./firebase` to `firebase.web.ts` instead (Metro platform
 * extensions), because the auth persistence wiring differs per platform.
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh re-runs this module; the instance already exists.
    return getAuth(app);
  }
}

export const auth = createAuth();
export const storage = getStorage(app);
export { app };
