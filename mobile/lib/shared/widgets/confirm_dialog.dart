import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Destructive confirmation dialog. Returns true only when the user confirms.
Future<bool> showDeleteConfirmation(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Delete',
  String cancelLabel = 'Cancel',
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
      content: Text(
        message,
        style: const TextStyle(height: 1.4, color: AppColors.textSecondary),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: Text(
            cancelLabel,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.danger,
            foregroundColor: Colors.white,
          ),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );

  return confirmed ?? false;
}
