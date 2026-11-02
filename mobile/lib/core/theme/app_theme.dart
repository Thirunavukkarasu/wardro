import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract final class AppTheme {
  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
    ).copyWith(
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.accent,
      onSecondary: Colors.white,
      surface: Colors.white,
      onSurface: AppColors.textPrimary,
      error: AppColors.danger,
      outline: AppColors.border,
      outlineVariant: AppColors.border,
    );

    const textTheme = TextTheme(
      headlineLarge: TextStyle(
        fontSize: 26,
        height: 1.15,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.6,
        color: AppColors.textPrimary,
      ),
      headlineMedium: TextStyle(
        fontSize: 22,
        height: 1.2,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        color: AppColors.textPrimary,
      ),
      headlineSmall: TextStyle(
        fontSize: 20,
        height: 1.2,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: AppColors.textPrimary,
      ),
      titleLarge: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      ),
      titleMedium: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
      titleSmall: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
      bodyLarge: TextStyle(fontSize: 15, height: 1.4, color: AppColors.textPrimary),
      bodyMedium: TextStyle(fontSize: 14, height: 1.4, color: AppColors.textPrimary),
      bodySmall: TextStyle(
        fontSize: 12.5,
        height: 1.35,
        color: AppColors.textSecondary,
      ),
      labelLarge: TextStyle(
        fontSize: 12.5,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
      labelMedium: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: AppColors.textMuted,
      ),
      labelSmall: TextStyle(
        fontSize: 10.5,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.0,
        color: AppColors.textMuted,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.canvas,
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.canvas,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 66,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.primarySoft,
        elevation: 0,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 22,
            color: states.contains(WidgetState.selected)
                ? AppColors.primary
                : AppColors.textMuted,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11.5,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w600,
            color: states.contains(WidgetState.selected)
                ? AppColors.primary
                : AppColors.textMuted,
          ),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: CircleBorder(),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.surface),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.textPrimary,
        contentTextStyle: const TextStyle(fontSize: 13.5, color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
