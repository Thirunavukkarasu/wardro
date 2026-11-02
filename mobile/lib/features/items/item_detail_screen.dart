import 'package:flutter/material.dart';

import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/utils/formatters.dart';
import '../../shared/widgets/app_pill.dart';
import '../../shared/widgets/confirm_dialog.dart';
import '../../shared/widgets/item_photo.dart';
import 'models/wardrobe_item.dart';

/// Full-screen item view: photo first, details underneath.
class ItemDetailScreen extends StatelessWidget {
  const ItemDetailScreen({super.key, required this.item});

  final WardrobeItem item;

  /// Deletes the item and pops with `true` so the caller can refresh.
  Future<void> _delete(BuildContext context) async {
    final confirmed = await showDeleteConfirmation(
      context,
      title: 'Delete item?',
      message: '"${item.itemName}" and its photo will be removed permanently.',
    );
    if (!confirmed || !context.mounted) return;

    final api = ApiScope.of(context);
    try {
      await api.delete('/wardrobeItems/${item.id}');
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Item deleted.')));
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final heroHeight = (MediaQuery.sizeOf(context).height * 0.52).clamp(
      300.0,
      620.0,
    );

    final details = <(IconData, String, String)>[
      if (item.brand.isNotEmpty)
        (Icons.storefront_outlined, 'Brand', item.brand),
      if (item.category.isNotEmpty)
        (Icons.category_outlined, 'Category', item.category),
      if (item.size.isNotEmpty)
        (Icons.straighten_outlined, 'Size', item.size),
      if (item.color.isNotEmpty)
        (Icons.palette_outlined, 'Colour', item.color),
      if (item.price != null)
        (Icons.payments_outlined, 'Price', formatPrice(item.price!)),
    ];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: heroHeight,
            pinned: true,
            stretch: true,
            backgroundColor: AppColors.canvas,
            surfaceTintColor: Colors.transparent,
            leadingWidth: 64,
            leading: Padding(
              padding: const EdgeInsets.only(left: 12, top: 8, bottom: 8),
              child: _RoundIconButton(
                icon: Icons.arrow_back,
                onTap: () => Navigator.of(context).pop(),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
                child: _RoundIconButton(
                  icon: Icons.delete_outline,
                  tooltip: 'Delete item',
                  onTap: () => _delete(context),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              background: _Hero(item: item),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 48),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      AppPill(
                        label: stateLabel(item.state),
                        color: stateColor(item.state),
                        filled: true,
                      ),
                      if (item.category.isNotEmpty)
                        AppPill(label: item.category),
                      if (item.size.isNotEmpty)
                        AppPill(label: 'Size ${item.size}'),
                      if (item.color.isNotEmpty)
                        AppPill(
                          label: item.color,
                          color: AppColors.textSecondary,
                        ),
                    ],
                  ),
                  if (details.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _InfoCard(
                      title: 'DETAILS',
                      children: [
                        for (final detail in details)
                          _DetailRow(
                            icon: detail.$1,
                            label: detail.$2,
                            value: detail.$3,
                          ),
                      ],
                    ),
                  ],
                  if (item.purchaseDate != null ||
                      item.expiryDate != null) ...[
                    const SizedBox(height: 16),
                    _InfoCard(
                      title: 'DATES',
                      children: [
                        if (item.purchaseDate != null)
                          _DetailRow(
                            icon: Icons.shopping_bag_outlined,
                            label: 'Bought',
                            value: formatShortDate(item.purchaseDate!),
                          ),
                        if (item.expiryDate != null)
                          _DetailRow(
                            icon: Icons.event_busy_outlined,
                            label: 'Expires',
                            value: formatShortDate(item.expiryDate!),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.item});

  final WardrobeItem item;

  String get _subtitle => [item.brand, item.category]
      .where((part) => part.trim().isNotEmpty)
      .join(' · ');

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ItemPhoto(item: item),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Color(0xC7000000)],
              stops: [0.45, 1],
            ),
          ),
        ),
        Positioned(
          left: 20,
          right: 20,
          bottom: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.itemName,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 24,
                  height: 1.15,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              if (_subtitle.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  _subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xE6FFFFFF),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
    required this.icon,
    required this.onTap,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final button = Material(
      color: Colors.white.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      elevation: 2,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 22, color: AppColors.textPrimary),
        ),
      ),
    );

    if (tooltip == null) return button;
    return Tooltip(message: tooltip!, child: button);
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF101828).withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              letterSpacing: 1.4,
              fontWeight: FontWeight.w700,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 6),
          ...children,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textMuted),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
