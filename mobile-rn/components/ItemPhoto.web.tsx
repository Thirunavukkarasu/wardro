import { Image, View } from "react-native";

import ItemPhotoPlaceholder from "~/components/ItemPhotoPlaceholder";
import { photoUrl, type WardrobeItem } from "~/lib/types";

interface ItemPhotoProps {
  item: WardrobeItem;
  resizeMode?: "cover" | "contain";
  large?: boolean;
}

/**
 * Web photo renderer.
 *
 * Uses the same `Image` configuration as the wardrobe cards, with the
 * placeholder behind the image instead of toggling on `onError`. That keeps
 * valid Firebase Storage photos from getting stuck on the fallback.
 */
export default function ItemPhoto({
  item,
  resizeMode = "cover",
  large = false,
}: ItemPhotoProps) {
  const url = photoUrl(item.photoUri);

  if (!url) {
    return <ItemPhotoPlaceholder item={item} large={large} />;
  }

  return (
    <View className="h-full w-full bg-wardro-surface-secondary">
      {!large ? (
        <View className="absolute inset-0">
          <ItemPhotoPlaceholder item={item} />
        </View>
      ) : null}

      <Image
        source={{ uri: url }}
        resizeMode={resizeMode}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}
