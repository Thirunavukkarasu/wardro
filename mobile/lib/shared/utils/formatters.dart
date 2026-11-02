import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

const _monthNames = <String>[
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/// `12 Mar 2026`
String formatShortDate(DateTime date) =>
    '${date.day} ${_monthNames[date.month - 1]} ${date.year}';

/// `1,500` / `12,50,000` (Indian grouping), with a rupee prefix.
String formatPrice(double value) {
  final rounded = value.round();
  final digits = rounded.abs().toString();
  final isIndian = digits.length > 3;
  final buffer = StringBuffer();

  if (isIndian) {
    // Last three digits, then groups of two.
    final head = digits.substring(0, digits.length - 3);
    final tail = digits.substring(digits.length - 3);
    final groups = <String>[];
    var end = head.length;
    while (end > 0) {
      final start = end - 2 < 0 ? 0 : end - 2;
      groups.insert(0, head.substring(start, end));
      end = start;
    }
    buffer.writeAll(groups, ',');
    buffer.write(',');
    buffer.write(tail);
  } else {
    buffer.write(digits);
  }

  return '₹${rounded < 0 ? '-' : ''}${buffer.toString()}';
}

/// Human label for the backend's `state` column.
String stateLabel(String state) => switch (state) {
  'newly_purchased' => 'New',
  'in_use' => 'In use',
  'faded' => 'Faded',
  'expired' => 'Expired',
  'archived' => 'Archived',
  _ => state.replaceAll('_', ' '),
};

Color stateColor(String state) => switch (state) {
  'in_use' => AppColors.success,
  'faded' => AppColors.warning,
  'expired' => AppColors.danger,
  'archived' => AppColors.textMuted,
  _ => AppColors.primary,
};
