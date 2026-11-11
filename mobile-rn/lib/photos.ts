import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import type { PickedPhoto } from "~/lib/types";

/** Raw base64 for the photo endpoint, from base64 or a data URI. */
export function pickedPhotoBase64(photo: PickedPhoto): string | null {
  const value =
    photo.base64 ??
    (photo.uri.startsWith("data:") ? photo.uri.split(",")[1] : null);
  if (!value) return null;
  return value.includes(",") ? (value.split(",").pop() ?? null) : value;
}

/**
 * Opens the photo library for a multi-photo selection. Used by every add
 * source; the review screen decides how many more it can take.
 */
export async function pickPhotos(limit: number): Promise<PickedPhoto[]> {
  if (Platform.OS !== "web") {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || result.assets.length === 0) return [];

  return result.assets.slice(0, limit).map((asset) => ({
    uri: asset.uri,
    base64: asset.base64 ?? null,
    mimeType: asset.mimeType ?? "image/jpeg",
    fileName: asset.fileName ?? null,
  }));
}

/**
 * Opens the camera or the photo library and returns one picked photo.
 * Shared by the Add hub and the item form's photo field.
 */
export async function pickPhoto(
  source: "camera" | "library",
): Promise<PickedPhoto | null> {
  if (Platform.OS !== "web") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return null;
    }
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    base64: true,
  };

  const useCamera = source === "camera" && Platform.OS !== "web";
  const result = useCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? null,
    mimeType: asset.mimeType ?? "image/jpeg",
    fileName: asset.fileName ?? null,
  };
}
