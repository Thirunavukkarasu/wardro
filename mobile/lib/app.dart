import 'package:flutter/material.dart';

import 'core/network/api_client.dart';
import 'core/network/api_scope.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/auth_gate.dart';
import 'features/auth/auth_scope.dart';
import 'shared/widgets/mobile_frame.dart';

class WardroApp extends StatelessWidget {
  const WardroApp({
    super.key,
    required this.authController,
    required this.apiClient,
  });

  final AuthController authController;
  final ApiClient apiClient;

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      controller: authController,
      child: ApiScope(
        client: apiClient,
        child: MaterialApp(
          title: 'Wardro',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light,
          builder: (context, child) =>
              MobileFrame(child: child ?? const SizedBox.shrink()),
          home: const AuthGate(),
        ),
      ),
    );
  }
}
