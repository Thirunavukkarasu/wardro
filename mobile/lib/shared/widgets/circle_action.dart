import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Circular filled action button used in screen headers.
class CircleAction extends StatelessWidget {
  const CircleAction({
    super.key,
    required this.icon,
    required this.onTap,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: AppColors.primary,
        shape: const CircleBorder(),
        elevation: 3,
        shadowColor: AppColors.primary.withValues(alpha: 0.5),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(
            width: 48,
            height: 48,
            child: Icon(icon, color: Colors.white, size: 26),
          ),
        ),
      ),
    );
  }
}
