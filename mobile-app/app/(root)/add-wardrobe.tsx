import { useUser } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import CustomButton from "~/components/CustomButton";
import InputField from "~/components/InputField";
import { icons, images } from "~/constants";
import { fetchAPI } from "~/lib/fetch";

const AddWardrobe = () => {
  const { user }: any = useUser();
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const onPressAddWardrobe = useCallback(async () => {
    console.log("Add Wardrobe", form);
    console.log("User", JSON.stringify(user, null, 2));
    await fetchAPI("/(api)/wardrobe", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        name: form.name,
        description: form.description,
      }),
    });
  }, [form]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpImg} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Add Wardrobe
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Name"
            placeholder="Enter name"
            icon={icons.eyecross}
            value={form.name}
            tabIndex={0}
            onChangeText={(value) => setForm({ ...form, name: value })}
          />

          <InputField
            label="Description"
            placeholder="Enter description"
            icon={icons.eyecross}
            value={form.description}
            tabIndex={0}
            onChangeText={(value) => setForm({ ...form, description: value })}
          />

          <CustomButton
            title="Add Wardrobe"
            onPress={onPressAddWardrobe}
            className="mt-6"
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default AddWardrobe;
