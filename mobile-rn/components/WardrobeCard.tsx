import { ChevronRight, Shirt } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";

import AppPill from "~/components/AppPill";
import { formatPrice } from "~/lib/formatters";
import { photoUrl, type Wardrobe } from "~/lib/types";

interface WardrobeCardProps {
  wardrobe: Wardrobe;
  onPress: () => void;
}

export default function WardrobeCard({
  wardrobe,
  onPress,
}: WardrobeCardProps) {
  const cover = photoUrl(wardrobe.coverPhotoUri);
  const subtitle = wardrobe.description
    ? wardrobe.description
    : wardrobe.totalValue > 0
      ? formatPrice(wardrobe.totalValue)
      : wardrobe.itemCount > 0
        ? `${wardrobe.itemCount} ${
            wardrobe.itemCount === 1 ? "item" : "items"
          }`
        : "No items yet";

  return (
    <Pressable
      onPress={onPress}
      className="mb-2.5 flex-row items-center rounded-[18px] border border-line bg-white p-3.5 active:opacity-90"
    >
      <View className="h-12 w-12 overflow-hidden rounded-[14px] bg-brand">
        {cover ? (
          <Image
            source={{ uri: cover }}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Shirt size={22} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View className="mx-3 flex-1">
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className="mr-2 flex-1 text-[15px] font-bold text-ink"
          >
            {wardrobe.name}
          </Text>
          <AppPill
            label={String(wardrobe.itemCount)}
            color={wardrobe.itemCount === 0 ? "#94A3B8" : "#4F46E5"}
          />
        </View>
        <Text numberOfLines={1} className="mt-0.5 text-xs text-ink-secondary">
          {subtitle}
        </Text>
      </View>

      <ChevronRight size={18} color="#94A3B8" />
    </Pressable>
  );
}
