import 'package:flutter/material.dart';

/// Palette carried over from the React Native app.
abstract final class AppColors {
  static const Color primary = Color(0xFF0286FF);
  static const Color primaryDark = Color(0xFF0169CC);

  static const Color tabBar = Color(0xFF333333);
  static const Color tabActiveOuter = Color(0xFFF9A8D4); // pink-300
  static const Color tabActiveInner = Color(0xFFF472B6); // pink-400

  static const Color background = Color(0xFFFFFFFF);
  static const Color canvas = Color(0xFFF6F7FB);
  static const Color surface = Color(0xFFF5F5F5); // neutral-100
  static const Color border = Color(0xFFE5E5E5); // neutral-200
  static const Color textPrimary = Color(0xFF000000);
  static const Color textSecondary = Color(0xFF858585);
  static const Color textMuted = Color(0xFF9CA3AF); // gray-400

  static const Color danger = Color(0xFFEF4444); // red-500
  static const Color success = Color(0xFF22C55E); // green-500
  static const Color warning = Color(0xFFF59E0B);
}
