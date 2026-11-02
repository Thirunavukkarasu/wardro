/// Static copy and asset paths carried over from the React Native constants.
class OnboardingSlide {
  const OnboardingSlide({
    required this.title,
    required this.description,
    required this.imageAsset,
  });

  final String title;
  final String description;
  final String imageAsset;
}

const List<OnboardingSlide> onboardingSlides = [
  OnboardingSlide(
    title: 'Welcome to Wardro',
    description: 'Explore the new way of organizing your wardrobe',
    imageAsset: 'assets/images/onboarding3.png',
  ),
  OnboardingSlide(
    title: 'Browse the catalog',
    description: 'Find the perfect outfit for any occasion',
    imageAsset: 'assets/images/onboarding2.png',
  ),
  OnboardingSlide(
    title: 'Create your own style',
    description: 'Create your own style and share it with the world',
    imageAsset: 'assets/images/onboarding3.png',
  ),
];

abstract final class AppAssets {
  static const String signUpImage = 'assets/images/no-result.png';
  static const String check = 'assets/images/check.png';
  static const String googleIcon = 'assets/icons/google.png';
}
