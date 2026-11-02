import 'package:flutter/material.dart';

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

    final email = _emailController.text.trim();
    final auth = AuthScope.of(context);
    final created = await auth.signUp(
      name: _nameController.text.trim(),
      email: email,
      password: _passwordController.text,
    );
    if (!mounted) return;

    if (!created) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.errorMessage ?? 'Unable to sign up.')),
      );
      return;
    }

    // Firebase signs the user in immediately; email verification happens via
    // a link in the background and never blocks usage.
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _VerificationSentDialog(email: email),
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
                  if (password.length < 6) {
                    return 'Use at least 6 characters';
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

/// Post-sign-up step: Firebase emails a verification link instead of a code.
class _VerificationSentDialog extends StatefulWidget {
  const _VerificationSentDialog({required this.email});

  final String email;

  @override
  State<_VerificationSentDialog> createState() =>
      _VerificationSentDialogState();
}

class _VerificationSentDialogState extends State<_VerificationSentDialog> {
  bool _resending = false;
  String? _message;
  bool _isError = false;

  Future<void> _resend() async {
    setState(() {
      _resending = true;
      _message = null;
    });

    final auth = AuthScope.of(context);
    final sent = await auth.resendVerificationEmail();
    if (!mounted) return;

    setState(() {
      _resending = false;
      _isError = !sent;
      _message = sent
          ? 'Verification email sent again.'
          : (auth.errorMessage ?? 'Could not resend the email.');
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.mark_email_unread_outlined,
              size: 34,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Verify your email',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text(
            "We've sent a verification link to ${widget.email}. "
            'You can start using Wardro now — verifying just secures your account.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              height: 1.4,
              color: AppColors.textSecondary,
            ),
          ),
          if (_message != null) ...[
            const SizedBox(height: 10),
            Text(
              _message!,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: _isError ? AppColors.danger : AppColors.success,
              ),
            ),
          ],
          const SizedBox(height: 20),
          AppButton(
            title: 'Continue',
            onPressed: () => Navigator.of(context).pop(),
          ),
          TextButton(
            onPressed: _resending ? null : _resend,
            child: Text(_resending ? 'Sending…' : 'Resend email'),
          ),
        ],
      ),
    );
  }
}
