import 'package:flutter/material.dart';

import '../../../core/constants/content.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/hero_header.dart';

/// "Log in with Google" block on both auth screens.
///
/// The React Native app runs Clerk's `oauth_google` strategy here. With the
/// auth stub in place the button stays visible so the layout matches, and
/// explains itself until Clerk is wired up.
class OAuthSection extends StatelessWidget {
  const OAuthSection({super.key});

  @override
  Widget build(BuildContext context) {
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
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Google sign-in will be enabled once Clerk is connected.',
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
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
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
