import { useCallback, useEffect, useState } from "react";
import { Image } from "react-native";

import ItemPhotoPlaceholder from "~/components/ItemPhotoPlaceholder";
import { photoUrl, type WardrobeItem } from "~/lib/types";

interface ItemPhotoProps {
  item: WardrobeItem;
  resizeMode?: "cover" | "contain";
  /** Large detail-view treatment: friendlier empty state, no stray initial. */
  large?: boolean;
}

/**
 * Native photo renderer. Web resolves this module to `ItemPhoto.web.tsx`,
 * which uses a plain <img> element instead of react-native-web's Image.
 */
export default function ItemPhoto({
  item,
  resizeMode = "cover",
  large = false,
}: ItemPhotoProps) {
  const url = photoUrl(item.photoUri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  // Keep the handler identity stable: react-native-web re-runs its
  // image-loading effect whenever `onError` changes.
  const handleError = useCallback(() => setFailed(true), []);

  if (!url || failed) {
    return <ItemPhotoPlaceholder item={item} large={large} />;
  }

  return (
    <Image
      source={{ uri: url }}
      resizeMode={resizeMode}
      style={{ width: "100%", height: "100%" }}
      onError={handleError}
    />
  );
}
