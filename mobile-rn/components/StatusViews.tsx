import { CloudOff } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import CustomButton from "~/components/CustomButton";

/** Centred spinner used while a screen loads. */
export function LoadingView({ message }: { message?: string }) {
  return (
    <View className="items-center py-9">
      <ActivityIndicator size="large" color="#4F46E5" />
      {message ? (
        <Text className="mt-4 text-sm text-ink-secondary">{message}</Text>
      ) : null}
    </View>
  );
}

/** Friendly failure card with a retry action. */
export function ErrorView({
  title,
  message,
  detail,
  onRetry,
}: {
  title: string;
  message: string;
  detail?: string;
  onRetry: () => void;
}) {
  return (
    <View className="rounded-[20px] border border-danger/25 bg-danger/5 p-6">
      <View className="items-center">
        <CloudOff size={44} color="#DC2626" />
        <Text className="mt-3 text-center text-base font-bold text-ink">
          {title}
        </Text>
        <Text className="mt-1.5 text-center text-sm text-ink-secondary">
          {message}
        </Text>
        {detail ? (
          <Text className="mt-2 text-center text-[11px] text-ink-muted">
            {detail}
          </Text>
        ) : null}
        <View className="mt-4">
          <CustomButton
            title="Retry"
            onPress={onRetry}
            className="px-7"
          />
        </View>
      </View>
    </View>
  );
}

/** Empty state with an optional call to action. */
export function EmptyView({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="rounded-[24px] border border-line bg-white px-6 py-10">
      <View className="items-center">
        <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-brand/10">
          {icon}
        </View>
        <Text className="mt-4 text-center text-base font-bold text-ink">
          {title}
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-ink-secondary">
          {message}
        </Text>
        {actionLabel && onAction ? (
          <View className="mt-5">
            <CustomButton
              title={actionLabel}
              onPress={onAction}
              className="px-7"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
