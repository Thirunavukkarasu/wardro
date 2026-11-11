import { Camera, ImageIcon, RefreshCw } from "lucide-react-native";
import { Alert, Image, Platform, Pressable, Text, View } from "react-native";

import { pickPhoto } from "~/lib/photos";
import type { PickedPhoto } from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

interface PhotoCaptureFieldProps {
  photo: PickedPhoto | null;
  onChange: (photo: PickedPhoto | null) => void;
  height?: number;
}

/**
 * Photo capture step used by the "add item" flow. Native builds can use the
 * camera or gallery; web opens the file picker.
 */
export default function PhotoCaptureField({
  photo,
  onChange,
  height = 260,
}: PhotoCaptureFieldProps) {
  const handlePick = async (source: "camera" | "library") => {
    try {
      const picked = await pickPhoto(source);
      if (picked) onChange(picked);
    } catch {
      Alert.alert(
        "Photo unavailable",
        source === "camera"
          ? "Could not open the camera. Check the permission in Settings."
          : "Could not open your photo library.",
      );
    }
  };

  if (photo) {
    return (
      <View>
        <View
          className="w-full overflow-hidden rounded-card bg-wardro-surface-secondary"
          style={{ height }}
        >
          <Image
            source={{ uri: photo.uri }}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <Pressable
          onPress={() => onChange(null)}
          className="mt-3 flex-row items-center justify-center py-2"
        >
          <RefreshCw size={16} color={wardroColors.text.secondary} />
          <Text className="ml-2 text-sm font-semibold text-ink-secondary">
            Retake photo
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="w-full items-center justify-center rounded-card border border-wardro-border bg-wardro-surface-secondary"
      style={{ height }}
    >
      <Camera size={56} color={wardroColors.text.disabled} />
      <Text className="mt-3 text-sm text-ink-secondary">
        Add a photo of this item
      </Text>

      <View className="mt-5 flex-row gap-3">
        {Platform.OS !== "web" ? (
          <Pressable
            onPress={() => handlePick("camera")}
            className="flex-row items-center rounded-full bg-wardro-primary-dark px-5 py-2.5 active:opacity-80"
          >
            <Camera size={17} color={wardroColors.surface} />
            <Text className="ml-2 text-sm font-semibold text-white">Snap</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => handlePick("library")}
          className={`flex-row items-center rounded-full border border-wardro-border px-5 py-2.5 active:opacity-80 ${
            Platform.OS === "web"
              ? "bg-wardro-primary-dark"
              : "bg-wardro-surface"
          }`}
        >
          <ImageIcon
            size={17}
            color={
              Platform.OS === "web"
                ? wardroColors.surface
                : wardroColors.text.primary
            }
          />
          <Text
            className={`ml-2 text-sm font-semibold ${
              Platform.OS === "web"
                ? "text-wardro-surface"
                : "text-wardro-text-primary"
            }`}
          >
            {Platform.OS === "web" ? "Choose photo" : "Gallery"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
