import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/config/app_config.dart';
import 'core/network/api_client.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/auth_service.dart';
import 'features/auth/firebase_auth_service.dart';
import 'features/auth/stub_auth_service.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  final apiClient = ApiClient();

  final useFirebase = await _initialiseFirebase();
  final AuthService authService = useFirebase
      ? FirebaseAuthService(prefs)
      : StubAuthService(prefs);

  final authController = AuthController(authService);
  await authController.initialize();

  runApp(WardroApp(authController: authController, apiClient: apiClient));
}

/// Initialises Firebase when `AUTH_MODE=firebase`.
///
/// Falls back to the stub if the platform config is incomplete (for example
/// web before a web app has been registered), so the app always starts.
Future<bool> _initialiseFirebase() async {
  if (AppConfig.authMode != 'firebase') return false;

  try {
    final options = DefaultFirebaseOptions.currentPlatform;
    if (options.apiKey.isEmpty || options.appId.isEmpty) {
      _log('Firebase options are incomplete for this platform — using stub');
      return false;
    }
    await Firebase.initializeApp(options: options);
    _log('Firebase initialised (project ${options.projectId})');
    return true;
  } catch (error) {
    _log('Firebase initialisation failed: $error — using stub');
    return false;
  }
}

void _log(String message) {
  if (kDebugMode) debugPrint('[auth] $message');
}
