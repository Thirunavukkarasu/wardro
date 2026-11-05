import { router } from "expo-router";
import { LogOut } from "lucide-react-native";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "~/components/CustomButton";
import { useAuth } from "~/lib/auth-context";
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
