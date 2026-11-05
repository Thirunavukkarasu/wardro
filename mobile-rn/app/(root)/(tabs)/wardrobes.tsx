import { router, useFocusEffect } from "expo-router";
import { LayoutGrid, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CircleAction from "~/components/CircleAction";
import { EmptyView, ErrorView, LoadingView } from "~/components/StatusViews";
import SummaryStrip from "~/components/SummaryStrip";
import WardrobeCard from "~/components/WardrobeCard";
import { api, ApiException } from "~/lib/api";
import { apiBaseUrl } from "~/lib/firebase-config";
import { formatPrice } from "~/lib/formatters";
import { wardrobeFromJson, type Wardrobe } from "~/lib/types";

export default function WardrobesScreen() {
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
        <View className="flex-row items-start pt-3.5">
          <View className="flex-1">
            <Text className="text-[26px] font-extrabold tracking-tight text-ink">
              Wardrobes
            </Text>
            {!loading && !error ? (
              <Text className="mt-1 text-xs text-ink-secondary">
                {wardrobes.length}{" "}
                {wardrobes.length === 1 ? "collection" : "collections"} ·{" "}
                {formatPrice(totalValue)}
              </Text>
            ) : null}
          </View>

          <CircleAction
            icon={<Plus size={26} color="#FFFFFF" />}
            accessibilityLabel="Add wardrobe"
            onPress={() => router.push("/(root)/add-wardrobe")}
          />
        </View>

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
            icon={<LayoutGrid size={34} color="#4F46E5" />}
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
