import { Pressable, Text, View } from "react-native";

import AppPill from "~/components/AppPill";
import ItemPhoto from "~/components/ItemPhoto";
import { formatPrice, stateColor, stateLabel } from "~/lib/formatters";
import type { WardrobeItem } from "~/lib/types";

interface ItemPhotoTileProps {
  item: WardrobeItem;
  onPress: () => void;
}

/** Picture-first tile used in the wardrobe and "All Items" grids. */
export default function ItemPhotoTile({
  item,
  onPress,
}: ItemPhotoTileProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full overflow-hidden rounded-[20px] bg-surface active:opacity-90"
      style={{ aspectRatio: 0.72 }}
    >
      <ItemPhoto item={item} />

      <View className="absolute inset-x-0 bottom-0 bg-black/60 px-2.5 pb-2.5 pt-3">
        <Text
          numberOfLines={2}
          className="text-[13.5px] font-bold leading-[16px] text-white"
        >
          {item.itemName}
        </Text>
        {item.price !== null ? (
          <Text className="mt-1 text-[11.5px] font-semibold text-white/90">
            {formatPrice(item.price)}
          </Text>
        ) : null}
      </View>

      <View className="absolute right-2.5 top-2.5">
        <AppPill
          label={stateLabel(item.state)}
          color={stateColor(item.state)}
          filled
        />
      </View>
    </Pressable>
  );
}
