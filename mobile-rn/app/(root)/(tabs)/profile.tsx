import { router, useFocusEffect } from "expo-router";
import { LogOut, Pencil, Plus } from "lucide-react-native";
import { useCallback } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "~/components/CustomButton";
import ProfileAvatar from "~/components/ProfileAvatar";
import { useAuth } from "~/lib/auth-context";
import { useProfiles } from "~/lib/profiles-context";
import { fullName, userInitials } from "~/lib/types";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-center py-[11px]">
      <Text className="text-[13px] text-ink-secondary">{label}</Text>
      <View className="flex-1" />
      <Text
        numberOfLines={1}
        className="ml-4 max-w-[65%] text-right text-[13.5px] font-semibold text-ink"
      >
        {value && value.trim() ? value : "Not set"}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const {
    profiles,
    activeProfile,
    switchProfile,
    refreshProfiles,
    error: profilesError,
  } = useProfiles();

  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles]),
  );

  const name = fullName(user) || "Wardro member";

  const logOut = async () => {
    await signOut();
    router.replace("/(auth)/welcome");
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        <Text className="pt-3.5 text-[26px] font-extrabold tracking-tight text-ink">
          Profile
        </Text>

        <View
          className="mt-3.5 flex-row items-center rounded-[22px] bg-brand p-[18px]"
          style={{
            shadowColor: "#4F46E5",
            shadowOpacity: 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <View className="h-[58px] w-[58px] overflow-hidden rounded-full bg-white">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                resizeMode="cover"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Text className="text-[21px] font-extrabold text-brand">
                  {userInitials(user)}
                </Text>
              </View>
            )}
          </View>

          <View className="ml-3.5 flex-1">
            <Text
              numberOfLines={1}
              className="text-[18px] font-extrabold text-white"
            >
              {name}
            </Text>
            <Text
              numberOfLines={1}
              className="mt-0.5 text-[12.5px] text-white/80"
            >
              {user?.email || "Not signed in"}
            </Text>
            <View className="mt-2 self-start rounded-full bg-white/20 px-2.5 py-1">
              <Text className="text-[10.5px] font-semibold text-white">
                Firebase account
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-2 mt-5 flex-row items-center">
          <Text className="flex-1 text-[15px] font-semibold text-ink">
            Profiles
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add profile"
            onPress={() => router.push("/(root)/add-profile")}
            className="flex-row items-center rounded-full bg-brand/10 px-3 py-1.5 active:opacity-70"
          >
            <Plus size={14} color="#4F46E5" />
            <Text className="ml-1 text-xs font-bold text-brand">Add</Text>
          </Pressable>
        </View>

        <View className="rounded-[18px] border border-line bg-white">
          {profiles.map((profile, index) => (
            <View key={profile.id}>
              {index > 0 ? <View className="ml-16 h-px bg-line" /> : null}
              <View className="flex-row items-center px-4 py-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${profile.name}`}
                  onPress={() => {
                    switchProfile(profile.id);
                  }}
                  className="flex-1 flex-row items-center active:opacity-70"
                >
                  <ProfileAvatar
                    profile={profile}
                    size={40}
                    active={profile.id === activeProfile?.id}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-sm font-bold text-ink"
                    >
                      {profile.name}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-ink-secondary">
                      {profile.wardrobeCount}{" "}
                      {profile.wardrobeCount === 1
                        ? "collection"
                        : "collections"}{" "}
                      · {profile.itemCount}{" "}
                      {profile.itemCount === 1 ? "item" : "items"}
                      {profile.id === activeProfile?.id ? " · Active" : ""}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${profile.name}`}
                  onPress={() =>
                    router.push({
                      pathname: "/(root)/add-profile",
                      params: {
                        id: String(profile.id),
                        name: profile.name,
                        color: profile.color,
                      },
                    })
                  }
                  className="h-10 w-10 items-center justify-center rounded-full active:bg-surface"
                >
                  <Pencil size={17} color="#64748B" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {profilesError ? (
          <Text className="mt-2 text-xs text-danger">{profilesError}</Text>
        ) : null}

        <View className="mt-4 rounded-[18px] border border-line bg-white px-4">
          <InfoRow label="First name" value={user?.firstName} />
          <View className="h-px bg-line" />
          <InfoRow label="Last name" value={user?.lastName} />
          <View className="h-px bg-line" />
          <InfoRow label="Email" value={user?.email} />
          <View className="h-px bg-line" />
          <InfoRow label="Phone" value={user?.phone} />
        </View>

        <View className="mt-4">
          <CustomButton
            title="Log out"
            variant="danger"
            onPress={logOut}
            iconLeft={<LogOut size={18} color="#FEE2E2" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
