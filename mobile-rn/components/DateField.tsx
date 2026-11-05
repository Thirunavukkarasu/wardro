import { Calendar, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import DateTimePicker from "react-native-date-picker";

import { formatLongDate } from "~/lib/formatters";

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

/** Date field backed by the platform date picker. */
export default function DateField({
  label,
  value,
  onChange,
  placeholder = "Select a date",
}: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="my-2 w-full">
      <Text className="mb-1.5 text-[13.5px] font-semibold text-ink">
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center rounded-[14px] border border-surface bg-surface px-4 py-3.5 active:opacity-90"
      >
        <Calendar size={20} color="#94A3B8" />
        <Text
          className={`ml-3 flex-1 text-[14px] font-semibold ${
            value ? "text-ink" : "text-ink-muted"
          }`}
        >
          {value ? formatLongDate(value) : placeholder}
        </Text>
        {value ? (
          <Pressable
            accessibilityLabel="Clear date"
            hitSlop={8}
            onPress={() => onChange(null)}
          >
            <X size={18} color="#94A3B8" />
          </Pressable>
        ) : null}
      </Pressable>

      <DateTimePicker
        modal
        mode="date"
        open={open}
        date={value ?? new Date()}
        onConfirm={(date) => {
          setOpen(false);
          onChange(date);
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
}
