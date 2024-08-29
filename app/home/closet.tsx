import React from "react";
import { View, Text } from "react-native";
import { Button } from "~/components/ui/button";
import { Plus } from "~/lib/icons/Plus";

export default function Closet() {
  const onPressAddItem = () => {
    console.log("Add Item");
  };

  return (
    <View>
      <View className="flex flex-row justify-between items-center mt-2 p-2">
        <Text className="text-xl text-center mt-4">All Items</Text>
        <Button onPress={onPressAddItem} size={"sm"} variant={"outline"}>
          <View className="flex flex-row items-center">
            <Plus className="text-gray-500" />
          </View>
        </Button>
      </View>
    </View>
  );
}
