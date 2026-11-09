import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { firebaseConfig } from "~/lib/firebase-config";

/**
 * Web Firebase instance. Auth persistence is handled by the Firebase JS SDK
 * (IndexedDB/localStorage), so no AsyncStorage is involved.
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export { app };
