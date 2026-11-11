import { router, useLocalSearchParams } from "expo-router";
import { Images, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

import CustomButton from "~/components/CustomButton";
import FormScreen from "~/components/FormScreen";
import SelectField from "~/components/SelectField";
import { api, ApiException } from "~/lib/api";
import { addYears, parseDateOr } from "~/lib/dates";
import {
  pickPhoto,
  pickPhotos,
  pickedPhotoBase64,
} from "~/lib/photos";
import {
  reviewKey,
  takePendingReview,
  type PendingReviewItem,
} from "~/lib/pending-review";
import { useProfiles } from "~/lib/profiles-context";
import {
  wardrobeFromJson,
  wardrobeItemFromJson,
  type ItemDraft,
  type PickedPhoto,
  type Wardrobe,
  type WardrobeItem,
} from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

const MAX_ITEMS = 10;
const CONCURRENCY = 2;

type RowStatus =
  | "queued"
  | "drafting"
  | "ready"
  | "saving"
  | "saved"
  | "error";

type ReviewRow = {
  key: string;
  photo: PickedPhoto | null;
  photoPath: string | null;
  photoUri: string | null;
  draft: ItemDraft | null;
  sourceUrl: string | null;
  status: RowStatus;
  error: string | null;
  include: boolean;
  duplicateOf: string | null;
  duplicateId: number | null;
  updateExisting: boolean;
};

function toReviewRow(item: PendingReviewItem): ReviewRow {
  return {
    key: item.key,
    photo: item.photo,
    photoPath: item.photoPath,
    photoUri: item.photoUri,
    draft: item.draft,
    sourceUrl: item.sourceUrl,
    status: item.draft ? "ready" : "queued",
    error: null,
    include: true,
    duplicateOf: null,
    duplicateId: null,
    updateExisting: false,
  };
}

type ComparableItem = {
  itemName: string;
  brand: string | null;
  category: string | null;
  color: string | null;
  size: string | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function fromItem(item: WardrobeItem): ComparableItem {
  return {
    itemName: item.itemName,
    brand: item.brand,
    category: item.category,
    color: item.color,
    size: item.size,
  };
}

function fromDraft(draft: ItemDraft): ComparableItem {
  return {
    itemName: draft.itemName,
    brand: draft.brand,
    category: draft.category,
    color: draft.color,
    size: draft.size,
  };
}

function findDuplicate(
  draft: ItemDraft,
  existing: WardrobeItem[],
  seenDrafts: ItemDraft[],
): { itemName: string; id: number | null } | null {
  const target = fromDraft(draft);
  const candidates: Array<{
    itemName: string;
    id: number | null;
    value: ComparableItem;
  }> = [
    ...existing.map((item) => ({
      itemName: item.itemName,
      id: item.id,
      value: fromItem(item),
    })),
    ...seenDrafts.map((item) => ({
      itemName: item.itemName,
      id: null,
      value: fromDraft(item),
    })),
  ];

  for (const candidate of candidates) {
    if (normalize(candidate.value.itemName) !== normalize(target.itemName)) {
      continue;
    }
    const shared = (["brand", "category", "color", "size"] as const).filter(
      (key) =>
        normalize(candidate.value[key]) &&
        normalize(candidate.value[key]) === normalize(target[key]),
    );
    if (shared.length > 0) {
      return { itemName: candidate.itemName, id: candidate.id };
    }
  }

  return null;
}

function statusLabel(row: ReviewRow): string {
  switch (row.status) {
    case "queued":
      return "Waiting…";
    case "drafting":
      return "Reading photo…";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return row.draft?.itemName || "Could not read this photo";
    default:
      return row.draft?.itemName || "Ready";
  }
}

function draftDetails(draft: ItemDraft | null): string {
  if (!draft) return "";
  return [
    draft.brand,
    draft.category,
    draft.color,
    draft.size,
    draft.price !== null && draft.price !== undefined
      ? `₹${draft.price}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function ReviewScreen() {
  const { activeProfile } = useProfiles();
  const params = useLocalSearchParams<{ wardrobeId?: string }>();
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<number | null>(
    null,
  );
  const [existingItems, setExistingItems] = useState<WardrobeItem[]>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [incoming] = useState<PendingReviewItem[]>(() => takePendingReview());
  const consumedRef = useRef(false);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const loadSetup = useCallback(async () => {
    setLoadingSetup(true);
    setSetupError(null);
    try {
      const [wardrobeRows, itemRows] = await Promise.all([
        api.get<Record<string, unknown>[]>("/wardrobes"),
        api.get<Record<string, unknown>[]>("/wardrobeItems"),
      ]);
      const list = (wardrobeRows ?? []).map(wardrobeFromJson);
      const preferred = params.wardrobeId
        ? Number(params.wardrobeId)
        : null;
      setWardrobes(list);
      setSelectedWardrobeId((current) => {
        const wanted = preferred ?? current;
        if (wanted && list.some((wardrobe) => wardrobe.id === wanted)) {
          return wanted;
        }
        return list[0]?.id ?? null;
      });
      setExistingItems((itemRows ?? []).map(wardrobeItemFromJson));
    } catch (error) {
      setSetupError(
        error instanceof ApiException
          ? error.message
          : "Could not load your wardrobes.",
      );
    } finally {
      setLoadingSetup(false);
    }
  }, [activeProfile?.id, params.wardrobeId]);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  const updateRow = useCallback((key: string, patch: Partial<ReviewRow>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }, []);

  const markDuplicates = useCallback((existing: WardrobeItem[]) => {
    setRows((current) => {
      const seen: ItemDraft[] = [];
      return current.map((row) => {
        if (row.status === "error") {
          return { ...row, include: false };
        }
        if (!row.draft || row.status !== "ready") return row;

        const duplicate = findDuplicate(row.draft, existing, seen);
        if (!duplicate) {
          seen.push(row.draft);
          return {
            ...row,
            duplicateOf: null,
            duplicateId: null,
            include: true,
            updateExisting: false,
          };
        }

        return {
          ...row,
          duplicateOf: duplicate.itemName,
          duplicateId: duplicate.id,
          include: false,
          updateExisting: false,
        };
      });
    });
  }, []);

  const processRows = useCallback(
    async (rowsToProcess: ReviewRow[], existing: WardrobeItem[]) => {
      const queue = [...rowsToProcess];
      const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length > 0) {
          const row = queue.shift();
          if (!row) break;

          if (row.draft) {
            updateRow(row.key, { status: "ready", error: null });
            continue;
          }
          if (!row.photo) {
            updateRow(row.key, {
              status: "error",
              include: false,
              error: "No photo to analyse.",
            });
            continue;
          }

          updateRow(row.key, { status: "drafting", error: null });
          try {
            const base64 = pickedPhotoBase64(row.photo);
            if (!base64) throw new Error("Could not read this photo.");
            const draft = await api.draftItem({
              imageBase64: base64,
              contentType: row.photo.mimeType,
            });
            updateRow(row.key, { draft, status: "ready" });
          } catch (error) {
            updateRow(row.key, {
              status: "error",
              include: false,
              error:
                error instanceof ApiException
                  ? error.message
                  : "Could not analyse this photo.",
            });
          }
        }
      });

      await Promise.all(workers);
      markDuplicates(existing);
    },
    [markDuplicates, updateRow],
  );

  // Rows handed over by the hub or the web importer start as soon as the
  // wardrobe and existing items are loaded.
  useEffect(() => {
    if (consumedRef.current || loadingSetup || incoming.length === 0) {
      return;
    }
    consumedRef.current = true;

    const nextRows = incoming.slice(0, MAX_ITEMS).map((item) => {
      const row = toReviewRow(item);
      if (!row.photo && !row.draft) {
        return {
          ...row,
          status: "error" as const,
          include: false,
          error: "No photo to analyse.",
        };
      }
      return row;
    });
    setRows(nextRows);

    const needsDraft = nextRows.filter((row) => row.photo && !row.draft);
    if (needsDraft.length > 0) {
      void processRows(needsDraft, existingItems);
    } else {
      markDuplicates(existingItems);
    }
  }, [incoming, existingItems, loadingSetup, markDuplicates, processRows]);

  const rowFromPhoto = (photo: PickedPhoto, index: number): ReviewRow => ({
    key: reviewKey("photo", index),
    photo,
    photoPath: null,
    photoUri: null,
    draft: null,
    sourceUrl: null,
    status: "queued",
    error: null,
    include: true,
    duplicateOf: null,
    duplicateId: null,
    updateExisting: false,
  });

  const appendPhotos = async (photos: PickedPhoto[]) => {
    if (photos.length === 0) return;
    const nextRows = photos.map((photo, index) => rowFromPhoto(photo, index));
    setRows((current) => [...current, ...nextRows]);
    await processRows(nextRows, existingItems);
  };

  const addPhotos = async () => {
    if (!selectedWardrobeId) {
      setNote("Create a wardrobe first.");
      return;
    }
    const remaining = MAX_ITEMS - rows.length;
    if (remaining <= 0) {
      setNote(`A review can hold up to ${MAX_ITEMS} items.`);
      return;
    }

    setPicking(true);
    setNote(null);
    try {
      const photos = await pickPhotos(remaining);
      await appendPhotos(photos);
    } catch (error) {
      setNote(
        error instanceof ApiException
          ? error.message
          : "Could not open the photo library.",
      );
    } finally {
      setPicking(false);
    }
  };

  const addCameraPhoto = async () => {
    if (!selectedWardrobeId) {
      setNote("Create a wardrobe first.");
      return;
    }
    const remaining = MAX_ITEMS - rows.length;
    if (remaining <= 0) {
      setNote(`A review can hold up to ${MAX_ITEMS} items.`);
      return;
    }

    setPicking(true);
    setNote(null);
    try {
      const photo = await pickPhoto("camera");
      if (photo) await appendPhotos([photo]);
    } catch {
      setNote("Could not open the camera.");
    } finally {
      setPicking(false);
    }
  };

  const saveSelected = async () => {
    if (!selectedWardrobeId) return;
    const selected = rows.filter(
      (row) => row.include && row.draft && row.status === "ready",
    );
    if (selected.length === 0) return;

    setSaving(true);
    setNote(null);

    for (const row of selected) {
      const draft = row.draft;
      if (!draft) continue;

      updateRow(row.key, { status: "saving", error: null });
      try {
        const photoUri = row.photo
          ? await api.uploadPhoto(row.photo)
          : (row.photoPath ?? row.photoUri);
        const draftDate = draft.purchaseDate
          ? parseDateOr(draft.purchaseDate, new Date())
          : null;
        const payload: Record<string, unknown> = {
          itemName: draft.itemName,
        };
        if (photoUri) payload.photoUri = photoUri;
        if (!row.updateExisting) payload.wardrobeId = selectedWardrobeId;

        if (row.updateExisting) {
          // Keep the existing item's dates unless the draft supplied one.
          if (draftDate) {
            payload.purchaseDate = draftDate.toISOString();
            payload.expiryDate = addYears(draftDate, 1).toISOString();
          }
        } else {
          const purchaseDate = draftDate ?? new Date();
          payload.purchaseDate = purchaseDate.toISOString();
          payload.expiryDate = addYears(purchaseDate, 1).toISOString();
        }

        if (draft.brand) payload.brand = draft.brand;
        if (draft.category) payload.category = draft.category;
        if (draft.color) payload.color = draft.color;
        if (draft.size) payload.size = draft.size;
        if (draft.price !== null && draft.price !== undefined) {
          payload.price = draft.price;
        }

        if (row.updateExisting && row.duplicateId) {
          await api.patch(`/wardrobeItems/${row.duplicateId}`, payload);
        } else {
          await api.post("/wardrobeItems", payload);
        }
        updateRow(row.key, { status: "saved" });
      } catch (error) {
        updateRow(row.key, {
          status: "error",
          error:
            error instanceof ApiException
              ? error.message
              : "Could not save this item.",
        });
      }
    }

    setSaving(false);
  };

  const includedCount = rows.filter(
    (row) => row.include && row.draft && row.status === "ready",
  ).length;
  const savedCount = rows.filter((row) => row.status === "saved").length;
  const drafting = rows.some(
    (row) => row.status === "queued" || row.status === "drafting",
  );
  const busy = saving || drafting;
  const selectedWardrobeName =
    wardrobes.find((wardrobe) => wardrobe.id === selectedWardrobeId)?.name ??
    "";

  const selectAll = () => {
    setRows((current) =>
      current.map((row) =>
        row.status === "ready" && row.draft && !row.duplicateOf
          ? { ...row, include: true }
          : row,
      ),
    );
  };

  const deleteSelected = () => {
    Alert.alert(
      "Delete selected items?",
      "They will be removed from this review.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setRows((current) => current.filter((row) => !row.include)),
        },
      ],
    );
  };

  return (
    <FormScreen
      title="Review items"
      subtitle={`${rows.length} of ${MAX_ITEMS} items`}
      footer={
        <View>
          {note ? (
            <Text className="mb-2 text-sm text-ink-secondary">{note}</Text>
          ) : null}
          {savedCount > 0 && includedCount === 0 && !busy ? (
            <CustomButton
              title="Done"
              onPress={() => router.replace("/(root)/(tabs)/closet")}
            />
          ) : (
            <CustomButton
              title={
                includedCount === 1
                  ? "Add 1 to closet"
                  : `Add ${includedCount} to closet`
              }
              isLoading={saving}
              disabled={
                includedCount === 0 || !selectedWardrobeId || busy
              }
              onPress={saveSelected}
            />
          )}
        </View>
      }
    >
      <View className="rounded-[18px] border border-line bg-white p-4">
        <View className="flex-row items-center">
          <Sparkles size={18} color={wardroColors.primaryDark} />
          <Text className="ml-2 text-[15px] font-semibold text-ink">
            Add items
          </Text>
        </View>
        <Text className="mt-1 text-[12px] leading-5 text-ink-secondary">
          Take a photo or choose up to {MAX_ITEMS}. Each one is drafted
          automatically; review them before adding to your closet.
        </Text>

        <View className="mt-3">
          <CustomButton
            title={
              picking
                ? "Opening photos…"
                : drafting
                  ? "Reading photos…"
                  : "Add photos"
            }
            variant="outline"
            isLoading={picking}
            disabled={
              loadingSetup ||
              Boolean(setupError) ||
              !selectedWardrobeId ||
              busy ||
              picking
            }
            onPress={addPhotos}
          />
          <CustomButton
            title="Take a photo"
            variant="outline"
            className="mt-2"
            disabled={
              loadingSetup ||
              Boolean(setupError) ||
              !selectedWardrobeId ||
              busy ||
              picking
            }
            onPress={addCameraPhoto}
          />
        </View>

        <SelectField
          label="Wardrobe"
          placeholder={
            loadingSetup ? "Loading wardrobes…" : "Select a wardrobe"
          }
          value={selectedWardrobeName}
          options={wardrobes.map((wardrobe) => wardrobe.name)}
          onChange={(name) => {
            const match = wardrobes.find((wardrobe) => wardrobe.name === name);
            setSelectedWardrobeId(match?.id ?? null);
          }}
          allowCustom={false}
        />

        {setupError ? (
          <Pressable onPress={loadSetup}>
            <Text className="mt-1 text-xs text-danger">
              {setupError} Tap to retry.
            </Text>
          </Pressable>
        ) : null}

        {!loadingSetup && wardrobes.length === 0 ? (
          <View className="mt-3 rounded-[14px] border border-warning/30 bg-warning/10 p-3">
            <Text className="text-[12.5px] leading-5 text-ink">
              Add a wardrobe before importing items.
            </Text>
            <View className="mt-2">
              <CustomButton
                title="Add Wardrobe"
                onPress={() => router.push("/(root)/add-wardrobe")}
              />
            </View>
          </View>
        ) : null}
      </View>

      {rows.length === 0 ? (
        <View className="mt-5 items-center rounded-[18px] border border-dashed border-line bg-surface px-5 py-8">
          <Images size={34} color={wardroColors.text.disabled} />
          <Text className="mt-3 text-sm font-semibold text-ink">
            Nothing to review yet
          </Text>
          <Text className="mt-1 text-center text-[12px] leading-4 text-ink-secondary">
            Add photos or take one. Duplicates found in this profile are
            skipped by default.
          </Text>
        </View>
      ) : (
        <>
          <View className="mt-5 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              onPress={selectAll}
              className="py-2 active:opacity-70"
            >
              <Text className="text-[12.5px] font-semibold text-ink">
                Select all
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={deleteSelected}
              className="py-2 active:opacity-70"
            >
              <Text className="text-[12.5px] font-semibold text-danger">
                Delete selected
              </Text>
            </Pressable>
          </View>

          {rows.map((row) => {
            const imageUri = row.photo?.uri ?? row.photoUri;
            return (
          <View
            key={row.key}
            className="mt-3 flex-row rounded-[18px] border border-line bg-white p-3"
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 72, height: 92, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center rounded-[12px] bg-surface"
                style={{ width: 72, height: 92 }}
              >
                <Images size={22} color={wardroColors.text.disabled} />
              </View>
            )}

            <View className="ml-3 flex-1">
              <Text
                numberOfLines={2}
                className="text-[14px] font-bold text-ink"
              >
                {statusLabel(row)}
              </Text>

              {row.draft ? (
                <Text
                  numberOfLines={2}
                  className="mt-1 text-[11px] leading-4 text-ink-secondary"
                >
                  {draftDetails(row.draft) || "No extra details"}
                </Text>
              ) : null}

              {row.duplicateOf ? (
                <Text className="mt-1 text-[11px] font-semibold text-warning">
                  Possible duplicate: {row.duplicateOf}
                </Text>
              ) : null}

              {row.error ? (
                <Text className="mt-1 text-[11px] leading-4 text-danger">
                  {row.error}
                </Text>
              ) : null}

              {row.status === "drafting" || row.status === "saving" ? (
                <ActivityIndicator
                  size="small"
                  color={wardroColors.primaryDark}
                  style={{ alignSelf: "flex-start", marginTop: 8 }}
                />
              ) : null}

              {row.draft && row.status === "ready" ? (
                row.duplicateOf ? (
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() =>
                        updateRow(row.key, {
                          include: false,
                          updateExisting: false,
                        })
                      }
                      className={`rounded-full px-2.5 py-1.5 ${
                        !row.include
                          ? "bg-brand"
                          : "border border-line bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-[10.5px] font-semibold ${
                          !row.include ? "text-white" : "text-ink-secondary"
                        }`}
                      >
                        Skip
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        updateRow(row.key, {
                          include: true,
                          updateExisting: false,
                        })
                      }
                      className={`rounded-full px-2.5 py-1.5 ${
                        row.include && !row.updateExisting
                          ? "bg-brand"
                          : "border border-line bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-[10.5px] font-semibold ${
                          row.include && !row.updateExisting
                            ? "text-white"
                            : "text-ink-secondary"
                        }`}
                      >
                        Add anyway
                      </Text>
                    </Pressable>
                    {row.duplicateId ? (
                      <Pressable
                        onPress={() =>
                          updateRow(row.key, {
                            include: true,
                            updateExisting: true,
                          })
                        }
                        className={`rounded-full px-2.5 py-1.5 ${
                          row.include && row.updateExisting
                            ? "bg-brand"
                            : "border border-line bg-surface"
                        }`}
                      >
                        <Text
                          className={`text-[10.5px] font-semibold ${
                            row.include && row.updateExisting
                              ? "text-white"
                              : "text-ink-secondary"
                          }`}
                        >
                          Update existing
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : (
                  <Pressable
                    onPress={() =>
                      updateRow(row.key, { include: !row.include })
                    }
                    className={`mt-2 self-start rounded-full px-2.5 py-1.5 ${
                      row.include
                        ? "bg-brand"
                        : "border border-line bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-[10.5px] font-semibold ${
                        row.include ? "text-white" : "text-ink-secondary"
                      }`}
                    >
                      {row.include
                        ? "Included · tap to skip"
                        : "Skipped · tap to include"}
                    </Text>
                  </Pressable>
                )
              ) : null}

              {row.status === "saved" ? (
                <Text className="mt-2 text-[11px] font-semibold text-success">
                  Saved
                </Text>
              ) : null}
            </View>
          </View>
            );
          })}
        </>
      )}
    </FormScreen>
  );
}
