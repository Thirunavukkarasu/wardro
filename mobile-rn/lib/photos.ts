import type { PickedPhoto } from "~/lib/types";

/** Raw base64 for the photo endpoint, from base64 or a data URI. */
export function pickedPhotoBase64(photo: PickedPhoto): string | null {
  const value =
    photo.base64 ??
    (photo.uri.startsWith("data:") ? photo.uri.split(",")[1] : null);
  if (!value) return null;
  return value.includes(",") ? (value.split(",").pop() ?? null) : value;
}
