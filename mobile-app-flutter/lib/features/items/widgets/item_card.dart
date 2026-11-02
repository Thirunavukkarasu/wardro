import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/app_pill.dart';
import '../models/wardrobe_item.dart';

/// Card used for a garment in both the wardrobe detail and "All Items" screens.
class ItemCard extends StatelessWidget {
  const ItemCard({super.key, required this.item, this.showState = true});

  final WardrobeItem item;
  final bool showState;

  String get _subtitle => [item.brand, item.category]
      .where((part) => part.trim().isNotEmpty)
      .join(' · ');

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF101828).withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Thumbnail(item: item),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        item.itemName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if (showState) ...[
                      const SizedBox(width: 8),
                      AppPill(
                        label: stateLabel(item.state),
                        color: stateColor(item.state),
                      ),
                    ],
                  ],
                ),
                if (_subtitle.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    _subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if (item.price != null)
                      AppPill(
                        label: formatPrice(item.price!),
                        color: const Color(0xFF8B5CF6),
                        filled: true,
                        icon: Icons.payments_outlined,
                      ),
                    if (item.size.isNotEmpty)
                      AppPill(label: 'Size ${item.size}'),
                    if (item.color.isNotEmpty)
                      AppPill(
                        label: item.color,
                        color: AppColors.textSecondary,
                      ),
                  ],
                ),
                if (item.purchaseDate != null || item.expiryDate != null) ...[
                  const SizedBox(height: 10),
                  _DateLine(item: item),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({required this.item});

  final WardrobeItem item;

  @override
  Widget build(BuildContext context) {
    final url = item.photoUrl;
    final placeholder = Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(
        Icons.dry_cleaning_outlined,
        color: AppColors.textMuted,
        size: 28,
      ),
    );

    if (url == null) return placeholder;

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Image.network(
        url,
        width: 64,
        height: 64,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      ),
    );
  }
}

class _DateLine extends StatelessWidget {
  const _DateLine({required this.item});

  final WardrobeItem item;

  @override
  Widget build(BuildContext context) {
    final parts = <String>[
      if (item.purchaseDate != null)
        'Bought ${formatShortDate(item.purchaseDate!)}',
      if (item.expiryDate != null)
        'Expires ${formatShortDate(item.expiryDate!)}',
    ];

    return Row(
      children: [
        const Icon(
          Icons.event_outlined,
          size: 14,
          color: AppColors.textMuted,
        ),
        const SizedBox(width: 5),
        Expanded(
          child: Text(
            parts.join('  ·  '),
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textMuted,
            ),
          ),
        ),
      ],
    );
  }
}
