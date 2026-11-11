import { router, useLocalSearchParams } from "expo-router";
import {
  Camera,
  Images,
  Keyboard,
  Layers,
  Link2,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import FormScreen from "~/components/FormScreen";
import { pickPhoto } from "~/lib/photos";
import { setPendingPhoto } from "~/lib/pending-add";
import { wardroColors } from "~/src/theme/colors";

type PhotoSource = "camera" | "library";

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

/**
 * The front door for creating an item. Picking a method here either hands a
 * photo to the item form, opens the web importer, or opens the bulk review.
 */
export default function AddItemHubScreen() {
  const params = useLocalSearchParams<{ wardrobeId?: string }>();
  const [picking, setPicking] = useState<PhotoSource | null>(null);

  const wardrobeParam = params.wardrobeId
    ? { wardrobeId: params.wardrobeId }
    : {};

  const openItemForm = (extra?: Record<string, string>) => {
    router.replace({
      pathname: "/(root)/add-wardrobe-items",
      params: { ...wardrobeParam, ...extra },
    });
  };

  const choosePhoto = async (source: PhotoSource) => {
    if (picking) return;
    setPicking(source);
    try {
      const photo = await pickPhoto(source);
      if (!photo) return;
      setPendingPhoto(photo);
      openItemForm();
    } catch {
      Alert.alert(
        "Photo unavailable",
        source === "camera"
          ? "Could not open the camera. Check the permission in Settings."
          : "Could not open your photo library.",
      );
    } finally {
      setPicking(null);
    }
  };

  return (
    <FormScreen
      title="Add to your closet"
      subtitle="One piece, or the whole bag."
    >
      <Text className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-secondary">
        One at a time
      </Text>

      <View className="flex-row gap-3">
        <MethodCard
          icon={<Camera size={19} color={wardroColors.primaryDark} />}
          title="Take a photo"
          caption="Snap it now"
          loading={picking === "camera"}
          onPress={() => void choosePhoto("camera")}
        />
        <MethodCard
          icon={<Images size={19} color={wardroColors.primaryDark} />}
          title="Choose a photo"
          caption="From your camera roll"
          loading={picking === "library"}
          onPress={() => void choosePhoto("library")}
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        <MethodCard
          icon={<Link2 size={19} color={wardroColors.primaryDark} />}
          title="From a website"
          caption="Browse a store or paste a link"
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
          caption="No photo needed"
          onPress={() => openItemForm()}
        />
      </View>

      <Text className="mb-2 mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-secondary">
        Or all at once
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a batch"
        accessibilityHint="Choose up to 10 photos and review the detected items"
        onPress={() =>
          router.replace({
            pathname: "/(root)/bulk-import",
            params: wardrobeParam,
          })
        }
        className="rounded-card border border-line bg-white p-4 active:opacity-80"
      >
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Layers size={20} color={wardroColors.primaryDark} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[14px] font-bold text-ink">Add a batch</Text>
            <Text className="mt-0.5 text-[11.5px] leading-4 text-ink-secondary">
              Up to 10 photos — we'll name each piece.
            </Text>
          </View>
        </View>
      </Pressable>
    </FormScreen>
  );
}
