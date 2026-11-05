import { Tabs, router, useSegments } from "expo-router";
import { Camera, Home, LayoutGrid, Shirt, User } from "lucide-react-native";
import { Pressable, View } from "react-native";

export default function TabsLayout() {
  const segments = useSegments();
  const onProfile = segments[segments.length - 1] === "profile";

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#4F46E5",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginTop: 2,
          },
          tabBarStyle: {
            height: 66,
            paddingTop: 6,
            paddingBottom: 6,
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E7E8EF",
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wardrobes"
          options={{
            title: "Wardrobes",
            tabBarIcon: ({ color }) => (
              <LayoutGrid size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="items"
          options={{
            title: "Items",
            tabBarIcon: ({ color }) => <Shirt size={22} color={color} />,
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

      {!onProfile ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add item"
          onPress={() => router.push("/(root)/add-wardrobe-items")}
          className="absolute bottom-[88px] right-5 h-14 w-14 items-center justify-center rounded-full bg-brand active:opacity-80"
          style={{
            shadowColor: "#4F46E5",
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          }}
        >
          <Camera size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}
