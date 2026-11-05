import type { ReactNode } from "react";
import { Platform, View } from "react-native";

/**
 * Web presentation: render in a phone-width column on a dark backdrop, the
 * same convention as the Flutter `MobileFrame`. Native builds fill the screen.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") {
    return <View className="flex-1">{children}</View>;
  }

  return (
    <View className="flex-1 items-center bg-wardro-text-primary">
      <View className="h-full w-full max-w-[430px] overflow-hidden bg-canvas">
        {children}
      </View>
    </View>
  );
}
