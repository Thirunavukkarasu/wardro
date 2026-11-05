import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Palette,
  Pencil,
  Ruler,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react-native";
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import AppPill from "~/components/AppPill";
import ConfirmDialog from "~/components/ConfirmDialog";
import ItemPhoto from "~/components/ItemPhoto";
import { LoadingView } from "~/components/StatusViews";
import { api, ApiException } from "~/lib/api";
import {
  formatPrice,
  formatShortDate,
  stateColor,
  stateLabel,
} from "~/lib/formatters";
import {
  wardrobeItemFromJson,
  type WardrobeItem,
} from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

function RoundIconButton({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-80"
      style={{
        shadowColor: wardroColors.text.primary,
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {icon}
    </Pressable>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center py-2.5">
      {icon}
      <Text className="ml-3 text-[13px] text-ink-secondary">{label}</Text>
      <View className="flex-1" />
      <Text
        numberOfLines={1}
        className="ml-3 max-w-[55%] text-right text-[13.5px] font-semibold text-ink"
      >
        {value}
      </Text>
    </View>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mt-4 rounded-[24px] border border-line bg-white px-5 pb-2 pt-[18px]">
      <Text className="text-[11px] font-bold tracking-[1.4px] text-ink-muted">
        {title}
      </Text>
      <View className="mt-1.5">{children}</View>
    </View>
  );
}

export default function ItemDetailScreen() {
  const params = useLocalSearchParams<{ id: string; item?: string }>();
  const insets = useSafeAreaInsets();

  const initialItem = useMemo(() => {
    if (!params.item) return null;
    try {
      return wardrobeItemFromJson(
        JSON.parse(params.item) as Record<string, unknown>,
      );
    } catch {
      return null;
    }
  }, [params.item]);

  const [item, setItem] = useState<WardrobeItem | null>(initialItem);
  const [loading, setLoading] = useState(!initialItem);
  const [error, setError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await api.get<Record<string, unknown>[]>("/wardrobeItems");
      const found = (rows ?? [])
        .map(wardrobeItemFromJson)
        .find((row) => row.id === Number(params.id));

      if (found) {
        setItem(found);
        setError(null);
      } else if (!initialItem) {
        setError("This item could not be found.");
      }
    } catch (loadError) {
      if (!initialItem) {
        setError(
          loadError instanceof ApiException
            ? loadError.message
            : "Could not load this item.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [initialItem, params.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEdit = () => {
    if (!item) return;
    router.push({
      pathname: "/(root)/add-wardrobe-items",
      params: { id: String(item.id), item: JSON.stringify(item) },
    });
  };

  const deleteItem = async () => {
    if (!item) return;
    setDeleting(true);

    try {
      await api.delete(`/wardrobeItems/${item.id}`);
      setConfirmVisible(false);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(root)/(tabs)/closet");
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiException
          ? deleteError.message
          : "Could not delete the item.",
      );
      setConfirmVisible(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <LoadingView message="Loading item…" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <Text className="text-center text-base font-semibold text-ink">
          {error ?? "This item could not be found."}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-full bg-brand px-6 py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const subtitle = [item.brand, item.category].filter(Boolean).join(" · ");
  const details: Array<{ icon: ReactNode; label: string; value: string }> = [
    item.brand && {
      icon: <Store size={20} color={wardroColors.text.disabled} />,
      label: "Brand",
      value: item.brand,
    },
    item.category && {
      icon: <Tag size={20} color={wardroColors.text.disabled} />,
      label: "Category",
      value: item.category,
    },
    item.size && {
      icon: <Ruler size={20} color={wardroColors.text.disabled} />,
      label: "Size",
      value: item.size,
    },
    item.color && {
      icon: <Palette size={20} color={wardroColors.text.disabled} />,
      label: "Colour",
      value: item.color,
    },
    item.price !== null && {
      icon: <Wallet size={20} color={wardroColors.text.disabled} />,
      label: "Price",
      value: formatPrice(item.price),
    },
  ].filter(Boolean) as Array<{
    icon: ReactNode;
    label: string;
    value: string;
  }>;

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="h-[380px] w-full overflow-hidden bg-surface">
          <ItemPhoto item={item} resizeMode="contain" large />

          <View
            pointerEvents="none"
            className="absolute bottom-0 left-0 right-0 h-44"
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={wardroColors.text.primary}
                    stopOpacity="0"
                  />
                  <Stop
                    offset="1"
                    stopColor={wardroColors.text.primary}
                    stopOpacity="0.82"
                  />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroFade)" />
            </Svg>
          </View>

          <View
            className="absolute left-4 flex-row items-center gap-3"
            style={{ top: insets.top + 8 }}
          >
            <RoundIconButton
              icon={<ArrowLeft size={22} color={wardroColors.text.primary} />}
              label="Go back"
              onPress={() => router.back()}
            />
          </View>

          <View
            className="absolute right-4 flex-row items-center gap-3"
            style={{ top: insets.top + 8 }}
          >
            <RoundIconButton
              icon={<Pencil size={21} color={wardroColors.text.primary} />}
              label="Edit item"
              onPress={openEdit}
            />
            <RoundIconButton
              icon={<Trash2 size={22} color={wardroColors.text.primary} />}
              label="Delete item"
              onPress={() => setConfirmVisible(true)}
            />
          </View>

          <View className="absolute bottom-6 left-5 right-5">
            <Text
              numberOfLines={2}
              className="text-[24px] font-extrabold leading-7 text-white"
            >
              {item.itemName}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                className="mt-1.5 text-[13px] font-semibold text-white/90"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="px-5 pt-5">
          <View className="flex-row flex-wrap gap-2">
            <AppPill
              label={stateLabel(item.state)}
              color={stateColor(item.state)}
              filled
            />
            {item.category ? <AppPill label={item.category} /> : null}
            {item.size ? <AppPill label={`Size ${item.size}`} /> : null}
            {item.color ? (
              <AppPill label={item.color} color={wardroColors.text.secondary} />
            ) : null}
          </View>

          {details.length > 0 ? (
            <InfoCard title="DETAILS">
              {details.map((detail) => (
                <DetailRow
                  key={detail.label}
                  icon={detail.icon}
                  label={detail.label}
                  value={detail.value}
                />
              ))}
            </InfoCard>
          ) : null}

          {details.length === 0 ? (
            <InfoCard title="DETAILS">
              <Text className="py-2 text-[13px] leading-5 text-ink-secondary">
                No extra details yet. Brand, category, size, colour and price
                will appear here when you add them.
              </Text>
            </InfoCard>
          ) : null}

          {item.purchaseDate || item.expiryDate ? (
            <InfoCard title="DATES">
              {item.purchaseDate ? (
                <DetailRow
                  icon={<ShoppingBag size={20} color={wardroColors.text.disabled} />}
                  label="Bought"
                  value={formatShortDate(item.purchaseDate)}
                />
              ) : null}
              {item.expiryDate ? (
                <DetailRow
                  icon={<CalendarClock size={20} color={wardroColors.text.disabled} />}
                  label="Expires"
                  value={formatShortDate(item.expiryDate)}
                />
              ) : null}
            </InfoCard>
          ) : null}

          {item.createdAt ? (
            <InfoCard title="ADDED">
              <DetailRow
                icon={<Calendar size={20} color={wardroColors.text.disabled} />}
                label="Added to Wardro"
                value={formatShortDate(item.createdAt)}
              />
            </InfoCard>
          ) : null}

          {error ? (
            <Text className="mt-4 text-sm text-danger">{error}</Text>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete item?"
        message={`"${item.itemName}" and its photo will be removed permanently.`}
        busy={deleting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={deleteItem}
      />
    </View>
  );
}
