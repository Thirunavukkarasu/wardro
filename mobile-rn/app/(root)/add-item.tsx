import { router, useLocalSearchParams } from "expo-router";
import { Camera, Images, Keyboard, Link2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import FormScreen from "~/components/FormScreen";
import { pickPhoto, pickPhotos } from "~/lib/photos";
import {
  reviewKey,
  setPendingReview,
  type PendingReviewItem,
} from "~/lib/pending-review";
import type { PickedPhoto } from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

const MAX_ITEMS = 10;

type Picking = "camera" | "library" | null;

interface MethodCardProps {
  icon: React.ReactNode;
  title: string;
  caption: string;
  loading?: boolean;
  onPress: () => void;
}

function MethodCard({
  icon,
  title,
  caption,
  loading,
  onPress,
}: MethodCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={caption}
      disabled={loading}
      onPress={onPress}
      className="flex-1 rounded-card border border-line bg-white p-4 active:opacity-80"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-surface">
        {loading ? (
          <ActivityIndicator size="small" color={wardroColors.primaryDark} />
        ) : (
          icon
        )}
      </View>
      <Text className="mt-3 text-[14px] font-bold text-ink">{title}</Text>
      <Text className="mt-0.5 text-[11.5px] leading-4 text-ink-secondary">
        {caption}
      </Text>
    </Pressable>
  );
}

function rowsFromPhotos(photos: PickedPhoto[]): PendingReviewItem[] {
  return photos.map((photo, index) => ({
    key: reviewKey("photo", index),
    photo,
    photoPath: null,
    photoUri: null,
    draft: null,
    sourceUrl: null,
  }));
}

/**
 * The front door for creating items. Every source lands in the same review
 * list; nothing is saved from here.
 */
export default function AddItemHubScreen() {
  const params = useLocalSearchParams<{ wardrobeId?: string }>();
  const [picking, setPicking] = useState<Picking>(null);

  const wardrobeParam = params.wardrobeId
    ? { wardrobeId: params.wardrobeId }
    : {};

  const openReview = (rows: PendingReviewItem[]) => {
    setPendingReview(rows);
    router.replace({
      pathname: "/(root)/review",
      params: wardrobeParam,
    });
  };

  const openItemForm = () => {
    router.replace({
      pathname: "/(root)/add-wardrobe-items",
      params: wardrobeParam,
    });
  };

  const takePhoto = async () => {
    if (picking) return;
    setPicking("camera");
    try {
      const photo = await pickPhoto("camera");
      if (photo) openReview(rowsFromPhotos([photo]));
    } catch {
      Alert.alert(
        "Camera unavailable",
        "Could not open the camera. Check the permission in Settings.",
      );
    } finally {
      setPicking(null);
    }
  };

  const choosePhotos = async () => {
    if (picking) return;
    setPicking("library");
    try {
      const photos = await pickPhotos(MAX_ITEMS);
      if (photos.length > 0) openReview(rowsFromPhotos(photos));
    } catch {
      Alert.alert("Photos unavailable", "Could not open your photo library.");
    } finally {
      setPicking(null);
    }
  };

  return (
    <FormScreen
      title="Add to your closet"
      subtitle="Up to 10 items, however you add them."
    >
      <View className="flex-row gap-3">
        <MethodCard
          icon={<Camera size={19} color={wardroColors.primaryDark} />}
          title="Take a photo"
          caption="Add up to 10, one at a time"
          loading={picking === "camera"}
          onPress={() => void takePhoto()}
        />
        <MethodCard
          icon={<Images size={19} color={wardroColors.primaryDark} />}
          title="Choose photos"
          caption="Up to 10 at once"
          loading={picking === "library"}
          onPress={() => void choosePhotos()}
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        <MethodCard
          icon={<Link2 size={19} color={wardroColors.primaryDark} />}
          title="From a website"
          caption="Scan or capture a page"
          onPress={() =>
            router.replace({
              pathname: "/(root)/web-import",
              params: wardrobeParam,
            })
          }
        />
        <MethodCard
          icon={<Keyboard size={19} color={wardroColors.primaryDark} />}
          title="Type it in"
          caption="One item, no photo"
          onPress={openItemForm}
        />
      </View>
    </FormScreen>
  );
}
