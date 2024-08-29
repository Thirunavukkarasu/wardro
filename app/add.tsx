import React from "react";
import { View, Text } from "react-native";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function AddItem() {
  return (
    <View>
      <Text className="text-lg font-bold">Add New Clothing Item</Text>
      <Input
        className="mt-4 border border-gray-300 p-2"
        placeholder="Item Name"
      />
      <Input
        className="mt-4 border border-gray-300 p-2"
        placeholder="Purchase Date"
      />
      <Input
        className="mt-4 border border-gray-300 p-2"
        placeholder="Expiry Date"
      />
      <Input className="mt-4 border border-gray-300 p-2" placeholder="Price" />
      <Input className="mt-4 border border-gray-300 p-2" placeholder="Brand" />
      <Input
        className="mt-4 border border-gray-300 p-2"
        placeholder="Category"
      />
      <Input className="mt-4 border border-gray-300 p-2" placeholder="Color" />
      <Input className="mt-4 border border-gray-300 p-2" placeholder="Size" />
      <Button>
        <Text>Add Item</Text>
      </Button>
    </View>
  );
}
