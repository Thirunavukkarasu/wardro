import { Text, View } from "react-native";

import { formatPrice } from "~/lib/formatters";
import { wardroColors } from "~/src/theme/colors";

interface SummaryStripProps {
  wardrobes: number;
  items: number;
  value: number;
  loading: boolean;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[10px] font-bold tracking-[0.9px] text-ink-muted">
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className="mt-1 text-[17px] font-extrabold tracking-tight text-ink"
      >
        {value}
      </Text>
    </View>
  );
}

/** Compact wardrobe · items · value summary shown on the home tab. */
export default function SummaryStrip({
  wardrobes,
  items,
  value,
  loading,
}: SummaryStripProps) {
  return (
    <View
      className="flex-row items-center rounded-[18px] border border-line bg-white px-2 py-3.5"
      style={{
        shadowColor: wardroColors.text.primary,
        shadowOpacity: 0.04,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      <Metric label="WARDROBES" value={loading ? "–" : String(wardrobes)} />
      <View className="h-7 w-px bg-line" />
      <Metric label="ITEMS" value={loading ? "–" : String(items)} />
      <View className="h-7 w-px bg-line" />
      <Metric label="VALUE" value={loading ? "–" : formatPrice(value)} />
    </View>
  );
}
