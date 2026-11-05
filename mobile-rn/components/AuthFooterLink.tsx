import { Pressable, Text, View } from "react-native";

interface AuthFooterLinkProps {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
}

export default function AuthFooterLink({
  prompt,
  actionLabel,
  onPress,
}: AuthFooterLinkProps) {
  return (
    <View className="mt-8 flex-row items-center justify-center pb-4">
      <Text className="text-[13.5px] text-ink-secondary">{prompt}</Text>
      <Pressable onPress={onPress} hitSlop={8} className="ml-1">
        <Text className="text-[13.5px] font-semibold text-brand">
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}
