import type { ItemDraft, PickedPhoto } from "~/lib/types";

/**
 * Rows handed from an add source to the shared review screen. Kept in memory
 * because photos carry base64 and must not go through route params.
 */
export interface PendingReviewItem {
  key: string;
  photo: PickedPhoto | null;
  photoPath: string | null;
  photoUri: string | null;
  draft: ItemDraft | null;
  sourceUrl: string | null;
}

let pending: PendingReviewItem[] = [];

export function setPendingReview(items: PendingReviewItem[]) {
  pending = items;
}

export function takePendingReview(): PendingReviewItem[] {
  const items = pending;
  pending = [];
  return items;
}

export function reviewKey(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
