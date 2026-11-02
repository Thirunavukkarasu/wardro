import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/app_pill.dart';
import '../../../shared/widgets/item_photo.dart';
import '../models/wardrobe_item.dart';

/// Picture-first tile used in the wardrobe and "All Items" grids.
class ItemPhotoTile extends StatelessWidget {
  const ItemPhotoTile({super.key, required this.item, required this.onTap});

  final WardrobeItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Material(
        color: AppColors.surface,
        child: InkWell(
          onTap: onTap,
          child: Stack(
            fit: StackFit.expand,
            children: [
              ItemPhoto(item: item),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xB3000000)],
                    stops: [0.5, 1],
                  ),
                ),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: AppPill(
                  label: stateLabel(item.state),
                  color: stateColor(item.state),
                  filled: true,
                ),
              ),
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.itemName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14.5,
                        height: 1.2,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    if (item.price != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        formatPrice(item.price!),
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xE6FFFFFF),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
