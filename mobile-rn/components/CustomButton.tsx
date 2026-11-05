import { ActivityIndicator, Pressable, Text } from "react-native";
import type { ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "outline";

interface CustomButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
}

const backgrounds: Record<ButtonVariant, string> = {
  primary: "bg-brand border border-brand",
  secondary: "bg-[#6B7280] border border-[#6B7280]",
  danger: "bg-danger border border-danger",
  success: "bg-success border border-success",
  outline: "bg-transparent border border-line",
};

const textColors: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-gray-100",
  danger: "text-red-100",
  success: "text-green-100",
  outline: "text-ink",
};

const spinnerColors: Record<ButtonVariant, string> = {
  primary: "#FFFFFF",
  secondary: "#F3F4F6",
  danger: "#FEE2E2",
  success: "#DCFCE7",
  outline: "#0F172A",
};

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  iconLeft,
  iconRight,
  className = "",
}: CustomButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      className={`w-full flex-row items-center justify-center rounded-[14px] px-4 py-3.5 active:opacity-80 ${
        backgrounds[variant]
      } ${isDisabled && !isLoading ? "opacity-60" : "opacity-100"} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={spinnerColors[variant]} />
      ) : (
        <>
          {iconLeft ? <>{iconLeft}</> : null}
          <Text
            numberOfLines={1}
            className={`text-center text-[15.5px] font-bold ${textColors[variant]} ${
              iconLeft ? "ml-2" : ""
            }`}
          >
            {title}
          </Text>
          {iconRight ? <>{iconRight}</> : null}
        </>
      )}
    </Pressable>
  );
}
