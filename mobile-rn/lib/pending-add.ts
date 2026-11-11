import type { PickedPhoto } from "~/lib/types";

/**
 * A photo picked on the Add hub, handed to the item form without putting
 * base64 through route params. The form takes it once and clears it.
 */
let pendingPhoto: PickedPhoto | null = null;

export function setPendingPhoto(photo: PickedPhoto | null) {
  pendingPhoto = photo;
}

export function takePendingPhoto(): PickedPhoto | null {
  const photo = pendingPhoto;
  pendingPhoto = null;
  return photo;
}
