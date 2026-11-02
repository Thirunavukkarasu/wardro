import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/constants/content.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../shared/widgets/hero_header.dart';
import 'auth_scope.dart';
import 'sign_in_screen.dart';
import 'widgets/oauth_section.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    final auth = AuthScope.of(context);
    final started = await auth.beginSignUp(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
    if (!mounted) return;

    if (!started) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.errorMessage ?? 'Unable to sign up.')),
      );
      return;
    }

    final verified = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _VerificationDialog(email: _emailController.text.trim()),
    );
    if (!mounted || verified != true) return;

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const _SignUpSuccessDialog(),
    );
    if (!mounted) return;

    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);

    return AuthFormScaffold(
      title: 'Create Your Account',
      fields: [
        Form(
          key: _formKey,
          child: Column(
            children: [
              AppTextField(
                label: 'Name',
                controller: _nameController,
                placeholder: 'Enter name',
                icon: Icons.person_outline,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.name],
                validator: (value) =>
                    (value ?? '').trim().isEmpty ? 'Name is required' : null,
              ),
              AppTextField(
                label: 'Email',
                controller: _emailController,
                placeholder: 'Enter email',
                icon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
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
                autofillHints: const [AutofillHints.newPassword],
                onSubmitted: (_) => _submit(),
                validator: (value) {
                  final password = value ?? '';
                  if (password.isEmpty) return 'Password is required';
                  if (password.length < 8) {
                    return 'Use at least 8 characters';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ],
      primaryAction: AppButton(
        title: 'Sign Up',
        isLoading: auth.isBusy,
        onPressed: _submit,
      ),
      footer: AuthFooterLink(
        prompt: 'Already have an account?',
        actionLabel: 'Log In',
        onTap: () {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(builder: (_) => const SignInScreen()),
          );
        },
      ),
    );
  }
}

class _VerificationDialog extends StatefulWidget {
  const _VerificationDialog({required this.email});

  final String email;

  @override
  State<_VerificationDialog> createState() => _VerificationDialogState();
}

class _VerificationDialogState extends State<_VerificationDialog> {
  final _codeController = TextEditingController();
  String? _error;
  bool _submitting = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    final auth = AuthScope.of(context);
    final verified = await auth.verifyEmailCode(_codeController.text.trim());
    if (!mounted) return;

    if (verified) {
      Navigator.of(context).pop(true);
      return;
    }

    setState(() {
      _submitting = false;
      _error = auth.errorMessage ?? 'Verification failed. Please try again.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Text(
        'Verification',
        style: TextStyle(fontWeight: FontWeight.w800),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "We've sent a verification code to ${widget.email}.",
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          AppTextField(
            label: 'Code',
            controller: _codeController,
            placeholder: '123456',
            icon: Icons.lock_outline,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 4),
            Text(
              _error!,
              style: const TextStyle(color: AppColors.danger, fontSize: 13),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Stub build: any 6-digit code is accepted.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
      actionsPadding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
      actions: [
        AppButton(
          title: 'Verify Email',
          variant: AppButtonVariant.success,
          isLoading: _submitting,
          onPressed: _verify,
        ),
      ],
    );
  }
}

class _SignUpSuccessDialog extends StatelessWidget {
  const _SignUpSuccessDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset(AppAssets.check, height: 110),
          const SizedBox(height: 12),
          const Text(
            'Verified',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          const Text(
            'You have successfully verified your account.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted),
          ),
          const SizedBox(height: 20),
          AppButton(
            title: 'Browse Home',
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}
