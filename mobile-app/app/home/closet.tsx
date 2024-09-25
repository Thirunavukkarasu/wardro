import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "~/components/ui/button";

export default function Closet() {
  const router = useRouter();

  const onPressAddItem = () => {
    console.log("Add Item");
    router.replace("/add");
  };

  return (
    <View>
      <View className="flex flex-row justify-between items-center mt-2 p-2">
        <Text className="text-xl text-center mt-4">All Items</Text>
        <Button onPress={onPressAddItem} size={"sm"} variant={"outline"}>
          <View className="flex flex-row items-center">
            {/* <Plus className="text-gray-500" /> */}
            <Text className="text-gray-500">Add Item</Text>
          </View>
        </Button>
      </View>
    </View>
  );
}
