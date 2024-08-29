import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  // Mock user data
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    address: "123 Main St, Anytown, USA",
    memberSince: "January 2023",
  };

  const handleLogout = () => {
    // Perform logout logic here (e.g., clearing tokens)
    router.replace("/signin");
  };

  return (
    <View className="flex-1 p-5 bg-gray-100">
      <View className="bg-white p-5 rounded-lg shadow-md">
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
      </View>

      <View className="mt-6">
        <Button title="Logout" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}
