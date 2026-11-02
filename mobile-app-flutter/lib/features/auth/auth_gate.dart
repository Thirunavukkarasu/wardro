import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_scope.dart';
import '../auth/welcome_screen.dart';
import '../../shared/widgets/main_shell.dart';

/// Chooses between the auth flow and the signed-in shell, and holds a splash
/// while the persisted session is being restored.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);

    return switch (auth.status) {
      AuthStatus.restoring => const _Splash(),
      AuthStatus.signedIn => const MainShell(),
      AuthStatus.signedOut => const WelcomeScreen(),
    };
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
    );
  }
}
