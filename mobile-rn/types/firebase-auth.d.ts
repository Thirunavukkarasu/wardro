/**
 * The React Native build of `firebase/auth` exports
 * `getReactNativePersistence`, but the published browser typings do not declare
 * it. Metro resolves the RN build at runtime; this augmentation keeps `tsc`
 * happy without disabling type checking for the rest of the SDK.
 */
import type { Persistence } from "firebase/auth";

interface ReactNativeAsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorageLike,
  ): Persistence;
}
