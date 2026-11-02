import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Small rounded label used for counts, sizes and item states.
class AppPill extends StatelessWidget {
  const AppPill({
    super.key,
    required this.label,
    this.color = AppColors.primary,
    this.icon,
    this.filled = false,
  });

  final String label;
  final Color color;
  final IconData? icon;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final background = filled
        ? color
        : color.withValues(alpha: 0.1);
    final foreground = filled ? Colors.white : color;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: filled ? 12 : 10,
        vertical: filled ? 6 : 4,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: foreground),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: foreground,
            ),
          ),
        ],
      ),
    );
  }
}
