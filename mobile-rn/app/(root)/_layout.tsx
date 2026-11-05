import { Stack } from "expo-router";

export default function RootGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-wardrobe" />
      <Stack.Screen name="add-wardrobe-items" />
      <Stack.Screen name="wardrobe/[id]" />
      <Stack.Screen name="item/[id]" />
    </Stack>
  );
}
