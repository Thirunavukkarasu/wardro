import 'package:flutter/material.dart';

import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../shared/widgets/hero_header.dart';
import 'auth_scope.dart';
import 'sign_up_screen.dart';
import 'widgets/oauth_section.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    final auth = AuthScope.of(context);
    final signedIn = await auth.signIn(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
    if (!mounted) return;

    if (signedIn) {
      Navigator.of(context).popUntil((route) => route.isFirst);
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(auth.errorMessage ?? 'Unable to sign in.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);

    return AuthFormScaffold(
      title: 'Welcome 👋',
      fields: [
        Form(
          key: _formKey,
          child: Column(
            children: [
              AppTextField(
                label: 'Email',
                controller: _emailController,
                placeholder: 'Enter email',
                icon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                onChanged: (_) => auth.clearError(),
                validator: (value) {
                  final email = value?.trim() ?? '';
                  if (email.isEmpty) return 'Email is required';
                  if (!email.contains('@')) return 'Enter a valid email';
                  return null;
                },
              ),
              AppTextField(
                label: 'Password',
                controller: _passwordController,
                placeholder: 'Enter password',
                icon: Icons.lock_outline,
                obscureText: true,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.password],
                onChanged: (_) => auth.clearError(),
                onSubmitted: (_) => _submit(),
                validator: (value) {
                  if ((value ?? '').isEmpty) return 'Password is required';
                  return null;
                },
              ),
            ],
          ),
        ),
      ],
      primaryAction: AppButton(
        title: 'Sign In',
        isLoading: auth.isBusy,
        onPressed: _submit,
      ),
      footer: AuthFooterLink(
        prompt: "Don't have an account?",
        actionLabel: 'Sign Up',
        onTap: () {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(builder: (_) => const SignUpScreen()),
          );
        },
      ),
    );
  }
}
