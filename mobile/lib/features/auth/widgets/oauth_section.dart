import 'package:flutter/material.dart';

import '../../../core/constants/content.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/hero_header.dart';
import '../auth_scope.dart';

/// "Log in with Google" block on both auth screens.
class OAuthSection extends StatelessWidget {
  const OAuthSection({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final busy = auth.isBusy;

    return Column(
      children: [
        const SizedBox(height: 16),
        Row(
          children: [
            const Expanded(child: Divider(color: AppColors.border)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'Or',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const Expanded(child: Divider(color: AppColors.border)),
          ],
        ),
        const SizedBox(height: 20),
        AppButton(
          title: 'Log In with Google',
          variant: AppButtonVariant.outline,
          iconLeft: Image.asset(AppAssets.googleIcon, width: 20, height: 20),
          isLoading: busy,
          onPressed: () async {
            final signedIn = await auth.signInWithGoogle();
            if (!context.mounted) return;

            if (signedIn) {
              Navigator.of(context).popUntil((route) => route.isFirst);
              return;
            }

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  auth.errorMessage ?? 'Google sign-in failed. Try again.',
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

/// Shared scaffolding for the sign-in / sign-up forms.
class AuthFormScaffold extends StatelessWidget {
  const AuthFormScaffold({
    super.key,
    required this.title,
    required this.fields,
    required this.primaryAction,
    required this.footer,
    this.banner,
  });

  final String title;
  final List<Widget> fields;
  final Widget primaryAction;
  final Widget footer;
  final Widget? banner;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              HeroHeader(title: title),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ...fields,
                    const SizedBox(height: 16),
                    primaryAction,
                    if (banner != null) ...[const SizedBox(height: 16), banner!],
                    const OAuthSection(),
                    footer,
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
