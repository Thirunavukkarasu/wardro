import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { wardroColors } from "~/src/theme/colors";

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  allowCustom?: boolean;
}

/**
 * Dropdown field for values that repeat across items (category, colour, size).
 * The options panel also accepts a custom value so the database can grow
 * without a schema change.
 */
export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  icon,
  allowCustom = true,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const visibleOptions =
    value && !options.includes(value) ? [value, ...options] : options;

  const chooseCustom = () => {
    const next = custom.trim();
    if (!next) return;
    onChange(next);
    setCustom("");
    setOpen(false);
  };

  return (
    <View className="my-2 w-full">
      <Text className="mb-1.5 text-[13.5px] font-semibold text-ink">
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        onPress={() => setOpen((current) => !current)}
        className="flex-row items-center rounded-[14px] border border-surface bg-surface px-4 py-3.5 active:opacity-90"
      >
        {icon ? <View className="mr-2.5">{icon}</View> : null}
        <Text
          numberOfLines={1}
          className={`flex-1 text-[14px] font-semibold ${
            value ? "text-ink" : "text-ink-secondary"
          }`}
        >
          {value || placeholder}
        </Text>
        {open ? (
          <ChevronUp size={18} color={wardroColors.text.secondary} />
        ) : (
          <ChevronDown size={18} color={wardroColors.text.secondary} />
        )}
      </Pressable>

      {open ? (
        <View className="mt-2 overflow-hidden rounded-[14px] border border-line bg-white">
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
            {visibleOptions.map((option) => {
              const selected = option === value;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="flex-row items-center px-4 py-3 active:bg-surface"
                >
                  <Text className="flex-1 text-[14px] font-medium text-ink">
                    {option}
                  </Text>
                  {selected ? (
                    <Check size={16} color={wardroColors.success} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {allowCustom ? (
            <View className="border-t border-line p-3">
              <Text className="mb-1.5 text-[11px] font-medium text-ink-secondary">
                Or type a custom value
              </Text>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                onSubmitEditing={chooseCustom}
                placeholder="Custom value"
                placeholderTextColor={wardroColors.text.disabled}
                className="rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-ink"
              />
              <Pressable
                onPress={chooseCustom}
                className="mt-2 self-end rounded-full bg-brand px-3 py-1.5 active:opacity-80"
              >
                <Text className="text-[12px] font-semibold text-white">
                  Use this value
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
