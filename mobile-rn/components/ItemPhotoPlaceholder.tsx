import { Shirt } from "lucide-react-native";
import { Text, View } from "react-native";

import type { WardrobeItem } from "~/lib/types";

interface ItemPhotoPlaceholderProps {
  item: WardrobeItem;
  large?: boolean;
}

/** Shared fallback for missing or unloadable garment photos. */
export default function ItemPhotoPlaceholder({
  item,
  large = false,
}: ItemPhotoPlaceholderProps) {
  const initial = item.itemName.trim() ? item.itemName.trim()[0] : "?";

  return (
    <View className="h-full w-full items-center justify-center bg-[#E9EFF7]">
      {large ? (
        <>
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white/70">
            <Shirt size={30} color="#4F46E580" />
          </View>
          <Text className="mt-3 text-[13px] font-semibold text-ink-secondary">
            No photo yet
          </Text>
        </>
      ) : (
        <>
          <Shirt size={34} color="#4F46E573" />
          <Text className="mt-1.5 text-[22px] font-extrabold text-brand/60">
            {initial.toUpperCase()}
          </Text>
        </>
      )}
    </View>
  );
}
