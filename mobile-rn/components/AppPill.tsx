import { Text, View } from "react-native";
import type { ReactNode } from "react";

import { wardroColors } from "~/src/theme/colors";

interface AppPillProps {
  label: string;
  color?: string;
  icon?: ReactNode;
  filled?: boolean;
}

/** Small rounded label used for counts, sizes and item states. */
export default function AppPill({
  label,
  color = wardroColors.primaryDark,
  icon,
  filled = false,
}: AppPillProps) {
  return (
    <View
      className="flex-row items-center self-start rounded-full px-2 py-[3px]"
      style={{ backgroundColor: filled ? color : `${color}1A` }}
    >
      {icon ? <View className="mr-1">{icon}</View> : null}
      <Text
        className="text-[11.5px] font-semibold"
        style={{ color: filled ? wardroColors.surface : color }}
      >
        {label}
      </Text>
    </View>
  );
}
