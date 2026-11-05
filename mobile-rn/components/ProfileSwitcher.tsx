import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import ProfileAvatar from "~/components/ProfileAvatar";
import type { Profile } from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => void;
}

/** Horizontal profile rail used on Today. Always visible, even with one profile. */
export default function ProfileSwitcher({
  profiles,
  activeId,
  onSelect,
  onAdd,
}: ProfileSwitcherProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {profiles.map((profile) => {
        const active = profile.id === activeId;

        return (
          <Pressable
            key={profile.id}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${profile.name}`}
            onPress={() => onSelect(profile.id)}
            className="items-center active:opacity-80"
            style={{ width: 68 }}
          >
            <ProfileAvatar
              profile={profile}
              size={44}
              active={active}
            />
            <Text
              numberOfLines={1}
              className={`mt-1 max-w-[64px] text-center text-[10.5px] ${
                active
                  ? "font-bold text-brand"
                  : "font-semibold text-ink-secondary"
              }`}
            >
              {profile.name}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add profile"
        onPress={onAdd}
        className="items-center active:opacity-80"
        style={{ width: 68 }}
      >
        <View className="h-[50px] w-[50px] items-center justify-center rounded-full border border-dashed border-line bg-white">
          <Plus size={20} color={wardroColors.primaryDark} />
        </View>
        <Text className="mt-1 text-[10.5px] font-semibold text-ink-secondary">
          Add
        </Text>
      </Pressable>
    </ScrollView>
  );
}
