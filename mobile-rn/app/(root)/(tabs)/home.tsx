import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useCallback, useState } from "react";

import { Card, CardTitle } from "~/components/ui/card";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "~/components/CustomButton";
import { fetchAPI } from "~/lib/fetch";
import { useSession } from "@clerk/clerk-expo";

export default function HomeScreen() {
  const router = useRouter();
  const session = useSession();
  const [wardrobes, setWardrobes] = useState([]);

  const fetchData = useCallback(async () => {
    console.log("Fetching data", session);
    const wardrobeResponse = await fetchAPI("/wardrobes/4", {
      method: "GET",
    });
    const wardrobeData = wardrobeResponse?.data;
    setWardrobes(wardrobeData);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      {wardrobes.map((item: any, idx) => (
        <View key={idx}>
          <Text className="text-lg font-bold mb-2">{item.name}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          ></ScrollView>
        </View>
      ))}

      {/* <Text className="text-lg font-bold mb-2">Husband's Wardrobes</Text>
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
      </ScrollView> */}
    </ScrollView>
  );
}
