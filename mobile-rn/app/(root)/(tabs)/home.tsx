import { router, useFocusEffect } from "expo-router";
import {
  Camera,
  ChevronRight,
  LayoutGrid,
  Shirt,
} from "lucide-react-native";
import { useCallback, useState, type ReactNode } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ItemPhotoTile from "~/components/ItemPhotoTile";
import { EmptyView, ErrorView, LoadingView } from "~/components/StatusViews";
import SummaryStrip from "~/components/SummaryStrip";
import WardrobeCard from "~/components/WardrobeCard";
import { api, ApiException } from "~/lib/api";
import { useAuth } from "~/lib/auth-context";
import { apiBaseUrl } from "~/lib/firebase-config";
import {
  wardrobeFromJson,
  wardrobeItemFromJson,
  type Wardrobe,
  type WardrobeItem,
} from "~/lib/types";

function greeting(name: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return name ? `Good ${part}, ${name}` : `Good ${part}`;
}

function QuickAction({
  icon,
  label,
  caption,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center rounded-[18px] border border-line bg-white p-3.5 active:opacity-90"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10">
        {icon}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[14px] font-bold text-ink">{label}</Text>
        <Text numberOfLines={1} className="mt-0.5 text-[11px] text-ink-secondary">
          {caption}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          : "Could not load your wardrobe.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totalItems = wardrobes.reduce(
    (sum, wardrobe) => sum + wardrobe.itemCount,
    0,
  );
  const totalValue = wardrobes.reduce(
    (sum, wardrobe) => sum + wardrobe.totalValue,
    0,
  );

  const recentItems = [...items]
    .sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    )
    .slice(0, 6);

  const wardrobePreview = wardrobes.slice(0, 3);
  const initialLoading = loading && wardrobes.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={loading && wardrobes.length > 0}
            onRefresh={load}
            tintColor="#4F46E5"
            colors={["#4F46E5"]}
          />
        }
      >
        <View className="pt-3.5">
          <Text className="text-[13px] font-semibold text-ink-secondary">
            {greeting(user?.firstName ?? "")}
          </Text>
          <Text className="mt-0.5 text-[26px] font-extrabold tracking-tight text-ink">
            Your Wardrobe
          </Text>
        </View>

        <View className="mt-4">
          <SummaryStrip
            wardrobes={wardrobes.length}
            items={totalItems}
            value={totalValue}
            loading={initialLoading}
          />
        </View>

        <View className="mt-4 flex-row gap-3">
          <QuickAction
            icon={<Camera size={20} color="#4F46E5" />}
            label="Add item"
            caption="Snap a garment"
            onPress={() => router.push("/(root)/add-wardrobe-items")}
          />
          <QuickAction
            icon={<LayoutGrid size={20} color="#4F46E5" />}
            label="New wardrobe"
            caption="Create a collection"
            onPress={() => router.push("/(root)/add-wardrobe")}
          />
        </View>

        {error ? (
          <View className="mt-5">
            <ErrorView
              title="Couldn't load your wardrobe"
              message={error}
              detail={`API: ${apiBaseUrl}`}
              onRetry={load}
            />
          </View>
        ) : initialLoading ? (
          <LoadingView message="Loading your wardrobe…" />
        ) : (
          <>
            <View className="mb-2.5 mt-6 flex-row items-center">
              <Text className="text-[15px] font-semibold text-ink">
                Recent items
              </Text>
              <View className="flex-1" />
              {items.length > 0 ? (
                <Pressable
                  onPress={() => router.push("/(root)/(tabs)/items")}
                  className="flex-row items-center active:opacity-60"
                >
                  <Text className="text-xs font-semibold text-brand">
                    See all
                  </Text>
                  <ChevronRight size={14} color="#4F46E5" />
                </Pressable>
              ) : null}
            </View>

            {recentItems.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {recentItems.map((item) => (
                  <View key={item.id} style={{ width: 136 }}>
                    <ItemPhotoTile
                      item={item}
                      onPress={() =>
                        router.push({
                          pathname: "/(root)/item/[id]",
                          params: {
                            id: String(item.id),
                            item: JSON.stringify(item),
                          },
                        })
                      }
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="rounded-[18px] border border-line bg-white p-4">
                <Text className="text-[14px] font-bold text-ink">
                  No items yet
                </Text>
                <Text className="mt-1 text-[12.5px] leading-5 text-ink-secondary">
                  Photograph your first garment and it will show up here.
                </Text>
                <Pressable
                  onPress={() => router.push("/(root)/add-wardrobe-items")}
                  className="mt-3 self-start rounded-full bg-brand px-4 py-2 active:opacity-80"
                >
                  <Text className="text-xs font-bold text-white">Add Item</Text>
                </Pressable>
              </View>
            )}

            <View className="mb-2.5 mt-6 flex-row items-center">
              <Text className="text-[15px] font-semibold text-ink">
                Wardrobes
              </Text>
              <View className="flex-1" />
              {wardrobes.length > wardrobePreview.length ? (
                <Pressable
                  onPress={() => router.push("/(root)/(tabs)/wardrobes")}
                  className="flex-row items-center active:opacity-60"
                >
                  <Text className="text-xs font-semibold text-brand">
                    See all
                  </Text>
                  <ChevronRight size={14} color="#4F46E5" />
                </Pressable>
              ) : null}
            </View>

            {wardrobePreview.length > 0 ? (
              wardrobePreview.map((wardrobe) => (
                <WardrobeCard
                  key={wardrobe.id}
                  wardrobe={wardrobe}
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
                />
              ))
            ) : (
              <EmptyView
                icon={<Shirt size={34} color="#4F46E5" />}
                title="No wardrobes yet"
                message="Create your first wardrobe to start organising your clothes."
                actionLabel="Add Wardrobe"
                onAction={() => router.push("/(root)/add-wardrobe")}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
