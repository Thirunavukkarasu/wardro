import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/config/app_config.dart';
import 'core/network/api_client.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/stub_auth_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  assert(
    AppConfig.authMode == 'stub',
    'Only AUTH_MODE=stub is implemented in this build.',
  );

  final prefs = await SharedPreferences.getInstance();
  final authController = AuthController(StubAuthService(prefs));
  await authController.initialize();

  runApp(WardroApp(authController: authController, apiClient: ApiClient()));
}
