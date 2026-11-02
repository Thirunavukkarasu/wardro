import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/utils/layout.dart';
import '../../shared/widgets/app_pill.dart';
import '../../shared/widgets/circle_action.dart';
import '../../shared/widgets/confirm_dialog.dart';
import '../../shared/widgets/status_views.dart';
import '../items/add_item_screen.dart';
import '../items/item_detail_screen.dart';
import '../items/models/wardrobe_item.dart';
import '../items/widgets/item_photo_tile.dart';
import 'models/wardrobe.dart';

/// Everything inside one wardrobe, shown as a photo grid.
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

  Future<void> _openItem(WardrobeItem item) async {
    final deleted = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(builder: (_) => ItemDetailScreen(item: item)),
    );
    if (deleted == true && mounted) _load();
  }

  Future<void> _deleteWardrobe() async {
    final count = _items.length;
    final confirmed = await showDeleteConfirmation(
      context,
      title: 'Delete wardrobe?',
      message: count == 0
          ? '"${widget.wardrobe.name}" will be removed permanently.'
          : '"${widget.wardrobe.name}" and its $count ${count == 1 ? 'item' : 'items'} will be removed permanently.',
    );
    if (!confirmed || !mounted) return;

    try {
      await _api.delete('/wardrobes/${widget.wardrobe.id}');
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Widget _sliverBox(Widget child) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverToBoxAdapter(child: child),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            tooltip: 'Delete wardrobe',
            icon: const Icon(Icons.delete_outline),
            onPressed: _deleteWardrobe,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            _sliverBox(
              _WardrobeHeader(
                wardrobe: widget.wardrobe,
                itemCount: _loading ? widget.wardrobe.itemCount : _items.length,
                onAdd: _addItem,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),
            if (_loading)
              _sliverBox(const LoadingView(message: 'Loading items…'))
            else if (_error != null)
              _sliverBox(
                ErrorView(
                  title: "Couldn't load this wardrobe",
                  message: _error!,
                  onRetry: _load,
                ),
              )
            else if (_items.isEmpty)
              _sliverBox(
                EmptyView(
                  icon: Icons.photo_camera_back_outlined,
                  title: 'Nothing here yet',
                  message:
                      'Add your first item to this wardrobe and it will show up here.',
                  actionLabel: 'Add Item',
                  onAction: _addItem,
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
                sliver: SliverLayoutBuilder(
                  builder: (context, constraints) {
                    final columns = photoColumnsFor(
                      constraints.crossAxisExtent,
                    );
                    return SliverGrid(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.72,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final item = _items[index];
                          return ItemPhotoTile(
                            item: item,
                            onTap: () => _openItem(item),
                          );
                        },
                        childCount: _items.length,
                      ),
                    );
                  },
                ),
              ),
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
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                wardrobe.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 26,
                  height: 1.15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (wardrobe.description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  wardrobe.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 10),
              AppPill(
                label: '$itemCount ${itemCount == 1 ? 'item' : 'items'}',
                icon: Icons.dry_cleaning,
                color: AppColors.primary,
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        CircleAction(
          icon: Icons.add_a_photo_outlined,
          tooltip: 'Add item',
          onTap: onAdd,
        ),
      ],
    );
  }
}
