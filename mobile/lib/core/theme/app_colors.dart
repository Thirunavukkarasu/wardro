import 'package:flutter/material.dart';

/// Brand palette — one base colour (indigo) with a pink accent.
///
/// Use these tokens everywhere; screens should not hard-code colours.
abstract final class AppColors {
  // Base
  static const Color primary = Color(0xFF4F46E5); // indigo 600
  static const Color primaryDeep = Color(0xFF4338CA);
  static const Color primarySoft = Color(0xFFEEF0FF);

  // Accent (used sparingly: active states, highlights)
  static const Color accent = Color(0xFFEC4899); // pink 500
  static const Color accentSoft = Color(0xFFFDF2F8);

  // Surfaces
  static const Color background = Color(0xFFFFFFFF);
  static const Color canvas = Color(0xFFF7F7FB);
  static const Color surface = Color(0xFFF1F2F7);
  static const Color border = Color(0xFFE7E8EF);

  // Text
  static const Color textPrimary = Color(0xFF0F172A); // slate 900
  static const Color textSecondary = Color(0xFF64748B); // slate 500
  static const Color textMuted = Color(0xFF94A3B8); // slate 400

  // Status
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);

  /// Gradient used for identity headers and wardrobe covers.
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7C6CFF), primary],
  );
}
