import React, { useState } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import CameraComponent from "~/components/CameraComponent";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function AddItem() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [itemName, setItemName] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [size, setSize] = useState<string>("");

  const handleSaveItem = () => {
    // Logic to save the item details, including the photoUri
    console.log("Item saved:", {
      itemName,
      purchaseDate,
      expiryDate,
      photoUri,
    });
  };

  return (
    <ScrollView className="flex-1 p-5">
      <Text className="text-lg font-bold">Add New Clothing Item</Text>
      {!photoUri ? (
        <CameraComponent onPhotoTaken={(uri: any) => setPhotoUri(uri)} />
      ) : (
        <View>
          <Image
            source={{ uri: photoUri }}
            className="w-full h-60 mb-4 rounded-lg"
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Item Name"
            value={itemName}
            onChangeText={setItemName}
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Purchase Date"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Expiry Date"
            value={expiryDate}
            onChangeText={setExpiryDate}
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Brand"
            value={brand}
            onChangeText={setBrand}
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Color"
            value={color}
            onChangeText={setColor}
          />
          <Input
            className="mt-4 border border-gray-300 p-2"
            placeholder="Size"
            value={size}
            onChangeText={setSize}
          />
          <Button onPress={handleSaveItem} className="mt-4">
            <Text className="text-white">Save Item</Text>
          </Button>
          <Button onPress={() => setPhotoUri(null)} className="mt-4">
            <Text className="text-white">Retake Photo</Text>
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
