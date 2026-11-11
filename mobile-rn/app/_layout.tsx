import "~/global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import PhoneFrame from "~/components/PhoneFrame";
import { AuthProvider, useAuth } from "~/lib/auth-context";
import {
  ProfilesProvider,
  useProfiles,
} from "~/lib/profiles-context";
import { wardroColors } from "~/src/theme/colors";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

/**
 * Keeps signed-out users out of the app. Signing *in* navigates explicitly
 * from the auth screens, which lets the sign-up verification dialog stay open
 * until the user dismisses it.
 */
function RootNavigator() {
  const { status } = useAuth();
  const {
    loading: profilesLoading,
    error: profilesError,
    activeProfile,
    refreshProfiles,
  } = useProfiles();
  const segments = useSegments();
  const router = useRouter();

  const booting =
    status === "restoring" ||
    (status === "signedIn" && profilesLoading);
  const profileBlocked =
    status === "signedIn" && (profilesError || !activeProfile);

  useEffect(() => {
    // The Stack is replaced by a loading/error view in these states. Dispatching
    // a replace before it mounts makes React Navigation drop the action.
    if (booting || profileBlocked) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inSignUp = (segments as readonly string[]).includes("sign-up");

    if (status === "signedOut" && !inAuthGroup) {
      router.replace("/(auth)/welcome");
      return;
    }

    // Sign-up stays visible while the verification dialog is open; the
    // screen itself continues to the app when the user dismisses it.
    if (status === "signedIn" && inAuthGroup && !inSignUp) {
      router.replace("/(root)/(tabs)/today");
    }
  }, [status, segments, router, booting, profileBlocked]);

  if (booting) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color={wardroColors.primaryDark} />
        <Text className="mt-4 text-sm text-ink-secondary">
          {status === "restoring"
            ? "Restoring your session…"
            : "Loading your profiles…"}
        </Text>
      </View>
    );
  }

  if (profileBlocked) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <Text className="text-center text-base font-bold text-ink">
          Couldn’t load your profiles
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-ink-secondary">
          {profilesError ?? "No profile is available for this account."}
        </Text>
        <Pressable
          onPress={refreshProfiles}
          className="mt-5 rounded-full bg-brand px-6 py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: wardroColors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(root)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfilesProvider>
          <PhoneFrame>
            <StatusBar style="dark" />
            <RootNavigator />
          </PhoneFrame>
        </ProfilesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
