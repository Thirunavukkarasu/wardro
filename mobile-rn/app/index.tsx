import { View } from "react-native";

/**
 * Entry route. RootNavigator owns the auth/onboarding redirects; this only
 * needs to render something neutral (the splash covers it) while they resolve.
 */
export default function Index() {
  return <View className="flex-1 bg-canvas" />;
}
