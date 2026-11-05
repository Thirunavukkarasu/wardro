import { router } from "expo-router";
import { Image, Text, View } from "react-native";

import CustomButton from "~/components/CustomButton";
import { icons } from "~/constants";
import { useAuth } from "~/lib/auth-context";

/** "Log In with Google" block on both auth screens. */
export default function OAuth() {
  const { signInWithGoogle, busy } = useAuth();

  const handleGoogleSignIn = async () => {
    const signedIn = await signInWithGoogle();
    if (signedIn) {
      router.replace("/(root)/(tabs)/today");
    }
  };

  return (
    <View>
      <View className="mt-4 flex-row items-center">
        <View className="h-px flex-1 bg-line" />
        <Text className="px-3 text-[15px] font-semibold text-ink-secondary">
          Or
        </Text>
        <View className="h-px flex-1 bg-line" />
      </View>

      <CustomButton
        title="Log In with Google"
        variant="outline"
        isLoading={busy}
        onPress={handleGoogleSignIn}
        className="mt-5"
        iconLeft={
          <Image
            source={icons.google}
            resizeMode="contain"
            style={{ width: 20, height: 20 }}
          />
        }
      />
    </View>
  );
}
