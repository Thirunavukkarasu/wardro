import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "~/components/AppHeader";

interface FormScreenProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Shared shell for add/edit forms: fixed header, scrollable content, and an
 * optional sticky action bar that lifts with the keyboard.
 */
export default function FormScreen({
  title,
  subtitle,
  onBack,
  right,
  footer,
  children,
}: FormScreenProps) {
  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-canvas"
    >
      <AppHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        right={right}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        >
          {children}
        </ScrollView>

        {footer ? (
          <View className="border-t border-line bg-white px-5 pb-3 pt-3">
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
