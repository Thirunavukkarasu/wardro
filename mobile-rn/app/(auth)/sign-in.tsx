import { router } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthFooterLink from "~/components/AuthFooterLink";
import CustomButton from "~/components/CustomButton";
import InputField from "~/components/InputField";
import OAuth from "~/components/OAuth";
import ScreenHero from "~/components/ScreenHero";
import { useAuth } from "~/lib/auth-context";

export default function SignInScreen() {
  const { signIn, busy, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    setFormError(null);

    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }
    if (!email.includes("@")) {
      setFormError("Enter a valid email.");
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }

    const signedIn = await signIn(email, password);
    if (signedIn) {
      router.replace("/(root)/(tabs)/home");
    }
  };

  const message = formError ?? error;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <ScreenHero
            title="Welcome 👋"
            onBack={() => router.replace("/(auth)/welcome")}
          />

          <View className="px-5 pt-4">
            <InputField
              label="Email"
              placeholder="Enter email"
              icon={<Mail size={20} color="#94A3B8" />}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearError();
                setFormError(null);
              }}
            />

            <InputField
              label="Password"
              placeholder="Enter password"
              icon={<Lock size={20} color="#94A3B8" />}
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearError();
                setFormError(null);
              }}
              onSubmitEditing={submit}
            />

            {message ? (
              <Text className="mt-1 text-sm font-medium text-danger">
                {message}
              </Text>
            ) : null}

            <CustomButton
              title="Sign In"
              isLoading={busy}
              onPress={submit}
              className="mt-4"
            />

            <OAuth />

            <AuthFooterLink
              prompt="Don't have an account?"
              actionLabel="Sign Up"
              onPress={() => router.replace("/(auth)/sign-up")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
