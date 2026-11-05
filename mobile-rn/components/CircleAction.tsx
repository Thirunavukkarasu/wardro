import { Pressable, View } from "react-native";
import type { ReactNode } from "react";

import { wardroColors } from "~/src/theme/colors";

interface CircleActionProps {
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}

/** Circular filled action button used in screen headers. */
export default function CircleAction({
  icon,
  onPress,
  accessibilityLabel,
}: CircleActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="h-12 w-12 items-center justify-center rounded-full bg-wardro-primary-dark active:opacity-80"
      style={{
        shadowColor: wardroColors.primaryDark,
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <View>{icon}</View>
    </Pressable>
  );
}
