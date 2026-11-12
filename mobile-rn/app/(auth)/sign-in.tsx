import { router } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { emailError, FIELD_LIMITS } from "~/lib/validation";
import { wardroColors } from "~/src/theme/colors";

export default function SignInScreen() {
  const { signIn, sendPasswordReset, busy, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const submit = async () => {
    setFormError(null);

    const next = {
      email: emailError(email) ?? undefined,
      password: password ? undefined : "Password is required.",
    };
    setFieldErrors(next);
    if (next.email || next.password) return;

    const signedIn = await signIn(email, password);
    if (signedIn) {
      router.replace("/(root)/(tabs)/today");
    }
  };

  const requestReset = async () => {
    setResetSent(false);
    const issue = emailError(email);
    if (issue) {
      setFieldErrors((current) => ({ ...current, email: issue }));
      return;
    }
    setFieldErrors({});
    if (await sendPasswordReset(email)) setResetSent(true);
  };

  const message = formError ?? error;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <ScreenHero
            onBack={router.canGoBack() ? () => router.back() : undefined}
          />

          <View className="items-center px-5 pt-8">
            <Text className="text-center text-[28px] leading-9 font-extrabold text-wardro-text-primary">
              Welcome back
            </Text>
            <Text className="mt-2 text-center text-[14.5px] leading-[22px] text-wardro-text-secondary">
              Sign in to continue building your wardrobe.
            </Text>
          </View>

          <View className="px-5 pt-7">
            <InputField
              label="Email"
              variant="outline"
              placeholder="Enter email"
              icon={<Mail size={20} color={wardroColors.text.disabled} />}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              maxLength={FIELD_LIMITS.email}
              value={email}
              error={fieldErrors.email}
              onChangeText={(value) => {
                setEmail(value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
                clearError();
                setFormError(null);
              }}
            />

            <InputField
              label="Password"
              variant="outline"
              placeholder="Enter password"
              icon={<Lock size={20} color={wardroColors.text.disabled} />}
              secureTextEntry
              autoComplete="password"
              maxLength={FIELD_LIMITS.password}
              value={password}
              error={fieldErrors.password}
              onChangeText={(value) => {
                setPassword(value);
                setFieldErrors((current) => ({
                  ...current,
                  password: undefined,
                }));
                clearError();
                setFormError(null);
              }}
              onSubmitEditing={submit}
            />

            <Pressable
              accessibilityRole="button"
              onPress={requestReset}
              hitSlop={8}
              className="self-end py-1 active:opacity-70"
            >
              <Text className="text-[13px] font-semibold text-wardro-primary-dark">
                Forgot password?
              </Text>
            </Pressable>

            {resetSent ? (
              <Text className="mt-1 text-[13px] font-medium text-success">
                If that address has an account, a reset link is on its way.
              </Text>
            ) : null}

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
