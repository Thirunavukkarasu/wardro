/// Build-time configuration.
///
/// Values are injected with `--dart-define`, e.g.
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.5:3000/api`.
class AppConfig {
  const AppConfig._();

  /// Base URL of the Hono backend. Defaults to the URL currently used by the
  /// React Native app so both clients hit the same environment.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue:
        'https://0457-2406-7400-76ce-f46b-ad1d-75b0-8a93.ngrok-free.app/api',
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
