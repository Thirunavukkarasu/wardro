import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ProfileScreen() {
  const router = useRouter();

  // Mock user data
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    address: "123 Main St, Anytown, USA",
    memberSince: "January 2023",
    avatarUrl: "https://via.placeholder.com/150",
    status: "Active",
  };

  const handleLogout = () => {
    // Perform logout logic here (e.g., clearing tokens)
    router.replace("/login");
  };

  return (
    <View className="flex-1 p-5 bg-gray-100">
      {/* User Info Section */}
      <View className="bg-white p-4 flex-row items-center space-x-4">
        <Image
          source={{ uri: user.avatarUrl }}
          className="w-16 h-16 rounded-full"
        />
        <View>
          <Text className="text-lg font-bold">{user.name}</Text>
          <Text className="text-sm text-gray-500">{user.status}</Text>
        </View>
      </View>
      {/* <View className="bg-white p-5 rounded-lg shadow-md">
        <Text className="text-xl font-bold mb-3">Profile</Text>
        <Text className="text-base mb-2">
          <Text className="font-semibold">Name:</Text> {user.name}
        </Text>
        <Text className="text-base mb-2">
          <Text className="font-semibold">Email:</Text> {user.email}
        </Text>
        <Text className="text-base mb-2">
          <Text className="font-semibold">Phone:</Text> {user.phone}
        </Text>
        <Text className="text-base mb-2">
          <Text className="font-semibold">Address:</Text> {user.address}
        </Text>
        <Text className="text-base mb-2">
          <Text className="font-semibold">Member Since:</Text>{" "}
          {user.memberSince}
        </Text>
      </View> */}

      {/* <View className="mt-6">
        <Button title="Logout" color="red" onPress={handleLogout} />
      </View> */}
      {/* Settings Options */}
      <View className="mt-4">
        {/* Account */}
        <TouchableOpacity
          className="bg-white p-4 flex-row items-center space-x-4"
          onPress={() => router.push("/login")}
        >
          <Ionicons name="person-outline" size={24} color="black" />
          <Text className="text-base">Account</Text>
        </TouchableOpacity>
        <View className="border-b border-gray-200" />

        {/* Privacy */}
        <TouchableOpacity
          className="bg-white p-4 flex-row items-center space-x-4"
          onPress={() => router.push("/login")}
        >
          <Ionicons name="lock-closed-outline" size={24} color="black" />
          <Text className="text-base">Privacy</Text>
        </TouchableOpacity>
        <View className="border-b border-gray-200" />

        {/* Notifications */}
        <TouchableOpacity
          className="bg-white p-4 flex-row items-center space-x-4"
          onPress={() => router.push("/login")}
        >
          <Ionicons name="notifications-outline" size={24} color="black" />
          <Text className="text-base">Notifications</Text>
        </TouchableOpacity>
        <View className="border-b border-gray-200" />

        {/* Logout */}
        <TouchableOpacity
          className="bg-white p-4 flex-row items-center space-x-4"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="red" />
          <Text className="text-base text-red-600">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
