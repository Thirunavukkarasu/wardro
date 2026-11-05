import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Camera, Pencil, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "~/components/AppHeader";
import AppPill from "~/components/AppPill";
import CircleAction from "~/components/CircleAction";
import ConfirmDialog from "~/components/ConfirmDialog";
import ItemPhotoTile from "~/components/ItemPhotoTile";
import { EmptyView, ErrorView, LoadingView } from "~/components/StatusViews";
import { api, ApiException } from "~/lib/api";
import { useProfiles } from "~/lib/profiles-context";
import {
  wardrobeFromJson,
  wardrobeItemFromJson,
  type WardrobeItem,
} from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

export default function WardrobeItemsScreen() {
  const { activeProfile } = useProfiles();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    description?: string;
  }>();

  const wardrobeId = Number(params.id);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [wardrobeName, setWardrobeName] = useState(
    params.name || "Wardrobe",
  );
  const [wardrobeDescription, setWardrobeDescription] = useState(
    params.description ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [itemRows, wardrobeRows] = await Promise.all([
        api.get<Record<string, unknown>[]>(
          `/wardrobeItems/${wardrobeId}`,
        ),
        api.get<Record<string, unknown>[]>("/wardrobes"),
      ]);

      setItems((itemRows ?? []).map(wardrobeItemFromJson));

      const current = (wardrobeRows ?? [])
        .map(wardrobeFromJson)
        .find((wardrobe) => wardrobe.id === wardrobeId);

      if (current) {
        setWardrobeName(current.name);
        setWardrobeDescription(current.description);
      }
    } catch (loadError) {
      setError(
        loadError instanceof ApiException
          ? loadError.message
          : "Could not load this wardrobe.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id, wardrobeId]);

  useFocusEffect(
    useCallback(() => {
      if (Number.isFinite(wardrobeId) && wardrobeId > 0) load();
    }, [load, wardrobeId]),
  );

  const addItem = () =>
    router.push({
      pathname: "/(root)/add-wardrobe-items",
      params: { wardrobeId: String(wardrobeId) },
    });

  const openItem = (item: WardrobeItem) =>
    router.push({
      pathname: "/(root)/item/[id]",
      params: { id: String(item.id), item: JSON.stringify(item) },
    });

  const openEdit = () =>
    router.push({
      pathname: "/(root)/add-wardrobe",
      params: {
        id: String(wardrobeId),
        name: wardrobeName,
        description: wardrobeDescription,
      },
    });

  const deleteWardrobe = async () => {
    setDeleting(true);

    try {
      await api.delete(`/wardrobes/${wardrobeId}`);
      setConfirmVisible(false);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(root)/(tabs)/today");
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiException
          ? deleteError.message
          : "Could not delete the wardrobe.",
      );
      setConfirmVisible(false);
    } finally {
      setDeleting(false);
    }
  };

  const name = wardrobeName;
  const description = wardrobeDescription;

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-canvas"
    >
      <AppHeader
        title={name}
        right={
          <View className="flex-row items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit wardrobe"
              hitSlop={8}
              onPress={openEdit}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-surface"
            >
              <Pencil size={20} color={wardroColors.text.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete wardrobe"
              hitSlop={8}
              onPress={() => setConfirmVisible(true)}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-surface"
            >
              <Trash2 size={21} color={wardroColors.text.primary} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={loading && items.length > 0}
            onRefresh={load}
            tintColor={wardroColors.primaryDark}
            colors={[wardroColors.primaryDark]}
          />
        }
      >
        <View className="mt-4 flex-row items-start">
          <View className="flex-1">
            {description ? (
              <Text
                numberOfLines={2}
                className="text-[13px] leading-5 text-ink-secondary"
              >
                {description}
              </Text>
            ) : null}
            <View className="mt-2.5 self-start">
              <AppPill
                label={`${items.length} ${items.length === 1 ? "item" : "items"}`}
                color={wardroColors.primaryDark}
              />
            </View>
          </View>

          <View className="ml-3">
            <CircleAction
              icon={<Camera size={24} color={wardroColors.surface} />}
              accessibilityLabel="Add item"
              onPress={addItem}
            />
          </View>
        </View>

        <View className="mt-4">
          {loading && items.length === 0 ? (
            <LoadingView message="Loading items…" />
          ) : error && items.length === 0 ? (
            <ErrorView
              title="Couldn't load this wardrobe"
              message={error}
              onRetry={load}
            />
          ) : items.length === 0 ? (
            <EmptyView
              icon={<Camera size={34} color={wardroColors.primaryDark} />}
              title="Nothing here yet"
              message="Add your first item to this wardrobe and it will show up here."
              actionLabel="Add Item"
              onAction={addItem}
            />
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {items.map((item) => (
                <View
                  key={item.id}
                  style={{ width: "48.5%", marginBottom: 12 }}
                >
                  <ItemPhotoTile
                    item={item}
                    onPress={() => openItem(item)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {error && items.length > 0 ? (
          <Text className="mt-2 text-sm text-danger">{error}</Text>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete wardrobe?"
        message={
          items.length === 0
            ? `"${name}" will be removed permanently.`
            : `"${name}" and its ${items.length} ${
                items.length === 1 ? "item" : "items"
              } will be removed permanently.`
        }
        busy={deleting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={deleteWardrobe}
      />
    </SafeAreaView>
  );
}
