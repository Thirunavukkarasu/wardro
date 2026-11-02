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

String _formatDate(DateTime date) {
  const weekdays = <String>[
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ];
  final weekday = weekdays[date.weekday - 1];
  return '$weekday, ${_monthNames[date.month - 1]} ${date.day}, ${date.year}';
}

/// Date field backed by the platform date picker, replacing
/// `react-native-date-picker`.
class AppDateField extends StatelessWidget {
  const AppDateField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.placeholder = 'Select a date',
  });

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime> onChanged;
  final String placeholder;

  @override
  Widget build(BuildContext context) {
    final text = value == null ? placeholder : _formatDate(value!);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          InkWell(
            borderRadius: BorderRadius.circular(999),
            onTap: () async {
              final now = DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: value ?? now,
                firstDate: DateTime(now.year - 50),
                lastDate: DateTime(now.year + 50),
              );
              if (picked != null) onChanged(picked);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.surface),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.calendar_today_outlined,
                    size: 20,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: value == null
                          ? AppColors.textMuted
                          : AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
