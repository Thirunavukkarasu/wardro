import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "~/components/CustomButton";
import { onboarding } from "~/constants";

/** Landing/onboarding screen shown to signed-out users. */
export default function WelcomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  // On web the app is confined to a 430px phone column (see PhoneFrame).
  const width = Platform.OS === "web" ? Math.min(windowWidth, 430) : windowWidth;
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === onboarding.length - 1;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const goToSignUp = () => router.replace("/(auth)/sign-up");

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-row justify-end p-5">
        <Pressable onPress={goToSignUp} hitSlop={10}>
          <Text className="text-sm font-bold text-ink">Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {onboarding.map((slide) => (
          <View
            key={slide.id}
            style={{ width }}
            className="items-center justify-center px-8"
          >
            <Image
              source={slide.image}
              resizeMode="contain"
              style={{ width: "100%", height: 260 }}
            />
            <Text className="mt-10 text-center text-[26px] font-bold text-ink">
              {slide.title}
            </Text>
            <Text className="mt-3 text-center text-sm font-semibold text-ink-secondary">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-center">
        {onboarding.map((slide, index) => (
          <View
            key={slide.id}
            className={`mx-1 h-1 w-8 rounded-full ${
              index === activeIndex ? "bg-brand" : "bg-[#E2E8F0]"
            }`}
          />
        ))}
      </View>

      <View className="px-5 pb-6 pt-6">
        <CustomButton
          title={isLastSlide ? "Get Started" : "Next"}
          onPress={() => {
            if (isLastSlide) {
              goToSignUp();
            } else {
              scrollRef.current?.scrollTo({
                x: width * (activeIndex + 1),
                animated: true,
              });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
