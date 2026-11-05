import { Eye, EyeOff } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: ReactNode;
  error?: string;
  containerStyle?: string;
  inputStyle?: string;
}

/**
 * Labelled text field matching the Flutter `AppTextField`: a compact label,
 * a soft surface-coloured field, and an optional leading icon.
 */
export default function InputField({
  label,
  icon,
  error,
  secureTextEntry = false,
  containerStyle = "",
  inputStyle = "",
  ...props
}: InputFieldProps) {
  const [obscured, setObscured] = useState(secureTextEntry);

  return (
    <View className={`my-2 w-full ${containerStyle}`}>
      <Text className="mb-1.5 text-[13.5px] font-semibold text-ink">
        {label}
      </Text>

      <View
        className={`flex-row items-center rounded-[14px] border bg-surface px-4 ${
          error ? "border-danger" : "border-surface"
        }`}
      >
        {icon ? <View className="mr-2.5">{icon}</View> : null}

        <TextInput
          className={`flex-1 py-3.5 text-[14px] font-semibold text-ink outline-none ${inputStyle}`}
          placeholderTextColor="#94A3B8"
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
              <EyeOff size={20} color="#94A3B8" />
            ) : (
              <Eye size={20} color="#94A3B8" />
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
