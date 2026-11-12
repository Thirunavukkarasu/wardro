import { Eye, EyeOff } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { wardroColors } from "~/src/theme/colors";

interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: ReactNode;
  error?: string;
  /** `surface` sits on a card; `outline` reads as a card itself (auth screens). */
  variant?: "surface" | "outline";
  containerStyle?: string;
  inputStyle?: string;
}

/**
 * Labelled text field matching the Flutter `AppTextField`: a compact label,
 * a soft field, and an optional leading icon.
 */
export default function InputField({
  label,
  icon,
  error,
  variant = "surface",
  secureTextEntry = false,
  containerStyle = "",
  inputStyle = "",
  ...props
}: InputFieldProps) {
  const [obscured, setObscured] = useState(secureTextEntry);

  const fieldTone =
    variant === "outline"
      ? "border-line bg-white"
      : "border-surface bg-surface";

  return (
    <View className={`my-2 w-full ${containerStyle}`}>
      <Text className="mb-1.5 text-[14px] font-semibold text-ink">
        {label}
      </Text>

      <View
        className={`flex-row items-center rounded-[14px] border px-4 ${
          error ? "border-danger bg-white" : fieldTone
        }`}
      >
        {icon ? <View className="mr-2.5">{icon}</View> : null}

        <TextInput
          className={`flex-1 py-3.5 text-[14px] font-semibold text-ink outline-none ${inputStyle}`}
          placeholderTextColor={wardroColors.text.disabled}
          secureTextEntry={obscured}
          {...props}
        />

        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={obscured ? "Show password" : "Hide password"}
            hitSlop={8}
            onPress={() => setObscured((current) => !current)}
          >
            {obscured ? (
              <EyeOff size={20} color={wardroColors.text.disabled} />
            ) : (
              <Eye size={20} color={wardroColors.text.disabled} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1.5 text-xs font-medium text-danger">{error}</Text>
      ) : null}
    </View>
  );
}
