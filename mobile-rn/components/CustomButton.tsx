import { ActivityIndicator, Pressable, Text } from "react-native";
import type { ReactNode } from "react";

import { wardroColors } from "~/src/theme/colors";

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
  primary:
    "bg-wardro-primary-dark border border-wardro-primary-dark",
  secondary:
    "bg-wardro-text-secondary border border-wardro-text-secondary",
  danger: "bg-wardro-danger border border-wardro-danger",
  success: "bg-wardro-success border border-wardro-success",
  outline: "bg-transparent border border-wardro-border",
};

const textColors: Record<ButtonVariant, string> = {
  primary: "text-wardro-surface",
  secondary: "text-wardro-background",
  danger: "text-wardro-surface",
  success: "text-wardro-surface",
  outline: "text-wardro-text-primary",
};

const spinnerColors: Record<ButtonVariant, string> = {
  primary: wardroColors.surface,
  secondary: wardroColors.background,
  danger: wardroColors.surface,
  success: wardroColors.surface,
  outline: wardroColors.text.primary,
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
      className={`w-full flex-row items-center justify-center rounded-button px-4 py-3.5 active:opacity-80 ${
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
            className={`text-center text-body font-semibold ${textColors[variant]} ${
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
