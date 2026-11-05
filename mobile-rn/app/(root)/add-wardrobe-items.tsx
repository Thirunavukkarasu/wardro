import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ImageIcon,
  Palette,
  Ruler,
  Shirt,
  Store,
  Tag,
  Wallet,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import CustomButton from "~/components/CustomButton";
import DateField from "~/components/DateField";
import FormScreen from "~/components/FormScreen";
import InputField from "~/components/InputField";
import PhotoCaptureField from "~/components/PhotoCaptureField";
import { api, ApiException } from "~/lib/api";
import { useProfiles } from "~/lib/profiles-context";
import type { PickedPhoto, Wardrobe } from "~/lib/types";
import {
  wardrobeFromJson,
  wardrobeItemFromJson,
  type WardrobeItem,
} from "~/lib/types";

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

  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<number | null>(
    editingItem?.wardrobeId ?? null,
  );
  const [loadingWardrobes, setLoadingWardrobes] = useState(true);
  const [wardrobesError, setWardrobesError] = useState<string | null>(null);

  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [itemName, setItemName] = useState(editingItem?.itemName ?? "");
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(
    editingItem?.purchaseDate ?? null,
  );
  const [expiryDate, setExpiryDate] = useState<Date | null>(
    editingItem?.expiryDate ?? null,
  );
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
      let photoUri: string | undefined;
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
              <ImageIcon size={18} color="#4F46E5" />
              <Text className="ml-2 flex-1 text-[12.5px] leading-5 text-ink-secondary">
                The current photo will be kept. Choose a new one below to
                replace it.
              </Text>
            </View>
          ) : null}

          <PhotoCaptureField photo={photo} onChange={setPhoto} />

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
                icon={<Shirt size={20} color="#94A3B8" />}
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
                icon={<Wallet size={20} color="#94A3B8" />}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />

              <InputField
                label="Brand"
                placeholder="Enter brand"
                icon={<Store size={20} color="#94A3B8" />}
                value={brand}
                onChangeText={setBrand}
              />

              <InputField
                label="Category"
                placeholder="Enter category"
                icon={<Tag size={20} color="#94A3B8" />}
                value={category}
                onChangeText={setCategory}
              />

              <InputField
                label="Color"
                placeholder="Enter color"
                icon={<Palette size={20} color="#94A3B8" />}
                value={color}
                onChangeText={setColor}
              />

              <InputField
                label="Size"
                placeholder="Enter size"
                icon={<Ruler size={20} color="#94A3B8" />}
                value={size}
                onChangeText={setSize}
              />

            </>
          )}
    </FormScreen>
  );
}
