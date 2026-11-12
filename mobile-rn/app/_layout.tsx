import "~/global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import splashArtwork from "~/assets/images/splash.png";
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

  // Hold the splash long enough to read as a splash rather than a flash.
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const appReady = !booting && minSplashElapsed;

  useEffect(() => {
    if (!appReady) return;
    const animation = Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setSplashVisible(false);
    });
    return () => animation.stop();
  }, [appReady, splashOpacity]);

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

  const content = booting ? (
    // The splash overlay covers this; keep it blank rather than a spinner so
    // the artwork is the only thing on screen.
    <View className="flex-1 bg-canvas" />
  ) : profileBlocked ? (
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
  ) : (
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

  return (
    <View className="flex-1">
      {content}
      {splashVisible && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: splashOpacity }]}
        >
          <Image
            source={splashArtwork}
            resizeMode="contain"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
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
