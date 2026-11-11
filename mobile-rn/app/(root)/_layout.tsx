import { Stack } from "expo-router";

export default function RootGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-item" />
      <Stack.Screen name="add-wardrobe" />
      <Stack.Screen name="add-wardrobe-items" />
      <Stack.Screen name="web-import" />
      <Stack.Screen name="review" />
      <Stack.Screen name="add-profile" />
      <Stack.Screen name="wardrobes" />
      <Stack.Screen name="wardrobe/[id]" />
      <Stack.Screen name="item/[id]" />
    </Stack>
  );
}
