import { router, useFocusEffect } from "expo-router";
import { LayoutGrid, Plus } from "lucide-react-native";
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
import { EmptyView, ErrorView, LoadingView } from "~/components/StatusViews";
import SummaryStrip from "~/components/SummaryStrip";
import WardrobeCard from "~/components/WardrobeCard";
import { api, ApiException } from "~/lib/api";
import { apiBaseUrl } from "~/lib/firebase-config";
import { useProfiles } from "~/lib/profiles-context";
import { wardrobeFromJson, type Wardrobe } from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

export default function WardrobesScreen() {
  const { activeProfile } = useProfiles();
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await api.get<Record<string, unknown>[]>(
        "/wardrobes/summary",
      );
      setWardrobes((rows ?? []).map(wardrobeFromJson));
    } catch (loadError) {
      setError(
        loadError instanceof ApiException
          ? loadError.message
          : "Could not load your wardrobes.",
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

  const totalItems = wardrobes.reduce(
    (sum, wardrobe) => sum + wardrobe.itemCount,
    0,
  );
  const totalValue = wardrobes.reduce(
    (sum, wardrobe) => sum + wardrobe.totalValue,
    0,
  );

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-canvas"
    >
      <AppHeader
        title="Wardrobes"
        subtitle={`${activeProfile?.name ?? "Profile"} · ${wardrobes.length} ${
          wardrobes.length === 1 ? "collection" : "collections"
        }`}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add wardrobe"
            hitSlop={8}
            onPress={() => router.push("/(root)/add-wardrobe")}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-surface"
          >
            <Plus size={22} color={wardroColors.text.primary} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={loading && wardrobes.length > 0}
            onRefresh={load}
            tintColor={wardroColors.primaryDark}
            colors={[wardroColors.primaryDark]}
          />
        }
      >
        <View className="mt-4">
          <SummaryStrip
            wardrobes={wardrobes.length}
            items={totalItems}
            value={totalValue}
            loading={loading && wardrobes.length === 0}
          />
        </View>

        <View className="mb-2.5 mt-5">
          <Text className="text-[15px] font-semibold text-ink">
            Your collections
          </Text>
        </View>

        {loading && wardrobes.length === 0 ? (
          <LoadingView message="Loading your wardrobes…" />
        ) : error ? (
          <ErrorView
            title="Couldn't load your wardrobes"
            message={error}
            detail={`API: ${apiBaseUrl}`}
            onRetry={load}
          />
        ) : wardrobes.length === 0 ? (
          <EmptyView
            icon={<LayoutGrid size={34} color={wardroColors.primaryDark} />}
            title="No wardrobes yet"
            message="Create a collection for workwear, weekends, or anything else you organise your wardrobe by."
            actionLabel="Add Wardrobe"
            onAction={() => router.push("/(root)/add-wardrobe")}
          />
        ) : (
          wardrobes.map((wardrobe) => (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
