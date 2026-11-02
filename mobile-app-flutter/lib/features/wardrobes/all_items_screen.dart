import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/utils/layout.dart';
import '../../shared/widgets/app_pill.dart';
import '../../shared/widgets/circle_action.dart';
import '../../shared/widgets/status_views.dart';
import '../items/add_item_screen.dart';
import '../items/item_detail_screen.dart';
import '../items/models/wardrobe_item.dart';
import '../items/widgets/item_photo_tile.dart';
import '../wardrobe/models/wardrobe.dart';
import '../wardrobe/wardrobe_items_screen.dart';

/// "All Items" tab: every garment the user owns, as photo grids per wardrobe.
class AllItemsScreen extends StatefulWidget {
  const AllItemsScreen({super.key});

  @override
  State<AllItemsScreen> createState() => _AllItemsScreenState();
}

class _AllItemsScreenState extends State<AllItemsScreen> {
  late final ApiClient _api;
  bool _started = false;
  bool _loading = true;
  String? _error;
  List<Wardrobe> _wardrobes = const [];
  List<WardrobeItem> _items = const [];
  Map<int, List<WardrobeItem>> _byWardrobe = const {};

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
      final results = await Future.wait<dynamic>([
        _api.get('/wardrobes/${AppConfig.demoUserId}/summary'),
        _api.get('/wardrobeItems/user/${AppConfig.demoUserId}'),
      ]);

      final wardrobes = (results[0] as List<dynamic>? ?? const [])
          .map((item) => Wardrobe.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
      final items = (results[1] as List<dynamic>? ?? const [])
          .map((item) => WardrobeItem.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);

      final grouped = <int, List<WardrobeItem>>{};
      for (final item in items) {
        grouped.putIfAbsent(item.wardrobeId, () => []).add(item);
      }

      if (!mounted) return;
      setState(() {
        _wardrobes = wardrobes;
        _items = items;
        _byWardrobe = grouped;
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
      MaterialPageRoute<void>(builder: (_) => const AddItemScreen()),
    );
    if (mounted) _load();
  }

  Future<void> _openWardrobe(Wardrobe wardrobe) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => WardrobeItemsScreen(wardrobe: wardrobe),
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

  @override
  Widget build(BuildContext context) {
    final populated = _wardrobes
        .where((wardrobe) => (_byWardrobe[wardrobe.id] ?? const []).isNotEmpty)
        .toList(growable: false);

    final slivers = <Widget>[
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        sliver: SliverToBoxAdapter(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'EVERYTHING YOU OWN',
                      style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.4,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'All Items',
                      style: Theme.of(context).textTheme.headlineLarge,
                    ),
                    if (!_loading && _error == null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '${_items.length} ${_items.length == 1 ? 'item' : 'items'} across ${populated.length} ${populated.length == 1 ? 'wardrobe' : 'wardrobes'}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 12),
              CircleAction(
                icon: Icons.add_a_photo_outlined,
                tooltip: 'Add item',
                onTap: _addItem,
              ),
            ],
          ),
        ),
      ),
    ];

    if (_loading) {
      slivers.add(
        const SliverPadding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: LoadingView(message: 'Loading your items…'),
          ),
        ),
      );
    } else if (_error != null) {
      slivers.add(
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: ErrorView(
              title: "Couldn't load your items",
              message: _error!,
              detail: 'API: ${AppConfig.apiBaseUrl}',
              onRetry: _load,
            ),
          ),
        ),
      );
    } else if (_items.isEmpty) {
      slivers.add(
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: EmptyView(
              icon: Icons.photo_camera_back_outlined,
              title: 'No items yet',
              message:
                  'Snap a photo of a garment and it will show up here, grouped by wardrobe.',
              actionLabel: 'Add Item',
              onAction: _addItem,
            ),
          ),
        ),
      );
    } else {
      for (final wardrobe in populated) {
        final wardrobeItems = _byWardrobe[wardrobe.id]!;

        slivers.add(
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
            sliver: SliverToBoxAdapter(
              child: _WardrobeSectionHeader(
                wardrobe: wardrobe,
                itemCount: wardrobeItems.length,
                onTap: () => _openWardrobe(wardrobe),
              ),
            ),
          ),
        );

        slivers.add(
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            sliver: SliverLayoutBuilder(
              builder: (context, constraints) {
                final columns = photoColumnsFor(constraints.crossAxisExtent);
                return SliverGrid(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: columns,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => ItemPhotoTile(
                      item: wardrobeItems[index],
                      onTap: () => _openItem(wardrobeItems[index]),
                    ),
                    childCount: wardrobeItems.length,
                  ),
                );
              },
            ),
          ),
        );
      }

      slivers.add(const SliverToBoxAdapter(child: SizedBox(height: 40)));
    }

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: slivers,
        ),
      ),
    );
  }
}

class _WardrobeSectionHeader extends StatelessWidget {
  const _WardrobeSectionHeader({
    required this.wardrobe,
    required this.itemCount,
    required this.onTap,
  });

  final Wardrobe wardrobe;
  final int itemCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            const Icon(Icons.checkroom, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                wardrobe.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            AppPill(label: '$itemCount', color: AppColors.textSecondary),
            const Icon(
              Icons.chevron_right,
              size: 20,
              color: AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}
