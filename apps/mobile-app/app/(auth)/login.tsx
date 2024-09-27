import React, { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

import { Input } from "~/mobile-app/components/ui/input";
import { Button } from "~/mobile-app/components/ui/button";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onChangeEmail = (text: string) => {
    setEmail(text);
  };

  const onChangePassword = (text: string) => {
    setPassword(text);
  };

  const onPressLogin = () => {
    console.log("Login", { email, password });
    //redirect to home
    router.replace("/home");
  };

  return (
    <View className="h-screen mt-60">
      <Text className="text-3xl my-4 text-center">Login to MyCloset</Text>
      <View className="flex gap-4 p-4 justify-center">
        <Input placeholder="Email" value={email} onChangeText={onChangeEmail} />
        <Input
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={onChangePassword}
        />
        <Button onPress={onPressLogin}>
          <Text className="text-white">Login</Text>
        </Button>
        <Button onPress={() => router.replace("/register")}>
          <Text className="text-white">Register</Text>
        </Button>
      </View>
    </View>
  );
}
