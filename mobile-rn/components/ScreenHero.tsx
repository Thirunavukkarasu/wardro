import { ArrowLeft } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";

import hangerWhite from "~/assets/images/hanger-white.png";
import wordmarkWhite from "~/assets/images/wordmark-white.png";
import { wardroColors } from "~/src/theme/colors";

interface ScreenHeroProps {
  tagline?: string;
  height?: number;
  onBack?: () => void;
}

/**
 * Brand header for the auth screens: the lockup centred over the brand colour,
 * with a rounded base so the form below reads as a separate surface.
 */
export default function ScreenHero({
  tagline = "Your wardrobe, your style.",
  height = 232,
  onBack,
}: ScreenHeroProps) {
  return (
    <View
      className="w-full items-center justify-end overflow-hidden bg-brand px-5 pb-7"
      style={{
        height,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
      }}
    >
      <View className="absolute -left-16 -top-24 h-56 w-56 rounded-full bg-white/10" />
      <View className="absolute -bottom-24 -right-12 h-52 w-52 rounded-full bg-white/10" />

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

      <View
        className="items-center"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Wardro"
      >
        <Image
          source={hangerWhite}
          resizeMode="contain"
          style={{ width: 46, height: 29, marginBottom: 10 }}
        />
        <Image
          source={wordmarkWhite}
          resizeMode="contain"
          style={{ width: 132, height: 30 }}
        />
      </View>

      <Text className="mt-3 text-[13px] font-medium text-white/75">
        {tagline}
      </Text>
    </View>
  );
}
