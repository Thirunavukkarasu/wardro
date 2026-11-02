import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_pill.dart';
import '../../shared/widgets/status_views.dart';
import '../items/add_item_screen.dart';
import '../items/models/wardrobe_item.dart';
import '../items/widgets/item_card.dart';
import 'models/wardrobe.dart';

/// Everything inside one wardrobe, reached by tapping a card on the home tab.
class WardrobeItemsScreen extends StatefulWidget {
  const WardrobeItemsScreen({super.key, required this.wardrobe});

  final Wardrobe wardrobe;

  @override
  State<WardrobeItemsScreen> createState() => _WardrobeItemsScreenState();
}

class _WardrobeItemsScreenState extends State<WardrobeItemsScreen> {
  late final ApiClient _api;
  bool _started = false;
  bool _loading = true;
  String? _error;
  List<WardrobeItem> _items = const [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _api = ApiScope.of(context);
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final raw = await _api.get('/wardrobeItems/${widget.wardrobe.id}');
      final items = (raw as List<dynamic>? ?? const [])
          .map((item) => WardrobeItem.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  Future<void> _addItem() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AddItemScreen(initialWardrobeId: widget.wardrobe.id),
      ),
    );
    if (mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.wardrobe.name)),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
          children: [
            _WardrobeHeader(
              wardrobe: widget.wardrobe,
              itemCount: _loading ? widget.wardrobe.itemCount : _items.length,
              onAdd: _addItem,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Text(
                  'Items',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                if (!_loading && _error == null)
                  AppPill(
                    label:
                        '${_items.length} ${_items.length == 1 ? 'item' : 'items'}',
                    icon: Icons.dry_cleaning,
                    color: AppColors.primary,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (_loading)
              const LoadingView(message: 'Loading items…')
            else if (_error != null)
              ErrorView(
                title: "Couldn't load this wardrobe",
                message: _error!,
                onRetry: _load,
              )
            else if (_items.isEmpty)
              EmptyView(
                icon: Icons.dry_cleaning_outlined,
                title: 'Nothing here yet',
                message:
                    'Add your first item to this wardrobe and it will show up here.',
                actionLabel: 'Add Item',
                onAction: _addItem,
              )
            else
              for (final item in _items) ItemCard(item: item),
          ],
        ),
      ),
    );
  }
}

class _WardrobeHeader extends StatelessWidget {
  const _WardrobeHeader({
    required this.wardrobe,
    required this.itemCount,
    required this.onAdd,
  });

  final Wardrobe wardrobe;
  final int itemCount;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFEAF4FF), Color(0xFFF7FBFF)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFD6E9FF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.checkroom,
                  color: AppColors.primary,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      wardrobe.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (wardrobe.description.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        wardrobe.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 10),
              AppPill(
                label:
                    '$itemCount ${itemCount == 1 ? 'item' : 'items'}',
                filled: true,
              ),
            ],
          ),
          const SizedBox(height: 18),
          AppButton(
            title: 'Add item',
            iconLeft: const Icon(Icons.add, color: Colors.white, size: 20),
            onPressed: onAdd,
          ),
        ],
      ),
    );
  }
}
