import "~/global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import PhoneFrame from "~/components/PhoneFrame";
import { AuthProvider, useAuth } from "~/lib/auth-context";

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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "restoring") return;

    const inAuthGroup = segments[0] === "(auth)";

    if (status === "signedOut" && !inAuthGroup) {
      router.replace("/(auth)/welcome");
      return;
    }

    // Sign-up stays visible while the verification dialog is open; the
    // screen itself continues to the app when the user dismisses it.
    if (
      status === "signedIn" &&
      inAuthGroup &&
      segments[1] !== "sign-up"
    ) {
      router.replace("/(root)/(tabs)/home");
    }
  }, [status, segments, router]);

  if (status === "restoring") {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-sm text-ink-secondary">
          Restoring your session…
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F7F7FB" },
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
    <AuthProvider>
      <PhoneFrame>
        <StatusBar style="dark" />
        <RootNavigator />
      </PhoneFrame>
    </AuthProvider>
  );
}
