import React, { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

import { Input } from "~/mobile-app/components/ui/input";
import { Button } from "~/mobile-app/components/ui/button";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onChangeUsername = (text: string) => {
    setUsername(text);
  };

  const onChangePassword = (text: string) => {
    setPassword(text);
  };

  const onPressLogin = () => {
    console.log("Register", { username, password });
    //redirect to home
    router.replace("/login");
  };

  return (
    <View className="h-screen mt-60">
      <Text className="text-3xl my-4 text-center">Register to MyCloset</Text>
      <View className="flex gap-4 p-4 justify-center">
        <Input
          placeholder="Email or Username"
          value={username}
          onChangeText={onChangeUsername}
        />
        <Input
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={onChangePassword}
        />
        <Button onPress={onPressLogin}>
          <Text className="text-white">Register</Text>
        </Button>
        <Button onPress={() => router.replace("/login")}>
          <Text className="text-white">Register</Text>
        </Button>
      </View>
    </View>
  );
}
