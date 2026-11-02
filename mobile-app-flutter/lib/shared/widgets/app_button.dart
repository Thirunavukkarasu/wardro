import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

enum AppButtonVariant { primary, secondary, danger, success, outline }

/// The pill-shaped button used across the app, matching the React Native
/// `CustomButton` component.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.title,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.iconLeft,
    this.iconRight,
    this.isLoading = false,
    this.expand = true,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
  });

  final String title;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final Widget? iconLeft;
  final Widget? iconRight;
  final bool isLoading;
  final bool expand;
  final EdgeInsets padding;

  Color get _background => switch (variant) {
    AppButtonVariant.primary => AppColors.primary,
    AppButtonVariant.secondary => const Color(0xFF6B7280),
    AppButtonVariant.danger => AppColors.danger,
    AppButtonVariant.success => AppColors.success,
    AppButtonVariant.outline => Colors.transparent,
  };

  Color get _foreground => switch (variant) {
    AppButtonVariant.primary => Colors.white,
    AppButtonVariant.secondary => const Color(0xFFF3F4F6),
    AppButtonVariant.danger => const Color(0xFFFEE2E2),
    AppButtonVariant.success => const Color(0xFFDCFCE7),
    AppButtonVariant.outline => Colors.black,
  };

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || isLoading;

    return Opacity(
      opacity: disabled && !isLoading ? 0.6 : 1,
      child: Material(
        color: _background,
        elevation: variant == AppButtonVariant.outline ? 0 : 4,
        shadowColor: const Color(0xFFA3A3A3).withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            width: expand ? double.infinity : null,
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: variant == AppButtonVariant.outline
                  ? Border.all(color: AppColors.border)
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
              children: [
                if (isLoading)
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: _foreground,
                    ),
                  )
                else ...[
                  if (iconLeft != null) ...[iconLeft!, const SizedBox(width: 8)],
                  Text(
                    title,
                    style: TextStyle(
                      color: _foreground,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (iconRight != null) ...[
                    const SizedBox(width: 8),
                    iconRight!,
                  ],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
