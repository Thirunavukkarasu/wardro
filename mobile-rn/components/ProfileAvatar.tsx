import { Image, Text, View } from "react-native";

import { initialsForName, type Profile } from "~/lib/types";

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
  return (
    <View
      className={`items-center justify-center rounded-full border-2 ${
        active ? "border-brand" : "border-transparent"
      }`}
      style={{ width: size + 6, height: size + 6 }}
    >
      <View
        className="items-center justify-center overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: profile.color,
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
            className="font-extrabold text-white"
            style={{ fontSize: size * 0.36 }}
          >
            {initialsForName(profile.name)}
          </Text>
        )}
      </View>
    </View>
  );
}
