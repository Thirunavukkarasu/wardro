import { Image, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";

import { Card, CardTitle } from "~/components/ui/card";

const kidsCloset = [
  { id: "1", name: "Red T-shirt", imageUrl: "https://via.placeholder.com/150" },
  { id: "2", name: "Blue Jeans", imageUrl: "https://via.placeholder.com/150" },
  {
    id: "3",
    name: "Yellow Hoodie",
    imageUrl: "https://via.placeholder.com/150",
  },
];

const husbandCloset = [
  { id: "1", name: "Black Suit", imageUrl: "https://via.placeholder.com/150" },
  { id: "2", name: "White Shirt", imageUrl: "https://via.placeholder.com/150" },
  { id: "3", name: "Brown Shoes", imageUrl: "https://via.placeholder.com/150" },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-3xl font-bold mb-4">Your Closets</Text>
      <Text className="text-lg font-bold mb-2">Kids' Closet</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {kidsCloset.map((item) => (
          <Card key={item.id}>
            <CardTitle className="text-sm">{item.name}</CardTitle>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 150, height: 150 }}
            />
          </Card>
        ))}
      </ScrollView>

      <Text className="text-lg font-bold mb-2">Husband's Closet</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {husbandCloset.map((item) => (
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
