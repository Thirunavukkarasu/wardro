import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { Card, CardTitle } from "~/components/ui/card";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "~/components/CustomButton";

const kids = [
  { id: "1", name: "Red T-shirt", imageUrl: "https://via.placeholder.com/150" },
  { id: "2", name: "Blue Jeans", imageUrl: "https://via.placeholder.com/150" },
  {
    id: "3",
    name: "Yellow Hoodie",
    imageUrl: "https://via.placeholder.com/150",
  },
];

const husband = [
  { id: "1", name: "Black Suit", imageUrl: "https://via.placeholder.com/150" },
  { id: "2", name: "White Shirt", imageUrl: "https://via.placeholder.com/150" },
  { id: "3", name: "Brown Shoes", imageUrl: "https://via.placeholder.com/150" },
];

export default function HomeScreen() {
  const router = useRouter();

  const onPressAddWardrobe = () => {
    router.push("/(root)/add-wardrobe");
  };

  return (
    <ScrollView className="flex-1 p-4 mt-5 bg-white">
      <View className="flex flex-row items-center justify-between bg-white">
        <Text className="text-3xl font-bold my-4">Your Wardrobes</Text>
        <TouchableOpacity onPress={onPressAddWardrobe}>
          <Text>+ Wardrobe</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-lg font-bold mb-2">Kids' Wardrobe</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {kids.map((item) => (
          <Card key={item.id}>
            <CardTitle className="text-sm">{item.name}</CardTitle>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 150, height: 150 }}
            />
          </Card>
        ))}
      </ScrollView>

      <Text className="text-lg font-bold mb-2">Husband's Wardrobes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {husband.map((item) => (
          <Card key={item.id}>
            <CardTitle className="text-sm">{item.name}</CardTitle>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 150, height: 150 }}
            />
          </Card>
        ))}
      </ScrollView>
    </ScrollView>
  );
}
