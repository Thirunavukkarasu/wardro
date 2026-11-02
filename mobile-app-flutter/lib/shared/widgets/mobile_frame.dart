import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Keeps the app at a phone-sized width on wide screens (desktop browsers),
/// centred on a dark backdrop. On a real phone — or any narrow window — it
/// renders edge to edge with no frame.
///
/// Wrapping the `MaterialApp.builder` means every route and dialog lives
/// inside the constrained box, so the whole app stays in "mobile mode".
class MobileFrame extends StatelessWidget {
  const MobileFrame({super.key, required this.child});

  final Widget child;

  /// iPhone 15 Pro logical width — close to the reference design canvas.
  static const double maxWidth = 393;
  static const double _verticalGap = 16;
  static const double _compactBreakpoint = 560;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth <= _compactBreakpoint) return child;

        final height = (constraints.maxHeight - _verticalGap * 2).clamp(
          0.0,
          double.infinity,
        );
        final media = MediaQuery.of(context);

        return ColoredBox(
          color: const Color(0xFF0E1522),
          child: Center(
            child: Container(
              width: maxWidth,
              height: height,
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.45),
                    blurRadius: 48,
                    spreadRadius: 4,
                    offset: const Offset(0, 20),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: MediaQuery(
                data: media.copyWith(
                  size: Size(maxWidth, height),
                  padding: EdgeInsets.zero,
                  viewPadding: EdgeInsets.zero,
                  viewInsets: EdgeInsets.zero,
                ),
                child: child,
              ),
            ),
          ),
        );
      },
    );
  }
}
