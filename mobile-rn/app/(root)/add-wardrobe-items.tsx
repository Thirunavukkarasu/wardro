import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ImageIcon,
  Images,
  Link2,
  Palette,
  Ruler,
  Shirt,
  Sparkles,
  Store,
  Tag,
  Wallet,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import CustomButton from "~/components/CustomButton";
import DateField from "~/components/DateField";
import FormScreen from "~/components/FormScreen";
import InputField from "~/components/InputField";
import PhotoCaptureField from "~/components/PhotoCaptureField";
import SelectField from "~/components/SelectField";
import { api, ApiException } from "~/lib/api";
import { addYears } from "~/lib/dates";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_COLORS,
  DEFAULT_SIZES,
  mergeOptions,
} from "~/lib/item-options";
import { pickedPhotoBase64 } from "~/lib/photos";
import { useProfiles } from "~/lib/profiles-context";
import type { ItemDraft, PickedPhoto, Wardrobe } from "~/lib/types";
import {
  wardrobeFromJson,
  wardrobeItemFromJson,
  type WardrobeItem,
} from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

export default function AddItemScreen() {
  const { activeProfile } = useProfiles();
  const params = useLocalSearchParams<{
    id?: string;
    item?: string;
    wardrobeId?: string;
  }>();

  const editingItem = useMemo<WardrobeItem | null>(() => {
    if (!params.item) return null;
    try {
      return wardrobeItemFromJson(
        JSON.parse(params.item) as Record<string, unknown>,
      );
    } catch {
      return null;
    }
  }, [params.item]);

  const isEditing = Boolean(editingItem);
  const today = useMemo(() => new Date(), []);

  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<number | null>(
    editingItem?.wardrobeId ?? null,
  );
  const [loadingWardrobes, setLoadingWardrobes] = useState(true);
  const [wardrobesError, setWardrobesError] = useState<string | null>(null);

  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [importedPhoto, setImportedPhoto] = useState<{
    path: string;
    url: string;
  } | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [autoFilling, setAutoFilling] = useState<"photo" | "url" | null>(null);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [autoFillNote, setAutoFillNote] = useState<string | null>(null);
  const autoScannedRef = useRef<string | null>(null);
  const [itemName, setItemName] = useState(editingItem?.itemName ?? "");
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(
    editingItem?.purchaseDate ?? (isEditing ? null : today),
  );
  const [expiryDate, setExpiryDate] = useState<Date | null>(
    editingItem?.expiryDate ?? (isEditing ? null : addYears(today, 1)),
  );
  const [metaOptions, setMetaOptions] = useState<{
    categories: string[];
    colors: string[];
    sizes: string[];
  }>({ categories: [], colors: [], sizes: [] });
  const [price, setPrice] = useState(
    editingItem?.price !== null && editingItem?.price !== undefined
      ? String(editingItem.price)
      : "",
  );
  const [brand, setBrand] = useState(editingItem?.brand ?? "");
  const [category, setCategory] = useState(editingItem?.category ?? "");
  const [color, setColor] = useState(editingItem?.color ?? "");
  const [size, setSize] = useState(editingItem?.size ?? "");
  const existingPhotoUri = editingItem?.photoUri ?? "";

  const categoryOptions = useMemo(
    () => mergeOptions(DEFAULT_CATEGORIES, metaOptions.categories, category),
    [category, metaOptions.categories],
  );
  const colorOptions = useMemo(
    () => mergeOptions(DEFAULT_COLORS, metaOptions.colors, color),
    [color, metaOptions.colors],
  );
  const sizeOptions = useMemo(
    () => mergeOptions(DEFAULT_SIZES, metaOptions.sizes, size),
    [size, metaOptions.sizes],
  );

  useEffect(() => {
    let cancelled = false;

    api
      .get<{
        categories?: string[];
        colors?: string[];
        sizes?: string[];
      }>("/wardrobeItems/options")
      .then((data) => {
        if (cancelled) return;
        setMetaOptions({
          categories: data?.categories ?? [],
          colors: data?.colors ?? [],
          sizes: data?.sizes ?? [],
        });
      })
      .catch(() => {
        // The fixed option sets still work if this request fails.
      });

    return () => {
      cancelled = true;
    };
  }, [activeProfile?.id]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWardrobes = useCallback(async () => {
    setLoadingWardrobes(true);
    setWardrobesError(null);

    try {
      const rows = await api.get<Record<string, unknown>[]>("/wardrobes");
      const list = (rows ?? []).map(wardrobeFromJson);
      const preferred = params.wardrobeId
        ? Number(params.wardrobeId)
        : (editingItem?.wardrobeId ?? null);

      setWardrobes(list);
      setSelectedWardrobeId((current) => {
        const wanted = preferred ?? current;
        if (wanted && list.some((wardrobe) => wardrobe.id === wanted)) {
          return wanted;
        }
        return list[0]?.id ?? null;
      });
    } catch (loadError) {
      setWardrobesError(
        loadError instanceof ApiException
          ? loadError.message
          : "Could not load your wardrobes.",
      );
    } finally {
      setLoadingWardrobes(false);
    }
  }, [activeProfile?.id, editingItem?.wardrobeId, params.wardrobeId]);

  useFocusEffect(
    useCallback(() => {
      loadWardrobes();
    }, [loadWardrobes]),
  );

  const buildCreatePayload = (photoUri?: string) => {
    const payload: Record<string, unknown> = {
      itemName: itemName.trim(),
      wardrobeId: selectedWardrobeId,
    };

    if (photoUri) payload.photoUri = photoUri;
    if (brand.trim()) payload.brand = brand.trim();
    if (category.trim()) payload.category = category.trim();
    if (color.trim()) payload.color = color.trim();
    if (size.trim()) payload.size = size.trim();

    const parsedPrice = Number.parseFloat(price.trim());
    if (Number.isFinite(parsedPrice)) payload.price = parsedPrice;
    if (purchaseDate) payload.purchaseDate = purchaseDate.toISOString();
    if (expiryDate) payload.expiryDate = expiryDate.toISOString();

    return payload;
  };

  const buildUpdatePayload = (photoUri?: string) => {
    const parsedPrice = price.trim()
      ? Number.parseFloat(price.trim())
      : null;

    return {
      itemName: itemName.trim(),
      wardrobeId: selectedWardrobeId,
      photoUri:
        photoUri !== undefined ? photoUri : existingPhotoUri || "",
      brand: brand.trim() || null,
      category: category.trim() || null,
      color: color.trim() || null,
      size: size.trim() || null,
      price: parsedPrice !== null && Number.isFinite(parsedPrice)
        ? parsedPrice
        : null,
      purchaseDate: purchaseDate ? purchaseDate.toISOString() : null,
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
    };
  };

  const applyDraft = useCallback((draft: ItemDraft) => {
    if (draft.itemName.trim()) setItemName(draft.itemName.trim());
    if (draft.brand) setBrand(draft.brand);
    if (draft.category) setCategory(draft.category);
    if (draft.color) setColor(draft.color);
    if (draft.size) setSize(draft.size);
    if (draft.price !== null && draft.price !== undefined) {
      setPrice(String(draft.price));
    }
    if (draft.purchaseDate) {
      const date = new Date(draft.purchaseDate);
      if (!Number.isNaN(date.getTime())) setPurchaseDate(date);
    }
    if (draft.photoPath && draft.photoUri) {
      setImportedPhoto({ path: draft.photoPath, url: draft.photoUri });
    }
    setAutoFillNote(
      draft.source === "metadata"
        ? "Filled from the page metadata. Review the details before saving."
        : "Draft filled. Review the details before saving.",
    );
  }, []);

  const runPhotoDraft = useCallback(
    async (target: PickedPhoto) => {
      const base64 = pickedPhotoBase64(target);
      if (!base64) {
        setAutoFillError("Could not read the selected photo.");
        return;
      }

      setAutoFilling("photo");
      setAutoFillError(null);
      setAutoFillNote(null);
      try {
        const draft = await api.draftItem({
          imageBase64: base64,
          contentType: target.mimeType,
        });
        applyDraft(draft);
      } catch (fillError) {
        setAutoFillError(
          fillError instanceof ApiException
            ? fillError.message
            : "Could not scan the photo.",
        );
      } finally {
        setAutoFilling(null);
      }
    },
    [applyDraft],
  );

  // Choosing or taking a photo starts the scan automatically. The manual
  // button remains as a retry when the model is temporarily unavailable.
  useEffect(() => {
    if (!photo) return;
    const base64 = pickedPhotoBase64(photo);
    if (!base64) return;

    const key = `${photo.uri}:${base64.length}:${base64.slice(0, 24)}`;
    if (autoScannedRef.current === key) return;
    autoScannedRef.current = key;
    void runPhotoDraft(photo);
  }, [photo, runPhotoDraft]);

  const autoFillFromUrl = async () => {
    const url = sourceUrl.trim();
    if (!url) {
      setAutoFillError("Paste a product URL first.");
      return;
    }

    setAutoFilling("url");
    setAutoFillError(null);
    setAutoFillNote(null);
    try {
      const draft = await api.draftItem({ url });
      applyDraft(draft);
    } catch (fillError) {
      setAutoFillError(
        fillError instanceof ApiException
          ? fillError.message
          : "Could not import that URL.",
      );
    } finally {
      setAutoFilling(null);
    }
  };

  const save = async () => {
    setError(null);

    if (!itemName.trim()) {
      setError("Give the item a name.");
      return;
    }
    if (!selectedWardrobeId) {
      setError("Create a wardrobe before adding items.");
      return;
    }

    setSaving(true);

    try {
      let photoUri: string | undefined = importedPhoto?.path;
      if (photo) {
        photoUri = await api.uploadPhoto(photo);
      }

      if (isEditing && editingItem) {
        await api.patch(
          `/wardrobeItems/${editingItem.id}`,
          buildUpdatePayload(photoUri),
        );
      } else {
        await api.post("/wardrobeItems", buildCreatePayload(photoUri));
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(root)/(tabs)/today");
      }
    } catch (saveError) {
      setError(
        saveError instanceof ApiException
          ? saveError.message
          : "Could not save the item.",
      );
    } finally {
      setSaving(false);
    }
  };

  const noWardrobes = !loadingWardrobes && wardrobes.length === 0;
  const selectedWardrobeName = wardrobes.find(
    (wardrobe) => wardrobe.id === selectedWardrobeId,
  )?.name;

  return (
    <FormScreen
      title={isEditing ? "Edit Item" : "Add Item"}
      subtitle={
        selectedWardrobeName
          ? isEditing
            ? `In ${selectedWardrobeName}`
            : `Add to ${selectedWardrobeName}`
          : isEditing
            ? "Update garment"
            : activeProfile
              ? `${activeProfile.name}'s wardrobe`
              : "New garment"
      }
      footer={
        noWardrobes ? undefined : (
          <View>
            {error ? (
              <Text className="mb-2 text-sm font-medium text-danger">
                {error}
              </Text>
            ) : null}
            <CustomButton
              title={isEditing ? "Save Changes" : "Save Item"}
              isLoading={saving}
              onPress={save}
            />
          </View>
        )
      }
    >
      {noWardrobes ? (
        <View className="rounded-[16px] border border-warning/30 bg-warning/10 p-4">
          <Text className="text-sm leading-5 text-ink">
            No wardrobes found. Add a wardrobe first, then come back.
          </Text>
          <View className="mt-3">
            <CustomButton
              title="Add Wardrobe"
              onPress={() => router.push("/(root)/add-wardrobe")}
            />
          </View>
        </View>
      ) : (
        <>
          {isEditing && existingPhotoUri && !photo ? (
            <View className="mb-3 flex-row items-center rounded-[14px] border border-line bg-white px-4 py-3">
              <ImageIcon size={18} color={wardroColors.primaryDark} />
              <Text className="ml-2 flex-1 text-[12.5px] leading-5 text-ink-secondary">
                The current photo will be kept. Choose a new one below to
                replace it.
              </Text>
            </View>
          ) : null}

          <PhotoCaptureField
            photo={photo}
            onChange={(next) => {
              setPhoto(next);
              if (next) setImportedPhoto(null);
            }}
          />

          {importedPhoto && !photo ? (
            <View className="mt-3 rounded-[16px] border border-line bg-white p-3">
              <View className="flex-row items-center">
                <Image
                  source={{ uri: importedPhoto.url }}
                  style={{ width: 56, height: 56, borderRadius: 10 }}
                  resizeMode="cover"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-[13px] font-semibold text-ink">
                    Photo imported from URL
                  </Text>
                  <Text className="mt-0.5 text-[11px] leading-4 text-ink-secondary">
                    You can replace it with your own photo.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove imported photo"
                  onPress={() => setImportedPhoto(null)}
                  className="p-2 active:opacity-70"
                >
                  <X size={16} color={wardroColors.text.secondary} />
                </Pressable>
              </View>
            </View>
          ) : null}

          <View className="mt-4 rounded-[18px] border border-line bg-white p-4">
            <View className="flex-row items-center">
              <Sparkles size={18} color={wardroColors.primaryDark} />
              <Text className="ml-2 text-[15px] font-semibold text-ink">
                Fill details automatically
              </Text>
            </View>
            <Text className="mt-1 text-[12px] leading-5 text-ink-secondary">
              Photo details fill automatically when you choose a photo. You can
              also paste a product link. Review everything before saving.
            </Text>

            <View className="mt-3">
              <CustomButton
                title={
                  autoFilling === "photo" ? "Scanning photo…" : "Scan photo"
                }
                variant="outline"
                isLoading={autoFilling === "photo"}
                disabled={!photo || autoFilling !== null}
                onPress={() => {
                  if (photo) void runPhotoDraft(photo);
                }}
              />
            </View>

            <InputField
              label="Product URL"
              placeholder="https://shop.example.com/item"
              icon={<Link2 size={20} color={wardroColors.text.disabled} />}
              value={sourceUrl}
              onChangeText={(value) => {
                setSourceUrl(value);
                setAutoFillError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <CustomButton
              title={autoFilling === "url" ? "Importing…" : "Import from URL"}
              variant="outline"
              isLoading={autoFilling === "url"}
              disabled={!sourceUrl.trim() || autoFilling !== null}
              onPress={autoFillFromUrl}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bulk import up to 10 photos"
              onPress={() => router.push("/(root)/bulk-import")}
              className="mt-3 flex-row items-center justify-center rounded-[14px] border border-line bg-surface py-2.5 active:opacity-80"
            >
              <Images size={16} color={wardroColors.primaryDark} />
              <Text className="ml-2 text-[12.5px] font-semibold text-brand">
                Bulk import up to 10 photos
              </Text>
            </Pressable>

            {autoFillError ? (
              <Text className="mt-2 text-xs font-medium text-danger">
                {autoFillError}
              </Text>
            ) : null}
            {autoFillNote ? (
              <Text className="mt-2 text-[11px] leading-4 text-ink-secondary">
                {autoFillNote}
              </Text>
            ) : null}
          </View>

          <View className="mt-4">
                <Text className="mb-1.5 text-[13.5px] font-semibold text-ink">
                  Wardrobe
                </Text>

                {loadingWardrobes ? (
                  <Text className="py-2 text-sm text-ink-secondary">
                    Loading wardrobes…
                  </Text>
                ) : wardrobesError ? (
                  <Pressable onPress={loadWardrobes}>
                    <Text className="py-2 text-sm text-danger">
                      {wardrobesError} Tap to retry.
                    </Text>
                  </Pressable>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    {wardrobes.map((wardrobe) => {
                      const selected = wardrobe.id === selectedWardrobeId;
                      return (
                        <Pressable
                          key={wardrobe.id}
                          onPress={() => setSelectedWardrobeId(wardrobe.id)}
                          className={`mr-2 rounded-full border px-4 py-2 ${
                            selected
                              ? "border-brand bg-brand"
                              : "border-line bg-white"
                          }`}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              selected ? "text-white" : "text-ink"
                            }`}
                          >
                            {wardrobe.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              <InputField
                label="Item Name"
                placeholder="Enter item name"
                icon={<Shirt size={20} color={wardroColors.text.disabled} />}
                value={itemName}
                onChangeText={(value) => {
                  setItemName(value);
                  setError(null);
                }}
              />

              <DateField
                label="Purchase Date"
                value={purchaseDate}
                onChange={setPurchaseDate}
              />

              <DateField
                label="Expiry Date"
                value={expiryDate}
                onChange={setExpiryDate}
              />

              <InputField
                label="Price"
                placeholder="Enter price"
                icon={<Wallet size={20} color={wardroColors.text.disabled} />}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />

              <InputField
                label="Brand"
                placeholder="Enter brand"
                icon={<Store size={20} color={wardroColors.text.disabled} />}
                value={brand}
                onChangeText={setBrand}
              />

              <SelectField
                label="Category"
                placeholder="Select category"
                icon={<Tag size={20} color={wardroColors.text.disabled} />}
                value={category}
                options={categoryOptions}
                onChange={setCategory}
              />

              <SelectField
                label="Color"
                placeholder="Select colour"
                icon={<Palette size={20} color={wardroColors.text.disabled} />}
                value={color}
                options={colorOptions}
                onChange={setColor}
              />

              <SelectField
                label="Size"
                placeholder="Select size"
                icon={<Ruler size={20} color={wardroColors.text.disabled} />}
                value={size}
                options={sizeOptions}
                onChange={setSize}
              />

            </>
          )}
    </FormScreen>
  );
}
