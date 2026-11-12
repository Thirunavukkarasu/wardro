import { router } from "expo-router";
import { Lock, Mail, MailCheck, User } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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
import {
  emailError,
  FIELD_LIMITS,
  nameError,
  passwordError,
} from "~/lib/validation";
import { wardroColors } from "~/src/theme/colors";

type FieldErrors = { name?: string; email?: string; password?: string };

export default function SignUpScreen() {
  const {
    signUp,
    resendVerificationEmail,
    busy,
    error,
    clearError,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationVisible, setVerificationVisible] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sent" | "failed">(
    "idle",
  );

  const submit = async () => {
    setFormError(null);

    const next: FieldErrors = {
      name: nameError(name) ?? undefined,
      email: emailError(email) ?? undefined,
      password: passwordError(password) ?? undefined,
    };
    setFieldErrors(next);
    if (next.name || next.email || next.password) return;

    const created = await signUp(name, email, password);
    if (created) {
      setResendState("idle");
      setVerificationVisible(true);
    }
  };

  const resend = async () => {
    setResendState("idle");
    const sent = await resendVerificationEmail();
    setResendState(sent ? "sent" : "failed");
  };

  const continueToApp = () => {
    setVerificationVisible(false);
    router.replace("/(root)/(tabs)/today");
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
            title="Create your closet"
            subtitle="One account. A closet for every person you dress."
            height={216}
            onBack={() => router.replace("/(auth)/sign-in")}
          />

          <View className="px-5 pt-4">
            <InputField
              label="Name"
              placeholder="Enter name"
              icon={<User size={20} color={wardroColors.text.disabled} />}
              autoComplete="name"
              maxLength={FIELD_LIMITS.name}
              value={name}
              error={fieldErrors.name}
              onChangeText={(value) => {
                setName(value);
                setFieldErrors((current) => ({ ...current, name: undefined }));
                clearError();
                setFormError(null);
              }}
            />

            <InputField
              label="Email"
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
              placeholder="Enter password"
              icon={<Lock size={20} color={wardroColors.text.disabled} />}
              secureTextEntry
              autoComplete="new-password"
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

            {message ? (
              <Text className="mt-1 text-sm font-medium text-danger">
                {message}
              </Text>
            ) : null}

            <CustomButton
              title="Sign Up"
              isLoading={busy}
              onPress={submit}
              className="mt-4"
            />

            <OAuth />

            <AuthFooterLink
              prompt="Already have an account?"
              actionLabel="Log In"
              onPress={() => router.replace("/(auth)/sign-in")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={verificationVisible}
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-md items-center rounded-[20px] bg-white p-6">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-brand/10">
              <MailCheck size={34} color={wardroColors.primaryDark} />
            </View>

            <Text className="mt-4 text-center text-[22px] font-extrabold text-ink">
              Verify your email
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-ink-secondary">
              We've sent a verification link to {email}. You can start using
              Wardro now — verifying just secures your account.
            </Text>

            {resendState === "sent" ? (
              <Text className="mt-2.5 text-center text-[13px] font-medium text-success">
                Verification email sent again.
              </Text>
            ) : null}
            {resendState === "failed" ? (
              <Text className="mt-2.5 text-center text-[13px] font-medium text-danger">
                {error ?? "Could not resend the email."}
              </Text>
            ) : null}

            <CustomButton
              title="Continue"
              onPress={continueToApp}
              className="mt-5"
            />

            <Pressable
              onPress={resend}
              disabled={busy}
              className="mt-2 py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-brand">
                {busy ? "Sending…" : "Resend email"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
