import { router, useFocusEffect } from "expo-router";
import {
  ChevronRight,
  LayoutGrid,
  Search,
  Shirt,
  X,
} from "lucide-react-native";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppPill from "~/components/AppPill";
import ItemPhotoTile from "~/components/ItemPhotoTile";
import { EmptyView, ErrorView, LoadingView } from "~/components/StatusViews";
import { api, ApiException } from "~/lib/api";
import { apiBaseUrl } from "~/lib/firebase-config";
import { formatPrice } from "~/lib/formatters";
import { useProfiles } from "~/lib/profiles-context";
import {
  wardrobeFromJson,
  wardrobeItemFromJson,
  type Wardrobe,
  type WardrobeItem,
} from "~/lib/types";

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
        active ? "border-brand bg-brand" : "border-line bg-white"
      }`}
    >
      <Text
        className={`text-[12.5px] font-semibold ${
          active ? "text-white" : "text-ink"
        }`}
      >
        {label} · {count}
      </Text>
    </Pressable>
  );
}

export default function ClosetScreen() {
  const { activeProfile } = useProfiles();
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null,
  );
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<number | null>(
    null,
  );

  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [wardrobeRows, itemRows] = await Promise.all([
        api.get<Record<string, unknown>[]>("/wardrobes/summary"),
        api.get<Record<string, unknown>[]>("/wardrobeItems"),
      ]);

      setWardrobes((wardrobeRows ?? []).map(wardrobeFromJson));
      setItems((itemRows ?? []).map(wardrobeItemFromJson));
    } catch (loadError) {
      setError(
        loadError instanceof ApiException
          ? loadError.message
          : "Could not load your items.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    setQuery("");
    setSelectedCategory(null);
    setSelectedWardrobeId(null);
  }, [activeProfile?.id]);

  const countsByWardrobe = new Map<number, number>();
  const countsByCategory = new Map<string, number>();
  for (const item of items) {
    countsByWardrobe.set(
      item.wardrobeId,
      (countsByWardrobe.get(item.wardrobeId) ?? 0) + 1,
    );

    const category = item.category.trim();
    if (category) {
      countsByCategory.set(
        category,
        (countsByCategory.get(category) ?? 0) + 1,
      );
    }
  }

  const categoryOptions = [...countsByCategory.keys()].sort((a, b) =>
    a.localeCompare(b),
  );

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    if (
      selectedCategory !== null &&
      item.category.trim().toLowerCase() !== selectedCategory.toLowerCase()
    ) {
      return false;
    }
    if (
      selectedWardrobeId !== null &&
      item.wardrobeId !== selectedWardrobeId
    ) {
      return false;
    }
    if (!normalizedQuery) return true;

    return [
      item.itemName,
      item.brand,
      item.category,
      item.color,
      item.size,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  const byWardrobe = new Map<number, WardrobeItem[]>();
  for (const item of visibleItems) {
    const group = byWardrobe.get(item.wardrobeId) ?? [];
    group.push(item);
    byWardrobe.set(item.wardrobeId, group);
  }

  const populated = wardrobes.filter(
    (wardrobe) => (byWardrobe.get(wardrobe.id)?.length ?? 0) > 0,
  );

  const visibleValue = visibleItems.reduce(
    (sum, item) => sum + (item.price ?? 0),
    0,
  );

  const hasFilters =
    normalizedQuery.length > 0 ||
    selectedCategory !== null ||
    selectedWardrobeId !== null;

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory(null);
    setSelectedWardrobeId(null);
  };

  const openItem = (item: WardrobeItem) =>
    router.push({
      pathname: "/(root)/item/[id]",
      params: { id: String(item.id), item: JSON.stringify(item) },
    });

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="px-5 pt-3.5">
        <View>
          <Text className="text-[26px] font-extrabold tracking-tight text-ink">
            Closet
          </Text>
          {!loading && !error ? (
            <Text className="mt-1 text-xs text-ink-secondary">
              {activeProfile ? `${activeProfile.name} · ` : ""}
              {visibleItems.length}{" "}
              {visibleItems.length === 1 ? "item" : "items"} ·{" "}
              {formatPrice(visibleValue)}
            </Text>
          ) : null}
        </View>

        <View className="mt-3 flex-row items-center rounded-[14px] border border-line bg-white px-4">
          <Search size={18} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, brand, category…"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            className="ml-2.5 flex-1 py-3 text-[14px] font-semibold text-ink outline-none"
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => setQuery("")}
            >
              <X size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        {categoryOptions.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 12 }}
          >
            <FilterChip
              label="All types"
              count={items.length}
              active={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {categoryOptions.map((category) => (
              <FilterChip
                key={category}
                label={category}
                count={countsByCategory.get(category) ?? 0}
                active={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}
          </ScrollView>
        ) : null}

        {wardrobes.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
          >
            <FilterChip
              label="All wardrobes"
              count={items.length}
              active={selectedWardrobeId === null}
              onPress={() => setSelectedWardrobeId(null)}
            />
            {wardrobes.map((wardrobe) => (
              <FilterChip
                key={wardrobe.id}
                label={wardrobe.name}
                count={countsByWardrobe.get(wardrobe.id) ?? 0}
                active={selectedWardrobeId === wardrobe.id}
                onPress={() => setSelectedWardrobeId(wardrobe.id)}
              />
            ))}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage wardrobes"
              onPress={() => router.push("/(root)/wardrobes")}
              className="flex-row items-center rounded-full border border-line bg-white px-3.5 py-2 active:opacity-80"
            >
              <LayoutGrid size={14} color="#4F46E5" />
              <Text className="ml-1.5 text-[12.5px] font-semibold text-brand">
                Manage
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <View className="h-3" />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={loading && items.length > 0}
            onRefresh={load}
            tintColor="#4F46E5"
            colors={["#4F46E5"]}
          />
        }
      >
        {loading && items.length === 0 ? (
          <LoadingView message="Loading your items…" />
        ) : error ? (
          <ErrorView
            title="Couldn't load your items"
            message={error}
            detail={`API: ${apiBaseUrl}`}
            onRetry={load}
          />
        ) : items.length === 0 ? (
          <EmptyView
            icon={<Shirt size={34} color="#4F46E5" />}
            title="No items yet"
            message="Snap a photo of a garment and it will show up here, grouped by wardrobe."
            actionLabel="Add Item"
            onAction={() => router.push("/(root)/add-wardrobe-items")}
          />
        ) : visibleItems.length === 0 ? (
          <EmptyView
            icon={<Search size={34} color="#4F46E5" />}
            title="No matches"
            message="Try a different search term or clear the filters."
            actionLabel={hasFilters ? "Clear filters" : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : (
          populated.map((wardrobe) => {
            const wardrobeItems = byWardrobe.get(wardrobe.id) ?? [];

            return (
              <View key={wardrobe.id} className="mb-2">
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(root)/wardrobe/[id]",
                      params: {
                        id: String(wardrobe.id),
                        name: wardrobe.name,
                        description: wardrobe.description,
                      },
                    })
                  }
                  className="mb-2 mt-2 flex-row items-center py-1 active:opacity-70"
                >
                  <Shirt size={17} color="#4F46E5" />
                  <Text
                    numberOfLines={1}
                    className="mx-2 flex-1 text-[15px] font-bold text-ink"
                  >
                    {wardrobe.name}
                  </Text>
                  <AppPill
                    label={String(wardrobeItems.length)}
                    color="#64748B"
                  />
                  <View className="ml-1">
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                </Pressable>

                <View className="flex-row flex-wrap justify-between">
                  {wardrobeItems.map((item) => (
                    <View
                      key={item.id}
                      style={{ width: "48.5%", marginBottom: 10 }}
                    >
                      <ItemPhotoTile
                        item={item}
                        onPress={() => openItem(item)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
