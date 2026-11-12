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
import { hasSeenOnboarding } from "~/lib/onboarding";
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

  // The carousel is a first-run experience: returning signed-out users go
  // straight to sign-in. Resolve the flag before routing so the wrong screen
  // never flashes.
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    hasSeenOnboarding().then((seen) => {
      if (!cancelled) setOnboardingSeen(seen);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hold the splash long enough to read as a splash rather than a flash.
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const appReady = !booting && onboardingSeen !== null && minSplashElapsed;

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
    if (booting || profileBlocked || onboardingSeen === null) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inRootGroup = segments[0] === "(root)";
    const authScreen = (segments as readonly string[])[1];

    if (status === "signedOut") {
      if (!inAuthGroup) {
        // The carousel is first-run only; returning users land on sign-in.
        router.replace(onboardingSeen ? "/(auth)/sign-in" : "/(auth)/welcome");
      } else if (onboardingSeen && authScreen === "welcome") {
        router.replace("/(auth)/sign-in");
      }
      return;
    }

    // Sign-up stays visible while the verification dialog is open; the
    // screen itself continues to the app when the user dismisses it.
    if (inAuthGroup) {
      if (authScreen !== "sign-up") {
        router.replace("/(root)/(tabs)/today");
      }
      return;
    }

    if (!inRootGroup) {
      router.replace("/(root)/(tabs)/today");
    }
  }, [status, segments, router, booting, profileBlocked, onboardingSeen]);

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
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: wardroColors.background,
              opacity: splashOpacity,
            },
          ]}
        >
          <Image
            source={splashArtwork}
            resizeMode="contain"
            // The image needs its own box: with only absolute positioning,
            // web renders it at intrinsic size and it overflows the screen.
            style={{ width: "100%", height: "100%" }}
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
