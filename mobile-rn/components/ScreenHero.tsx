import { ArrowLeft } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";

import wordmarkWhite from "~/assets/images/wordmark-white.png";
import { wardroColors } from "~/src/theme/colors";

interface ScreenHeroProps {
  title: string;
  height?: number;
  onBack?: () => void;
}

/**
 * Brand header for the auth screens. Carries the Wardro wordmark so a
 * returning user lands on sign-in and still sees the app's name.
 */
export default function ScreenHero({
  title,
  height = 200,
  onBack,
}: ScreenHeroProps) {
  return (
    <View
      className="w-full justify-end overflow-hidden bg-brand px-5 pb-5"
      style={{ height }}
    >
      <View className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
      <View className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-white/5" />

      <View className="absolute right-5 top-6">
        <Image
          source={wordmarkWhite}
          accessibilityLabel="Wardro"
          resizeMode="contain"
          style={{ width: 104, height: 24 }}
        />
      </View>

      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={onBack}
          className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
        >
          <ArrowLeft size={22} color={wardroColors.surface} />
        </Pressable>
      ) : null}

      <Text className="text-[24px] font-extrabold text-white">{title}</Text>
    </View>
  );
}
