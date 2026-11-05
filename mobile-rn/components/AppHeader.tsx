import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  bordered?: boolean;
}

/**
 * Standard pushed-screen header: 44px back target, a centred title, and an
 * optional right action. Keeps every secondary screen aligned.
 */
export default function AppHeader({
  title,
  subtitle,
  right,
  onBack,
  bordered = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  const goBack =
    onBack ??
    (() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(root)/(tabs)/today");
      }
    });

  return (
    <View className="bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-14 flex-row items-center px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-surface"
        >
          <ArrowLeft size={22} color="#0F172A" />
        </Pressable>

        <View className="flex-1 items-center px-2">
          <Text
            numberOfLines={1}
            className="text-[17px] font-bold tracking-tight text-ink"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              className="mt-0.5 text-[11px] text-ink-secondary"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="h-11 min-w-11 flex-row items-center justify-end">
          {right}
        </View>
      </View>

      {bordered ? <View className="h-px bg-line" /> : null}
    </View>
  );
}
