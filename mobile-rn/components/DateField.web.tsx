import { Calendar } from "lucide-react-native";
import { createElement, type ChangeEvent, type CSSProperties } from "react";
import { Text, View } from "react-native";

import { formatInputDate, parseInputDate } from "~/lib/formatters";
import { wardroColors } from "~/src/theme/colors";

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

/**
 * Web date field backed by the browser's native date picker. `DateField.tsx`
 * is used on native and opens the platform modal picker.
 */
export default function DateField({
  label,
  value,
  onChange,
}: DateFieldProps) {
  const inputStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    paddingTop: 14,
    paddingBottom: 14,
    border: "none",
    outline: "none",
    background: "transparent",
    color: value ? wardroColors.text.primary : wardroColors.text.secondary,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    colorScheme: "light",
  };

  return (
    <View className="my-2 w-full">
      <Text className="mb-1.5 text-[13.5px] font-semibold text-ink">
        {label}
      </Text>

      <View className="flex-row items-center rounded-[14px] border border-surface bg-surface px-4">
        <Calendar size={20} color={wardroColors.text.disabled} />
        {createElement("input", {
          type: "date",
          value: value ? formatInputDate(value) : "",
          "aria-label": label,
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            onChange(parseInputDate(event.currentTarget.value));
          },
          style: inputStyle,
        })}
      </View>
    </View>
  );
}
