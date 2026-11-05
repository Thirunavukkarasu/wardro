import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { formatInputDate, parseInputDate } from "~/lib/formatters";
import { wardroColors } from "~/src/theme/colors";

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

/**
 * Web has no native date picker module, so the field is a `YYYY-MM-DD` text
 * input. Parsing mirrors the native picker's result.
 */
export default function DateField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
}: DateFieldProps) {
  // The text stays local while typing: a partial value parses to `null`, and
  // syncing from the parent would otherwise clear the field mid-entry.
  const [text, setText] = useState(value ? formatInputDate(value) : "");

  return (
    <View className="my-2 w-full">
      <Text className="mb-1.5 text-[13.5px] font-semibold text-ink">
        {label}
      </Text>

      <View className="flex-row items-center rounded-[14px] border border-surface bg-surface px-4">
        <Calendar size={20} color={wardroColors.text.disabled} />
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            onChange(parseInputDate(next));
          }}
          placeholder={placeholder}
          placeholderTextColor={wardroColors.text.disabled}
          className="ml-3 flex-1 py-3.5 text-[14px] font-semibold text-ink"
        />
      </View>
    </View>
  );
}
