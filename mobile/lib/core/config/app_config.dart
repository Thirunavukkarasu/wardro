/// Build-time configuration.
///
/// Values are injected with `--dart-define`, e.g.
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.5:3000/api`.
class AppConfig {
  const AppConfig._();

  /// Base URL of the Hono backend deployed on Firebase App Hosting.
  ///
  /// Override locally with
  /// `flutter run --dart-define=API_BASE_URL=http://localhost:3000/api`.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://wardro--wardo-ce8d5.us-east4.hosted.app/api',
  );

  /// Authentication backend: `firebase` (default) or `stub`.
  ///
  /// If Firebase is selected but the platform config is incomplete, the app
  /// logs a warning and falls back to the stub so it still starts.
  static const String authMode = String.fromEnvironment(
    'AUTH_MODE',
    defaultValue: 'firebase',
  );

  static const Duration requestTimeout = Duration(seconds: 20);
}
