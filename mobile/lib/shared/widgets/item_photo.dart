import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../features/items/models/wardrobe_item.dart';

/// Renders a garment photo, falling back to a tasteful placeholder when the
/// stored URI is not a usable URL (device paths / expired blob URLs) or the
/// image fails to load.
class ItemPhoto extends StatelessWidget {
  const ItemPhoto({super.key, required this.item, this.fit = BoxFit.cover});

  final WardrobeItem item;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final url = item.photoUrl;
    final placeholder = _PhotoPlaceholder(item: item);

    if (url == null) return placeholder;

    return Image.network(
      url,
      fit: fit,
      width: double.infinity,
      height: double.infinity,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return Stack(
          fit: StackFit.expand,
          children: [
            placeholder,
            const Center(
              child: SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        );
      },
      errorBuilder: (context, error, stackTrace) => placeholder,
    );
  }
}

class _PhotoPlaceholder extends StatelessWidget {
  const _PhotoPlaceholder({required this.item});

  final WardrobeItem item;

  @override
  Widget build(BuildContext context) {
    final initial = item.itemName.trim().isEmpty
        ? '?'
        : item.itemName.trim()[0].toUpperCase();

    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFE9EFF7), Color(0xFFD8E2EF)],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.dry_cleaning_outlined,
              size: 34,
              color: AppColors.primary.withValues(alpha: 0.45),
            ),
            const SizedBox(height: 6),
            Text(
              initial,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.primary.withValues(alpha: 0.55),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
