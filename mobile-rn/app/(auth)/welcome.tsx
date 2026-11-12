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
import { markOnboardingSeen } from "~/lib/onboarding";

/** First-run onboarding carousel shown to signed-out users. */
export default function WelcomeScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // On web the app is confined to a 430px phone column (see PhoneFrame).
  const width = Platform.OS === "web" ? Math.min(windowWidth, 430) : windowWidth;
  // The illustrations are 4:5 portrait, so the slot has to be tall enough to
  // let them fill it; a landscape slot would shrink them to a strip.
  const artHeight = Math.min(Math.round(windowHeight * 0.4), 380);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === onboarding.length - 1;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) setActiveIndex(index);
  };

  // Both exits consume the carousel: it is a first-run experience, so skipping
  // it counts as having seen it.
  const finishOnboarding = async () => {
    await markOnboardingSeen();
    router.replace("/(auth)/sign-up");
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-row justify-end p-5">
        <Pressable
          onPress={finishOnboarding}
          hitSlop={10}
          accessibilityRole="button"
        >
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
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {onboarding.map((slide) => (
          <View
            key={slide.id}
            style={{ width, height: "100%" }}
            className="items-center justify-center px-8 pb-10"
          >
            <Image
              source={slide.image}
              resizeMode="contain"
              accessibilityLabel={slide.title}
              style={{ width: "100%", height: artHeight }}
            />
            <Text className="mt-10 text-center text-heading font-bold text-wardro-text-primary">
              {slide.title}
            </Text>
            <Text className="mt-3 text-center text-body text-wardro-text-secondary">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="px-5 pb-6 pt-2">
        <View
          className="flex-row items-center justify-center pb-6"
          accessibilityRole="adjustable"
          accessibilityLabel={`Slide ${activeIndex + 1} of ${onboarding.length}`}
        >
          {onboarding.map((slide, index) => (
            <View
              key={slide.id}
              className={`mx-1 h-1 w-8 rounded-full ${
                index === activeIndex
                  ? "bg-wardro-primary-dark"
                  : "bg-wardro-border"
              }`}
            />
          ))}
        </View>

        <CustomButton
          title={isLastSlide ? "Get Started" : "Next"}
          onPress={() => {
            if (isLastSlide) {
              void finishOnboarding();
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
