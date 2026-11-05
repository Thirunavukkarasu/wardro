import { Image, Text, View } from "react-native";

import { initialsForName, type Profile } from "~/lib/types";
import {
  legacyIndigoProfileColor,
  wardroColors,
} from "~/src/theme/colors";

interface ProfileAvatarProps {
  profile: Pick<Profile, "name" | "color" | "avatarUrl">;
  size?: number;
  active?: boolean;
}

/** Initials or photo avatar with an optional active ring. */
export default function ProfileAvatar({
  profile,
  size = 44,
  active = false,
}: ProfileAvatarProps) {
  // The original default profile colour was indigo; normalize it to the new
  // brand olive without rewriting the stored user preference.
  const baseColor = profile.color || wardroColors.primaryDark;
  const avatarColor =
    baseColor.toLowerCase() === legacyIndigoProfileColor
      ? wardroColors.primaryDark
      : baseColor;

  return (
    <View
      className={`items-center justify-center rounded-full border-2 ${
        active ? "border-wardro-primary" : "border-transparent"
      }`}
      style={{ width: size + 6, height: size + 6 }}
    >
      <View
        className="items-center justify-center overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: avatarColor,
        }}
      >
        {profile.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Text
            className="font-extrabold text-wardro-surface"
            style={{ fontSize: size * 0.36 }}
          >
            {initialsForName(profile.name)}
          </Text>
        )}
      </View>
    </View>
  );
}
