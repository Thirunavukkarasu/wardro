import { Redirect } from "expo-router";

import { useAuth } from "~/lib/auth-context";

export default function Index() {
  const { status } = useAuth();

  if (status === "signedIn") {
    return <Redirect href="/(root)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
