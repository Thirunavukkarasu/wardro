import "~/global.css";

import * as React from "react";
import { LogBox } from "react-native";
import { SplashScreen, Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "~/lib/auth";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

LogBox.ignoreLogs(["Clerk:"]);

export default function RootLayout() {
  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <Stack>
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: "My Closet",
            headerShown: false,
            // headerRight: () => <ThemeToggle />,
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            title: "My Closet",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            title: "My Closet",
            // headerRight: () => <ThemeToggle />,
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            title: "Settings",
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: "Add Item",
          }}
        />
      </Stack>
    </ClerkProvider>
  );
}
