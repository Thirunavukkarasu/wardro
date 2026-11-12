import * as Google from "expo-auth-session/providers/google";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { auth } from "~/lib/firebase";
import { googleClientIds } from "~/lib/firebase-config";
import { toAppUser, type AppUser, type AuthStatus } from "~/lib/types";

/** A user-correctable auth failure whose message should be shown verbatim. */
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AppUser | null;
  busy: boolean;
  error: string | null;
  signIn(email: string, password: string): Promise<boolean>;
  signUp(name: string, email: string, password: string): Promise<boolean>;
  signInWithGoogle(): Promise<boolean>;
  resendVerificationEmail(): Promise<boolean>;
  sendPasswordReset(email: string): Promise<boolean>;
  isEmailVerified(): Promise<boolean>;
  signOut(): Promise<void>;
  clearError(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function errorMessage(error: unknown): string {
  if (error instanceof AuthError) return error.message;

  const raw = error as { code?: string; message?: string } | null;
  const code = raw?.code?.replace(/^auth\//, "");

  switch (code) {
    // Email / password
    case "invalid-email":
      return "That email address looks invalid.";
    case "user-disabled":
      return "This account has been disabled.";
    case "user-not-found":
    case "wrong-password":
    case "invalid-credential":
      return "Email or password is incorrect.";
    case "email-already-in-use":
      return "An account already exists for that email.";
    case "weak-password":
      return "Choose a stronger password.";
    case "too-many-requests":
      return "Too many attempts. Try again in a moment.";
    case "network-request-failed":
      return "Network error. Check your connection.";
    case "operation-not-allowed":
      return "This sign-in method is not enabled in Firebase.";

    // Google
    case "popup-closed-by-user":
    case "cancelled":
    case "canceled":
      return "Google sign-in was cancelled.";
    case "popup-blocked":
      return "The Google popup was blocked. Allow popups for this site and retry.";
    case "unauthorized-domain":
      return 'This domain is not authorised for Google sign-in. Add it under Authentication → Settings → Authorized domains.';
    case "account-exists-with-different-credential":
      return "An account already exists for this email with another sign-in method.";

    default:
      return raw?.message || "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("restoring");
  const [user, setUser] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  // Native Google sign-in: obtain a Google ID token, then exchange it for a
  // Firebase session. Web uses Firebase's popup flow instead (below), because
  // the JS SDK can drive the OAuth popup itself.
  const [googleRequest, , promptGoogle] = Google.useIdTokenAuthRequest(
    {
      webClientId: googleClientIds.web,
      androidClientId: googleClientIds.android,
      iosClientId: googleClientIds.ios || googleClientIds.web,
      scopes: ["openid", "profile", "email"],
    },
    { native: "myapp://oauthredirect" },
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser ? toAppUser(firebaseUser) : null);
        setStatus(firebaseUser ? "signedIn" : "signedOut");
      },
      (listenerError) => {
        setUser(null);
        setStatus("signedOut");
        setError(errorMessage(listenerError));
      },
    );

    return unsubscribe;
  }, []);

  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      if (busyRef.current) return false;

      busyRef.current = true;
      setBusy(true);
      setError(null);

      try {
        await action();

        // Mirror the provider's user straight away so navigation that follows
        // this promise never races the auth-state listener.
        const current = auth.currentUser;
        setUser(current ? toAppUser(current) : null);
        setStatus(current ? "signedIn" : "signedOut");
        return true;
      } catch (actionError) {
        setError(errorMessage(actionError));
        return false;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) =>
      run(async () => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }),
    [run],
  );

  const signUp = useCallback(
    (name: string, email: string, password: string) =>
      run(async () => {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const displayName = name.trim();

        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }

        try {
          await sendEmailVerification(credential.user);
        } catch {
          // The account exists; verification can be retried from the profile.
        }
      }),
    [run],
  );

  const signInWithGoogle = useCallback(
    () =>
      run(async () => {
        if (Platform.OS === "web") {
          await signInWithPopup(auth, new GoogleAuthProvider());
          return;
        }

        if (Platform.OS === "ios" && !googleClientIds.ios) {
          throw new AuthError(
            "Google sign-in is not configured for iOS yet. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.",
          );
        }

        if (!googleRequest) {
          throw new AuthError("Google sign-in is still loading. Try again.");
        }

        const result = await promptGoogle();

        if (result.type === "cancel" || result.type === "dismiss") {
          throw new AuthError("Google sign-in was cancelled.");
        }
        if (result.type !== "success") {
          throw new AuthError("Google sign-in failed. Try again.");
        }

        const idToken =
          result.params?.id_token ??
          (result as { authentication?: { idToken?: string | null } })
            .authentication?.idToken;

        if (!idToken) {
          throw new AuthError(
            "Google did not return an ID token. Check the OAuth client and SHA-1 fingerprint in Firebase.",
          );
        }

        await signInWithCredential(
          auth,
          GoogleAuthProvider.credential(idToken),
        );
      }),
    [googleRequest, promptGoogle, run],
  );

  const sendPasswordReset = useCallback(
    (email: string) =>
      run(async () => {
        try {
          await sendPasswordResetEmail(auth, email.trim());
        } catch (resetError) {
          // Don't reveal whether an address has an account.
          const code = (resetError as { code?: string })?.code?.replace(
            /^auth\//,
            "",
          );
          if (code !== "user-not-found") throw resetError;
        }
      }),
    [run],
  );

  const resendVerificationEmail = useCallback(
    () =>
      run(async () => {
        const current = auth.currentUser;
        if (!current) throw new AuthError("You are not signed in.");
        await sendEmailVerification(current);
      }),
    [run],
  );

  const isEmailVerified = useCallback(async (): Promise<boolean> => {
    const current = auth.currentUser;
    if (!current) return false;

    try {
      await current.reload();
    } catch {
      return false;
    }

    const refreshed = auth.currentUser;
    setUser(refreshed ? toAppUser(refreshed) : null);
    return refreshed?.emailVerified ?? false;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setStatus("signedOut");
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      busy,
      error,
      signIn,
      signUp,
      signInWithGoogle,
      resendVerificationEmail,
      sendPasswordReset,
      isEmailVerified,
      signOut,
      clearError,
    }),
    [
      status,
      user,
      busy,
      error,
      signIn,
      signUp,
      signInWithGoogle,
      resendVerificationEmail,
      sendPasswordReset,
      isEmailVerified,
      signOut,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
