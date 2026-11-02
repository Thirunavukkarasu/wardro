import React, { useState } from "react";
import { View, Text, Image, ScrollView } from "react-native";

import CameraComponent from "~/components/CameraComponent";
import InputField from "~/components/InputField";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { icons } from "~/constants";
import { fetchAPI } from "~/lib/fetch";

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

  const handleSaveItem = async () => {
    // Logic to save the item details, including the photoUri
    console.log("Item saved:", {
      itemName,
      purchaseDate,
      expiryDate,
      photoUri,
    });
    // await fetchAPI("/(api)/wardrobe-items", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     name: form.name,
    //     email: form.email,
    //     clerkId: completeSignUp.createdUserId,
    //   }),
    // });
  };

  return (
    <ScrollView className="flex-1 bg-white p-5">
      <View className="flex-1 bg-white">
        <Text className="text-lg font-bold">Add New Clothing Item</Text>
        {!photoUri ? (
          <CameraComponent onPhotoTaken={(uri: any) => setPhotoUri(uri)} />
        ) : (
          <View>
            <Image
              source={{ uri: photoUri }}
              className="w-full h-60 mb-4 rounded-lg"
            />
            <InputField
              label="Item Name"
              placeholder="Enter item name"
              icon={icons.eyecross}
              value={itemName}
              onChangeText={setItemName}
            />
            <InputField
              label="Purchase Date"
              placeholder="Enter purchase date"
              icon={icons.eyecross}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
            />
            <InputField
              label="Expiry Date"
              placeholder="Enter expiry date"
              icon={icons.eyecross}
              value={expiryDate}
              onChangeText={setExpiryDate}
            />
            <InputField
              label="Price"
              placeholder="Enter price"
              icon={icons.eyecross}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            <InputField
              label="Brand"
              placeholder="Enter brand"
              icon={icons.eyecross}
              value={brand}
              onChangeText={setBrand}
            />
            <InputField
              label="Category"
              placeholder="Enter category"
              icon={icons.eyecross}
              value={category}
              onChangeText={setCategory}
            />
            <InputField
              label="Color"
              placeholder="Enter color"
              icon={icons.eyecross}
              value={color}
              onChangeText={setColor}
            />
            <InputField
              label="Size"
              placeholder="Enter size"
              icon={icons.eyecross}
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
      </View>
    </ScrollView>
  );
}
