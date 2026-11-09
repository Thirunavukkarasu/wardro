import { Tabs, router, useSegments } from "expo-router";
import { Camera, MessageCircle, Shirt, Sun, User } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  wardroColors,
  wardroSizes,
} from "~/src/theme/colors";

export default function TabsLayout() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const lastSegment = segments[segments.length - 1];
  const hideFab = lastSegment === "profile" || lastSegment === "chat";
  const tabBarHeight = wardroSizes.tabBar + insets.bottom;

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: wardroColors.primaryDark,
          tabBarInactiveTintColor: wardroColors.text.disabled,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginTop: 2,
          },
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: 6 + insets.bottom,
            backgroundColor: wardroColors.surface,
            borderTopColor: wardroColors.border,
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ color }) => <Sun size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="closet"
          options={{
            title: "Closet",
            tabBarIcon: ({ color }) => <Shirt size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <MessageCircle size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
      </Tabs>

      {!hideFab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add item"
          onPress={() => router.push("/(root)/add-wardrobe-items")}
          className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-wardro-primary-dark active:opacity-80"
          style={{
            bottom: 88 + insets.bottom,
            shadowColor: wardroColors.primaryDark,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          }}
        >
          <Camera size={24} color={wardroColors.surface} />
        </Pressable>
      ) : null}
    </View>
  );
}
